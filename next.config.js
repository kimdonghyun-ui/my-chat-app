/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['res.cloudinary.com'], // ✅ Cloudinary 이미지 도메인 허용
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",             // 프론트에서 /api/로 시작하는 요청은
        destination: `${process.env.NEXT_PUBLIC_API_SERVER_URL}/:path*`, // Strapi 서버로 전달
      },
    ];
  },
}

module.exports = nextConfig