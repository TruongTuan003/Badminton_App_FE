import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleAPI } from "../services/api";
import { COLORS, FONTS } from "../styles/commonStyles";

export default function WorkoutScreen({ navigation }) {
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTodaySchedule = useCallback(async () => {
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

      if (res.data && Array.isArray(res.data.details)) {
        // Lọc các bài tập chưa hoàn thành (status = "pending" hoặc "skipped")
        const pendingDetails = res.data.details.filter(
          detail => detail.status === "pending" || detail.status === "skipped"
        );
        
        // Lấy bài tập đầu tiên chưa hoàn thành
        const firstPendingDetail = pendingDetails.length > 0 ? pendingDetails[0] : null;
        
        console.log("[WorkoutScreen] Pending workouts:", pendingDetails.length, "Selected:", firstPendingDetail?.workoutId?.title);
        setTodaySchedule(firstPendingDetail);
      } else {
        setTodaySchedule(null);
      }
    } catch (error) {
      setTodaySchedule(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySchedule();
  }, [fetchTodaySchedule]);

  useFocusEffect(
    useCallback(() => {
      fetchTodaySchedule();
    }, [fetchTodaySchedule])
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Bài Tập</Text>
            <Text style={styles.heroSubtitle}>
              Chọn bài tập phù hợp với mục tiêu của bạn
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Feather name="more-horizontal" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Schedule Card - Main Feature */}
        <LinearGradient
          colors={["#EEF6FF", "#F3F5FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scheduleCard}
        >
          <View style={styles.scheduleCardHeader}>
            <View style={styles.scheduleIconContainer}>
              <Feather name="calendar" size={18} color="#92A3FD" />
            </View>
            <Text style={styles.scheduleTitle}>Lịch tập hôm nay</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#92A3FD" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : todaySchedule ? (
            <View style={styles.scheduleContent}>
              <View style={styles.scheduleInfo}>
                <LinearGradient
                  colors={["#92A3FD", "#9DCEFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scheduleIcon}
                >
                  <Feather name="activity" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleName}>
                    {todaySchedule.workoutId?.title || "Không có tên bài tập"}
                  </Text>
                  <Text style={styles.scheduleTime}>
                    🕒 {todaySchedule.time || "--:--"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={() => navigation.navigate("Schedule")}
                >
                  <LinearGradient
                    colors={["#92A3FD", "#9DCEFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.checkButtonGradient}
                  >
                    <Text style={styles.checkButtonText}>Xem lịch</Text>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptySchedule}>
              <View style={styles.emptyScheduleContent}>
                <Text style={styles.scheduleEmpty}>Chưa có lịch tập hôm nay</Text>
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={() => navigation.navigate("Schedule")}
                >
                  <LinearGradient
                    colors={["#92A3FD", "#9DCEFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.checkButtonGradient}
                  >
                    <Text style={styles.checkButtonText}>Xem lịch</Text>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Training Plan Card - Main Feature */}
        <LinearGradient
          colors={["#F8F5FF", "#F0EBFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <TouchableOpacity
            style={styles.planCardTouchable}
            onPress={() => navigation.navigate("TrainingPlanList")}
          >
            <LinearGradient
              colors={["#C58BF2", "#A259FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCardIcon}
            >
              <Feather name="calendar" size={28} color="#fff" />
            </LinearGradient>
            <View style={styles.planCardContent}>
              <Text style={styles.planCardTitle}>Kế hoạch tập luyện</Text>
              <Text style={styles.planCardDescription}>
                Chọn kế hoạch tập theo ngày, tuần hoặc tháng
              </Text>
            </View>
            <Feather name="chevron-right" size={24} color="#C58BF2" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Feather name="target" size={18} color="#92A3FD" />
            </View>
            <Text style={styles.sectionTitle}>Bạn muốn tập gì?</Text>
          </View>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("TrainingList", { goal: "Nâng cao kỹ năng cầu lông" })}
          >
            <LinearGradient
              colors={["#EEF6FF", "#F3F5FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryCardGradient}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIconContainer}>
                  <Feather name="zap" size={20} color="#92A3FD" />
                </View>
                <Text style={styles.categoryTitle}>Nâng cao kỹ năng cầu lông</Text>
              </View>
              <Text style={styles.categoryDescription}>
                Các bài tập giúp cải thiện kỹ thuật, từ cơ bản đến nâng cao.
              </Text>
              <View style={styles.seeMoreButtonContainer}>
                <Text style={styles.seeMoreButton}>Xem thêm</Text>
                <Feather name="arrow-right" size={14} color="#92A3FD" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("TrainingList", { goal: "Cải thiện thể chất" })}
          >
            <LinearGradient
              colors={["#FFF5E8", "#FFE9D6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryCardGradient}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: "rgba(255, 150, 113, 0.15)" }]}>
                  <Feather name="activity" size={20} color="#FF9671" />
                </View>
                <Text style={styles.categoryTitle}>Cải thiện thể chất</Text>
              </View>
              <Text style={styles.categoryDescription}>
                Tăng sức bền, tốc độ và sự linh hoạt cho mọi trận đấu.
              </Text>
              <View style={styles.seeMoreButtonContainer}>
                <Text style={[styles.seeMoreButton, { color: "#FF9671" }]}>Xem thêm</Text>
                <Feather name="arrow-right" size={14} color="#FF9671" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("TrainingList", { goal: "Quản lý hình thể và sức khỏe" })}
          >
            <LinearGradient
              colors={["#E8F5E9", "#F1F8F4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryCardGradient}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: "rgba(76, 175, 80, 0.15)" }]}>
                  <Feather name="heart" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.categoryTitle}>Quản lý hình thể và sức khỏe</Text>
              </View>
              <Text style={styles.categoryDescription}>
                Giảm mỡ, duy trì vóc dáng và kết hợp chế độ dinh dưỡng.
              </Text>
              <View style={styles.seeMoreButtonContainer}>
                <Text style={[styles.seeMoreButton, { color: "#4CAF50" }]}>Xem thêm</Text>
                <Feather name="arrow-right" size={14} color="#4CAF50" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing}></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" ,
  },
  scrollView: { 
    flex: 1, 
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollViewContent: {
    paddingTop: 20,
  },

  // Header with Gradient
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
    marginBottom: 20,
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
  },
  moreButton: {
    padding: 8,
  },

  // Schedule Card
  scheduleCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(146, 163, 253, 0.2)",
  },
  scheduleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  scheduleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(146, 163, 253, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#1D1617" 
  },
  scheduleContent: {
    gap: 12,
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scheduleName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 2,
  },
  scheduleTime: { 
    fontSize: 12, 
    color: "#7B6F72",
    fontWeight: "500",
  },
  emptySchedule: {
    paddingVertical: 8,
  },
  emptyScheduleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(146, 163, 253, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleEmpty: { 
    flex: 1,
    color: "#7B6F72", 
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 15,
  },
  checkButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonText: { 
    color: "#FFFFFF", 
    fontSize: 13, 
    fontWeight: "600" 
  },
  loadingContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 20,
  },
  loadingText: { 
    marginLeft: 8, 
    color: "#7B6F72", 
    fontSize: 14 
  },

  // Plan Card
  planCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#C58BF2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(197, 139, 242, 0.2)",
  },
  planCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  planCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#C58BF2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  planCardContent: {
    flex: 1,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 4,
  },
  planCardDescription: {
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
  },

  // Section
  section: { 
    marginBottom: 30 
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(146, 163, 253, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#1D1617" 
  },

  // Category Cards
  categoryCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryCardGradient: {
    padding: 18,
    borderRadius: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(146, 163, 253, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTitle: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: "#1D1617",
    flex: 1,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
    marginBottom: 12,
  },
  seeMoreButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  seeMoreButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92A3FD",
  },
  bottomSpacing: { 
    height: 20 
  },
});
