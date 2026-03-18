import { useState, useEffect } from 'react'
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
  } = useGame()

  // ── Stato locale: Help modal ────────────────────────────
  const [rulesOpen, setRulesOpen] = useState(false)

  // ── vh fix per mobile ───────────────────────────────────
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

  // ── Dati derivati ───────────────────────────────────────
  const mol = getDailyMolecule()
  const target = gameState.target
  const wordLength = target.length
  const currentRowIndex = gameState.guesses.length
  const invalidGuess = invalidRow === currentRowIndex

  return (
    <div style={{
      height: 'calc(var(--vh, 1vh) * 100)',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fdf8',
      overflow: 'hidden',
    }}>

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
