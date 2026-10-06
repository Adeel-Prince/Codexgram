import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type EditableProfile = {
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
};

type FieldIconName = "username" | "name" | "bio" | "website" | "location";

const defaultBio = "Product designer, coffee lover.\nExploring what’s next. ☕ 🌎";

function FieldIcon({ name }: { name: FieldIconName }) {
  if (name === "username") {
    return <Text style={styles.atIcon}>@</Text>;
  }

  const paths: Record<Exclude<FieldIconName, "username">, string> = {
    name: "M15.5 20v-1.2a4.7 4.7 0 0 0-9.4 0V20M10.8 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM17.5 14.5a3.5 3.5 0 0 1 0 6.5M17.5 5.2a3.1 3.1 0 0 1 0 6",
    bio: "M4 6h16M4 12h11M4 18h7M18 15v6M15 18h6",
    website: "M10 13.8a4.8 4.8 0 0 0 6.8 0l2.1-2.1a4.8 4.8 0 0 0-6.8-6.8l-1.2 1.2M14 10.2a4.8 4.8 0 0 0-6.8 0l-2.1 2.1a4.8 4.8 0 0 0 6.8 6.8l1.2-1.2",
    location: "M19 10.2c0 5-7 10.3-7 10.3S5 15.2 5 10.2a7 7 0 1 1 14 0ZM12 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z",
  };

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === "name" ? <Path d={paths.name} fill="none" stroke="#68758D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === "bio" ? <Path d={paths.bio} fill="none" stroke="#68758D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === "website" ? <Path d={paths.website} fill="none" stroke="#68758D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === "location" ? <Path d={paths.location} fill="none" stroke="#68758D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </Svg>
  );
}

function Header({ onBack, onSave, saving }: { onBack: () => void; onSave: () => void; saving: boolean }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Back to profile" accessibilityRole="button" hitSlop={8} onPress={onBack} style={styles.backButton}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="m14.5 5-7 7 7 7" fill="none" stroke="#101B32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <Text pointerEvents="none" style={styles.headerTitle}>Edit Profile</Text>
      <Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={[styles.topSave, saving && styles.disabled]}>
        {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.topSaveText}>Save</Text>}
      </Pressable>
    </View>
  );
}

function FormField({
  label,
  icon,
  value,
  onChangeText,
  helper,
  multiline = false,
  maxLength,
  placeholder,
  keyboardType,
}: {
  label: string;
  icon: FieldIconName;
  value: string;
  onChangeText: (text: string) => void;
  helper?: string;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
  keyboardType?: "default" | "url";
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, multiline && styles.bioShell]}>
        <View style={[styles.fieldIcon, multiline && styles.bioIcon]}>
          <FieldIcon name={icon} />
        </View>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={icon === "username" || icon === "website" ? "none" : "words"}
          autoCorrect={icon !== "username" && icon !== "website"}
          keyboardType={keyboardType ?? "default"}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7C879D"
          style={[styles.input, multiline && styles.bioInput]}
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
        />
        {multiline && maxLength ? <Text style={styles.characterCount}>{value.length}/{maxLength}</Text> : null}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;

export default function EditProfileRoute() {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) {
    return <SafeAreaView edges={["top"]} style={styles.loading}><ActivityIndicator color="#1677F8" size="large" /></SafeAreaView>;
  }
  return <EditProfileForm key={user.id} user={user} />;
}

