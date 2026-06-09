/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The trip JSON lives in preview/output and is read at request time by
  // src/engine/load.ts (server-only fs). force-dynamic pages run as serverless
  // functions, so the files must be traced into the function bundle or fs.readdir
  // returns nothing in production.
  outputFileTracingIncludes: {
    "/**/*": ["./output/**/*"],
  },
  //
  // The project ships no working ESLint setup (the default parser can't read TS
  // `import type` syntax — it errors on pre-existing files too), so don't fail the
  // build on lint. Type-safety is still enforced via `tsc --noEmit`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
