import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mealScheduleAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS } from "../styles/commonStyles";

export default function MenuDetailScreen({ navigation }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [selectedDateIndex, setSelectedDateIndex] = React.useState(3);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [meals, setMeals] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const dd = String(selectedDate.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
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

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function clampDay(year, month, day) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.max(1, Math.min(day, lastDay));
  }

  function getWeekDays(centerDate) {
    const year = centerDate.getFullYear();
    const month = centerDate.getMonth();
    // tạo dải 7 ngày xung quanh ngày đang chọn (-3..+3), giữ trong tháng
    const startDay = clampDay(year, month, centerDate.getDate() - 3);
    const daysArr = [];
    for (let i = 0; i < 7; i++) {
      const d = clampDay(year, month, startDay + i);
      const dateObj = new Date(year, month, d);
      const dow = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      daysArr.push({ label: dow, date: String(d), dateObj });
    }
    return daysArr;
  }

  const days = getWeekDays(selectedDate);

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

  function changeMonth(delta) {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
    const midDay = clampDay(y, m, 15);
    const newDate = new Date(y, m, midDay);
    setSelectedDate(newDate);
    setSelectedDateIndex(3);
  }

  function openPicker() {
    setPickerVisible(true);
  }

  function onPickMonthYear(m, y) {
    setCurrentMonth(m);
    setCurrentYear(y);
    const midDay = clampDay(y, m, 15);
    const newDate = new Date(y, m, midDay);
    setSelectedDate(newDate);
    setSelectedDateIndex(3);
    setPickerVisible(false);
  }

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thực đơn</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-vertical" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.monthRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Feather name="chevron-left" size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openPicker}>
            <Text
              style={styles.monthText}
            >{`${monthNames[currentMonth]} ${currentYear}`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Feather name="chevron-right" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {days.map((d, idx) => {
            const active = idx === selectedDateIndex;
            return (
              <TouchableOpacity
                key={`${idx}-${d.dateObj.toISOString().split("T")[0]}`}
                style={[styles.dayPill, active && styles.dayPillActive]}
                onPress={() => {
                  setSelectedDateIndex(idx);
                  setSelectedDate(d.dateObj);
                }}
              >
                <Text
                  style={[
                    styles.dayPillLabel,
                    active && styles.dayPillLabelActive,
                  ]}
                >
                  {d.label}
                </Text>
                <Text
                  style={[
                    styles.dayPillDate,
                    active && styles.dayPillDateActive,
                  ]}
                >
                  {d.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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

      {/* Month/Year Picker Modal */}
      <Modal
        transparent
        visible={pickerVisible}
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn tháng/năm</Text>
            <View style={styles.pickerRow}>
              <FlatList
                data={monthNames.map((n, i) => ({ name: n, value: i }))}
                keyExtractor={(item) => String(item.value)}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      item.value === currentMonth && styles.pickerItemActive,
                    ]}
                    onPress={() => setCurrentMonth(item.value)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        item.value === currentMonth &&
                          styles.pickerItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <FlatList
                data={Array.from({ length: 11 }, (_, i) => 2020 + i)}
                keyExtractor={(item) => String(item)}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      item === currentYear && styles.pickerItemActive,
                    ]}
                    onPress={() => setCurrentYear(item)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        item === currentYear && styles.pickerItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonGhost}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.modalButtonGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => onPickMonthYear(currentMonth, currentYear)}
              >
                <Text style={styles.modalButtonText}>Xong</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  monthRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  monthText: {
    marginHorizontal: 10,
    color: COLORS.gray,
  },
  daysRow: {
    paddingHorizontal: 10,
    paddingVertical: 4, // tăng lên chút theo ScheduleScreen thay vì 2
  },
  dayPill: {
    width: 70,
    height: 84,
    borderRadius: 16,
    backgroundColor: COLORS.inputBackground,
    marginHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: COLORS.primary,
  },
  dayPillLabel: {
    color: COLORS.gray,
    marginBottom: 2,
  },
  dayPillLabelActive: {
    color: COLORS.white,
  },
  dayPillDate: {
    color: COLORS.black,
    fontWeight: FONTS.semiBold,
    fontSize: 18,
  },
  dayPillDateActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0, // Để meal dính sát body dưới chọn ngày
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 10,
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerList: {
    height: 220,
    width: "48%",
  },
  pickerItem: {
    paddingVertical: 2,
    alignItems: "center",
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: "#EEF6FF",
  },
  pickerItemText: {
    color: COLORS.black,
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.bold,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: FONTS.semiBold,
  },
  modalButtonGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalButtonGhostText: {
    color: COLORS.gray,
    fontWeight: FONTS.semiBold,
  },
  bottomSpacing: {
    height: 10,
  },
});
