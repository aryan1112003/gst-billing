import { query } from '../config/database';
import { logger } from '../config/logger';
import { stripeService } from './stripeService';

interface SubscriptionPlan {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    employee_limit: number | null;
    invoice_limit: number | null;
    price_monthly: number;
    price_yearly?: number;
    stripe_price_id?: string;
    features: string[];
    is_active: boolean;
}

interface Subscription {
    id: number;
    agency_id: number;
    plan_id: number;
    status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    trial_ends_at?: Date;
    current_period_start: Date;
    current_period_end: Date;
    cancel_at_period_end: boolean;
}

interface UsageStats {
    invoice_count: number;
    employee_count: number;
    storage_used_mb: number;
    limits: {
        invoice_limit: number | null;
        employee_limit: number | null;
    };
    percentage_used: {
        invoices: number;
        employees: number;
    };
}

export class SubscriptionService {
    private formatPlan(plan: any): SubscriptionPlan {
        try {
            return {
                ...plan,
                features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []),
                price_monthly: parseFloat(plan.price_monthly?.toString() || '0'),
                price_yearly: plan.price_yearly ? parseFloat(plan.price_yearly.toString()) : undefined,
            };
        } catch (e) {
            logger.error('Error formatting plan:', e);
            return {
                ...plan,
                features: [],
                price_monthly: parseFloat(plan.price_monthly?.toString() || '0'),
            };
        }
    }

    /**
     * Get all active subscription plans
     */
    async getAvailablePlans(): Promise<SubscriptionPlan[]> {
        try {
            const result = await query(
                'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY sort_order ASC'
            );
            return (result.rows as any[]).map(plan => this.formatPlan(plan));
        } catch (error) {
            logger.error('Failed to fetch subscription plans:', error);
            throw new Error('Failed to fetch subscription plans');
        }
    }

    /**
     * Get plan by ID
     */
    async getPlanById(planId: number): Promise<SubscriptionPlan> {
        try {
            const result = await query(
                'SELECT * FROM subscription_plans WHERE id = ?',
                [planId]
            );

            if (!result.rows || result.rows.length === 0) {
                throw new Error('Plan not found');
            }

            return this.formatPlan(result.rows[0]);
        } catch (error) {
            logger.error('Failed to fetch plan:', error);
            throw error;
        }
    }

    /**
     * Get plan by name
     */
    async getPlanByName(name: string): Promise<SubscriptionPlan> {
        try {
            const result = await query(
                'SELECT * FROM subscription_plans WHERE name = ?',
                [name]
            );

            if (!result.rows || result.rows.length === 0) {
                throw new Error('Plan not found');
            }

            return this.formatPlan(result.rows[0]);
        } catch (error) {
            logger.error('Failed to fetch plan:', error);
            throw error;
        }
    }

    /**
     * Get agency subscription
     */
    async getAgencySubscription(agencyId: number): Promise<Subscription | null> {
        try {
            const result = await query(
                `SELECT s.*, p.name as plan_name, p.display_name, p.employee_limit, p.invoice_limit, p.features
         FROM subscriptions s
         JOIN subscription_plans p ON s.plan_id = p.id
         WHERE s.agency_id = ?
         ORDER BY s.created_date DESC
         LIMIT 1`,
                [agencyId]
            );

            return result.rows && result.rows.length > 0 ? this.formatPlan(result.rows[0]) as any : null;
        } catch (error) {
            logger.error('Failed to fetch agency subscription:', error);
            throw error;
        }
    }

    /**
     * Create trial subscription for new agency
     */
    async createTrialSubscription(agencyId: number): Promise<Subscription> {
        try {
            const trialPlan = await this.getPlanByName('free_trial');
            const trialDays = parseInt(process.env.FREE_TRIAL_DAYS || '10');

            const now = new Date();
            const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

            const result = await query(
                `INSERT INTO subscriptions 
         (agency_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
         VALUES (?, ?, 'trial', ?, ?, ?)`,
                [agencyId, trialPlan.id, trialEnds, now, trialEnds]
            );

            // Update agency trial info
            await query(
                `UPDATE agencies 
         SET is_trial = TRUE, trial_started_at = ?
         WHERE id = ?`,
                [now, agencyId]
            );

            logger.info(`âœ… Trial subscription created for agency ${agencyId}`);

            return {
                id: result.insertId,
                agency_id: agencyId,
                plan_id: trialPlan.id,
                status: 'trial',
                trial_ends_at: trialEnds,
                current_period_start: now,
                current_period_end: trialEnds,
                cancel_at_period_end: false,
            };
        } catch (error) {
            logger.error('Failed to create trial subscription:', error);
            throw error;
        }
    }

    /**
     * Upgrade subscription to a paid plan
     */
    async upgradeSubscription(agencyId: number, newPlanId: number, stripeCustomerId?: string): Promise<Subscription> {
        try {
            const newPlan = await this.getPlanById(newPlanId);
            const currentSubscription = await this.getAgencySubscription(agencyId);

            if (!currentSubscription) {
                throw new Error('No active subscription found');
            }

            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

            // Update subscription in database
            await query(
                `UPDATE subscriptions 
         SET plan_id = ?, status = 'active', current_period_start = ?, current_period_end = ?, stripe_customer_id = ?
         WHERE agency_id = ? AND id = ?`,
                [newPlanId, now, periodEnd, stripeCustomerId || null, agencyId, currentSubscription.id]
            );

            // Update agency trial status
            await query(
                `UPDATE agencies 
         SET is_trial = FALSE
         WHERE id = ?`,
                [agencyId]
            );

            logger.info(`âœ… Subscription upgraded for agency ${agencyId} to plan ${newPlan.name}`);

            return {
                ...currentSubscription,
                plan_id: newPlanId,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
            };
        } catch (error) {
            logger.error('Failed to upgrade subscription:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(agencyId: number, immediately: boolean = false): Promise<void> {
        try {
            const subscription = await this.getAgencySubscription(agencyId);

            if (!subscription) {
                throw new Error('No active subscription found');
            }

            if (immediately) {
                await query(
                    `UPDATE subscriptions 
           SET status = 'cancelled', cancelled_at = NOW()
           WHERE agency_id = ?`,
                    [agencyId]
                );
            } else {
                await query(
                    `UPDATE subscriptions 
           SET cancel_at_period_end = TRUE, cancelled_at = NOW()
           WHERE agency_id = ?`,
                    [agencyId]
                );
            }

            // Cancel Stripe subscription if exists
            if (subscription.stripe_subscription_id) {
                await stripeService.cancelSubscription(subscription.stripe_subscription_id, !immediately);
            }

            logger.info(`âœ… Subscription cancelled for agency ${agencyId}`);
        } catch (error) {
            logger.error('Failed to cancel subscription:', error);
            throw error;
        }
    }

    /**
     * Get usage statistics for agency
     */
    async getUsageStats(agencyId: number): Promise<UsageStats> {
        try {
            const subscription = await this.getAgencySubscription(agencyId);

            if (!subscription) {
                throw new Error('No active subscription found');
            }

            // Get agency data
            const agencyResult = await query(
                'SELECT invoice_count, employee_count FROM agencies WHERE id = ?',
                [agencyId]
            );

            const agency = agencyResult.rows[0] as any;
            const plan = subscription as any;

            const invoiceLimit = plan.invoice_limit;
            const employeeLimit = plan.employee_limit;

            return {
                invoice_count: agency.invoice_count || 0,
                employee_count: agency.employee_count || 1,
                storage_used_mb: 0, // TODO: Calculate actual storage
                limits: {
                    invoice_limit: invoiceLimit,
                    employee_limit: employeeLimit,
                },
                percentage_used: {
                    invoices: invoiceLimit ? Math.round((agency.invoice_count / invoiceLimit) * 100) : 0,
                    employees: employeeLimit ? Math.round((agency.employee_count / employeeLimit) * 100) : 0,
                },
            };
        } catch (error) {
            logger.error('Failed to get usage stats:', error);
            throw error;
        }
    }

    /**
     * Check if agency can create an invoice
     */
    async canCreateInvoice(agencyId: number): Promise<{ allowed: boolean; reason?: string }> {
        try {
            const subscription = await this.getAgencySubscription(agencyId);

            if (!subscription) {
                return { allowed: false, reason: 'No active subscription' };
            }

            if (subscription.status === 'expired' || subscription.status === 'cancelled') {
                return { allowed: false, reason: 'Subscription expired or cancelled' };
            }

            const plan = subscription as any;
            const invoiceLimit = plan.invoice_limit;

            if (invoiceLimit === null) {
                return { allowed: true }; // Unlimited
            }

            const agencyResult = await query(
                'SELECT invoice_count FROM agencies WHERE id = ?',
                [agencyId]
            );

            const currentCount = agencyResult.rows[0]?.invoice_count || 0;

            if (currentCount >= invoiceLimit) {
                return {
                    allowed: false,
                    reason: `Invoice limit reached (${currentCount}/${invoiceLimit}). Please upgrade your plan.`
                };
            }

            return { allowed: true };
        } catch (error) {
            logger.error('Failed to check invoice limit:', error);
            throw error;
        }
    }

    /**
     * Check if agency can add an employee
     */
    async canAddEmployee(agencyId: number): Promise<{ allowed: boolean; reason?: string }> {
        try {
            const subscription = await this.getAgencySubscription(agencyId);

            if (!subscription) {
                return { allowed: false, reason: 'No active subscription' };
            }

            if (subscription.status === 'expired' || subscription.status === 'cancelled') {
                return { allowed: false, reason: 'Subscription expired or cancelled' };
            }

            const plan = subscription as any;
            const employeeLimit = plan.employee_limit;

            if (employeeLimit === null) {
                return { allowed: true }; // Unlimited
            }

            const agencyResult = await query(
                'SELECT employee_count FROM agencies WHERE id = ?',
                [agencyId]
            );

            const currentCount = agencyResult.rows[0]?.employee_count || 1;

            if (currentCount >= employeeLimit) {
                return {
                    allowed: false,
                    reason: `Employee limit reached (${currentCount}/${employeeLimit}). Please upgrade your plan.`
                };
            }

            return { allowed: true };
        } catch (error) {
            logger.error('Failed to check employee limit:', error);
            throw error;
        }
    }

    /**
     * Increment invoice count
     */
    async incrementInvoiceCount(agencyId: number): Promise<void> {
        try {
            await query(
                'UPDATE agencies SET invoice_count = invoice_count + 1 WHERE id = ?',
                [agencyId]
            );
        } catch (error) {
            logger.error('Failed to increment invoice count:', error);
            throw error;
        }
    }

    /**
     * Increment employee count
     */
    async incrementEmployeeCount(agencyId: number): Promise<void> {
        try {
            await query(
                'UPDATE agencies SET employee_count = employee_count + 1 WHERE id = ?',
                [agencyId]
            );
        } catch (error) {
            logger.error('Failed to increment employee count:', error);
            throw error;
        }
    }

    /**
     * Decrement employee count
     */
    async decrementEmployeeCount(agencyId: number): Promise<void> {
        try {
            await query(
                'UPDATE agencies SET employee_count = GREATEST(employee_count - 1, 0) WHERE id = ?',
                [agencyId]
            );
        } catch (error) {
            logger.error('Failed to decrement employee count:', error);
            throw error;
        }
    }

    /**
     * Check trial expiration
     */
    async checkTrialExpiration(agencyId: number): Promise<{ expired: boolean; daysLeft?: number }> {
        try {
            const subscription = await this.getAgencySubscription(agencyId);

            if (!subscription || subscription.status !== 'trial') {
                return { expired: false };
            }

            const now = new Date();
            const trialEnds = new Date(subscription.trial_ends_at || now);

            if (now > trialEnds) {
                // Mark as expired
                await query(
                    `UPDATE subscriptions SET status = 'expired' WHERE id = ?`,
                    [subscription.id]
                );
                return { expired: true };
            }

            const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { expired: false, daysLeft };
        } catch (error) {
            logger.error('Failed to check trial expiration:', error);
            throw error;
        }
    }
}

export const subscriptionService = new SubscriptionService();

