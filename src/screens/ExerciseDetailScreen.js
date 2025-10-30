import { Feather } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import {
  Dimensions, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
const { width, height } = Dimensions.get("window");

function StepItem({ stepNumber, description, isLast = false }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepNumberContainer}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>
            {stepNumber.toString().padStart(2, "0")}
          </Text>
        </View>
        {!isLast && <View style={styles.stepConnector} />}
      </View>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  );
}

const videoSource =
  "https://res.cloudinary.com/dqkjb3mas/video/upload/v1760533848/videoBadminton/badminton_fqyzut.mp4";

export default function ExerciseDetailScreen({ navigation }) {
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const handleComplete = () => {
    navigation.goBack();
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
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={24} color="#1D1617" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="more-horizontal" size={24} color="#1D1617" />
          </TouchableOpacity>
        </View>

        <View style={styles.videoSection}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else {
                player.play();
              }
            }}
          >
            <VideoView
              style={styles.video}
              player={player}
              resizeMode="contain"
              contentFit="contain"
              shouldPlay
              isLooping
            />
          </TouchableWithoutFeedback>
        </View>

        
        <View style={styles.titleSection}>
          <Text style={styles.exerciseTitle}>
            Cầm vợt đúng cách (Forehand & Backhand Grip)
          </Text>
          <Text style={styles.exerciseSubtitle}>
            Cơ bản | Làm quen với vợt và cầu
          </Text>
        </View>

       
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descriptions</Text>
          <Text style={styles.descriptionText}>
            Cầm vợt chuẩn để đánh cầu chính xác và tránh chấn thương.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.stepsHeader}>
            <Text style={styles.sectionTitle}>Các bước thực hiện</Text>
            <Text style={styles.stepsCount}>4 Steps</Text>
          </View>

          <View style={styles.stepsContainer}>
            <StepItem
              stepNumber={1}
              description="Đặt vợt như bắt tay với người khác (Forehand)."
            />
            <StepItem
              stepNumber={2}
              description="Ngón cái tì nhẹ trên cạnh vợt (Backhand)."
            />
            <StepItem
              stepNumber={3}
              description="Giữ lực vừa phải, không bóp chặt cán."
              isLast={true}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sai lầm thường gặp</Text>
          <Text style={styles.mistakeText}>
            Cầm vợt quá chật -- khó điều khiển có tay.
          </Text>
        </View>

        <View style={styles.bottomSpacing}></View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F8F8",
    justifyContent: "center",
    alignItems: "center",
  },

  videoSection: {
  height: 200,
  borderRadius: 15,
  marginBottom: 20,
  position: "relative",
  overflow: "hidden",
},
video: {
  width: '100%',
  aspectRatio: 16 / 9, // 👈 sửa lại
},
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },

  titleSection: {
    marginBottom: 25,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 5,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: "#7B6F72",
  },

  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D1617",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
  },
  stepsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  stepsCount: {
    fontSize: 14,
    color: "#7B6F72",
  },
  stepsContainer: {
    paddingLeft: 10,
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  stepNumberContainer: {
    alignItems: "center",
    marginRight: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#92A3FD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8F3F1",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  stepConnector: {
    width: 2,
    height: 40,
    backgroundColor: "#E8F3F1",
    marginTop: 5,
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
    paddingTop: 5,
  },

  mistakeText: {
    fontSize: 14,
    color: "#7B6F72",
    lineHeight: 20,
  },

  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
  },
  completeButton: {
    backgroundColor: "#92A3FD",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  bottomSpacing: {
    height: 20,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
