import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NearbyCourtsScreen({ route, navigation }) {
  const { courts = [], userLocation, usedFallback = false } = route.params || {};
  const [loading] = React.useState(false);

  const renderItem = ({ item, index }) => (
    <SafeAreaView style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.rank, index < 3 && styles.rankTop]}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name || "Sân cầu lông"}</Text>
          {item.address ? <Text style={styles.meta}>📍 {item.address}</Text> : null}
          {item.distance !== undefined && item.distance !== null ? (
            <Text style={styles.meta}>
              🚗 Cách bạn:{" "}
              {Number.isFinite(Number(item.distance))
                ? Number(item.distance).toFixed(1)
                : item.distance}{" "}
              km
            </Text>
          ) : null}
          {item.phone ? <Text style={styles.meta}>📞 {item.phone}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color="#1D1617" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Sân gần bạn</Text>
          {usedFallback ? (
            <Text style={styles.subtitle}>Đang dùng tọa độ mặc định TP.HCM</Text>
          ) : (
            <Text style={styles.subtitle}>Top 5 sân cầu lông đề xuất</Text>
          )}
        </View>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#92A3FD" />
          <Text style={styles.hint}>Đang tải danh sách sân...</Text>
        </View>
      ) : courts.length > 0 ? (
        <FlatList
          data={courts}
          keyExtractor={(item, idx) => item.id || item._id || `${idx}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.hint}>Chưa có dữ liệu sân gần bạn</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1D1617",
  },
  subtitle: {
    fontSize: 13,
    color: "#7B6F72",
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  rankTop: {
    backgroundColor: "#FACC15",
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D1617",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  hint: {
    color: "#7B6F72",
    fontSize: 14,
  },
});

