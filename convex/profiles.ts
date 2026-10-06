import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureProfile, publicProfile, requireProfile } from "./lib/profiles";

const publicProfileValidator = v.object({
  _id: v.id("profiles"),
  username: v.string(),
  displayName: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
  bio: v.union(v.string(), v.null()),
  followerCount: v.number(),
  followingCount: v.number(),
  postCount: v.number(),
});

export const ensureMyProfile = mutation({
  args: {},
  returns: publicProfileValidator,
  handler: async (ctx) => publicProfile(await ensureProfile(ctx)),
});

export const myProfile = query({
  args: {},
  returns: v.union(publicProfileValidator, v.null()),
  handler: async (ctx) => {
    const { profile } = await requireProfile(ctx);
    return publicProfile(profile);
  },
});

export const updateMyProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    bio: v.string(),
  },
  returns: publicProfileValidator,
  handler: async (ctx, args) => {
    const profile = await ensureProfile(ctx);
    const username = args.username.trim().replace(/^@+/, "").toLowerCase();
    const displayName = args.displayName.trim();
    const bio = args.bio.trim();
    if (!/^[a-z0-9._]{3,30}$/.test(username)) {
      throw new Error("Username must be 3–30 letters, numbers, periods, or underscores.");
    }
    if (!displayName || displayName.length > 80) throw new Error("Enter a display name up to 80 characters.");
    if (bio.length > 150) throw new Error("Bio must be 150 characters or fewer.");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", username))
      .unique();
    if (existing && existing._id !== profile._id) throw new Error("That username is already in use.");

    await ctx.db.patch(profile._id, {
      username,
      normalizedUsername: username,
      displayName,
      bio,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(profile._id);
    if (!updated) throw new Error("Your profile could not be updated.");
    return publicProfile(updated);
  },
});

export const suggestions = query({
  args: {},
  returns: v.array(v.object({ ...publicProfileValidator.fields, isFollowing: v.boolean() })),
  handler: async (ctx) => {
    const { profile } = await requireProfile(ctx);
    const candidates = await ctx.db.query("profiles").withIndex("by_created_at").order("desc").take(30);
    const results = [];
    for (const candidate of candidates) {
      if (candidate._id === profile._id) continue;
      const follow = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_followed", (q) => q.eq("followerId", profile._id).eq("followedId", candidate._id))
        .unique();
      results.push({ ...publicProfile(candidate), isFollowing: Boolean(follow) });
      if (results.length === 10) break;
    }
    return results;
  },
});
