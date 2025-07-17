-- Credit System Database Schema
-- This system tracks user credits, usage, and billing for AI-powered features

-- User credits table - tracks current credit balance and subscription info
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    credits_balance INTEGER NOT NULL DEFAULT 0,
    credits_used_total INTEGER NOT NULL DEFAULT 0,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    subscription_status TEXT NOT NULL DEFAULT 'active',
    subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credits_balance_non_negative CHECK (credits_balance >= 0),
    CONSTRAINT credits_used_non_negative CHECK (credits_used_total >= 0),
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'starter', 'scale', 'growth')),
    CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'expired'))
);

-- Credit usage tracking table - logs every credit-consuming action
CREATE TABLE IF NOT EXISTS credit_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    credits_consumed INTEGER NOT NULL,
    action_details JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credits_consumed_positive CHECK (credits_consumed > 0),
    CONSTRAINT valid_action_type CHECK (action_type IN (
        'slide_generation',
        'image_analysis', 
        'ai_chat',
        'content_creation',
        'visual_analysis',
        'memory_processing',
        'website_scraping',
        'brand_analysis'
    ))
);

-- Credit transactions table - tracks credit purchases, refunds, bonuses
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    credits_amount INTEGER NOT NULL,
    payment_amount DECIMAL(10,2),
    payment_currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_reference TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
        'purchase',
        'subscription_renewal',
        'bonus_credits',
        'refund',
        'admin_adjustment',
        'promotional_credits'
    )),
    CONSTRAINT valid_payment_status CHECK (payment_status IN (
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled'
    ))
);

