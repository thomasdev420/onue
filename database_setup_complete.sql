-- Complete Database Setup for Onue
-- This file includes all necessary tables for the application

-- ========================================
-- USER WORK TABLE (Persistence Service)
-- ========================================

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

-- ========================================
-- AI MEMORY TABLE (AI Memory System)
-- ========================================

CREATE TABLE IF NOT EXISTS ai_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    context TEXT,
    original_input TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    -- Indexes for efficient querying
    CONSTRAINT ai_memory_user_category_idx UNIQUE (user_id, category, value),
    CONSTRAINT ai_memory_priority_check CHECK (priority >= 1 AND priority <= 5)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_category ON ai_memory(category);
CREATE INDEX IF NOT EXISTS idx_ai_memory_priority ON ai_memory(priority);
CREATE INDEX IF NOT EXISTS idx_ai_memory_last_accessed ON ai_memory(last_accessed);
CREATE INDEX IF NOT EXISTS idx_ai_memory_access_count ON ai_memory(access_count);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_priority_access ON ai_memory(user_id, priority DESC, access_count DESC);

-- Add comments for documentation
COMMENT ON TABLE ai_memory IS 'Stores AI memory and learning patterns for each user';
COMMENT ON COLUMN ai_memory.user_id IS 'User email address';
COMMENT ON COLUMN ai_memory.category IS 'Memory category (creative_preferences, goals_and_objectives, etc.)';
COMMENT ON COLUMN ai_memory.priority IS 'Priority level 1-5 (5 being highest)';
COMMENT ON COLUMN ai_memory.type IS 'Type of memory (creative_benchmark, style_preference, goal, etc.)';
COMMENT ON COLUMN ai_memory.value IS 'The actual preference or insight value';
COMMENT ON COLUMN ai_memory.context IS 'Context in which this memory was created';
COMMENT ON COLUMN ai_memory.original_input IS 'Original user input that generated this memory';
COMMENT ON COLUMN ai_memory.access_count IS 'Number of times this memory has been accessed';
COMMENT ON COLUMN ai_memory.last_accessed IS 'Timestamp of last access';

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Create a function to automatically update last_accessed timestamp
CREATE OR REPLACE FUNCTION update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = NOW();
    NEW.access_count = OLD.access_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update access tracking
CREATE TRIGGER trigger_update_last_accessed
    BEFORE UPDATE ON ai_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_last_accessed();

-- ========================================
-- VIEWS
-- ========================================

-- Create a view for memory analytics
CREATE OR REPLACE VIEW ai_memory_analytics AS
SELECT 
    user_id,
    category,
    COUNT(*) as total_memories,
    AVG(priority) as avg_priority,
    SUM(access_count) as total_accesses,
    MAX(last_accessed) as last_activity,
    COUNT(CASE WHEN priority >= 4 THEN 1 END) as high_priority_count
FROM ai_memory
GROUP BY user_id, category;

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant necessary permissions for user_work table
GRANT ALL ON user_work TO authenticated;
GRANT ALL ON user_work TO anon;

-- Grant necessary permissions for ai_memory table
GRANT ALL ON ai_memory TO authenticated;
GRANT ALL ON ai_memory TO anon;
GRANT SELECT ON ai_memory_analytics TO authenticated;
GRANT SELECT ON ai_memory_analytics TO anon;

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert sample AI memory data for development
INSERT INTO ai_memory (user_id, category, priority, type, value, context, original_input) VALUES
('dev@local.com', 'creative_preferences', 4, 'creative_benchmark', 'Apple-style marketing', 'User prefers Apple-style marketing approach', 'I want content like Apple'),
('dev@local.com', 'style_preferences', 3, 'tone_preference', 'Professional and clean', 'User prefers professional tone', 'Keep it professional'),
('dev@local.com', 'goals_and_objectives', 5, 'business_goal', 'Increase brand awareness', 'Primary business objective', 'I want to increase brand awareness')
ON CONFLICT (user_id, category, value) DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify tables were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('user_work', 'ai_memory')
ORDER BY table_name;

-- Verify indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('user_work', 'ai_memory')
ORDER BY tablename, indexname; 