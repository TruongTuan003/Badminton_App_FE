import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function ExerciseCard({ title, duration, objective, onAddSchedule, onStart }) {
  return (
    <View style={styles.exerciseCard}>
      <Text style={styles.exerciseTitle}>{title}</Text>
      <Text style={styles.exerciseDuration}>Thời lượng: {duration}</Text>
      <Text style={styles.exerciseObjective}>Mục tiêu: {objective}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addScheduleButton} onPress={onAddSchedule}>
          <Text style={styles.addScheduleButtonText}>Thêm lịch trình</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>Bắt đầu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BasicScreen({ navigation }) {
  const handleAddSchedule = (exerciseTitle) => {
    // TODO: Implement add to schedule functionality
    console.log('Add to schedule:', exerciseTitle);
  };

  const handleStartExercise = () => {
    // Navigate to exercise detail screen
    navigation.navigate('ExerciseDetail');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#1D1617" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Nâng cao kỹ năng cầu lông</Text>
            <Text style={styles.subtitle}>CƠ BẢN</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="more-horizontal" size={24} color="#1D1617" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsLabel}>Hướng dẫn:</Text>
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsText}>
              Nếu là người mới hoặc chưa nắm vững kỹ năng cơ bản, bạn nên bắt đầu từ những bài tập đơn giản để cũng có nền tảng.
            </Text>
          </View>
        </View>

        {/* Group 1: Get familiar with racket and shuttlecock */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupTitle}>Nhóm 1: Làm quen với vợt và cầu</Text>
          
          <ExerciseCard
            title="Cầm vợt đúng cách (Forehand & Backhand Grip)"
            duration="5 phút"
            objective="Giúp người mới cảm nhận vợt và học cách cầm chuẩn."
            onAddSchedule={() => handleAddSchedule("Cầm vợt đúng cách")}
            onStart={handleStartExercise}
          />
          
          <ExerciseCard
            title="Cầm cầu đúng cách (Forehand & Backhand Grip)"
            duration="5 phút"
            objective="Giúp người mới cảm nhận vợt và học cách cầm chuẩn."
            onAddSchedule={() => handleAddSchedule("Cầm cầu đúng cách")}
            onStart={handleStartExercise}
          />
        </View>

        {/* Group 2: Basic Movement (Footwork) */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupTitle}>Nhóm 2: Di chuyển cơ bản (Footwork)</Text>
          
          <ExerciseCard
            title="Bước chéo sân (Side Step)"
            duration="5 phút"
            objective="Học di chuyển ngang để đón cầu nhanh."
            onAddSchedule={() => handleAddSchedule("Bước chéo sân")}
            onStart={() => handleStartExercise("Bước chéo sân")}
          />
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
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // ===== Header =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1617',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1617',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ===== Instructions =====
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1617',
    marginBottom: 10,
  },
  instructionsBox: {
    backgroundColor: '#E8F3F1',
    borderRadius: 15,
    padding: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: '#7B6F72',
    lineHeight: 20,
  },

  // ===== Group =====
  groupContainer: {
    marginBottom: 30,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 15,
  },

  // ===== Exercise Card =====
  exerciseCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 8,
  },
  exerciseDuration: {
    fontSize: 14,
    color: '#7B6F72',
    marginBottom: 4,
  },
  exerciseObjective: {
    fontSize: 14,
    color: '#7B6F72',
    marginBottom: 15,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addScheduleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#92A3FD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 0.48,
    alignItems: 'center',
  },
  addScheduleButtonText: {
    color: '#92A3FD',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#92A3FD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 0.48,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== Bottom Spacing =====
  bottomSpacing: {
    height: 100,
  },
});
