import { supabase } from './supabase/index.ts';

export interface CreateCreditCheckSessionPayload {
    organization_id: string;
    subscriber_id?: number;
    integration_subscriber_id?: string;
    integration_type?: 'stora';
    integration_meta?: {
        order_id?: string;
    };
    email?: string;
}

export interface CreditCheckSession {
    id: string;
    created_at: string;
    organization_id: string;
    subscriber_id: number;
    config: {
        integration_type?: 'stora';
        integration_subscriber_id?: string;
        integration_meta?: {
            order_id?: string;
            order?: any;
            contact?: {
                id: string;
                email?: string;
                phone?: string;
                first_name?: string;
                last_name?: string;
                [key: string]: any;
            };
        };
    } | null;
    status: string;
}

export interface StoraContactDetails {
    id: string;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
}

/**
 * Creates a credit check session
 */
export const createCreditCheckSession = async (
    payload: CreateCreditCheckSessionPayload
): Promise<CreditCheckSession> => {
    const { data, error } = await supabase.functions.invoke(
        'create-credit-check-session',
        {
            body: payload,
        }
    );

    if (error) {
        console.error('Error creating credit check session:', error);
        throw error;
    }

    if (data.error) {
        throw new Error(data.error);
    }

    return data as CreditCheckSession;
};

/**
 * Gets Stora contact details from a credit check session config
 * Returns null if the session doesn't have Stora integration data
 */
export const getStoraContactFromSession = (
    session: CreditCheckSession
): StoraContactDetails | null => {
    if (
        !session.config ||
        session.config.integration_type !== 'stora' ||
        !session.config.integration_meta?.contact
    ) {
        return null;
    }

    return session.config.integration_meta.contact;
};

/**
 * Gets Stora order details from a credit check session config
 * Returns null if the session doesn't have Stora integration data
 */
export const getStoraOrderFromSession = (
    session: CreditCheckSession
): any | null => {
    if (
        !session.config ||
        session.config.integration_type !== 'stora' ||
        !session.config.integration_meta?.order
    ) {
        return null;
    }

    return session.config.integration_meta.order;
};

/**
 * Checks if a credit check session has Stora integration
 */
export const hasStoraIntegration = (
    session: CreditCheckSession
): boolean => {
    return (
        session.config?.integration_type === 'stora' &&
        !!session.config.integration_meta
    );
};

/**
 * Gets URL parameters for credit check session creation
 * Supports both regular and Stora integration flows
 */
export const getSessionParamsFromURL = (): Partial<CreateCreditCheckSessionPayload> | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const organizationId = urlParams.get('organization_id');
    const subscriberId = urlParams.get('subscriber_id');
    const integrationSubscriberId = urlParams.get('integration_subscriber_id');
    const integrationType = urlParams.get('integration_type');
    const orderId = urlParams.get('order_id');

    if (!organizationId) {
        return null;
    }

    const params: Partial<CreateCreditCheckSessionPayload> = {
        organization_id: organizationId,
    };

    // Handle regular subscriber_id
    if (subscriberId) {
        params.subscriber_id = parseInt(subscriberId, 10);
    }

    // Handle Stora integration
    if (integrationSubscriberId && integrationType === 'stora') {
        params.integration_subscriber_id = integrationSubscriberId;
        params.integration_type = 'stora';
        if (orderId) {
            params.integration_meta = {
                order_id: orderId,
            };
        }
    }

    return params;
};

/**
 * Check existing credit check status for a subscriber
 */
export const checkCreditCheckStatus = async (
    organizationId: string,
    subscriberId: number
): Promise<CreditCheckSession | null> => {
    try {
        const { data, error } = await supabase
            .from('organizations_credit_check_sessions')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('subscriber_id', subscriberId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // If no rows found, that's okay
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error checking credit check status:', error);
            throw error;
        }

        return data as CreditCheckSession;
    } catch (error) {
        console.error('Error checking credit check status:', error);
        return null;
    }
};
