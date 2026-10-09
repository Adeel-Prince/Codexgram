import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const seededPrefix = "demo:codexgram:v1:";

const members = [
  { key: "alex", username: "demo.alex", displayName: "Alex Rivera", bio: "Chasing mountain mornings and good coffee.", avatar: "photo-1500648767791-00dcc994a43e" },
  { key: "maya", username: "demo.maya", displayName: "Maya Brooks", bio: "Little moments, big memories.", avatar: "photo-1494790108377-be9c29b29330" },
  { key: "jordan", username: "demo.jordan", displayName: "Jordan Kim", bio: "Behind the camera whenever I can be.", avatar: "photo-1534528741775-53994a69daeb" },
  { key: "taylor", username: "demo.taylor", displayName: "Taylor Bennett", bio: "Finding the sunny side of every street.", avatar: "photo-1524504388940-b1c1722653e1" },
  { key: "casey", username: "demo.casey", displayName: "Casey Morgan", bio: "Weekend trails and open roads.", avatar: "photo-1506794778202-cad84cf45f1d" },
  { key: "sam", username: "demo.sam", displayName: "Sam Patel", bio: "Travel light. Take the long way.", avatar: "photo-1507003211169-0a1dd7228f2d" },
  { key: "nina", username: "demo.nina", displayName: "Nina Flores", bio: "Collecting colors, places, and stories.", avatar: "photo-1531123897727-8f129e1688ce" },
  { key: "leo", username: "demo.leo", displayName: "Leo Chen", bio: "Home cooking with a little adventure.", avatar: "photo-1507591064344-4c6ce005b128" },
  { key: "aria", username: "demo.aria", displayName: "Aria Wilson", bio: "Outside is my favorite place.", avatar: "photo-1529139574466-a303027c1d8b" },
  { key: "max", username: "demo.max", displayName: "Max Turner", bio: "City walks after the rain.", avatar: "photo-1504257432389-52343af06ae3" },
  { key: "zoe", username: "demo.zoe", displayName: "Zoe Parker", bio: "Dogs, beaches, and absolutely no plans.", avatar: "photo-1544005313-94ddf0286df2" },
  { key: "noah", username: "demo.noah", displayName: "Noah Davis", bio: "Making things and learning as I go.", avatar: "photo-1506277886164-e25aa3f4ef7f" },
  { key: "ella", username: "demo.ella", displayName: "Ella James", bio: "A new neighborhood every weekend.", avatar: "photo-1488426862026-3ee34a7d66df" },
  { key: "ryan", username: "demo.ryan", displayName: "Ryan Brooks", bio: "Early runs, late sunsets.", avatar: "photo-1506794778202-cad84cf45f1d" },
  { key: "ava", username: "demo.ava", displayName: "Ava Miller", bio: "Music on. Windows down.", avatar: "photo-1517841905240-472988babdf9" },
  { key: "liam", username: "demo.liam", displayName: "Liam Scott", bio: "Somewhere between here and there.", avatar: "photo-1501196354995-cbb51c65aaea" },
];

const mediaUrls = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?fit=crop&w=1000&q=78&fm=jpg",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?fit=crop&w=1000&q=78&fm=jpg",
];

const captions = [
  "A slower morning was exactly what I needed.",
  "Found this little spot completely by accident.",
  "The kind of view that makes you forget to check your phone.",
  "Saving this one for a rainy day.",
  "A few hours outside does wonders.",
  "Somewhere new, but somehow it feels familiar.",
  "Chasing the last bit of daylight.",
  "Proof that the detour was worth it.",
  "Weekend plans: take the scenic route.",
  "This color palette was doing all the work.",
  "A little fresh air and a lot of gratitude.",
  "Adding this to the list of places to revisit.",
  "No big plans, just a good day out.",
  "The light showed up right on time.",
  "A postcard from a very good afternoon.",
  "More days that end like this, please.",
];

const comments = [
  "This is such a good find!",
  "Adding this place to my list.",
  "That light is unreal.",
  "Would happily spend all day here.",
  "The colors in this are beautiful.",
  "Okay, now I need a weekend trip.",
  "This made me smile today.",
  "You always find the best spots.",
  "Already want to go back.",
  "A perfect little escape.",
  "Great shot!",
  "Saving this for inspiration.",
];

const resultValidator = v.object({
  seeded: v.boolean(),
  profiles: v.number(),
  posts: v.number(),
  likes: v.number(),
  comments: v.number(),
  follows: v.number(),
});

export const demoSeedExists = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", `${seededPrefix}${members[0].key}`))
      .unique();
    return profile !== null;
  },
});

