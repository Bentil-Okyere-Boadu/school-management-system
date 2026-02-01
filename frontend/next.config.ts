import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        pathname: '/api/v1/image/assets/**',
      },
      {
        protocol: 'https',
        hostname: `${process.env.NEXT_PUBLIC_AWS_BUCKET_URL}`,
      },
    ],
  },
  headers: async () => {
    return [
      {
      "source": "/api/v1/(.*)",
      "headers": [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Set your origin
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Allow-Credentials", 
            value: "true" 
          }
      ]
    }
    ]
  },
  rewrites: async () => [
    {
      source: "/api/v1/:path*",
      destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
    }
  ]
};

export default nextConfig;
