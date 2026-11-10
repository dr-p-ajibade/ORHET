import type { NextConfig } from "next";
const config: NextConfig = {
  async redirects() {
    return [
      { source: "/themes", destination: "/archive", permanent: true },
      { source: "/browse", destination: "/search", permanent: true },
    ];
  },
};
export default config;
