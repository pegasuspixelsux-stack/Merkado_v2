import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones and other devices on your Wi-Fi load the dev server (http://<your-ip>:3000).
  // Without this, Next.js blocks its dev scripts for any host except localhost, the page
  // never hydrates, and buttons and links added by JavaScript don't work. Dev only.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
