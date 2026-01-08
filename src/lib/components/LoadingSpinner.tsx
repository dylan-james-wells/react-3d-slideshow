const spinnerStyles = `
@keyframes slideshow-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideshow-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dashoffset: -125px;
  }
}
`

export interface LoadingSpinnerProps {
  size?: number
  color?: string
}

export function LoadingSpinner({
  size = 52,
  color = 'white'
}: LoadingSpinnerProps) {
  return (
    <>
      <style>{spinnerStyles}</style>
      <svg
        className="r3dss__spinner"
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{
          transformOrigin: 'center',
          animation: 'slideshow-rotate 2s linear infinite',
        }}
      >
        <circle
          className="r3dss__spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="1, 200"
          strokeDashoffset={0}
          strokeLinecap="round"
          style={{
            animation: 'slideshow-dash 1.5s ease-in-out infinite',
          }}
        />
      </svg>
    </>
  )
}
