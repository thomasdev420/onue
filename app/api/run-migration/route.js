import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { guardInternalToolsRoute } from '@/app/lib/internalSetupAuth';

export async function POST(request) {
  const denied = guardInternalToolsRoute(request);
  if (denied) return denied;

  try {
    const supabase = getSupabase();
    
    console.log('Running database migration to add user_id column...');
    
    // Migration SQL to add user_id column
    const migrationSQL = `
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
    `;
    
    // Execute the migration using rpc (if available) or direct SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      
      // Fallback: try to add the column directly
      try {
        const { error: alterError } = await supabase
          .from('images')
          .select('user_id')
          .limit(1);
        
        if (alterError && alterError.message.includes('user_id')) {
          // Column doesn't exist, we need to add it
          console.log('Column user_id does not exist, attempting to add it...');
          
          // Since we can't run ALTER TABLE directly, let's test if we can work around it
          return NextResponse.json({
            success: false,
            message: 'Migration requires manual database update',
            error: 'The user_id column is missing from the images table. Please run the migration manually in your Supabase dashboard.',
            manualSteps: [
              '1. Go to your Supabase dashboard',
              '2. Navigate to SQL Editor',
              '3. Run: ALTER TABLE images ADD COLUMN user_id TEXT;',
              '4. Run: CREATE INDEX idx_images_user_id ON images(user_id);',
              '5. Run: UPDATE images SET user_id = \'legacy-user@example.com\' WHERE user_id IS NULL;'
            ]
          }, { status: 500 });
        }
      } catch (fallbackError) {
        console.error('Fallback check failed:', fallbackError);
      }
      
      return NextResponse.json({
        error: 'Migration failed',
        details: error.message
      }, { status: 500 });
    }
    
    console.log('Migration completed successfully');
    
    // Test the migration by trying to insert a record
    const testRecord = {
      title: 'Migration Test',
      description: 'Testing after migration',
      image_url: 'https://example.com/test.jpg',
      category: 'business',
      keywords: ['test', 'migration'],
      user_id: 'test-user@example.com'
    };
    
    const { data: testData, error: testError } = await supabase
      .from('images')
      .insert(testRecord)
      .select()
      .single();
    
    if (testError) {
      return NextResponse.json({
        success: false,
        message: 'Migration completed but test failed',
        error: testError.message
      }, { status: 500 });
    }
    
    // Clean up test record
    await supabase
      .from('images')
      .delete()
      .eq('id', testData.id);
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      testRecord: testData
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error.message 
    }, { status: 500 });
  }
} 