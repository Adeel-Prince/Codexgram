import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { publicProfile, requireProfile } from "./lib/profiles";

const authorValidator = v.object({
  _id: v.id("profiles"),
  username: v.string(),
  displayName: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
  bio: v.union(v.string(), v.null()),
  followerCount: v.number(),
  followingCount: v.number(),
  postCount: v.number(),
});

const storyValidator = v.object({
  _id: v.id("stories"),
  author: authorValidator,
  mediaUrl: v.union(v.string(), v.null()),
  createdAt: v.number(),
  expiresAt: v.number(),
  isMine: v.boolean(),
});

export const active = query({
  args: {},
  returns: v.array(storyValidator),
  handler: async (ctx) => {
    const { profile } = await requireProfile(ctx);
    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expires_at", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(100);

    const activeStories = await Promise.all(stories.map(async (story) => {
      const [author, mediaUrl] = await Promise.all([
        ctx.db.get(story.authorId),
        ctx.storage.getUrl(story.storageId),
      ]);
      if (!author) return null;
      return {
        _id: story._id,
        author: publicProfile(author),
        mediaUrl,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        isMine: story.authorId === profile._id,
      };
    }));
    return activeStories.filter((story) => story !== null);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireProfile(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    contentType: v.string(),
  },
  returns: v.id("stories"),
  handler: async (ctx, args) => {
    const { profile } = await requireProfile(ctx);
    const file = await ctx.db.system.get("_storage", args.storageId);
    if (!file) throw new Error("The uploaded photo could not be found. Please choose it again.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Stories must be 10 MB or smaller.");
    const contentType = file.contentType || args.contentType;
    if (!contentType.startsWith("image/")) throw new Error("Stories must be photos.");

    const now = Date.now();
    return await ctx.db.insert("stories", {
      authorId: profile._id,
      storageId: args.storageId,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });
  },
});
