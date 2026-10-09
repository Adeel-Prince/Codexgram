import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../../../components/BrandLogo";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const profileTabs = [
  { id: "grid", label: "Posts" },
  { id: "reels", label: "Reels" },
  { id: "saved", label: "Saved" },
  { id: "tagged", label: "Tagged" },
] as const;

type ProfileTab = (typeof profileTabs)[number]["id"];

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <BrandLogo size={28} />
        <Text style={styles.brandName}>Codexgram</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Settings" accessibilityRole="button" hitSlop={8} onPress={() => router.push("/(tabs)/profile/settings")} style={styles.headerButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.87 2h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.23-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.05.31-.08.63-.08.95s.03.64.08.95l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.21.37.3.61.22l2.39-.96c.5.4 1.04.71 1.63.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.23 1.13-.54 1.63-.94l2.39.96c.24.09.49-.01.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z" fill="none" stroke="#101B32" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="none" stroke="#101B32" strokeWidth={1.7} />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ContentTabIcon({ tab, selected }: { tab: ProfileTab; selected: boolean }) {
  const color = selected ? "#1677F8" : "#8994A8";
  const shared = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (tab === "grid") {
    return (
      <Svg width={23} height={23} viewBox="0 0 24 24">
        {[4, 10, 16].flatMap((y) => [4, 10, 16].map((x) => <Rect key={`${x}-${y}`} x={x} y={y} width={4} height={4} rx={0.6} fill={color} />))}
      </Svg>
    );
  }
  if (tab === "reels") {
    return <Svg width={23} height={23} viewBox="0 0 24 24"><Rect x={3.5} y={3.5} width={17} height={17} rx={5} {...shared} /><Path d="m10 8.5 5.5 3.5-5.5 3.5v-7Z" {...shared} /></Svg>;
  }
  if (tab === "saved") {
    return <Svg width={23} height={23} viewBox="0 0 24 24"><Path d="M6.5 20V5.5A1.5 1.5 0 0 1 8 4h8a1.5 1.5 0 0 1 1.5 1.5V20L12 16.5 6.5 20Z" {...shared} /></Svg>;
  }
  return <Svg width={23} height={23} viewBox="0 0 24 24"><Rect x={3.5} y={4} width={17} height={16.5} rx={3} {...shared} /><Path d="M8 4V2.8M16 4V2.8M7.5 20.5v-1a4.5 4.5 0 0 1 9 0v1M12 9.2a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Z" {...shared} /></Svg>;
}

