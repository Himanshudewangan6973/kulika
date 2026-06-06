import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInstalledOnLoad =
      typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);
    setIsInstalled(isInstalledOnLoad);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    // Listen for updates
    const handleControllerChange = () => {
      setUpdateAvailable(true);
      console.log('PWA update available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Check for updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsUpdating(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        localStorage.setItem('pwa-install-accepted', 'true');
      }
    } finally {
      setIsUpdating(false);
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    setIsUpdating(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();

      // Reload page after update
      window.location.reload();
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const dismissUpdatePrompt = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    isInstalled,
    canInstall: !!deferredPrompt && !isInstalled,
    installApp,
    isUpdating,
    updateAvailable,
    updateApp,
    dismissUpdatePrompt,
  };
}
