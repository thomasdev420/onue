-- Create user_learning_data table for iteration engine
CREATE TABLE IF NOT EXISTS user_learning_data (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_learning_data_user_id ON user_learning_data(user_id);

-- Create RLS policies
ALTER TABLE user_learning_data ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own learning data
CREATE POLICY "Users can read their own learning data" ON user_learning_data
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own learning data
CREATE POLICY "Users can insert their own learning data" ON user_learning_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own learning data
CREATE POLICY "Users can update their own learning data" ON user_learning_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own learning data
CREATE POLICY "Users can delete their own learning data" ON user_learning_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_learning_data_updated_at 
    BEFORE UPDATE ON user_learning_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 