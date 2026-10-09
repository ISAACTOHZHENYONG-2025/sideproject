import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Venue photos are the only images we optimise. Any other local path returns 400, so add it
    // here before pointing next/image at it.
    localPatterns: [{ pathname: "/venues/**", search: "" }],
  },
};

export default nextConfig;
