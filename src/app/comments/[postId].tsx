import { router, useLocalSearchParams } from "expo-router";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function CommentsRoute() {
  const { postId: rawPostId } = useLocalSearchParams<{ postId: string }>();
  const postId = typeof rawPostId === "string" ? rawPostId as Id<"posts"> : null;
  const { results, status, loadMore } = usePaginatedQuery(
    api.social.comments,
    postId ? { postId } : "skip",
    { initialNumItems: 30 },
  );
  const addComment = useMutation(api.social.addComment);
  const deleteComment = useMutation(api.social.deleteComment);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const sendComment = async () => {
    if (!postId || !body.trim() || isSending) return;
    setIsSending(true);
    setError("");
    try {
      await addComment({ postId, body });
      setBody("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add your comment.");
    } finally {
      setIsSending(false);
    }
  };

  const confirmDelete = (commentId: Id<"comments">) => {
    Alert.alert("Delete comment?", "This comment will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void deleteComment({ commentId }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to delete this comment.")); } },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close comments" hitSlop={10} onPress={() => router.back()}><Text style={styles.close}>‹</Text></Pressable>
          <Text style={styles.title}>Comments</Text>
          <View style={styles.headerSpacer} />
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!postId ? <Text style={styles.error}>This post could not be found.</Text> : null}
        <FlatList
          data={results}
          keyExtractor={(comment) => comment._id}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <View style={styles.avatar}><Text style={styles.avatarInitial}>{item.author.username.slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.commentContent}>
                <View style={styles.commentHeading}>
                  <Text style={styles.username}>{item.author.username}</Text>
                  {item.canDelete ? <Pressable accessibilityRole="button" accessibilityLabel="Delete comment" hitSlop={8} onPress={() => confirmDelete(item._id)}><Text style={styles.delete}>Delete</Text></Pressable> : null}
                </View>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={status === "LoadingFirstPage" ? <ActivityIndicator color="#1677F8" style={styles.loading} /> : <Text style={styles.empty}>No comments yet. Start the conversation.</Text>}
          ListFooterComponent={status === "CanLoadMore" ? <Pressable onPress={() => loadMore(30)} style={styles.loadMore}><Text style={styles.loadMoreText}>Load older comments</Text></Pressable> : status === "LoadingMore" ? <ActivityIndicator color="#1677F8" style={styles.loading} /> : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Write a comment"
            maxLength={1000}
            multiline
            onChangeText={setBody}
            placeholder="Add a comment..."
            placeholderTextColor="#7E8AA0"
            style={styles.input}
            value={body}
          />
          <Pressable accessibilityRole="button" disabled={!body.trim() || isSending} onPress={() => void sendComment()} style={[styles.sendButton, (!body.trim() || isSending) && styles.sendDisabled]}>
            {isSending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendText}>Post</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  keyboard: { flex: 1 },
  header: { height: 52, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EEF1F5" },
  close: { width: 32, color: "#101B32", fontSize: 32, lineHeight: 36 },
  title: { color: "#101B32", fontSize: 16, fontWeight: "700" },
  headerSpacer: { width: 32 },
  error: { paddingHorizontal: 18, paddingTop: 10, color: "#C62828", fontSize: 12 },
  listContent: { padding: 16, flexGrow: 1 },
  commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 17 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F2FF" },
  avatarInitial: { color: "#1677F8", fontSize: 13, fontWeight: "700" },
  commentContent: { flex: 1, paddingTop: 1 },
  commentHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  username: { color: "#101B32", fontSize: 13, fontWeight: "700" },
  delete: { color: "#A44B53", fontSize: 11 },
  body: { marginTop: 4, color: "#354258", fontSize: 13, lineHeight: 19 },
  empty: { marginTop: 35, color: "#78859E", fontSize: 13, textAlign: "center" },
  loading: { marginTop: 30 },
  loadMore: { alignItems: "center", paddingVertical: 14 },
  loadMoreText: { color: "#1677F8", fontSize: 12, fontWeight: "600" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: "#EEF1F5" },
  input: { flex: 1, maxHeight: 108, minHeight: 42, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 21, backgroundColor: "#F2F4F8", color: "#101B32", fontSize: 13, lineHeight: 18 },
  sendButton: { minWidth: 54, height: 40, paddingHorizontal: 12, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#1677F8" },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
