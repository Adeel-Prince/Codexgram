import { useSyncExternalStore } from "react";

export type ChatMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  image?: number;
};

export type Conversation = {
  username: string;
  displayName: string;
  avatar: number;
  online: boolean;
  unread: boolean;
  group: boolean;
  messages: ChatMessage[];
};

const initialConversations: Conversation[] = [
  {
    username: "alex.rivera",
    displayName: "alex.rivera",
    avatar: require("../../assets/images/feed/alex.png"),
    online: true,
    unread: false,
    group: false,
    messages: [
      { id: "alex-1", text: "Hey! 👋\nThat photo you posted from Colorado is amazing!", fromMe: false, time: "10:24 AM" },
      { id: "alex-2", text: "Thanks! 🙏\nIt was such a beautiful trip.", fromMe: true, time: "10:26 AM" },
      { id: "alex-3", text: "Are you planning to go back\nanytime soon?", fromMe: false, time: "10:28 AM" },
      { id: "alex-4", text: "Hopefully this summer!\nCan’t get enough of views like this.", fromMe: true, time: "10:29 AM", image: require("../../assets/images/feed/lake.png") },
      { id: "alex-5", text: "Wow 😍\nLet me know if you go —\nI’d love to join sometime!", fromMe: false, time: "10:31 AM" },
      { id: "alex-6", text: "Definitely! I’ll keep you posted.", fromMe: true, time: "10:32 AM" },
    ],
  },
  {
    username: "maya.b",
    displayName: "maya.b",
    avatar: require("../../assets/images/feed/maya.png"),
    online: true,
    unread: true,
    group: false,
    messages: [
      { id: "maya-1", text: "I just saw your latest post!", fromMe: false, time: "9:10 AM" },
      { id: "maya-2", text: "That looks amazing! 🙌", fromMe: false, time: "9:14 AM" },
    ],
  },
  {
    username: "jordan.k",
    displayName: "jordan.k",
    avatar: require("../../assets/images/feed/jordan.png"),
    online: false,
    unread: false,
    group: false,
    messages: [{ id: "jordan-1", text: "Let’s plan this weekend.", fromMe: false, time: "Yesterday" }],
  },
  {
    username: "taylor.b",
    displayName: "taylor.b",
    avatar: require("../../assets/images/feed/taylor.png"),
    online: false,
    unread: false,
    group: false,
    messages: [{ id: "taylor-1", text: "Where is this?", fromMe: false, time: "Yesterday" }],
  },
  {
    username: "chris.lee",
    displayName: "chris.lee",
    avatar: require("../../assets/images/feed/casey.png"),
    online: false,
    unread: false,
    group: false,
    messages: [{ id: "chris-1", text: "Sounds great!", fromMe: false, time: "Mon" }],
  },
];

let conversations = initialConversations;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function useConversations() {
  return useSyncExternalStore(subscribe, () => conversations, () => conversations);
}

export function getConversation(username: string) {
  return conversations.find((conversation) => conversation.username === username);
}

export function markConversationRead(username: string) {
  const conversation = getConversation(username);
  if (!conversation?.unread) return;
  conversations = conversations.map((item) => item.username === username ? { ...item, unread: false } : item);
  notify();
}

export function sendMessage(username: string, text: string) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  conversations = conversations.map((conversation) => conversation.username === username
    ? { ...conversation, unread: false, messages: [...conversation.messages, { id: `${username}-${now.getTime()}`, text, fromMe: true, time }] }
    : conversation);
  notify();
}
