import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Bot } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatBotAI from "../components/ChatBotAI";
import { mealScheduleAPI, scheduleAPI, trainingLogAPI, trainingPlanAPI, userAPI } from "../services/api";
import { FONTS } from "../styles/commonStyles";
import { calculateBMI } from "../utils/bmiCalculator";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function HomeScreen({ navigation, route }) {
  // Lấy thông tin người dùng từ API
  const [userData, setUserData] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("home");
  const [isChatBotOpen, setIsChatBotOpen] = React.useState(false);
  const [todaySchedule, setTodaySchedule] = React.useState(null);
  const [todayMeals, setTodayMeals] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [trainingLogs, setTrainingLogs] = React.useState([]);
  const [mealSummary, setMealSummary] = React.useState({
    calories: 0,
    mealType: "",
  });
  const [recommendedPlans, setRecommendedPlans] = React.useState([]);
  const [loadingRecommendation, setLoadingRecommendation] = React.useState(false);
  const [activeTrainingPlan, setActiveTrainingPlan] = React.useState(null);
  const [activePlanProgress, setActivePlanProgress] = React.useState({
    completed: 0,
    total: 0,
  });
  const [planProgressLoading, setPlanProgressLoading] = React.useState(false);
  const calculatingProgressRef = React.useRef(false);
  const todayStr = (() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();
  const today = new Date();
  const todayAI = today.toISOString().split("T")[0];

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.getProfile();
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserData();
      setActiveTab("home");
    });
    return unsubscribe;
  }, [navigation]);

  const fetchTodaySchedule = React.useCallback(async () => {
    try {
      console.log("📅 Fetch schedule for today:", todayStr);
      const schRes = await scheduleAPI.getByDate(todayStr);
      console.log("🟢 Schedule API response:", schRes.data);

      if (schRes.data) {
        const { schedule, details } = schRes.data;
        
        // Lọc các bài tập chưa hoàn thành (status = "pending" hoặc "skipped")
        const pendingDetails = Array.isArray(details) 
          ? details.filter(detail => detail.status === "pending" || detail.status === "skipped")
          : [];
        
        // Lấy bài tập đầu tiên chưa hoàn thành
        const firstPendingDetail = pendingDetails.length > 0 ? pendingDetails[0] : null;
        
        console.log("📋 Pending workouts:", pendingDetails.length, "Selected:", firstPendingDetail?.workoutId?.title);
        setTodaySchedule(firstPendingDetail);
      } else {
        console.log("ℹ️ Không có dữ liệu lịch hôm nay");
        setTodaySchedule(null);
      }
    } catch (error) {
      setTodaySchedule(null);
    }
  }, [todayStr]);

  // 🥗 Hàm lấy meal hôm nay
  const fetchTodayMeals = React.useCallback(async () => {
    try {
      console.log("🥗 Fetch meal for today:", todayStr);
      const mealRes = await mealScheduleAPI.getByDate(todayStr);
      console.log("🥗 Meal API response:", mealRes.data);

      const meals = mealRes.data || [];
      setTodayMeals(meals);

      // ✅ Tính tổng calories
      const sumCalories = meals.reduce((sum, item) => {
        return sum + (item.mealId?.calories ? Number(item.mealId.calories) : 0);
      }, 0);

      // ✅ Xác định bữa ăn sắp tới
      let current = new Date();
      let nearMeal = "";
      let minDiff = 24 * 60;
      meals.forEach((item) => {
        const hourMin = item.time || "";
        if (/^\d{1,2}:\d{2}$/.test(hourMin)) {
          const [h, m] = hourMin.split(":").map(Number);
          const mealDate = new Date();
          mealDate.setHours(h, m, 0, 0);
          const diff = (mealDate - current) / 60000;
          if (diff >= 0 && diff < minDiff) {
            minDiff = diff;
            nearMeal = item.meal_type || item.mealId?.meal_type || "";
          }
        }
      });
      setMealSummary({ calories: sumCalories, mealType: nearMeal });
    } catch (error) {
      setTodayMeals([]);
      setMealSummary({ calories: 0, mealType: "" });
    }
  }, [todayStr]);

  // Fetch training logs
  const fetchTrainingLogs = React.useCallback(async () => {
    try {
      const response = await trainingLogAPI.getLogByUser();
      const logs = response.data || [];
      setTrainingLogs(logs);
    } catch (error) {
      console.error("Error fetching training logs:", error);
      setTrainingLogs([]);
    }
  }, []);

  const loadActivePlan = React.useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("activeTrainingPlan");
      if (stored) {
        const parsed = JSON.parse(stored);
        setActiveTrainingPlan(parsed);
        return parsed;
      } else {
        setActiveTrainingPlan(null);
        return null;
      }
    } catch (error) {
      console.error("Error loading active training plan:", error);
      setActiveTrainingPlan(null);
      return null;
    }
  }, []);

  // Fetch recommended training plans dựa trên survey data
  const fetchRecommendedPlan = React.useCallback(async () => {
    if (!userData) return;
    
    try {
      setLoadingRecommendation(true);
  const { badmintonLevel, goal } = userData;
      const userGoals = (Array.isArray(goal) ? goal : [goal]).filter(Boolean);
      
      // Chỉ fetch nếu có dữ liệu khảo sát
      if (!badmintonLevel || userGoals.length === 0) {
        setRecommendedPlans([]);
        return;
      }
      
      const normalizeText = (value) =>
        typeof value === "string" ? value.toLowerCase().trim() : "";

      const normalizeLevel = (value) => {
        const mapping = {
          beginner: ["beginner", "mới bắt đầu", "newbie", "basic", "cơ bản"],
          intermediate: ["intermediate", "trung bình", "average", "medium"],
          advanced: ["advanced", "nâng cao", "pro", "chuyên nghiệp"],
        };
        const normalized = normalizeText(value);
        for (const [key, aliases] of Object.entries(mapping)) {
          if (aliases.includes(normalized)) {
            return key;
          }
        }
        return normalized || "";
      };
      
      const normalizedLevel = normalizeLevel(badmintonLevel);
      if (!normalizedLevel) {
        setRecommendedPlans([]);
        return;
      }
      const normalizedUserGoals = userGoals
        .map((g) => {
          if (typeof g === "string") return normalizeText(g);
          if (g?.title) return normalizeText(g.title);
          return "";
        })
        .filter(Boolean);
      
      const matchesLevel = (planLevel) =>
        normalizeLevel(planLevel) === normalizedLevel;
      
      const matchesGoal = (planGoal) => {
        const planGoals = Array.isArray(planGoal)
          ? planGoal
          : planGoal
          ? [planGoal]
          : [];
        const normalizedPlanGoals = planGoals
          .map((g) => {
            if (typeof g === "string") return normalizeText(g);
            if (g?.title) return normalizeText(g.title);
            return "";
          })
          .filter(Boolean);

        if (normalizedPlanGoals.length === 0 || normalizedUserGoals.length === 0) {
          return false;
        }

        return normalizedPlanGoals.some((planGoal) =>
          normalizedUserGoals.includes(planGoal)
        );
      };

      // Sử dụng Map để tránh trùng lặp kế hoạch
      const planMap = new Map();
      const addPlansToMap = (planList) => {
        (planList || []).forEach((plan) => {
          if (plan?._id && !planMap.has(plan._id)) {
            planMap.set(plan._id, plan);
          }
        });
      };

      // Lấy training plans theo level
      try {
        const levelResponse = await trainingPlanAPI.getByLevel(badmintonLevel);
        addPlansToMap(levelResponse.data);
      } catch (error) {
        console.error("Error fetching plans by level:", error);
      }
      
      // Lấy thêm plans theo goal để có nhiều lựa chọn
      if (userGoals.length > 0) {
        try {
          for (const g of userGoals) {
            const goalResponse = await trainingPlanAPI.getByGoal(g);
            addPlansToMap(goalResponse.data);
          }
        } catch (error) {

        }
      }

      const allPlans = Array.from(planMap.values());
      const levelMatchedPlans = allPlans.filter((plan) =>
        matchesLevel(plan.level)
      );
      const levelAndGoalMatchedPlans = levelMatchedPlans.filter((plan) =>
        matchesGoal(plan.goal)
      );

      const rejectDailyPlans = (plans) =>
        plans.filter(
          (plan) =>
            typeof plan.type !== "string" ||
            !["daily", "hàng ngày", "hang ngay"].includes(normalizeText(plan.type))
        );

      let finalPlans = [];
      if (levelAndGoalMatchedPlans.length > 0) {
        finalPlans = rejectDailyPlans(levelAndGoalMatchedPlans);
      }
      if (finalPlans.length === 0 && levelMatchedPlans.length > 0) {
        finalPlans = rejectDailyPlans(levelMatchedPlans);
      }

      if (
        activeTrainingPlan?.planId &&
        !finalPlans.some((plan) => plan._id === activeTrainingPlan.planId)
      ) {
        try {
          const planDetail = await trainingPlanAPI.getById(
            activeTrainingPlan.planId
          );
          if (planDetail?.data) {
            finalPlans = [planDetail.data, ...finalPlans];
          }
        } catch (error) {
          console.error("Error fetching active plan detail:", error);
        }
      }

      const slicedPlans = finalPlans.slice(0, 10);
      if (activeTrainingPlan?.planId) {
        try {
          const currentIndex = slicedPlans.findIndex(
            (plan) => plan._id === activeTrainingPlan.planId
          );
          if (currentIndex > 0) {
            const [activePlan] = slicedPlans.splice(currentIndex, 1);
            slicedPlans.unshift(activePlan);
          } else if (currentIndex === -1) {
            const planDetail = await trainingPlanAPI.getById(
              activeTrainingPlan.planId
            );
            if (planDetail?.data) {
              slicedPlans.unshift(planDetail.data);
            }
          }
        } catch (error) {
          console.error("Error ensuring active plan in recommendations:", error);
        }
      }

      setRecommendedPlans(slicedPlans);
    } catch (error) {
      console.error("Error fetching recommended plans:", error);
      setRecommendedPlans([]);
    } finally {
      setLoadingRecommendation(false);
    }
  }, [userData, activeTrainingPlan?.planId]);

  const calculatePlanProgress = React.useCallback(async (planData = null) => {
    // Tránh gọi nhiều lần đồng thời
    if (calculatingProgressRef.current) {
      console.log("⏸️ Progress calculation already in progress, skipping...");
      return;
    }

    const plan = planData || activeTrainingPlan;
    
    if (!plan || !plan.workoutMap) {
      setActivePlanProgress({
        completed: 0,
        total: plan?.totalWorkouts || 0,
      });
      return;
    }

    calculatingProgressRef.current = true;
    console.log("📊 Calculating plan progress for:", plan.planId);
    console.log("📋 Workout map entries:", plan.workoutMap.length);

    const normalizeId = (id) => {
      if (!id) return "";
      if (typeof id === "string") return id.trim();
      if (id?._id) return id._id.toString().trim();
      return id.toString().trim();
    };

    const normalizedWorkoutMap = plan.workoutMap.map((entry) => ({
      date: entry.date,
      workoutIds: (entry.workoutIds || []).map(normalizeId).filter(Boolean),
    }));

    const totalPlanned =
      plan.totalWorkouts ||
      normalizedWorkoutMap.reduce(
        (sum, entry) => sum + entry.workoutIds.length,
        0
      );

    console.log("📈 Total planned workouts:", totalPlanned);

    if (totalPlanned === 0) {
      setActivePlanProgress({ completed: 0, total: 0 });
      calculatingProgressRef.current = false;
      return;
    }

    setPlanProgressLoading(true);
    try {
      // Tạo một Set để lưu các cặp (date, workoutId) đã hoàn thành
      const completedWorkouts = new Set();
      
      // Fetch schedule details cho tất cả các ngày trong workoutMap
      const scheduleDetailsList = await Promise.all(
        normalizedWorkoutMap.map(async (entry) => {
          if (!entry?.date || !entry?.workoutIds?.length) {
            return { date: entry?.date || "", details: [] };
          }
          try {
            const res = await scheduleAPI.getByDate(entry.date);
            const details = res.data?.details || [];
            console.log(`📅 Date ${entry.date}: ${details.length} schedule details`);
            // Log chi tiết để debug
            if (details.length > 0) {
              details.forEach((d, idx) => {
                console.log(`  Detail[${idx}]: workoutId=${JSON.stringify(d.workoutId)}, status=${d.status}`);
              });
            }
            return { date: entry.date, details };
          } catch (error) {
            if (error.response?.status === 404) {
              return { date: entry.date, details: [] };
            }
            console.error(`Error fetching schedule for ${entry.date}:`, error);
            return { date: entry.date, details: [] };
          }
        })
      );

      // Tạo map để dễ tra cứu
      const detailMap = scheduleDetailsList.reduce((acc, item) => {
        acc[item.date] = item.details;
        return acc;
      }, {});

      // Đếm số workout đã hoàn thành
      // Có 2 cách: 
      // 1. Đếm các workout có trong workoutMap và status = "done" (chính xác hơn nhưng có thể bỏ sót nếu schedule thay đổi)
      // 2. Đếm tất cả workout có status = "done" trong các ngày của kế hoạch (bao quát hơn nhưng có thể đếm cả workout từ kế hoạch khác)
      // Tôi sẽ dùng cách 1 nhưng cải thiện để xử lý trường hợp workoutIds không khớp
      
      normalizedWorkoutMap.forEach((entry) => {
        if (!entry?.date) return;
        
        const details = detailMap[entry.date] || [];
        console.log(`🔍 Checking date ${entry.date}:`);
        console.log(`  📋 Planned workoutIds: [${entry.workoutIds.join(", ")}]`);
        console.log(`  📅 Found ${details.length} schedule details`);
        
        // Cách 1: Đếm các workout có trong workoutMap và status = "done"
        entry.workoutIds.forEach((plannedWorkoutId) => {
          const matchedDetail = details.find((detail) => {
            const detailWorkoutId = normalizeId(detail.workoutId);
            return detailWorkoutId === plannedWorkoutId;
          });
          
          if (matchedDetail && matchedDetail.status === "done") {
            const key = `${entry.date}-${plannedWorkoutId}`;
            if (!completedWorkouts.has(key)) {
              completedWorkouts.add(key);
              console.log(`    ✅ COUNTED (planned): ${plannedWorkoutId} on ${entry.date}`);
            }
          }
        });
        
        // Cách 2: Nếu không tìm thấy workout nào khớp với planned, đếm tất cả workout done trong ngày đó
        // (để xử lý trường hợp schedule đã thay đổi)
        const foundPlannedWorkouts = entry.workoutIds.some((plannedWorkoutId) => {
          return details.some((detail) => {
            const detailWorkoutId = normalizeId(detail.workoutId);
            return detailWorkoutId === plannedWorkoutId;
          });
        });
        
        if (!foundPlannedWorkouts && entry.workoutIds.length > 0) {
          // Không tìm thấy workout nào trong planned, có thể schedule đã thay đổi
          // Đếm tất cả workout done trong ngày này
          details.forEach((detail) => {
            const detailWorkoutId = normalizeId(detail.workoutId);
            if (detail.status === "done") {
              const key = `${entry.date}-${detailWorkoutId}`;
              if (!completedWorkouts.has(key)) {
                completedWorkouts.add(key);
                console.log(`    ✅ COUNTED (fallback): ${detailWorkoutId} on ${entry.date} (schedule changed)`);
              }
            }
          });
        }
      });

      const completed = completedWorkouts.size;
      console.log(`🎯 Progress: ${completed}/${totalPlanned} completed`);

      setActivePlanProgress({
        completed,
        total: totalPlanned,
      });
    } catch (error) {
      console.error("❌ Error calculating plan progress:", error);
      setActivePlanProgress({
        completed: 0,
        total: totalPlanned,
      });
    } finally {
      setPlanProgressLoading(false);
      calculatingProgressRef.current = false;
    }
  }, [activeTrainingPlan]);


  React.useEffect(() => {
    fetchTodayMeals();
    fetchTodaySchedule();
    fetchTrainingLogs();
  }, [fetchTodayMeals, fetchTodaySchedule, fetchTrainingLogs]);

  React.useEffect(() => {
    loadActivePlan();
  }, [loadActivePlan]);

  React.useEffect(() => {
    fetchRecommendedPlan();
  }, [fetchRecommendedPlan]);

  useFocusEffect(
    React.useCallback(() => {
      // Tự động refresh khi màn hình lấy focus
      fetchTodayMeals();
      fetchTodaySchedule();
      fetchTrainingLogs();
      loadActivePlan();
      return undefined;
    }, [
      fetchTodayMeals,
      fetchTodaySchedule,
      fetchTrainingLogs,
      loadActivePlan,
    ])
  );

  // Tính lại tiến độ khi activeTrainingPlan thay đổi (bao gồm khi load từ AsyncStorage)
  React.useEffect(() => {
    if (activeTrainingPlan) {
      // Chờ một chút để đảm bảo các API call khác đã hoàn thành
      const timer = setTimeout(() => {
        if (!calculatingProgressRef.current) {
          calculatePlanProgress(activeTrainingPlan);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setActivePlanProgress({ completed: 0, total: 0 });
      setPlanProgressLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrainingPlan]);

  // Lấy chiều cao và cân nặng từ userData hoặc sử dụng giá trị mặc định
  const fullName = userData?.name || "Người dùng";
  let goalsArray = [];
  if (Array.isArray(userData?.goal)) {
    goalsArray = userData.goal;
  } else if (userData?.goal) {
    if (typeof userData.goal === "string") {
      try {
        const parsed = JSON.parse(userData.goal);
        goalsArray = Array.isArray(parsed) ? parsed : [userData.goal];
      } catch (err) {
        goalsArray = [userData.goal];
      }
    } else {
      goalsArray = [userData.goal];
    }
  }

  const goalNames = goalsArray
    .map((g) => (typeof g === "string" ? g : g?.title || ""))
    .filter(Boolean);

  const programSubtitle = goalNames.length
    ? `${goalNames.slice(0, 2).join(" + ")}${
        goalNames.length > 2 ? ` +${goalNames.length - 2}` : ""
      }`
    : "";

  const height = userData?.height || "170";
  const weight = userData?.weight || "65";
  const heightUnit = userData?.heightUnit || "CM";
  const weightUnit = userData?.weightUnit || "KG";

  // Tính toán chỉ số BMI
  const bmi = calculateBMI(
    parseFloat(weight),
    parseFloat(height),
    weightUnit,
    heightUnit
  );

  // Tính toán dữ liệu cho 7 ngày gần nhất (ngày hiện tại nằm cuối)
  const getWorkoutData = () => {
    const today = new Date();
    const labels = [];
    const dataset = [];

    const formatLabel = (dateObj) => {
      const weekdayMap = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const weekday = weekdayMap[dateObj.getDay()];
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${weekday}`;
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const logsInDay = trainingLogs.filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= startOfDay && logDate <= endOfDay;
      });

      labels.push(formatLabel(date));
      dataset.push(logsInDay.length);
    }

    return {
      labels,
      datasets: [
        {
          data: dataset,
          color: () => "#92A3FD",
          strokeWidth: 2,
        },
      ],
    };
  };

  const workoutData = getWorkoutData();

  const getLevelLabel = (level) => {
    const normalized = typeof level === "string" ? level.toLowerCase().trim() : "";
    const levelMap = {
      beginner: "Mới bắt đầu",
      intermediate: "Trung bình",
      advanced: "Nâng cao",
      basic: "Cơ bản",
      pro: "Chuyên nghiệp",
    };
    return levelMap[normalized] || (level?.toString() ?? "Không rõ cấp độ");
  };

  const getTypeLabel = (type) => {
    const normalized = typeof type === "string" ? type.toLowerCase().trim() : "";
    const typeMap = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng",
      custom: "Tùy chỉnh",
    };
    return typeMap[normalized] || (type?.toString() ?? "Không rõ loại");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng</Text>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userSubtitle}>{programSubtitle}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={24} color="#1D1617" />
          </TouchableOpacity>
        </View>

        {/* BMI Card */}
        <LinearGradient
          colors={["#D0E5FF", "#E8F0FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bmiCard}
        >
          <View style={styles.bmiInfo}>
            <Text style={styles.bmiTitle}>BMI (Body Mass Index)</Text>
            <Text style={styles.bmiSubtitle}>
              Bạn có thể trạng {bmi.category}
            </Text>
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate("User", userData)}
            >
              <Text style={styles.viewMoreText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bmiChart}>
            <View style={styles.bmiValue}>
              <Text style={styles.bmiValueText}>{bmi.value}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Recommended Plan Card - Dành cho bạn */}
        {recommendedPlans.length > 0 && (
          <View style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <View style={styles.recommendedTitleContainer}>
                <View style={styles.recommendedTitleIcon}>
                  <Feather name="star" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.recommendedTitle}>Dành cho bạn</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate("TrainingPlanList")}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <Feather name="chevron-right" size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedScrollContent}
              style={styles.recommendedScrollView}
            >
              {recommendedPlans.map((plan) => {
                const isActivePlan = activeTrainingPlan?.planId === plan._id;
                const totalProgress = activePlanProgress.total || activeTrainingPlan?.totalWorkouts || 0;
                const completedProgress = isActivePlan ? activePlanProgress.completed : 0;
                const progressPercent =
                  isActivePlan && totalProgress > 0
                    ? Math.round((completedProgress / totalProgress) * 100)
                    : 0;

                return (
                  <LinearGradient
                    key={plan._id}
                    colors={
                      isActivePlan
                        ? ["#E8FBF0", "#D1FAE5"]
                        : ["#F0F9FF", "#E0F2FE"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.recommendedCard,
                      isActivePlan && styles.activeRecommendedCard,
                    ]}
                  >
                    <View style={styles.recommendedCardContent}>
                      <View style={styles.recommendedTitleRow}>
                        <LinearGradient
                          colors={["#3B82F6", "#60A5FA"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.recommendedIconContainer}
                        >
                          <Feather name="target" size={18} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.recommendedPlanName} numberOfLines={2}>
                          {plan.name || "Kế hoạch tập luyện"}
                        </Text>
                      </View>

                      {isActivePlan && (
                        <View style={styles.activePlanTag}>
                          <Feather name="check-circle" size={14} color="#22C55E" />
                          <Text style={styles.activePlanTagText}>Đang theo dõi</Text>
                        </View>
                      )}

                      <Text style={styles.recommendedPlanDescription} numberOfLines={3}>
                        {plan.description || "Phù hợp với trình độ và mục tiêu của bạn"}
                      </Text>

                      <View style={styles.recommendedBadges}>
                        {plan.level && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{getLevelLabel(plan.level)}</Text>
                          </View>
                        )}
                        {plan.type && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{getTypeLabel(plan.type)}</Text>
                          </View>
                        )}
                      </View>

                      {isActivePlan && (
                        <View style={styles.planProgressWrapper}>
                          <View style={styles.planProgressHeader}>
                            <Text style={styles.planProgressLabel}>
                              {planProgressLoading ? "Đang cập nhật..." : "Tiến độ"}
                            </Text>
                            <Text style={styles.planProgressValue}>
                              {planProgressLoading
                                ? "--"
                                : `${completedProgress}/${totalProgress}`}
                            </Text>
                          </View>
                          <View style={styles.planProgressBar}>
                            <View style={styles.planProgressGlow} />
                            <LinearGradient
                              colors={["#34D399", "#16A34A", "#15803D"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[
                                styles.planProgressFill,
                                {
                                  width: planProgressLoading
                                    ? "15%"
                                    : `${Math.min(progressPercent, 100)}%`,
                                },
                              ]}
                            >
                              <Feather
                                name="zap"
                                size={12}
                                color="#FFFFFF"
                                style={styles.planProgressZap}
                              />
                            </LinearGradient>
                          </View>
                          {!planProgressLoading && (
                            <Text style={styles.planProgressPercent}>
                              {progressPercent}% hoàn thành
                            </Text>
                          )}
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.recommendedCardButton}
                        onPress={() =>
                          navigation.navigate("TrainingPlanDetail", {
                            plan,
                          })
                        }
                      >
                        <LinearGradient
                          colors={
                            isActivePlan
                              ? ["#16A34A", "#22C55E"]
                              : ["#3B82F6", "#60A5FA"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.recommendedCardButtonGradient}
                        >
                          <Text style={styles.recommendedCardButtonText}>
                            {isActivePlan ? "Tiếp tục kế hoạch" : "Xem chi tiết"}
                          </Text>
                          <Feather
                            name="arrow-right"
                            size={16}
                            color="#FFFFFF"
                            style={{ marginLeft: 6 }}
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Schedule Card */}
        <LinearGradient
          colors={["#EEF6FF", "#F3F5FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scheduleCard}
        >
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleTitleContainer}>
              <View style={styles.scheduleTitleIcon}>
                <Feather name="activity" size={20} color="#92A3FD" />
              </View>
              <Text style={styles.scheduleTitle}>Lịch Tập Hôm Nay</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("Schedule")}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <Feather name="chevron-right" size={14} color="#92A3FD" />
            </TouchableOpacity>
          </View>

          {todaySchedule ? (
            <View style={styles.scheduleContent}>
              <View style={styles.scheduleInfo}>
                <LinearGradient
                  colors={["#92A3FD", "#9DCEFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <Feather name="activity" size={28} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleName}>
                    {todaySchedule.workoutId?.title || "Không có bài tập"}
                  </Text>
                  <Text style={styles.scheduleNote}>
                    {todaySchedule.note || "Chuẩn bị cho buổi tập này"}
                  </Text>
                  <View style={styles.scheduleTimeContainer}>
                    <Text style={styles.scheduleTime}>
                      🕒 {todaySchedule.time || "--:--"}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      todaySchedule.status === "done" ? styles.statusDone : styles.statusPending
                    ]}>
                      <Text style={styles.statusText}>
                        {todaySchedule.status === "done" ? "Hoàn thành" : "Đang chờ"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() =>
                  navigation.navigate("TrainingDetail", {
                    id: todaySchedule.workoutId?._id,
                  })
                }
              >
                <LinearGradient
                  colors={["#92A3FD", "#9DCEFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Bắt đầu ngay</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptySchedule}>
              <View style={styles.emptyIconContainer}>
                <Feather name="calendar" size={32} color="#92A3FD" />
              </View>
              <Text style={styles.emptyText}>Bạn chưa có lịch tập hôm nay</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate("Workout")}
              >
                <Text style={styles.createButtonText}>Thêm lịch mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Meal Card */}
        <LinearGradient
          colors={["#FFF5E8", "#FFE9D6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mealCard}
        >
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleTitleContainer}>
              <View style={styles.mealTitleIcon}>
                <Feather name="coffee" size={20} color="#FF9671" />
              </View>
              <Text style={styles.mealTitle}>Thực đơn hôm nay</Text>
            </View>
            <TouchableOpacity
              style={styles.pillButtonDanger}
              onPress={() => navigation.navigate("Menu")}
            >
              <Text style={styles.pillButtonDangerText}>Chi tiết</Text>
              <Feather name="chevron-right" size={14} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {todayMeals && todayMeals.length > 0 ? (
            <>
              <View style={styles.mealRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4,}}>
                  <Text style={styles.mealCaloriesLeft}>
                    {mealSummary.calories}
                  </Text>
                  <Text style={styles.mealCaloriesTotal}>/ 2500</Text>
                </View>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCaloriesLabel}>Calories</Text>
                  <Text style={styles.mealCaloriesPercent}>
                    {Math.round((mealSummary.calories / 2500) * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <LinearGradient
                  colors={["#7ED7B5", "#4ECDC4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (mealSummary.calories / 2500) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </>
          ) : (
            <View style={styles.emptySchedule}>
              <View style={styles.emptyIconContainerMeal}>
                <Feather name="coffee" size={32} color="#FF9671" />
              </View>
              <Text style={styles.emptyText}>Bạn chưa có thực đơn hôm nay</Text>
              <TouchableOpacity
                style={styles.createButton}
                disabled={loading} // ✅ chặn bấm khi đang loading
                onPress={async () => {
                  if (loading) return;
                  
                  // Log ngày giờ bắt đầu tạo thực đơn
                  const startTime = new Date();
                  const startTimestamp = startTime.toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  });
                  
                  console.log(`📅 [${startTimestamp}] Bắt đầu tạo thực đơn bằng AI...`);
                  
                  setLoading(true);  
                  try {
                    // 1️⃣ Lấy mục tiêu người dùng
                    const response = await userAPI.getProfile();
                    const goal = response.data.goal;
                    // Gửi goals dưới dạng array để backend xử lý
                    const goals = Array.isArray(goal) ? goal : [goal];
                    const type = "daily";
                    console.log(
                      `🤖 [${startTimestamp}] Gọi AI tạo thực đơn với goals:`,
                      goals,
                      "và type:",
                      type
                    );

                    // 2️⃣ Gọi AI tạo thực đơn DAILY
                    const aiRes = await mealScheduleAPI.generateDailyAIPlan({
                      goals: goals,
                      type,
                    });
                    const mealPlanId = aiRes?.data?.data?._id;
                    const meals = aiRes?.data?.data?.meals || [];

                    if (!mealPlanId) {
                      console.warn(
                        "⚠️ Không tìm thấy mealPlanId từ AI response:",
                        JSON.stringify(aiRes.data, null, 2)
                      );
                      setLoading(false);
                      return;
                    }

                    const aiSuccessTime = new Date().toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    console.log(`✅ [${aiSuccessTime}] AI tạo MealPlan thành công:`, mealPlanId);

                    // 3️⃣ Gán meal plan đó cho user (áp dụng vào lịch)
                    await mealScheduleAPI.applyMealPlan({
                      mealPlanId,
                      startDate: todayAI,
                    });

                    // 4️⃣ Lấy lại danh sách thực đơn hôm nay
                    const res = await mealScheduleAPI.getByDate(todayStr);
                    setTodayMeals(res.data);

                    const finishTime = new Date().toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    
                    const duration = Math.round((new Date() - startTime) / 1000);
                    console.log(`🎉 [${finishTime}] Đã áp dụng thực đơn thành công! (Thời gian: ${duration}s)`);
                  } catch (err) {
                    const errorTime = new Date().toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    
                    if (err.response) {
                      console.error(
                        `❌ [${errorTime}] Lỗi tạo thực đơn (response):`,
                        JSON.stringify(err.response.data, null, 2)
                      );
                    } else if (err.request) {
                      console.error(
                        `❌ [${errorTime}] Lỗi tạo thực đơn (request):`,
                        err.request
                      );
                    } else {
                      console.error(
                        `❌ [${errorTime}] Lỗi tạo thực đơn (message):`,
                        err.message
                      );
                    }
                  } finally {
                    setLoading(false);
                    Alert.alert("Thông báo", "Thực đơn đã được tạo thành công cho ngày hôm nay");
                    fetchTodayMeals();
                  }
                }}
              >
                <Text style={styles.createButtonText}>
                  {loading ? "AI đang tạo..." : "Tạo thực đơn ngay"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Progress */}
        <LinearGradient
          colors={["#F8F5FF", "#F0EBFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View style={styles.scheduleTitleContainer}>
              <View style={styles.progressTitleIcon}>
                <Feather name="trending-up" size={20} color="#C58BF2" />
              </View>
              <Text style={styles.progressTitle}>Tiến trình</Text>
            </View>
            <View style={styles.weeklyButton}>
              <Text style={styles.weeklyButtonText}>Weekly</Text>
              <Feather name="chevron-down" size={16} color="#C58BF2" />
            </View>
          </View>

          {/* Workout Progress */}
          <View style={styles.workoutProgressContainer}>
            <Text style={styles.workoutProgressTitle}>Số bài tập đã hoàn thành</Text>

            {/* Workout chart */}
            <View style={styles.workoutChart}>
              <LineChart
                data={workoutData}
                width={320}
                height={180}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: () => "#C58BF2",
                  labelColor: () => "#333333",
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#C58BF2",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
      <ChatBotAI isOpen={isChatBotOpen} onToggle={setIsChatBotOpen} />
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeTab === "home" ? "#92A3FD" : "#ADA4A5"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("workout");
            navigation.navigate("Workout");
          }}
        >
          <Feather
            name="activity"
            size={24}
            color={activeTab === "workout" ? "#92A3FD" : "#ADA4A5"}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, isChatBotOpen ? {} : styles.navButtonRobot]}
          onPress={() => setIsChatBotOpen(!isChatBotOpen)}
        >
          {isChatBotOpen ? (
            <Feather 
              name="x" 
              size={24} 
              color="#FFFFFF" 
            />
          ) : (
            <Bot 
              size={24} 
              color="#92A3FD" 
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("food");
            navigation.navigate("Food");
          }}
        >
          <MaterialCommunityIcons name="food" size={24} color="#ADA4A5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("user");
            navigation.navigate("User", userData);
          }}
        >
          <Feather
            name="user"
            size={24}
            color={activeTab === "user" ? "#92A3FD" : "#ADA4A5"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollViewContent: {
    paddingBottom: 45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    color: "#1D1617",
    marginBottom: 4,
    fontWeight: FONTS.semiBold,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1D1617",
  },
  userSubtitle: {
    marginTop: 4,
    color: "#7B6F72",
    fontWeight: FONTS.medium,
    fontSize: 15,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },

  // BMI Card
  bmiCard: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#92A3FD",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  bmiInfo: {
    flex: 3,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 5,
  },
  bmiSubtitle: {
    fontSize: 12,
    color: "#7B6F72",
    marginBottom: 15,
  },
  viewMoreButton: {
    backgroundColor: "#92A3FD",
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: "flex-start",
  },
  viewMoreText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  bmiChart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bmiValue: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#92A3FD",
    justifyContent: "center",
    alignItems: "center",
  },
  bmiValueText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Recommended Plan Section
  recommendedSection: {
    marginBottom: 20,
  },
  recommendedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  recommendedTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recommendedTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  recommendedScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  recommendedScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  recommendedCard: {
    width: SCREEN_W * 0.85,
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  activeRecommendedCard: {
    borderColor: "rgba(34, 197, 94, 0.4)",
    shadowColor: "#22C55E",
  },
  recommendedCardContent: {
    gap: 10,
  },
  recommendedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recommendedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedPlanName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 4,
  },
  recommendedPlanDescription: {
    fontSize: 13,
    color: "#7B6F72",
    lineHeight: 18,
    marginBottom: 8,
  },
  activePlanTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  activePlanTagText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "600",
  },
  recommendedBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "600",
  },
  planProgressWrapper: {
    marginBottom: 10,
    gap: 6,
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  planProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planProgressLabel: {
    fontSize: 12,
    color: "#7B6F72",
  },
  planProgressValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D1617",
  },
  planProgressBar: {
    height: 14,
    borderRadius: 10,
    backgroundColor: "rgba(22, 163, 74, 0.2)",
    overflow: "hidden",
    position: "relative",
  },
  planProgressGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 10,
  },
  planProgressFill: {
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
  },
  planProgressZap: {
    position: "absolute",
    right: 4,
    top: "50%",
    marginTop: -6,
  },
  planProgressPercent: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },
  recommendedCardButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  recommendedCardButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendedCardButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  scheduleCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(146, 163, 253, 0.2)",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scheduleTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduleTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(146, 163, 253, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  viewAllButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    color: "#92A3FD",
    fontSize: 13,
    fontWeight: "600",
  },
  scheduleContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(146, 163, 253, 0.1)",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scheduleName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1D1617",
    marginBottom: 6,
    lineHeight: 24,
  },
  scheduleNote: {
    fontSize: 14,
    color: "#7B6F72",
    marginBottom: 8,
    lineHeight: 20,
  },
  scheduleTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  scheduleTime: {
    fontSize: 13,
    color: "#7B6F72",
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDone: {
    backgroundColor: "#E8F5E9",
  },
  statusPending: {
    backgroundColor: "#FFF3E0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D1617",
  },
  startButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#92A3FD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  emptySchedule: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(146, 163, 253, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyIconContainerMeal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 150, 113, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    color: "#7B6F72",
    fontSize: 15,
    marginVertical: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#92A3FD",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Meal Card
  mealCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#FF9671",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 150, 113, 0.2)",
  },
  mealTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 150, 113, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  pillButtonDanger: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillButtonDangerText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "600",
  },
  mealRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  mealCaloriesLeft: {
    fontSize: 25,
    fontWeight: "700",
    color: "#1D1617",
    lineHeight: 38,
  },
  mealCaloriesTotal: {
    fontSize: 18,
    fontWeight: "500",
    color: "#7B6F72",
    marginTop: 2,
  },
  mealCaloriesInfo: {
    alignItems: "flex-end",
  },
  mealCaloriesLabel: {
    fontSize: 14,
    color: "#7B6F72",
    fontWeight: "500",
    marginBottom: 4,
  },
  mealCaloriesPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF9671",
  },
  progressBar: {
    height: 12,
    backgroundColor: "rgba(255, 150, 113, 0.15)",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    shadowColor: "#7ED7B5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mealFooter: {
    marginTop: 8,
    fontSize: 12,
    color: "#7B6F72",
  },

  // Today Target
  targetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1617",
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#C58BF2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(197, 139, 242, 0.2)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(197, 139, 242, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },
  checkButton: {
    backgroundColor: "#EEF6FF",
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  checkButtonText: {
    color: "#92A3FD",
    fontSize: 12,
    fontWeight: "600",
  },

  // Heart Rate Card
  heartRateCard: {
    backgroundColor: "#F7F8F8",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  heartRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  heartRateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1617",
  },
  heartRateValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heartRateNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#92A3FD",
  },
  heartRateUnit: {
    fontSize: 14,
    color: "#92A3FD",
    marginLeft: 5,
  },
  heartRateChart: {
    height: 60,
    marginVertical: 10,
    justifyContent: "center",
  },
  chartLine: {
    height: 2,
    backgroundColor: "#92A3FD",
    width: "100%",
    opacity: 0.5,
  },
  timeAgoContainer: {
    alignItems: "flex-end",
  },
  timeAgoText: {
    color: "#C58BF2",
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: "#F7F8F8",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 50,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  waterCard: {
    flex: 1,
    backgroundColor: "#F7F8F8",
    borderRadius: 20,
    padding: 15,
    marginRight: 10,
  },
  sleepCard: {
    flex: 1,
    backgroundColor: "#F7F8F8",
    borderRadius: 20,
    padding: 15,
    marginLeft: 10,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 5,
  },
  waterValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92A3FD",
    marginBottom: 5,
  },
  sleepValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92A3FD",
    marginBottom: 15,
  },
  statSubtitle: {
    fontSize: 10,
    color: "#7B6F72",
    marginBottom: 15,
  },
  waterChart: {
    height: 120,
    justifyContent: "flex-end",
  },
  waterBar: {
    width: 8,
    height: 100,
    backgroundColor: "#92A3FD",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  sleepChart: {
    height: 80,
    justifyContent: "center",
  },
  sleepWave: {
    height: 40,
    backgroundColor: "#F7F8F8",
    borderBottomWidth: 2,
    borderBottomColor: "#92A3FD",
    borderStyle: "solid",
    borderRadius: 20,
  },

  // Calories Card
  caloriesCard: {
    backgroundColor: "#F7F8F8",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  caloriesContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92A3FD",
  },
  caloriesChart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F7F8F8",
    borderWidth: 5,
    borderColor: "#92A3FD",
    justifyContent: "center",
    alignItems: "center",
  },
  caloriesProgress: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#92A3FD",
    opacity: 0.2,
  },

  // Workout Progress
  workoutProgressContainer: {
    marginTop: 8,
  },
  workoutProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  workoutProgressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 12,
  },
  weeklyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 4,
    shadowColor: "#C58BF2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyButtonText: {
    color: "#C58BF2",
    fontSize: 13,
    fontWeight: "600",
  },
  workoutChart: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Latest Workout
  latestWorkoutContainer: {
    marginBottom: 80,
  },
  latestWorkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeMoreText: {
    color: "#ADA4A5",
    fontSize: 14,
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  workoutIconPurple: {
    backgroundColor: "#F8F5FF",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 5,
  },
  workoutDetails: {
    fontSize: 12,
    color: "#7B6F72",
  },
  workoutButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    padding: 10,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#92A3FD",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    shadowColor: "#92A3FD",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navButtonRobot: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#92A3FD",
  },
  bottomSpacing: {
    height: 70,
  },
});
