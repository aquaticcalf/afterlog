/**
 * error thrown when afterlog is not configured.
 */
class AfterlogNotConfiguredError extends Error {
  constructor() {
    super("afterlog not configured. call afterlog.configure() before using.")
    this.name = "AfterlogNotConfiguredError"
  }
}

export { AfterlogNotConfiguredError }
