'use client'

import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      const register = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope)
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err)
          }
        )
      }

      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
