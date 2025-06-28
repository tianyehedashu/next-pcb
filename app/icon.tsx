import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          position: 'relative',
        }}
      >
        {/* Left speed lines - matching logo style */}
        <div
          style={{
            position: 'absolute',
            left: '3px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }}
        >
          <div style={{ width: '7px', height: '1px', background: '#f1f5f9', borderRadius: '0.5px', opacity: 0.8 }} />
          <div style={{ width: '8px', height: '1px', background: '#f1f5f9', borderRadius: '0.5px', opacity: 0.8 }} />
          <div style={{ width: '5px', height: '1px', background: '#f1f5f9', borderRadius: '0.5px', opacity: 0.8 }} />
        </div>
        
        {/* Main S letter - matching logo style */}
        <div
          style={{
            color: '#f8fafc',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0.5px 1px rgba(0,0,0,0.15))',
          }}
        >
          S
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 