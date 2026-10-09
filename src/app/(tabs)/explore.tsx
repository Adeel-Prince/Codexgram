import { Image } from "expo-image";
import { router } from "expo-router";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BrandLogo } from "../../components/BrandLogo";
import type { PostItem } from "../../components/PostCard";

const colors = { ink: "#101B32", muted: "#78859E", blue: "#1677F8", line: "#E7EBF2", pale: "#F1F4F9", white: "#FFFFFF" };
const topics = ["All", "Travel", "Nature", "Pets", "Food", "Design", "Lifestyle", "Photography", "Outdoors"];
const rings = ["#1684FF", "#E84390", "#A279FF", "#26BDD0", "#72A4F6"];
const creatorCategories: Record<string, string> = { alex: "Travel & Nature", maya: "Lifestyle", jordan: "Photography", taylor: "Food & Coffee", casey: "Outdoor Life" };
const fallbackAvatars = [
  require("../../../assets/images/feed/alex.png"),
  require("../../../assets/images/feed/maya.png"),
  require("../../../assets/images/feed/jordan.png"),
  require("../../../assets/images/feed/taylor.png"),
  require("../../../assets/images/feed/casey.png"),
];

function SearchGlyph({ color = colors.muted, size = 22 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="10.8" cy="10.8" r="6.8" fill="none" stroke={color} strokeWidth={2} /><Path d="m16 16 4.2 4.2" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" /></Svg>;
}

function MoreGlyph() {
  return <Svg width={19} height={19} viewBox="0 0 24 24"><Circle cx="5" cy="12" r="1.6" fill="#FFFFFF" /><Circle cx="12" cy="12" r="1.6" fill="#FFFFFF" /><Circle cx="19" cy="12" r="1.6" fill="#FFFFFF" /></Svg>;
}

function ChevronGlyph({ up = false }: { up?: boolean }) {
  return <Svg width={17} height={17} viewBox="0 0 24 24"><Path d={up ? "m6 14 6-6 6 6" : "m6 9 6 6 6-6"} fill="none" stroke="#586782" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function FollowSuggestion({ person, index }: { person: { _id: Id<"profiles">; username: string; displayName: string; avatarUrl: string | null; isFollowing: boolean }; index: number }) {
  const [optimisticFollowing, setOptimisticFollowing] = useState<{ base: boolean; value: boolean } | null>(null);
  const setFollow = useMutation(api.social.setFollow);
  const following = optimisticFollowing?.base === person.isFollowing ? optimisticFollowing.value : person.isFollowing;
  const toggle = async () => {
    const next = !following;
    setOptimisticFollowing({ base: person.isFollowing, value: next });
    try { await setFollow({ profileId: person._id, following: next }); }
    catch { setOptimisticFollowing(null); }
  };
  return (
    <View style={styles.suggestion}>
      <View style={[styles.suggestionRing, { borderColor: rings[index % rings.length] }]}>
        <Image source={person.avatarUrl ? { uri: person.avatarUrl } : fallbackAvatars[index % fallbackAvatars.length]} contentFit="cover" style={styles.suggestionAvatar} />
      </View>
      <Text numberOfLines={1} style={styles.suggestionName}>{person.username}</Text>
      <Text numberOfLines={1} style={styles.suggestionCategory}>{creatorCategories[person.username.replace(/^demo\./, "").split(/[._]/)[0]] ?? "Creator"}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: following }} onPress={toggle} style={[styles.followButton, following && styles.followingButton]}>
        <Text style={[styles.followText, following && styles.followingText]}>{following ? "Following" : "Follow"}</Text>
      </Pressable>
    </View>
  );
}

function TopicChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.topicChip, selected && styles.selectedTopicChip]}><Text style={[styles.topicLabel, selected && styles.selectedTopicLabel]}>{label}</Text></Pressable>;
}

