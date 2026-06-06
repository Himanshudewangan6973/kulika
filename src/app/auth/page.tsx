'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Alert from '@/components/ui/Alert'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium text-sm">Validating session...</p>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Configuration Error</h1>
        <p className="text-slate-500 mb-6 text-sm">
          Supabase is not properly configured. Please check your environment variables.
        </p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-bold text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-6">
          <Alert 
            type="error" 
            message={error.includes('PKCE') 
              ? "Login Timeout: You must complete the Google login in the same browser window where you started. If you are using VS Code, please use your standard web browser (Chrome/Firefox) for the best experience."
              : error} 
          />
        </div>
      )}
      
      <p className="text-center text-slate-500 text-sm mb-8">
        Sign in with your Google account or email to access your family heritage.
      </p>
      
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#4f46e5',
                brandAccent: '#4338ca',
              },
              radii: {
                borderRadiusButton: '12px',
                buttonBorderRadius: '12px',
                inputBorderRadius: '12px',
              },
            },
          },
        }}
        theme="light"
        providers={['google']}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
      />
    </div>
  );
}

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <h1 className="text-4xl font-black text-white mb-2 relative z-10 tracking-tight">kulika<span className="text-indigo-300">.</span></h1>
            <p className="text-indigo-100 font-medium relative z-10">Roots of Heritage</p>
          </div>

          {/* Auth UI Container */}
          <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading...</div>}>
            <AuthForm />
          </Suspense>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-6 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
              Secure Cloud Infrastructure • End-to-End Encryption
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link href="/" className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
