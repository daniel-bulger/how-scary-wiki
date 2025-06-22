import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FF6B35',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="white"
          stroke="none"
        >
          {/* Ghost body - filled version for better visibility */}
          <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
          {/* Eyes - larger circles for visibility */}
          <circle cx="9" cy="10" r="1.5" fill="#FF6B35" />
          <circle cx="15" cy="10" r="1.5" fill="#FF6B35" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}