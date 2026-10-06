import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to continue.");
  return identity;
}

export async function getProfileForIdentity(ctx: QueryCtx | MutationCtx, tokenIdentifier: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

export async function requireProfile(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const profile = await getProfileForIdentity(ctx, identity.tokenIdentifier);
  if (!profile) throw new Error("Your profile is still being set up. Please try again.");
  return { identity, profile };
}

function usernameBase(value: string) {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "");
  return (cleaned || "member").slice(0, 23);
}

export async function ensureProfile(ctx: MutationCtx) {
  const identity = await requireIdentity(ctx);
  const existing = await getProfileForIdentity(ctx, identity.tokenIdentifier);
  if (existing) return existing;

  const displayName = identity.name?.trim() || identity.email?.split("@")[0] || "Codexgram member";
  const base = usernameBase(identity.name?.split(/\s+/)[0] || identity.email?.split("@")[0] || "member");
  const suffix = identity.tokenIdentifier.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-6).padStart(6, "0");
  let username = base;
  let normalizedUsername = username.toLowerCase();
  if (await ctx.db.query("profiles").withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", normalizedUsername)).unique()) {
    username = `${base.slice(0, 23)}.${suffix}`;
    normalizedUsername = username.toLowerCase();
  }

  const now = Date.now();
  const profileId = await ctx.db.insert("profiles", {
    tokenIdentifier: identity.tokenIdentifier,
    username,
    normalizedUsername,
    displayName,
    ...(typeof identity.picture === "string" ? { avatarUrl: identity.picture } : {}),
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Unable to create your profile.");
  return profile;
}

export function publicProfile(profile: Doc<"profiles">) {
  return {
    _id: profile._id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    postCount: profile.postCount,
  };
}
