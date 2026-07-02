interface Props {
  compact?: boolean
  className?: string
}

export default function BrandLogo({ compact = false, className = '' }: Props) {
  const h = compact ? 28 : 32

  return (
    <svg
      width={compact ? 80 : 92}
      height={h}
      viewBox="0 0 92 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="IDIO"
      role="img"
      draggable={false}
    >
      {/* Icono — hexágono con punto central */}
      <g>
        <polygon
          points="16,2 28,9 28,23 16,30 4,23 4,9"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
        />
        <polygon
          points="16,7 23,11.5 23,20.5 16,25 9,20.5 9,11.5"
          fill="rgba(34,197,94,0.12)"
          stroke="rgba(34,197,94,0.35)"
          strokeWidth="1"
        />
        <circle cx="16" cy="16" r="2.5" fill="#22c55e" />
        {/* lineas de conectividad */}
        <line x1="16" y1="13.5" x2="16" y2="7"   stroke="rgba(34,197,94,0.5)" strokeWidth="1" />
        <line x1="16" y1="18.5" x2="16" y2="25"  stroke="rgba(34,197,94,0.5)" strokeWidth="1" />
        <line x1="13.8" y1="14.8" x2="9"  y2="11.5" stroke="rgba(34,197,94,0.5)" strokeWidth="1" />
        <line x1="18.2" y1="17.2" x2="23" y2="20.5" stroke="rgba(34,197,94,0.5)" strokeWidth="1" />
        <line x1="13.8" y1="17.2" x2="9"  y2="20.5" stroke="rgba(34,197,94,0.5)" strokeWidth="1" />
        <line x1="18.2" y1="14.8" x2="23" y2="11.5" stroke="rgba(34,197,94,0.5)" strokeWidth="1" />
      </g>

      {/* Wordmark — IDIO */}
      <text
        x="38"
        y="21"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="15"
        fontWeight="700"
        letterSpacing="-0.04em"
        fill="white"
      >
        IDIO
      </text>
    </svg>
  )
}
