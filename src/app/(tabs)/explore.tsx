import { Image } from "expo-image";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  ink: "#101B32",
  muted: "#78859E",
  blue: "#1677F8",
  line: "#E7EBF2",
  pale: "#F1F4F9",
  white: "#FFFFFF",
};

const topics = ["All", "Travel", "Nature", "Pets", "Food", "Design", "Lifestyle", "Photography", "Outdoors"];

const suggestions = [
  { id: "alex", name: "alex.rivera", category: "Travel & Nature", ring: "#1684FF", image: require("../../../assets/images/feed/alex.png") },
  { id: "maya", name: "maya.b", category: "Lifestyle", ring: "#E84390", image: require("../../../assets/images/feed/maya.png") },
  { id: "jordan", name: "jordan.k", category: "Photography", ring: "#A279FF", image: require("../../../assets/images/feed/jordan.png") },
  { id: "taylor", name: "taylor.b", category: "Food & Coffee", ring: "#26BDD0", image: require("../../../assets/images/feed/taylor.png") },
  { id: "casey", name: "casey.dev", category: "Outdoor Life", ring: "#72A4F6", image: require("../../../assets/images/feed/casey.png") },
];

type ExplorePost = {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  image: ImageSourcePropType;
  title: string;
  topic: string;
  likes: number;
};

const posts: ExplorePost[] = [
  { id: "lake", name: "alex.rivera", avatar: suggestions[0].image, image: require("../../../assets/images/profile/grid-lake.png"), title: "Morning views at Lake Louise 🏔️", topic: "Travel", likes: 124 },
  { id: "dog", name: "maya.b", avatar: suggestions[1].image, image: require("../../../assets/images/profile/grid-dog.png"), title: "Beach days are always better 💙", topic: "Pets", likes: 86 },
  { id: "palms", name: "taylor.b", avatar: suggestions[3].image, image: require("../../../assets/images/profile/grid-palms.png"), title: "Golden hour in San Diego 🌅", topic: "Nature", likes: 102 },
  { id: "city", name: "jordan.k", avatar: suggestions[2].image, image: require("../../../assets/images/profile/grid-city.png"), title: "City lights, bigger dreams ✨", topic: "Design", likes: 210 },
  { id: "coast", name: "casey.dev", avatar: suggestions[4].image, image: require("../../../assets/images/profile/grid-coast.png"), title: "Find your next horizon 🌊", topic: "Travel", likes: 178 },
  { id: "coffee", name: "maya.b", avatar: suggestions[1].image, image: require("../../../assets/images/profile/grid-coffee.png"), title: "Good coffee, brighter days ☕", topic: "Food", likes: 95 },
  { id: "hiker", name: "alex.rivera", avatar: suggestions[0].image, image: require("../../../assets/images/profile/grid-hiker.png"), title: "Take the scenic route 🎒", topic: "Outdoors", likes: 141 },
  { id: "sunset", name: "jordan.k", avatar: suggestions[2].image, image: require("../../../assets/images/profile/grid-sunset.png"), title: "A little closer to the sky 🌄", topic: "Nature", likes: 163 },
  { id: "road", name: "taylor.b", avatar: suggestions[3].image, image: require("../../../assets/images/profile/grid-road.png"), title: "Somewhere new feels right ✈️", topic: "Travel", likes: 119 },
];

function CameraLogo() {
  return (
    <View style={styles.logo}>
      <View style={styles.cameraBody}>
        <View style={styles.cameraTop} />
        <View style={styles.cameraLens}><View style={styles.cameraCore} /></View>
        <View style={styles.cameraDot} />
      </View>
    </View>
  );
}

