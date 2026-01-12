import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { accessKey, role } = await request.json();

    if (!accessKey || !role) {
      return NextResponse.json(
        { valid: false, message: 'Access key and role are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call validation function
    const { data, error } = await supabase.rpc('validate_access_key', {
      p_access_key: accessKey,
      p_role: role,
    });

    if (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { valid: false, message: 'Failed to validate access key' },
        { status: 500 }
      );
    }

    // data is an array with single row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result || !result.is_valid) {
      return NextResponse.json({
        valid: false,
        message: result?.message || 'Invalid access key',
      });
    }

    return NextResponse.json({
      valid: true,
      keyName: result.key_name,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Validate access key error:', error);
    return NextResponse.json(
      { valid: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
