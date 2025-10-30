import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { workoutAPI } from "../services/api";

export default function TrainingListScreen({ route, navigation }) {
  const { goal } = route.params;
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await workoutAPI.getAll();
        const filtered = res.data.filter((t) => t.goal === goal);
        setTrainings(filtered);
      } catch (error) {
        console.error("Lỗi lấy danh sách bài tập:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, [goal]);

  if (loading)
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.title}>{goal}</Text>
      </View>

      <FlatList
        data={trainings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View
            style={styles.item}
            onPress={() =>
              navigation.navigate("TrainingDetail", { id: item._id })
            }
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.thumbnail}
              />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.exerciseName}>{item.title}</Text>
              <Text style={styles.exerciseDesc}>
                Thời lượng: {item.duration_minutes} phút
              </Text>
              <Text style={styles.exerciseDesc}>
                Mục tiêu: {item.description}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.scheduleButton}>
                  <Text style={styles.scheduleButtonText}>Thêm lịch trình</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() =>
                    navigation.navigate("TrainingDetail", { id: item._id })
                  }
                >
                  <Text style={styles.startButtonText}>Bắt đầu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1D1617",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  imageContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e9eefe",
    marginRight: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D2A64",
    marginBottom: 3,
  },
  exerciseDesc: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  scheduleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#92A3FD",
    backgroundColor: "#F5F7FF",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginRight: 10,
  },

  scheduleButtonText: {
    color: "#92A3FD",
    fontSize: 14,
    fontWeight: "600",
  },

  startButton: {
    flex: 1,
    backgroundColor: "#9df8c8",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },

  startButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
