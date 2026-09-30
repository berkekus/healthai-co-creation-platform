import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * A lazy-loaded page chunk that no longer exists on the server — usually because a new
 * version was deployed while the tab was open. Only a reload can recover from it.
 */
function isStaleChunkError(error: Error) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|ChunkLoadError/i.test(
    `${error.name} ${error.message}`,
  )
}

interface Props {
  children: ReactNode
  /** When this value changes (e.g. the route), a caught error is cleared. */
  resetKey?: string
}

interface State {
  error: Error | null
}

/**
 * Keeps a crash in one page from blanking the whole app: shows a recoverable message
 * in place of the failed subtree, and clears it on retry or when `resetKey` changes.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  private reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return <ErrorFallback stale={isStaleChunkError(this.state.error)} onRetry={this.reset} />
  }
}

function ErrorFallback({ stale, onRetry }: { stale: boolean; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="mx-auto my-16 w-full max-w-[640px] px-6 font-body">
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 md:p-10">
        <h1 className="font-headline text-2xl font-bold text-hai-plum md:text-3xl">{t('errors.boundary.title')}</h1>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          {stale ? t('errors.boundary.updateDesc') : t('errors.boundary.desc')}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={stale ? () => window.location.reload() : onRetry}
            className="inline-flex items-center rounded-full bg-hai-plum px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            {stale ? t('errors.boundary.reload') : t('errors.boundary.retry')}
          </button>
          {/* A plain link: this fallback may render outside the router, and a full load also clears broken state. */}
          <a
            href="/"
            className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-hai-plum transition-colors hover:border-hai-plum"
          >
            {t('errors.notFound.backHome')}
          </a>
        </div>
      </div>
    </div>
  )
}
