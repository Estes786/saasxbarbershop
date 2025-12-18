import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('OAuth error:', exchangeError);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', requestUrl.origin));
    }
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Check if user_profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile && 'role' in profile) {
        // Profile exists, redirect based on role
        if ((profile as any).role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', requestUrl.origin));
        } else {
          return NextResponse.redirect(new URL('/dashboard/customer', requestUrl.origin));
        }
      } else {
        // No profile yet - create default customer profile
        const email = session.user.email || '';
        const displayName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           email.split('@')[0];
        
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            email: email,
            role: 'customer',
            customer_name: displayName,
          } as any);
        
        if (!insertError) {
          // Success - redirect to customer dashboard
          return NextResponse.redirect(new URL('/dashboard/customer', requestUrl.origin));
        } else {
          console.error('Profile creation error:', insertError);
          return NextResponse.redirect(new URL('/login?error=profile_creation_failed', requestUrl.origin));
        }
      }
    }
  }

  // Return to login if something went wrong
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
}
