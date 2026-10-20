import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // THE SCREEN COMES OUT OF THE CARD.
  //
  // "They tap on it, it comes out at the top, it's like another screen."
  // That is a view transition: the browser takes a picture of the page
  // before and after, and morphs between them, so the photo you tapped IS
  // the photo at the top of the next screen rather than a different photo
  // that happens to arrive there.
  //
  // Next wraps every client navigation in document.startViewTransition when
  // this is on. A browser without the API ignores all of it and navigates
  // the way it already did, so there is nothing to feature-detect.
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
