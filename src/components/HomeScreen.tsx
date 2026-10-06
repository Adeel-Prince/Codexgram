import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { BrandLogo } from "./BrandLogo";
import { PostCard } from "./PostCard";

const palette = {
  ink: "#111827",
  muted: "#74829B",
  blue: "#1677F8",
  white: "#FFFFFF",
};

const stories = [
  { name: "alex.rivera", image: require("../../assets/images/feed/alex.png"), ring: "#1684FF" },
  { name: "maya.b", image: require("../../assets/images/feed/maya.png"), ring: "#E84390" },
  { name: "jordan.k", image: require("../../assets/images/feed/jordan.png"), ring: "#A279FF" },
  { name: "taylor.b", image: require("../../assets/images/feed/taylor.png"), ring: "#26BDD0" },
  { name: "casey.dev", image: require("../../assets/images/feed/casey.png"), ring: "#72A4F6" },
];

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <BrandLogo size={37} />
        <Text style={styles.brandName}>Codexgram</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Explore posts" accessibilityRole="button" onPress={() => router.navigate("/(tabs)/explore")} style={styles.actionCircle}>
          <Svg width={25} height={25} viewBox="0 0 24 24"><Circle cx="10.8" cy="10.8" r="6.9" fill="none" stroke="#111C34" strokeWidth={1.9} /><Path d="m16 16 4.4 4.4" fill="none" stroke="#111C34" strokeWidth={1.9} strokeLinecap="round" /></Svg>
        </Pressable>
        <Pressable accessibilityLabel="Create post" accessibilityRole="button" onPress={() => router.push("/create-post")} style={[styles.actionCircle, styles.addCircle]}>
          <Svg width={25} height={25} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke={palette.blue} strokeWidth={2} strokeLinecap="round" /></Svg>
        </Pressable>
      </View>
    </View>
  );
}

function Stories() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories} contentContainerStyle={styles.storiesContent}>
      <Pressable accessibilityLabel="Create a story" accessibilityRole="button" onPress={() => router.push("/create-post")} style={styles.story}>
        <View style={[styles.storyCircle, styles.addStoryCircle]}><Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke={palette.blue} strokeWidth={2} strokeLinecap="round" /></Svg></View>
        <Text numberOfLines={1} style={styles.storyName}>Your story</Text>
      </Pressable>
      {stories.map((story) => (
        <View key={story.name} style={styles.story}>
          <View style={[styles.storyRing, { borderColor: story.ring }]}><Image source={story.image} contentFit="cover" style={styles.storyImage} /></View>
          <Text numberOfLines={1} style={styles.storyName}>{story.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EmptyFeed() {
  return (
    <View style={styles.emptyFeed}>
      <Text style={styles.emptyTitle}>Your feed is quiet</Text>
      <Text style={styles.emptyDescription}>Follow people in Explore to see their posts here.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.navigate("/(tabs)/explore")} style={styles.exploreButton}><Text style={styles.exploreButtonText}>Explore people</Text></Pressable>
    </View>
  );
}

export function HomeScreen() {
  const posts = useQuery(api.posts.homeFeed, {});
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(post) => post._id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<><Header /><Stories /></>}
        ListEmptyComponent={posts === undefined ? <ActivityIndicator color={palette.blue} style={styles.loading} /> : <EmptyFeed />}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.white },
  feedContent: { paddingBottom: 12, flexGrow: 1 },
  header: { height: 56, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  loading: { marginTop: 30 },
  emptyFeed: { alignItems: "center", paddingHorizontal: 36, paddingTop: 54 },
  emptyTitle: { color: palette.ink, fontSize: 18, fontWeight: "700" },
  emptyDescription: { marginTop: 8, color: palette.muted, fontSize: 13, lineHeight: 18, textAlign: "center" },
  exploreButton: { marginTop: 16, paddingHorizontal: 18, height: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: palette.blue },
  exploreButtonText: { color: palette.white, fontSize: 13, fontWeight: "700" },
});
