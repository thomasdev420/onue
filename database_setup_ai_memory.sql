-- AI Memory System Database Schema
-- This table stores user preferences, creative directions, and learning patterns

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

-- Create a function to get user memory summary
CREATE OR REPLACE FUNCTION get_user_memory_summary(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_memories', COUNT(*),
        'categories', json_object_agg(category, category_count),
        'most_accessed', most_accessed_memories,
        'high_priority_count', COUNT(CASE WHEN priority >= 4 THEN 1 END)
    ) INTO result
    FROM (
        SELECT 
            category,
            COUNT(*) as category_count,
            json_agg(
                json_build_object(
                    'value', value,
                    'access_count', access_count,
                    'priority', priority
                ) ORDER BY access_count DESC
            ) FILTER (WHERE access_count > 1) as most_accessed_memories
        FROM ai_memory
        WHERE user_id = user_email
        GROUP BY category
    ) subquery;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ai_memory TO your_app_role;
-- GRANT SELECT ON ai_memory_analytics TO your_app_role;
-- GRANT EXECUTE ON FUNCTION get_user_memory_summary(TEXT) TO your_app_role; 