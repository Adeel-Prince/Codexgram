import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";

export type PostItem = {
  _id: Id<"posts">;
  caption: string | null;
  mediaType: "image" | "video";
  mediaUrl: string | null;
  contentType: string;
  durationMs: number | null;
  createdAt: number;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  author: {
    _id: Id<"profiles">;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    followerCount: number;
    followingCount: number;
    postCount: number;
  };
};

function relativeTime(createdAt: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function VideoPost({ url }: { url: string }) {
  const player = useVideoPlayer(url, (videoPlayer) => {
    videoPlayer.loop = true;
  });
  return <VideoView player={player} contentFit="cover" style={styles.postImage} />;
}

export function PostCard({ post }: { post: PostItem }) {
  const setLike = useMutation(api.social.setLike);
  const [optimisticLike, setOptimisticLike] = useState<{ base: boolean; value: boolean } | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const liked = optimisticLike?.base === post.likedByMe ? optimisticLike.value : post.likedByMe;

  const changeLike = async () => {
    if (isLiking) return;
    const nextLiked = !liked;
    setOptimisticLike({ base: post.likedByMe, value: nextLiked });
    setIsLiking(true);
    try {
      await setLike({ postId: post._id, liked: nextLiked });
    } catch (cause) {
      setOptimisticLike(null);
      Alert.alert("Couldn't update like", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  const openComments = () => router.push({ pathname: "/comments/[postId]", params: { postId: post._id } });

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image source={post.author.avatarUrl ? { uri: post.author.avatarUrl } : require("../../assets/images/profile/portrait.png")} contentFit="cover" style={styles.avatar} />
        <View style={styles.authorText}>
          <Text style={styles.authorName}>{post.author.username}</Text>
          <Text style={styles.location}>{relativeTime(post.createdAt)}</Text>
        </View>
        <Pressable accessibilityLabel="More post options" accessibilityRole="button" hitSlop={10} style={styles.moreButton}>
          <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M5 12h.1M12 12h.1M19 12h.1" fill="none" stroke="#68758C" strokeWidth={3.2} strokeLinecap="round" /></Svg>
        </Pressable>
      </View>
      <View style={styles.mediaFrame}>
        {post.mediaUrl ? post.mediaType === "video" ? <VideoPost url={post.mediaUrl} /> : <Image source={{ uri: post.mediaUrl }} contentFit="cover" style={styles.postImage} /> : <View style={styles.mediaUnavailable}><Text style={styles.mediaUnavailableText}>This post&apos;s media is unavailable.</Text></View>}
      </View>
      <View style={styles.postDetails}>
        {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
        <View style={styles.postActions}>
          <Pressable accessibilityLabel={liked ? "Unlike post" : "Like post"} accessibilityRole="button" accessibilityState={{ selected: liked }} disabled={isLiking} onPress={() => void changeLike()} style={styles.metricAction}>
            <Svg width={25} height={25} viewBox="0 0 24 24"><Path d="M20.5 8.7c0 4.1-8.5 10.1-8.5 10.1S3.5 12.8 3.5 8.7a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" fill={liked ? "#FF334F" : "none"} stroke="#FF334F" strokeWidth={1.8} strokeLinejoin="round" /></Svg>
            <Text style={styles.metric}>{post.likesCount + (liked === post.likedByMe ? 0 : liked ? 1 : -1)}</Text>
          </Pressable>
          <Pressable accessibilityLabel={`View ${post.commentsCount} comments`} accessibilityRole="button" onPress={openComments} style={styles.metricAction}>
            <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M20 11.4a7.8 7.8 0 0 1-8.1 7.5 8.8 8.8 0 0 1-3.8-.8L4 19l1.1-3.4a7.1 7.1 0 0 1-1.3-4.2 7.8 7.8 0 0 1 8.1-7.5 7.8 7.8 0 0 1 8.1 7.5Z" fill="none" stroke="#101C36" strokeWidth={1.8} strokeLinejoin="round" /></Svg>
            <Text style={styles.metric}>{post.commentsCount}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  post: { marginHorizontal: 11, marginTop: 9, marginBottom: 2, padding: 8, borderRadius: 18, backgroundColor: "#FFFFFF", shadowColor: "#18233B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  postHeader: { height: 47, flexDirection: "row", alignItems: "center", paddingHorizontal: 3 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8EDF5" },
  authorText: { marginLeft: 9, flex: 1, justifyContent: "center" },
  authorName: { color: "#111827", fontSize: 13.5, fontWeight: "700" },
  location: { marginTop: 2, color: "#74829B", fontSize: 11 },
  moreButton: { width: 32, height: 36, alignItems: "center", justifyContent: "center" },
  mediaFrame: { overflow: "hidden", borderRadius: 13 },
  postImage: { width: "100%", aspectRatio: 1.15, backgroundColor: "#E7EDF4" },
  mediaUnavailable: { width: "100%", aspectRatio: 1.15, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF1F5" },
  mediaUnavailableText: { color: "#68758C", fontSize: 12 },
  postDetails: { paddingHorizontal: 5, paddingTop: 6 },
  caption: { color: "#101B32", fontSize: 13, lineHeight: 18 },
  postActions: { height: 40, flexDirection: "row", alignItems: "center", gap: 20 },
  metricAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  metric: { color: "#3B465D", fontSize: 12.5 },
});
