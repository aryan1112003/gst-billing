import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { subscriptionService } from '../services/subscriptionService';
import { createError } from './errorHandler';

/**
 * Middleware to check if agency can create an invoice
 * Use this before invoice creation endpoints
 */
export const checkInvoiceLimit = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const agencyId = req.user?.agencyId;
        const role = req.user?.role;

        // System admin can create unlimited invoices
        if (role === 'admin') {
            return next();
        }

        if (!agencyId) {
            throw createError('Agency not found', 404);
        }

        const check = await subscriptionService.canCreateInvoice(agencyId);

        if (!check.allowed) {
            res.status(403).json({
                success: false,
                error: 'LIMIT_REACHED',
                message: check.reason || 'Invoice limit reached',
                action_required: 'upgrade_plan',
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if agency can add an employee
 * Use this before user creation endpoints
 */
export const checkEmployeeLimit = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const agencyId = req.user?.agencyId;
        const role = req.user?.role;

        // System admin can add unlimited employees
        if (role === 'admin') {
            return next();
        }

        if (!agencyId) {
            throw createError('Agency not found', 404);
        }

        const check = await subscriptionService.canAddEmployee(agencyId);

        if (!check.allowed) {
            res.status(403).json({
                success: false,
                error: 'LIMIT_REACHED',
                message: check.reason || 'Employee limit reached',
                action_required: 'upgrade_plan',
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check trial expiration
 * Use this on protected routes to block access after trial expires
 */
export const checkTrialExpiration = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const agencyId = req.user?.agencyId;
        const role = req.user?.role;

        // System admin trial never expires
        if (role === 'admin') {
            return next();
        }

        if (!agencyId) {
            throw createError('Agency not found', 404);
        }

        const trialStatus = await subscriptionService.checkTrialExpiration(agencyId);

        if (trialStatus.expired) {
            res.status(403).json({
                success: false,
                error: 'TRIAL_EXPIRED',
                message: 'Your trial period has ended. Please upgrade to continue using the service.',
                action_required: 'upgrade_plan',
            });
            return;
        }

        // Add trial info to request for display purposes
        (req as any).trialDaysLeft = trialStatus.daysLeft;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check subscription status
 * Blocks access if subscription is expired or cancelled
 */
export const checkSubscriptionStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const agencyId = req.user?.agencyId;
        const role = req.user?.role;

        // System admin doesn't need a subscription check
        if (role === 'admin') {
            return next();
        }

        if (!agencyId) {
            throw createError('Agency not found', 404);
        }

        const subscription = await subscriptionService.getAgencySubscription(agencyId);

        if (!subscription) {
            res.status(403).json({
                success: false,
                error: 'NO_SUBSCRIPTION',
                message: 'No active subscription found',
                action_required: 'subscribe',
            });
            return;
        }

        if (subscription.status === 'expired' || subscription.status === 'cancelled') {
            res.status(403).json({
                success: false,
                error: 'SUBSCRIPTION_INACTIVE',
                message: 'Your subscription is no longer active. Please renew to continue.',
                action_required: 'renew_subscription',
            });
            return;
        }

        if (subscription.status === 'past_due') {
            res.status(403).json({
                success: false,
                error: 'PAYMENT_REQUIRED',
                message: 'Your payment is past due. Please update your payment method.',
                action_required: 'update_payment',
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};
