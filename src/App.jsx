function App() {
  return (
    <div style={{ backgroundColor: '#0a0a0a' }}>

      {/* HERO SECTION */}
      <div style={{
        minHeight: '100vh',
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
          <a href="#projects" style={{ textDecoration: 'none' }}>
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
          </a>
          <a href="#contact" style={{ textDecoration: 'none' }}>
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
          </a>
          <a href="#about" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: 'transparent',
              color: '#00ff88',
              border: '1px solid #00ff88',
              padding: '14px 32px',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '2px',
              cursor: 'pointer',
            }}>
              ABOUT ME
            </button>
          </a>
        </div>

      </div>

      {/* ABOUT SECTION */}
      <div id="about" style={{
        minHeight: '100vh',
        color: '#ffffff',
        fontFamily: "'Courier New', monospace",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 10%',
      }}>

        <p style={{ color: '#00ff88', fontSize: '14px', letterSpacing: '4px', marginBottom: '16px' }}>
          GET TO KNOW ME —
        </p>

        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 32px 0' }}>
          ABOUT <span style={{ color: '#00ff88' }}>ME</span>
        </h2>

        <p style={{ color: '#888888', maxWidth: '600px', lineHeight: '1.8', fontSize: '1rem', marginBottom: '16px' }}>
          Hi! I'm Fujita Natsuo, a Computer Science student with a passion for cybersecurity and building things from scratch.
        </p>

        <p style={{ color: '#888888', maxWidth: '600px', lineHeight: '1.8', fontSize: '1rem', marginBottom: '48px' }}>
          I enjoy understanding how systems work — and how they break. Outside of coding I like working out, watching dramas and animes.
        </p>

        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>

          <div>
            <p style={{ color: '#00ff88', fontSize: '12px', letterSpacing: '3px', marginBottom: '16px' }}>
              LANGUAGES
            </p>
            {['Python', 'C++', 'C', 'JavaScript'].map((lang) => (
              <p key={lang} style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px' }}>
                → {lang}
              </p>
            ))}
          </div>

          <div>
            <p style={{ color: '#00ff88', fontSize: '12px', letterSpacing: '3px', marginBottom: '16px' }}>
              CURRENTLY LEARNING
            </p>
            {['React', 'Web Development'].map((item) => (
              <p key={item} style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px' }}>
                → {item}
              </p>
            ))}
          </div>

          <div>
            <p style={{ color: '#00ff88', fontSize: '12px', letterSpacing: '3px', marginBottom: '16px' }}>
              INTERESTS
            </p>
            {['Cybersecurity', 'Working Out', 'Dramas & Anime'].map((interest) => (
              <p key={interest} style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px' }}>
                → {interest}
              </p>
            ))}
          </div>

        </div>

      </div>

      {/* PROJECTS SECTION */}
      <div id="projects" style={{
        minHeight: '100vh',
        color: '#ffffff',
        fontFamily: "'Courier New', monospace",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 10%',
      }}>
        <h2 style={{ fontSize: '2rem', letterSpacing: '4px', marginBottom: '24px' }}>
          MY <span style={{ color: '#00ff88' }}>PROJECTS</span>
        </h2>
        <p style={{ color: '#888888', maxWidth: '600px', lineHeight: '1.8' }}>
          Coming soon...
        </p>
      </div>

      {/* CONTACT SECTION */}
      <div id="contact" style={{
        minHeight: '100vh',
        color: '#ffffff',
        fontFamily: "'Courier New', monospace",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 10%',
      }}>
        <h2 style={{ fontSize: '2rem', letterSpacing: '4px', marginBottom: '24px' }}>
          GET IN <span style={{ color: '#00ff88' }}>TOUCH</span>
        </h2>
        <p style={{ color: '#888888', maxWidth: '600px', lineHeight: '1.8' }}>
          Coming soon...
        </p>
      </div>

    </div>
  )
}

export default App