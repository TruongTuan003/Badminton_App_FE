import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { mealScheduleAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS } from "../styles/commonStyles";

export default function MenuDetailScreen({ navigation }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [calendarVisible, setCalendarVisible] = React.useState(false);
  const [meals, setMeals] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const formatDateOnly = (date) => {
    // Format date thành YYYY-MM-DD (local time, không UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  React.useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDateOnly(selectedDate);
        const res = await mealScheduleAPI.getByDate(dateStr);
        setMeals(res.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err.message ||
          "Không thể tải thực đơn!"
        );
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, [selectedDate]);

  // Thay cho currentMeals:
  const currentMeals = meals;

  const handleDeleteMeal = async (mealId) => {
    try {
      await mealScheduleAPI.deleteById(mealId);
      setMeals((prev) => (prev || []).filter((m) => (m._id || m.id) !== mealId));
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xóa món ăn. Vui lòng thử lại.');
    }
  };

  // Tính tổng dinh dưỡng hôm nay
  const nutritionTotal = React.useMemo(() => {
    let calories = 0;
    let proteins = 0;
    let fats = 0;
    let carbs = 0;
    meals.forEach((meal) => {
      const m = meal.mealId || {};
      calories += m.calories ? Number(m.calories) : 0;
      proteins += m.protein ? Number(m.protein) : 0;
      fats += m.fat ? Number(m.fat) : 0;
      carbs += m.carbs ? Number(m.carbs) : 0;
    });
    return { calories, proteins, fats, carbs };
  }, [meals]);

  // Dữ liệu dinh dưỡng hôm nay (thay thế hard code)
  const todayNutrition = {
    calories: {
      label: "Năng lượng",
      value: nutritionTotal.calories,
      unit: "kCal",
      progress: nutritionTotal.calories
        ? Math.min(Math.round((nutritionTotal.calories / 2000) * 100), 100)
        : 0,
      icon: "🔥",
    },
    proteins: {
      label: "Đạm",
      value: nutritionTotal.proteins,
      unit: "g",
      progress: nutritionTotal.proteins
        ? Math.min(Math.round((nutritionTotal.proteins / 100) * 100), 100)
        : 0,
      icon: "🍗",
    },
    fats: {
      label: "Chất béo",
      value: nutritionTotal.fats,
      unit: "g",
      progress: nutritionTotal.fats
        ? Math.min(Math.round((nutritionTotal.fats / 60) * 100), 100)
        : 0,
      icon: "🥚",
    },
    carbs: {
      label: "Tinh bột",
      value: nutritionTotal.carbs,
      unit: "g",
      progress: nutritionTotal.carbs
        ? Math.min(Math.round((nutritionTotal.carbs / 250) * 100), 100)
        : 0,
      icon: "🍚",
    },
  };


  // Render lại meal section cho đúng dữ liệu từ mealSchedule: gồm mealId, meal_type, time...
  const renderMealSection = () => (
    <View style={styles.mealSection}>
      {loading ? (
        <Text>Đang tải...</Text>
      ) : error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : currentMeals.length === 0 ? (
        <Text>Không có món ăn nào cho ngày này</Text>
      ) : (
        currentMeals.map((meal) => (
          <View key={meal._id} style={styles.mealItem}>
            <View style={styles.mealItemLeft}>
              <View style={styles.mealItemIcon}>
                {meal.mealId?.image_url ? (
                  <Image
                    source={{ uri: meal.mealId.image_url }}
                    style={styles.mealItemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.mealItemIconText}>
                    {meal.mealId?.icon || "🍽️"}
                  </Text>
                )}
              </View>
              <View style={styles.mealItemInfo}>
                <Text style={styles.mealItemName}>{meal.mealId?.name}</Text>
                {/* meal_type, time nếu có */}
                <Text style={styles.mealItemTime}>
                  {meal.meal_type
                    ? `${meal.meal_type} ${meal.time ? "- " + meal.time : ""}`
                    : meal.time || ""}
                </Text>
              </View>
            </View>
            <View style={styles.mealItemActions}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Xóa món ăn',
                    'Bạn có chắc muốn xóa món ăn này khỏi thực đơn?',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Xóa', style: 'destructive', onPress: () => handleDeleteMeal(meal._id) },
                    ]
                  );
                }}
              >
                <Feather name="trash-2" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderNutritionSection = () => (
    <View style={styles.nutritionSection}>
      <Text style={styles.nutritionTitle}>Dinh dưỡng hôm nay</Text>

      <View style={styles.nutritionItems}>
        {Object.entries(todayNutrition).map(([key, nutrition]) => (
          <View key={key} style={styles.nutritionItem}>
            <View style={styles.nutritionIcon}>
              <Text style={styles.nutritionIconText}>{nutrition.icon}</Text>
            </View>
            <View style={styles.nutritionInfo}>
              <Text style={styles.nutritionValue}>
                <Text style={{ fontWeight: "bold" }}>{nutrition.label}: </Text>
                {nutrition.value} {nutrition.unit}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${nutrition.progress}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#9DCEFF", "#92A3FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroWrapper}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Thực đơn</Text>
            <Text style={styles.heroSubtitle}>
              Theo dõi dinh dưỡng và bữa ăn hàng ngày của bạn.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setCalendarVisible(true)}>
            <Feather name="calendar" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* Ngày đang chọn với nút chuyển ngày */}
        <View style={styles.dateContainer}>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => {
              const prevDate = new Date(selectedDate);
              prevDate.setDate(prevDate.getDate() - 1);
              setSelectedDate(prevDate);
            }}
          >
            <Feather name="chevron-left" size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.dateText}>
            Ngày: {formatDateOnly(selectedDate)}
          </Text>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => {
              const nextDate = new Date(selectedDate);
              nextDate.setDate(nextDate.getDate() + 1);
              setSelectedDate(nextDate);
            }}
          >
            <Feather name="chevron-right" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderMealSection()}
        {renderNutritionSection()}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("MealPlanSelect")}
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 📅 Modal hiển thị Calendar */}
      <Modal visible={calendarVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Calendar
              current={formatDateOnly(selectedDate)}
              onDayPress={(day) => {
                console.log("📅 Chọn ngày:", day.dateString);
                setSelectedDate(new Date(day.dateString));
                setCalendarVisible(false);
              }}
              markedDates={{
                [formatDateOnly(selectedDate)]: {
                  selected: true,
                  selectedColor: "#92A3FD",
                },
              }}
              theme={{
                todayTextColor: "#92A3FD",
                arrowColor: "#92A3FD",
                textDayFontFamily: "System",
                textMonthFontWeight: "bold",
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
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
    fontSize: 25,
    fontWeight: FONTS.bold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 15,
  },
  dateNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    textAlign: "center",
    fontSize: 15,
    color: "#FFFFFF",
    marginHorizontal: 8,
    fontWeight: FONTS.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Meal sections
  mealSection: {
    marginBottom: 20,
    marginTop: 0, // bỏ toàn bộ marginTop, cho dính sát
  },
  mealHeader: {
    marginBottom: 12,
  },
  mealTypeTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 4,
  },
  mealSummary: {
    fontSize: 14,
    color: COLORS.gray,
  },
  mealItems: {
    gap: 8,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 5,
    marginTop: 10,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  mealItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  mealItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  mealItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  mealItemIconText: {
    fontSize: 24,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 4,
  },
  mealItemTime: {
    fontSize: 12,
    color: COLORS.gray,
  },

  // Nutrition section
  nutritionSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 16,
  },
  nutritionItems: {
    gap: 16,
  },
  nutritionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  nutritionIconText: {
    fontSize: 20,
  },
  nutritionInfo: {
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },

  // No meals
  noMealsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noMealsText: {
    fontSize: 16,
    color: COLORS.gray,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  closeButton: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    textAlign: "center",
    color: COLORS.white,
    fontWeight: FONTS.semiBold,
  },
  bottomSpacing: {
    height: 10,
  },
});
