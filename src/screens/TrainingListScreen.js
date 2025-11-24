import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { TabBar, TabView } from "react-native-tab-view";
import { scheduleAPI, workoutAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS } from "../styles/commonStyles";

const { width } = Dimensions.get("window");

const LEVEL_ROUTES = [
  { key: "basic", title: "Cơ bản" },
  { key: "intermediate", title: "Trung bình" },
  { key: "advanced", title: "Nâng cao" },
];

const LEVEL_MATCHERS = {
  basic: ["cơ bản", "basic"],
  intermediate: ["trung bình", "intermediate", "medium"],
  advanced: ["nâng cao", "advanced"],
};

const matchesLevel = (value = "", levelKey) => {
  const normalizedValue = value.trim().toLowerCase();
  return LEVEL_MATCHERS[levelKey]?.some((matcher) => normalizedValue === matcher) || false;
};

export default function TrainingListScreen({ route, navigation }) {
  const { goal } = route.params;
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState(LEVEL_ROUTES);

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

  const getTrainingsByLevel = (levelKey) =>
    trainings.filter((training) => matchesLevel(training.level || "", levelKey));

  const renderTrainingCard = ({ item }) => (
    <LinearGradient
      colors={["#FFFFFF", "#F8F9FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.item}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Feather name="activity" size={32} color="#92A3FD" />
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.exerciseName}>{item.title}</Text>
        <View style={styles.exerciseMeta}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color="#7B6F72" />
            <Text style={styles.exerciseDesc}>{item.duration_minutes} phút</Text>
          </View>
          {item.level && (
            <View style={styles.metaItem}>
              <Feather name="trending-up" size={14} color="#7B6F72" />
              <Text style={styles.exerciseDesc}>{item.level}</Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={styles.exerciseDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.scheduleButton} onPress={() => openModal(item)}>
            <LinearGradient
              colors={["#EEF6FF", "#F3F5FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scheduleButtonGradient}
            >
              <Feather name="calendar" size={16} color="#92A3FD" />
              <Text style={styles.scheduleButtonText}>Thêm lịch</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate("TrainingDetail", { id: item._id })}
          >
            <LinearGradient
              colors={["#7ED7B5", "#4ECDC4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Feather name="play" size={16} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Bắt đầu</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const renderTrainingList = (levelKey) => {
    const data = getTrainingsByLevel(levelKey);

    return (
      <View style={styles.tabScene}>
        {data.length ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item._id}
            renderItem={renderTrainingCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color="#ADA4A5" />
            <Text style={styles.emptyText}>Không có bài tập nào</Text>
          </View>
        )}
      </View>
    );
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "basic":
        return renderTrainingList("basic");
      case "intermediate":
        return renderTrainingList("intermediate");
      case "advanced":
        return renderTrainingList("advanced");
      default:
        return null;
    }
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor={COLORS.primary}
      inactiveColor="#ADA4A5"
      pressColor="transparent"
    />
  );

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#9DCEFF", "#92A3FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroWrapper}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{goal}</Text>
            <Text style={styles.heroSubtitle}>
              Chọn bài tập phù hợp với mục tiêu của bạn
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentWrapper}>
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          onIndexChange={setTabIndex}
          initialLayout={{ width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
        />
      </View>

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
              <LinearGradient
                colors={["#92A3FD", "#9DCEFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButtonGradient}
              >
                <Feather name="calendar" size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Thêm vào lịch</Text>
              </LinearGradient>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: FONTS.bold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
    fontWeight: FONTS.semiBold,
    marginBottom: 10,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: "#F6F8FB",
    marginTop: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
  },
  tabView: {
    flex: 1,
  },
  tabScene: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    marginHorizontal: 20,
    borderRadius: 30,
    marginBottom: 12,
  },
  tabIndicator: {
    backgroundColor: "#FFFFFF",
    height: "90%",
    marginVertical: 4,
    borderRadius: 24,
    ...SHADOWS.small,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: FONTS.semiBold,
    textTransform: "none",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  item: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(146, 163, 253, 0.1)",
  },
  imageContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: COLORS.inputBackground,
  },
  thumbnail: { 
    width: "100%", 
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FF",
  },
  infoContainer: { 
    flex: 1,
    justifyContent: "space-between",
  },
  exerciseName: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#1D1617",
    marginBottom: 8,
    lineHeight: 24,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exerciseDesc: { 
    fontSize: 13, 
    color: "#7B6F72",
    fontWeight: "500",
  },
  buttonRow: { 
    flexDirection: "row", 
    marginTop: 12,
    gap: 10,
  },
  scheduleButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleButtonGradient: {
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(146, 163, 253, 0.2)",
  },
  scheduleButtonText: { 
    color: "#92A3FD", 
    fontWeight: "600",
    fontSize: 14,
  },
  startButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#7ED7B5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonGradient: {
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  startButtonText: { 
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7B6F72",
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: FONTS.bold, 
    color: "#1D1617", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  modalLabel: { 
    color: "#1D1617", 
    marginBottom: 8, 
    fontWeight: FONTS.semiBold,
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.inputBackground,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    color: "#000",
    fontSize: 15,
  },
  modalDateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBackground,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  modalDateText: { 
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
  },
  modalValue: { 
    fontWeight: FONTS.semiBold, 
    marginBottom: 20,
    fontSize: 15,
    color: "#1D1617",
    padding: 12,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  confirmButtonText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: { 
    alignItems: "center", 
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelText: { 
    color: "#7B6F72",
    fontSize: 14,
    fontWeight: "500",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "90%",
    maxWidth: 400,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
});
