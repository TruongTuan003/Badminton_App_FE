import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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

  const handleSelectPlan = async (plan) => {
    try {
      await mealScheduleAPI.applyMealPlan({
        mealPlanId: plan._id,
        startDate: new Date().toISOString().split("T")[0],
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
            <Text style={styles.planTitle}>{item.name}</Text>
            <Text style={styles.planDesc}>
              {item.description || "Không có mô tả"}
            </Text>
            <Text style={styles.planType}>
              {item.type === "daily"
                ? "Hôm nay"
                : item.type === "weekly"
                ? "7 ngày"
                : "30 ngày"}
            </Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn thực đơn</Text>
      </View>

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
      <Modal visible={!!selectedPlan} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPlan?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPlan(null)}>
                <Ionicons name="close" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    marginLeft: 10,
    color: COLORS.black,
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
    backgroundColor: COLORS.white,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabIndicator: {
    backgroundColor: COLORS.primary,
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    textTransform: "capitalize",
  },
  planCard: {
    backgroundColor: COLORS.inputBackground,
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 20,
    marginVertical: 6,
    ...SHADOWS.small,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  planDesc: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  planType: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  modalDescription: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 10,
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
