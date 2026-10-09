import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function NotFoundRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <View style={styles.loading}><ActivityIndicator color="#1677F8" size="large" /></View>;
  }

  return <Redirect href={isSignedIn ? "/(tabs)/home" : "/"} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
});
