import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}

export default function EmptyState({ icon, title, description, className = '', children }: EmptyStateProps) {
  return (
    <div className={`py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 ${className}`}>
      {icon && <p className="text-4xl mb-4">{icon}</p>}
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <p className="text-gray-500 mt-1 mb-6">{description}</p>
      {children}
    </div>
  )
}
