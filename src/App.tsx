import React, { useState, useRef } from 'react'
import { Slideshow, SlideshowHandle, SlideData, TransitionStyle } from 'react-3d-slideshow'

const demoSlides: SlideData[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&h=800&fit=crop',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=800&fit=crop',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=800&fit=crop',
  },
]

const transitionStyles: TransitionStyle[] = [
  'glitch',
  'cascade',
  'cube',
]

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 700,
    marginBottom: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: 600,
    margin: '0 auto',
  },
  section: {
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 24,
    marginBottom: 20,
    color: '#fff',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  select: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
  },
  input: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 14,
    width: 80,
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    cursor: 'pointer',
  },
  slideshowContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  info: {
    marginTop: 20,
    padding: 16,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#fff',
    textTransform: 'capitalize',
  },
  footer: {
    textAlign: 'center',
    marginTop: 80,
    padding: '40px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  code: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '2px 8px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  codeBlock: {
    background: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    overflowX: 'auto',
    marginTop: 16,
    lineHeight: 1.6,
  },
}

function App() {
  const [selectedStyle, setSelectedStyle] = useState<TransitionStyle>('glitch')
  const [autoPlay, setAutoPlay] = useState(false)
  const [loop, setLoop] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [aspectRatio, setAspectRatio] = useState('3:2')
  const [cubeTransitionDuration, setCubeTransitionDuration] = useState(800)
  const [glitchAberration, setGlitchAberration] = useState(0.5)
  const [glitchScanlines, setGlitchScanlines] = useState(0.5)
  const [glitchGrain, setGlitchGrain] = useState(0.5)
  const [fullscreen, setFullscreen] = useState(false)
  const [cascadeMinTiles, setCascadeMinTiles] = useState(15)
  const slideshowRef = useRef<SlideshowHandle>(null)

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index)
  }

  const parseAspectRatio = (ratio: string): number => {
    const [w, h] = ratio.split(':').map(Number)
    return w && h ? w / h : 3 / 2
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>React 3D Slideshow</h1>
        <p style={styles.subtitle}>
          A stunning React slideshow component with beautiful 3D transitions powered by Three.js.
          Perfect for portfolios, galleries, and presentations.
        </p>
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Interactive Demo</h2>

        <div style={styles.controls}>
          <span style={styles.label}>Transition Style:</span>
          <select
            style={styles.select}
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value as TransitionStyle)}
          >
            {transitionStyles.map((style) => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>

          {(selectedStyle === 'cascade' || selectedStyle === 'glitch') && (
            <>
              <span style={styles.label}>Aspect Ratio:</span>
              <select
                style={styles.select}
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="3:2">3:2</option>
                <option value="1:1">1:1</option>
                <option value="2:3">2:3 (Portrait)</option>
              </select>
            </>
          )}

          {selectedStyle === 'cascade' && (
            <>
              <span style={styles.label}>Min Tiles:</span>
              <input
                type="range"
                style={{ ...styles.input, width: 120 }}
                value={cascadeMinTiles}
                min={3}
                max={30}
                step={1}
                onChange={(e) => setCascadeMinTiles(Number(e.target.value))}
              />
              <span style={{ ...styles.label, marginLeft: 0 }}>{cascadeMinTiles}</span>
            </>
          )}

          {selectedStyle === 'cube' && (
            <>
              <span style={styles.label}>Animation Duration:</span>
              <input
                type="range"
                style={{ ...styles.input, width: 120 }}
                value={cubeTransitionDuration}
                min={200}
                max={2000}
                step={100}
                onChange={(e) => setCubeTransitionDuration(Number(e.target.value))}
              />
              <span style={{ ...styles.label, marginLeft: 0 }}>{cubeTransitionDuration}ms</span>
            </>
          )}

          {selectedStyle === 'glitch' && (
            <>
              <span style={styles.label}>Aberration:</span>
              <input
                type="range"
                style={{ ...styles.input, width: 120 }}
                value={glitchAberration}
                min={0}
                max={1}
                step={0.1}
                onChange={(e) => setGlitchAberration(Number(e.target.value))}
              />
              <span style={{ ...styles.label, marginLeft: 0 }}>{Math.round(glitchAberration * 100)}%</span>

              <span style={styles.label}>Scanlines:</span>
              <input
                type="range"
                style={{ ...styles.input, width: 120 }}
                value={glitchScanlines}
                min={0}
                max={1}
                step={0.1}
                onChange={(e) => setGlitchScanlines(Number(e.target.value))}
              />
              <span style={{ ...styles.label, marginLeft: 0 }}>{Math.round(glitchScanlines * 100)}%</span>

              <span style={styles.label}>Grain:</span>
              <input
                type="range"
                style={{ ...styles.input, width: 120 }}
                value={glitchGrain}
                min={0}
                max={1}
                step={0.1}
                onChange={(e) => setGlitchGrain(Number(e.target.value))}
              />
              <span style={{ ...styles.label, marginLeft: 0 }}>{Math.round(glitchGrain * 100)}%</span>

              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={fullscreen}
                  onChange={(e) => setFullscreen(e.target.checked)}
                />
                Fullscreen (Cover)
              </label>
            </>
          )}

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
            />
            Auto Play
          </label>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
            Loop
          </label>

          <button
            style={styles.button}
            onClick={() => slideshowRef.current?.prev()}
          >
            Previous
          </button>
          <button
            style={styles.button}
            onClick={() => slideshowRef.current?.next()}
          >
            Next
          </button>
        </div>

        <div style={styles.slideshowContainer}>
          <Slideshow
            ref={slideshowRef}
            slides={demoSlides}
            style={selectedStyle}
            autoPlay={autoPlay}
            autoPlayInterval={3000}
            loop={loop}
            transitionDuration={selectedStyle === 'cube' ? cubeTransitionDuration : 800}
            height={500}
            onSlideChange={handleSlideChange}
            showControls
            showIndicators
            enableSwipe
            enableKeyboard
            cascadeMinTiles={cascadeMinTiles}
            aspectRatio={parseAspectRatio(aspectRatio)}
            glitchAberration={glitchAberration}
            glitchScanlines={glitchScanlines}
            glitchGrain={glitchGrain}
            fullscreen={fullscreen}
          />
        </div>

        <div style={styles.info}>
          Current Slide: {currentSlide + 1} / {demoSlides.length} |
          Style: <span style={styles.code}>{selectedStyle}</span>
          {(selectedStyle === 'cascade' || selectedStyle === 'glitch') && (
            <> | Aspect: <span style={styles.code}>{aspectRatio}</span></>
          )}
          {selectedStyle === 'cascade' && (
            <> | Tiles: <span style={styles.code}>{cascadeMinTiles}</span></>
          )}
          {selectedStyle === 'cube' && (
            <> | Duration: <span style={styles.code}>{cubeTransitionDuration}ms</span></>
          )}
          {selectedStyle === 'glitch' && (
            <> | Aberration: <span style={styles.code}>{Math.round(glitchAberration * 100)}%</span></>
          )}
          {' '}| Use arrow keys or swipe to navigate
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>All Transition Styles</h2>
        <div style={styles.grid}>
          {transitionStyles.map((transitionStyle) => (
            <div key={transitionStyle} style={styles.card}>
              <h3 style={styles.cardTitle}>{transitionStyle}</h3>
              <Slideshow
                slides={demoSlides}
                style={transitionStyle}
                autoPlay
                autoPlayInterval={2500}
                loop
                transitionDuration={600}
                height={200}
                showControls={false}
                showIndicators
                cascadeMinTiles={6}
                aspectRatio={3 / 2}
              />
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Start</h2>
        <div style={styles.codeBlock}>
          <pre>{`npm install react-3d-slideshow

import { Slideshow } from 'react-3d-slideshow'

const slides = [
  { id: 1, image: '/image1.jpg' },
  { id: 2, image: '/image2.jpg' },
  { id: 3, image: '/image3.jpg' },
]

function App() {
  return (
    <Slideshow
      slides={slides}
      style="cascade"
      cascadeSubdivisions={20}
      aspectRatio={16 / 9}
      autoPlay
      loop
    />
  )
}`}</pre>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textTransform: 'none' }}>6 Transition Styles</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Choose from Cascade, Carousel, Cube, Flip, Wave, and Zoom transitions
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textTransform: 'none' }}>Cascading Grid Effect</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Stunning 3D cube grid with diagonal wave animation and configurable subdivisions
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textTransform: 'none' }}>Flexible Aspect Ratios</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Configure aspect ratios (16:9, 4:3, 3:2, 1:1) to match your content
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textTransform: 'none' }}>Touch & Keyboard</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Swipe support on touch devices and arrow key navigation
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textTransform: 'none' }}>TypeScript</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Full TypeScript support with exported types
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textTransform: 'none' }}>Ref API</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Programmatic control with next(), prev(), and goTo() methods
            </p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>Built with React, Three.js, and @react-three/fiber</p>
      </footer>
    </div>
  )
}

export default App
