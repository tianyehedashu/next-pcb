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
        {/* Speed lines background */}
        <div
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ width: '30px', height: '3px', background: 'rgba(255,255,255,0.8)', borderRadius: '1.5px' }} />
          <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.9)', borderRadius: '1.5px' }} />
          <div style={{ width: '25px', height: '3px', background: 'rgba(255,255,255,0.7)', borderRadius: '1.5px' }} />
          <div style={{ width: '35px', height: '3px', background: 'rgba(255,255,255,0.85)', borderRadius: '1.5px' }} />
        </div>
        
        {/* Main S letter */}
        <div
          style={{
            color: 'white',
            fontSize: 100,
            fontWeight: 900,
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          S
        </div>
        
        {/* Speed accent arrows */}
        <div
          style={{
            position: 'absolute',
            right: '25px',
            top: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div 
            style={{ 
              width: 0, 
              height: 0, 
              borderLeft: '15px solid rgba(255,255,255,0.8)',
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent'
            }} 
          />
          <div 
            style={{ 
              width: 0, 
              height: 0, 
              borderLeft: '12px solid rgba(255,255,255,0.6)',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent'
            }} 
          />
        </div>
        
        {/* Bottom text indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
            opacity: 0.9,
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