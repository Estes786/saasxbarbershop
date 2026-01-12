import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json();

    if (!accessKey) {
      return NextResponse.json(
        { success: false, message: 'Access key is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call increment function
    const { data, error } = await supabase.rpc('increment_access_key_usage', {
      p_access_key: accessKey,
    });

    if (error) {
      console.error('Increment usage error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to increment usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usage incremented successfully',
    });
  } catch (error: any) {
    console.error('Increment access key usage error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
