import { Feather } from "@expo/vector-icons";
import { useEvent } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleAPI, trainingLogAPI, workoutAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS } from "../styles/commonStyles";

export default function TrainingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    setFeedbackVisible(true);
  };

  const handleCancelFeedback = () => {
    setFeedbackVisible(false);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeeling) return;
    try {
      setSubmitting(true);
      
      // Tạo training log
      await trainingLogAPI.createLog({
        workoutId: id,
        feeling: selectedFeeling,
        note,
      });
      
      // Cập nhật status của ScheduleDetail thành "done"
      try {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        await scheduleAPI.updateDetailStatusByWorkout(id, "done", dateString);
        console.log("✅ Updated schedule detail status to 'done'");
      } catch (scheduleError) {
        console.warn("⚠️ Could not update schedule detail status:", scheduleError);
        // Không throw error, vì training log đã được tạo thành công
      }
      
      setFeedbackVisible(false);
      navigation.goBack();
    } catch (e) {
      console.error("❌ Error submitting feedback:", e);
      setFeedbackVisible(false);
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };
  const infoItems = [
    {
      label: "Thời lượng",
      value: training.duration_minutes
        ? `${training.duration_minutes} phút`
        : training.duration || "Không rõ",
      icon: "clock",
    },
    {
      label: "Cấp độ",
      value: training.level || "Không rõ",
      icon: "trending-up",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#E3F0FF", "#D4E4FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroWrapper}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={COLORS.primary || "#92A3FD"} />
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{training.title}</Text>
          </View>
        </View>

      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoCard}>
          {videoUri ? (
            <VideoView
              style={styles.video}
              player={player}
              resizeMode="contain"
              contentFit="contain"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Feather name="play" size={28} color="#92A3FD" />
              <Text style={styles.videoPlaceholderText}>Video đang cập nhật</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Giới thiệu</Text>
          <Text style={styles.sectionText}>
            {training.description ||
              "Bài tập giúp bạn cải thiện thể lực và sự linh hoạt, phù hợp cho mọi trình độ."}
          </Text>
        </View>
              
        <View style={styles.heroStats}>
          {infoItems.map((item, idx) => (
            <View key={idx} style={styles.statCard}>
              <Feather name={item.icon} size={14} color="#92A3FD" />
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Các bước thực hiện</Text>
          <Text style={styles.sectionMeta}>{training.step?.length || 0} bước</Text>
        </View>

        <View style={styles.stepsList}>
          {training.step?.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepDescription}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleComplete} style={styles.completeButton}>
          <LinearGradient
            colors={["#92A3FD", "#9DCEFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeButtonGradient}
          >
            <Feather name="check-circle" size={18} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Hoàn thành buổi tập</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      {/* Feedback Modal */}
      <Modal transparent visible={feedbackVisible} animationType="fade" onRequestClose={handleCancelFeedback}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cảm nhận sau buổi tập</Text>
            <Text style={styles.modalLabel}>Bạn cảm thấy thế nào?</Text>
            <View style={styles.feelingsRow}>
              {[
                { key: "Tốt", label: "Tốt" },
                { key: "Bình thường", label: "Bình thường" },
                { key: "Mệt", label: "Mệt" },
              ].map((item) => {
                const active = selectedFeeling === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.feelingPill, active && styles.feelingPillActive]}
                    onPress={() => setSelectedFeeling(item.key)}
                  >
                    <Text style={[styles.feelingPillText, active && styles.feelingPillTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Viết vài dòng cảm nhận..."
              placeholderTextColor="#7B6F72"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonGhost} onPress={handleCancelFeedback}>
                <Text style={styles.modalButtonGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, (!selectedFeeling || submitting) && { opacity: 0.6 }]}
                onPress={handleSubmitFeedback}
                disabled={!selectedFeeling || submitting}
              >
                <Text style={styles.modalButtonText}>{submitting ? 'Đang lưu...' : 'Lưu'}</Text>
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
    backgroundColor: "#F6F8FB",
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 10,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: "#1D1617",
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    justifyContent: "center",
    marginBottom: 10,
  },
  statCard: {
    flex: 0,
    minWidth: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
    ...SHADOWS.medium,
  },
  statLabel: {
    fontSize: 15,
    color: "#7B6F72",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D1617",
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  videoCard: {
    height: 230,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FF",
  },
  videoPlaceholderText: {
    marginTop: 8,
    color: "#7B6F72",
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: "#1D1617",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7B6F72",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sectionMeta: {
    fontSize: 13,
    color: "#ADA4A5",
    fontWeight: "600",
  },
  stepsList: {
    gap: 12,
    marginBottom: 20,
  },
  stepCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    ...SHADOWS.small,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#92A3FD",
    fontWeight: "700",
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    color: "#4D4C4D",
    lineHeight: 20,
  },
  completeButton: {
    borderRadius: 20,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  completeButtonGradient: {
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1D1617",
    textAlign: "center",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1617",
    marginBottom: 8,
  },
  feelingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  feelingPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#F7F8F8",
    borderWidth: 1,
    borderColor: "#E1E5E9",
    alignItems: "center",
  },
  feelingPillActive: {
    backgroundColor: "#92A3FD",
    borderColor: "#92A3FD",
  },
  feelingPillText: {
    color: "#1D1617",
    fontWeight: "600",
  },
  feelingPillTextActive: {
    color: "#FFFFFF",
  },
  noteInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E1E5E9",
    backgroundColor: "#F7F8F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#1D1617",
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#92A3FD",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalButtonGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E5E9",
    backgroundColor: "#F7F8F8",
    alignItems: "center",
  },
  modalButtonGhostText: {
    color: "#1D1617",
    fontWeight: "600",
  },
});
