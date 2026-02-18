-- Create tables for Freemium Logic

-- 1. user_tiers: Tracks subscription status
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

CREATE TABLE IF NOT EXISTS user_tiers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier DEFAULT 'free' NOT NULL,
  subscription_status subscription_status DEFAULT 'active' NOT NULL,
  billing_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. usage_logs: Tracks API usage for limits
CREATE TYPE usage_feature AS ENUM ('chat', 'identification', 'diagnosis');

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature usage_feature NOT NULL,
  context JSONB DEFAULT '{}'::jsonb, -- Store extra info (e.g. prompt length, image count)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast limit checking
CREATE INDEX idx_usage_logs_user_feature_created ON usage_logs(user_id, feature, created_at);

-- RLS Policies (Basic)
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tier" ON user_tiers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- System/Admin can insert usage logs (handled via Service Role in API)
