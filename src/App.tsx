import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { useOnboarding } from './hooks/useOnboarding'
import { getDailyMolecule } from './data/molecules'
import { getAtomTypesFromFormula } from './utils/pubchem'
import { Header } from './components/Header'
import { SingleRowBoard } from './components/SingleRowBoard'
import { AtomLegend } from './components/AtomLegend'
import { Toast } from './components/Toast'
import { Modal } from './components/Modal'
import { StatsModal } from './components/StatsModal'
import { HelpModal } from './components/HelpModal'
import { MoleculeViewer3D } from './components/MoleculeViewer3D'
import { OnboardingModal } from './components/OnboardingModal'

export default function App() {

  // ── Game state ──────────────────────────────────────────
  const {
    gameState,
    stats,
    currentGuess,
    invalidRow,
    toastMessage,
    toastFading,
    showModal,
    showStatsModal,
    closeModal,
    openStatsModal,
    closeStatsModal,
    addLetter,
    deleteLetter,
    submitGuess,
    inputRef,
  } = useGame()

  // ── Local state: Help modal ─────────────────────────────
  const [rulesOpen, setRulesOpen] = useState(false)
  const { showOnboarding, dismissOnboarding } = useOnboarding()

  // ── Derived data ────────────────────────────────────────
  const mol = getDailyMolecule()
  const atomTypes = getAtomTypesFromFormula(mol.formula)
  const lastEntry = gameState.guessHistory[gameState.guessHistory.length - 1] ?? null

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#111111',
        color: '#ffffff',
        overflow: 'hidden',
      }}
      onClick={() => {
        if (gameState.status === 'playing') {
          inputRef.current?.focus()
        }
      }}
    >
      {/* Hidden input — keeps mobile keyboard accessible */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-hidden="true"
        style={{
          position: 'fixed',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
          top: 0,
          left: 0,
          zIndex: -1,
          fontSize: 16,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') { e.preventDefault(); deleteLetter() }
          else if (e.key === 'Enter') { e.preventDefault(); submitGuess() }
        }}
        onInput={(e) => {
          const input = e.currentTarget
          const value = input.value
          if (value.length > 0) {
            const lastChar = value[value.length - 1].toUpperCase()
            if (/^[A-Z]$/.test(lastChar)) addLetter(lastChar)
            input.value = ''
          }
        }}
      />

      {/* ── ONBOARDING ── */}
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      {/* ── HEADER ── */}
      <Header
        streak={stats.currentStreak}
        dayNumber={gameState.dayIndex}
        onStatsClick={openStatsModal}
        onHelpClick={() => setRulesOpen(true)}
      />

      {/* ── VIEWER 3D ── */}
      <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
        <MoleculeViewer3D
          pubchemCid={mol.pubchem_cid}
          moleculeName={mol.display_name}
        />
      </div>

      {/* ── ATOM LEGEND ── */}
      <div style={{ flexShrink: 0, padding: '6px 0 2px' }}>
        <AtomLegend atomTypes={atomTypes} />
      </div>

      {/* ── SINGLE ROW BOARD ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
      }}>
        <SingleRowBoard
          answer={gameState.answer}
          currentGuess={currentGuess}
          lockedLetters={gameState.lockedLetters}
          attemptNumber={gameState.attemptNumber}
          maxAttempts={gameState.maxAttempts}
          lastResults={lastEntry?.results ?? null}
          status={gameState.status}
          invalidGuess={invalidRow !== -1}
        />
      </div>

      {/* ── TOAST ── */}
      <Toast message={toastMessage} fading={toastFading} />

      {/* ── RESULT MODAL ── */}
      <Modal
        visible={showModal && (gameState.status === 'won' || gameState.status === 'lost')}
        gameStatus={gameState.status as 'won' | 'lost'}
        molecule={mol}
        gameState={gameState}
        stats={stats}
        onClose={closeModal}
      />

      {/* ── STATS MODAL ── */}
      <StatsModal
        visible={showStatsModal}
        stats={stats}
        currentGameState={gameState}
        onClose={closeStatsModal}
      />

      {/* ── HELP MODAL ── */}
      <HelpModal
        visible={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  )
}
