import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle errors from the auth provider
  if (error) {
    const errorMessage = error_description || error
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }

  if (code) {
    const supabase = await createClient()

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        )
      }
    } catch (err) {
      console.error('Auth exchange error:', err)
      return NextResponse.redirect(
        new URL('/auth?error=Failed to authenticate', request.url)
      )
    }
  }

  // Redirect to home on success
  return NextResponse.redirect(new URL('/', request.url))
}
