import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabase } from '../../../supabaseClient';

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const questionKey = formData.get('questionKey');
    const userEmail = formData.get('userEmail');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!questionKey) {
      return NextResponse.json({ error: 'Question key is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 10MB' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${userEmail}_${questionKey}_${timestamp}_${sanitizedFileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from('brand-manuals')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage' 
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('brand-manuals')
      .getPublicUrl(fileName);

    // Save file metadata to database
    const fileMetadata = {
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      fileType: file.type,
      questionKey: questionKey,
      userEmail: userEmail,
      uploadedAt: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('brand_manuals')
      .insert([fileMetadata]);

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the upload if database insert fails
      console.warn('File uploaded but metadata not saved to database');
    }

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 