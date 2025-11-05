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
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { scheduleAPI, workoutAPI } from "../services/api";

export default function TrainingListScreen({ route, navigation }) {
  const { goal } = route.params;
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & picker state
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [pickerMode, setPickerMode] = useState(null);

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

  const formatDate = (date) =>
    date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  // Mở modal thêm lịch
  const openModal = (training) => {
    setSelectedTraining(training);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTraining(null);
  };

// 🧠 Xử lý thêm vào lịch
  const handleAddToSchedule = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0]; // yyyy-mm-dd
      const timeStr = selectedDate.toTimeString().slice(0, 5); // HH:mm
      console.log("🕒 Chọn:", dateStr, timeStr);

      // 1️⃣ Kiểm tra xem đã có lịch trong ngày chưa
      let scheduleId = null;
      try {
        const res = await scheduleAPI.getByDate(dateStr);
        scheduleId = res.data.schedule?._id;
        console.log("✅ Lịch đã tồn tại:", scheduleId);
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("📅 Chưa có lịch, tạo mới...");
          const createRes = await scheduleAPI.create({
            date: dateStr,
            note: note || "",
          });
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
      setModalVisible(false);
      // setNote("");
    } catch (error) {
      console.error("❌ Lỗi khi thêm vào lịch:", error.response?.data || error.message);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thêm bài tập");
    }
  };

  const showPicker = (mode) => setPickerMode(mode);
  const hidePicker = () => setPickerMode(null);
  const handleConfirmPicker = (date) => {
    if (pickerMode === "date") setSelectedDate(date);
    else if (pickerMode === "time") setSelectedTime(date);
    hidePicker();
  };

  if (loading)
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
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
              <Image
                source={{ uri: item.image_url }}
                style={styles.thumbnail}
              />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.exerciseName}>{item.title}</Text>
              <Text style={styles.exerciseDesc}>
                Thời lượng: {item.duration_minutes} phút
              </Text>
              <Text style={styles.exerciseDesc}>
                Mục tiêu: {item.description}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.scheduleButton}
                  onPress={() => openModal(item)}
                >
                  <Text style={styles.scheduleButtonText}>Thêm lịch trình</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() =>
                    navigation.navigate("TrainingDetail", { id: item._id })
                  }
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
            <Text style={styles.modalTitle}>Chọn lịch trình của bạn</Text>

            <TouchableOpacity
              style={styles.modalField}
              onPress={() => showPicker("date")}
            >
              <Text style={styles.modalLabel}>Ngày</Text>
              <Text style={styles.modalValue}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalField}
              onPress={() => showPicker("time")}
            >
              <Text style={styles.modalLabel}>Giờ</Text>
              <Text style={styles.modalValue}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Bài tập</Text>
              <Text style={styles.modalValue}>
                {selectedTraining?.title} - {selectedTraining?.duration_minutes}{" "}
                phút
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleAddToSchedule}
            >
              <Text style={styles.confirmButtonText}>Thêm vào lịch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DateTime Picker */}
        <DateTimePickerModal
          isVisible={pickerMode !== null}
          mode={pickerMode}
          onConfirm={handleConfirmPicker}
          onCancel={hidePicker}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 15 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
  },
  title: { fontSize: 23, fontWeight: "700", color: "#1D1617" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
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
  exerciseDesc: { fontSize: 13, color: "#777", marginVertical: 3 },
  buttonRow: { flexDirection: "row", marginTop: 10 },
  scheduleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#92A3FD",
    backgroundColor: "#F5F7FF",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    marginRight: 10,
  },
  scheduleButtonText: { color: "#92A3FD", fontWeight: "600" },
  startButton: {
    flex: 1,
    backgroundColor: "#9df8c8",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
  },
  startButtonText: { fontWeight: "600" },

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
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1617",
    marginBottom: 15,
    textAlign: "center",
  },
  modalField: { marginBottom: 15 },
  modalLabel: { color: "#777", fontSize: 14 },
  modalValue: { fontSize: 16, fontWeight: "600" },
  confirmButton: {
    backgroundColor: "#92A3FD",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  cancelButton: { alignItems: "center", marginTop: 10 },
  cancelText: { color: "#7B6F72" },
});
