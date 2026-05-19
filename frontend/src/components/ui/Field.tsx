import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from './cx'

export function FieldLabel({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx('mb-3 block text-xs font-headline font-black uppercase tracking-[0.16em] text-[#6F6878]', className)}
      {...props}
    >
      {children}
    </label>
  )
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { leftIcon, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6878]">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cx(
          'h-12 w-full rounded-[14px] border border-[#E3E7EC] bg-white px-4 text-sm font-semibold text-hai-plum outline-none transition placeholder:text-[#6F6878] hover:border-hai-teal focus:border-hai-teal',
          Boolean(leftIcon) && 'pl-12',
          className,
        )}
        {...props}
      />
    </div>
  )
})

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cx(
          'h-[46px] w-full appearance-none rounded-[14px] border border-[#E3E7EC] bg-white px-4 pr-10 text-sm font-black text-hai-plum outline-none transition hover:border-hai-teal focus:border-hai-teal',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-hai-plum" />
    </div>
  )
})
