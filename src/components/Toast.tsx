import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  message: string | null
  fading: boolean
}

export function Toast({ message, fading }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: fading ? 0 : 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={fading
            ? { duration: 0.3, ease: 'easeOut' }
            : { type: 'spring', stiffness: 350, damping: 25 }
          }
          style={{
            position: 'fixed',
            top: 66,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            pointerEvents: 'none',
            background: '#1a2e1a',
            border: '1px solid #2d5a2d',
            borderRadius: 50,
            padding: '10px 20px',
            color: '#e8f5e8',
            fontSize: '0.82rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
