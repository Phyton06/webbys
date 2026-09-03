import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-black px-6">
          <div className="w-16 h-16 rounded-full bg-red/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Algo salió mal</h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
