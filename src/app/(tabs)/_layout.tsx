import { useAuth } from "@clerk/expo";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (!isConvexAuthenticated) return <Loading />;

  return <AuthenticatedTabs />;
}

function AuthenticatedTabs() {
  const ensureMyProfile = useMutation(api.profiles.ensureMyProfile);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void ensureMyProfile({})
      .then(() => { if (active) setReady(true); })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not prepare your profile.");
      });
    return () => { active = false; };
  }, [attempt, ensureMyProfile]);

  if (error) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1677F8" size="large" />
        <Text style={styles.error}>{error}</Text>
        <Text onPress={() => { setError(""); setAttempt((value) => value + 1); }} style={styles.retry}>Try again</Text>
      </View>
    );
  }
  if (!ready) return <Loading />;

  return (
    <NativeTabs backgroundColor="#FFFFFF" tintColor="#1677F8">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} md="chat" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "safari", selected: "safari.fill" }} md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function Loading() {
  return <View style={styles.loading}><ActivityIndicator color="#1677F8" size="large" /></View>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  error: { marginHorizontal: 24, marginTop: 16, color: "#B42318", textAlign: "center" },
  retry: { marginTop: 16, color: "#1677F8", fontWeight: "700" },
});
