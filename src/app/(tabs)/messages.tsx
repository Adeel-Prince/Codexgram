import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Conversation, useConversations } from "../../lib/demo-messages";

type Filter = "All" | "Unread" | "Groups";

function ComposeIcon() {
  return <Svg width={27} height={27} viewBox="0 0 24 24"><Path d="M13.5 5H6.2A2.2 2.2 0 0 0 4 7.2v10.6A2.2 2.2 0 0 0 6.2 20h10.6a2.2 2.2 0 0 0 2.2-2.2v-7.3" fill="none" stroke="#1677F8" strokeWidth={1.9} strokeLinecap="round"/><Path d="m11 13 8.8-8.8a1.8 1.8 0 0 1 2.5 2.5L13.5 15.5 10 16.5 11 13Z" fill="none" stroke="#1677F8" strokeWidth={1.9} strokeLinejoin="round"/></Svg>;
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const latest = conversation.messages[conversation.messages.length - 1];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open chat with ${conversation.displayName}`} onPress={onPress} style={styles.conversation}>
      <View style={styles.avatarWrap}>
        <Image source={conversation.avatar} contentFit="cover" style={styles.avatar} />
        {conversation.online ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.conversationCopy}>
        <View style={styles.conversationTop}>
          <Text numberOfLines={1} style={styles.username}>{conversation.displayName}</Text>
          <Text style={styles.time}>{latest?.time ?? ""}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text numberOfLines={1} style={[styles.preview, conversation.unread && styles.unreadPreview]}>{latest?.text ?? "Start a conversation"}</Text>
          <Svg width={14} height={20} viewBox="0 0 14 20"><Path d="m4 3 7 7-7 7" fill="none" stroke="#8090B1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </View>
      </View>
      {conversation.unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function MessagesRoute() {
  const conversations = useConversations();
  const [filter, setFilter] = useState<Filter>("All");
  const [composeOpen, setComposeOpen] = useState(false);
  const visible = conversations.filter((conversation) => {
    if (filter === "Unread") return conversation.unread;
    if (filter === "Groups") return conversation.group;
    return true;
  });

  const openChat = (username: string) => {
    setComposeOpen(false);
    router.push({ pathname: "/chat/[username]", params: { username } });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="New message" onPress={() => setComposeOpen(true)} hitSlop={10} style={styles.composeButton}><ComposeIcon /></Pressable>
        </View>

        <View style={styles.filters}>
          {(["All", "Unread", "Groups"] as const).map((value) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[styles.filterPill, filter === value && styles.activeFilter]}>
              <Text style={[styles.filterText, filter === value && styles.activeFilterText]}>{value}</Text>
            </Pressable>
          ))}
        </View>

        {visible.length ? (
          <View style={styles.conversationList}>
            {visible.map((conversation) => <ConversationRow key={conversation.username} conversation={conversation} onPress={() => openChat(conversation.username)} />)}
          </View>
        ) : (
          <View style={styles.emptyState}><Text style={styles.emptyTitle}>{filter === "Groups" ? "No group chats yet" : "You’re all caught up"}</Text><Text style={styles.emptyText}>New conversations will show up here.</Text></View>
        )}

        <View style={styles.sessionNote}>
          <View style={styles.infoIcon}><Text style={styles.infoLetter}>i</Text></View>
          <Text style={styles.noteText}>Demo conversations stay on this device for this session.</Text>
        </View>
      </ScrollView>

      <Modal transparent visible={composeOpen} animationType="fade" onRequestClose={() => setComposeOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setComposeOpen(false)}>
          <Pressable style={styles.composeSheet} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New message</Text>
            {conversations.map((conversation) => (
              <Pressable key={conversation.username} onPress={() => openChat(conversation.username)} style={styles.contactRow}>
                <Image source={conversation.avatar} contentFit="cover" style={styles.contactAvatar} />
                <Text style={styles.contactName}>{conversation.displayName}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 12 },
  header: { height: 74, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#111B36", fontSize: 31, fontWeight: "800", letterSpacing: -0.8 },
  composeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  filters: { flexDirection: "row", gap: 8, marginTop: 2, marginBottom: 18 },
  filterPill: { height: 38, minWidth: 75, paddingHorizontal: 19, borderRadius: 22, backgroundColor: "#F2F5FA", alignItems: "center", justifyContent: "center" },
  activeFilter: { backgroundColor: "#1677F8" },
  filterText: { color: "#253653", fontSize: 14, fontWeight: "500" },
  activeFilterText: { color: "#FFFFFF", fontWeight: "700" },
  conversationList: { gap: 9 },
  conversation: { minHeight: 76, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F5F7FB", flexDirection: "row", alignItems: "center" },
  avatarWrap: { width: 56, height: 56, marginRight: 13 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E5EAF2" },
  onlineDot: { position: "absolute", right: 0, bottom: 0, width: 15, height: 15, borderRadius: 8, backgroundColor: "#12C957", borderWidth: 2, borderColor: "#F5F7FB" },
  conversationCopy: { flex: 1, minWidth: 0, justifyContent: "center" },
  conversationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  username: { flex: 1, color: "#111B36", fontSize: 16, fontWeight: "800" },
  time: { color: "#8090B1", fontSize: 12, fontWeight: "500" },
  previewRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 3 },
  preview: { flex: 1, color: "#7B8AAC", fontSize: 14 },
  unreadPreview: { color: "#536481", fontWeight: "600" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1677F8", marginLeft: 5 },
  sessionNote: { minHeight: 72, marginTop: 12, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, backgroundColor: "#F5F7FB", flexDirection: "row", alignItems: "center", gap: 14 },
  infoIcon: { width: 27, height: 27, borderWidth: 2, borderColor: "#8090B1", borderRadius: 15, alignItems: "center", justifyContent: "center" },
  infoLetter: { color: "#8090B1", fontSize: 17, fontWeight: "700", lineHeight: 20 },
  noteText: { flex: 1, color: "#7B8AAC", fontSize: 14, lineHeight: 20 },
  emptyState: { alignItems: "center", paddingTop: 70, paddingBottom: 40 },
  emptyTitle: { color: "#111B36", fontSize: 17, fontWeight: "700" },
  emptyText: { marginTop: 7, color: "#7B8AAC", fontSize: 13 },
  modalScrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.28)" },
  composeSheet: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#FFFFFF" },
  sheetHandle: { width: 40, height: 4, alignSelf: "center", marginBottom: 16, borderRadius: 2, backgroundColor: "#D5DCE8" },
  sheetTitle: { marginBottom: 8, color: "#111B36", fontSize: 20, fontWeight: "800" },
  contactRow: { minHeight: 55, flexDirection: "row", alignItems: "center", gap: 12 },
  contactAvatar: { width: 38, height: 38, borderRadius: 19 },
  contactName: { color: "#111B36", fontSize: 15, fontWeight: "600" },
});
