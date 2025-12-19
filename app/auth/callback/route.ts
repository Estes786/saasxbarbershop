import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session using server-side client
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('OAuth exchange error:', exchangeError);
      return NextResponse.redirect(new URL('/login?error=oauth_exchange_failed', requestUrl.origin));
    }
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(new URL('/login?error=session_failed', requestUrl.origin));
    }
    
    // Check if user_profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, id, email')
      .eq('id', session.user.id)
      .single();
    
    if (profile && !profileError) {
      // Profile exists - redirect based on role
      const dashboardUrl = (profile as any).role === 'admin' 
        ? '/dashboard/admin' 
        : '/dashboard/customer';
      
      console.log(`[OAuth Success] User ${(profile as any).email} authenticated as ${(profile as any).role}`);
      return NextResponse.redirect(new URL(dashboardUrl, requestUrl.origin));
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
      
      if (insertError) {
        console.error('Profile creation error:', insertError);
        return NextResponse.redirect(new URL('/login?error=profile_creation_failed', requestUrl.origin));
      }
      
      console.log(`[OAuth Success] New customer profile created for ${email}`);
      // Success - redirect to customer dashboard
      return NextResponse.redirect(new URL('/dashboard/customer', requestUrl.origin));
    }
  }

  // No code provided
  console.error('[OAuth Error] No authorization code provided');
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
}
