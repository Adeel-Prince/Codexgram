import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const palette = {
  ink: "#111827",
  muted: "#74829B",
  blue: "#1677F8",
  border: "#E7EBF2",
  softBlue: "#EDF5FF",
  white: "#FFFFFF",
};

const stories = [
  { name: "alex.rivera", image: require("../../assets/images/feed/alex.png"), ring: "#1684FF" },
  { name: "maya.b", image: require("../../assets/images/feed/maya.png"), ring: "#E84390" },
  { name: "jordan.k", image: require("../../assets/images/feed/jordan.png"), ring: "#A279FF" },
  { name: "taylor.b", image: require("../../assets/images/feed/taylor.png"), ring: "#26BDD0" },
  { name: "casey.dev", image: require("../../assets/images/feed/casey.png"), ring: "#72A4F6" },
];

type PostData = {
  id: string;
  name: string;
  location: string;
  age: string;
  avatar: number;
  image: number;
  title: string;
  description: string;
  tags: string[];
  likes: number;
  comments: number;
};

const posts: PostData[] = [
  {
    id: "lake",
    name: "alex.rivera",
    location: "Lake Louise, Canada",
    age: "2h ago",
    avatar: require("../../assets/images/feed/alex.png"),
    image: require("../../assets/images/feed/lake.png"),
    title: "Morning views at Lake Louise ⛰️",
    description: "Grateful for days like this.",
    tags: ["#travel", "#nature", "#canada"],
    likes: 124,
    comments: 3,
  },
  {
    id: "beach",
    name: "maya.b",
    location: "San Diego, CA",
    age: "1d ago",
    avatar: require("../../assets/images/feed/maya.png"),
    image: require("../../assets/images/feed/dog-beach.png"),
    title: "Beach days are always better 💙",
    description: "Sandy paws, happy heart.",
    tags: ["#dogs", "#ocean", "#goodvibes"],
    likes: 86,
    comments: 5,
  },
  {
    id: "mountain",
    name: "jordan.k",
    location: "Banff National Park",
    age: "3d ago",
    avatar: require("../../assets/images/feed/jordan.png"),
    image: require("../../assets/images/feed/lake.png"),
    title: "A little time in the mountains",
    description: "Fresh air and quiet trails.",
    tags: ["#weekend", "#outdoors"],
    likes: 57,
    comments: 2,
  },
];

