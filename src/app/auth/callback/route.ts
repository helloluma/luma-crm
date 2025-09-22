import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/lib/email'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

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
              role: 'Assistant', // Default role for OAuth users
              avatar_url: data.user.user_metadata?.avatar_url || null
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Continue anyway - the user is authenticated
          } else {
            // Send welcome email for new users
            try {
              await emailService.sendWelcomeEmail(data.user.email!, userName)
            } catch (emailError) {
              console.error('Welcome email error:', emailError)
              // Don't fail the auth flow for email errors
            }
          }
        }
      }
      
      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (err) {
      console.error('Unexpected auth callback error:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`)
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}