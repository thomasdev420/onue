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

-- Disable Row Level Security (RLS) for NextAuth compatibility
-- ALTER TABLE user_work ENABLE ROW LEVEL SECURITY;

-- Comment out the RLS policy since we're using NextAuth, not Supabase Auth
-- CREATE POLICY "Users can only access their own work" ON user_work
--   FOR ALL USING (auth.jwt() ->> 'email' = user_id);

-- Grant necessary permissions
GRANT ALL ON user_work TO authenticated;
GRANT ALL ON user_work TO anon; 