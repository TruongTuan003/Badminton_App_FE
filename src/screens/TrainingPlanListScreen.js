import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { trainingPlanAPI, aiRecommendationAPI, userAPI, scheduleAPI } from "../services/api";

export default function TrainingPlanListScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterType, setFilterType] = useState("all"); // all, daily, weekly, monthly
  const [filterLevel, setFilterLevel] = useState("all"); // all, Cơ bản, Trung bình, Nâng cao
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPlans, setNewPlans] = useState([]);
  const [applyingPlanId, setApplyingPlanId] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [shouldReopenModal, setShouldReopenModal] = useState(false);
  const navigatingToDetailRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    fetchPlans();
    fetchUserId();
  }, []);

  const fetchUserId = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data?.id) {
        setUserId(response.data.id);
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await trainingPlanAPI.getAll();
      setPlans(response.data || []);
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách kế hoạch:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách kế hoạch tập luyện");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPlans = () => {
    return plans.filter((plan) => {
      const matchType = filterType === "all" || plan.type === filterType;
      const matchLevel = filterLevel === "all" || plan.level === filterLevel;
      return matchType && matchLevel && plan.isActive;
    });
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng"
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      daily: "#92A3FD",
      weekly: "#C58BF2",
      monthly: "#7ED7B5"
    };
    return colorMap[type] || "#999";
  };

  const getTotalWorkouts = (planDays) => {
    if (!Array.isArray(planDays)) return 0;
    return planDays.reduce((total, day) => total + (day.workouts?.length || 0), 0);
  };

  const handleGeneratePlan = async () => {
    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    Alert.alert(
      "Tạo lộ trình AI",
      "Hệ thống sẽ tạo 3 lộ trình tập luyện phù hợp với bạn (Cơ bản, Trung bình, Nâng cao). Quá trình này có thể mất vài phút. Bạn có muốn tiếp tục?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Tạo ngay",
          onPress: async () => {
            try {
              setGenerating(true);
              const response = await aiRecommendationAPI.generateTrainingPlan(userId);

              console.log("📊 Generate Plan Response:", response.data);

              // Lấy planIds từ response
              const planIds = response.data?.planIds || [];
              
              if (planIds.length === 0) {
                Alert.alert("Lỗi", "Không nhận được ID của các kế hoạch vừa tạo");
                return;
              }

              console.log("🔍 Fetching details for plans:", planIds);

              // Fetch chi tiết từng plan
              const planDetails = [];
              for (const planId of planIds) {
                try {
                  console.log(`📥 Fetching plan: ${planId}`);
                  const planResponse = await trainingPlanAPI.getById(planId);
                  if (planResponse.data) {
                    console.log(`✅ Got plan: ${planResponse.data.name}`);
                    planDetails.push(planResponse.data);
                  }
                } catch (err) {
                  console.error(`❌ Error fetching plan ${planId}:`, err);
                }
              }

              console.log(`📋 Total plans fetched: ${planDetails.length}`);
              console.log("📝 Plan details:", planDetails.map(p => ({ name: p.name, id: p._id })));

              if (planDetails.length > 0) {
                setNewPlans(planDetails);
                setTimeout(() => {
                  setShowModal(true);
                  console.log("✅ Modal opened with plans:", planDetails.length);
                }, 100);
              } else {
                Alert.alert(
                  "Thành công", 
                  "Đã tạo lộ trình tập luyện thành công!", 
                  [{ text: "OK", onPress: () => fetchPlans() }]
                );
              }

            } catch (error) {
              console.error("❌ Lỗi khi tạo lộ trình:", error);
              const errorMessage = error.response?.data?.error || error.message || "Có lỗi xảy ra khi tạo lộ trình";
              Alert.alert("Lỗi", errorMessage);
            } finally {
              setGenerating(false);
            }
          }
        }
      ]
    );
  };

  // Format date thành YYYY-MM-DD (local time)
  const toLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Load danh sách kế hoạch đang theo dõi từ AsyncStorage
  const loadActivePlans = async () => {
    try {
      const stored = await AsyncStorage.getItem("activeTrainingPlans");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed && typeof parsed === 'object' && parsed.planId) {
          return [parsed];
        }
      }
      return [];
    } catch (error) {
      console.error("Error loading active plans:", error);
      return [];
    }
  };

  // Lưu danh sách kế hoạch vào AsyncStorage
  const saveActivePlans = async (plansArray) => {
    try {
      await AsyncStorage.setItem("activeTrainingPlans", JSON.stringify(plansArray));
      console.log("✅ Saved active plans:", plansArray.length);
    } catch (error) {
      console.error("Failed to store active training plans:", error);
    }
  };

  // Hàm normalize goal để so sánh
  const normalizeGoal = (goal) => {
    if (!goal) return "";
    if (typeof goal === "string") {
      return goal.toLowerCase().trim();
    }
    if (Array.isArray(goal)) {
      return goal.map(g => typeof g === "string" ? g.toLowerCase().trim() : (g?.title || "").toLowerCase().trim()).filter(Boolean).sort().join(",");
    }
    if (goal?.title) {
      return goal.title.toLowerCase().trim();
    }
    return String(goal).toLowerCase().trim();
  };

  // Hàm format goal để hiển thị
  const formatGoalForDisplay = (goal) => {
    if (!goal) return "không có mục tiêu";
    if (typeof goal === "string") {
      return goal;
    }
    if (Array.isArray(goal)) {
      return goal.length > 0 ? (typeof goal[0] === "string" ? goal[0] : goal[0]?.title || "không có mục tiêu") : "không có mục tiêu";
    }
    if (goal?.title) {
      return goal.title;
    }
    return String(goal);
  };

  // Kiểm tra xem kế hoạch có cùng goal với kế hoạch nào trong danh sách không
  const checkDuplicateGoal = (newPlanGoal, existingPlans) => {
    const normalizedNewGoal = normalizeGoal(newPlanGoal);
    if (!normalizedNewGoal) {
      return null;
    }

    for (const existingPlan of existingPlans) {
      const normalizedExistingGoal = normalizeGoal(existingPlan.goal);
      if (normalizedExistingGoal && normalizedNewGoal === normalizedExistingGoal) {
        return existingPlan;
      }
    }
    return null;
  };

  // Kiểm tra xem có schedule trong các ngày này chưa
  const checkExistingSchedules = async (plan, startDate) => {
    try {
      const datesToCheck = [];
      
      if (plan.type === "daily") {
        datesToCheck.push(startDate);
      } else if (plan.type === "weekly") {
        const start = new Date(startDate);
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          datesToCheck.push(toLocalDateStr(date));
        }
      } else if (plan.type === "monthly") {
        const start = new Date(startDate);
        for (let i = 0; i < 30; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          datesToCheck.push(toLocalDateStr(date));
        }
      }

      let hasExistingSchedule = false;
      for (const dateStr of datesToCheck) {
        try {
          const response = await scheduleAPI.getByDate(dateStr);
          if (response.data && response.data.schedule) {
            hasExistingSchedule = true;
            break;
          }
        } catch (err) {
          // Ignore 404
        }
      }

      return hasExistingSchedule;
    } catch (error) {
      console.error("Error checking existing schedules:", error);
      return true;
    }
  };

  // Build workout map từ plan
  const buildWorkoutMap = (plan, startDate) => {
    if (!plan?.planDays || plan.planDays.length === 0) return [];

    const result = [];
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
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

  // Xóa lịch của plan cũ
  const deleteOldPlanSchedule = async (oldPlan) => {
    if (!oldPlan || !oldPlan.workoutMap || !oldPlan.startDate) {
      return;
    }

    try {
      const startDate = new Date(oldPlan.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate = new Date(startDate);
      if (oldPlan.type === "daily") {
        endDate = new Date(startDate);
      } else if (oldPlan.type === "weekly") {
        endDate.setDate(startDate.getDate() + 6);
      } else if (oldPlan.type === "monthly") {
        endDate.setDate(startDate.getDate() + 29);
      }
      endDate.setHours(23, 59, 59, 999);

      const oldPlanWorkoutIds = new Set();
      oldPlan.workoutMap.forEach((entry) => {
        (entry.workoutIds || []).forEach((wId) => {
          if (wId) {
            const normalizedId = typeof wId === "string" ? wId.trim() : String(wId?._id || wId).trim();
            if (normalizedId) oldPlanWorkoutIds.add(normalizedId);
          }
        });
      });

      const datesToCheck = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        datesToCheck.push(toLocalDateStr(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let deletedCount = 0;
      for (const dateStr of datesToCheck) {
        try {
          const scheduleRes = await scheduleAPI.getByDate(dateStr);
          const schedule = scheduleRes.data?.schedule;
          
          if (schedule && schedule._id) {
            const details = scheduleRes.data?.details || [];
            const detailsToDelete = details.filter((detail) => {
              const detailWorkoutId = typeof detail.workoutId === "string" 
                ? detail.workoutId.trim() 
                : String(detail.workoutId?._id || detail.workoutId).trim();
              return oldPlanWorkoutIds.has(detailWorkoutId);
            });

            for (const detail of detailsToDelete) {
              try {
                const workoutId = typeof detail.workoutId === "string" 
                  ? detail.workoutId 
                  : detail.workoutId?._id || detail.workoutId;
                await scheduleAPI.removeWorkout(schedule._id, workoutId);
                deletedCount++;
              } catch (err) {
                console.error(`Error deleting workout from ${dateStr}:`, err);
              }
            }
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.error(`Error checking schedule for ${dateStr}:`, err);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error deleting old plan schedule:", error);
    }
  };

  const confirmApplyPlan = async () => {
    if (!selectedPlan) return;

    const currentPlans = await loadActivePlans();
    const currentPlanCount = currentPlans.length;
    const isPlanAlreadyActive = currentPlans.some(p => p.planId === selectedPlan._id || p.planId === selectedPlan.planId);
    
    const hasExisting = await checkExistingSchedules(selectedPlan, selectedDate);
    const duplicateGoalPlan = !isPlanAlreadyActive ? checkDuplicateGoal(selectedPlan.goal, currentPlans) : null;
    
    // Nếu không có lịch trùng và không có vấn đề gì → áp dụng luôn, không hiển thị dialog
    if (!hasExisting && !duplicateGoalPlan && currentPlanCount < 2 && !isPlanAlreadyActive) {
      handleApplyPlan(false, false);
      return;
    }
    
    // Chỉ hiển thị dialog khi có lịch trùng hoặc có vấn đề cần quyết định
    let message = "Bạn muốn:\n\n";
    
    if (isPlanAlreadyActive) {
      message += "⚠️ Kế hoạch này đang được theo dõi.\n\n";
      message += "• Thêm vào: Giữ kế hoạch cũ và thêm bài tập mới\n";
      message += "• Ghi đè: Xóa kế hoạch cũ và thêm kế hoạch mới";
    } else if (duplicateGoalPlan) {
      const goalDisplay = formatGoalForDisplay(duplicateGoalPlan.goal || selectedPlan.goal);
      message += `⚠️ Bạn đã có kế hoạch của mục tiêu "${goalDisplay}" rồi.\n\n`;
      message += "• Thêm vào: Không thể thêm (đã có kế hoạch cùng mục tiêu)\n";
      message += "• Ghi đè: Xóa kế hoạch cũ cùng mục tiêu và thêm kế hoạch mới";
    } else if (currentPlanCount >= 2) {
      message += "⚠️ Bạn đã theo dõi 2 kế hoạch (tối đa 2).\n\n";
      message += "• Thêm vào: Không thể thêm (đã đủ 2 kế hoạch)\n";
      message += "• Ghi đè: Xóa kế hoạch cũ và thêm kế hoạch mới";
    } else if (hasExisting) {
      message += "⚠️ Đã có lịch tập trong khoảng thời gian này.\n\n";
      message += "• Thêm vào: Thêm bài tập mới vào lịch hiện có (giữ bài tập cũ)\n";
      message += "• Ghi đè: Xóa bài tập cũ và thêm bài tập mới";
    } else {
      message += "• Thêm vào: Thêm kế hoạch mới vào danh sách (giữ kế hoạch cũ)\n";
      message += "• Ghi đè: Xóa kế hoạch cũ và thêm kế hoạch mới";
    }
    
    Alert.alert(
      "Chọn phương thức áp dụng",
      message,
      [
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => {
            handleCloseCalendar(true);
          }
        },
        {
          text: "Thêm vào",
          onPress: () => {
            if (duplicateGoalPlan) {
              const goalDisplay = formatGoalForDisplay(duplicateGoalPlan.goal || selectedPlan.goal);
              Alert.alert(
                "Không thể thêm",
                `Bạn đã có kế hoạch của mục tiêu "${goalDisplay}" rồi.\n\n` +
                "Vui lòng chọn 'Ghi đè' để thay thế kế hoạch cũ cùng mục tiêu.",
                [{ text: "OK" }]
              );
              handleCloseCalendar(true);
              return;
            }
            
            if (currentPlanCount >= 2 && !isPlanAlreadyActive) {
              Alert.alert(
                "Không thể thêm",
                "Bạn đã theo dõi 2 kế hoạch (tối đa 2).\nVui lòng chọn 'Ghi đè' để thay thế một kế hoạch cũ.",
                [{ text: "OK" }]
              );
              handleCloseCalendar(true);
            } else {
              handleApplyPlan(false, false);
            }
          }
        },
        {
          text: "Ghi đè",
          onPress: () => {
            if (duplicateGoalPlan) {
              handleApplyPlan(true, true, duplicateGoalPlan.planId);
            } else {
              handleApplyPlan(true, true);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleApplyPlan = async (replaceExisting = false, shouldReplacePlans = false, replacePlanId = null) => {
    if (!selectedPlan) return;

    try {
      setApplyingPlanId(selectedPlan._id || selectedPlan.planId);
      
      const planId = selectedPlan._id || selectedPlan.planId;
      if (!planId) {
        Alert.alert("Lỗi", "Không tìm thấy ID của kế hoạch");
        setShowCalendar(false);
        setSelectedPlan(null);
        return;
      }

      let currentPlans = await loadActivePlans();
      const isPlanAlreadyActive = currentPlans.some(p => p.planId === planId);
      
      if (!shouldReplacePlans && !isPlanAlreadyActive && currentPlans.length >= 2) {
        Alert.alert(
          "Không thể thêm",
          "Bạn đã theo dõi 2 kế hoạch (tối đa 2).\nVui lòng chọn 'Ghi đè' để thay thế một kế hoạch cũ."
        );
        setShowCalendar(false);
        setSelectedPlan(null);
        setApplyingPlanId(null);
        return;
      }

      let shouldReplaceSchedule = replaceExisting;
      if (replacePlanId) {
        const oldPlan = currentPlans.find(p => p.planId === replacePlanId);
        if (oldPlan) {
          await deleteOldPlanSchedule(oldPlan);
          shouldReplaceSchedule = false;
        }
      }
      
      const response = await trainingPlanAPI.applyPlan(planId, selectedDate, shouldReplaceSchedule);
      
      const workoutMap = buildWorkoutMap(selectedPlan, selectedDate);
      const totalPlanWorkouts = workoutMap.reduce((sum, entry) => sum + entry.workoutIds.length, 0) || 0;

      const newPlanPayload = {
        planId: planId,
        name: selectedPlan.name,
        type: selectedPlan.type,
        level: selectedPlan.level,
        goal: selectedPlan.goal,
        startDate: selectedDate,
        totalWorkouts: totalPlanWorkouts,
        workoutMap,
        dates: response.data?.dates || workoutMap.map((item) => item.date),
        updatedAt: new Date().toISOString(),
      };

      let updatedPlans = [];
      
      if (shouldReplacePlans) {
        if (replacePlanId) {
          updatedPlans = currentPlans.filter(p => p.planId !== replacePlanId);
          updatedPlans.push(newPlanPayload);
        } else if (isPlanAlreadyActive) {
          updatedPlans = currentPlans.filter(p => p.planId !== planId);
          updatedPlans.push(newPlanPayload);
        } else {
          updatedPlans = currentPlans.slice(1);
          updatedPlans.push(newPlanPayload);
        }
      } else {
        if (isPlanAlreadyActive) {
          updatedPlans = currentPlans.map(p => 
            p.planId === planId ? newPlanPayload : p
          );
        } else {
          updatedPlans = [...currentPlans, newPlanPayload];
        }
      }
      
      await saveActivePlans(updatedPlans);
      
      if (updatedPlans.length > 0) {
        try {
          await AsyncStorage.setItem(
            "activeTrainingPlan",
            JSON.stringify(updatedPlans[0])
          );
        } catch (storageError) {
          console.error("Failed to store active training plan:", storageError);
        }
      }
      
      const { datesProcessed, totalWorkouts } = response.data;

      // Thành công → không cần mở lại modal lộ trình
      setShouldReopenModal(false);
      
      Alert.alert(
        "Thành công",
        `Đã ${shouldReplacePlans ? "ghi đè" : "thêm vào"} kế hoạch "${selectedPlan.name}"!\n\n` +
        `📅 Đã xử lý ${datesProcessed} ngày\n` +
        `💪 Đã thêm ${totalWorkouts} bài tập\n` +
        `📋 Đang theo dõi ${updatedPlans.length}/2 kế hoạch`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowModal(false);
              setShowCalendar(false);
              setSelectedPlan(null);
              setNewPlans([]);
              fetchPlans();
            }
          }
        ]
      );
    } catch (error) {
      console.error("❌ Lỗi khi áp dụng kế hoạch:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi áp dụng kế hoạch";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setApplyingPlanId(null);
      setShowCalendar(false);
      setSelectedPlan(null);
    }
  };

  const onPlanApplyPress = (plan) => {
    setSelectedPlan(plan);
    // Áp dụng kế hoạch không cần mở lại modal khi quay về
    setShouldReopenModal(false);
    setShowModal(false);
    // [2025-12-09 10:37:46] Delay ngắn để modal đóng hẳn trước khi mở calendar
    setTimeout(() => {
      setShowCalendar(true);
    }, 80);
  };

  const onPlanDetailPress = (plan) => {
    if (!plan) return;
    navigatingToDetailRef.current = true;
    setShowModal(false);
    setShouldReopenModal(true);
    navigation.navigate("TrainingPlanDetail", { plan });
    
  };

  useFocusEffect(
    useCallback(() => {
      // Khi quay lại, mở lại modal nếu có cờ và có dữ liệu
      if (shouldReopenModal && newPlans.length > 0) {
        setShowModal(true);
        setShouldReopenModal(false);
      }
      // Reset cờ điều hướng chi tiết khi đã quay lại
      navigatingToDetailRef.current = false;
    }, [shouldReopenModal, newPlans.length])
  );

  useEffect(() => {
    // Chỉ mở lại modal khi không trong quá trình điều hướng sang chi tiết
    if (!showCalendar && shouldReopenModal && newPlans.length > 0 && !navigatingToDetailRef.current) {
      setShowModal(true);
      setShouldReopenModal(false);
    }
  }, [showCalendar, shouldReopenModal, newPlans.length]);

  const handleCloseCalendar = (resetSelection = false) => {
    setShowCalendar(false);
    if (resetSelection) {
      setSelectedPlan(null);
    }
    if (shouldReopenModal && newPlans.length > 0) {
      setShowModal(true);
      setShouldReopenModal(false);
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getLevelColor = (level) => {
    const levelMap = {
      "Cơ bản": "#92A3FD",
      "Trung bình": "#C58BF2",
      "Nâng cao": "#7ED7B5"
    };
    return levelMap[level] || "#92A3FD";
  };

  const renderPlanCard = ({ item }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => navigation.navigate("TrainingPlanDetail", { plan: item })}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleContainer}>
          <Text style={styles.planName}>{item.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeBadgeText}>{getTypeLabel(item.type)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#C58BF2" />
      </View>

      {item.description && (
        <Text style={styles.planDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.planInfo}>
        <View style={styles.infoItem}>
          <MaterialIcons name="fitness-center" size={18} color="#92A3FD" />
          <Text style={styles.infoText}>{getTotalWorkouts(item.planDays)} bài tập</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="trending-up" size={18} color="#C58BF2" />
          <Text style={styles.infoText}>{item.level}</Text>
        </View>
        {item.goal && (
          <View style={styles.infoItem}>
            <MaterialIcons name="flag" size={18} color="#7ED7B5" />
            <Text style={styles.infoText}>{item.goal}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (label, value, currentFilter, setFilter) => (
    <TouchableOpacity
      style={[styles.filterButton, currentFilter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          currentFilter === value && styles.filterButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#92A3FD" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredPlans = getFilteredPlans();

  // List Header Component
  const renderListHeader = () => (
    <>
      {/* AI Recommendation Card */}
      <View style={styles.aiCardContainer}>
        <TouchableOpacity
          onPress={handleGeneratePlan}
          disabled={generating}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#92A3FD", "#9DCEFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCard}
          >
            <View style={styles.aiCardContent}>
              <View style={styles.aiCardIcon}>
                <MaterialIcons name="psychology" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.aiCardTextContainer}>
                <Text style={styles.aiCardTitle}>
                  Bạn muốn trở nên bán chuyên nghiệp?
                </Text>
                <Text style={styles.aiCardSubtitle}>
                  AI sẽ tạo 3 lộ trình tập luyện phù hợp với bạn
                </Text>
              </View>
            </View>

            <View style={styles.aiCardButton}>
              {generating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.aiCardButtonText}>
                    Vui lòng đợi...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
                  <Text style={styles.aiCardButtonText}>Tạo lộ trình AI</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Loại kế hoạch:</Text>
        <View style={styles.filterRow}>
          {renderFilterButton("Tất cả", "all", filterType, setFilterType)}
          {renderFilterButton("Hàng ngày", "daily", filterType, setFilterType)}
          {renderFilterButton("Hàng tuần", "weekly", filterType, setFilterType)}
          {renderFilterButton("Hàng tháng", "monthly", filterType, setFilterType)}
        </View>

        <Text style={styles.filterLabel}>Cấp độ:</Text>
        <View style={styles.filterRow}>
          {renderFilterButton("Tất cả", "all", filterLevel, setFilterLevel)}
          {renderFilterButton("Cơ bản", "Cơ bản", filterLevel, setFilterLevel)}
          {renderFilterButton("Trung bình", "Trung bình", filterLevel, setFilterLevel)}
          {renderFilterButton("Nâng cao", "Nâng cao", filterLevel, setFilterLevel)}
        </View>
      </View>
    </>
  );

  // List Empty Component
  const renderListEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="event-note" size={64} color="#DDD" />
      <Text style={styles.emptyText}>Không có kế hoạch nào phù hợp</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header - Fixed */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kế hoạch tập luyện</Text>
        <View style={styles.emptySpace} />
      </View>

      {/* Plans List with Header */}
      <FlatList
        data={filteredPlans}
        renderItem={renderPlanCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={[
          styles.listContainer,
          filteredPlans.length === 0 && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      />

      {/* Modal hiển thị các lộ trình vừa tạo */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          setNewPlans([]);
          fetchPlans();
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowModal(false);
            setNewPlans([]);
            fetchPlans();
          }}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <MaterialIcons name="auto-awesome" size={28} color="#92A3FD" />
                <Text style={styles.modalTitle}>Lộ trình đã tạo</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setNewPlans([]);
                  fetchPlans();
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#1D1617" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Chọn lộ trình bạn muốn áp dụng ngay:
            </Text>
            {/* Plans List */}
            {newPlans.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <ActivityIndicator size="large" color="#92A3FD" />
                <Text style={styles.modalEmptyText}>Đang tải thông tin lộ trình...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {newPlans.map((plan, index) => {
                  try {
                    const planId = plan._id || plan.planId || `plan-${index}`;
                    const planDays = plan.planDays || plan.days || [];
                    const totalWorkouts = getTotalWorkouts(planDays);
                    const levelColor = getLevelColor(plan.level || "Cơ bản");
                    const planName = plan.name || `Lộ trình ${index + 1}`;
                    const planLevel = plan.level || "Cơ bản";
                    const planDescription = plan.description || "";
                    const planGoal = plan.goal ? (typeof plan.goal === 'string' ? plan.goal : String(plan.goal)) : null;

                    console.log(`📋 Rendering plan ${index}:`, {
                      id: planId,
                      name: planName,
                      level: planLevel,
                      totalWorkouts,
                      planDaysLength: planDays.length,
                      hasDescription: !!planDescription,
                      hasGoal: !!planGoal
                    });

                    return (
                      <View key={planId} style={styles.modalPlanCard}>
                        <View style={styles.modalPlanHeader}>
                          <View style={styles.modalPlanTitleContainer}>
                            <Text style={styles.modalPlanName}>
                              {planName}
                            </Text>
                            <View style={[styles.modalLevelBadge, { backgroundColor: levelColor }]}>
                              <Text style={styles.modalLevelBadgeText}>{planLevel}</Text>
                            </View>
                          </View>
                        </View>

                        {planDescription ? (
                          <Text style={styles.modalPlanDescription} numberOfLines={2}>
                            {planDescription}
                          </Text>
                        ) : null}

                        <View style={styles.modalPlanInfo}>
                          <View style={styles.modalInfoItem}>
                            <MaterialIcons name="fitness-center" size={16} color="#7B6F72" />
                            <Text style={styles.modalInfoText}>{totalWorkouts} bài tập</Text>
                          </View>
                          {planGoal ? (
                            <View style={styles.modalInfoItem}>
                              <MaterialIcons name="flag" size={16} color="#7B6F72" />
                              <Text style={styles.modalInfoText} numberOfLines={1}>
                                {planGoal}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.modalActionsRow}>
                          <TouchableOpacity
                            style={styles.modalSecondaryButton}
                            onPress={() => onPlanDetailPress(plan)}
                          >
                            <MaterialIcons name="visibility" size={18} color="#1D1617" />
                            <Text style={styles.modalSecondaryButtonText}>Xem chi tiết</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.modalApplyButton,
                              { backgroundColor: levelColor },
                              applyingPlanId === planId && styles.modalApplyButtonDisabled
                            ]}
                            onPress={() => onPlanApplyPress(plan)}
                            disabled={applyingPlanId === planId}
                          >
                            {applyingPlanId === planId ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.modalApplyButtonText}>Áp dụng kế hoạch</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  } catch (error) {
                    console.error(`❌ Error rendering plan ${index}:`, error, plan);
                    return (
                      <View key={`error-${index}`} style={styles.modalPlanCard}>
                        <Text style={styles.modalPlanName}>Lỗi hiển thị lộ trình {index + 1}</Text>
                        <Text style={styles.modalPlanDescription}>{String(error)}</Text>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowModal(false);
                  setNewPlans([]);
                  fetchPlans();
                }}
              >
                <Text style={styles.modalCancelButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Modal for selecting start date */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => handleCloseCalendar(true)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Chọn ngày bắt đầu</Text>
              <TouchableOpacity
                onPress={() => handleCloseCalendar(true)}
              >
                <Ionicons name="close" size={28} color="#1D1617" />
              </TouchableOpacity>
            </View>

            <Calendar
              current={selectedDate}
              onDayPress={onDayPress}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: "#92A3FD",
                },
              }}
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

            <View style={styles.calendarModalFooter}>
              <TouchableOpacity
                style={styles.calendarConfirmButton}
                onPress={confirmApplyPlan}
                disabled={applyingPlanId !== null}
              >
                {applyingPlanId !== null ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.calendarConfirmButtonText}>Xác nhận</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7B6F72",
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
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F7F8F8",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterButtonActive: {
    backgroundColor: "#92A3FD",
    borderColor: "#92A3FD",
  },
  filterButtonText: {
    fontSize: 13,
    color: "#7B6F72",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  planTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  planDescription: {
    fontSize: 14,
    color: "#7B6F72",
    marginBottom: 12,
    lineHeight: 20,
  },
  planInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#7B6F72",
    fontWeight: "500",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#ADA4A5",
    marginTop: 16,
  },
  aiCardContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 8,
  },
  aiCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  aiCardTextContainer: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  aiCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  aiCardButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "65%",
    paddingTop: 20,
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#7B6F72",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalScrollView: {
    flex: 1,
    minHeight: 200,
    maxHeight: 850,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  modalEmptyText: {
    marginTop: 16,
    fontSize: 14,
    color: "#7B6F72",
  },
  modalPlanCard: {
    backgroundColor: "#F7F8F8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalPlanHeader: {
    marginBottom: 8,
  },
  modalPlanTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  modalPlanName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D1617",
    flex: 1,
  },
  modalLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalLevelBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalPlanDescription: {
    fontSize: 13,
    color: "#7B6F72",
    marginBottom: 12,
    lineHeight: 18,
  },
  modalPlanInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  modalActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1617",
  },
  modalInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalInfoText: {
    fontSize: 12,
    color: "#7B6F72",
    fontWeight: "500",
  },
  modalApplyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
    minHeight: 48,
  },
  modalApplyButtonDisabled: {
    opacity: 0.6,
  },
  modalApplyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F7F8F8",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7B6F72",
  },
  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  calendarModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  calendarModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  calendarModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  calendarConfirmButton: {
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
  calendarConfirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

