import { useAuth, useClerk } from "@clerk/expo";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type SettingsIconName = "profile" | "account" | "notifications" | "privacy" | "blocked" | "saved" | "help" | "report" | "document" | "about" | "signout" | "delete";

function SettingsIcon({ name, color = "#101B32", size = 24 }: { name: SettingsIconName; color?: string; size?: number }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "profile") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M19.5 20v-1.4a4.5 4.5 0 0 0-4.5-4.5H9a4.5 4.5 0 0 0-4.5 4.5V20M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" {...common} /></Svg>;
  if (name === "account") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.87 2h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.23-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.05.31-.08.63-.08.95s.03.64.08.95l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.21.37.3.61.22l2.39-.96c.5.4 1.04.71 1.63.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.23 1.13-.54 1.63-.94l2.39.96c.24.09.49-.01.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z" {...common} /><Circle cx="12" cy="12" r="3" {...common} /></Svg>;
  if (name === "notifications") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" {...common} /></Svg>;
  if (name === "privacy") return <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="4.5" y="10" width="15" height="11" rx="2" {...common} /><Path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" {...common} /></Svg>;
  if (name === "blocked") return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="9" {...common} /><Path d="m5.6 5.6 12.8 12.8" {...common} /></Svg>;
  if (name === "saved") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M6.5 21V5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v16L12 17l-5.5 4Z" {...common} /></Svg>;
  if (name === "help") return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="9" {...common} /><Path d="M9.7 9a2.4 2.4 0 1 1 4.3 1.5c-.9 1.1-2 1.3-2 3M12 17.5h.01" {...common} /></Svg>;
  if (name === "report") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M20 11.5a7.8 7.8 0 0 1-8 7.5 9 9 0 0 1-3.8-.8L4 20l1.2-3.2a7 7 0 0 1-1.2-3.8 7.8 7.8 0 0 1 8-7.5 7.8 7.8 0 0 1 8 6Z" {...common} /></Svg>;
  if (name === "document") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M6 3.5h8l4 4V21H6V3.5Z" {...common} /><Path d="M14 3.5v5h4M9 13h6M9 16.5h6" {...common} /></Svg>;
  if (name === "about") return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="9" {...common} /><Path d="M12 11v5M12 8h.01" {...common} /></Svg>;
  if (name === "signout") return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M13 4h-6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6M11 12h10M17 8l4 4-4 4" {...common} /></Svg>;
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" {...common} /></Svg>;
}

function Chevron() {
  return <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m9 5 7 7-7 7" fill="none" stroke="#74829B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function SettingsRow({ icon, label, onPress, detail, last = false }: { icon: SettingsIconName; label: string; onPress?: () => void; detail?: string; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}><SettingsIcon name={icon} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : <Chevron />}
    </Pressable>
  );
}

export default function SettingsRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const deleteMyAccount = useAction(api.accountDeletion.deleteMyAccount);
  const [busy, setBusy] = useState(false);
  if (!isLoaded) return <View style={styles.loading}><ActivityIndicator color="#1677F8" /></View>;
  if (!isSignedIn) return <Redirect href="/" />;

  const showUnavailable = (label: string) => Alert.alert(label, `${label} settings will be available soon.`);
  const confirmSignOut = () => Alert.alert("Sign out?", "You can sign back in at any time.", [
    { text: "Cancel", style: "cancel" },
    { text: "Sign Out", style: "destructive", onPress: () => {
      setBusy(true);
      void signOut().catch(() => {
        setBusy(false);
        Alert.alert("Unable to sign out", "Please try again.");
      });
    } },
  ]);
  const confirmDelete = () => Alert.alert(
    "Delete your account permanently?",
    "Your profile, posts, stories, comments, likes, and follows will be deleted. This cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete account",
        style: "destructive",
        onPress: () => {
          setBusy(true);
          void (async () => {
            try {
              await deleteMyAccount({});
              try {
                await signOut();
              } catch {
                // Deleting the Clerk user already revokes its sessions.
              }
              router.replace("/");
            } catch {
              setBusy(false);
              Alert.alert("Unable to delete account", "Please try again. If the problem continues, contact support.");
            }
          })();
        },
      },
    ],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      {busy ? <View style={styles.busy}><ActivityIndicator color="#1677F8" size="large" /></View> : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>Account</Text>
        <View style={styles.card}>
          <SettingsRow icon="profile" label="Edit profile" onPress={() => router.push("/edit-profile")} />
          <SettingsRow icon="account" label="Account" onPress={() => showUnavailable("Account")} />
          <SettingsRow icon="notifications" label="Notifications" onPress={() => showUnavailable("Notifications")} />
          <SettingsRow icon="privacy" label="Privacy" onPress={() => showUnavailable("Privacy")} />
          <SettingsRow icon="blocked" label="Blocked users" onPress={() => showUnavailable("Blocked users")} />
          <SettingsRow icon="saved" label="Saved posts" onPress={() => showUnavailable("Saved posts")} last />
        </View>

        <Text style={styles.sectionTitle}>Support &amp; Legal</Text>
        <View style={styles.card}>
          <SettingsRow icon="help" label="Help & support" onPress={() => showUnavailable("Help & support")} />
          <SettingsRow icon="report" label="Report a problem" onPress={() => showUnavailable("Report a problem")} />
          <SettingsRow icon="document" label="Privacy Policy" onPress={() => showUnavailable("Privacy Policy")} />
          <SettingsRow icon="document" label="Terms of Service" onPress={() => showUnavailable("Terms of Service")} />
          <SettingsRow icon="about" label="About" detail="Version 1.0 (2026)" last />
        </View>

        <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOutButton}>
          <SettingsIcon name="signout" color="#0877F9" size={24} /><Text style={styles.signOutLabel}>Sign Out</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.deleteButton}>
          <SettingsIcon name="delete" color="#F12D3C" size={24} /><Text style={styles.deleteLabel}>Delete Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 12 },
  title: { marginTop: 8, marginBottom: 12, paddingHorizontal: 18, color: "#101B32", fontSize: 32, lineHeight: 40, fontWeight: "800", letterSpacing: -0.7 },
  sectionTitle: { marginTop: 16, marginBottom: 9, paddingHorizontal: 18, color: "#101B32", fontSize: 16, lineHeight: 21, fontWeight: "700" },
  firstSectionTitle: { marginTop: 5 },
  card: { marginHorizontal: 12, overflow: "hidden", borderWidth: 1, borderColor: "#E6EBF4", borderRadius: 18, backgroundColor: "#FFFFFF" },
  row: { minHeight: 42, flexDirection: "row", alignItems: "center", paddingLeft: 15, paddingRight: 15 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E8ECF3" },
  rowIcon: { width: 39, alignItems: "flex-start", justifyContent: "center" },
  rowLabel: { flex: 1, color: "#101B32", fontSize: 14.5, lineHeight: 19 },
  rowDetail: { color: "#74829B", fontSize: 13, lineHeight: 18 },
  signOutButton: { height: 51, marginHorizontal: 14, marginTop: 15, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "#EAF3FF" },
  signOutLabel: { color: "#0877F9", fontSize: 15, fontWeight: "700" },
  deleteButton: { height: 51, marginHorizontal: 14, marginTop: 10, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "#FFF0F1" },
  deleteLabel: { color: "#F12D3C", fontSize: 15, fontWeight: "700" },
  busy: { ...StyleSheet.absoluteFill, zIndex: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" },
});
