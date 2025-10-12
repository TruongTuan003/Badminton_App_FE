import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { userAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const goals = [
  {
    id: 1,
    title: 'Tăng cơ',
    description:
      'Muốn tăng khối lượng cơ, nâng cao sức mạnh và vóc dáng săn chắc.',
    image: require('../assets/images/Vector.png'),
  },
  {
    id: 2,
    title: 'Giảm mỡ',
    description:
      'Muốn giảm mỡ thừa, cải thiện độ săn chắc và sức bền.',
    image: require('../assets/images/Vector(1).png'),
  },
  {
    id: 3,
    title: 'Duy trì thể trạng',
    description:
      'Giữ cân nặng và sức khỏe ổn định, duy trì phong độ luyện tập.',
    image: require('../assets/images/Vector(2).png'),
  },
  {
    id: 4,
    title: 'Nâng cao kỹ thuật cầu lông',
    description:
      'Tập trung nâng cao kỹ thuật đánh cầu, di chuyển, phản xạ và chiến thuật.',
    image: require('../assets/images/Vector(2).png'),
  }
];

export default function GoalSelectionScreen({ navigation, route }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const scrollViewRef = useRef(null);

  const handleConfirm = async () => {
    if (selectedGoals.length > 0) {
      try {
        // Lấy dữ liệu profile từ route params
        const profileData = route.params?.profileData;
        
        // Kiểm tra và log dữ liệu profileData để debug
        console.log('ProfileData received in GoalSelectionScreen:', profileData);
        
        // Kiểm tra nếu profileData không tồn tại
        if (!profileData) {
          throw new Error('Không tìm thấy thông tin người dùng');
        }
        
        // Chuẩn bị dữ liệu cập nhật, sử dụng id hoặc userId tùy theo cái nào có sẵn
        const userId = profileData.id || profileData.userId;
        if (!userId) {
          throw new Error('Không tìm thấy ID người dùng');
        }
        
        const updateData = {
          userId: userId,
          goals: selectedGoals.map(goal => goal.title)
        };
        
        // Gọi API để cập nhật mục tiêu
        const response = await userAPI.updateProfile(updateData);
        
        // Lưu token mới nếu có
        if (response.data.token) {
          await AsyncStorage.setItem('token', response.data.token);
        }
        
        // Tạo object dữ liệu hoàn chỉnh
        const completeData = {
          ...profileData,
          ...response.data.user,
          goals: selectedGoals.map(goal => goal.title)
        };
        
        console.log('Complete Profile Data:', completeData);
        
        // Đăng ký thành công! Chuyển đến trang Welcome
        navigation.navigate('Auth', { userData: completeData });
      } catch (error) {
        console.error('Update goals error:', error.response?.data || error.message);
        Alert.alert(
          'Lỗi', 
          error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mục tiêu. Vui lòng thử lại sau.'
        );
      }
    }
  };

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    setCurrentSlide(index);
  };

  const selectGoal = (goal) => {
    setSelectedGoals(prevGoals => {
      const isAlreadySelected = prevGoals.find(g => g.id === goal.id);
      if (isAlreadySelected) {
        // Nếu đã chọn rồi thì bỏ chọn
        return prevGoals.filter(g => g.id !== goal.id);
      } else {
        // Nếu chưa chọn thì thêm vào
        return [...prevGoals, goal];
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bạn muốn đạt mục tiêu gì?</Text>
        <Text style={styles.subtitle}>Chúng tôi sẽ chọn lộ trình phù hợp cho người mới tập cầu lông</Text>
        <Text style={styles.hintText}>Bạn có thể chọn nhiều mục tiêu cùng lúc</Text>
        
        {/* Selected Goals Counter */}
        {selectedGoals.length > 0 && (
          <View style={styles.selectedCounter}>
            <Text style={styles.selectedCounterText}>
              Đã chọn {selectedGoals.length} mục tiêu
            </Text>
          </View>
        )}
      </View>

      {/* Slides Container */}
      <View style={styles.slidesContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="center"
        >
          {goals.map((goal, index) => (
            <View key={goal.id} style={styles.slide}>
              <Image source={goal.image} style={styles.goalImage} />
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
              
                             <TouchableOpacity
                 style={[
                   styles.selectButton,
                   selectedGoals.find(g => g.id === goal.id) && styles.selectButtonActive
                 ]}
                 onPress={() => selectGoal(goal)}
               >
                 <Text style={[
                   styles.selectButtonText,
                   selectedGoals.find(g => g.id === goal.id) && styles.selectButtonTextActive
                 ]}>
                   {selectedGoals.find(g => g.id === goal.id) ? 'Đã chọn' : 'Chọn'}
                 </Text>
               </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {goals.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive
            ]}
            onPress={() => goToSlide(index)}
          />
        ))}
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          selectedGoals.length === 0 && styles.confirmButtonDisabled
        ]}
        onPress={handleConfirm}
        disabled={selectedGoals.length === 0}
      >
        <Text style={styles.confirmButtonText}>Xác nhận ({selectedGoals.length} mục tiêu)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 15,
  },
  selectedCounter: {
    backgroundColor: '#92A3FD',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  selectedCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 14,
    color: '#92A3FD',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  goalImage: {
    width: width * 0.6,
    height: width * 0.6,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  goalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  selectButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#92A3FD',
    backgroundColor: 'transparent',
  },
  selectButtonActive: {
    backgroundColor: '#92A3FD',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92A3FD',
  },
  selectButtonTextActive: {
    color: '#fff',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E1E5E9',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#92A3FD',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  confirmButton: {
    backgroundColor: '#92A3FD',
    paddingVertical: 18,
    marginHorizontal: 20,
    marginBottom: 30,
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
