-- Create the user_work table for persistence service
CREATE TABLE IF NOT EXISTS user_work (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  page_type TEXT NOT NULL,
  work_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_type)
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_work_user_page ON user_work(user_id, page_type);

-- Enable Row Level Security (RLS)
ALTER TABLE user_work ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since we're handling auth in the app layer)
-- This is less secure but works with NextAuth
CREATE POLICY "Allow all operations for authenticated users" ON user_work
  FOR ALL USING (true);

-- Alternative: If you want to be more restrictive, you can create a function-based policy
-- CREATE OR REPLACE FUNCTION get_user_email()
-- RETURNS TEXT AS $$
-- BEGIN
--   RETURN current_setting('request.jwt.claims', true)::json->>'email';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE POLICY "Users can only access their own work" ON user_work
--   FOR ALL USING (user_id = get_user_email());

-- Grant necessary permissions
GRANT ALL ON user_work TO authenticated;
GRANT ALL ON user_work TO anon; 