-- User Settings Table for Onue
-- This table stores user preferences and settings

-- ========================================
-- USER SETTINGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  intelligence_mode TEXT NOT NULL DEFAULT 'normal',
  automation_mode TEXT NOT NULL DEFAULT 'balance',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add comments for documentation
COMMENT ON TABLE user_settings IS 'Stores user preferences and settings';
COMMENT ON COLUMN user_settings.user_id IS 'User email address';
COMMENT ON COLUMN user_settings.intelligence_mode IS 'AI intelligence mode: normal or max';
COMMENT ON COLUMN user_settings.automation_mode IS 'Automation mode: automated, balance, or manual';

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant necessary permissions for user_settings table
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON user_settings TO anon;

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert default settings for development user
INSERT INTO user_settings (user_id, intelligence_mode, automation_mode) VALUES
('dev@local.com', 'normal', 'balance')
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify table was created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_settings';

-- Verify indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'user_settings'; 