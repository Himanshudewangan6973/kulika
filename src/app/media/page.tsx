/**
 * @file src/app/media/page.tsx
 * @description Family media archive page.
 * Requirement: Central hub for photos, videos, and documents preserving family history.
 */

import MediaGallery from '@/components/media/MediaGallery'
import MediaUpload from '@/components/media/MediaUpload'

export default function MediaPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Upload */}
          <div className="lg:col-span-1 space-y-6">
            <MediaUpload />
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2">Preservation Stats</h3>
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Storage Used</span>
                  <span className="text-sm font-bold text-primary">2.4 GB / 10 GB</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '24%' }}></div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-500">Total Items</span>
                  <span className="text-sm font-bold text-gray-800">1,248</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Gallery */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Media Gallery</h2>
              <p className="text-sm text-gray-500">Browsing all preserved family memories.</p>
            </div>
            
            <MediaGallery />
          </div>
        </div>
      </div>
    </main>
  )
}
