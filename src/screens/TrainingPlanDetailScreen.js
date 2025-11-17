import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import { trainingPlanAPI } from "../services/api";

export default function TrainingPlanDetailScreen({ route, navigation }) {
  const { plan } = route.params;
  const [applying, setApplying] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const getTypeLabel = (type) => {
    const typeMap = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng"
    };
    return typeMap[type] || type;
  };

  const getTypeDescription = (type) => {
    const descMap = {
      daily: "Kế hoạch tập luyện cho 1 ngày",
      weekly: "Kế hoạch tập luyện trong 7 ngày",
      monthly: "Kế hoạch tập luyện trong 30 ngày"
    };
    return descMap[type] || "";
  };

  const getDayName = (day, type) => {
    if (type === "daily") {
      return "Ngày 1";
    } else if (type === "weekly") {
      const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      return dayNames[day];
    } else {
      return `Ngày ${day}`;
    }
  };

  const getTotalWorkouts = () => {
    if (!Array.isArray(plan.planDays)) return 0;
    return plan.planDays.reduce((total, day) => total + (day.workouts?.length || 0), 0);
  };

  const confirmApplyPlan = () => {
    Alert.alert(
      "Xác nhận",
      "Nếu đã có lịch tập trong các ngày này, bạn muốn:\n\n" +
      "• Thêm vào lịch cũ (giữ bài tập cũ)\n" +
      "• Ghi đè lịch cũ (xóa bài tập cũ)",
      [
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => setShowCalendar(false)
        },
        {
          text: "Thêm vào",
          onPress: () => handleApplyPlan(false)
        },
        {
          text: "Ghi đè",
          onPress: () => handleApplyPlan(true),
          style: "destructive"
        }
      ]
    );
  };

  const handleApplyPlan = async (replaceExisting = false) => {
    try {
      setApplying(true);
      
      console.log("📋 Applying plan:", plan._id, "Start date:", selectedDate, "Replace:", replaceExisting);
      
      const response = await trainingPlanAPI.applyPlan(plan._id, selectedDate, replaceExisting);
      
      console.log("✅ Apply response:", response.data);
      
      const { datesProcessed, totalWorkouts } = response.data;
      
      if (totalWorkouts === 0) {
        Alert.alert(
          "Thông báo",
          `Không có bài tập mới nào được thêm.\n\n` +
          `Các bài tập trong kế hoạch đã tồn tại trong lịch của bạn.`,
          [
            {
              text: "Xem lịch",
              onPress: () => navigation.navigate("Schedule")
            },
            {
              text: "OK",
              style: "cancel"
            }
          ]
        );
      } else {
        Alert.alert(
          "Thành công",
          `Đã áp dụng kế hoạch "${plan.name}" vào lịch tập của bạn!\n\n` +
          `📅 Đã xử lý ${datesProcessed} ngày\n` +
          `💪 Đã thêm ${totalWorkouts} bài tập`,
          [
            {
              text: "Xem lịch",
              onPress: () => {
                // Navigate và truyền tham số để refresh
                navigation.navigate("Schedule", { 
                  refresh: true,
                  selectedDate: selectedDate 
                });
              }
            },
            {
              text: "OK",
              style: "cancel"
            }
          ]
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi áp dụng kế hoạch:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể áp dụng kế hoạch. Vui lòng thử lại."
      );
    } finally {
      setApplying(false);
      setShowCalendar(false);
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: "#92A3FD",
    },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết kế hoạch</Text>
        <View style={styles.emptySpace} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Info */}
        <View style={styles.infoCard}>
          <Text style={styles.planName}>{plan.name}</Text>
          
          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="event" size={20} color="#92A3FD" />
                <Text style={styles.metaText}>{getTypeLabel(plan.type)}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="trending-up" size={20} color="#C58BF2" />
                <Text style={styles.metaText}>{plan.level}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="fitness-center" size={20} color="#7ED7B5" />
                <Text style={styles.metaText}>{getTotalWorkouts()} bài tập</Text>
              </View>
              {plan.goal && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="flag" size={20} color="#FFA726" />
                  <Text style={styles.metaText}>{plan.goal}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{getTypeDescription(plan.type)}</Text>
          </View>
        </View>

        {/* Workout Details */}
        <View style={styles.workoutsCard}>
          <Text style={styles.sectionTitle}>Chi tiết bài tập</Text>
          
          {plan.planDays && plan.planDays.length > 0 ? (
            plan.planDays.map((planDay, index) => (
              <View key={index} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{getDayName(planDay.day, plan.type)}</Text>
                  <Text style={styles.workoutCount}>
                    {planDay.workouts?.length || 0} bài tập
                  </Text>
                </View>
                
                {planDay.workouts && planDay.workouts.length > 0 ? (
                  planDay.workouts.map((workout, wIndex) => {
                    const training = typeof workout.trainingId === 'object' 
                      ? workout.trainingId 
                      : null;
                    
                    return (
                      <View key={wIndex} style={styles.workoutItem}>
                        <View style={styles.workoutNumber}>
                          <Text style={styles.workoutNumberText}>{wIndex + 1}</Text>
                        </View>
                        <View style={styles.workoutInfo}>
                          <Text style={styles.workoutTitle}>
                            {training?.title || "Bài tập"}
                          </Text>
                          {workout.time && (
                            <Text style={styles.workoutTime}>
                              🕐 {workout.time}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noWorkoutText}>Chưa có bài tập</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Chưa có dữ liệu bài tập</Text>
          )}
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setShowCalendar(true)}
          disabled={applying}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="event-available" size={24} color="#fff" />
              <Text style={styles.applyButtonText}>Áp dụng kế hoạch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngày bắt đầu</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={28} color="#1D1617" />
              </TouchableOpacity>
            </View>

            <Calendar
              current={selectedDate}
              onDayPress={onDayPress}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: "#92A3FD",
                todayTextColor: "#C58BF2",
                arrowColor: "#92A3FD",
                monthTextColor: "#1D1617",
                textMonthFontWeight: "bold",
                textMonthFontSize: 18,
              }}
              minDate={new Date().toISOString().split("T")[0]}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmApplyPlan}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  emptySpace: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 15,
    color: "#7B6F72",
    lineHeight: 22,
    marginBottom: 16,
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 14,
    color: "#7B6F72",
    fontWeight: "500",
  },
  descriptionBox: {
    backgroundColor: "#F7F8F8",
    padding: 12,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: "#7B6F72",
    fontStyle: "italic",
  },
  workoutsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 16,
  },
  dayContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92A3FD",
  },
  workoutCount: {
    fontSize: 13,
    color: "#7B6F72",
    fontWeight: "500",
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F7F8F8",
    borderRadius: 12,
    marginBottom: 8,
  },
  workoutNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#92A3FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workoutNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 2,
  },
  workoutTime: {
    fontSize: 13,
    color: "#7B6F72",
  },
  noWorkoutText: {
    fontSize: 14,
    color: "#ADA4A5",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  noDataText: {
    fontSize: 14,
    color: "#ADA4A5",
    textAlign: "center",
    paddingVertical: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  applyButton: {
    flexDirection: "row",
    backgroundColor: "#92A3FD",
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  confirmButton: {
    backgroundColor: "#92A3FD",
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

