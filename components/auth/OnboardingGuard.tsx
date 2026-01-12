'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OnboardingStatusResult {
  authenticated: boolean
  onboarding_started?: boolean
  onboarding_completed?: boolean
  current_step?: number
  barbershop_id?: string
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [shouldRender, setShouldRender] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  async function checkOnboardingStatus() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Not authenticated, allow render
        setShouldRender(true)
        setLoading(false)
        return
      }

      // Get user role from user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Error loading profile:', profileError)
        setShouldRender(true)
        setLoading(false)
        return
      }

      // Only check onboarding for admin role
      if ((profile as any).role !== 'admin') {
        setShouldRender(true)
        setLoading(false)
        return
      }

      // Check onboarding status
      const { data, error } = await (supabase as any).rpc('get_onboarding_status')

      if (error) {
        console.error('Error checking onboarding:', error)
        setShouldRender(true)
        setLoading(false)
        return
      }

      const status = data as OnboardingStatusResult

      // If admin hasn't completed onboarding, redirect to onboarding page
      if (status.authenticated && !status.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      // Onboarding completed or not admin, allow render
      setShouldRender(true)
      setLoading(false)

    } catch (error) {
      console.error('OnboardingGuard error:', error)
      setShouldRender(true)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!shouldRender) {
    return null
  }

  return <>{children}</>
}
