import { vi, it, expect, describe } from 'vitest'
import { existsSync, statSync, readFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

// ── Mock virtual:pwa-register before main.tsx import ─────────────────────────
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(() => vi.fn()),
}))

// ── Mock react-dom/client to prevent actual DOM rendering ────────────────────
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}))

// ── Mock App and CSS to prevent cascade of heavy imports ─────────────────────
vi.mock('./App', () => ({ default: () => null }))
vi.mock('./index.css', () => ({}))

describe('PWA', () => {

  // TEST 1 — registerSW viene chiamato al caricamento
  it('registerSW viene chiamato al caricamento del modulo main', async () => {
    const { registerSW } = await import('virtual:pwa-register')
    await import('./main')
    expect(registerSW).toHaveBeenCalledTimes(1)
    expect(registerSW).toHaveBeenCalledWith(
      expect.objectContaining({
        onNeedRefresh: expect.any(Function),
        onOfflineReady: expect.any(Function),
      })
    )
  })

  // TEST 2 — Icone esistono in public/
  it('icon-192.png exists and has content', () => {
    const p = resolve('public/icon-192.png')
    expect(existsSync(p)).toBe(true)
    expect(statSync(p).size).toBeGreaterThan(0)
  })

  it('icon-512.png exists and has content', () => {
    const p = resolve('public/icon-512.png')
    expect(existsSync(p)).toBe(true)
    expect(statSync(p).size).toBeGreaterThan(0)
  })

  // TEST 3 — generate-icons.js usa Sharp e produce PNG
  it('generate:icons script runs without error and produces PNGs', () => {
    ;['public/icon-192.png', 'public/icon-512.png'].forEach(f => {
      if (existsSync(f)) unlinkSync(f)
    })
    expect(() => execSync('npm run generate:icons', { stdio: 'pipe' })).not.toThrow()
    expect(existsSync('public/icon-192.png')).toBe(true)
    expect(existsSync('public/icon-512.png')).toBe(true)
  })

  // TEST 4 — vite-env.d.ts contiene riferimento pwa/client
  it('vite-env.d.ts includes vite-plugin-pwa/client reference', () => {
    const content = readFileSync('src/vite-env.d.ts', 'utf-8')
    expect(content).toContain('vite-plugin-pwa/client')
  })

  // TEST 5 — index.html contiene i meta tag Apple
  it('index.html has required PWA meta tags', () => {
    const html = readFileSync('index.html', 'utf-8')
    expect(html).toContain('apple-mobile-web-app-capable')
    expect(html).toContain('apple-mobile-web-app-status-bar-style')
    expect(html).toContain('apple-mobile-web-app-title')
    expect(html).toContain('apple-touch-icon')
    expect(html).toContain('theme-color')
  })
})
