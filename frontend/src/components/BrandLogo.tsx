interface Props {
  compact?: boolean
  className?: string
}

export default function BrandLogo({ compact = false, className = '' }: Props) {
  return (
    <img
      src="/idio-wordmark.png"
      alt="IDIO"
      className={`${compact ? 'h-7 w-24' : 'h-8 w-28'} object-contain object-left ${className}`}
      draggable={false}
    />
  )
}
