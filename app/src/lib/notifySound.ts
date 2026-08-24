let ctx: AudioContext | null = null

/** Short two-tone beep for new-order alerts. No audio asset required. */
export function playNewOrderChime() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    ;[880, 1175].forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.14
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  } catch {
    // Audio not available (e.g. autoplay restrictions) — safe to ignore.
  }
}
