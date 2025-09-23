import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  // Handle OAuth flow (with code parameter)
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
      }

      if (data.user) {
        // Check if this is a new user (first time OAuth login)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingProfile) {
          // Create profile for new OAuth user
          const userName = data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name || 
                          data.user.email?.split('@')[0] || 
                          'User'

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: userName,
              role: 'Realtor', // Default role for OAuth users
              avatar_url: data.user.user_metadata?.avatar_url || null
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Continue anyway - the user is authenticated
          }
        }
      }
      
      // Successful authentication - redirect to login page
      return NextResponse.redirect(`${origin}/?message=email_confirmed`)
    } catch (err) {
      console.error('Unexpected auth callback error:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`)
    }
  }

  // Handle email confirmation flow (with access_token and type parameters)
  if (accessToken && refreshToken && type === 'signup') {
    try {
      // Set the session using the tokens from email confirmation
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (error) {
        console.error('Email confirmation error:', error)
        return NextResponse.redirect(`${origin}/auth/login?error=email_confirmation_error`)
      }

      if (data.user) {
        // Check if profile exists (it should be created by the database trigger)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingProfile) {
          // Create profile if it doesn't exist (fallback)
          const userName = data.user.user_metadata?.name || 
                          data.user.email?.split('@')[0] || 
                          'User'

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: userName,
              role: 'Realtor',
              avatar_url: data.user.user_metadata?.avatar_url || null
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Continue anyway - the user is authenticated
          }
        }
      }
      
      // Successful email confirmation - redirect to login page
      return NextResponse.redirect(`${origin}/?message=email_confirmed`)
    } catch (err) {
      console.error('Email confirmation error:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=email_confirmation_error`)
    }
  }

  // No valid parameters - redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=invalid_callback`)
}