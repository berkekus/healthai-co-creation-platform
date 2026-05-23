import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-7 py-20 text-center">
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-hai-mint/55 text-hai-plum">
          {icon}
        </div>
      )}
      <div>
        <p className="text-lg font-black text-hai-plum">{title}</p>
        {description && (
          <p className="mt-2 text-sm font-semibold text-[#6F6878]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
