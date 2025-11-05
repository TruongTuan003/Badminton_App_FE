import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scheduleAPI } from "../services/api";

export default function WorkoutScreen({ navigation }) {
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        console.log("[WorkoutScreen] Fetching today schedule:", dateStr);

        const res = await scheduleAPI.getByDate(dateStr);
        console.log("[WorkoutScreen] API response:", res.data);

        if (res.data && Array.isArray(res.data.details) && res.data.details.length > 0) {
          setTodaySchedule(res.data.details[0]);
        } else if (res.data?.details) {
          setTodaySchedule(res.data.details);
        } else {
          setTodaySchedule(null);
        }
      } catch (error) {
        setTodaySchedule(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySchedule();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#1D1617" />
          </TouchableOpacity>
          <Text style={styles.title}>Bài Tập</Text>
          <TouchableOpacity style={styles.circleButton}>
            <Feather name="more-horizontal" size={24} color="#1D1617" />
          </TouchableOpacity>
        </View>

        {/* Schedule Card */}
        <View style={styles.scheduleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scheduleTitle}>Lịch tập hôm nay</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#92A3FD" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : todaySchedule ? (
              <>
                <Text style={styles.scheduleName}>
                  {todaySchedule.workoutId?.title || "Không có tên bài tập"}
                </Text>
                <Text style={styles.scheduleTime}>{todaySchedule.time || "--:--"}</Text>
              </>
            ) : (
              <Text style={styles.scheduleEmpty}>Chưa có lịch tập hôm nay</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => navigation.navigate("Schedule")}
          >
            <Text style={styles.checkButtonText}>Xem lịch</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bạn muốn tập gì?</Text>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("TrainingList", { goal: "Nâng cao kỹ năng cầu lông" })}
          >
            <Text style={styles.categoryTitle}>Nâng cao kỹ năng cầu lông</Text>
            <Text style={styles.categoryDescription}>
              Các bài tập giúp cải thiện kỹ thuật, từ cơ bản đến nâng cao.
            </Text>
            <Text style={styles.seeMoreButton}>Xem thêm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("TrainingList", { goal: "Cải thiện thể chất" })}
          >
            <Text style={styles.categoryTitle}>Cải thiện thể chất</Text>
            <Text style={styles.categoryDescription}>
              Tăng sức bền, tốc độ và sự linh hoạt cho mọi trận đấu.
            </Text>
            <Text style={styles.seeMoreButton}>Xem thêm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("TrainingList", { goal: "Quản lý hình thể và sức khỏe" })}
          >
            <Text style={styles.categoryTitle}>Quản lý hình thể và sức khỏe</Text>
            <Text style={styles.categoryDescription}>
              Giảm mỡ, duy trì vóc dáng và kết hợp chế độ dinh dưỡng.
            </Text>
            <Text style={styles.seeMoreButton}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing}></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#1D1617" },

  // Schedule Card
  scheduleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F3F1",
    borderRadius: 22,
    padding: 20,
    marginBottom: 30,
  },
  scheduleTitle: { fontSize: 16, fontWeight: "600", color: "#1D1617" },
  scheduleName: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "500",
    color: "#1D1617",
  },
  scheduleTime: { fontSize: 14, color: "#7B6F72", marginTop: 4 },
  scheduleEmpty: { color: "#7B6F72", marginTop: 8 },
  checkButton: {
    backgroundColor: "#92A3FD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  checkButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  loadingContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  loadingText: { marginLeft: 8, color: "#7B6F72", fontSize: 14 },

  // Section
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1D1617" },

  // Category Cards
  categoryCard: {
    backgroundColor: "#d5dbfdff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryTitle: { fontSize: 16, fontWeight: "bold", color: "#1D1617", marginBottom: 8 },
  categoryDescription: {
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
    marginBottom: 12,
  },
  seeMoreButton: {
    fontSize: 14,
    fontWeight: "500",
    color: "#92A3FD",
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bottomSpacing: { height: 100 },
});
