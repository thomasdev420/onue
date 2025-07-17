-- Image Feedback Table
-- Stores user feedback on image selections to improve future selections

CREATE TABLE IF NOT EXISTS image_feedback (
    id SERIAL PRIMARY KEY,
    image_id VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('relevant', 'irrelevant', 'perfect')),
    user_email VARCHAR(255) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_image_feedback_image_id (image_id),
    INDEX idx_image_feedback_user_email (user_email),
    INDEX idx_image_feedback_prompt (prompt),
    INDEX idx_image_feedback_feedback_type (feedback_type),
    INDEX idx_image_feedback_created_at (created_at),
    
    -- Composite index for common queries
    INDEX idx_image_feedback_user_prompt (user_email, prompt),
    INDEX idx_image_feedback_image_feedback (image_id, feedback_type)
);

-- Add comments for documentation
COMMENT ON TABLE image_feedback IS 'Stores user feedback on image selections to improve AI image selection accuracy';
COMMENT ON COLUMN image_feedback.image_id IS 'ID of the image that received feedback';
COMMENT ON COLUMN image_feedback.image_url IS 'URL of the image for reference';
COMMENT ON COLUMN image_feedback.prompt IS 'Original user prompt that led to this image selection';
COMMENT ON COLUMN image_feedback.feedback_type IS 'Type of feedback: relevant, irrelevant, or perfect';
COMMENT ON COLUMN image_feedback.user_email IS 'Email of the user providing feedback';
COMMENT ON COLUMN image_feedback.reason IS 'Optional reason for the feedback';
COMMENT ON COLUMN image_feedback.created_at IS 'Timestamp when feedback was provided';

-- Create a view for feedback statistics
CREATE OR REPLACE VIEW image_feedback_stats AS
SELECT 
    image_id,
    image_url,
    COUNT(*) as total_feedback,
    COUNT(CASE WHEN feedback_type = 'perfect' THEN 1 END) as perfect_count,
    COUNT(CASE WHEN feedback_type = 'relevant' THEN 1 END) as relevant_count,
    COUNT(CASE WHEN feedback_type = 'irrelevant' THEN 1 END) as irrelevant_count,
    ROUND(
        (COUNT(CASE WHEN feedback_type IN ('perfect', 'relevant') THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as positive_percentage
FROM image_feedback
GROUP BY image_id, image_url;

-- Create a view for user-specific feedback patterns
CREATE OR REPLACE VIEW user_feedback_patterns AS
SELECT 
    user_email,
    feedback_type,
    COUNT(*) as feedback_count,
    COUNT(DISTINCT image_id) as unique_images,
    AVG(LENGTH(prompt)) as avg_prompt_length
FROM image_feedback
GROUP BY user_email, feedback_type
ORDER BY user_email, feedback_count DESC;

-- Insert sample data for testing (optional)
-- INSERT INTO image_feedback (image_id, image_url, prompt, feedback_type, user_email, reason) VALUES
-- ('sample1', 'https://example.com/image1.jpg', 'Create slides about knights', 'perfect', 'test@example.com', 'Perfect match for knight theme'),
-- ('sample2', 'https://example.com/image2.jpg', 'Create slides about knights', 'irrelevant', 'test@example.com', 'Shows sheep instead of knights'); 