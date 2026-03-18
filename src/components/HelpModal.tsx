import { motion, AnimatePresence } from 'framer-motion'

interface HelpModalProps {
  visible: boolean
  onClose: () => void
}

export function HelpModal({ visible, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="help-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            } as React.CSSProperties}
          />
          <motion.div
            key="help-card"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 41,
              backgroundColor: '#111a11',
              border: '1px solid #2d5a2d',
              borderRadius: 20,
              padding: 24,
              maxWidth: 360,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Close button */}
            <button
              aria-label="Close help"
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4a5a4a', fontSize: 22, lineHeight: 1, padding: '2px 6px',
              }}
            >×</button>

            {/* Title */}
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ade80', textAlign: 'center' }}>
              How to Play
            </div>

            {/* Rules text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ color: '#e8f5e8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Guess the <strong style={{ color: '#4ade80' }}>chemical compound</strong>{' '}
                name in 6 tries.
              </p>
              <p style={{ color: '#e8f5e8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Each guess must be a <strong style={{ color: '#4ade80' }}>valid compound name</strong>{' '}
                from our chemistry database.
              </p>
            </div>

            {/* Tile examples */}
            <div>
              {/* Correct */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: '#15803d', border: '2px solid #15803d',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 900, color: '#ffffff', flexShrink: 0,
                }}>H</div>
                <span style={{ color: '#e8f5e8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  H is in the correct spot
                </span>
              </div>

              {/* Present */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: '#854d0e', border: '2px solid #854d0e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 900, color: '#ffffff', flexShrink: 0,
                }}>O</div>
                <span style={{ color: '#e8f5e8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  O is in the word but in the wrong spot
                </span>
              </div>

              {/* Absent */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: '#1e1e1e', border: '2px solid #404040',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 900, color: '#888888', flexShrink: 0,
                }}>N</div>
                <span style={{ color: '#e8f5e8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  N is not in the word
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#1e3a1e', width: '100%' }} />

            {/* Daily message */}
            <p style={{ color: '#6b9e6b', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
              🧪 A new molecule every day at midnight!
            </p>

            {/* Got it button */}
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: 44,
                background: '#166534', border: 'none', borderRadius: 50,
                color: '#4ade80', fontSize: '0.9rem', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Got it!
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
