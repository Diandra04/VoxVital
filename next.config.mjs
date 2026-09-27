import os from 'os';

// allow phones on the LAN to load the dev server
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i?.family === 'IPv4' && !i.internal)
  .map((i) => i.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  agentRules: false,
  allowedDevOrigins: lanAddresses,
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
