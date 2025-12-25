"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthContextType, AuthUser, UserProfile, UserRole } from "./types";
import { useRouter } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          profile: null,
        });
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          profile: null,
        });
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string, retries = 3) {
    try {
      console.log(`🔄 Loading profile for user: ${userId} (retries left: ${retries})`);
      console.log(`👤 Current logged in user ID: ${userId}`);
      
      // CRITICAL FIX: Add delay before query to ensure RLS is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ Error loading profile:", error);
        
        // RETRY LOGIC: If error and retries left, try again
        if (retries > 0 && error.code !== 'PGRST116') {
          console.log(`🔄 Retrying profile load... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadUserProfile(userId, retries - 1);
        }
        
        setLoading(false);
        return null;
      }

      if (data) {
        console.log('✅ Profile loaded successfully:', {
          id: (data as any).id?.substring(0, 8) + '...',
          email: (data as any).email,
          role: (data as any).role,
          customer_name: (data as any).customer_name
        });
        setProfile(data as UserProfile);
        if (user) {
          setUser({ ...user, profile: data as UserProfile });
        }
        setLoading(false);
        return data as UserProfile;
      } else {
        console.warn('⚠️ No profile data found for user:', userId);
        setLoading(false);
        return null;
      }
    } catch (err) {
      console.error("❌ Error loading profile:", err);
      
      // RETRY LOGIC: If exception and retries left, try again
      if (retries > 0) {
        console.log(`🔄 Retrying after exception... (${retries - 1} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadUserProfile(userId, retries - 1);
      }
      
      setLoading(false);
      return null;
    }
  }

  async function signIn(email: string, password: string, expectedRole?: UserRole) {
    try {
      console.log('🔐 Signing in:', { email, expectedRole });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth error:', error);
        return { error };
      }

      if (data.user) {
        console.log('✅ Auth success, user ID:', data.user.id);
        
        // CRITICAL FIX: Wait for profile to load before checking role (with retry)
        let profile = await getUserProfile(data.user.id);
        console.log('🔍 Login profile:', profile);
        
        // RETRY if profile not found immediately
        if (!profile) {
          console.warn('⚠️ Profile not found on first attempt, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          profile = await getUserProfile(data.user.id);
        }
        
        if (!profile) {
          console.error('❌ Profile not found after retries');
          await supabase.auth.signOut();
          return { error: new Error('User profile not found. Please contact admin. This could be an RLS policy issue - try logging in again.') };
        }
        
        const userRole = profile.role;
        console.log('🎯 User role:', userRole);
        
        // Verify expected role if provided
        if (expectedRole && userRole !== expectedRole) {
          console.warn(`⚠️ Role mismatch: expected ${expectedRole}, got ${userRole}`);
          await supabase.auth.signOut();
          return { error: new Error(`This login page is for ${expectedRole}s only. Your account is registered as ${userRole || 'unknown'}.`) };
        }
        
        // CRITICAL: Load profile into state with explicit wait
        console.log('🔄 Loading profile into state...');
        await loadUserProfile(data.user.id);
        
        // IMPORTANT: Wait a bit longer to ensure state is fully updated
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('✅ Profile loaded into state');
        
        // Redirect based on role
        if (userRole === 'admin') {
          console.log('➡️ Redirecting to admin dashboard');
          router.push('/dashboard/admin');
        } else if (userRole === 'capster') {
          console.log('➡️ Redirecting to capster dashboard');
          router.push('/dashboard/capster');
        } else if (userRole === 'barbershop') {
          console.log('➡️ Redirecting to barbershop dashboard');
          router.push('/dashboard/barbershop');
        } else {
          console.log('➡️ Redirecting to customer dashboard');
          router.push('/dashboard/customer');
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error('❌ Sign in error:', err);
      return { error: err };
    }
  }

  async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data as UserProfile | null;
  }

  async function signUp(
    email: string,
    password: string,
    role: UserRole,
    customerData?: { phone: string; name: string }
  ) {
    try {
      console.log('📝 Starting signup process...', { email, role, customerData });
      
      // CRITICAL FIX: Check if user already exists in user_profiles
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("id, email, role")
        .eq("email", email)
        .maybeSingle();
      
      if (existingProfile && !checkError) {
        console.log('⚠️ User already registered:', existingProfile);
        // If user exists, try to sign in instead
        return { error: new Error(`This email is already registered as ${(existingProfile as any).role}. Please use the login page instead.`) };
      }
      
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            customer_phone: customerData?.phone || null,
            customer_name: customerData?.name || null,
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        // Handle "User already registered" error from Supabase Auth
        if (authError.message?.includes('already registered')) {
          return { error: new Error('This email is already registered. Please use the login page instead.') };
        }
        return { error: authError };
      }
      if (!authData.user) {
        console.error('❌ No user created');
        return { error: new Error("Failed to create user") };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // 2. Customer record will be auto-created by trigger after profile creation
      // No need to manually create customer record here

      // 3. Create user profile (after customer record)
      console.log('👤 Creating user profile...');
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: authData.user.id,
        email,
        role,
        customer_phone: customerData?.phone || null,
        customer_name: customerData?.name || null,
      } as any);

      if (profileError) {
        console.error("❌ Error creating profile:", profileError);
        return { error: profileError };
      }

      console.log('✅ User profile created successfully');

      // 3.5. If capster role, create capster record
      if (role === 'capster') {
        console.log('✂️ Creating capster record...');
        const { data: capsterData, error: capsterError } = await supabase
          .from("capsters")
          .insert({
            user_id: authData.user.id,
            capster_name: customerData?.name || email,
            phone: customerData?.phone || null,
            specialization: 'all',
            is_available: true,
          } as any)
          .select()
          .single();

        if (capsterError) {
          console.error("❌ Error creating capster:", capsterError);
          // Don't fail signup, just log error
        } else if (capsterData) {
          console.log('✅ Capster record created with ID:', (capsterData as any).id);
          // Update user profile with capster_id
          // @ts-ignore - Supabase types not generated for capster_id field yet
          await (supabase as any)
            .from("user_profiles")
            .update({ capster_id: (capsterData as any).id })
            .eq("id", authData.user.id);
          console.log('✅ User profile updated with capster_id');
        }
      }
      
      // 4. CRITICAL FIX: Load profile into state before redirect
      console.log('🔄 Loading profile into state...');
      await loadUserProfile(authData.user.id);
      
      // IMPORTANT: Wait longer to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Profile loaded into state, ready to redirect');
      
      // 5. Redirect based on role
      if (role === 'admin') {
        console.log('➡️ Redirecting to admin dashboard');
        router.push('/dashboard/admin');
      } else if (role === 'capster') {
        console.log('➡️ Redirecting to capster dashboard');
        router.push('/dashboard/capster');
      } else if (role === 'barbershop') {
        console.log('➡️ Redirecting to barbershop dashboard');
        router.push('/dashboard/barbershop');
      } else {
        console.log('➡️ Redirecting to customer dashboard');
        router.push('/dashboard/customer');
      }

      return { error: null };
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      return { error: err };
    }
  }

  async function signInWithGoogle(expectedRole?: UserRole) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${expectedRole ? `?role=${expectedRole}` : ''}`,
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async function signOut() {
    // CRITICAL: Clear all state FIRST before Supabase signOut
    setUser(null);
    setProfile(null);
    setLoading(false);
    
    // Then sign out from Supabase
    await supabase.auth.signOut();
    
    // Force a hard refresh to clear any cached state
    router.push('/login');
    router.refresh();
  }

  async function refreshProfile() {
    if (user) {
      await loadUserProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
