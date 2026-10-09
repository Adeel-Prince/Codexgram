import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { getConversation, markConversationRead, sendMessage, useConversations } from "../../lib/demo-messages";

function HeaderIcon({ kind }: { kind: "back" | "phone" | "video" | "more" }) {
  if (kind === "back") return <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="m15 4-8 8 8 8" fill="none" stroke="#111B36" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
  if (kind === "phone") return <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M5 3.8c.7-.7 2-.7 2.7.1l2.1 2.8c.5.7.5 1.6 0 2.2l-1.3 1.5a14.1 14.1 0 0 0 5.1 5.1l1.5-1.3c.6-.5 1.5-.5 2.2 0l2.8 2.1c.8.7.8 2 .1 2.7l-1.2 1.2c-.8.8-2 1.1-3.1.7C8.4 18.4 5.6 15.6 3.3 8.1c-.4-1.1-.1-2.3.7-3.1L5 3.8Z" fill="none" stroke="#111B36" strokeWidth={1.8} strokeLinejoin="round" /></Svg>;
  if (kind === "video") return <Svg width={25} height={25} viewBox="0 0 24 24"><Rect x={2.5} y={5} width={13.5} height={14} rx={2.5} fill="none" stroke="#111B36" strokeWidth={1.8}/><Path d="m16 9 5-3v12l-5-3" fill="none" stroke="#111B36" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"/></Svg>;
  return <Svg width={24} height={24} viewBox="0 0 24 24"><Circle cx={5} cy={12} r={1.6} fill="#111B36"/><Circle cx={12} cy={12} r={1.6} fill="#111B36"/><Circle cx={19} cy={12} r={1.6} fill="#111B36"/></Svg>;
}

function SendIcon() {
  return <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="m21 3-7.2 18-3.5-7.3L3 10.2 21 3Z" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinejoin="round"/><Path d="m10.3 13.7 5-5" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round"/></Svg>;
}

function AttachIcon({ kind }: { kind: "plus" | "image" }) {
  if (kind === "plus") return <Svg width={23} height={23} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" fill="none" stroke="#111B36" strokeWidth={2} strokeLinecap="round"/></Svg>;
  return <Svg width={23} height={23} viewBox="0 0 24 24"><Rect x={3} y={4} width={18} height={16} rx={2.5} fill="none" stroke="#111B36" strokeWidth={1.8}/><Circle cx={8.5} cy={9} r={1.5} fill="none" stroke="#111B36" strokeWidth={1.6}/><Path d="m4 17 5-5 3.5 3 3-3 4.5 4.5" fill="none" stroke="#111B36" strokeWidth={1.7} strokeLinejoin="round"/></Svg>;
}

