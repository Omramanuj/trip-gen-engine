/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The trip JSON lives one level up in ../output and is read at request time
  // by src/engine/load.ts (server-only fs). Nothing to configure for that here.
  //
  // The project ships no working ESLint setup (the default parser can't read TS
  // `import type` syntax — it errors on pre-existing files too), so don't fail the
  // build on lint. Type-safety is still enforced via `tsc --noEmit`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
