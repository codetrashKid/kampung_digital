/** @type {import('next').NextConfig} */
const nextConfig = {
  // Boleh diganti lewat NEXT_DIST_DIR agar `next build` tidak bentrok dengan `next dev` yang sedang jalan.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
