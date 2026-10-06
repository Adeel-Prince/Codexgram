import { Image } from "expo-image";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";

type MediaType = "image" | "video";
type SelectedMedia = {
  uri: string;
  mediaType: MediaType;
  contentType: string;
  fileSize?: number;
  durationMs?: number;
};

const maxImageSize = 10 * 1024 * 1024;
const maxVideoSize = 50 * 1024 * 1024;

export default function CreatePostRoute() {
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.create);

  const saveSelection = (asset: ImagePicker.ImagePickerAsset, selectedType: MediaType) => {
    const maxSize = selectedType === "image" ? maxImageSize : maxVideoSize;
    if (asset.fileSize && asset.fileSize > maxSize) {
      setError(selectedType === "image" ? "Images must be 10 MB or smaller." : "Videos must be 50 MB or smaller.");
      return;
    }
    const durationMs = asset.duration ?? undefined;
    if (selectedType === "video" && durationMs !== undefined && durationMs > 60_000) {
      setError("Videos must be 60 seconds or shorter.");
      return;
    }
    setError("");
    setMedia({
      uri: asset.uri,
      mediaType: selectedType,
      contentType: asset.mimeType ?? (selectedType === "image" ? "image/jpeg" : "video/mp4"),
      ...(asset.fileSize ? { fileSize: asset.fileSize } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
    });
  };

  const chooseFromLibrary = async (selectedType = mediaType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: selectedType === "image" ? ["images"] : ["videos"],
        allowsEditing: selectedType === "image",
        ...(selectedType === "image" ? { aspect: [1, 1] as [number, number], quality: 0.8 } : {}),
        videoMaxDuration: 60,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });
      if (!result.canceled) saveSelection(result.assets[0], selectedType);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open your media library.");
    }
  };

  const captureWithCamera = async (selectedType: MediaType) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Allow camera access to capture a post.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: selectedType === "image" ? ["images"] : ["videos"],
        allowsEditing: selectedType === "image",
        ...(selectedType === "image" ? { aspect: [1, 1] as [number, number], quality: 0.8 } : {}),
        videoMaxDuration: 60,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });
      if (!result.canceled) saveSelection(result.assets[0], selectedType);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open the camera.");
    }
  };

  const showCaptureOptions = () => {
    Alert.alert("Capture a post", "Choose what you want to capture.", [
      { text: "Take photo", onPress: () => void captureWithCamera("image") },
      { text: "Record video", onPress: () => void captureWithCamera("video") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const sharePost = async () => {
    if (!media) {
      setError("Choose a photo or video first.");
      return;
    }
    setIsSharing(true);
    setError("");
    try {
      const uploadUrl = await generateUploadUrl({});
      const mediaFile = new File(media.uri);
      if (!mediaFile.exists) throw new Error("The selected media is no longer available. Choose it again.");
      const maxSize = media.mediaType === "image" ? maxImageSize : maxVideoSize;
      if (mediaFile.size > maxSize) throw new Error(media.mediaType === "image" ? "Images must be 10 MB or smaller." : "Videos must be 50 MB or smaller.");
      const uploadResponse = await expoFetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": media.contentType },
        body: mediaFile,
      });
      if (!uploadResponse.ok) throw new Error("Upload failed. Check your connection and try again.");
      const responseBody: unknown = await uploadResponse.json();
      if (typeof responseBody !== "object" || responseBody === null || !("storageId" in responseBody) || typeof responseBody.storageId !== "string") {
        throw new Error("The upload service returned an invalid response.");
      }
      await createPost({
        storageId: responseBody.storageId as Id<"_storage">,
        mediaType: media.mediaType,
        contentType: media.contentType,
        caption,
        ...(media.durationMs !== undefined ? { durationMs: media.durationMs } : {}),
      });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to share this post. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" disabled={isSharing} onPress={() => router.back()}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.headerTitle}>New post</Text>
          <Pressable accessibilityRole="button" disabled={isSharing} onPress={() => void sharePost()} style={[styles.shareButton, isSharing && styles.disabled]}>
            {isSharing ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.shareText}>Share</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.typeSelector}>
            {(["image", "video"] as const).map((type) => (
              <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: mediaType === type }} onPress={() => { setMediaType(type); setMedia(null); setError(""); }} style={[styles.typeButton, mediaType === type && styles.typeButtonSelected]}>
                <Text style={[styles.typeLabel, mediaType === type && styles.typeLabelSelected]}>{type === "image" ? "Photo" : "Video"}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={() => void chooseFromLibrary()} style={styles.mediaPicker}>
            {media?.mediaType === "image" ? <Image source={{ uri: media.uri }} contentFit="cover" style={styles.preview} /> : media?.mediaType === "video" ? (
              <View style={styles.videoPreview}>
                <Svg width={44} height={44} viewBox="0 0 24 24"><Path d="m9 6 10 6-10 6V6Z" fill="#FFFFFF" /></Svg>
                <Text style={styles.videoLabel}>Video selected</Text>
              </View>
            ) : (
              <View style={styles.pickerPrompt}>
                <Svg width={42} height={42} viewBox="0 0 24 24"><Path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2l1.4-1.5h4.2L15.5 5h2A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-10Z" fill="none" stroke="#71809A" strokeWidth={1.5} strokeLinejoin="round" /><Path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" fill="none" stroke="#71809A" strokeWidth={1.5} /></Svg>
                <Text style={styles.pickerTitle}>Add a {mediaType === "image" ? "photo" : "video"}</Text>
                <Text style={styles.pickerHint}>Choose from your library or capture one</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.mediaActions}>
            <Pressable accessibilityRole="button" onPress={() => void chooseFromLibrary()} style={styles.mediaAction}><Text style={styles.mediaActionLabel}>Choose from library</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={showCaptureOptions} style={styles.mediaAction}><Text style={styles.mediaActionLabel}>Use camera</Text></Pressable>
          </View>

          <Text style={styles.captionLabel}>Write a caption</Text>
          <TextInput
            accessibilityLabel="Post caption"
            multiline
            maxLength={2200}
            onChangeText={setCaption}
            placeholder="What's on your mind?"
            placeholderTextColor="#8390A7"
            style={styles.captionInput}
            textAlignVertical="top"
            value={caption}
          />
          <Text style={styles.captionCount}>{caption.length}/2200</Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Text style={styles.uploadLimits}>Photos up to 10 MB · Videos up to 50 MB and 60 seconds</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  keyboard: { flex: 1 },
  header: { height: 54, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EFF1F5" },
  cancel: { color: "#5F6D86", fontSize: 15 },
  headerTitle: { position: "absolute", left: 70, right: 70, color: "#111B30", textAlign: "center", fontSize: 16, fontWeight: "700" },
  shareButton: { minWidth: 66, height: 34, paddingHorizontal: 12, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#1677F8" },
  shareText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.65 },
  content: { padding: 18, paddingBottom: 30 },
  typeSelector: { alignSelf: "center", flexDirection: "row", padding: 3, marginBottom: 18, borderRadius: 20, backgroundColor: "#F0F3F8" },
  typeButton: { minWidth: 92, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  typeButtonSelected: { backgroundColor: "#FFFFFF", shadowColor: "#1A2940", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  typeLabel: { color: "#66748C", fontSize: 13, fontWeight: "600" },
  typeLabelSelected: { color: "#1677F8" },
  mediaPicker: { width: "100%", aspectRatio: 1, overflow: "hidden", borderRadius: 18, borderWidth: 1, borderColor: "#E4E9F0", backgroundColor: "#F6F8FB" },
  preview: { width: "100%", height: "100%" },
  videoPreview: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#17233B" },
  videoLabel: { marginTop: 8, color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  pickerPrompt: { flex: 1, alignItems: "center", justifyContent: "center" },
  pickerTitle: { marginTop: 12, color: "#25334A", fontSize: 16, fontWeight: "700" },
  pickerHint: { marginTop: 5, color: "#78859E", fontSize: 12, textAlign: "center" },
  mediaActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  mediaAction: { flex: 1, height: 42, borderRadius: 14, borderWidth: 1, borderColor: "#E4E9F0", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  mediaActionLabel: { color: "#1A2B46", fontSize: 12, fontWeight: "600" },
  captionLabel: { marginTop: 23, marginBottom: 8, color: "#1A2B46", fontSize: 14, fontWeight: "700" },
  captionInput: { minHeight: 112, padding: 13, borderWidth: 1, borderColor: "#E4E9F0", borderRadius: 14, color: "#111B30", fontSize: 14, lineHeight: 20 },
  captionCount: { marginTop: 5, color: "#8390A7", fontSize: 11, textAlign: "right" },
  error: { marginTop: 13, color: "#C62828", fontSize: 13, lineHeight: 18 },
  uploadLimits: { marginTop: 14, color: "#8390A7", fontSize: 11, lineHeight: 16, textAlign: "center" },
});
