function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: "'Courier New', monospace",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 10%',
    }}>

      <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', fontWeight: '900', lineHeight: '1', margin: '0 0 32px 0', letterSpacing: '-2px' }}>
        FUJITA <span style={{ color: '#00ff88' }}>NATSUO</span>
      </h1>

      <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#888888', maxWidth: '500px', lineHeight: '1.6', marginBottom: '48px' }}>
        Computer Science student. Interested in cybersecurity, building things, and figuring out how stuff works.
      </p>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button style={{
          backgroundColor: '#00ff88',
          color: '#0a0a0a',
          border: 'none',
          padding: '14px 32px',
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '2px',
          cursor: 'pointer',
        }}>
          VIEW PROJECTS
        </button>
        <button style={{
          backgroundColor: 'transparent',
          color: '#ffffff',
          border: '1px solid #ffffff',
          padding: '14px 32px',
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '2px',
          cursor: 'pointer',
        }}>
          CONTACT
        </button>
        <button style={{
          backgroundColor: 'transparent',
          color: '#ffffff',
          border: '1px solid #ffffff',
          padding: '14px 32px',
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '2px',
          cursor: 'pointer',
        }}>
          About Me
        </button>
      </div>

    </div>
  )
}

export default App