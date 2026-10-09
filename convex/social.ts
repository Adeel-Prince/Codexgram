import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureProfile, publicProfile, requireProfile } from "./lib/profiles";

const commentValidator = v.object({
  _id: v.id("comments"),
  body: v.string(),
  createdAt: v.number(),
  canDelete: v.boolean(),
  author: v.object({
    _id: v.id("profiles"),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    bio: v.union(v.string(), v.null()),
    followerCount: v.number(),
    followingCount: v.number(),
    postCount: v.number(),
  }),
});

export const setLike = mutation({
  args: { postId: v.id("posts"), liked: v.boolean() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const profile = await ensureProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("This post is no longer available.");
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) => q.eq("postId", args.postId).eq("userId", profile._id))
      .unique();

    if (args.liked && !existing) {
      await ctx.db.insert("likes", { postId: args.postId, userId: profile._id, createdAt: Date.now() });
      await ctx.db.patch(post._id, { likesCount: post.likesCount + 1, updatedAt: Date.now() });
    } else if (!args.liked && existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(post._id, { likesCount: Math.max(0, post.likesCount - 1), updatedAt: Date.now() });
    }
    return args.liked;
  },
});

export const setFollow = mutation({
  args: { profileId: v.id("profiles"), following: v.boolean() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await ensureProfile(ctx);
    const target = await ctx.db.get(args.profileId);
    if (!target) throw new Error("This profile is no longer available.");
    if (actor._id === target._id) throw new Error("You cannot follow your own profile.");
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_followed", (q) => q.eq("followerId", actor._id).eq("followedId", target._id))
      .unique();
    if (args.following && !existing) {
      const now = Date.now();
      await ctx.db.insert("follows", { followerId: actor._id, followedId: target._id, createdAt: now });
      await ctx.db.patch(actor._id, { followingCount: actor.followingCount + 1, updatedAt: now });
      await ctx.db.patch(target._id, { followerCount: target.followerCount + 1, updatedAt: now });
    } else if (!args.following && existing) {
      const now = Date.now();
      await ctx.db.delete(existing._id);
      await ctx.db.patch(actor._id, { followingCount: Math.max(0, actor.followingCount - 1), updatedAt: now });
      await ctx.db.patch(target._id, { followerCount: Math.max(0, target.followerCount - 1), updatedAt: now });
    }
    return args.following;
  },
});

export const comments = query({
  args: {
    postId: v.id("posts"),
    sort: v.union(v.literal("desc"), v.literal("asc")),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(commentValidator),
  handler: async (ctx, args) => {
    const { profile } = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("This post is no longer available.");
    const page = await ctx.db
      .query("comments")
      .withIndex("by_post_and_created_at", (q) => q.eq("postId", args.postId))
      .order(args.sort)
      .paginate(args.paginationOpts);
    const comments = await Promise.all(page.page.map(async (comment) => {
      const author = await ctx.db.get(comment.authorId);
      if (!author) return null;
      return {
        _id: comment._id,
        body: comment.body,
        createdAt: comment.createdAt,
        canDelete: comment.authorId === profile._id,
        author: publicProfile(author),
      };
    }));
    return { ...page, page: comments.filter((comment) => comment !== null) };
  },
});

export const addComment = mutation({
  args: { postId: v.id("posts"), body: v.string() },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    const profile = await ensureProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("This post is no longer available.");
    const body = args.body.trim();
    if (!body) throw new Error("Write a comment before sending.");
    if (body.length > 1_000) throw new Error("Comments must be 1,000 characters or fewer.");
    const now = Date.now();
    const commentId = await ctx.db.insert("comments", { postId: post._id, authorId: profile._id, body, createdAt: now });
    await ctx.db.patch(post._id, { commentsCount: post.commentsCount + 1, updatedAt: now });
    return commentId;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile } = await requireProfile(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return null;
    if (comment.authorId !== profile._id) throw new Error("You can only delete your own comments.");
    const post = await ctx.db.get(comment.postId);
    await ctx.db.delete(comment._id);
    if (post) await ctx.db.patch(post._id, { commentsCount: Math.max(0, post.commentsCount - 1), updatedAt: Date.now() });
    return null;
  },
});
