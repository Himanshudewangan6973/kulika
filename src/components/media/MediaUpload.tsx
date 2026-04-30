'use client'

import { useState, useRef } from 'react'

export default function MediaUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
      
      // Generate previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('file_type', file.type.startsWith('image') ? 'Photo' : 'Video')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`)
      }

      alert('All files uploaded successfully!')
      setFiles([])
      setPreviews([])
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
      <div className="text-center mb-6">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📸</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Preserve a Memory</h3>
        <p className="text-sm text-gray-500 mt-1">Capture family history in photos and videos</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
        >
          <span className="text-2xl mb-1">📁</span>
          <span className="text-xs font-bold text-gray-600 uppercase">Gallery</span>
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <span className="text-2xl mb-1">📷</span>
          <span className="text-xs font-bold text-primary uppercase">Camera</span>
        </button>
      </div>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        accept="image/*,video/*"
      />
      
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
      />

      {previews.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Pending Uploads ({files.length})</h4>
            <button 
              onClick={() => { setFiles([]); setPreviews([]); }}
              className="text-xs text-red-500 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={files.length === 0 || isUploading}
        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
          files.length === 0 || isUploading ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary-dark hover:shadow-primary/20'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.062 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
        ) : 'Securely Save to Vault'}
      </button>
      
      <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">
        End-to-end Encrypted • Cloudflare R2 Storage
      </p>
    </div>
  )
}
