import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function WorkoutCard({ title, time, active, setActive, color }) {
  return (
    <TouchableOpacity style={styles.workoutCard} activeOpacity={0.8}>
      <View style={styles.workoutIcon}>
        <View style={[styles.iconCircle, { backgroundColor: color }]} />
      </View>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutName}>{title}</Text>
        <Text style={styles.workoutTime}>{time}</Text>
      </View>
      <Switch
        value={active}
        onValueChange={setActive}
        trackColor={{ false: "#DDDADA", true: "#92A3FD" }}
        thumbColor="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

export default function WorkoutScreen({ navigation }) {
  const [fullbodyActive, setFullbodyActive] = React.useState(true);
  const [upperbodyActive, setUpperbodyActive] = React.useState(false);
  const handlePress = (goal) => {
    navigation.navigate("TrainingList", { goal });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#1D1617" />
          </TouchableOpacity>
          <Text style={styles.title}>Bài Tập</Text>
          <TouchableOpacity style={styles.circleButton}>
            <Feather name="more-horizontal" size={24} color="#1D1617" />
          </TouchableOpacity>
        </View>

        {/* Daily Schedule */}
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleTitle}>Lịch tập hằng ngày</Text>
          <TouchableOpacity style={styles.checkButton}>
            <Text style={styles.checkButtonText}>Xem lịch</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bài tập sắp tới</Text>
            <TouchableOpacity>
              <Text style={styles.seeMoreText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>

          <WorkoutCard
            title="Toàn thân"
            time="Hôm nay, 03:00pm"
            active={fullbodyActive}
            setActive={setFullbodyActive}
            color="#E8F3F1"
          />
          <WorkoutCard
            title="Thân trên"
            time="05/06, 02:00pm"
            active={upperbodyActive}
            setActive={setUpperbodyActive}
            color="#F7E8F1"
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bạn muốn tập gì?</Text>

          {/* Badminton Skills Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handlePress("Nâng cao kỹ năng cầu lông")}
          >
            <Text style={styles.categoryTitle}>Nâng cao kỹ năng cầu lông</Text>
            <Text style={styles.categoryDescription}>
              Các bài tập giúp cải thiện kỹ thuật, từ cơ bản đến nâng cao.
            </Text>
            <Text style={styles.seeMoreButton}>Xem thêm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handlePress("Cải thiện thể chất")}
          >
            <Text style={styles.categoryTitle}>Cải thiện thể chất</Text>
            <Text style={styles.categoryDescription}>
              Tăng sức bền, tốc độ và sự linh hoạt cho mọi trận đấu.
            </Text>
            <Text style={styles.seeMoreButton}>Xem thêm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handlePress("Quản lý hình thể và sức khỏe")}
          >
            <Text style={styles.categoryTitle}>
              Quản lý hình thể và sức khỏe
            </Text>
            <Text style={styles.categoryDescription}>
              Giảm mỡ, duy trì vóc dáng và kết hợp chế độ dinh dưỡng.
            </Text>
            <Text style={styles.seeMoreButton}>Xem thêm</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomSpacing}></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ===== Container & Layout =====
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // ===== Header =====
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
  },

  // ===== Schedule Card =====
  scheduleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F3F1",
    borderRadius: 22,
    padding: 20,
    marginBottom: 30,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1617",
  },
  checkButton: {
    backgroundColor: "#92A3FD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // ===== Section =====
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
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
  seeMoreText: {
    fontSize: 14,
    color: "#92A3FD",
    fontWeight: "500",
  },

  // ===== Workout Card =====
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutIcon: {
    marginRight: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 14,
    color: "#7B6F72",
  },

  // ===== Category Card =====
  categoryCard: {
    backgroundColor: "#d5dbfdff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
    marginBottom: 12,
  },
  seeMoreButton: {
    fontSize: 14,
    fontWeight: "500",
    color: "#92A3FD",
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  // ===== Bottom Spacing =====
  bottomSpacing: {
    height: 100,
  },
});
