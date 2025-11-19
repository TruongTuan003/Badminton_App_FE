import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { trainingLogAPI } from "../services/api";

export default function ActivityHistoryScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      console.log("📡 Gọi API lấy training log người dùng...");
      const res = await trainingLogAPI.getLogByUser();
      console.log("✅ Dữ liệu nhận về:", res.data);
      setLogs(res.data);
    } catch (err) {
      console.error("❌ Lỗi lấy log:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

const renderItem = ({ item }) => {
  const workout = item.workoutId || {};

  // ✅ Dùng trường `date` từ backend
  const displayDate = item.date
    ? new Date(item.date).toLocaleString("vi-VN")
    : "Không xác định";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="barbell-outline" size={22} color="#92A3FD" />
        <Text style={styles.title}>{workout.title || "Bài tập"}</Text>
      </View>

      <Text style={styles.feeling}>Cảm nhận: {item.feeling || "Không có"}</Text>
      <Text style={styles.note}>Ghi chú: {item.note || "Không có ghi chú"}</Text>
      <Text style={styles.date}>{displayDate}</Text>
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={22} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Danh sách log */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" />
      ) : logs.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có lịch sử hoạt động nào</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1D1617" },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1617",
    marginLeft: 10,
  },
  feeling: { color: "#555", marginBottom: 3 },
  note: { color: "#777", fontStyle: "italic" },
  date: { color: "#999", fontSize: 12, marginTop: 6, textAlign: "right" },
  emptyText: {
    marginTop: 50,
    textAlign: "center",
    color: "#888",
    fontSize: 16,
  },
});
