import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { trainingPlanAPI, aiRecommendationAPI, userAPI } from "../services/api";

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

  const handleApplyPlan = async (plan) => {
    try {
      setApplyingPlanId(plan._id || plan.planId);
      
      // Lấy planId từ plan object
      const planId = plan._id || plan.planId;
      if (!planId) {
        Alert.alert("Lỗi", "Không tìm thấy ID của kế hoạch");
        return;
      }

      // Ngày bắt đầu là hôm nay
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];

      // Áp dụng kế hoạch
      await trainingPlanAPI.applyPlan(planId, startDate, false);

      Alert.alert(
        "Thành công",
        `Đã áp dụng kế hoạch "${plan.name}" thành công!`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowModal(false);
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
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kế hoạch tập luyện</Text>
        <View style={styles.emptySpace} />
      </View>

      {/* AI Recommendation Card - FIXED */}
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
                <ActivityIndicator color="#FFFFFF" size="small" />
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

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-note" size={64} color="#DDD" />
          <Text style={styles.emptyText}>Không có kế hoạch nào phù hợp</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          renderItem={renderPlanCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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

                        <TouchableOpacity
                          style={[
                            styles.modalApplyButton,
                            { backgroundColor: levelColor },
                            applyingPlanId === planId && styles.modalApplyButtonDisabled
                          ]}
                          onPress={() => handleApplyPlan(plan)}
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
    maxHeight: "90%",
    paddingTop: 20,
    display: "flex",
    flexDirection: "column",
    minHeight: 400,
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
    maxHeight: 500,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
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
});

