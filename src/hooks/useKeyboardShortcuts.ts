import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export function useKeyboardShortcuts() {
  const {
    battleState,
    startBattle,
    pauseBattle,
    resumeBattle,
    resetBattle,
    setSpeed,
    initBattle,
  } = useGameStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return

      const phase = battleState?.phase

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (!battleState) {
            initBattle()
          } else if (phase === 'setup') {
            startBattle()
          } else if (phase === 'running') {
            pauseBattle()
          } else if (phase === 'paused') {
            resumeBattle()
          }
          break
        case '0': setSpeed(0.5); break
        case '1': setSpeed(1); break
        case '2': setSpeed(2); break
        case '3': setSpeed(4); break
        case '4': setSpeed(8); break
        case 'r':
        case 'R':
          if (battleState) resetBattle()
          break
        case 'Escape':
          useGameStore.getState().selectUnit(null)
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [battleState, startBattle, pauseBattle, resumeBattle, resetBattle, setSpeed, initBattle])
}