function EditProfileForm({ user }: { user: ClerkUser }) {
  const updateConvexProfile = useMutation(api.profiles.updateMyProfile);
  const profile = user.unsafeMetadata?.codexgramProfile as EditableProfile | undefined;
  const [username, setUsername] = useState(profile?.username || user.username || "alex.rivera");
  const [displayName, setDisplayName] = useState(user.fullName || "Alex Rivera");
  const [bio, setBio] = useState(profile?.bio || defaultBio);
  const [website, setWebsite] = useState(profile?.website || "https://alexrivera.co");
  const [location, setLocation] = useState(profile?.location || "San Francisco, CA");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const selectedPhoto = result.assets[0];
      if (selectedPhoto.fileSize && selectedPhoto.fileSize > 5 * 1024 * 1024) {
        Alert.alert("Image too large", "Choose a photo that is 5MB or smaller.");
        return;
      }
      setPhotoUri(selectedPhoto.uri);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open your photo library.");
    }
  };

  const saveProfile = async () => {
    const cleanUsername = username.trim().replace(/^@+/, "").toLowerCase();
    const cleanDisplayName = displayName.trim();
    if (!/^[a-z0-9._]{3,30}$/.test(cleanUsername)) {
      setError("Choose a username with 3–30 letters, numbers, periods, or underscores.");
      return;
    }
    if (!cleanDisplayName) {
      setError("Display name is required.");
      return;
    }

    const [firstName, ...lastNameParts] = cleanDisplayName.split(/\s+/);
    setIsSaving(true);
    setError("");
    try {
      await user.update({ firstName, lastName: lastNameParts.join(" ") });
      await user.updateMetadata({
        unsafeMetadata: {
          codexgramProfile: {
            username: cleanUsername,
            bio: bio.trim(),
            website: website.trim(),
            location: location.trim(),
          },
        },
      });
      if (photoUri) await user.setProfileImage({ file: photoUri });
      await updateConvexProfile({ username: cleanUsername, displayName: cleanDisplayName, bio: bio.trim() });
      router.back();
    } catch (cause) {
      const clerkError = cause as { errors?: { longMessage?: string; message?: string }[] };
      const details = clerkError.errors?.map((item) => item.longMessage || item.message).filter(Boolean);
      setError(details?.length ? details.join("\n") : cause instanceof Error ? cause.message : "Unable to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardArea}>
        <Header onBack={() => router.back()} onSave={saveProfile} saving={isSaving} />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.photoSection}>
            <Pressable accessibilityLabel="Change profile photo" accessibilityRole="button" onPress={pickPhoto} style={styles.avatarWrap}>
              <Image
                source={photoUri ? { uri: photoUri } : user.hasImage && user.imageUrl ? { uri: user.imageUrl } : require("../../assets/images/profile/portrait.png")}
                contentFit="cover"
                style={styles.avatar}
              />
              <View style={styles.cameraBadge}>
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path d="M8.5 5.5 7 7.5H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2l-1.5-2h-7Z" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinejoin="round" />
                  <Path d="M15.5 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
                </Svg>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={pickPhoto}>
              <Text style={styles.changePhoto}>Change Photo</Text>
            </Pressable>
            <Text style={styles.photoHint}>JPG, PNG up to 5MB</Text>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <View style={styles.fields}>
            <FormField label="Username" icon="username" value={username} onChangeText={setUsername} helper="This is how people find you on Codexgram." />
            <FormField label="Display Name" icon="name" value={displayName} onChangeText={setDisplayName} helper="This is your public name." />
            <FormField label="Bio" icon="bio" value={bio} onChangeText={setBio} multiline maxLength={150} />
            <FormField label="Website" icon="website" value={website} onChangeText={setWebsite} keyboardType="url" />
            <FormField label="Location" icon="location" value={location} onChangeText={setLocation} />
          </View>

          <Pressable accessibilityRole="button" disabled={isSaving} onPress={saveProfile} style={[styles.saveButton, isSaving && styles.disabled]}>
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  keyboardArea: { flex: 1 },
  header: { height: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  headerTitle: { position: "absolute", left: 60, right: 60, color: "#111827", fontSize: 17, fontWeight: "700", textAlign: "center" },
  topSave: { minWidth: 58, height: 40, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#1677F8", alignItems: "center", justifyContent: "center" },
  topSaveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.65 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  photoSection: { alignItems: "center", marginBottom: 14 },
  avatarWrap: { position: "relative", width: 124, height: 124, marginBottom: 8 },
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: "#E9F1FA" },
  cameraBadge: { position: "absolute", right: -1, bottom: -1, width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "#1677F8", alignItems: "center", justifyContent: "center" },
  changePhoto: { color: "#1677F8", fontSize: 14, lineHeight: 19, fontWeight: "600" },
  photoHint: { marginTop: 1, color: "#77839A", fontSize: 12, lineHeight: 16 },
  error: { marginBottom: 9, color: "#C62828", fontSize: 12, lineHeight: 17 },
  fields: { gap: 13 },
  fieldBlock: { gap: 5 },
  fieldLabel: { color: "#68758D", fontSize: 14, lineHeight: 18, fontWeight: "600" },
  inputShell: { minHeight: 46, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E7EBF2", borderRadius: 19, backgroundColor: "#F6F7F9", paddingHorizontal: 12 },
  bioShell: { minHeight: 72, alignItems: "flex-start", paddingTop: 9, paddingBottom: 23 },
  fieldIcon: { width: 38, alignItems: "flex-start", justifyContent: "center" },
  bioIcon: { paddingTop: 1 },
  atIcon: { color: "#68758D", fontSize: 22, lineHeight: 28, fontWeight: "600" },
  input: { flex: 1, minHeight: 44, paddingHorizontal: 0, paddingVertical: 0, color: "#111827", fontSize: 15, lineHeight: 20 },
  bioInput: { minHeight: 60, paddingTop: 0, paddingBottom: 0, paddingRight: 48, textAlignVertical: "top" },
  characterCount: { position: "absolute", right: 14, bottom: 9, color: "#77839A", fontSize: 11, lineHeight: 15 },
  helper: { paddingHorizontal: 40, color: "#77839A", fontSize: 11.5, lineHeight: 15 },
  saveButton: { height: 46, marginTop: 15, borderRadius: 23, backgroundColor: "#1677F8", alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
