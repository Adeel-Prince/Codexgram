import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function EmptyTabScreen({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  title: { color: "#111827", fontSize: 24, fontWeight: "700" },
  description: { marginTop: 8, color: "#74829B", fontSize: 15, textAlign: "center" },
});
