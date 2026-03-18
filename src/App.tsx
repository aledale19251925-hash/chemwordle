import { useState, useEffect } from 'react'
import { useGame } from './hooks/useGame'
import { useWindowWidth } from './hooks/useWindowWidth'
import { Header } from './components/Header'
import { GameBoard } from './components/GameBoard'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { Modal } from './components/Modal'
import { StatsModal } from './components/StatsModal'
import { HelpModal } from './components/HelpModal'

export default function App() {

  // ── Game state (unica fonte di verità) ──────────────────
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
    soundEnabled,
    toggleSound,
    addLetter,
    deleteLetter,
    submitGuess,
    closeModal,
    openStatsModal,
    closeStatsModal,
  } = useGame()

  // ── Stato locale: Help modal ────────────────────────────
  const [rulesOpen, setRulesOpen] = useState(false)

  // ── Responsive tile size ────────────────────────────────
  const windowWidth = useWindowWidth()
  const tileSize = windowWidth < 380 ? 44 : 52

  // ── vh fix per mobile (100dvh fallback) ─────────────────
  useEffect(() => {
    function setVh() {
      document.documentElement.style.setProperty(
        '--vh', `${window.innerHeight * 0.01}px`
      )
    }
    setVh()
    window.addEventListener('resize', setVh, { passive: true })
    return () => window.removeEventListener('resize', setVh)
  }, [])

  // ── Calcolo dati derivati ───────────────────────────────
  const target = gameState.target
  const wordLength = target.length
  const currentRowIndex = gameState.guesses.length
  const invalidGuess = invalidRow === currentRowIndex

  // ── Render ──────────────────────────────────────────────
  return (
    <div style={{
      height: 'calc(var(--vh, 1vh) * 100)',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0f0a',
      overflow: 'hidden',
    }}>

      {/* ── HEADER ── */}
      <Header
        streak={stats.currentStreak}
        dayNumber={gameState.dayIndex}
        onStatsClick={openStatsModal}
        onHelpClick={() => setRulesOpen(true)}
      />

      {/* ── GAME BOARD ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '0 8px',
      }}>
        <GameBoard
          guesses={gameState.guesses}
          feedbacks={gameState.feedbacks}
          currentGuess={currentGuess}
          wordLength={wordLength}
          target={target}
          gameStatus={gameState.status}
          invalidGuess={invalidGuess}
          tileSize={tileSize}
        />
      </div>

      {/* ── KEYBOARD ── */}
      <div style={{ height: 168, flexShrink: 0 }}>
        <Keyboard
          onKey={addLetter}
          onEnter={submitGuess}
          onDelete={deleteLetter}
          keyStatuses={keyboardStatuses}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      </div>

      {/* ── TOAST ── */}
      <Toast
        message={toastMessage}
        fading={toastFading}
      />

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

      {/* ── HELP / RULES MODAL ── */}
      <HelpModal
        visible={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  )
}