-- Credit limits and pricing configuration table
CREATE TABLE IF NOT EXISTS credit_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_tier TEXT NOT NULL UNIQUE,
    monthly_credits INTEGER NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    credit_cost_per_action JSONB NOT NULL,
    features_enabled JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT monthly_credits_positive CHECK (monthly_credits > 0),
    CONSTRAINT monthly_price_non_negative CHECK (monthly_price >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription_tier ON user_credits(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription_status ON user_credits(subscription_status);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_action_type ON credit_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_action_date ON credit_usage(user_id, action_type, created_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_credit_pricing_updated_at
    BEFORE UPDATE ON credit_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing tiers
INSERT INTO credit_pricing (subscription_tier, monthly_credits, monthly_price, credit_cost_per_action, features_enabled) VALUES
('free', 50, 0.00, 
 '{"slide_generation": 5, "image_analysis": 2, "ai_chat": 1, "content_creation": 3, "visual_analysis": 3, "memory_processing": 1, "website_scraping": 2, "brand_analysis": 2}',
 '{"basic_slides": true, "ai_chat": true, "basic_analytics": true}'
),
('starter', 200, 29.00,
 '{"slide_generation": 3, "image_analysis": 1, "ai_chat": 1, "content_creation": 2, "visual_analysis": 2, "memory_processing": 1, "website_scraping": 1, "brand_analysis": 1}',
 '{"advanced_slides": true, "ai_chat": true, "image_analysis": true, "basic_analytics": true, "priority_support": true}'
),
('scale', 500, 59.00,
 '{"slide_generation": 2, "image_analysis": 1, "ai_chat": 1, "content_creation": 1, "visual_analysis": 1, "memory_processing": 1, "website_scraping": 1, "brand_analysis": 1}',
 '{"advanced_slides": true, "ai_chat": true, "image_analysis": true, "visual_analysis": true, "memory_system": true, "advanced_analytics": true, "priority_support": true, "bulk_generation": true}'
),
('growth', 1000, 99.00,
 '{"slide_generation": 1, "image_analysis": 1, "ai_chat": 1, "content_creation": 1, "visual_analysis": 1, "memory_processing": 1, "website_scraping": 1, "brand_analysis": 1}',
 '{"advanced_slides": true, "ai_chat": true, "image_analysis": true, "visual_analysis": true, "memory_system": true, "advanced_analytics": true, "priority_support": true, "bulk_generation": true, "team_collaboration": true, "custom_branding": true, "api_access": true}'
)
ON CONFLICT (subscription_tier) DO UPDATE SET
    monthly_credits = EXCLUDED.monthly_credits,
    monthly_price = EXCLUDED.monthly_price,
    credit_cost_per_action = EXCLUDED.credit_cost_per_action,
    features_enabled = EXCLUDED.features_enabled,
    updated_at = NOW();

-- Create a function to get user credit summary
CREATE OR REPLACE FUNCTION get_user_credit_summary(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'credits_balance', COALESCE(uc.credits_balance, 0),
        'credits_used_total', COALESCE(uc.credits_used_total, 0),
        'subscription_tier', COALESCE(uc.subscription_tier, 'free'),
        'subscription_status', COALESCE(uc.subscription_status, 'active'),
        'subscription_end_date', uc.subscription_end_date,
        'auto_renew', COALESCE(uc.auto_renew, true),
        'usage_this_month', COALESCE(monthly_usage.credits_used, 0),
        'usage_by_action', COALESCE(action_breakdown.breakdown, '{}'::json)
    ) INTO result
    FROM user_credits uc
    LEFT JOIN (
        SELECT 
            user_id,
            SUM(credits_consumed) as credits_used
        FROM credit_usage 
        WHERE user_id = user_email 
        AND created_at >= date_trunc('month', NOW())
        GROUP BY user_id
    ) monthly_usage ON uc.user_id = monthly_usage.user_id
    LEFT JOIN (
        SELECT 
            user_id,
            json_object_agg(action_type, credits_consumed) as breakdown
        FROM (
            SELECT 
                user_id,
                action_type,
                SUM(credits_consumed) as credits_consumed
            FROM credit_usage 
            WHERE user_id = user_email 
            AND created_at >= date_trunc('month', NOW())
            GROUP BY user_id, action_type
        ) action_summary
        GROUP BY user_id
    ) action_breakdown ON uc.user_id = action_breakdown.user_id
    WHERE uc.user_id = user_email;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if user has enough credits for an action
CREATE OR REPLACE FUNCTION check_credits_for_action(user_email TEXT, action_type TEXT)
RETURNS JSON AS $$
DECLARE
    user_credits_record RECORD;
    pricing_record RECORD;
    cost INTEGER;
    has_enough BOOLEAN;
    result JSON;
BEGIN
    -- Get user's current credits
    SELECT * INTO user_credits_record 
    FROM user_credits 
    WHERE user_id = user_email;
    
    -- If no record exists, create one with free tier defaults
    IF NOT FOUND THEN
        INSERT INTO user_credits (user_id, subscription_tier, credits_balance)
        VALUES (user_email, 'free', 50)
        RETURNING * INTO user_credits_record;
    END IF;
    
    -- Get pricing for user's tier
    SELECT * INTO pricing_record 
    FROM credit_pricing 
    WHERE subscription_tier = user_credits_record.subscription_tier;
    
    -- Get cost for this action
    cost := (pricing_record.credit_cost_per_action->>action_type)::INTEGER;
    
    -- Check if user has enough credits
    has_enough := user_credits_record.credits_balance >= cost;
    
    -- Build result
    result := json_build_object(
        'has_enough_credits', has_enough,
        'current_balance', user_credits_record.credits_balance,
        'action_cost', cost,
        'subscription_tier', user_credits_record.subscription_tier,
        'action_type', action_type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to consume credits for an action
CREATE OR REPLACE FUNCTION consume_credits_for_action(user_email TEXT, action_type TEXT, success BOOLEAN DEFAULT true, error_message TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    credit_check JSON;
    pricing_record RECORD;
    cost INTEGER;
    new_balance INTEGER;
    result JSON;
BEGIN
    -- Check if user has enough credits
    credit_check := check_credits_for_action(user_email, action_type);
    
    IF NOT (credit_check->>'has_enough_credits')::BOOLEAN THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_balance', (credit_check->>'current_balance')::INTEGER,
            'required_credits', (credit_check->>'action_cost')::INTEGER
        );
    END IF;
    
    -- Get pricing for user's tier
    SELECT * INTO pricing_record 
    FROM credit_pricing 
    WHERE subscription_tier = (credit_check->>'subscription_tier');
    
    -- Get cost for this action
    cost := (pricing_record.credit_cost_per_action->>action_type)::INTEGER;
    
    -- Update user credits
    UPDATE user_credits 
    SET 
        credits_balance = credits_balance - cost,
        credits_used_total = credits_used_total + cost,
        updated_at = NOW()
    WHERE user_id = user_email
    RETURNING credits_balance INTO new_balance;
    
    -- Log the usage
    INSERT INTO credit_usage (user_id, action_type, credits_consumed, success, error_message)
    VALUES (user_email, action_type, cost, success, error_message);
    
    -- Build result
    result := json_build_object(
        'success', true,
        'credits_consumed', cost,
        'new_balance', new_balance,
        'action_type', action_type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON user_credits TO authenticated;
GRANT ALL ON credit_usage TO authenticated;
GRANT ALL ON credit_transactions TO authenticated;
GRANT ALL ON credit_pricing TO authenticated;
GRANT SELECT ON user_credits TO anon;
GRANT SELECT ON credit_pricing TO anon;
GRANT EXECUTE ON FUNCTION get_user_credit_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_credits_for_action(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credits_for_action(TEXT, TEXT, BOOLEAN, TEXT) TO authenticated; 