import { it, expect, describe } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

describe('deploy-check', () => {

  // TEST 1 — vercel.json esiste ed è JSON valido
  it('vercel.json exists and is valid JSON', () => {
    const p = resolve('vercel.json')
    expect(existsSync(p)).toBe(true)
    expect(() => JSON.parse(readFileSync(p, 'utf-8'))).not.toThrow()
  })

  // TEST 2 — vercel.json ha il rewrite SPA
  it('vercel.json has SPA rewrite rule', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf-8'))
    expect(config.rewrites).toBeDefined()
    const spaRewrite = config.rewrites.find(
      (r: any) => r.destination === '/index.html'
    )
    expect(spaRewrite).toBeDefined()
  })

  // TEST 3 — vercel.json ha header no-cache per sw.js
  it('vercel.json has no-cache header for sw.js', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf-8'))
    expect(config.headers).toBeDefined()
    const swHeader = config.headers.find((h: any) => h.source === '/sw.js')
    expect(swHeader).toBeDefined()
    const cacheControl = swHeader.headers.find((h: any) => h.key === 'Cache-Control')
    expect(cacheControl?.value).toContain('no-cache')
  })

  // TEST 4 — .gitignore contiene dist/ e node_modules/
  it('.gitignore excludes dist and node_modules', () => {
    const p = resolve('.gitignore')
    expect(existsSync(p)).toBe(true)
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('dist/')
    expect(content).toContain('node_modules/')
  })

  // TEST 5 — package.json ha script preview
  it('package.json has preview script', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
    expect(pkg.scripts?.preview).toBeDefined()
    expect(pkg.scripts.preview).toContain('vite preview')
  })

  // TEST 6 — package.json ha script build con tsc
  it('package.json build script includes tsc', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
    expect(pkg.scripts?.build).toBeDefined()
    expect(pkg.scripts.build).toContain('tsc')
  })

  // TEST 7 — vite.config.ts contiene base: '/'
  it("vite.config.ts has base: '/'", () => {
    const content = readFileSync('vite.config.ts', 'utf-8')
    expect(content).toMatch(/base:\s*['"]\/['"]/)
  })

  // TEST 8 — dist/ esiste dopo il build
  it('dist/ directory exists after build', () => {
    expect(existsSync(resolve('dist'))).toBe(true)
    expect(existsSync(resolve('dist/index.html'))).toBe(true)
  })

  // TEST 9 — dist/ contiene manifest.webmanifest
  it('dist has manifest.webmanifest', () => {
    expect(existsSync(resolve('dist/manifest.webmanifest'))).toBe(true)
  })

  // TEST 10 — dist/ contiene sw.js
  it('dist has sw.js', () => {
    expect(existsSync(resolve('dist/sw.js'))).toBe(true)
  })

  // TEST 11 — dist/ contiene le icone PNG
  it('dist has PWA icons', () => {
    expect(existsSync(resolve('dist/icon-192.png'))).toBe(true)
    expect(existsSync(resolve('dist/icon-512.png'))).toBe(true)
  })

  // TEST 12 — dist/index.html referenzia apple-touch-icon
  it('dist/index.html has apple-touch-icon', () => {
    const html = readFileSync(resolve('dist/index.html'), 'utf-8')
    expect(html).toContain('apple-touch-icon')
  })
})
