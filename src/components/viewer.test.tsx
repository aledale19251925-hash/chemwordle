import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// ── Mock 3dmol ────────────────────────────────────────────────────────────────

const mockViewer = {
  addModel: vi.fn(),
  setStyle: vi.fn(),
  zoomTo: vi.fn(),
  render: vi.fn(),
  rotate: vi.fn(),
  clear: vi.fn(),
}

vi.mock('3dmol', () => ({
  createViewer: vi.fn(() => mockViewer),
}))

// ── Mock requestAnimationFrame ────────────────────────────────────────────────

vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
vi.stubGlobal('cancelAnimationFrame', vi.fn())

// ── Imports ───────────────────────────────────────────────────────────────────

import { MoleculeViewer3D } from './MoleculeViewer3D'
import { AlphabetFeedback } from './AlphabetFeedback'

// ── fetch mock helper ─────────────────────────────────────────────────────────

function mockFetchOk(body = 'SDF_DATA') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(body),
  }))
}

function mockFetchFail() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: () => Promise.resolve(''),
  }))
}

beforeEach(() => {
  mockFetchOk()
  Object.values(mockViewer).forEach(fn => (fn as ReturnType<typeof vi.fn>).mockClear())
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MoleculeViewer3D', () => {
  it('1 — mostra "Loading molecule..." inizialmente', () => {
    render(<MoleculeViewer3D pubchemCid={962} moleculeName="Water" />)
    expect(screen.getByText('Loading molecule...')).toBeInTheDocument()
  })

  it('2 — fetch chiamato con il CID corretto', async () => {
    render(<MoleculeViewer3D pubchemCid={962} moleculeName="Water" />)
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('/962/')
      )
    })
  })

  it('3 — mostra errore quando fetch fallisce', async () => {
    mockFetchFail()
    render(<MoleculeViewer3D pubchemCid={962} moleculeName="Water" />)
    await waitFor(() => {
      expect(screen.getByText(/Could not load molecule structure/i)).toBeInTheDocument()
    })
  })
})

describe('AlphabetFeedback', () => {
  it('4 — mostra tutte le 26 lettere', () => {
    render(<AlphabetFeedback keyStatuses={{}} />)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    for (const letter of alphabet) {
      expect(screen.getByText(letter)).toBeInTheDocument()
    }
  })

  it('5 — colora correttamente le lettere con status', () => {
    render(<AlphabetFeedback keyStatuses={{ W: 'correct', A: 'present', T: 'absent' }} />)
    const w = screen.getByText('W')
    const a = screen.getByText('A')
    const t = screen.getByText('T')
    const wStyle = w.getAttribute('style') ?? w.parentElement?.getAttribute('style') ?? ''
    const aStyle = a.getAttribute('style') ?? a.parentElement?.getAttribute('style') ?? ''
    const tStyle = t.getAttribute('style') ?? t.parentElement?.getAttribute('style') ?? ''
    // JSDOM normalizes hex colors to rgb()
    expect(wStyle).toContain('rgb(22, 163, 74)')   // #16a34a = correct
    expect(aStyle).toContain('rgb(217, 119, 6)')   // #d97706 = present
    expect(tStyle).toContain('rgb(209, 213, 219)')  // #d1d5db = absent
  })

  it('6 — i chip non hanno onClick (solo visualizzazione)', () => {
    render(<AlphabetFeedback keyStatuses={{}} />)
    const chips = screen.getAllByText(/^[A-Z]$/)
    for (const chip of chips) {
      expect(chip.onclick).toBeNull()
    }
  })
})