function Glyph({
  name,
  color = palette.ink,
  size = 24,
  filled = false,
}: {
  name: "search" | "plus" | "more" | "heart" | "comment" | "send" | "bookmark" | "home" | "message" | "explore" | "profile";
  color?: string;
  size?: number;
  filled?: boolean;
}) {
  const common = { stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "search" ? <><Circle cx="10.8" cy="10.8" r="6.9" fill="none" {...common} /><Path d="m16 16 4.4 4.4" fill="none" {...common} /></> : null}
      {name === "plus" ? <Path d="M12 5v14M5 12h14" fill="none" {...common} /> : null}
      {name === "more" ? <><Circle cx="4.5" cy="12" r="1.2" fill={color} /><Circle cx="12" cy="12" r="1.2" fill={color} /><Circle cx="19.5" cy="12" r="1.2" fill={color} /></> : null}
      {name === "heart" ? <Path d="M20.5 8.7c0 4.1-8.5 10.1-8.5 10.1S3.5 12.8 3.5 8.7a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" fill={filled ? color : "none"} {...common} /> : null}
      {name === "comment" ? <Path d="M20 11.4a7.8 7.8 0 0 1-8.1 7.5 8.8 8.8 0 0 1-3.8-.8L4 19l1.1-3.4a7.1 7.1 0 0 1-1.3-4.2 7.8 7.8 0 0 1 8.1-7.5 7.8 7.8 0 0 1 8.1 7.5Z" fill="none" {...common} /> : null}
      {name === "send" ? <Path d="m21 3-7.2 18-3.5-7.3L3 10.2 21 3Zm0 0L10.3 13.7" fill="none" {...common} /> : null}
      {name === "bookmark" ? <Path d="M6.5 20V5.5A1.5 1.5 0 0 1 8 4h8a1.5 1.5 0 0 1 1.5 1.5V20L12 16.5 6.5 20Z" fill={filled ? color : "none"} {...common} /> : null}
      {name === "home" ? <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" fill={filled ? color : "none"} {...common} /> : null}
      {name === "message" ? <Path d="M20 11.5a7.5 7.5 0 0 1-7.9 7.2 9 9 0 0 1-3.8-.8L4 19l1.2-3.4a6.9 6.9 0 0 1-1.3-4.1A7.5 7.5 0 0 1 12 4.3a7.5 7.5 0 0 1 8 7.2Z" fill="none" {...common} /> : null}
      {name === "explore" ? <><Circle cx="12" cy="12" r="8.5" fill="none" {...common} /><Path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1 5.1-2.5Z" fill="none" {...common} /></> : null}
      {name === "profile" ? <><Circle cx="12" cy="7.5" r="3.4" fill="none" {...common} /><Path d="M4.5 21v-1.4a7.5 7.5 0 0 1 15 0V21" fill="none" {...common} /></> : null}
    </Svg>
  );
}

function CameraLogo() {
  return (
    <View style={styles.logo}>
      <View style={styles.logoBody}>
        <View style={styles.logoTop} />
        <View style={styles.logoLens}><View style={styles.logoCore} /></View>
        <View style={styles.logoDot} />
      </View>
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <CameraLogo />
        <Text style={styles.brandName}>Codexgram</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Search" accessibilityRole="button" style={styles.actionCircle}>
          <Glyph name="search" size={25} color="#111C34" />
        </Pressable>
        <Pressable accessibilityLabel="Create post" accessibilityRole="button" style={[styles.actionCircle, styles.addCircle]}>
          <Glyph name="plus" size={25} color={palette.blue} />
        </Pressable>
      </View>
    </View>
  );
}

function Stories() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.stories}
      contentContainerStyle={styles.storiesContent}
    >
      <View style={styles.story}>
        <View style={[styles.storyCircle, styles.addStoryCircle]}><Glyph name="plus" size={26} color={palette.blue} /></View>
        <Text numberOfLines={1} style={styles.storyName}>Your story</Text>
      </View>
      {stories.map((story) => (
        <View key={story.name} style={styles.story}>
          <View style={[styles.storyRing, { borderColor: story.ring }]}>
            <Image source={story.image} contentFit="cover" style={styles.storyImage} />
          </View>
          <Text numberOfLines={1} style={styles.storyName}>{story.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Post({ post }: { post: PostData }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image source={post.avatar} contentFit="cover" style={styles.avatar} />
        <View style={styles.authorText}>
          <Text style={styles.authorName}>{post.name}</Text>
          <Text style={styles.location}>{post.age} · {post.location}</Text>
        </View>
        <Pressable accessibilityLabel="More post options" accessibilityRole="button" hitSlop={10} style={styles.moreButton}>
          <Glyph name="more" size={22} color="#68758C" />
        </Pressable>
      </View>
      <View style={styles.photoFrame}>
        <Image source={post.image} contentFit="cover" style={styles.postImage} />
      </View>
      <View style={styles.postDetails}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postDescription}>{post.description}</Text>
        <View style={styles.tags}>
          {post.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View>
        <View style={styles.postActions}>
          <Pressable accessibilityLabel={liked ? "Unlike post" : "Like post"} accessibilityRole="button" onPress={() => setLiked((value) => !value)} style={styles.metricAction}>
            <Glyph name="heart" size={25} color={liked ? "#FF334F" : "#FF3B50"} filled={liked} />
            <Text style={styles.metric}>{post.likes + (liked ? 1 : 0)}</Text>
          </Pressable>
          <Pressable accessibilityLabel="View comments" accessibilityRole="button" style={styles.metricAction}>
            <Glyph name="comment" size={24} color="#101C36" />
            <Text style={styles.metric}>{post.comments}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Share post" accessibilityRole="button" style={styles.iconAction}>
            <Glyph name="send" size={23} color="#101C36" />
          </Pressable>
          <Pressable accessibilityLabel={saved ? "Remove bookmark" : "Bookmark post"} accessibilityRole="button" onPress={() => setSaved((value) => !value)} style={styles.bookmarkAction}>
            <Glyph name="bookmark" size={24} color="#101C36" filled={saved} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function HomeScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <Post post={item} />}
        ListHeaderComponent={<><Header /><Stories /></>}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.white },
  feedContent: { paddingBottom: 12 },
  header: { height: 56, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 37, height: 37, borderRadius: 12, backgroundColor: "#335CFF", alignItems: "center", justifyContent: "center" },
  logoBody: { width: 25, height: 20, borderRadius: 6, backgroundColor: "#F8FBFF", alignItems: "center", justifyContent: "center" },
  logoTop: { position: "absolute", left: 4, top: -3, width: 8, height: 4, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: "#F8FBFF" },
  logoLens: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#1A2A61", alignItems: "center", justifyContent: "center" },
  logoCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4F86FF", borderWidth: 1.5, borderColor: "#B8D2FF" },
  logoDot: { position: "absolute", right: 3, top: 4, width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: "#4F5EFF" },
  brandName: { color: palette.ink, fontSize: 21, fontWeight: "800", letterSpacing: -0.45 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 11 },
  actionCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F2F5FA", alignItems: "center", justifyContent: "center" },
  addCircle: { backgroundColor: "#E8F2FF" },
  stories: { width: "100%", height: 101, flexGrow: 0, overflow: "hidden", borderBottomWidth: 1, borderBottomColor: "#F3F5F8" },
  storiesContent: { paddingHorizontal: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  story: { width: 63, alignItems: "center" },
  storyCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  addStoryCircle: { backgroundColor: "#EAF3FF" },
  storyRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, padding: 2, alignItems: "center", justifyContent: "center" },
  storyImage: { width: 50, height: 50, borderRadius: 25 },
  storyName: { width: 62, marginTop: 4, color: "#49556D", fontSize: 10.5, textAlign: "center" },
  post: { marginHorizontal: 11, marginTop: 9, marginBottom: 2, padding: 8, borderRadius: 18, backgroundColor: palette.white, shadowColor: "#18233B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  postHeader: { height: 47, flexDirection: "row", alignItems: "center", paddingHorizontal: 3 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8EDF5" },
  authorText: { marginLeft: 9, flex: 1, justifyContent: "center" },
  authorName: { color: palette.ink, fontSize: 13.5, fontWeight: "700" },
  location: { marginTop: 2, color: palette.muted, fontSize: 11 },
  moreButton: { width: 32, height: 36, alignItems: "center", justifyContent: "center" },
  photoFrame: { position: "relative", overflow: "hidden", borderRadius: 13 },
  postImage: { width: "100%", aspectRatio: 2.11, backgroundColor: "#E7EDF4" },
  postDetails: { paddingHorizontal: 5, paddingTop: 8 },
  postTitle: { color: palette.ink, fontSize: 13.5, lineHeight: 18, fontWeight: "700" },
  postDescription: { marginTop: 2, color: palette.muted, fontSize: 12.5, lineHeight: 17 },
  tags: { flexDirection: "row", gap: 6, marginTop: 7 },
  tag: { overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "#EDF4FF", color: "#2C69C9", fontSize: 10.5, lineHeight: 14 },
  postActions: { height: 38, marginTop: 6, flexDirection: "row", alignItems: "center" },
  metricAction: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 21 },
  iconAction: { width: 30, height: 32, alignItems: "center", justifyContent: "center" },
  bookmarkAction: { width: 34, height: 32, marginLeft: "auto", alignItems: "center", justifyContent: "center" },
  metric: { color: "#3B465D", fontSize: 12.5 },
});
