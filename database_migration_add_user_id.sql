-- Migration to add user_id column to images table
-- This adds the missing user_id column that the bulk upload API expects

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE images ADD COLUMN user_id TEXT;
        RAISE NOTICE 'Added user_id column to images table';
    ELSE
        RAISE NOTICE 'user_id column already exists in images table';
    END IF;
END $$;

-- Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);

-- Update existing records to have a default user_id
UPDATE images SET user_id = 'legacy-user@example.com' WHERE user_id IS NULL;

-- Make user_id NOT NULL for future records
ALTER TABLE images ALTER COLUMN user_id SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN images.user_id IS 'Email or identifier of the user who uploaded the image'; 