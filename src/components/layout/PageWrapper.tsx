interface PageWrapperProps {
  children: React.ReactNode
  maxWidth?: number | string
  padTop?: number | string
}

export default function PageWrapper({ children, maxWidth, padTop = 'clamp(32px,5vw,64px)' }: PageWrapperProps) {
  return (
    <main style={{ minHeight: 'calc(100vh - 64px)', paddingTop: padTop, paddingBottom: 80 }}>
      <div className="wrap" style={maxWidth ? { maxWidth } : undefined}>
        {children}
      </div>
    </main>
  )
}
