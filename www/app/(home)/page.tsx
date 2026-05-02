import Link from "next/link"
import { gitConfig } from "@/lib/shared"

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <title>afterlog</title>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        afterlog <span aria-hidden>📋</span>
      </h1>
      <p className="mt-4 text-base text-center text-fd-muted-foreground sm:text-lg">
        Structured logging for TypeScript - one JSON object per request
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/docs"
          className="inline-flex items-center justify-center rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
        >
          Read the docs
        </Link>
        <a
          href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
        >
          GitHub
        </a>
      </div>
    </div>
  )
}
