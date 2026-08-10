import { useCallback, useRef, useState } from 'react'

const FREQUENCIES = { C6: 1046.5, D5: 587.33, D6: 1174.66, E6: 1318.51, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77 }

export function useBlipSound() {
  const [enabled, setEnabled] = useState(false)
  const audioContext = useRef(null)

  const blip = useCallback((note = 'C6') => {
    if (!enabled || !audioContext.current) return
    const context = audioContext.current
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = FREQUENCIES[note] || FREQUENCIES.C6
    gain.gain.setValueAtTime(0.05, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.08)
  }, [enabled])

  const toggle = useCallback(async () => {
    if (enabled) { setEnabled(false); return }
    try {
      audioContext.current ||= new AudioContext()
      await audioContext.current.resume()
      setEnabled(true)
    } catch { setEnabled(false) }
  }, [enabled])

  return { enabled, toggle, blip }
}
