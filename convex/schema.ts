import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    normalizedUsername: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    followerCount: v.number(),
    followingCount: v.number(),
    postCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_normalized_username", ["normalizedUsername"])
    .index("by_created_at", ["createdAt"]),

  follows: defineTable({
    followerId: v.id("profiles"),
    followedId: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_follower_and_followed", ["followerId", "followedId"])
    .index("by_follower", ["followerId"])
    .index("by_followed", ["followedId"]),

  posts: defineTable({
    authorId: v.id("profiles"),
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    contentType: v.string(),
    caption: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    likesCount: v.number(),
    commentsCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author_and_created_at", ["authorId", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_post_and_user", ["postId", "userId"])
    .index("by_user_and_post", ["userId", "postId"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("profiles"),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_post_and_created_at", ["postId", "createdAt"])
    .index("by_author", ["authorId"]),

  stories: defineTable({
    authorId: v.id("profiles"),
    storageId: v.id("_storage"),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_expires_at", ["expiresAt"])
    .index("by_author_and_created_at", ["authorId", "createdAt"]),
});
