import { describe, test, expect } from "bun:test"
import { generateID } from "@/utils/id"

describe("generateID with bun", () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  test("uses native crypto.randomUUID when available", () => {
    const id = generateID()

    expect(id).toMatch(uuidRegex)
    expect(id.length).toBe(36)
  })

  test("uses fallback regex logic when crypto is undefined", () => {
    const originalCrypto = globalThis.crypto

    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      writable: true,
    })

    try {
      const id = generateID()

      expect(id).toMatch(uuidRegex)
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        writable: false,
      })
    }
  })

  test("generates unique IDs", () => {
    const ids = new Set()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      ids.add(generateID())
    }

    expect(ids.size).toBe(iterations)
  })
})
