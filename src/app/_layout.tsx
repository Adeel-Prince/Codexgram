import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

void SystemUI.setBackgroundColorAsync("#FFFFFF");

export default function RootLayout() {
  return (
    <View style={styles.appBackground}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
