import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../services/api';

const { width } = Dimensions.get('window');

const experienceOptions = [
  { id: 1, label: 'Chưa từng chơi', value: 'beginner' },
  { id: 2, label: 'Dưới 6 tháng', value: 'under_6_months' },
  { id: 3, label: '6 - 12 tháng', value: '6_12_months' },
  { id: 4, label: '1 - 2 năm', value: '1_2_years' },
  { id: 5, label: 'Trên 2 năm', value: 'over_2_years' },
];

const levelOptions = [
  { id: 1, label: 'Người mới bắt đầu', value: 'beginner', description: 'Chưa có kinh nghiệm hoặc mới bắt đầu' },
  { id: 2, label: 'Trung bình', value: 'intermediate', description: 'Đã có một số kỹ năng cơ bản' },
  { id: 3, label: 'Nâng cao', value: 'advanced', description: 'Có kỹ năng tốt và muốn cải thiện thêm' },
];

const preferenceOptions = [
  { id: 1, label: 'Đánh đơn', value: 'singles', description: 'Thích tập luyện một mình' },
  { id: 2, label: 'Đánh đôi', value: 'doubles', description: 'Thích tập luyện cùng bạn' },
  { id: 3, label: 'Cả hai', value: 'both', description: 'Thích cả đánh đơn và đánh đôi' },
];

export default function BadmintonSurveyScreen({ navigation, route }) {
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedPreference, setSelectedPreference] = useState(null);

  // Kiểm tra xem level option có được phép chọn hay không
  const isLevelOptionDisabled = (levelOption) => {
    if (!selectedExperience) return false;
    
    // Nếu chọn "Chưa từng chơi" → chỉ cho chọn "Người mới bắt đầu"
    if (selectedExperience.value === 'beginner') {
      return levelOption.value !== 'beginner';
    }
    
    // Nếu chọn "Dưới 6 tháng" → không cho chọn "Nâng cao"
    if (selectedExperience.value === 'under_6_months') {
      return levelOption.value === 'advanced';
    }
    
    return false;
  };

  // Xử lý khi chọn experience
  const handleExperienceSelect = (experience) => {
    setSelectedExperience(experience);
    
    // Nếu level hiện tại không còn hợp lệ, reset nó
    if (selectedLevel) {
      if (experience.value === 'beginner' && selectedLevel.value !== 'beginner') {
        setSelectedLevel(null);
      } else if (experience.value === 'under_6_months' && selectedLevel.value === 'advanced') {
        setSelectedLevel(null);
      }
    }
  };

  const handleConfirm = async () => {
    if (!selectedExperience || !selectedLevel || !selectedPreference) {
      Alert.alert('Thông báo', 'Vui lòng trả lời đầy đủ các câu hỏi');
      return;
    }

    try {
      const profileData = route.params?.profileData;
      
      if (!profileData) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      const userId = profileData.id || profileData.userId;
      if (!userId) {
        throw new Error('Không tìm thấy ID người dùng');
      }
      
      const updateData = {
        userId: userId,
        badmintonExperience: selectedExperience.value,
        badmintonLevel: selectedLevel.value,
        trainingPreference: selectedPreference.value,
      };
      
      const response = await userAPI.updateProfile(updateData);
      
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }
      
      const completeData = {
        ...profileData,
        ...response.data.user,
        badmintonExperience: selectedExperience.value,
        badmintonLevel: selectedLevel.value,
        trainingPreference: selectedPreference.value,
      };
      
      console.log('Complete Profile Data with Survey:', completeData);
      
      navigation.navigate('Auth', { userData: completeData });
    } catch (error) {
      console.error('Update survey error:', error.response?.data || error.message);
      Alert.alert(
        'Lỗi', 
        error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin khảo sát. Vui lòng thử lại sau.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Khảo sát về bạn</Text>
          <Text style={styles.subtitle}>
            Giúp chúng tôi hiểu rõ hơn về trình độ của bạn để đề xuất lộ trình phù hợp nhất
          </Text>
        </View>

        {/* Question 1: Experience */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Bạn chơi cầu lông được bao lâu?</Text>
          <View style={styles.optionsContainer}>
            {experienceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedExperience?.id === option.id && styles.optionButtonActive
                ]}
                onPress={() => handleExperienceSelect(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedExperience?.id === option.id && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 2: Level */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Bạn muốn bắt đầu từ level nào?</Text>
          <View style={styles.optionsContainer}>
            {levelOptions.map((option) => {
              const isDisabled = isLevelOptionDisabled(option);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.levelOptionButton,
                    selectedLevel?.id === option.id && styles.levelOptionButtonActive,
                    isDisabled && styles.levelOptionButtonDisabled
                  ]}
                  onPress={() => !isDisabled && setSelectedLevel(option)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.levelOptionTitle,
                    selectedLevel?.id === option.id && styles.levelOptionTitleActive,
                    isDisabled && styles.levelOptionTextDisabled
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.levelOptionDescription,
                    selectedLevel?.id === option.id && styles.levelOptionDescriptionActive,
                    isDisabled && styles.levelOptionTextDisabled
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Question 3: Training Preference */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Sở thích tập luyện của bạn?</Text>
          <View style={styles.optionsContainer}>
            {preferenceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.levelOptionButton,
                  selectedPreference?.id === option.id && styles.levelOptionButtonActive
                ]}
                onPress={() => setSelectedPreference(option)}
              >
                <Text style={[
                  styles.levelOptionTitle,
                  selectedPreference?.id === option.id && styles.levelOptionTitleActive
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.levelOptionDescription,
                  selectedPreference?.id === option.id && styles.levelOptionDescriptionActive
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedExperience || !selectedLevel || !selectedPreference) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!selectedExperience || !selectedLevel || !selectedPreference}
        >
          <Text style={styles.confirmButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  questionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#92A3FD',
    backgroundColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#92A3FD',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92A3FD',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#fff',
  },
  levelOptionButton: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#92A3FD',
    backgroundColor: 'transparent',
  },
  levelOptionButtonActive: {
    backgroundColor: '#92A3FD',
  },
  levelOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92A3FD',
    marginBottom: 6,
  },
  levelOptionTitleActive: {
    color: '#fff',
  },
  levelOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  levelOptionDescriptionActive: {
    color: '#fff',
  },
  levelOptionButtonDisabled: {
    opacity: 0.5,
    borderColor: '#E1E5E9',
    backgroundColor: '#F5F5F5',
  },
  levelOptionTextDisabled: {
    color: '#999',
  },
  confirmButton: {
    backgroundColor: '#92A3FD',
    paddingVertical: 18,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#92A3FD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E1E5E9',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

