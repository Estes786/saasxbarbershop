"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole } from "@/lib/auth/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function AuthGuard({ children, allowedRoles, redirectTo }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not logged in
    if (!user) {
      router.push(redirectTo || '/login');
      return;
    }

    // Logged in but no profile loaded yet
    if (!profile) {
      return;
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      // Redirect based on actual role
      if (profile.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/customer');
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // No profile loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Wrong role
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return null;
  }

  // All checks passed
  return <>{children}</>;
}
