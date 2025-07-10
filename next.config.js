/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['res.cloudinary.com'], // ✅ Cloudinary 이미지 도메인 허용
  },
}

module.exports = nextConfig