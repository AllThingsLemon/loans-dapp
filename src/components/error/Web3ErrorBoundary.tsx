'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary specifically designed for Web3 operations
 * Provides user-friendly error messages and recovery options
 */
export class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Web3 Error Boundary caught an error:', error, errorInfo)
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  private getErrorMessage(error?: Error): string {
    if (!error) return 'An unexpected error occurred'
    
    const message = error.message?.toLowerCase() || ''
    
    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'Transaction was cancelled by user'
    }
    
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for this transaction'
    }
    
    if (message.includes('network')) {
      return 'Network connection issue. Please check your connection and try again.'
    }
    
    if (message.includes('wallet')) {
      return 'Wallet connection issue. Please reconnect your wallet.'
    }
    
    if (message.includes('contract')) {
      return 'Smart contract error. Please try again or contact support.'
    }
    
    return 'An unexpected error occurred while processing your request'
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800">Something went wrong</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              {this.getErrorMessage(this.state.error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleRefresh}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Hook version for functional components
 */
export function useWeb3ErrorBoundary() {
  return {
    ErrorBoundary: Web3ErrorBoundary
  }
}