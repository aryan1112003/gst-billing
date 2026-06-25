import Stripe from 'stripe';
import { logger } from '../config/logger';

class StripeService {
    private stripe: Stripe | null = null;

    constructor() {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            logger.warn('⚠️ Stripe API key not configured — Stripe features disabled');
            return;
        }

        this.stripe = new Stripe(apiKey, {
            apiVersion: '2024-12-18.acacia' as any,
            typescript: true,
        });

        logger.info('✅ Stripe service initialized');
    }

    private getStripe(): Stripe {
        if (!this.stripe) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
        return this.stripe;
    }

    /**
     * Create a Stripe customer for an agency
     */
    async createCustomer(params: {
        email: string;
        name: string;
        metadata?: Record<string, string>;
    }): Promise<Stripe.Customer> {
        try {
            const customer = await this.getStripe().customers.create({
                email: params.email,
                name: params.name,
                metadata: params.metadata || {},
            });

            logger.info(`✅ Stripe customer created: ${customer.id}`);
            return customer;
        } catch (error) {
            logger.error('❌ Failed to create Stripe customer:', error);
            throw error;
        }
    }

    /**
     * Create a payment intent for one-time payment
     */
    async createPaymentIntent(params: {
        amount: number; // in smallest currency unit (paise for INR)
        currency?: string;
        customerId?: string;
        metadata?: Record<string, any>;
    }): Promise<Stripe.PaymentIntent> {
        try {
            const paymentIntent = await this.getStripe().paymentIntents.create({
                amount: params.amount,
                currency: params.currency || process.env.STRIPE_CURRENCY || 'inr',
                customer: params.customerId,
                metadata: params.metadata || {},
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            logger.info(`✅ Payment intent created: ${paymentIntent.id}`);
            return paymentIntent;
        } catch (error) {
            logger.error('❌ Failed to create payment intent:', error);
            throw error;
        }
    }

    /**
     * Create a subscription for recurring billing
     */
    async createSubscription(params: {
        customerId: string;
        priceId: string;
        trialPeriodDays?: number;
        metadata?: Record<string, any>;
    }): Promise<Stripe.Subscription> {
        try {
            const subscription = await this.getStripe().subscriptions.create({
                customer: params.customerId,
                items: [{ price: params.priceId }],
                trial_period_days: params.trialPeriodDays,
                metadata: params.metadata || {},
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
            });

            logger.info(`✅ Subscription created: ${subscription.id}`);
            return subscription;
        } catch (error) {
            logger.error('❌ Failed to create subscription:', error);
            throw error;
        }
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(
        subscriptionId: string,
        cancelAtPeriodEnd: boolean = true
    ): Promise<Stripe.Subscription> {
        try {
            const subscription = await this.getStripe().subscriptions.update(subscriptionId, {
                cancel_at_period_end: cancelAtPeriodEnd,
            });

            logger.info(`✅ Subscription ${cancelAtPeriodEnd ? 'scheduled for cancellation' : 'cancelled'}: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            logger.error('❌ Failed to cancel subscription:', error);
            throw error;
        }
    }

    /**
     * Update subscription (upgrade/downgrade)
     */
    async updateSubscription(params: {
        subscriptionId: string;
        newPriceId: string;
        prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
    }): Promise<Stripe.Subscription> {
        try {
            const subscription = await this.getStripe().subscriptions.retrieve(params.subscriptionId);

            const updatedSubscription = await this.getStripe().subscriptions.update(params.subscriptionId, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: params.newPriceId,
                }],
                proration_behavior: params.prorationBehavior || 'create_prorations',
            });

            logger.info(`✅ Subscription updated: ${params.subscriptionId}`);
            return updatedSubscription;
        } catch (error) {
            logger.error('❌ Failed to update subscription:', error);
            throw error;
        }
    }

    /**
     * Retrieve a payment intent
     */
    async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        try {
            return await this.getStripe().paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
            logger.error('❌ Failed to retrieve payment intent:', error);
            throw error;
        }
    }

    /**
     * Retrieve a subscription
     */
    async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
        try {
            return await this.getStripe().subscriptions.retrieve(subscriptionId);
        } catch (error) {
            logger.error('❌ Failed to retrieve subscription:', error);
            throw error;
        }
    }

    /**
     * Construct webhook event from request
     */
    constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('Stripe webhook secret not configured');
        }

        try {
            return this.getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (error) {
            logger.error('❌ Webhook signature verification failed:', error);
            throw error;
        }
    }

    /**
     * Process webhook event
     */
    async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        logger.info(`📨 Stripe webhook event: ${event.type}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }
    }

    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        logger.info(`✅ Payment succeeded: ${paymentIntent.id}`);
        // Will be implemented with subscription service
    }

    private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        logger.warn(`❌ Payment failed: ${paymentIntent.id}`);
        // Will be implemented with subscription service
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        logger.info(`🔄 Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        // Will be implemented with subscription service
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        logger.info(`🗑️ Subscription deleted: ${subscription.id}`);
        // Will be implemented with subscription service
    }

    private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
        logger.info(`✅ Invoice paid: ${invoice.id}`);
        // Will be implemented with subscription service
    }

    private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        logger.warn(`❌ Invoice payment failed: ${invoice.id}`);
        // Will be implemented with subscription service
    }
}

export const stripeService = new StripeService();
