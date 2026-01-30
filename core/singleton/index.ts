import { Afterlog } from "@/core/singleton/main"
import { AfterlogNotConfiguredError } from "@/core/singleton/error"

const afterlog = new Afterlog()

export { afterlog, Afterlog, AfterlogNotConfiguredError }
export type { SingletonConfig } from "@/core/types/singleton"
