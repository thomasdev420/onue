# Database Setup Guide

## Overview

This guide will help you set up the complete database for the Onue application, including both the user work persistence system and the AI memory system.

## Current Issues

Based on the logs, you're experiencing these database-related issues:

1. **Missing AI Memory Table**: `relation "public.ai_memory" does not exist`
2. **Slide Count Mismatch**: Expected 3 slides but got 12 (this has been fixed in the API)

## Quick Fix

### Option 1: Run the Complete Setup Script

1. **Download the complete setup script**:
   ```bash
   # The file database_setup_complete.sql has been created with all necessary tables
   ```

2. **Run the script in your Supabase database**:
   ```bash
   # Using psql (if you have direct database access)
   psql -h your-supabase-host -U your-username -d your-database -f database_setup_complete.sql
   
   # Or using Supabase CLI
   supabase db reset
   # Then copy the contents of database_setup_complete.sql into your migrations
   ```

3. **Or run via Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database_setup_complete.sql`
   - Execute the script

### Option 2: Run Individual Scripts

If you prefer to run scripts separately:

1. **First, run the basic setup**:
   ```bash
   psql -h your-host -U your-user -d your-database -f database_setup.sql
   ```

2. **Then, run the AI memory setup**:
   ```bash
   psql -h your-host -U your-user -d your-database -f database_setup_ai_memory.sql
   ```

## What Each Script Does

### `database_setup_complete.sql` (Recommended)
- Creates `user_work` table for persistence service
- Creates `ai_memory` table for AI learning system
- Sets up all necessary indexes and constraints
- Creates functions and triggers for automatic updates
- Grants proper permissions
- Includes sample data for development
- Includes verification queries

### `database_setup.sql`
- Creates only the `user_work` table
- Basic indexes and permissions

### `database_setup_ai_memory.sql`
- Creates only the `ai_memory` table
- Advanced features like triggers and analytics views

## Verification

After running the setup, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('user_work', 'ai_memory')
ORDER BY table_name;

-- Check if indexes were created
SELECT indexname, tablename
FROM pg_indexes 
WHERE tablename IN ('user_work', 'ai_memory')
ORDER BY tablename, indexname;
```

## Expected Results

After successful setup, you should see:

### Tables Created:
- `user_work` - For saving user work across sessions
- `ai_memory` - For AI learning and preference storage

### Indexes Created:
- `idx_user_work_user_page` - For fast user work queries
- `idx_ai_memory_user_id` - For fast memory queries by user
- `idx_ai_memory_category` - For category-based memory queries
- `idx_ai_memory_priority` - For priority-based sorting
- `idx_ai_memory_last_accessed` - For access time sorting
- `idx_ai_memory_access_count` - For access frequency sorting
- `idx_ai_memory_user_priority_access` - Composite index for common queries

### Functions and Triggers:
- `update_last_accessed()` - Automatically updates access tracking
- `trigger_update_last_accessed` - Trigger for the function above

### Views:
- `ai_memory_analytics` - For memory analytics and insights

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```sql
   -- Grant permissions manually if needed
   GRANT ALL ON user_work TO authenticated;
   GRANT ALL ON user_work TO anon;
   GRANT ALL ON ai_memory TO authenticated;
   GRANT ALL ON ai_memory TO anon;
   ```

2. **Table Already Exists**:
   - The scripts use `CREATE TABLE IF NOT EXISTS`, so this shouldn't be an issue
   - If you get errors, you can drop tables first:
   ```sql
   DROP TABLE IF EXISTS ai_memory CASCADE;
   DROP TABLE IF EXISTS user_work CASCADE;
   ```

3. **Function Already Exists**:
   - The scripts use `CREATE OR REPLACE FUNCTION`, so this shouldn't be an issue

### Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Setup

After setup, test the AI memory system:

1. **Generate some slides** in the application
2. **Check the logs** for memory extraction messages
3. **Verify in database**:
   ```sql
   SELECT * FROM ai_memory WHERE user_id = 'dev@local.com';
   ```

## Next Steps

After database setup:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test slide generation** - should now work without database errors

3. **Check AI memory functionality** - the system should now store and retrieve user preferences

## Support

If you encounter issues:

1. Check the application logs for specific error messages
2. Verify your Supabase connection settings
3. Ensure all environment variables are set correctly
4. Check that the database user has proper permissions

The database setup should resolve the `relation "public.ai_memory" does not exist` error and allow the AI memory system to function properly. 