function SearchGlyph({ color = colors.muted, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="10.8" cy="10.8" r="6.8" fill="none" stroke={color} strokeWidth={2} />
      <Path d="m16 16 4.2 4.2" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function FollowSuggestion({ person }: { person: (typeof suggestions)[number] }) {
  const [following, setFollowing] = useState(false);
  return (
    <View style={styles.suggestion}>
      <View style={[styles.suggestionRing, { borderColor: person.ring }]}>
        <Image source={person.image} contentFit="cover" style={styles.suggestionAvatar} />
      </View>
      <Text numberOfLines={1} style={styles.suggestionName}>{person.name}</Text>
      <Text numberOfLines={1} style={styles.suggestionCategory}>{person.category}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: following }}
        onPress={() => setFollowing((value) => !value)}
        style={[styles.followButton, following && styles.followingButton]}
      >
        <Text style={[styles.followText, following && styles.followingText]}>{following ? "Following" : "Follow"}</Text>
      </Pressable>
    </View>
  );
}

function TopicChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.topicChip, selected && styles.selectedTopicChip]}>
      <Text style={[styles.topicLabel, selected && styles.selectedTopicLabel]}>{label}</Text>
    </Pressable>
  );
}

function ExploreCard({ post, width }: { post: ExplorePost; width: number }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={[styles.postCard, { width }]}>
      <View style={styles.postPhoto}>
        <Image source={post.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View style={styles.photoShade} />
        <View style={styles.photoHeader}>
          <Image source={post.avatar} contentFit="cover" style={styles.postAvatar} />
          <Text numberOfLines={1} style={styles.postAuthor}>{post.name}</Text>
          <View style={styles.postMore}>
            <Svg width={17} height={17} viewBox="0 0 24 24">
              <Circle cx="5" cy="12" r="1.5" fill="#FFFFFF" />
              <Circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
              <Circle cx="19" cy="12" r="1.5" fill="#FFFFFF" />
            </Svg>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Unlike post" : "Like post"} onPress={() => setLiked((value) => !value)} style={styles.likeCount}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M20.5 8.7c0 4.1-8.5 10.1-8.5 10.1S3.5 12.8 3.5 8.7a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" fill={liked ? "#FF4258" : "none"} stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
          </Svg>
          <Text style={styles.likeText}>{post.likes + (liked ? 1 : 0)}</Text>
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.postTitle}>{post.title}</Text>
    </View>
  );
}

