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
import { mealScheduleAPI, scheduleAPI, trainingLogAPI, userAPI } from "../services/api";
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

  React.useEffect(() => {
    fetchTodayMeals();
    fetchTodaySchedule();
    fetchTrainingLogs();
  }, [fetchTodayMeals, fetchTodaySchedule, fetchTrainingLogs]);

  useFocusEffect(
    React.useCallback(() => {
      // Tự động refresh khi màn hình lấy focus
      fetchTodayMeals();
      fetchTodaySchedule();
      fetchTrainingLogs();
      return undefined;
    }, [fetchTodayMeals, fetchTodaySchedule, fetchTrainingLogs])
  );

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

  // Tính toán dữ liệu cho biểu đồ từ TrainingLog
  const getWorkoutData = () => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const data = [0, 0, 0, 0, 0, 0, 0]; // Khởi tạo mảng 7 ngày

    // Lấy 7 ngày gần nhất (từ 6 ngày trước đến hôm nay)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Đặt thời gian về 0:00:00 để so sánh chính xác
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

      // Đếm số training logs trong ngày này
      const logsInDay = trainingLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startOfDay && logDate <= endOfDay;
      });

      // Lưu số lượng vào mảng (index 0 = 6 ngày trước, index 6 = hôm nay)
      data[6 - i] = logsInDay.length;
    }

    return {
      labels: dayNames,
      datasets: [
        {
          data: data,
          color: () => "#92A3FD",
          strokeWidth: 2,
        },
      ],
    };
  };

  const workoutData = getWorkoutData();

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
