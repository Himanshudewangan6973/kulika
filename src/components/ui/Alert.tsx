import React from 'react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  className?: string
  children?: React.ReactNode
}

export default function Alert({ type, message, className = '', children }: AlertProps) {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div className={`p-4 mb-6 rounded-lg border ${styles[type]} ${className}`}>
      {message && <div className={children ? 'mb-2 font-bold' : 'font-medium'}>{message}</div>}
      {children}
    </div>
  )
}
