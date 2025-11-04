import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import api from "../services/api"; // dùng instance axios bạn có sẵn

export default function ScheduleScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const formatDateOnly = (date) => date.toISOString().split("T")[0];

  // 📍 Gọi API lấy lịch theo ngày
  const fetchSchedules = async () => {
    try {
      const formattedDate = formatDateOnly(selectedDate);
      console.log("📅 Fetch schedule for:", formattedDate);

      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ Không tìm thấy token");
        return;
      }

      const res = await api.get(`/schedules/date/${formattedDate}`);
      console.log("✅ Schedule data:", res.data);
      setSchedule(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("ℹ️ Không có lịch cho ngày này");
        setSchedule(null);
      } else {
        Alert.alert("Lỗi", "Không thể tải lịch trình");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch trình tập luyện</Text>
        <TouchableOpacity onPress={() => setCalendarVisible(true)}>
          <Feather name="calendar" size={24} color="#1D1617" />
        </TouchableOpacity>
      </View>

      {/* Ngày đang chọn */}
      <Text style={styles.dateText}>
        Ngày: {formatDateOnly(selectedDate)}
      </Text>

      {/* Hiển thị nội dung lịch */}
      {loading ? (
        <ActivityIndicator size="large" color="#92A3FD" style={{ marginTop: 20 }} />
      ) : schedule ? (
        <ScrollView style={styles.scheduleList}>
          <Text style={styles.scheduleTitle}>Ghi chú: {schedule.note || "Không có"}</Text>
          {schedule.details?.length > 0 ? (
            schedule.details.map((item, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>{item.workoutId.title}</Text>
                <Text style={styles.cardTime}>🕒 {item.time}</Text>
                <Text style={styles.cardGoal}>🎯 {item.workoutId.goal}</Text>
                <Text style={styles.cardLevel}>🏋️ {item.workoutId.level}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noData}>Không có bài tập trong ngày này.</Text>
          )}
        </ScrollView>
      ) : (
        <Text style={styles.noData}>Không có lịch tập cho ngày này.</Text>
      )}

      {/* 📅 Modal hiển thị Calendar */}
      <Modal visible={calendarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Calendar
              onDayPress={(day) => {
                console.log("📅 Chọn ngày:", day.dateString);
                setSelectedDate(new Date(day.dateString));
                setCalendarVisible(false);
              }}
              markedDates={{
                [formatDateOnly(selectedDate)]: {
                  selected: true,
                  selectedColor: "#92A3FD",
                },
              }}
              theme={{
                todayTextColor: "#92A3FD",
                arrowColor: "#92A3FD",
                textDayFontFamily: "System",
                textMonthFontWeight: "bold",
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 💅 CSS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1D1617" },
  dateText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#7B6F72",
  },
  scheduleList: { marginTop: 20 },
  scheduleTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#E8F3F1",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1D1617" },
  cardTime: { fontSize: 14, color: "#7B6F72" },
  cardGoal: { fontSize: 14, color: "#7B6F72" },
  cardLevel: { fontSize: 14, color: "#7B6F72" },
  noData: { textAlign: "center", color: "#7B6F72", marginTop: 30 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#92A3FD",
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: { textAlign: "center", color: "#fff", fontWeight: "600" },
});
