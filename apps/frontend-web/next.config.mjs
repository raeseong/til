/** @type {import('next').NextConfig} */
const nextConfig = {
  // 로컬/배포 시 브라우저 요청 /api → Nest API로 프록시. CORS 없이 같은 오리진처럼 사용 가능.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
  },
  transpilePackages: ['@til/shared', '@til/ui'],
};

export default nextConfig;
