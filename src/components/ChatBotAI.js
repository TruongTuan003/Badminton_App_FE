import { LinearGradient } from 'expo-linear-gradient';
import { Bot, MessageCircleX, Trash, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

export default function ChatBotAI({ isOpen: externalIsOpen, onToggle: externalOnToggle, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(externalIsOpen || false);
  
  const scrollViewRef = useRef(null);
  const chatAnimation = useRef(new Animated.Value(externalIsOpen ? 1 : 0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  
  // Sync với external state nếu có
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsChatOpen(externalIsOpen);
      // Trigger animation khi external state thay đổi
      Animated.spring(chatAnimation, {
        toValue: externalIsOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [externalIsOpen]);

  const generateId = () => Math.random().toString(36).slice(2, 10);

  // Lắng nghe sự kiện bàn phím
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // ✅ Toggle chat popup
  const toggleChat = () => {
    const newValue = !isChatOpen;
    setIsChatOpen(newValue);
    
    // Notify parent component if callback provided
    if (externalOnToggle) {
      externalOnToggle(newValue);
    }

    const toValue = newValue ? 1 : 0;
    Animated.spring(chatAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // ✅ Gửi message tới backend Gemini
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post("http://192.168.1.142:5000/chat", {
        message: userMessage.content,
        userId: userId,
      });

      const aiMessage = {
        id: generateId(),
        role: "assistant",
        content: res.data.reply || "Không có phản hồi từ AI.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("❌ Lỗi gửi tin nhắn:", error);

      const errorMessage =
        "Xin lỗi, đã có lỗi xảy ra khi kết nối tới Gemini AI. Vui lòng thử lại sau.";

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);

      Alert.alert("Lỗi", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages]);

  // ✅ Hiển thị 1 message
  const renderMessage = (msg) => {
    const isUser = msg.role === "user";
    return (
      <View
        key={msg.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {msg.content}
            </Text>
          ) : (
            <Markdown>{msg.content}</Markdown>
          )}
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.assistantTimestamp,
            ]}
          >
            {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintTranslate = useRef(new Animated.Value(8)).current;
  const hintAnimationRef = useRef(null);

  useEffect(() => {
    hintOpacity.setValue(0);
    hintTranslate.setValue(8);
    setHintVisible(true);

    hintAnimationRef.current = Animated.parallel([
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(hintTranslate, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]);

    hintAnimationRef.current.start();

    return () => {
      hintAnimationRef.current?.stop();
    };
  }, [hintOpacity, hintTranslate]);

  const dismissHint = () => {
    hintAnimationRef.current?.stop();
    setHintVisible(false);
  };

  const chatScale = chatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const chatOpacity = chatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // ✅ Clear toàn bộ chat
  const clearChat = () => {
    Alert.alert("Xóa đoạn chat", "Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => setMessages([]) },
    ]);
  };

  // Ẩn floating button nếu được control từ ngoài
  const showFloatingButton = externalIsOpen === undefined;

  return (
    <View>
      {/* 🔘 Floating Chat Button */}
      {showFloatingButton && !isChatOpen && hintVisible && (
        <Animated.View
          style={[
            styles.helperBubble,
            {
              opacity: hintOpacity,
              transform: [{ translateY: hintTranslate }],
            },
          ]}
        >
          <Text style={styles.helperText}>Trợ lí ảo Bad2Pro</Text>
          <TouchableOpacity style={styles.helperClose} onPress={dismissHint}>
            <Text style={styles.helperCloseText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {showFloatingButton && (
        <LinearGradient
          colors={["#92A3FD", "#9DCEFF"]}
          style={styles.linearChatToggle}
        >
          <TouchableOpacity style={styles.chatToggle} onPress={toggleChat}>
            {isChatOpen ? (
              <MessageCircleX size={28} color="#fff" strokeWidth={1.5} />
            ) : (
              <Bot size={28} color="#fff" strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* 💬 Chat Modal */}
      {isChatOpen && (
        <Animated.View
          style={[
            styles.chatModal,
            { 
              opacity: chatOpacity, 
              transform: [{ scale: chatScale }],
              bottom: keyboardHeight > 0 ? keyboardHeight : 160,
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Trợ lí ảo Bad2Pro</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
                  <Trash size={22} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleChat} style={styles.headerButton}>
                  <X size={25} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Xin chào 👋</Text>
                  <Text style={styles.emptySubtext}>
                    Mình là trợ lí ảo Bad2Pro — hỏi mình bất cứ điều gì bạn muốn nhé!
                  </Text>
                </View>
              ) : (
                messages.map(renderMessage)
              )}

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#7465FF" />
                  <Text style={styles.loadingText}>AI đang suy nghĩ...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Nhập câu hỏi của bạn..."
                placeholderTextColor="#999"
                multiline
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>
                  {isLoading ? "⏳" : "➤"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linearChatToggle: {
    position: "absolute",
    bottom: 95,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 1000,
  },
  chatToggle: { padding: 12 },
  helperBubble: {
    position: "absolute",
    bottom: 155,
    right: 40,
    backgroundColor: "rgba(146, 163, 253, 0.95)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: 180,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  helperText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  helperClose: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  helperCloseText: {
    color: "#6F7CFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  chatModal: {
    position: "absolute",
    bottom: 160,
    right: 20,
    left: 20,
    height: Platform.OS === "ios" ? 500 : 450,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  chatContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f8f9fa",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  headerActions: { flexDirection: "row" },
  headerButton: { marginLeft: 12, padding: 8 },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 20, fontWeight: "600", color: "#333" },
  emptySubtext: { fontSize: 14, color: "#666", textAlign: "center" },
  messageContainer: { marginVertical: 6 },
  userMessageContainer: { alignItems: "flex-end" },
  assistantMessageContainer: { alignItems: "flex-start" },
  messageBubble: { maxWidth: "85%", padding: 12, borderRadius: 18 },
  userBubble: { backgroundColor: "#6F7CFF", borderBottomRightRadius: 6 },
  assistantBubble: { backgroundColor: "#EEF2FF", borderBottomLeftRadius: 6 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: "#fff" },
  timestamp: { fontSize: 11, marginTop: 4 },
  userTimestamp: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  assistantTimestamp: { color: "#999" },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  loadingText: { marginLeft: 8, fontSize: 14, color: "#6F7CFF" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#333",
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7B8CFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: "#CED6FF" },
  sendButtonText: { fontSize: 18, color: "#fff", fontWeight: "600" },
});
