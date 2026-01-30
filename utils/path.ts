/**
 * get nested value from object by dot-separated path
 */
function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

export { get }
