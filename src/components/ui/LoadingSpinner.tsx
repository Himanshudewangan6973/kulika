import React from 'react'

interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export default function LoadingSpinner({ message = 'Loading...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
    </div>
  )
}
