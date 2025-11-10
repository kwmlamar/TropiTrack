"use client"

import { useTheme } from "next-themes"

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = "Loading...", className = "" }: LoadingStateProps) {
  const { theme } = useTheme()
  
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div 
            className="h-12 w-12 rounded-full border-4 animate-spin mx-auto"
            style={{
              borderColor: theme === 'dark' 
                ? 'rgba(37, 150, 190, 0.2)' 
                : 'rgba(37, 150, 190, 0.15)',
              borderTopColor: '#2596be'
            }}
          />
        </div>
        <p 
          className="text-sm font-medium"
          style={{ 
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280' 
          }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}

export function LoadingSkeleton() {
  const { theme } = useTheme()
  
  return (
    <div 
      className="flex-1 space-y-6 p-6"
      style={{
        backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB'
      }}
    >
      <div className="space-y-4">
        {/* Header skeleton */}
        <div 
          className="h-16 w-full rounded-xl animate-pulse"
          style={{
            backgroundColor: theme === 'dark' ? '#1A2332' : '#E5E7EB'
          }}
        />
        
        {/* Selection sections skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="h-32 rounded-xl animate-pulse"
              style={{
                backgroundColor: theme === 'dark' ? '#1A2332' : '#E5E7EB',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
        
        {/* Table skeleton */}
        <div 
          className="h-64 w-full rounded-xl animate-pulse"
          style={{
            backgroundColor: theme === 'dark' ? '#1A2332' : '#E5E7EB',
            animationDelay: '300ms'
          }}
        />
      </div>
    </div>
  )
}

