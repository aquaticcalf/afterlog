export type UUID = string & { readonly __brand: unique symbol }

export const generateID = (): UUID => {
  // every js environment ideally has the crypto lib
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID() as UUID
  }

  // fallback, if the env doesnt have it, we generate a uuid v4
  // https://datatracker.ietf.org/doc/html/rfc4122
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8 // if y => it must be 8, 9, a or b
    return v.toString(16)
  }) as UUID
}