function ExploreCard({ post, width }: { post: PostItem; width: number }) {
  const [optimisticLiked, setOptimisticLiked] = useState<{ base: boolean; value: boolean } | null>(null);
  const setLike = useMutation(api.social.setLike);
  const liked = optimisticLiked?.base === post.likedByMe ? optimisticLiked.value : post.likedByMe;
  const toggleLike = async () => {
    const next = !liked;
    setOptimisticLiked({ base: post.likedByMe, value: next });
    try { await setLike({ postId: post._id, liked: next }); }
    catch { setOptimisticLiked(null); }
  };
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/comments/[postId]", params: { postId: post._id } })} style={[styles.postCard, { width }]}>
      <View style={styles.postPhoto}>
        {post.mediaType === "image" && post.mediaUrl ? <Image source={{ uri: post.mediaUrl }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <View style={styles.videoTile}><Text style={styles.videoTileText}>{post.mediaType === "video" ? "VIDEO" : "MEDIA"}</Text></View>}
        <View style={styles.photoShade} />
        <View style={styles.photoHeader}>
          <Image source={post.author.avatarUrl ? { uri: post.author.avatarUrl } : fallbackAvatars[0]} contentFit="cover" style={styles.postAvatar} />
          <Text numberOfLines={1} style={styles.postAuthor}>{post.author.username}</Text>
          {post.mediaType === "video" ? <Text style={styles.videoBadge}>{"\u25B6"}</Text> : null}
          <MoreGlyph />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Unlike post" : "Like post"} onPress={(event) => { event.stopPropagation(); void toggleLike(); }} style={styles.likeCount}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M20.5 8.7c0 4.1-8.5 10.1-8.5 10.1S3.5 12.8 3.5 8.7a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" fill={liked ? "#FF4258" : "none"} stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" /></Svg>
          <Text style={styles.likeText}>{post.likesCount + (liked === post.likedByMe ? 0 : liked ? 1 : -1)}</Text>
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.postTitle}>{post.caption || post.author.displayName}</Text>
    </Pressable>
  );
}

