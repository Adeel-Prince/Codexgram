import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, env, internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const cleanupPhase = v.union(
  v.literal("commentsByAuthor"),
  v.literal("likesByUser"),
  v.literal("following"),
  v.literal("followers"),
  v.literal("stories"),
  v.literal("posts"),
);

type CleanupPhase = "commentsByAuthor" | "likesByUser" | "following" | "followers" | "stories" | "posts";
const BATCH_SIZE = 50;

export const profileForIdentity = internalQuery({
  args: { tokenIdentifier: v.string() },
  returns: v.union(v.id("profiles"), v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    return profile?._id ?? null;
  },
});

export const deleteMyAccount = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in again before deleting your account.");

    const profileId = await ctx.runQuery(internal.accountDeletion.profileForIdentity, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!profileId) throw new Error("Your Codexgram profile could not be found.");

    const secretKey = env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error("Account deletion is not configured. Please contact support.");

    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(identity.subject)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!clerkResponse.ok) {
      throw new Error("Clerk could not delete your account. Please try again.");
    }

    await ctx.runMutation(internal.accountDeletion.startCleanup, { profileId });
    return null;
  },
});

export const startCleanup = internalMutation({
  args: { profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.accountDeletion.cleanupBatch, {
      profileId: args.profileId,
      phase: "commentsByAuthor",
    });
    return null;
  },
});

export const cleanupBatch = internalMutation({
  args: { profileId: v.id("profiles"), phase: cleanupPhase },
  returns: v.null(),
  handler: async (ctx, { profileId, phase }) => {
    const schedule = async (nextPhase: CleanupPhase) => {
      await ctx.scheduler.runAfter(0, internal.accountDeletion.cleanupBatch, { profileId, phase: nextPhase });
    };

    if (phase === "commentsByAuthor") {
      const comments = await ctx.db.query("comments")
        .withIndex("by_author", (q) => q.eq("authorId", profileId))
        .take(BATCH_SIZE + 1);
      const batch = comments.slice(0, BATCH_SIZE);
      const counts = new Map<Id<"posts">, number>();
      for (const comment of batch) {
        counts.set(comment.postId, (counts.get(comment.postId) ?? 0) + 1);
        await ctx.db.delete(comment._id);
      }
      for (const [postId, count] of counts) {
        const post = await ctx.db.get(postId);
        if (post) await ctx.db.patch(postId, { commentsCount: Math.max(0, post.commentsCount - count), updatedAt: Date.now() });
      }
      await schedule(comments.length > BATCH_SIZE ? phase : "likesByUser");
      return null;
    }

    if (phase === "likesByUser") {
      const likes = await ctx.db.query("likes")
        .withIndex("by_user_and_post", (q) => q.eq("userId", profileId))
        .take(BATCH_SIZE + 1);
      const batch = likes.slice(0, BATCH_SIZE);
      const counts = new Map<Id<"posts">, number>();
      for (const like of batch) {
        counts.set(like.postId, (counts.get(like.postId) ?? 0) + 1);
        await ctx.db.delete(like._id);
      }
      for (const [postId, count] of counts) {
        const post = await ctx.db.get(postId);
        if (post) await ctx.db.patch(postId, { likesCount: Math.max(0, post.likesCount - count), updatedAt: Date.now() });
      }
      await schedule(likes.length > BATCH_SIZE ? phase : "following");
      return null;
    }

    if (phase === "following") {
      const follows = await ctx.db.query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", profileId))
        .take(BATCH_SIZE + 1);
      for (const follow of follows.slice(0, BATCH_SIZE)) {
        await ctx.db.delete(follow._id);
        const target = await ctx.db.get(follow.followedId);
        if (target) await ctx.db.patch(target._id, { followerCount: Math.max(0, target.followerCount - 1), updatedAt: Date.now() });
      }
      await schedule(follows.length > BATCH_SIZE ? phase : "followers");
      return null;
    }

    if (phase === "followers") {
      const follows = await ctx.db.query("follows")
        .withIndex("by_followed", (q) => q.eq("followedId", profileId))
        .take(BATCH_SIZE + 1);
      for (const follow of follows.slice(0, BATCH_SIZE)) {
        await ctx.db.delete(follow._id);
        const follower = await ctx.db.get(follow.followerId);
        if (follower) await ctx.db.patch(follower._id, { followingCount: Math.max(0, follower.followingCount - 1), updatedAt: Date.now() });
      }
      await schedule(follows.length > BATCH_SIZE ? phase : "stories");
      return null;
    }

    if (phase === "stories") {
      const stories = await ctx.db.query("stories")
        .withIndex("by_author_and_created_at", (q) => q.eq("authorId", profileId))
        .take(BATCH_SIZE + 1);
      for (const story of stories.slice(0, BATCH_SIZE)) {
        await ctx.storage.delete(story.storageId);
        await ctx.db.delete(story._id);
      }
      await schedule(stories.length > BATCH_SIZE ? phase : "posts");
      return null;
    }

    const posts = await ctx.db.query("posts")
      .withIndex("by_author_and_created_at", (q) => q.eq("authorId", profileId))
      .take(1);
    const post = posts[0];
    if (!post) {
      await ctx.db.delete(profileId);
      return null;
    }

    const comments = await ctx.db.query("comments")
      .withIndex("by_post_and_created_at", (q) => q.eq("postId", post._id))
      .take(BATCH_SIZE + 1);
    for (const comment of comments.slice(0, BATCH_SIZE)) await ctx.db.delete(comment._id);
    if (comments.length > BATCH_SIZE) {
      await schedule("posts");
      return null;
    }

    const likes = await ctx.db.query("likes")
      .withIndex("by_post_and_user", (q) => q.eq("postId", post._id))
      .take(BATCH_SIZE + 1);
    for (const like of likes.slice(0, BATCH_SIZE)) await ctx.db.delete(like._id);
    if (likes.length > BATCH_SIZE) {
      await schedule("posts");
      return null;
    }

    await ctx.storage.delete(post.storageId);
    await ctx.db.delete(post._id);
    await schedule("posts");
    return null;
  },
});
