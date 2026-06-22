import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { stripeService } from '../services/stripeService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

/**
 * GET /api/v1/subscriptions/plans
 * Get all available subscription plans (public)
 */
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
    const plans = await subscriptionService.getAvailablePlans();

    res.json({
        success: true,
        data: { plans },
    });
}));

/**
 * GET /api/v1/subscriptions/current
 * Get current agency subscription
 */
router.get('/current', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user!.agencyId;

    if (!agencyId) {
        return res.json({
            success: true,
            data: {
                subscription: {
                    id: null, agencyId: null, planId: 1, planName: 'Admin',
                    status: 'active', startDate: new Date().toISOString(), endDate: null,
                    isActive: true, isTrial: false, trialEndsAt: null,
                    invoiceLimit: null, customerLimit: null, itemLimit: null,
                }
            },
        });
    }

    const subscription = await subscriptionService.getAgencySubscription(agencyId);

    if (!subscription) {
        // Return a default free/trial subscription instead of 404
        // This prevents console errors on fresh accounts with no subscription record
        return res.json({
            success: true,
            data: {
                subscription: {
                    id: null,
                    agencyId,
                    planId: 1,
                    planName: 'Free Trial',
                    status: 'trial',
                    startDate: new Date().toISOString(),
                    endDate: null,
                    isActive: true,
                    isTrial: true,
                    trialEndsAt: null,
                    invoiceLimit: 10,
                    customerLimit: 50,
                    itemLimit: 100,
                }
            },
        });
    }

    res.json({
        success: true,
        data: { subscription },
    });
}));

/**
 * GET /api/v1/subscriptions/usage
 * Get usage statistics
 */
router.get('/usage', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user!.agencyId;

    if (!agencyId) {
        throw createError('Agency not found', 404);
    }

    const usage = await subscriptionService.getUsageStats(agencyId);
    const trialStatus = await subscriptionService.checkTrialExpiration(agencyId);

    res.json({
        success: true,
        data: {
            usage,
            trial: trialStatus,
        },
    });
}));

/**
 * POST /api/v1/subscriptions/create-payment-intent
 * Create payment intent for plan upgrade
 */
router.post('/create-payment-intent', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { planId } = req.body;
    const agencyId = req.user!.agencyId;

    if (!agencyId) {
        throw createError('Agency not found', 404);
    }

    if (!planId) {
        throw createError('Plan ID is required', 400);
    }
    const planIdNum = parseInt(String(planId), 10);
    if (isNaN(planIdNum) || planIdNum <= 0) {
        throw createError('Invalid Plan ID — must be a positive integer', 400);
    }

    // Get plan details
    const plan = await subscriptionService.getPlanById(planIdNum);

    // Get agency details for Stripe customer
    const agencyResult = await query('SELECT * FROM agencies WHERE id = ?', [agencyId]);
    const agency = agencyResult.rows[0] as any;

    // Create or get Stripe customer
    let stripeCustomerId = agency.stripe_customer_id;

    if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer({
            email: agency.email,
            name: agency.company_name,
            metadata: {
                agency_id: agencyId.toString(),
            },
        });

        stripeCustomerId = customer.id;

        // Save Stripe customer ID
        await query('UPDATE agencies SET stripe_customer_id = ? WHERE id = ?', [stripeCustomerId, agencyId]);
    }

    // Create payment intent (amount in smallest currency unit - paise for INR)
    const amount = Math.round(plan.price_monthly * 100);

    const paymentIntent = await stripeService.createPaymentIntent({
        amount,
        currency: process.env.STRIPE_CURRENCY || 'inr',
        customerId: stripeCustomerId,
        metadata: {
            agency_id: agencyId.toString(),
            plan_id: planId.toString(),
            plan_name: plan.name,
        },
    });

    res.json({
        success: true,
        data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: plan.price_monthly,
            currency: plan.price_monthly >= 1 ? 'INR' : 'inr',
        },
    });
}));

/**
 * POST /api/v1/subscriptions/confirm-upgrade
 * Confirm subscription upgrade after successful payment
 */
router.post('/confirm-upgrade', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { planId, paymentIntentId } = req.body;
    const agencyId = req.user!.agencyId;

    if (!agencyId) {
        throw createError('Agency not found', 404);
    }

    if (!planId || !paymentIntentId) {
        throw createError('Plan ID and Payment Intent ID are required', 400);
    }
    if (isNaN(parseInt(String(planId), 10))) {
        throw createError('Invalid Plan ID', 400);
    }
    if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
        throw createError('Invalid Payment Intent ID format', 400);
    }

    // Verify payment with Stripe
    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
        throw createError('Payment not completed', 400);
    }

    // Get agency for Stripe customer ID
    const agencyResult = await query('SELECT stripe_customer_id FROM agencies WHERE id = ?', [agencyId]);
    const agency = agencyResult.rows[0] as any;

    // Record payment transaction
    await query(
        `INSERT INTO payment_transactions 
     (agency_id, amount, currency, status, payment_method, stripe_payment_intent_id, stripe_charge_id, metadata)
     VALUES (?, ?, ?, 'succeeded', ?, ?, ?, ?)`,
        [
            agencyId,
            paymentIntent.amount / 100,
            paymentIntent.currency.toUpperCase(),
            paymentIntent.payment_method_types?.[0] || 'card',
            paymentIntent.id,
            paymentIntent.latest_charge || null,
            JSON.stringify({ plan_id: planId }),
        ]
    );

    // Upgrade subscription
    const subscription = await subscriptionService.upgradeSubscription(
        agencyId,
        parseInt(planId),
        agency.stripe_customer_id
    );

    res.json({
        success: true,
        message: 'Subscription upgraded successfully',
        data: { subscription },
    });
}));

/**
 * POST /api/v1/subscriptions/cancel
 * Cancel subscription
 */
router.post('/cancel', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { immediately } = req.body;
    const agencyId = req.user!.agencyId;

    if (!agencyId) {
        throw createError('Agency not found', 404);
    }

    await subscriptionService.cancelSubscription(agencyId, immediately === true);

    res.json({
        success: true,
        message: immediately ? 'Subscription cancelled immediately' : 'Subscription will be cancelled at period end',
    });
}));

/**
 * GET /api/v1/subscriptions/payment-history
 * Get payment transaction history
 */
router.get('/payment-history', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user!.agencyId;

    if (!agencyId) {
        throw createError('Agency not found', 404);
    }

    const result = await query(
        `SELECT * FROM payment_transactions 
     WHERE agency_id = ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
        [agencyId]
    );

    res.json({
        success: true,
        data: {
            transactions: result.rows || [],
        },
    });
}));

/**
 * POST /api/v1/subscriptions/webhook
 * Stripe webhook endpoint (no authentication required)
 */
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
        throw createError('Missing Stripe signature', 400);
    }

    // Construct and verify webhook event
    const event = stripeService.constructWebhookEvent(
        req.body,
        signature
    );

    // Handle the event
    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });
}));

export default router;
