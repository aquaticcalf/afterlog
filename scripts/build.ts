import { $ } from "bun"

await $`rm -rf ./dist`
await $`mkdir -p ./dist/types`

await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "bun",
  external: [],
  splitting: false,
  minify: true,
  sourcemap: "linked",
})

await $`tsc -p tsconfig.build.json`

console.log("build complete")
