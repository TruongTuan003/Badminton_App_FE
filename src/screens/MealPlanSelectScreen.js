import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { mealScheduleAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS } from "../styles/commonStyles";

const { width } = Dimensions.get("window");

export default function MealPlanSelectScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mealPlans, setMealPlans] = useState({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Tab state
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "daily", title: "Hàng ngày" },
    { key: "weekly", title: "Theo tuần" },
    { key: "monthly", title: "Theo tháng" },
  ]);

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const res = await mealScheduleAPI.getAllMealPlans();
        const plans = res.data || [];

        const grouped = {
          daily: plans.filter((p) => p.type === "daily"),
          weekly: plans.filter((p) => p.type === "weekly"),
          monthly: plans.filter((p) => p.type === "monthly"),
        };

        setMealPlans(grouped);
      } catch (err) {
        setError("Không thể tải danh sách thực đơn!");
      } finally {
        setLoading(false);
      }
    };
    fetchMealPlans();
  }, []);

  const planMeta = useMemo(
    () => ({
      daily: {
        label: "Hằng ngày",
        accent: "#FFC75F",
        duration: "Trong ngày",
      },
      weekly: {
        label: "Theo tuần",
        accent: "#FF9671",
        duration: "7 ngày",
      },
      monthly: {
        label: "Theo tháng",
        accent: "#A259FF",
        duration: "30 ngày",
      },
    }),
    []
  );

  const handleSelectPlan = async (plan) => {
    try {
      const isoDate = selectedDate.toISOString().split("T")[0];
      await mealScheduleAPI.applyMealPlan({
        mealPlanId: plan._id,
        startDate: isoDate,
      });
      alert("Đã áp dụng thực đơn thành công!");
      navigation.goBack();
    } catch (err) {
      alert("Lỗi khi áp dụng thực đơn!");
    }
  };

  // Render từng loại thực đơn
  const renderPlanList = (plans) => {
    if (plans.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có thực đơn nào</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={plans}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => {
              setSelectedPlan(item);
              setShowModal(true);
            }}
          >
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{item.name}</Text>
                <Text style={styles.planDesc} numberOfLines={2}>
                  {item.description || "Bản kế hoạch cân bằng dinh dưỡng"}
                </Text>
              </View>
              <View
                style={[
                  styles.planBadge,
                  { backgroundColor: (planMeta[item.type]?.accent) || COLORS.primary },
                ]}
              >
                <Text style={styles.planBadgeText}>
                  {planMeta[item.type]?.label || "Tùy chỉnh"}
                </Text>
              </View>
            </View>

            <View style={styles.planStatsRow}>
              <View style={styles.planStat}>
                <Text style={styles.planStatLabel}>Số bữa</Text>
                <Text style={styles.planStatValue}>
                  {item.meals?.length || 0}
                </Text>
              </View>
              <View style={styles.planDivider} />
              <View style={styles.planStat}>
                <Text style={styles.planStatLabel}>Thời gian</Text>
                <Text style={styles.planStatValue}>
                  {planMeta[item.type]?.duration || "--"}
                </Text>
              </View>
            </View>

            <View style={styles.planFooter}>
              <Text style={styles.planFooterText}>Chạm để xem chi tiết</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // Scene cho từng tab
  const DailyScene = () => renderPlanList(mealPlans.daily);
  const WeeklyScene = () => renderPlanList(mealPlans.weekly);
  const MonthlyScene = () => renderPlanList(mealPlans.monthly);

  const renderScene = SceneMap({
    daily: DailyScene,
    weekly: WeeklyScene,
    monthly: MonthlyScene,
  });

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.heroTitle}>Chọn thực đơn</Text>
            <Text style={styles.heroSubtitle}>
              Cá nhân hóa chế độ ăn phù hợp với mục tiêu sức khỏe của bạn.
            </Text>
          </View>
          <Ionicons name="restaurant" size={28} color="#FFF" />
        </View>
      </LinearGradient>

      <View style={styles.contentCard}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width }}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                indicatorStyle={styles.tabIndicator}
                style={styles.tabBar}
                labelStyle={styles.tabLabel}
                activeColor={COLORS.primary}
                inactiveColor={COLORS.gray}
              />
            )}
          />
        )}
      </View>
      <Modal visible={!!selectedPlan} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <DateTimePickerModal
              isVisible={showPicker}
              mode="date"
              onConfirm={(date) => {
                setSelectedDate(date);
                setShowPicker(false);
              }}
              onCancel={() => setShowPicker(false)}
            />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPlan?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPlan(null)}>
                <Ionicons name="close" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            {selectedPlan?.description && (
              <View style={styles.modalDescriptionContainer}>
                <Text style={styles.modalDescription}>{selectedPlan.description}</Text>
              </View>
            )}

            {selectedPlan?.type === "weekly" ? (
              (() => {
                const groupedMeals = selectedPlan.meals.reduce((acc, item) => {
                  const day = item.dayOfWeek || "Thứ 2"; // mặc định Thứ 2 nếu không có
                  if (!acc[day]) acc[day] = [];
                  acc[day].push(item);
                  return acc;
                }, {});
                const dayOrder = [
                  "Thứ 2",
                  "Thứ 3",
                  "Thứ 4",
                  "Thứ 5",
                  "Thứ 6",
                  "Thứ 7",
                  "Chủ nhật",
                ];
                return (
                  <ScrollView style={{ maxHeight: 450 }}>
                    {Object.keys(groupedMeals).map((day) => (
                      <View key={day} style={{ marginBottom: 16 }}>
                        <Text style={styles.dayTitle}>{day}</Text>
                        {groupedMeals[day].map((item, idx) => (
                          <View key={idx} style={styles.mealItem}>
                            {item.mealId?.image_url ? (
                              <Image
                                source={{ uri: item.mealId.image_url }}
                                style={styles.mealImage}
                              />
                            ) : (
                              <View style={styles.mealImagePlaceholder} />
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.mealName}>
                                {item.mealId?.name}
                              </Text>
                              <Text style={styles.mealInfo}>
                                {item.mealId?.calories} kcal •{" "}
                                {item.mealId?.protein}g protein
                              </Text>
                              <Text style={styles.mealTypeText}>
                                🍽 {item.mealId?.mealType}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                );
              })()
            ) : (
              <ScrollView style={{ maxHeight: 450 }}>
                {selectedPlan?.meals.map((item, idx) => (
                  <View key={idx} style={styles.mealItem}>
                    {item.mealId?.image_url ? (
                      <Image
                        source={{ uri: item.mealId.image_url }}
                        style={styles.mealImage}
                      />
                    ) : (
                      <View style={styles.mealImagePlaceholder} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealName}>{item.mealId?.name}</Text>
                      <Text style={styles.mealInfo}>
                        {item.mealId?.calories} kcal • {item.mealId?.protein}g
                        protein
                      </Text>
                      <Text style={styles.mealTypeText}>
                        🍽 {item.mealId?.mealType}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            {/* Chọn ngày bắt đầu */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.datePickerText}>
                Ngày bắt đầu: {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => handleSelectPlan(selectedPlan)}
            >
              <Text style={styles.applyButtonText}>Áp dụng thực đơn</Text>
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
    backgroundColor: "#F6F8FB",
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: FONTS.bold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    marginBottom: 10,
  },
  contentCard: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F6F8FB",
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 15,
  },
  tabBar: {
    backgroundColor: "transparent",
    elevation: 0,
    marginHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
  },
  tabIndicator: {
    backgroundColor: COLORS.white,
    height: "90%",
    marginVertical: 4,
    borderRadius: 24,
    ...SHADOWS.small,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: FONTS.semiBold,
    textTransform: "none",
    color: COLORS.gray,
  },
  planCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 20,
    marginHorizontal: 22,
    marginVertical: 8,
    ...SHADOWS.small,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  planDesc: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 6,
  },
  planBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planBadgeText: {
    color: COLORS.white,
    fontWeight: FONTS.semiBold,
    fontSize: 12,
  },
  planStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  planStat: {
    flex: 1,
    alignItems: "center",
  },
  planStatLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
  },
  planStatValue: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  planDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  planFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planFooterText: {
    color: COLORS.primary,
    fontWeight: FONTS.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  datePickerText: {
    textAlign: "center",
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: FONTS.semiBold,
  },
  modalDescriptionContainer: {
    backgroundColor: COLORS.inputBackground,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.black,
    textAlign: "left",
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginVertical: 8,
  },
  mealItem: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBackground,
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: "center",
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  mealName: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
  },
  mealInfo: {
    fontSize: 12,
    color: COLORS.gray,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: FONTS.bold,
  },

  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  mealImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#E0E0E0",
  },
  mealTypeText: {
    fontSize: 15,
    color: COLORS.primary,
    marginTop: 2,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.primary,
    marginBottom: 8,
  },
});
