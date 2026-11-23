/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // npm run dev:mock は .next-mock に出力する。通常の dev と同時に動かしてもビルドがぶつからない
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
