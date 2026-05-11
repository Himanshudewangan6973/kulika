import React from 'react'

interface ErrorStateProps {
  title?: string
  message: string
  className?: string
}

export default function ErrorState({ title = 'Something went wrong', message, className = '' }: ErrorStateProps) {
  return (
    <div className={`py-20 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100 ${className}`}>
      <p className="font-bold">{title}</p>
      <p className="text-sm opacity-80">{message}</p>
    </div>
  )
}
