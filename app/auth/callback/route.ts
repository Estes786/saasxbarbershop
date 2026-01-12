import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const expectedRole = requestUrl.searchParams.get('role') as 'admin' | 'customer' | 'capster' | 'barbershop' | null;

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
      // Profile exists - verify expected role if provided
      if (expectedRole && (profile as any).role !== expectedRole) {
        console.log(`[OAuth Error] Expected ${expectedRole} but user is ${(profile as any).role}`);
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(`/login/${expectedRole}?error=wrong_role&expected=${expectedRole}&actual=${(profile as any).role}`, requestUrl.origin)
        );
      }
      
      // Profile exists - redirect based on role
      let dashboardUrl = '/dashboard/customer'; // default
      if ((profile as any).role === 'admin') {
        dashboardUrl = '/dashboard/admin';
      } else if ((profile as any).role === 'capster') {
        dashboardUrl = '/dashboard/capster';
      } else if ((profile as any).role === 'barbershop') {
        dashboardUrl = '/dashboard/barbershop';
      }
      
      console.log(`[OAuth Success] User ${(profile as any).email} authenticated as ${(profile as any).role}`);
      return NextResponse.redirect(new URL(dashboardUrl, requestUrl.origin));
    } else {
      // No profile yet - create default customer profile (or admin if expected)
      const email = session.user.email || '';
      const displayName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || 
                         email.split('@')[0];
      
      // Use expected role if provided, otherwise default to customer
      const roleToAssign = expectedRole || 'customer';
      
      // Note: For OAuth users without phone number, profile will be created without customer_phone
      // This avoids foreign key constraint issues. Phone can be added later via profile update.
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: session.user.id,
          email: email,
          role: roleToAssign,
          customer_name: displayName,
          customer_phone: null, // OAuth users don't have phone initially
        } as any);
      
      if (insertError) {
        console.error('Profile creation error:', insertError);
        return NextResponse.redirect(new URL('/login?error=profile_creation_failed', requestUrl.origin));
      }
      
      console.log(`[OAuth Success] New ${roleToAssign} profile created for ${email}`);

      // If capster role, create capster record
      if (roleToAssign === 'capster') {
        console.log('[OAuth] Creating capster record for OAuth user...');
        const { data: capsterData, error: capsterError } = await supabase
          .from('capsters')
          .insert({
            user_id: session.user.id,
            capster_name: displayName,
            phone: null,
            specialization: 'all',
            is_available: true,
          } as any)
          .select()
          .single();

        // Note: capster_id will be auto-updated by dashboard when user first logs in
        if (capsterError) {
          console.error('[OAuth] Error creating capster record:', capsterError);
        } else {
          console.log('[OAuth] Capster record created successfully');
        }
      }
      
      // Success - redirect based on role
      let dashboardUrl = '/dashboard/customer'; // default
      if (roleToAssign === 'admin') {
        dashboardUrl = '/dashboard/admin';
      } else if (roleToAssign === 'capster') {
        dashboardUrl = '/dashboard/capster';
      } else if (roleToAssign === 'barbershop') {
        dashboardUrl = '/dashboard/barbershop';
      }
      return NextResponse.redirect(new URL(dashboardUrl, requestUrl.origin));
    }
  }

  // No code provided
  console.error('[OAuth Error] No authorization code provided');
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
}
