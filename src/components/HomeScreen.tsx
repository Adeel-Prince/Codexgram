import { Image, type ImageSource } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

type StorySlide = {
  id: string;
  username: string;
  displayName: string;
  avatar: ImageSource;
  media: ImageSource;
};

type StoryGroup = {
  id: string;
  username: string;
  avatar: ImageSource;
  ring: string;
  isMine: boolean;
  slides: StorySlide[];
};

const demoStories: StoryGroup[] = [
  { id: "demo-alex", username: "alex.rivera", avatar: require("../../assets/images/feed/alex.png"), ring: "#1684FF", isMine: false, slides: [{ id: "demo-alex-slide", username: "alex.rivera", displayName: "Alex Rivera", avatar: require("../../assets/images/feed/alex.png"), media: require("../../assets/images/feed/lake.png") }] },
  { id: "demo-maya", username: "maya.b", avatar: require("../../assets/images/feed/maya.png"), ring: "#E84390", isMine: false, slides: [{ id: "demo-maya-slide", username: "maya.b", displayName: "Maya Brooks", avatar: require("../../assets/images/feed/maya.png"), media: require("../../assets/images/feed/dog-beach.png") }] },
  { id: "demo-jordan", username: "jordan.k", avatar: require("../../assets/images/feed/jordan.png"), ring: "#A279FF", isMine: false, slides: [{ id: "demo-jordan-slide", username: "jordan.k", displayName: "Jordan Kim", avatar: require("../../assets/images/feed/jordan.png"), media: require("../../assets/images/profile/grid-city.png") }] },
  { id: "demo-taylor", username: "taylor.b", avatar: require("../../assets/images/feed/taylor.png"), ring: "#26BDD0", isMine: false, slides: [{ id: "demo-taylor-slide", username: "taylor.b", displayName: "Taylor Bennett", avatar: require("../../assets/images/feed/taylor.png"), media: require("../../assets/images/profile/grid-palms.png") }] },
  { id: "demo-casey", username: "casey.dev", avatar: require("../../assets/images/feed/casey.png"), ring: "#72A4F6", isMine: false, slides: [{ id: "demo-casey-slide", username: "casey.dev", displayName: "Casey Morgan", avatar: require("../../assets/images/feed/casey.png"), media: require("../../assets/images/profile/grid-coast.png") }] },
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

function StoryRail({ groups, onOpen, onCreate }: { groups: StoryGroup[]; onOpen: (groupId: string) => void; onCreate: () => void }) {
  const ownStory = groups.find((group) => group.isMine);
  const otherStories = groups.filter((group) => !group.isMine);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories} contentContainerStyle={styles.storiesContent}>
      <View style={styles.story}>
        <Pressable accessibilityLabel={ownStory ? "View your story" : "Create a story"} accessibilityRole="button" onPress={() => ownStory ? onOpen(ownStory.id) : onCreate()} style={styles.storyButton}>
          {ownStory ? (
            <View style={[styles.storyRing, { borderColor: palette.blue }]}>
              <Image source={ownStory.avatar} contentFit="cover" style={styles.storyImage} />
              <View style={styles.addStoryBadge}><Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" /></Svg></View>
            </View>
          ) : (
            <View style={[styles.storyCircle, styles.addStoryCircle]}><Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke={palette.blue} strokeWidth={2} strokeLinecap="round" /></Svg></View>
          )}
          <Text numberOfLines={1} style={styles.storyName}>Your story</Text>
        </Pressable>
        {ownStory ? <Pressable accessibilityLabel="Add another story" accessibilityRole="button" onPress={onCreate} style={styles.addStoryHitTarget} /> : null}
      </View>
      {otherStories.map((story) => (
        <Pressable key={story.id} accessibilityRole="button" accessibilityLabel={`View ${story.username}'s story`} onPress={() => onOpen(story.id)} style={styles.story}>
          <View style={[styles.storyRing, { borderColor: story.ring }]}><Image source={story.avatar} contentFit="cover" style={styles.storyImage} /></View>
          <Text numberOfLines={1} style={styles.storyName}>{story.username}</Text>
        </Pressable>
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

function StoryViewer({ group, slideIndex, onClose, onPrevious, onNext }: { group: StoryGroup; slideIndex: number; onClose: () => void; onPrevious: () => void; onNext: () => void }) {
  const slide = group.slides[slideIndex];
  if (!slide) return null;
  return (
    <View style={styles.viewer}>
      <Image source={slide.media} contentFit="cover" style={StyleSheet.absoluteFill} />
      <View style={styles.viewerShade} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.viewerSafe}>
        <View style={styles.progressRow}>
          {group.slides.map((item, index) => <View key={item.id} style={styles.progressTrack}><View style={[styles.progressFill, index <= slideIndex && styles.progressComplete]} /></View>)}
        </View>
        <View style={styles.viewerHeader}>
          <Image source={slide.avatar} contentFit="cover" style={styles.viewerAvatar} />
          <View style={styles.viewerIdentity}><Text style={styles.viewerUsername}>{slide.username}</Text><Text style={styles.viewerTime}>Story</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close story" onPress={onClose} hitSlop={12} style={styles.closeButton}><Svg width={25} height={25} viewBox="0 0 24 24"><Path d="m6 6 12 12M18 6 6 18" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" /></Svg></Pressable>
        </View>
        <View style={styles.viewerTapZones}>
          <Pressable accessibilityLabel="Previous story" onPress={onPrevious} style={styles.viewerTapZone} />
          <Pressable accessibilityLabel="Next story" onPress={onNext} style={styles.viewerTapZone} />
        </View>
        <Text numberOfLines={2} style={styles.viewerCaption}>{slide.displayName}</Text>
      </SafeAreaView>
    </View>
  );
}

export function HomeScreen() {
  const posts = useQuery(api.posts.homeFeed, {});
  const activeStories = useQuery(api.stories.active, {});
  const [viewer, setViewer] = useState<{ groupId: string; slideIndex: number } | null>(null);
  const storyGroups = useMemo(() => {
    const groupsByAuthor = new Map<string, StoryGroup>();
    for (const story of activeStories ?? []) {
      if (!story.mediaUrl) continue;
      const groupId = story.author._id;
      const existing = groupsByAuthor.get(groupId);
      const slide: StorySlide = {
        id: story._id,
        username: story.author.username,
        displayName: story.author.displayName,
        avatar: story.author.avatarUrl ? { uri: story.author.avatarUrl } : require("../../assets/images/profile/portrait.png"),
        media: { uri: story.mediaUrl },
      };
      if (existing) existing.slides.push(slide);
      else groupsByAuthor.set(groupId, {
        id: groupId,
        username: story.author.username,
        avatar: slide.avatar,
        ring: story.isMine ? palette.blue : "#E84390",
        isMine: story.isMine,
        slides: [slide],
      });
    }

    const actualGroups = [...groupsByAuthor.values()];
    const demoGroups = demoStories.map((demo) => actualGroups.find((group) => group.username === demo.username) ?? demo);
    const nonDemoActualGroups = actualGroups.filter((group) => !demoStories.some((demo) => demo.username === group.username));
    return [...actualGroups.filter((group) => group.isMine), ...demoGroups, ...nonDemoActualGroups.filter((group) => !group.isMine)];
  }, [activeStories]);
  const currentGroupIndex = viewer ? storyGroups.findIndex((group) => group.id === viewer.groupId) : -1;
  const currentGroup = currentGroupIndex >= 0 ? storyGroups[currentGroupIndex] : null;

  const openStory = (groupId: string) => setViewer({ groupId, slideIndex: 0 });
  const closeStory = () => setViewer(null);
  const goToStory = (direction: -1 | 1) => {
    if (!viewer || currentGroupIndex < 0 || !currentGroup) return;
    const nextSlideIndex = viewer.slideIndex + direction;
    if (nextSlideIndex >= 0 && nextSlideIndex < currentGroup.slides.length) {
      setViewer({ ...viewer, slideIndex: nextSlideIndex });
      return;
    }
    const nextGroup = storyGroups[currentGroupIndex + direction];
    if (!nextGroup) {
      if (direction > 0) closeStory();
      else setViewer({ groupId: storyGroups[0].id, slideIndex: 0 });
      return;
    }
    setViewer({ groupId: nextGroup.id, slideIndex: direction > 0 ? 0 : nextGroup.slides.length - 1 });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(post) => post._id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<><Header /><StoryRail groups={storyGroups} onOpen={openStory} onCreate={() => router.push("/create-story")} /></>}
        ListEmptyComponent={posts === undefined ? <ActivityIndicator color={palette.blue} style={styles.loading} /> : <EmptyFeed />}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      />
      <Modal visible={currentGroup !== null} animationType="fade" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={closeStory}>
        {currentGroup ? <StoryViewer group={currentGroup} slideIndex={viewer?.slideIndex ?? 0} onClose={closeStory} onPrevious={() => goToStory(-1)} onNext={() => goToStory(1)} /> : null}
      </Modal>
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
  story: { width: 63, alignItems: "center", position: "relative" },
  storyButton: { alignItems: "center" },
  storyCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  addStoryCircle: { backgroundColor: "#EAF3FF" },
  storyRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, padding: 2, alignItems: "center", justifyContent: "center" },
  storyImage: { width: 50, height: 50, borderRadius: 25 },
  storyName: { width: 62, marginTop: 4, color: "#49556D", fontSize: 10.5, textAlign: "center" },
  addStoryBadge: { position: "absolute", right: -2, bottom: -1, width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: palette.white, alignItems: "center", justifyContent: "center", backgroundColor: palette.blue },
  addStoryHitTarget: { position: "absolute", right: 0, top: 0, width: 22, height: 22 },
  loading: { marginTop: 30 },
  emptyFeed: { alignItems: "center", paddingHorizontal: 36, paddingTop: 54 },
  emptyTitle: { color: palette.ink, fontSize: 18, fontWeight: "700" },
  emptyDescription: { marginTop: 8, color: palette.muted, fontSize: 13, lineHeight: 18, textAlign: "center" },
  exploreButton: { marginTop: 16, paddingHorizontal: 18, height: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: palette.blue },
  exploreButtonText: { color: palette.white, fontSize: 13, fontWeight: "700" },
  viewer: { flex: 1, backgroundColor: "#000000" },
  viewerShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.18)" },
  viewerSafe: { flex: 1, paddingHorizontal: 12 },
  progressRow: { flexDirection: "row", gap: 4, marginTop: 8 },
  progressTrack: { flex: 1, height: 2.5, overflow: "hidden", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  progressFill: { width: "0%", height: "100%", backgroundColor: palette.white },
  progressComplete: { width: "100%" },
  viewerHeader: { height: 52, flexDirection: "row", alignItems: "center", marginTop: 8 },
  viewerAvatar: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: "#FFFFFF" },
  viewerIdentity: { flex: 1, marginLeft: 9 },
  viewerUsername: { color: palette.white, fontSize: 13, fontWeight: "700" },
  viewerTime: { marginTop: 2, color: "rgba(255,255,255,0.8)", fontSize: 11 },
  closeButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  viewerTapZones: { flex: 1, flexDirection: "row" },
  viewerTapZone: { flex: 1 },
  viewerCaption: { marginHorizontal: 10, marginBottom: 24, color: palette.white, fontSize: 15, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 4 },
});
