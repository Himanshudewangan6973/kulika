'use client'

import { useState } from 'react'

export default function DocumentVault() {
  const [_isUploading, setIsUploading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedText, setScannedText] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsUploading(true)
      setIsScanning(true)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/ai/ocr', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        if (result.success) {
          setScannedText(result.text)
        }
      } catch (err) {
        console.error('OCR failed:', err)
      } finally {
        setIsUploading(false)
        setIsScanning(false)
      }
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">
          📂
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Secure Document Vault</h3>
          <p className="text-sm text-gray-500">Preserve certificates, letters, and identity records with AI OCR.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange}
              accept=".pdf,image/*"
            />
            <span className="text-3xl block mb-2">📄</span>
            <p className="text-sm font-bold text-gray-700">Upload Document</p>
            <p className="text-xs text-gray-400 mt-1">PDF or Scanned Images</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl text-[10px] text-blue-700 leading-relaxed uppercase tracking-wider font-bold">
            🛡️ Documents are encrypted at rest and only accessible by verified admins.
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 min-h-[200px]">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">AI Scanner Output</h4>
          
          {isScanning ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-gray-500 font-medium">Extracting text from document...</p>
            </div>
          ) : scannedText ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                {scannedText}
              </div>
              <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                Create Member From Scan
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-gray-400">
              <span className="text-4xl opacity-20 mb-2">🔍</span>
              <p className="text-sm">Scan a document to see AI extracted metadata.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
