import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
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

export default function ScheduleScreen({ navigation, route }) {
  // Nhận params từ navigation (nếu có)
  const initialDate = route?.params?.selectedDate 
    ? new Date(route.params.selectedDate) 
    : new Date();
  
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const formatDateOnly = (date) => {
    // Format date thành YYYY-MM-DD (local time, không UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 📍 Gọi API lấy lịch theo ngày
  const fetchSchedules = useCallback(async () => {
    try {
      const formattedDate = formatDateOnly(selectedDate);
      console.log("📅 Fetch schedule for:", formattedDate, "Selected date:", selectedDate.toLocaleDateString());

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
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);
  // Load lại dữ liệu khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );
  
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

      {/* Ngày đang chọn với nút chuyển ngày */}
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.dateNavButton}
          onPress={() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            setSelectedDate(prevDate);
          }}
        >
          <Feather name="chevron-left" size={20} color="#92A3FD" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          Ngày: {formatDateOnly(selectedDate)}
        </Text>
        <TouchableOpacity
          style={styles.dateNavButton}
          onPress={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            setSelectedDate(nextDate);
          }}
        >
          <Feather name="chevron-right" size={20} color="#92A3FD" />
        </TouchableOpacity>
      </View>

      {/* Hiển thị nội dung lịch */}
      {loading ? (
        <ActivityIndicator size="large" color="#92A3FD" style={{ marginTop: 20 }} />
      ) : schedule ? (
        <ScrollView style={styles.scheduleList}>
          <Text style={styles.scheduleTitle}>Ghi chú: {schedule.note || "Không có"}</Text>
          {schedule.details?.length > 0 ? (
            schedule.details.map((item, index) => {
              const getStatusColor = (status) => {
                switch (status) {
                  case "done":
                    return "#4CAF50"; // Green
                  case "skipped":
                    return "#FF9800"; // Orange
                  default:
                    return "#92A3FD"; // Blue (pending)
                }
              };

              const getStatusText = (status) => {
                switch (status) {
                  case "done":
                    return "Hoàn thành";
                  case "skipped":
                    return "Đã bỏ qua";
                  default:
                    return "Đang chờ";
                }
              };

              return (
                <View 
                  key={index} 
                  style={[
                    styles.card,
                    item.status === "done" && styles.cardDone,
                    item.status === "skipped" && styles.cardSkipped
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.workoutId.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTime}>🕒 {item.time || "--:--"}</Text>
                  {item.note && (
                    <Text style={styles.cardNote}>📝 {item.note}</Text>
                  )}
                  <Text style={styles.cardGoal}>🎯 {item.workoutId.goal}</Text>
                  <Text style={styles.cardLevel}>🏋️ {item.workoutId.level}</Text>
                  
                  {item.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonStart]}
                      onPress={() => {
                        navigation.navigate("TrainingDetail", {
                          id: item.workoutId._id,
                        });
                      }}
                    >
                      <Text style={styles.actionButtonText}>Bắt đầu</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.noData}>Không có bài tập trong ngày này.</Text>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.noData}>Không có lịch tập cho ngày này.</Text>
          <TouchableOpacity
            style={styles.planButton}
            onPress={() => navigation.navigate("TrainingPlanList")}
          >
            <Feather name="calendar" size={20} color="#fff" />
            <Text style={styles.planButtonText}>Chọn kế hoạch tập luyện</Text>
          </TouchableOpacity>
        </View>
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
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  dateText: {
    textAlign: "center",
    fontSize: 16,
    color: "#1D1617",
    marginHorizontal: 16,
    fontWeight: "600",
  },
  scheduleList: { marginTop: 20 },
  scheduleTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#E8F3F1",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#92A3FD",
  },
  cardDone: {
    backgroundColor: "#E8F5E9",
    borderLeftColor: "#4CAF50",
    opacity: 0.8,
  },
  cardSkipped: {
    backgroundColor: "#FFF3E0",
    borderLeftColor: "#FF9800",
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1D1617", flex: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardTime: { fontSize: 14, color: "#7B6F72", marginTop: 4 },
  cardNote: { fontSize: 14, color: "#7B6F72", marginTop: 4, fontStyle: "italic" },
  cardGoal: { fontSize: 14, color: "#7B6F72", marginTop: 4 },
  cardLevel: { fontSize: 14, color: "#7B6F72", marginTop: 4 },
  actionButton: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  actionButtonStart: {
    backgroundColor: "#92A3FD",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  noData: { textAlign: "center", color: "#7B6F72", marginBottom: 20 },
  planButton: {
    flexDirection: "row",
    backgroundColor: "#92A3FD",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    gap: 8,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  planButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
  },
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
