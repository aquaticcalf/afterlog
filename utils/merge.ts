/**
 * deep merges source into target.
 * - nested objects are recursively merged
 * - arrays are replaced, not concatenated
 * - undefined values are ignored
 * - null values replace the target
 */
function deep<T>(target: T, source: unknown): T {
  if (source === undefined) {
    return target
  }

  if (source === null) {
    return null as T
  }

  if (typeof source !== "object" || Array.isArray(source)) {
    return source as T
  }

  if (typeof target !== "object" || target === null || Array.isArray(target)) {
    return source as T
  }

  const result = { ...target } as Record<string, unknown>

  for (const key of Object.keys(source as object)) {
    const sourceValue = (source as Record<string, unknown>)[key]

    if (sourceValue === undefined) {
      continue
    }

    result[key] = deep(result[key], sourceValue)
  }

  return result as T
}

export { deep }
