import { NextResponse } from 'next/server';
import { getSupabase } from '../../../../supabaseClient';

export async function POST() {
  try {
    const supabase = getSupabase();
    
    // Try to insert a test record to see if table exists
    const { error: testError } = await supabase
      .from('user_settings')
      .insert({
        user_id: 'test-setup',
        intelligence_mode: 'normal',
        automation_mode: 'balance'
      });

    if (testError && testError.code === '42P01') {
      // Table doesn't exist, return error with instructions
      return NextResponse.json(
        { 
          error: 'user_settings table does not exist. Please run the SQL setup manually.',
          instructions: 'Run the SQL commands in database_setup_user_settings.sql in your Supabase SQL editor',
          sql: `
            CREATE TABLE IF NOT EXISTS user_settings (
              id SERIAL PRIMARY KEY,
              user_id TEXT NOT NULL UNIQUE,
              intelligence_mode TEXT NOT NULL DEFAULT 'normal',
              automation_mode TEXT NOT NULL DEFAULT 'balance',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
          `
        },
        { status: 500 }
      );
    }

    // If we get here, table exists, so delete the test record
    if (!testError) {
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', 'test-setup');
    }

    // Insert default settings for development user
    const { error: insertError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: 'dev@local.com',
        intelligence_mode: 'normal',
        automation_mode: 'balance'
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error('Error inserting default settings:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert default settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User settings table created successfully' 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 