export const insertDemoData = internalMutation({
  args: { storageIds: v.array(v.id("_storage")) },
  returns: resultValidator,
  handler: async (ctx, { storageIds }) => {
    const firstSeed = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", `${seededPrefix}${members[0].key}`))
      .unique();
    if (firstSeed) return { seeded: false, profiles: 0, posts: 0, likes: 0, comments: 0, follows: 0 };
    if (storageIds.length !== mediaUrls.length) throw new Error("The demo image set is incomplete.");

    const now = Date.now();
    const existingProfiles = await ctx.db.query("profiles").withIndex("by_created_at").order("desc").take(100);
    const appProfiles = existingProfiles.filter((profile) => !profile.tokenIdentifier.startsWith("demo:codexgram:"));

    const profileIds: Id<"profiles">[] = [];
    for (const member of members) {
      const existingUsername = await ctx.db
        .query("profiles")
        .withIndex("by_normalized_username", (q) => q.eq("normalizedUsername", member.username))
        .unique();
      if (existingUsername) throw new Error(`Demo username ${member.username} is already in use. Change the demo handles in convex/seed.ts and retry.`);
      profileIds.push(await ctx.db.insert("profiles", {
        tokenIdentifier: `${seededPrefix}${member.key}`,
        username: member.username,
        normalizedUsername: member.username,
        displayName: member.displayName,
        bio: member.bio,
        avatarUrl: `https://images.unsplash.com/${member.avatar}?auto=format&fit=crop&w=160&h=160&q=70`,
        followerCount: 0,
        followingCount: 0,
        postCount: 3,
        createdAt: now - profileIds.length * 60_000,
        updatedAt: now,
      }));
    }

    const followEdges = new Map<string, { followerId: Id<"profiles">; followedId: Id<"profiles"> }>();
    const addFollow = (followerId: Id<"profiles">, followedId: Id<"profiles">) => {
      if (followerId !== followedId) followEdges.set(`${followerId}|${followedId}`, { followerId, followedId });
    };
    for (let memberIndex = 0; memberIndex < profileIds.length; memberIndex += 1) {
      for (let step = 1; step <= 5; step += 1) {
        addFollow(profileIds[memberIndex], profileIds[(memberIndex + step * 3) % profileIds.length]);
      }
    }
    for (const appProfile of appProfiles) {
      for (let index = 0; index < Math.min(10, profileIds.length); index += 1) addFollow(appProfile._id, profileIds[index]);
    }
    appProfiles.slice(0, 5).forEach((appProfile, index) => {
      [0, 5, 10].forEach((offset) => addFollow(profileIds[(index + offset) % profileIds.length], appProfile._id));
    });

    const followers = new Map<Id<"profiles">, number>();
    const following = new Map<Id<"profiles">, number>();
    for (const edge of followEdges.values()) {
      await ctx.db.insert("follows", { ...edge, createdAt: now - (followers.size % 20) * 3_600_000 });
      following.set(edge.followerId, (following.get(edge.followerId) ?? 0) + 1);
      followers.set(edge.followedId, (followers.get(edge.followedId) ?? 0) + 1);
    }
    for (let index = 0; index < profileIds.length; index += 1) {
      await ctx.db.patch(profileIds[index], {
        followerCount: followers.get(profileIds[index]) ?? 0,
        followingCount: following.get(profileIds[index]) ?? 0,
      });
    }
    for (const profile of appProfiles) {
      const followerCount = followers.get(profile._id);
      const followingCount = following.get(profile._id);
      if (followerCount !== undefined || followingCount !== undefined) {
        await ctx.db.patch(profile._id, {
          ...(followerCount !== undefined ? { followerCount: profile.followerCount + followerCount } : {}),
          ...(followingCount !== undefined ? { followingCount: profile.followingCount + followingCount } : {}),
          updatedAt: now,
        });
      }
    }

    let postsAdded = 0;
    let likesAdded = 0;
    let commentsAdded = 0;
    for (let memberIndex = 0; memberIndex < profileIds.length; memberIndex += 1) {
      for (let postIndex = 0; postIndex < 3; postIndex += 1) {
        const sequence = memberIndex * 3 + postIndex;
        const authorId = profileIds[memberIndex];
        const likeCount = 5 + ((sequence * 7) % 11);
        const commentCount = 1 + (sequence % 3);
        const createdAt = now - sequence * 90 * 60_000;
        const postId = await ctx.db.insert("posts", {
          authorId,
          storageId: storageIds[sequence % storageIds.length],
          mediaType: "image",
          contentType: "image/jpeg",
          caption: captions[sequence % captions.length],
          likesCount: likeCount,
          commentsCount: commentCount,
          createdAt,
          updatedAt: createdAt,
        });
        postsAdded += 1;

        for (let likeIndex = 0; likeIndex < likeCount; likeIndex += 1) {
          const userId = profileIds[(memberIndex + likeIndex + 1) % profileIds.length];
          await ctx.db.insert("likes", { postId, userId, createdAt: createdAt + likeIndex });
          likesAdded += 1;
        }
        for (let commentIndex = 0; commentIndex < commentCount; commentIndex += 1) {
          const commenterIndex = (memberIndex + commentIndex + postIndex + 2) % profileIds.length;
          await ctx.db.insert("comments", {
            postId,
            authorId: profileIds[commenterIndex],
            body: comments[(sequence + commentIndex * 3) % comments.length],
            createdAt: createdAt + commentIndex * 60_000,
          });
          commentsAdded += 1;
        }
      }
    }

    return {
      seeded: true,
      profiles: members.length,
      posts: postsAdded,
      likes: likesAdded,
      comments: commentsAdded,
      follows: followEdges.size,
    };
  },
});

export const seedDemoData = internalAction({
  args: {},
  returns: resultValidator,
  handler: async (ctx) => {
    const alreadySeeded: boolean = await ctx.runQuery(internal.seed.demoSeedExists, {});
    if (alreadySeeded) {
      return { seeded: false, profiles: 0, posts: 0, likes: 0, comments: 0, follows: 0 };
    }

    const storageIds: Id<"_storage">[] = [];
    try {
      for (const url of mediaUrls) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unable to download a demo image (HTTP ${response.status}).`);
        const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
        if (!contentType.startsWith("image/")) throw new Error("A demo media URL did not return an image.");
        storageIds.push(await ctx.storage.store(await response.blob()));
      }
      const result: { seeded: boolean; profiles: number; posts: number; likes: number; comments: number; follows: number } =
        await ctx.runMutation(internal.seed.insertDemoData, { storageIds });
      return result;
    } catch (error) {
      await Promise.all(storageIds.map((storageId) => ctx.storage.delete(storageId)));
      throw error;
    }
  },
});
