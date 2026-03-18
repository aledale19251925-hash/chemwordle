import { useEffect, useRef, useState } from 'react'

interface MoleculeViewer3DProps {
  pubchemCid: number
  moleculeName: string
}

async function fetchMolecule(cid: number): Promise<string> {
  const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
  const res = await fetch(url3d)
  if (res.ok) return res.text()
  // Fallback to 2D SDF
  const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`
  const res2 = await fetch(url2d)
  if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
  return res2.text()
}

function LoadingState() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, background: '#f0fdf4',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #dcfce7',
        borderTopColor: '#16a34a',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: '#16a34a', fontSize: '0.82rem' }}>
        Loading molecule...
      </span>
    </div>
  )
}

function ErrorState() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f0fdf4',
    }}>
      <span style={{ color: '#dc2626', fontSize: '0.82rem' }}>
        ⚠️ Could not load molecule structure
      </span>
    </div>
  )
}

export function MoleculeViewer3D({ pubchemCid, moleculeName }: MoleculeViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<any>(null)
  const animFrameRef = useRef<number>(0)
  const isRotatingRef = useRef<boolean>(true)
  const dragTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  function pauseRotation() {
    isRotatingRef.current = false
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current)
    dragTimerRef.current = setTimeout(() => {
      isRotatingRef.current = true
    }, 3000)
  }

  function startRotation(viewer: any) {
    isRotatingRef.current = true
    function frame() {
      if (isRotatingRef.current && viewer) {
        viewer.rotate(0.4, 'y')
        viewer.render()
      }
      animFrameRef.current = requestAnimationFrame(frame)
    }
    animFrameRef.current = requestAnimationFrame(frame)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const pause = () => pauseRotation()
    el.addEventListener('mousedown', pause)
    el.addEventListener('touchstart', pause, { passive: true })
    return () => {
      el.removeEventListener('mousedown', pause)
      el.removeEventListener('touchstart', pause)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    async function init() {
      try {
        const sdf = await fetchMolecule(pubchemCid)
        if (cancelled) return

        const $3Dmol = await import('3dmol')
        const viewer = $3Dmol.createViewer(containerRef.current!, {
          backgroundColor: '#f0fdf4',
          antialias: true,
          id: `viewer-${pubchemCid}`,
        })
        viewerRef.current = viewer

        viewer.addModel(sdf, 'sdf')
        viewer.setStyle({}, {
          stick: { radius: 0.12, colorscheme: 'Jmol' },
          sphere: { scale: 0.25, colorscheme: 'Jmol' },
        })
        viewer.zoomTo()
        viewer.render()
        startRotation(viewer)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError('Could not load molecule structure')
          setLoading(false)
        }
      }
    }

    init()
    return () => {
      cancelled = true
      cancelAnimationFrame(animFrameRef.current)
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current)
      viewerRef.current?.clear()
    }
  }, [pubchemCid])

  return (
    <div
      ref={containerRef}
      data-testid="molecule-viewer"
      aria-label={`3D structure of ${moleculeName}`}
      style={{
        width: '100%',
        height: 'min(40vh, 280px)',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#f0fdf4',
      }}
    >
      {loading && <LoadingState />}
      {error && <ErrorState />}
    </div>
  )
}