export default function ExploreRoute() {
  const [activeTopic, setActiveTopic] = useState("All");
  const [query, setQuery] = useState("");
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const tileWidth = (width - 22) / 3;
  const { results: posts, status, loadMore } = usePaginatedQuery(api.posts.explore, {}, { initialNumItems: 18 });
  const suggestions = useQuery(api.profiles.suggestions, {});
  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTopic = activeTopic === "All" || `${post.caption ?? ""} ${post.author.username}`.toLowerCase().includes(activeTopic.toLowerCase());
      const matchesQuery = !normalized || `${post.author.username} ${post.author.displayName} ${post.caption ?? ""}`.toLowerCase().includes(normalized);
      return matchesTopic && matchesQuery;
    }).sort((first, second) => Number(first.mediaType === "video") - Number(second.mediaType === "video"));
  }, [activeTopic, posts, query]);

  const listHeader = (
    <>
      <View style={styles.header}>
        <View style={styles.brand}><BrandLogo size={38} /><Text style={styles.brandName}>Codexgram</Text></View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Focus search" accessibilityRole="button" onPress={() => searchRef.current?.focus()} style={styles.headerAction}><SearchGlyph color={colors.ink} size={25} /></Pressable>
          <Pressable accessibilityLabel="Create post" accessibilityRole="button" onPress={() => router.push("/create-post")} style={styles.headerAction}><Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke={colors.blue} strokeWidth={2} strokeLinecap="round" /></Svg></Pressable>
        </View>
      </View>
      <View style={styles.searchBar}><SearchGlyph /><TextInput ref={searchRef} accessibilityLabel="Search people, posts, or topics" onChangeText={setQuery} placeholder="Search people, posts, or topics..." placeholderTextColor={colors.muted} returnKeyType="search" style={styles.searchInput} value={query} /></View>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={showAllSuggestions ? "Show fewer suggestions" : "See all suggestions"} onPress={() => setShowAllSuggestions((value) => !value)} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>{showAllSuggestions ? "See less" : "See all"}</Text>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="m9 5 7 7-7 7" fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
        {suggestions?.slice(0, showAllSuggestions ? undefined : 5).map((person, index) => <FollowSuggestion key={person._id} person={person} index={index} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsRow}>
        {(showAllTopics ? topics : topics.slice(0, 7)).map((topic) => <TopicChip key={topic} label={topic} selected={activeTopic === topic} onPress={() => setActiveTopic(topic)} />)}
        <Pressable accessibilityRole="button" accessibilityLabel={showAllTopics ? "Show fewer topics" : "Show more topics"} onPress={() => setShowAllTopics((value) => !value)} style={styles.topicExpand}><ChevronGlyph up={showAllTopics} /></Pressable>
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FlatList
        data={visiblePosts}
        keyExtractor={(post) => post._id}
        numColumns={3}
        renderItem={({ item }) => <ExploreCard post={item} width={tileWidth} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<View style={styles.empty}>{status === "LoadingFirstPage" ? <ActivityIndicator color={colors.blue} /> : <Text style={styles.emptyText}>No posts to explore yet. Share the first one!</Text>}</View>}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={visiblePosts.length ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => { if (status === "CanLoadMore") loadMore(18); }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { height: 52, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandName: { color: colors.ink, fontSize: 21, fontWeight: "800", letterSpacing: -0.45 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  searchBar: { height: 42, marginHorizontal: 18, marginTop: 4, marginBottom: 15, paddingHorizontal: 15, borderRadius: 24, backgroundColor: colors.pale, flexDirection: "row", alignItems: "center", gap: 11 },
  searchInput: { flex: 1, height: "100%", padding: 0, color: colors.ink, fontSize: 14 },
  sectionHeading: { height: 26, marginBottom: 8, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  seeAllButton: { flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 4 },
  seeAllText: { color: colors.blue, fontSize: 12, fontWeight: "600" },
  suggestionsRow: { paddingHorizontal: 0, gap: 0, paddingBottom: 11 },
  suggestion: { width: 74, alignItems: "center" },
  suggestionRing: { width: 58, height: 58, padding: 2, borderRadius: 29, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  suggestionAvatar: { width: 50, height: 50, borderRadius: 25 },
  suggestionName: { width: 74, marginTop: 3, color: colors.ink, fontSize: 10.5, lineHeight: 14, textAlign: "center", fontWeight: "600" },
  suggestionCategory: { width: 74, marginTop: 1, color: colors.muted, fontSize: 9.5, lineHeight: 13, textAlign: "center" },
  followButton: { width: 62, height: 25, marginTop: 5, borderRadius: 14, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  followText: { color: colors.white, fontSize: 10.5, lineHeight: 13, fontWeight: "600" },
  followingButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  followingText: { color: colors.ink },
  topicsRow: { paddingHorizontal: 4, gap: 3, paddingTop: 3, paddingBottom: 10, alignItems: "center" },
  topicChip: { height: 32, paddingHorizontal: 6, borderRadius: 18, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  selectedTopicChip: { backgroundColor: colors.blue },
  topicLabel: { color: "#526079", fontSize: 11.5, lineHeight: 15 },
  selectedTopicLabel: { color: colors.white, fontWeight: "600" },
  topicExpand: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  gridContent: { paddingHorizontal: 6, paddingBottom: 12 },
  gridRow: { gap: 5, marginBottom: 7 },
  postCard: { overflow: "hidden", borderRadius: 11, backgroundColor: colors.white, shadowColor: "#17233B", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  postPhoto: { width: "100%", aspectRatio: 0.78, position: "relative", overflow: "hidden", justifyContent: "space-between" },
  photoShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(5, 15, 35, 0.06)" },
  videoTile: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#253757" },
  videoTileText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  photoHeader: { height: 34, paddingHorizontal: 5, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(17, 28, 49, 0.16)" },
  postAvatar: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: colors.white },
  postAuthor: { flex: 1, marginLeft: 4, color: colors.white, fontSize: 9, fontWeight: "700" },
  videoBadge: { color: colors.white, fontSize: 10 },
  likeCount: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingBottom: 7 },
  likeText: { color: colors.white, fontSize: 11, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 3 },
  postTitle: { minHeight: 43, paddingHorizontal: 6, paddingTop: 5, paddingBottom: 6, color: colors.ink, fontSize: 10.5, lineHeight: 14, fontWeight: "500" },
  empty: { minHeight: 180, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: "center" },
});
