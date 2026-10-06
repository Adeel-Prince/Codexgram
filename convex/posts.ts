import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { ensureProfile, publicProfile, requireProfile } from "./lib/profiles";

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

const postItemValidator = v.object({
  _id: v.id("posts"),
  caption: v.union(v.string(), v.null()),
  mediaType: v.union(v.literal("image"), v.literal("video")),
  mediaUrl: v.union(v.string(), v.null()),
  contentType: v.string(),
  durationMs: v.union(v.number(), v.null()),
  createdAt: v.number(),
  likesCount: v.number(),
  commentsCount: v.number(),
  likedByMe: v.boolean(),
  author: authorValidator,
});

async function toPostItem(ctx: Parameters<typeof requireProfile>[0], post: Doc<"posts">, currentProfileId: Doc<"profiles">["_id"]) {
  const [author, mediaUrl, like] = await Promise.all([
    ctx.db.get(post.authorId),
    ctx.storage.getUrl(post.storageId),
    ctx.db.query("likes").withIndex("by_post_and_user", (q) => q.eq("postId", post._id).eq("userId", currentProfileId)).unique(),
  ]);
  if (!author) return null;
  return {
    _id: post._id,
    caption: post.caption ?? null,
    mediaType: post.mediaType,
    mediaUrl,
    contentType: post.contentType,
    durationMs: post.durationMs ?? null,
    createdAt: post.createdAt,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    likedByMe: Boolean(like),
    author: publicProfile(author),
  };
}

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
    mediaType: v.union(v.literal("image"), v.literal("video")),
    contentType: v.string(),
    caption: v.string(),
    durationMs: v.optional(v.number()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const profile = await ensureProfile(ctx);
    const file = await ctx.db.system.get("_storage", args.storageId);
    if (!file) throw new Error("The uploaded media could not be found. Please choose it again.");
    const maxBytes = args.mediaType === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(args.mediaType === "image" ? "Images must be 10 MB or smaller." : "Videos must be 50 MB or smaller.");
    }
    const typePrefix = args.mediaType === "image" ? "image/" : "video/";
    const contentType = file.contentType || args.contentType;
    if (!contentType.startsWith(typePrefix)) throw new Error("That media format is not supported.");
    if (args.mediaType === "video" && (!args.durationMs || args.durationMs > 60_000)) {
      throw new Error("Videos must be 60 seconds or shorter.");
    }

    const caption = args.caption.trim();
    if (caption.length > 2_200) throw new Error("Captions must be 2,200 characters or fewer.");
    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      authorId: profile._id,
      storageId: args.storageId,
      mediaType: args.mediaType,
      contentType,
      ...(caption ? { caption } : {}),
      ...(args.mediaType === "video" ? { durationMs: args.durationMs } : {}),
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(profile._id, { postCount: profile.postCount + 1, updatedAt: now });
    return postId;
  },
});

export const explore = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(postItemValidator),
  handler: async (ctx, args) => {
    const { profile } = await requireProfile(ctx);
    const page = await ctx.db.query("posts").withIndex("by_created_at").order("desc").paginate(args.paginationOpts);
    const posts = await Promise.all(page.page.map((post) => toPostItem(ctx, post, profile._id)));
    return { ...page, page: posts.filter((post) => post !== null) };
  },
});

export const homeFeed = query({
  args: {},
  returns: v.array(postItemValidator),
  handler: async (ctx) => {
    const { profile } = await requireProfile(ctx);
    const follows = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", profile._id)).order("desc").take(50);
    const authorIds = [profile._id, ...follows.map((follow) => follow.followedId)];
    const batches = await Promise.all(authorIds.map((authorId) =>
      ctx.db.query("posts").withIndex("by_author_and_created_at", (q) => q.eq("authorId", authorId)).order("desc").take(10),
    ));
    const latest = batches.flat().sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);
    const posts = await Promise.all(latest.map((post) => toPostItem(ctx, post, profile._id)));
    return posts.filter((post) => post !== null);
  },
});

export const byProfile = query({
  args: { profileId: v.id("profiles"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(postItemValidator),
  handler: async (ctx, args) => {
    const { profile } = await requireProfile(ctx);
    const page = await ctx.db
      .query("posts")
      .withIndex("by_author_and_created_at", (q) => q.eq("authorId", args.profileId))
      .order("desc")
      .paginate(args.paginationOpts);
    const posts = await Promise.all(page.page.map((post) => toPostItem(ctx, post, profile._id)));
    return { ...page, page: posts.filter((post) => post !== null) };
  },
});
