/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  agentRules: false,
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    return [
      {
        source: '/kiosk.html',
        destination: '/kiosk',
      },
      {
        source: '/nurse.html',
        destination: '/nurse',
      },
      {
        source: '/status.html',
        destination: '/status',
      },
    ];
  },
};

export default nextConfig;
