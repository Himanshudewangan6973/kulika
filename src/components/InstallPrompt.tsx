'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setInstallPrompt(promptEvent)
      
      // Check if dismissed in last 7 days
      const lastDismissed = localStorage.getItem('install-prompt-dismissed')
      const now = Date.now()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      
      if (!lastDismissed || now - parseInt(lastDismissed) > sevenDaysMs) {
        setIsInstallable(true)
        setShowPrompt(true)
      }
    }

    const handleAppInstalled = () => {
      setShowPrompt(false)
      setInstallPrompt(null)
      localStorage.removeItem('install-prompt-dismissed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setInstallPrompt(null)
      localStorage.removeItem('install-prompt-dismissed')
    } else {
      dismissPrompt()
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem('install-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt || !isInstallable) return null

  return (
    <div className="fixed bottom-6 right-6 z-[999] max-w-sm">
      <div className="bg-white border-2 border-blue-600 rounded-lg shadow-xl p-6 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-2m4 2l4-2"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Install Kulika
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Install our app for quick access and offline support. Get the full experience on your device!
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Install
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismissPrompt}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
