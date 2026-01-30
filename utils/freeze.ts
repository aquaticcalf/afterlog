/**
 * deep freezes an object to make it immutable.
 */
function freeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Reflect.ownKeys(obj) as (keyof T)[]

  for (const name of propNames) {
    const value = obj[name]

    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      freeze(value as object)
    }
  }

  return Object.freeze(obj)
}

export { freeze }
