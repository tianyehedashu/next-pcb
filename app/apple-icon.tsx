import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2B7CE9 0%, #2563EB 50%, #1E40AF 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '32px',
          position: 'relative',
          border: '4px solid white',
        }}
      >
        {/* Speed lines background - matching logo style */}
        <div
          style={{
            position: 'absolute',
            left: '25px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ width: '45px', height: '5px', background: '#f1f5f9', borderRadius: '2.5px', opacity: 0.8 }} />
          <div style={{ width: '50px', height: '5px', background: '#f1f5f9', borderRadius: '2.5px', opacity: 0.8 }} />
          <div style={{ width: '35px', height: '5px', background: '#f1f5f9', borderRadius: '2.5px', opacity: 0.8 }} />
        </div>
        
        {/* Main S letter - matching logo style */}
        <div
          style={{
            color: '#f8fafc',
            fontSize: 90,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
          }}
        >
          S
        </div>
        
        {/* Bottom text indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            opacity: 0.95,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          SpeedXPCB
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 