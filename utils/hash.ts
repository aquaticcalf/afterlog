/**
 * simple deterministic hash function (djb2 variant)
 * used for consistent sampling based on trace_id
 */
function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    h = ((h << 5) - h + char) >>> 0
  }
  return h
}

export { hash }
