import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import { scheduleAPI, workoutAPI } from "../services/api";

export default function TrainingListScreen({ route, navigation }) {
  const { goal } = route.params;
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await workoutAPI.getAll();
        const filtered = res.data.filter((t) => t.goal === goal);
        setTrainings(filtered);
      } catch (error) {
        console.error("❌ Lỗi lấy danh sách bài tập:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, [goal]);

  const openModal = (training) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const hh = String(today.getHours()).padStart(2, "0");
    const min = String(today.getMinutes()).padStart(2, "0");
    setSelectedTraining(training);
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setSelectedTime(`${hh}:${min}`);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTraining(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleAddToSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày và nhập giờ tập luyện");
      return;
    }

    try {
      const [h, m] = selectedTime.split(":").map(Number);
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        Alert.alert("Lỗi", "Giờ không hợp lệ! Nhập dạng HH:mm (ví dụ: 07:30)");
        return;
      }

      const dateStr = selectedDate;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      console.log("📅 Ngày:", dateStr, "🕒 Giờ:", timeStr);

      // 1️⃣ Kiểm tra xem đã có lịch chưa
      let scheduleId;
      try {
        const res = await scheduleAPI.getByDate(dateStr);
        scheduleId = res.data.schedule?._id;
        console.log("✅ Lịch đã tồn tại:", scheduleId);
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("📅 Chưa có lịch, tạo mới...");
          const createRes = await scheduleAPI.create({ date: dateStr, note: "" });
          scheduleId = createRes.data.schedule._id;
        } else {
          console.error("❌ Lỗi khi tìm lịch:", err);
          Alert.alert("Lỗi", "Không thể kiểm tra lịch hiện có");
          return;
        }
      }

      if (!scheduleId) {
        Alert.alert("Lỗi", "Không xác định được ID lịch");
        return;
      }

      // 2️⃣ Thêm bài tập vào lịch
      const addRes = await scheduleAPI.addWorkout(scheduleId, {
        workoutId: selectedTraining._id,
        time: timeStr,
        note: "Không có ghi chú",
      });

      console.log("✅ Đã thêm bài tập:", addRes.data);
      Alert.alert("Thành công", "Đã thêm bài tập vào lịch!");
      closeModal();
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào lịch:", error.response?.data || error.message);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thêm bài tập");
    }
  };

  if (loading)
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.title}>{goal}</Text>
      </View>

      {/* Danh sách bài tập */}
      <FlatList
        data={trainings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.exerciseName}>{item.title}</Text>
              <Text style={styles.exerciseDesc}>
                Thời lượng: {item.duration_minutes} phút
              </Text>
              <Text style={styles.exerciseDesc}>{item.description}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.scheduleButton}
                  onPress={() => openModal(item)}
                >
                  <Text style={styles.scheduleButtonText}>Thêm lịch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate("TrainingDetail", { id: item._id })}
                >
                  <Text style={styles.startButtonText}>Bắt đầu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Modal thêm lịch */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Thêm bài tập vào lịch</Text>

            {/* Ngày */}
            <Text style={styles.modalLabel}>Ngày</Text>
            <TouchableOpacity
              style={styles.modalDateButton}
              onPress={() => setCalendarModalVisible(true)}
            >
              <Text style={styles.modalDateText}>
                {selectedDate || "Chọn ngày"}
              </Text>
              <Feather name="calendar" size={20} color="#999" />
            </TouchableOpacity>

            {/* Giờ */}
            <Text style={styles.modalLabel}>Giờ</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="HH:mm"
              placeholderTextColor="#999"
              value={selectedTime}
              onChangeText={setSelectedTime}
            />

            {/* Bài tập */}
            <Text style={styles.modalLabel}>Bài tập</Text>
            <Text style={styles.modalValue}>
              {selectedTraining?.title} - {selectedTraining?.duration_minutes} phút
            </Text>

            {/* Nút xác nhận */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleAddToSchedule}>
              <Text style={styles.confirmButtonText}>Thêm vào lịch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar chọn ngày */}
        <Modal
          visible={calendarModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCalendarModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.modalTitle}>Chọn ngày</Text>
                <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                  <Feather name="x" size={22} color="#000" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setCalendarModalVisible(false);
                }}
                markedDates={
                  selectedDate
                    ? {
                        [selectedDate]: {
                          selected: true,
                          selectedColor: "#92A3FD",
                        },
                      }
                    : {}
                }
              />
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backButton: { marginRight: 10, padding: 6, borderRadius: 10, backgroundColor: "#F4F4F4" },
  title: { fontSize: 22, fontWeight: "700", color: "#1D1617" },
  item: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
  },
  thumbnail: { width: "100%", height: "100%" },
  infoContainer: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: "600", color: "#1D2A64" },
  exerciseDesc: { fontSize: 13, color: "#777", marginVertical: 2 },
  buttonRow: { flexDirection: "row", marginTop: 8 },
  scheduleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#92A3FD",
    backgroundColor: "#F5F7FF",
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
    marginRight: 8,
  },
  scheduleButtonText: { color: "#92A3FD", fontWeight: "600" },
  startButton: {
    flex: 1,
    backgroundColor: "#9df8c8",
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
  },
  startButtonText: { fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1D1617", marginBottom: 15, textAlign: "center" },
  modalLabel: { color: "#555", marginBottom: 6, fontWeight: "600" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    color: "#000",
  },
  modalDateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  modalDateText: { color: "#000" },
  modalValue: { fontWeight: "600", marginBottom: 20 },
  confirmButton: {
    backgroundColor: "#92A3FD",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontWeight: "600" },
  cancelButton: { alignItems: "center", marginTop: 10 },
  cancelText: { color: "#7B6F72" },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    padding: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
});
