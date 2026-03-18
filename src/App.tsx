import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { getDailyMolecule } from './data/molecules'
import { Header } from './components/Header'
import { GameBoard } from './components/GameBoard'
import { Toast } from './components/Toast'
import { Modal } from './components/Modal'
import { StatsModal } from './components/StatsModal'
import { HelpModal } from './components/HelpModal'
import { MoleculeViewer3D } from './components/MoleculeViewer3D'
import { AlphabetFeedback } from './components/AlphabetFeedback'

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
    keyboardStatuses,
    closeModal,
    openStatsModal,
    closeStatsModal,
    addLetter,
    deleteLetter,
    submitGuess,
    inputRef,
  } = useGame()

  // ── Stato locale: Help modal ────────────────────────────
  const [rulesOpen, setRulesOpen] = useState(false)

  // ── Dati derivati ───────────────────────────────────────
  const mol = getDailyMolecule()
  const target = gameState.target
  const wordLength = target.length
  const currentRowIndex = gameState.guesses.length
  const invalidGuess = invalidRow === currentRowIndex

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fdf8',
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

      {/* ── GAME BOARD ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '8px',
      }}>
        <GameBoard
          guesses={gameState.guesses}
          feedbacks={gameState.feedbacks}
          currentGuess={currentGuess}
          wordLength={wordLength}
          target={target}
          gameStatus={gameState.status}
          invalidGuess={invalidGuess}
        />
      </div>

      {/* ── ALFABETO FEEDBACK ── */}
      <div style={{ flexShrink: 0, paddingBottom: 8 }}>
        <AlphabetFeedback keyStatuses={keyboardStatuses} />
      </div>

      {/* ── TOAST ── */}
      <Toast message={toastMessage} fading={toastFading} />

      {/* ── RESULT MODAL ── */}
      <Modal
        visible={showModal && (gameState.status === 'won' || gameState.status === 'lost')}
        gameStatus={gameState.status as 'won' | 'lost'}
        molecule={gameState.revealedMolecule}
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
