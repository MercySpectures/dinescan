/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      },
      {
        protocol: "https",
        hostname: "placehold.co"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/auth/register",
        permanent: true
      },
      {
        source: "/auth/signup",
        destination: "/auth/register",
        permanent: true
      },
      {
        source: "/signin",
        destination: "/auth/login",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/:slug/dashboard",
        destination: "/dashboard?slug=:slug"
      },
      {
        source: "/:slug/dashboard/:path*",
        destination: "/dashboard/:path*?slug=:slug"
      }
    ];
  }
};

export default nextConfig;
