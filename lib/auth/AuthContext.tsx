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

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
        if (user) {
          setUser({ ...user, profile: data as UserProfile });
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string, expectedRole?: UserRole) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        // CRITICAL FIX: Wait for profile to load before checking role
        const profile = await getUserProfile(data.user.id);
        console.log('🔍 Login profile:', profile);
        
        if (!profile) {
          await supabase.auth.signOut();
          return { error: new Error('User profile not found. Please contact admin.') };
        }
        
        const userRole = profile.role;
        console.log('🎯 User role:', userRole);
        
        // Verify expected role if provided
        if (expectedRole && userRole !== expectedRole) {
          await supabase.auth.signOut();
          return { error: new Error(`This login page is for ${expectedRole}s only. Your account is registered as ${userRole || 'unknown'}.`) };
        }
        
        // Load profile into state AFTER verification
        await loadUserProfile(data.user.id);
        
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

      // 2. If customer role and phone provided, create customer record FIRST (foreign key constraint)
      if (role === 'customer' && customerData?.phone) {
        console.log('📞 Checking for existing customer...');
        const { data: existingCustomer } = await supabase
          .from("barbershop_customers")
          .select("customer_phone")
          .eq("customer_phone", customerData.phone)
          .single();

        if (!existingCustomer) {
          console.log('➕ Creating new customer record...');
          // Create new customer record BEFORE profile
          const { error: customerError } = await supabase.from("barbershop_customers").insert({
            customer_phone: customerData.phone,
            customer_name: customerData.name || email,
            total_visits: 0,
            total_revenue: 0,
            average_atv: 0,
            lifetime_value: 0,
            coupon_count: 0,
            coupon_eligible: false,
            google_review_given: false,
            churn_risk_score: 0,
            first_visit_date: new Date().toISOString(),
          } as any);

          if (customerError) {
            console.error("❌ Error creating customer:", customerError);
            return { error: customerError };
          }
          console.log('✅ Customer record created');
        } else {
          console.log('✅ Customer already exists');
        }
      }

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
      await loadUserProfile(authData.user.id);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
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
