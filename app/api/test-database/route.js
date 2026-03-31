import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { guardInternalToolsRoute } from '@/app/lib/internalSetupAuth';

export async function GET(request) {
  const denied = guardInternalToolsRoute(request);
  if (denied) return denied;

  try {
    const supabase = getSupabase();
    
    console.log('Testing database connection and schema...');
    
    // Test 1: Check if images table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('images')
      .select('*')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({ 
        error: 'Database table access failed',
        details: tableError.message 
      }, { status: 500 });
    }
    
    console.log('Images table accessible');
    
    // Test 2: Check table structure by trying to insert a test record
    const testRecord = {
      title: 'Test Image',
      description: 'Test description',
      image_url: 'https://example.com/test.jpg',
      category: 'business',
      keywords: ['test', 'business'],
      user_id: 'test-user@example.com'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('images')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json({
        error: 'Database insert failed',
        details: insertError.message,
        tableInfo: tableInfo
      }, { status: 500 });
    }
    
    console.log('Test record inserted successfully:', insertData);
    
    // Test 3: Clean up test record
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.warn('Failed to clean up test record:', deleteError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database is working correctly',
      testRecord: insertData,
      tableAccessible: true
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error.message 
    }, { status: 500 });
  }
} 