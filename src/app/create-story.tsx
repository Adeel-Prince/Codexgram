import { Image } from "expo-image";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const maxImageSize = 10 * 1024 * 1024;

export default function CreateStoryRoute() {
  const [photo, setPhoto] = useState<{ uri: string; contentType: string; fileSize?: number } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const generateUploadUrl = useMutation(api.stories.generateUploadUrl);
  const createStory = useMutation(api.stories.create);

  const selectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > maxImageSize) {
        setError("Stories must be 10 MB or smaller.");
        return;
      }
      setError("");
      setPhoto({
        uri: asset.uri,
        contentType: asset.mimeType ?? "image/jpeg",
        ...(asset.fileSize ? { fileSize: asset.fileSize } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open your photo library.");
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Allow camera access to take a story photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > maxImageSize) {
        setError("Stories must be 10 MB or smaller.");
        return;
      }
      setError("");
      setPhoto({
        uri: asset.uri,
        contentType: asset.mimeType ?? "image/jpeg",
        ...(asset.fileSize ? { fileSize: asset.fileSize } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open the camera.");
    }
  };

  const publish = async () => {
    if (!photo || saving) return;
    setSaving(true);
    setError("");
    try {
      const uploadUrl = await generateUploadUrl({});
      const file = new File(photo.uri);
      if (!file.exists) throw new Error("The selected photo is no longer available. Choose it again.");
      if (file.size > maxImageSize) throw new Error("Stories must be 10 MB or smaller.");
      const response = await expoFetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photo.contentType },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed. Check your connection and try again.");
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("storageId" in body) || typeof body.storageId !== "string") {
        throw new Error("The upload service returned an invalid response.");
      }
      await createStory({ storageId: body.storageId as Id<"_storage">, contentType: photo.contentType });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to share your story. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => router.back()}><Text style={styles.cancel}>Cancel</Text></Pressable>
        <Text style={styles.title}>New story</Text>
        <Pressable accessibilityRole="button" disabled={!photo || saving} onPress={() => void publish()} style={[styles.share, (!photo || saving) && styles.disabled]}>
          {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.shareText}>Share</Text>}
        </Pressable>
      </View>
      <View style={styles.body}>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose a story photo" onPress={() => void selectPhoto()} style={styles.preview}>
          {photo ? <Image source={{ uri: photo.uri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : (
            <View style={styles.prompt}>
              <Svg width={40} height={40} viewBox="0 0 24 24"><Path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2l1.4-1.5h4.2L15.5 5h2A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-10Z" fill="none" stroke="#71809A" strokeWidth={1.5} strokeLinejoin="round" /><Path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" fill="none" stroke="#71809A" strokeWidth={1.5} /></Svg>
              <Text style={styles.promptTitle}>Add a photo to your story</Text>
              <Text style={styles.promptHint}>It will be visible for 24 hours</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => void selectPhoto()} style={styles.action}><Text style={styles.actionText}>Choose from library</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void takePhoto()} style={styles.action}><Text style={styles.actionText}>Use camera</Text></Pressable>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 56, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EFF1F5" },
  cancel: { color: "#5F6D86", fontSize: 15 },
  title: { position: "absolute", left: 70, right: 70, color: "#111B30", textAlign: "center", fontSize: 16, fontWeight: "700" },
  share: { minWidth: 66, height: 34, paddingHorizontal: 12, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#1677F8" },
  shareText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  body: { flex: 1, padding: 18, alignItems: "center", justifyContent: "center" },
  preview: { width: "100%", maxHeight: 620, aspectRatio: 9 / 16, overflow: "hidden", borderRadius: 20, backgroundColor: "#F3F6FA" },
  prompt: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  promptTitle: { marginTop: 14, color: "#25334A", fontSize: 17, fontWeight: "700", textAlign: "center" },
  promptHint: { marginTop: 6, color: "#78859E", fontSize: 13, textAlign: "center" },
  actions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 16 },
  action: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: "#E4E9F0", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  actionText: { color: "#1A2B46", fontSize: 12, fontWeight: "600" },
  error: { marginTop: 14, color: "#C62828", fontSize: 13, textAlign: "center" },
});
