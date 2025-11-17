import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { trainingPlanAPI } from "../services/api";

export default function TrainingPlanListScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all, daily, weekly, monthly
  const [filterLevel, setFilterLevel] = useState("all"); // all, Cơ bản, Trung bình, Nâng cao

  useEffect(() => {
    fetchPlans();
  }, []);

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
});

