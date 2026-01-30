/**
 * timing statistics when multiple operations use the same name.
 */
interface TimingStats {
  count: number
  total_ms: number
  min_ms: number
  max_ms: number
  avg_ms: number
}

/**
 * adds a timing to the stats map.
 */
function add(timings: Map<string, TimingStats>, name: string, duration: number): void {
  const existing = timings.get(name)

  if (!existing) {
    timings.set(name, {
      count: 1,
      total_ms: duration,
      min_ms: duration,
      max_ms: duration,
      avg_ms: duration,
    })
  } else {
    existing.count++
    existing.total_ms += duration
    existing.min_ms = Math.min(existing.min_ms, duration)
    existing.max_ms = Math.max(existing.max_ms, duration)
    existing.avg_ms = existing.total_ms / existing.count
  }
}

export { add }
export type { TimingStats }
