import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL. Add your Convex deployment URL to the app environment and restart Expo.");
}

export const convex = new ConvexReactClient(convexUrl);
