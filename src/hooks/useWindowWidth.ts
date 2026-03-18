import { useState, useEffect } from 'react'

export function useWindowWidth(): number {
  const [width, setWidth] = useState<number>(
    () => typeof window !== 'undefined' ? window.innerWidth : 390
  )

  useEffect(() => {
    function handleResize(): void {
      setWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}
