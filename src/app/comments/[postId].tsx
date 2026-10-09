import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type SortOrder = "desc" | "asc";

function relativeTime(timestamp: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

function BackIcon() {
  return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="m15 4-8 8 8 8" fill="none" stroke="#111B36" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function PostActionIcon({ kind, active = false }: { kind: "like" | "comment" | "share" | "save"; active?: boolean }) {
  const color = kind === "like" ? "#FF3152" : "#101B32";
  if (kind === "like") return <Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M20.5 8.7c0 4.1-8.5 10.1-8.5 10.1S3.5 12.8 3.5 8.7a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" fill={active ? color : "none"} stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></Svg>;
  if (kind === "comment") return <Svg width={25} height={25} viewBox="0 0 24 24"><Path d="M20 11.4a7.8 7.8 0 0 1-8.1 7.5 8.8 8.8 0 0 1-3.8-.8L4 19l1.1-3.4a7.1 7.1 0 0 1-1.3-4.2 7.8 7.8 0 0 1 8.1-7.5 7.8 7.8 0 0 1 8.1 7.5Z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></Svg>;
  if (kind === "share") return <Svg width={25} height={25} viewBox="0 0 24 24"><Path d="m21 3-8.4 18-3.1-7.5L3 10.2 21 3Z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/><Path d="m9.5 13.5 5.1-5.1" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
  return <Svg width={24} height={26} viewBox="0 0 24 24"><Path d="M6 3.5h12v17l-6-4.3-6 4.3v-17Z" fill={active ? "#101B32" : "none"} stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></Svg>;
}

function HeartIcon({ active }: { active: boolean }) {
  return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M20.5 8.7c0 4.1-8.5 10.1-8.5 10.1S3.5 12.8 3.5 8.7a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" fill={active ? "#FF3152" : "none"} stroke={active ? "#FF3152" : "#111B36"} strokeWidth={1.8} strokeLinejoin="round" /></Svg>;
}

function VideoDetail({ url }: { url: string }) {
  const player = useVideoPlayer(url, (videoPlayer) => { videoPlayer.loop = true; });
  return <VideoView player={player} contentFit="cover" style={styles.postImage} />;
}

export default function CommentsRoute() {
  const { postId: rawPostId } = useLocalSearchParams<{ postId: string }>();
  const postId = typeof rawPostId === "string" ? rawPostId as Id<"posts"> : null;
  const post = useQuery(api.posts.byId, postId ? { postId } : "skip");
  const myProfile = useQuery(api.profiles.myProfile, {});
  const [sort, setSort] = useState<SortOrder>("desc");
  const { results, status, loadMore } = usePaginatedQuery(
    api.social.comments,
    postId ? { postId, sort } : "skip",
    { initialNumItems: 30 },
  );
  const addComment = useMutation(api.social.addComment);
  const deleteComment = useMutation(api.social.deleteComment);
  const setLike = useMutation(api.social.setLike);
  const setFollow = useMutation(api.social.setFollow);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const inputRef = useRef<TextInput>(null);

  const sendComment = async () => {
    if (!postId || !body.trim() || isSending) return;
    setIsSending(true);
    setError("");
    try {
      await addComment({ postId, body });
      setBody("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add your comment.");
    } finally {
      setIsSending(false);
    }
  };

  const confirmDelete = (commentId: Id<"comments">) => {
    Alert.alert("Delete comment?", "This comment will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void deleteComment({ commentId }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to delete this comment.")); } },
    ]);
  };

  const togglePostLike = async () => {
    if (!post || isLiking) return;
    setIsLiking(true);
    try {
      await setLike({ postId: post._id, liked: !post.likedByMe });
    } catch (cause) {
      Alert.alert("Couldn't update like", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  const toggleFollow = async () => {
    if (!post || isFollowing || post.author._id === myProfile?._id) return;
    setIsFollowing(true);
    try {
      await setFollow({ profileId: post.author._id, following: !post.isFollowing });
    } catch (cause) {
      Alert.alert("Couldn't update follow", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setIsFollowing(false);
    }
  };

  const sharePost = async () => {
    if (!post) return;
    try {
      await Share.share({ message: post.caption ? `${post.caption}\n\nShared from Codexgram` : "Check out this post on Codexgram" });
    } catch (cause) {
      Alert.alert("Couldn't share this post", cause instanceof Error ? cause.message : "Please try again.");
    }
  };

  const postHeader = post ? (() => {
    const tags = post.caption?.match(/#[\w]+/g) ?? [];
    const captionText = (post.caption ?? "").replace(/#[\w]+/g, "").trim();
    return (
      <>
        <View style={styles.postHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={styles.backButton}><BackIcon /></Pressable>
          <Text style={styles.postTitle}>Post</Text>
        </View>
        <View style={styles.authorRow}>
          {post.author.avatarUrl ? <Image source={{ uri: post.author.avatarUrl }} contentFit="cover" style={styles.authorAvatar} /> : <View style={styles.authorAvatarFallback}><Text style={styles.fallbackInitial}>{post.author.username.slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.authorDetails}>
            <Text numberOfLines={1} style={styles.authorName}>{post.author.username}</Text>
            <Text style={styles.authorSubline}>Codexgram · {relativeTime(post.createdAt)}</Text>
          </View>
          {post.author._id !== myProfile?._id ? (
            <Pressable accessibilityRole="button" disabled={isFollowing} onPress={() => void toggleFollow()} style={[styles.followButton, !post.isFollowing && styles.followingButton]}>
              <Text style={[styles.followText, !post.isFollowing && styles.followingText]}>{post.isFollowing ? "Following" : "Follow"}</Text>
            </Pressable>
          ) : null}
        </View>
        {post.mediaUrl ? post.mediaType === "video" ? <VideoDetail url={post.mediaUrl} /> : <Image source={{ uri: post.mediaUrl }} contentFit="cover" style={styles.postImage} /> : <View style={[styles.postImage, styles.unavailableMedia]}><Text style={styles.unavailableText}>This post’s media is unavailable.</Text></View>}
        <View style={styles.postDetail}>
          {captionText ? <Text style={styles.caption}>{captionText}</Text> : null}
          {tags.length ? <View style={styles.tags}>{tags.map((tag, index) => <Text key={`${tag}-${index}`} style={styles.tag}>{tag}</Text>)}</View> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={post.likedByMe ? "Unlike post" : "Like post"} onPress={() => void togglePostLike()} style={styles.actionItem}>
              <PostActionIcon kind="like" active={post.likedByMe} /><Text style={styles.actionCount}>{post.likesCount}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${post.commentsCount} comments`} onPress={() => inputRef.current?.focus()} style={styles.actionItem}>
              <PostActionIcon kind="comment" /><Text style={styles.actionCount}>{post.commentsCount}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Share post" onPress={() => void sharePost()} style={styles.iconOnlyAction}><PostActionIcon kind="share" /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={saved ? "Remove saved post" : "Save post"} onPress={() => setSaved((value) => !value)} style={styles.saveAction}><PostActionIcon kind="save" active={saved} /></Pressable>
          </View>
          <View style={styles.commentsHeading}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Sort ${sort === "desc" ? "oldest" : "newest"} first`} onPress={() => setSort((value) => value === "desc" ? "asc" : "desc")} style={styles.sortButton}>
              <Text style={styles.sortLabel}>{sort === "desc" ? "Newest" : "Oldest"}</Text>
              <Svg width={15} height={15} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" fill="none" stroke="#7384A6" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </Pressable>
          </View>
        </View>
      </>
    );
  })() : null;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!postId ? <Text style={styles.error}>This post could not be found.</Text> : null}
        <FlatList
          data={results}
          keyExtractor={(comment) => comment._id}
          ListHeaderComponent={postHeader}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              {item.author.avatarUrl ? <Image source={{ uri: item.author.avatarUrl }} contentFit="cover" style={styles.commentAvatar} /> : <View style={[styles.commentAvatar, styles.commentAvatarFallback]}><Text style={styles.commentInitial}>{item.author.username.slice(0, 1).toUpperCase()}</Text></View>}
              <View style={styles.commentContent}>
                <View style={styles.commentIdentity}>
                  <Text style={styles.username}>{item.author.username}</Text>
                  <Text style={styles.commentTime}>{relativeTime(item.createdAt)}</Text>
                  {item.canDelete ? <Pressable accessibilityRole="button" accessibilityLabel="Delete comment" hitSlop={8} onPress={() => confirmDelete(item._id)}><Text style={styles.delete}>Delete</Text></Pressable> : null}
                </View>
                <Text style={styles.commentBody}>{item.body}</Text>
                <Pressable accessibilityRole="button" onPress={() => { setBody(`@${item.author.username} `); inputRef.current?.focus(); }}><Text style={styles.reply}>Reply</Text></Pressable>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={commentLikes[item._id] ? "Unlike comment" : "Like comment"} onPress={() => setCommentLikes((likes) => ({ ...likes, [item._id]: !likes[item._id] }))} style={styles.commentLike}><HeartIcon active={Boolean(commentLikes[item._id])} /></Pressable>
            </View>
          )}
          ListEmptyComponent={status === "LoadingFirstPage" || post === undefined ? <ActivityIndicator color="#1677F8" style={styles.loading} /> : status === "CanLoadMore" ? null : <Text style={styles.empty}>No comments yet. Start the conversation.</Text>}
          ListFooterComponent={status === "CanLoadMore" ? <Pressable onPress={() => loadMore(30)} style={styles.loadMore}><Text style={styles.loadMoreText}>{sort === "desc" ? "Load older comments" : "Load newer comments"}</Text></Pressable> : status === "LoadingMore" ? <ActivityIndicator color="#1677F8" style={styles.loading} /> : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.composer}>
          {myProfile?.avatarUrl ? <Image source={{ uri: myProfile.avatarUrl }} contentFit="cover" style={styles.composerAvatar} /> : <View style={[styles.composerAvatar, styles.commentAvatarFallback]}><Text style={styles.commentInitial}>{myProfile?.username?.slice(0, 1).toUpperCase() ?? "B"}</Text></View>}
          <TextInput
            ref={inputRef}
            accessibilityLabel="Write a comment"
            maxLength={1000}
            onChangeText={setBody}
            onSubmitEditing={() => void sendComment()}
            placeholder="Add a comment..."
            placeholderTextColor="#8793AA"
            returnKeyType="send"
            style={styles.input}
            value={body}
          />
          <Pressable accessibilityRole="button" disabled={!body.trim() || isSending} onPress={() => void sendComment()} style={[styles.sendButton, (!body.trim() || isSending) && styles.sendDisabled]}>
            {isSending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendText}>Post</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  keyboard: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingBottom: 10, flexGrow: 1 },
  postHeader: { height: 55, flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 35, height: 38, borderRadius: 20, backgroundColor: "#F3F5F9", alignItems: "center", justifyContent: "center" },
  postTitle: { color: "#111827", fontSize: 18, fontWeight: "700" },
  authorRow: { minHeight: 54, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EDF1F6" },
  authorAvatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9F3FF" },
  fallbackInitial: { color: "#1677F8", fontSize: 14, fontWeight: "700" },
  authorDetails: { flex: 1, marginLeft: 9 },
  authorName: { color: "#111827", fontSize: 13, fontWeight: "700" },
  authorSubline: { marginTop: 3, color: "#818A9B", fontSize: 10.5 },
  followButton: { height: 31, paddingHorizontal: 15, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2F7" },
  followingButton: { backgroundColor: "#1677F8" },
  followText: { color: "#59657A", fontSize: 11, fontWeight: "700" },
  followingText: { color: "#FFFFFF" },
  postImage: { width: "100%", aspectRatio: 1.04, borderRadius: 18, backgroundColor: "#EDF1F6" },
  unavailableMedia: { alignItems: "center", justifyContent: "center" },
  unavailableText: { color: "#74829B", fontSize: 13 },
  postDetail: { paddingHorizontal: 8 },
  caption: { marginTop: 12, color: "#111827", fontSize: 14, lineHeight: 21 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7, marginBottom: 7 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, overflow: "hidden", backgroundColor: "#EAF3FF", color: "#1677F8", fontSize: 10.5, fontWeight: "600" },
  actions: { minHeight: 48, marginTop: 2, borderBottomWidth: 1, borderBottomColor: "#EEF1F5", flexDirection: "row", alignItems: "center" },
  actionItem: { minWidth: 78, flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { color: "#17233F", fontSize: 12, fontWeight: "600" },
  iconOnlyAction: { width: 55, alignItems: "center", justifyContent: "center" },
  saveAction: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
  commentsHeading: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentsTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  sortButton: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6 },
  sortLabel: { color: "#7585A6", fontSize: 12 },
  error: { paddingHorizontal: 18, paddingTop: 8, color: "#C62828", fontSize: 12 },
  commentRow: { minHeight: 58, flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#E8F2FF" },
  commentAvatarFallback: { alignItems: "center", justifyContent: "center" },
  commentInitial: { color: "#1677F8", fontSize: 13, fontWeight: "700" },
  commentContent: { flex: 1, minWidth: 0, marginLeft: 10, paddingTop: 1 },
  commentIdentity: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { color: "#15213D", fontSize: 12, fontWeight: "800" },
  commentTime: { color: "#7C879D", fontSize: 10 },
  delete: { color: "#9B5360", fontSize: 10 },
  commentBody: { marginTop: 2, color: "#15213D", fontSize: 12.5, lineHeight: 17 },
  reply: { marginTop: 4, color: "#8090B1", fontSize: 11 },
  commentLike: { width: 28, height: 34, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  empty: { marginTop: 20, marginBottom: 24, color: "#78859E", fontSize: 13, textAlign: "center" },
  loading: { marginVertical: 25 },
  loadMore: { alignItems: "center", paddingVertical: 12 },
  loadMoreText: { color: "#1677F8", fontSize: 12, fontWeight: "600" },
  composer: { minHeight: 60, paddingHorizontal: 15, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#EEF1F5", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF" },
  composerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E8F2FF" },
  input: { flex: 1, height: 39, paddingHorizontal: 13, borderRadius: 21, backgroundColor: "#F2F4F8", color: "#101B32", fontSize: 12.5 },
  sendButton: { minWidth: 62, height: 39, paddingHorizontal: 13, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#0878F9" },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