function GalleryTabs({ activeTab, onChange }: { activeTab: ProfileTab; onChange: (tab: ProfileTab) => void }) {
  return (
    <View style={styles.galleryTabs}>
      {profileTabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={styles.galleryTab}
          >
            <ContentTabIcon tab={tab.id} selected={selected} />
            <View style={[styles.tabIndicator, selected && styles.selectedTabIndicator]} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileRoute() {
  const { user } = useUser();
  const convexProfile = useQuery(api.profiles.myProfile, {});
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>("grid");
  const tileSize = (width - 20) / 3;
  const profileMetadata = user?.unsafeMetadata?.codexgramProfile as
    | { username?: string; bio?: string; website?: string; location?: string }
    | undefined;
  const profilePosts = usePaginatedQuery(
    api.posts.byProfile,
    convexProfile ? { profileId: convexProfile._id } : "skip",
    { initialNumItems: 30 },
  );

  const photos = activeTab === "reels"
    ? profilePosts.results.filter((post) => post.mediaType === "video")
    : activeTab === "grid"
      ? profilePosts.results
      : [];
  const bio = convexProfile?.bio || profileMetadata?.bio || "Product designer, coffee lover.\nExploring what’s next. ☕ 🌎";
  const visibleBio = bio.replace(/(^|\s)#[^\s#]+/g, " ").trim();

  const ListHeader = (
    <>
      <Header />
      <View style={styles.profileSummary}>
        <View style={styles.avatarWrap}>
          <Image source={user?.hasImage && user.imageUrl ? { uri: user.imageUrl } : require("../../../../assets/images/profile/portrait.png")} contentFit="cover" style={styles.avatar} />
          <View style={styles.avatarAdd}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" /></Svg>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat value={String(convexProfile?.postCount ?? 0)} label="Posts" />
          <Stat value={String(convexProfile?.followerCount ?? 0)} label="Followers" />
          <Stat value={String(convexProfile?.followingCount ?? 0)} label="Following" />
        </View>
      </View>
      <View style={styles.profileInfo}>
        <Text numberOfLines={1} style={styles.username}>{convexProfile?.username || profileMetadata?.username || user?.username || "alex.rivera"}</Text>
        <Text numberOfLines={1} style={styles.displayName}>{convexProfile?.displayName || user?.fullName || "Alex Rivera"}</Text>
        <Text style={styles.bio}>{visibleBio}</Text>
        <View style={styles.profileActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push("/edit-profile")} style={styles.editButton}>
            <Text style={styles.editButtonLabel}>Edit Profile</Text>
          </Pressable>
          <Pressable accessibilityLabel="Discover people" accessibilityRole="button" style={styles.discoverButton}>
            <Svg width={23} height={23} viewBox="0 0 24 24">
              <Path d="M15 20v-1.2a4.8 4.8 0 0 0-9.6 0V20M10.2 11.3a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM18 8v7M14.5 11.5h7" fill="none" stroke="#111B30" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </View>
      <GalleryTabs activeTab={activeTab} onChange={setActiveTab} />
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FlatList
        key={activeTab}
        data={photos}
        keyExtractor={(item) => item._id}
        numColumns={3}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel="Open post comments" onPress={() => router.push({ pathname: "/comments/[postId]", params: { postId: item._id } })}>
            {item.mediaType === "image" && item.mediaUrl
              ? <Image source={{ uri: item.mediaUrl }} contentFit="cover" style={{ width: tileSize, height: tileSize }} />
              : <View style={[styles.videoGridTile, { width: tileSize, height: tileSize }]}><Text style={styles.videoGridLabel}>▶</Text></View>}
          </Pressable>
        )}
        ListEmptyComponent={profilePosts.status === "LoadingFirstPage" ? <ActivityIndicator color="#1677F8" style={styles.galleryLoading} /> : <Text style={styles.galleryEmpty}>{activeTab === "saved" ? "Saved posts will appear here." : activeTab === "tagged" ? "Posts you’re tagged in will appear here." : "Your posts will appear here."}</Text>}
        ListFooterComponent={profilePosts.status === "CanLoadMore" ? <Pressable onPress={() => profilePosts.loadMore(30)} style={styles.galleryMore}><Text style={styles.galleryMoreLabel}>Load more posts</Text></Pressable> : null}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 50, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { color: "#111827", fontSize: 21, fontWeight: "800", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  profileSummary: { flexDirection: "row", alignItems: "center", marginTop: 15, paddingHorizontal: 18 },
  avatarWrap: { width: 112, height: 112, position: "relative" },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: "#E9F1FA" },
  avatarAdd: { position: "absolute", right: 5, bottom: 3, width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "#1677F8", alignItems: "center", justifyContent: "center" },
  stats: { flex: 1, flexDirection: "row", justifyContent: "space-around", marginLeft: 12 },
  stat: { minWidth: 55, alignItems: "center" },
  statValue: { color: "#111827", fontSize: 18, lineHeight: 23, fontWeight: "700" },
  statLabel: { marginTop: 2, color: "#77839A", fontSize: 13.5, lineHeight: 18 },
  profileInfo: { paddingHorizontal: 18, marginTop: 8 },
  username: { color: "#111827", fontSize: 17, lineHeight: 22, fontWeight: "700" },
  displayName: { marginTop: 1, color: "#77839A", fontSize: 15.5, lineHeight: 21 },
  bio: { marginTop: 5, color: "#111827", fontSize: 14.5, lineHeight: 20 },
  profileActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  editButton: { flex: 1, height: 44, borderRadius: 15, borderWidth: 1, borderColor: "#E7EBF2", backgroundColor: "#F5F6F9", alignItems: "center", justifyContent: "center" },
  editButtonLabel: { color: "#111827", fontSize: 14, fontWeight: "700" },
  discoverButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: "#E7EBF2", backgroundColor: "#F5F6F9", alignItems: "center", justifyContent: "center" },
  galleryTabs: { height: 49, flexDirection: "row", marginTop: 10, borderBottomWidth: 1, borderBottomColor: "#E8ECF2" },
  galleryTab: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  tabIndicator: { position: "absolute", bottom: -1, left: 0, right: 0, height: 2.5 },
  selectedTabIndicator: { backgroundColor: "#1677F8", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  gridContent: { paddingHorizontal: 6, paddingTop: 4, paddingBottom: 10 },
  gridRow: { gap: 4, marginBottom: 4 },
  videoGridTile: { alignItems: "center", justifyContent: "center", backgroundColor: "#24334E" },
  videoGridLabel: { color: "#FFFFFF", fontSize: 22 },
  galleryLoading: { marginTop: 28 },
  galleryEmpty: { paddingHorizontal: 28, paddingVertical: 30, color: "#77839A", textAlign: "center", fontSize: 13 },
  galleryMore: { alignItems: "center", paddingVertical: 14 },
  galleryMoreLabel: { color: "#1677F8", fontSize: 12, fontWeight: "600" },
});