export default function ExploreRoute() {
  const [activeTopic, setActiveTopic] = useState("All");
  const [query, setQuery] = useState("");
  const searchRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const tileWidth = (width - 22) / 3;

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTopic = activeTopic === "All" || post.topic === activeTopic;
      const matchesQuery = !normalizedQuery || `${post.name} ${post.title} ${post.topic}`.toLowerCase().includes(normalizedQuery);
      return matchesTopic && matchesQuery;
    });
  }, [activeTopic, query]);

  const listHeader = (
    <>
      <View style={styles.header}>
        <View style={styles.brand}>
          <CameraLogo />
          <Text style={styles.brandName}>Codexgram</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Focus search" accessibilityRole="button" onPress={() => searchRef.current?.focus()} style={styles.headerAction}>
            <SearchGlyph color={colors.ink} size={25} />
          </Pressable>
          <Pressable accessibilityLabel="Create post" accessibilityRole="button" style={styles.headerAction}>
            <Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke={colors.blue} strokeWidth={2} strokeLinecap="round" /></Svg>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <SearchGlyph />
        <TextInput
          ref={searchRef}
          accessibilityLabel="Search people, posts, or topics"
          onChangeText={setQuery}
          placeholder="Search people, posts, or topics..."
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <Pressable accessibilityRole="button" style={styles.seeAll}>
          <Text style={styles.seeAllText}>See all</Text>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="m9 5 7 7-7 7" fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
        {suggestions.map((person) => <FollowSuggestion key={person.id} person={person} />)}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsRow}>
        {topics.slice(0, 7).map((topic) => (
          <TopicChip key={topic} label={topic} selected={activeTopic === topic} onPress={() => setActiveTopic(topic)} />
        ))}
        <Pressable accessibilityLabel="More topics" accessibilityRole="button" style={styles.moreTopics}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" fill="none" stroke="#46536A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FlatList
        data={visiblePosts}
        keyExtractor={(post) => post.id}
        numColumns={3}
        renderItem={({ item }) => <ExploreCard post={item} width={tileWidth} />}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { height: 56, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  cameraBody: { width: 25, height: 20, borderRadius: 6, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  cameraTop: { position: "absolute", left: 4, top: -3, width: 8, height: 4, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: colors.white },
  cameraLens: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#1A2A61", alignItems: "center", justifyContent: "center" },
  cameraCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4F86FF", borderWidth: 1.5, borderColor: "#B8D2FF" },
  cameraDot: { position: "absolute", right: 3, top: 4, width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: "#4F5EFF" },
  brandName: { color: colors.ink, fontSize: 21, fontWeight: "800", letterSpacing: -0.45 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  searchBar: { height: 48, marginHorizontal: 18, marginTop: 8, marginBottom: 16, paddingHorizontal: 15, borderRadius: 25, backgroundColor: colors.pale, flexDirection: "row", alignItems: "center", gap: 11 },
  searchInput: { flex: 1, height: "100%", padding: 0, color: colors.ink, fontSize: 14 },
  sectionHeading: { height: 26, marginBottom: 8, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 3 },
  seeAllText: { color: colors.blue, fontSize: 13, fontWeight: "600" },
  suggestionsRow: { paddingHorizontal: 12, gap: 8, paddingBottom: 11 },
  suggestion: { width: 83, alignItems: "center" },
  suggestionRing: { width: 58, height: 58, padding: 2, borderRadius: 29, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  suggestionAvatar: { width: 50, height: 50, borderRadius: 25 },
  suggestionName: { width: 83, marginTop: 3, color: colors.ink, fontSize: 10.5, lineHeight: 14, textAlign: "center", fontWeight: "600" },
  suggestionCategory: { width: 83, marginTop: 1, color: colors.muted, fontSize: 9.5, lineHeight: 13, textAlign: "center" },
  followButton: { width: 68, height: 25, marginTop: 5, borderRadius: 14, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  followText: { color: colors.white, fontSize: 10.5, lineHeight: 13, fontWeight: "600" },
  followingButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  followingText: { color: colors.ink },
  topicsRow: { paddingHorizontal: 12, gap: 6, paddingTop: 3, paddingBottom: 10, alignItems: "center" },
  topicChip: { height: 32, minWidth: 48, paddingHorizontal: 13, borderRadius: 18, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  selectedTopicChip: { backgroundColor: colors.blue },
  topicLabel: { color: "#526079", fontSize: 11.5, lineHeight: 15 },
  selectedTopicLabel: { color: colors.white, fontWeight: "600" },
  moreTopics: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  gridContent: { paddingHorizontal: 6, paddingBottom: 12 },
  gridRow: { gap: 5, marginBottom: 7 },
  postCard: { overflow: "hidden", borderRadius: 11, backgroundColor: colors.white, shadowColor: "#17233B", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  postPhoto: { width: "100%", aspectRatio: 0.78, position: "relative", overflow: "hidden", justifyContent: "space-between" },
  photoShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(5, 15, 35, 0.10)" },
  photoHeader: { height: 34, paddingHorizontal: 5, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(17, 28, 49, 0.16)" },
  postAvatar: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: colors.white },
  postAuthor: { flex: 1, marginLeft: 4, color: colors.white, fontSize: 9, fontWeight: "700" },
  postMore: { width: 19, height: 24, alignItems: "center", justifyContent: "center" },
  likeCount: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingBottom: 7 },
  likeText: { color: colors.white, fontSize: 11, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 3 },
  postTitle: { minHeight: 43, paddingHorizontal: 6, paddingTop: 5, paddingBottom: 6, color: colors.ink, fontSize: 10.5, lineHeight: 14, fontWeight: "500" },
});
