import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { accessKey, role } = await request.json();

    // Validate input
    if (!accessKey || !role) {
      return NextResponse.json(
        { error: 'Access key and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['customer', 'capster', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Call validate_access_key function
    const { data, error } = await supabase.rpc('validate_access_key', {
      p_access_key: accessKey,
      p_role: role,
    });

    if (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { error: 'Failed to validate access key', details: error.message },
        { status: 500 }
      );
    }

    // Return validation result
    return NextResponse.json({
      success: true,
      validation: data,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
