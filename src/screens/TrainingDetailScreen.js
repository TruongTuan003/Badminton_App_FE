import { Feather } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { workoutAPI } from "../services/api";

export default function TrainingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);

  const [videoUri, setVideoUri] = useState(null);
  const player = useVideoPlayer(videoUri || "", (player) => {
    player.loop = true;
    if (videoUri) player.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await workoutAPI.getById(id);
        setTraining(res.data);
        setVideoUri(res.data.video_url);
      } catch (err) {
        console.error("Fetch detail error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  const handleComplete = () => {
    navigation.goBack();
  };
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.videoBox}>
          {videoUri ? (
            <VideoView
              style={styles.video}
              player={player}
              resizeMode="contain"
              contentFit="contain"
            />
          ) : (
            <Text>No video available</Text>
          )}
        </View>

        <Text style={styles.subtitle}>{training.title}</Text>
        <Text style={styles.title}>{training.name}</Text>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.text}>{training.description}</Text>

        <View style={styles.stepsHeader}>
          <Text style={styles.stepsTitle}>Các bước thực hiện</Text>
          <Text style={styles.stepsCount}>{training.step?.length} Steps</Text>
        </View>

        {training.step?.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>
                {String(i + 1).padStart(2, "0")}
              </Text>

              {i !== training.step.length - 1 && (
                <View style={styles.stepLine} />
              )}
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 15 },
  header: { marginTop: 10, marginBottom: 10 },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  videoBox: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },
  video: { width: "100%", height: "100%" },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  subtitle: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 6,
  },
  text: { fontSize: 14, lineHeight: 20, color: "#555" },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
  },

  completeButton: {
    backgroundColor: "#92A3FD",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#9DCEFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  stepNumberContainer: {
    alignItems: "center",
    marginRight: 10,
  },
  stepNumber: {
    color: "#A78BFA",
    fontWeight: "700",
  },
  stepLine: {
    width: 1,
    height: 30,
    backgroundColor: "#E5D4FF",
    borderStyle: "dotted",
    marginTop: 2,
  },
  stepContent: {
    backgroundColor: "#F8F5FF",
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  stepsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 15,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1617",
  },
  stepsCount: {
    fontSize: 12,
    color: "#ADA4A5",
    fontWeight: "500",
  },
});
