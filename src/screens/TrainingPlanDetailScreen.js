import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
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
import { trainingPlanAPI, scheduleAPI } from "../services/api";

export default function TrainingPlanDetailScreen({ route, navigation }) {
  const { plan, isActive, startDate: activeStartDate } = route.params;
  const [applying, setApplying] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [completedWorkouts, setCompletedWorkouts] = useState(new Set()); // Set của "date-workoutId"
  const [loadingProgress, setLoadingProgress] = useState(false);

  const parseLocalDate = (dateStr) => {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateStr);
    }
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Format date thành YYYY-MM-DD (local time, không dùng toISOString để tránh lỗi timezone)
  const toLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const buildWorkoutMap = () => {
    if (!plan?.planDays || plan.planDays.length === 0) return [];

    const result = [];
    const startDateObj = parseLocalDate(selectedDate);
    const startDayOfWeek = startDateObj.getDay();

    const normalizeWorkoutId = (workout) => {
      if (!workout) return null;
      if (typeof workout.trainingId === "object" && workout.trainingId?._id) {
        return workout.trainingId._id;
      }
      return workout.trainingId || null;
    };

    const addEntry = (dateObj, workouts) => {
      if (!workouts || workouts.length === 0) return;
      const workoutIds = workouts
        .map((workout) => normalizeWorkoutId(workout))
        .filter(Boolean);

      if (workoutIds.length === 0) return;

      const dateCopy = new Date(dateObj);
      dateCopy.setHours(0, 0, 0, 0);
      result.push({
        date: toLocalDateStr(dateCopy),
        workoutIds,
      });
    };

    if (plan.type === "daily") {
      const planDay = plan.planDays.find((pd) => pd.day === 1 || pd.day === 0);
      if (planDay) addEntry(startDateObj, planDay.workouts);
    } else if (plan.type === "weekly") {
      plan.planDays.forEach((planDay) => {
        if (planDay.day === undefined || planDay.day === null) return;
        let daysToAdd = planDay.day - startDayOfWeek;
        if (daysToAdd < 0) {
          daysToAdd += 7;
        }
        const targetDate = new Date(startDateObj);
        targetDate.setDate(startDateObj.getDate() + daysToAdd);
        addEntry(targetDate, planDay.workouts);
      });
    } else if (plan.type === "monthly") {
      plan.planDays.forEach((planDay) => {
        if (!planDay.day) return;
        const targetDate = new Date(startDateObj);
        targetDate.setDate(startDateObj.getDate() + (planDay.day - 1));
        addEntry(targetDate, planDay.workouts);
      });
    }

    return result;
  };

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

  // Tính ngày thực tế cho mỗi planDay dựa trên startDate
  const getActualDate = (planDayIndex, planDayValue) => {
    if (!isActive || !activeStartDate) return null;
    
    const startDateObj = parseLocalDate(activeStartDate);
    const startDayOfWeek = startDateObj.getDay();
    
    if (plan.type === "daily") {
      return startDateObj;
    } else if (plan.type === "weekly") {
      // planDayValue là thứ trong tuần (0=CN, 1=T2, ..., 6=T7)
      let daysToAdd = planDayValue - startDayOfWeek;
      if (daysToAdd < 0) daysToAdd += 7;
      const targetDate = new Date(startDateObj);
      targetDate.setDate(startDateObj.getDate() + daysToAdd);
      return targetDate;
    } else if (plan.type === "monthly") {
      // planDayValue là ngày trong tháng (1-30)
      const targetDate = new Date(startDateObj);
      targetDate.setDate(startDateObj.getDate() + (planDayValue - 1));
      return targetDate;
    }
    return null;
  };

  // Format ngày thành chuỗi hiển thị (ngày/tháng/năm)
  const formatDate = (date) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Kiểm tra workout đã hoàn thành chưa (kiểm tra theo date + workoutId)
  const isWorkoutDone = (dateStr, workoutId) => {
    if (!dateStr || !workoutId) return false;
    const normalizedId = typeof workoutId === "object" ? workoutId._id : workoutId;
    const key = `${dateStr}-${normalizedId}`;
    const isDone = completedWorkouts.has(key);
    
    if (completedWorkouts.size > 0) {
      console.log(`🔍 isWorkoutDone check: ${key} -> ${isDone}`);
    }
    return isDone;
  };
  
  // Lấy ngày đã hoàn thành của một workout (từ completed workouts)
  const getCompletedDate = (workoutId) => {
    if (!workoutId) return null;
    const normalizedId = typeof workoutId === "object" ? workoutId._id : workoutId;
    
    for (const key of completedWorkouts) {
      if (key.endsWith(`-${normalizedId}`)) {
        // key format: "date-workoutId"
        const date = key.replace(`-${normalizedId}`, "");
        return date;
      }
    }
    return null;
  };

  // Fetch completed workouts khi isActive
  useEffect(() => {
    if (!isActive || !activeStartDate) {
      console.log("📋 Skip fetch completed workouts:", { isActive, activeStartDate });
      return;
    }

    const fetchCompletedWorkouts = async () => {
      setLoadingProgress(true);
      console.log("📋 Fetching completed workouts for plan detail...");
      console.log("📋 activeStartDate:", activeStartDate);
      console.log("📋 plan.type:", plan.type);
      
      try {
        // Lấy danh sách tất cả workoutIds trong kế hoạch
        const planWorkoutIds = new Set();
        if (plan.planDays) {
          plan.planDays.forEach((planDay) => {
            if (planDay.workouts) {
              planDay.workouts.forEach((workout) => {
                const wId = typeof workout.trainingId === "object" 
                  ? workout.trainingId._id 
                  : workout.trainingId;
                if (wId) planWorkoutIds.add(String(wId));
              });
            }
          });
        }
        console.log("📋 Plan workout IDs:", Array.from(planWorkoutIds));
        
        const startDateObj = parseLocalDate(activeStartDate);
        startDateObj.setHours(0, 0, 0, 0);
        
        // Tính ngày cuối cùng của plan
        let endDate = new Date(startDateObj);
        if (plan.type === "daily") {
          endDate = new Date(startDateObj);
        } else if (plan.type === "weekly") {
          endDate.setDate(startDateObj.getDate() + 6);
        } else if (plan.type === "monthly") {
          endDate.setDate(startDateObj.getDate() + 29);
        }
        
        // Thêm ngày hôm nay vào range nếu cần
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = toLocalDateStr(today);
        
        console.log("📋 Date range:", toLocalDateStr(startDateObj), "to", toLocalDateStr(endDate));
        console.log("📋 Today:", todayStr);
        
        // Tạo danh sách ngày (từ startDate đến endDate)
        const datesSet = new Set();
        const currentDate = new Date(startDateObj);
        while (currentDate <= endDate) {
          datesSet.add(toLocalDateStr(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Thêm ngày hôm nay nếu nằm trong range hoặc gần range
        datesSet.add(todayStr);
        
        // Tính tất cả các ngày thực tế dựa trên plan days
        if (plan.planDays && plan.type === "weekly") {
          const startDayOfWeek = startDateObj.getDay();
          plan.planDays.forEach((planDay) => {
            if (planDay.day !== undefined && planDay.day !== null) {
              let daysToAdd = planDay.day - startDayOfWeek;
              if (daysToAdd < 0) daysToAdd += 7;
              const targetDate = new Date(startDateObj);
              targetDate.setDate(startDateObj.getDate() + daysToAdd);
              datesSet.add(toLocalDateStr(targetDate));
            }
          });
        }
        
        const datesArray = Array.from(datesSet).sort();
        console.log("📋 Dates to check:", datesArray);
        
        // Fetch schedule details cho tất cả ngày
        const completed = new Set();
        for (const dateStr of datesArray) {
          try {
            const res = await scheduleAPI.getByDate(dateStr);
            const details = res.data?.details || [];
            console.log(`📋 Date ${dateStr}: ${details.length} details`);
            
            details.forEach((detail) => {
              const status = String(detail.status || "").toLowerCase();
              const workoutId = typeof detail.workoutId === "object" 
                ? detail.workoutId._id 
                : detail.workoutId;
              const workoutIdStr = String(workoutId);
              
              // Chỉ đếm bài tập done nếu thuộc kế hoạch
              const isInPlan = planWorkoutIds.has(workoutIdStr);
              console.log(`   - workoutId: ${workoutId}, status: ${status}, inPlan: ${isInPlan}`);
              
              if (status === "done" && isInPlan) {
                const key = `${dateStr}-${workoutId}`;
                completed.add(key);
                console.log(`   ✅ Added to completed: ${key}`);
              }
            });
          } catch (err) {
            // Ignore 404 errors
            console.log(`📋 Date ${dateStr}: no schedule (404)`);
          }
        }
        
        setCompletedWorkouts(completed);
        console.log(`✅ Loaded ${completed.size} completed workouts:`, Array.from(completed));
      } catch (error) {
        console.error("Error fetching completed workouts:", error);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchCompletedWorkouts();
  }, [isActive, activeStartDate, plan.type, plan.planDays]);

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

  const checkExistingSchedules = async () => {
    try {
      // Tính toán các ngày sẽ được tạo dựa trên plan type và start date
      const startDate = new Date(selectedDate);
      const datesToCheck = [];
      
      if (plan.type === "daily") {
        datesToCheck.push(selectedDate);
      } else if (plan.type === "weekly") {
        // 7 ngày
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          datesToCheck.push(toLocalDateStr(date));
        }
      } else if (plan.type === "monthly") {
        // 30 ngày
        for (let i = 0; i < 30; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          datesToCheck.push(toLocalDateStr(date));
        }
      }

      // Kiểm tra từng ngày xem có schedule chưa
      let hasExistingSchedule = false;
      for (const dateStr of datesToCheck) {
        try {
          const response = await scheduleAPI.getByDate(dateStr);
          if (response.data && response.data.schedule) {
            hasExistingSchedule = true;
            break;
          }
        } catch (err) {
          // Nếu lỗi hoặc không có schedule, tiếp tục kiểm tra ngày khác
          console.log(`No schedule found for ${dateStr}`);
        }
      }

      return hasExistingSchedule;
    } catch (error) {
      console.error("Error checking existing schedules:", error);
      // Nếu có lỗi, giả định là có schedule để hiển thị Alert (an toàn hơn)
      return true;
    }
  };

  const confirmApplyPlan = async () => {
    // Kiểm tra xem có schedule trong các ngày này chưa
    const hasExisting = await checkExistingSchedules();
    
    if (hasExisting) {
      // Nếu đã có schedule, hiển thị Alert để chọn "Thêm vào" hoặc "Ghi đè"
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
    } else {
      // Nếu chưa có schedule, thêm vào luôn không cần hỏi
      handleApplyPlan(false);
    }
  };

  const handleApplyPlan = async (replaceExisting = false) => {
    try {
      setApplying(true);
      
      console.log("📋 Applying plan:", plan._id, "Start date:", selectedDate, "Replace:", replaceExisting);
      
      const response = await trainingPlanAPI.applyPlan(plan._id, selectedDate, replaceExisting);
      
      console.log("✅ Apply response:", response.data);

      const workoutMap = buildWorkoutMap();
      const totalPlanWorkouts =
        workoutMap.reduce((sum, entry) => sum + entry.workoutIds.length, 0) || 0;

      const activePlanPayload = {
        planId: plan._id,
        name: plan.name,
        type: plan.type,
        level: plan.level,
        goal: plan.goal,
        startDate: selectedDate,
        totalWorkouts: totalPlanWorkouts,
        workoutMap,
        dates: response.data?.dates || workoutMap.map((item) => item.date),
        updatedAt: new Date().toISOString(),
      };

      try {
        await AsyncStorage.setItem(
          "activeTrainingPlan",
          JSON.stringify(activePlanPayload)
        );
      } catch (storageError) {
        console.error("Failed to store active training plan:", storageError);
      }
      
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
        <View style={[styles.workoutsCard, isActive && styles.workoutsCardNoFooter]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chi tiết bài tập</Text>
            {loadingProgress && (
              <ActivityIndicator size="small" color="#92A3FD" />
            )}
          </View>
          
          {plan.planDays && plan.planDays.length > 0 ? (
            // Sắp xếp planDays theo ngày tăng dần khi isActive
            [...plan.planDays]
              .map((planDay, originalIndex) => ({
                ...planDay,
                originalIndex,
                actualDate: getActualDate(originalIndex, planDay.day),
              }))
              .sort((a, b) => {
                if (!isActive || !a.actualDate || !b.actualDate) return 0;
                return a.actualDate.getTime() - b.actualDate.getTime();
              })
              .map((planDay, index) => {
              const actualDate = planDay.actualDate;
              const actualDateStr = actualDate ? toLocalDateStr(actualDate) : null;
              
              // Debug log
              if (isActive && completedWorkouts.size > 0) {
                console.log(`📅 planDay[${index}]: day=${planDay.day}, actualDateStr=${actualDateStr}`);
              }
              
              // Đếm số bài tập đã hoàn thành trong ngày (kiểm tra theo workoutId và ngày từ completed)
              const doneCount = planDay.workouts?.filter(w => {
                const wId = typeof w.trainingId === "object" ? w.trainingId._id : w.trainingId;
                const completedDate = getCompletedDate(wId);
                // Kiểm tra workout có completed và ngày completed khớp với actualDateStr
                return completedDate && completedDate === actualDateStr;
              }).length || 0;
              const totalCount = planDay.workouts?.length || 0;
              const allDone = doneCount === totalCount && totalCount > 0;
              
              return (
                <View key={index} style={[styles.dayContainer, allDone && styles.dayContainerDone]}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayTitleContainer}>
                      <Text style={[styles.dayName, allDone && styles.dayNameDone]}>
                        {isActive && actualDate ? formatDate(actualDate) : getDayName(planDay.day, plan.type)}
                      </Text>
                    </View>
                    <View style={styles.dayCountContainer}>
                      {isActive && doneCount > 0 && (
                        <View style={styles.doneCountBadge}>
                          <Feather name="check" size={12} color="#22C55E" />
                          <Text style={styles.doneCountText}>{doneCount}/{totalCount}</Text>
                        </View>
                      )}
                      {!isActive && (
                        <Text style={styles.workoutCount}>
                          {totalCount} bài tập
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {planDay.workouts && planDay.workouts.length > 0 ? (
                    planDay.workouts.map((workout, wIndex) => {
                      const training = typeof workout.trainingId === 'object' 
                        ? workout.trainingId 
                        : null;
                      const workoutId = training?._id || workout.trainingId;
                      // Kiểm tra workout có completed và ngày completed khớp với actualDateStr
                      const completedDate = getCompletedDate(workoutId);
                      const isDone = completedDate && completedDate === actualDateStr;
                      
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
                          {isDone && (
                            <Text style={styles.doneText}>Done</Text>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noWorkoutText}>Chưa có bài tập</Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>Chưa có dữ liệu bài tập</Text>
          )}
        </View>
      </ScrollView>

      {/* Apply Button - Ẩn nếu đang theo dõi kế hoạch này */}
      {!isActive && (
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
      )}

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
              minDate={(() => {
                const now = new Date();
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
              })()}
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
  workoutsCardNoFooter: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1617",
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
  // Styles cho active plan
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayTitleContainer: {
    flexDirection: "column",
  },
  dayActualDate: {
    fontSize: 13,
    color: "#7B6F72",
    marginTop: 2,
  },
  dayCountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  doneCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  doneCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  dayContainerDone: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: -12,
    borderBottomColor: "#BBF7D0",
  },
  dayNameDone: {
    color: "#16A34A",
  },
  workoutItemDone: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  workoutNumberDone: {
    backgroundColor: "#22C55E",
  },
  workoutTitleDone: {
    color: "#16A34A",
  },
  workoutTimeDone: {
    color: "#22C55E",
  },
  doneBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  doneText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#22C55E",
    marginLeft: 8,
  },
});