export default function ChatRoute() {
  const { username: routeUsername } = useLocalSearchParams<{ username: string }>();
  const username = Array.isArray(routeUsername) ? routeUsername[0] : routeUsername;
  const conversations = useConversations();
  const conversation = getConversation(username ?? "");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (username) markConversationRead(username);
  }, [username, conversations]);

  const send = () => {
    const message = draft.trim();
    if (!message || !username) return;
    sendMessage(username, message);
    setDraft("");
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  if (!conversation) {
    return <SafeAreaView style={styles.screen}><View style={styles.missing}><Text style={styles.missingText}>This conversation isn’t available.</Text><Text onPress={() => router.back()} style={styles.backLink}>Go back</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to messages" onPress={() => router.back()} style={styles.backButton}><HeaderIcon kind="back" /></Pressable>
          <Image source={conversation.avatar} contentFit="cover" style={styles.headerAvatar} />
          <View style={styles.headerIdentity}>
            <Text numberOfLines={1} style={styles.headerName}>{conversation.displayName}</Text>
            <View style={styles.statusLine}><View style={[styles.statusDot, !conversation.online && styles.offlineDot]} /><Text style={styles.statusText}>{conversation.online ? "Online" : "Offline"}</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Voice call" style={styles.headerAction}><HeaderIcon kind="phone" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Video call" style={styles.headerAction}><HeaderIcon kind="video" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="More chat options" style={styles.headerAction}><HeaderIcon kind="more" /></Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          <Text style={styles.dayLabel}>Today</Text>
          {conversation.messages.map((message) => (
            <View key={message.id} style={[styles.messageGroup, message.fromMe ? styles.outgoingGroup : styles.incomingGroup]}>
              {!message.fromMe ? <Image source={conversation.avatar} contentFit="cover" style={styles.messageAvatar} /> : <View style={styles.avatarSpacer} />}
              <View style={[styles.messageColumn, message.fromMe && styles.outgoingColumn]}>
                {message.image ? <Image source={message.image} contentFit="cover" style={styles.sharedImage} /> : null}
                <View style={[styles.bubble, message.fromMe ? styles.outgoingBubble : styles.incomingBubble]}>
                  <Text style={[styles.messageText, message.fromMe && styles.outgoingText]}>{message.text}</Text>
                </View>
                <View style={[styles.messageMeta, message.fromMe && styles.outgoingMeta]}>
                  <Text style={styles.messageTime}>{message.time}</Text>
                  {message.fromMe ? <Text style={styles.readReceipt}>✓✓</Text> : null}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Add attachment" style={styles.roundAttachment}><AttachIcon kind="plus" /></Pressable>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="Message"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={send}
              placeholder="Message..."
              placeholderTextColor="#8995AE"
              returnKeyType="send"
              multiline
              style={styles.input}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Add photo" style={styles.galleryButton}><AttachIcon kind="image" /></Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim()} onPress={send} style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}><SendIcon /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  keyboardArea: { flex: 1 },
  header: { minHeight: 72, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#EEF0F4", flexDirection: "row", alignItems: "center", gap: 9 },
  backButton: { width: 28, height: 42, alignItems: "flex-start", justifyContent: "center" },
  headerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#E5EAF2" },
  headerIdentity: { flex: 1, minWidth: 70 },
  headerName: { color: "#111B36", fontSize: 15, fontWeight: "800" },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10C953" },
  offlineDot: { backgroundColor: "#A8B1C2" },
  statusText: { color: "#8290AA", fontSize: 12 },
  headerAction: { width: 30, height: 38, alignItems: "center", justifyContent: "center" },
  messagesContent: { flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
  dayLabel: { alignSelf: "center", marginTop: 3, marginBottom: 17, color: "#8995AE", fontSize: 13, fontWeight: "500" },
  messageGroup: { width: "100%", flexDirection: "row", alignItems: "flex-end", marginBottom: 11 },
  incomingGroup: { justifyContent: "flex-start" },
  outgoingGroup: { justifyContent: "flex-end" },
  messageAvatar: { width: 34, height: 34, marginRight: 8, borderRadius: 17, backgroundColor: "#E5EAF2" },
  avatarSpacer: { width: 30 },
  messageColumn: { maxWidth: "79%", alignItems: "flex-start" },
  outgoingColumn: { alignItems: "flex-end" },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 21 },
  incomingBubble: { backgroundColor: "#F0F1F4", borderBottomLeftRadius: 8 },
  outgoingBubble: { backgroundColor: "#1677F8", borderBottomRightRadius: 8 },
  messageText: { color: "#111B36", fontSize: 15, lineHeight: 21 },
  outgoingText: { color: "#FFFFFF" },
  sharedImage: { width: 245, height: 175, marginBottom: 5, borderRadius: 17, backgroundColor: "#E5EAF2" },
  messageMeta: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 2, marginTop: 4 },
  outgoingMeta: { justifyContent: "flex-end" },
  messageTime: { color: "#8995AE", fontSize: 11 },
  readReceipt: { color: "#1677F8", fontSize: 13, fontWeight: "700", letterSpacing: -2 },
  composer: { minHeight: 62, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF" },
  roundAttachment: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F3F7" },
  inputWrap: { flex: 1, minHeight: 44, paddingLeft: 14, paddingRight: 9, borderRadius: 24, backgroundColor: "#F1F3F7", flexDirection: "row", alignItems: "center" },
  input: { flex: 1, maxHeight: 96, paddingVertical: 10, color: "#111B36", fontSize: 15 },
  galleryButton: { width: 34, height: 38, alignItems: "center", justifyContent: "center" },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#1677F8" },
  sendDisabled: { opacity: 0.62 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  missingText: { color: "#111B36", fontSize: 16, fontWeight: "600" },
  backLink: { marginTop: 12, color: "#1677F8", fontSize: 14, fontWeight: "700" },
});
