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
          borderRadius: '8px',
          position: 'relative',
        }}
      >
        {/* Modern speed lines */}
        <div
          style={{
            position: 'absolute',
            right: '4px',
            top: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ width: '8px', height: '1.5px', background: 'rgba(255,255,255,0.8)' }} />
          <div style={{ width: '8px', height: '1.5px', background: 'rgba(255,255,255,0.7)' }} />
          <div style={{ width: '8px', height: '1.5px', background: 'rgba(255,255,255,0.8)' }} />
        </div>
        
        {/* Main S letter */}
        <div
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 900,
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          S
        </div>
        
        {/* Modern geometric accent */}
        <div
          style={{
            position: 'absolute',
            right: '6px',
            bottom: '6px',
            width: '3px',
            height: '3px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '1px',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
} 