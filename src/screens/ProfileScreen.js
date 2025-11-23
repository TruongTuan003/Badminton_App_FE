import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { userAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation, route }) {
  // Lấy thông tin người dùng từ API
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if we have userData from route params first
        if (route.params?.userData) {
          console.log('Using userData from route params:', route.params.userData);
          setUserData(route.params.userData);
        } else {
          // If not, fetch from API
          const response = await userAPI.getProfile();
          console.log('Fetched userData from API:', response.data);
          setUserData(response.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [route.params?.userData]);

  const { name, email } = userData || {};
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('KG');
  const [heightUnit, setHeightUnit] = useState('CM');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  useEffect(() => {
    // Log thông tin người dùng khi màn hình được mở
    if (name) {
      console.log('Profile setup for:', { name, email });
    }
  }, [name, email]);

  const handleNext = async () => {
    // Kiểm tra xem đã điền đầy đủ thông tin chưa
    if (!gender || !age || !weight || !height) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    try {
      // Kết hợp thông tin từ đăng ký và thông tin profile
      const userId = userData?.id;
      
      if (!userId) {
        console.error('MongoDB user ID not found:', userData);
        Alert.alert('Lỗi', 'Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.');
        navigation.navigate('Auth');
        return;
      }
      
      console.log('Using MongoDB ID for profile update:', userId);
      
      const profileData = {
        userId,
        name: name || 'User',
        gender, 
        age: parseInt(age), 
        weight: parseInt(weight), 
        height: parseInt(height)
      };
      
      // Gọi API để cập nhật thông tin profile
      const response = await userAPI.completeProfile(profileData);
      
      // Lưu token nếu có
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }
      
      // Chuyển đến màn hình chọn mục tiêu với thông tin đầy đủ
      navigation.navigate('GoalSelection', { 
        profileData: {
          ...profileData,
          ...response.data.user
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error.response?.data || error.message);
      Alert.alert(
        'Lỗi', 
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau.'
      );
    }
  };

  const selectGender = (selectedGender) => {
    setGender(selectedGender);
    setShowGenderDropdown(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Illustration Image */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={require('../assets/images/background.png')} 
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hoàn thiện hồ sơ của bạn</Text>
        <Text style={styles.subtitle}>
          Điều này giúp chúng tôi hiểu rõ về bạn hơn!
        </Text>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        {/* Choose Gender */}
        <View style={styles.genderInputContainer}>
          <MaterialIcons name="person-outline" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TouchableOpacity 
            style={styles.genderSelector}
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
          >
            <Text style={[styles.genderText, !gender && styles.placeholderText]}>
              {gender || 'Chọn giới tính'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          {/* Gender Dropdown */}
          {showGenderDropdown && (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => selectGender('Nam')}
              >
                <Text style={styles.dropdownItemText}>Nam</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => selectGender('Nữ')}
              >
                <Text style={styles.dropdownItemText}>Nữ</Text>
              </TouchableOpacity>
               <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => selectGender('Khác')}
              >
                <Text style={styles.dropdownItemText}>Khác</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Age */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="cake" size={24} color="#ADA4A5" />
          <TextInput
            style={styles.input}
            placeholder="Tuổi"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        {/* Your Weight */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="scale-bathroom" size={24} color="#ADA4A5" />
          <TextInput
            style={styles.input}
            placeholder="Cân nặng"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={[
              styles.unitButton, 
              weightUnit === 'KG' && styles.unitButtonActive
            ]}
            onPress={() => setWeightUnit('KG')}
          >
            <Text style={[
              styles.unitButtonText,
              weightUnit === 'KG' && styles.unitButtonTextActive
            ]}>KG</Text>
          </TouchableOpacity>
        </View>

        {/* Your Height */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="ruler" size={24} color="#ADA4A5" />
          <TextInput
            style={styles.input}
            placeholder="Chiều cao"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={[
              styles.unitButton, 
              heightUnit === 'CM' && styles.unitButtonActive
            ]}
            onPress={() => setHeightUnit('CM')}
          >
            <Text style={[
              styles.unitButtonText,
              heightUnit === 'CM' && styles.unitButtonTextActive
            ]}>CM</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Button */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[
            styles.nextButton,
            (!gender || !age || !weight || !height) && styles.nextButtonDisabled
          ]} 
          onPress={handleNext}
          disabled={!gender || !age || !weight || !height}
        >
          <Text style={[
            styles.nextButtonText,
            (!gender || !age || !weight || !height) && styles.nextButtonTextDisabled
          ]}>Tiếp tục</Text>
          <Text style={[
            styles.arrowIcon,
            (!gender || !age || !weight || !height) && styles.arrowIconDisabled
          ]}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  illustrationImage: {
    width: width * 0.9,
    height: height * 0.3,
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
  },
  form: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputIcon: {
    fontSize: 24,
    marginRight: 12,
    color: '#666',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  genderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  genderText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 18,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  unitButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  unitButtonActive: {
    backgroundColor: '#E68FBB',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  nextButton: {
    backgroundColor: '#92A3FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#92A3FD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  arrowIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nextButtonDisabled: {
    backgroundColor: '#E1E5E9',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
  arrowIconDisabled: {
    color: '#999',
  },
  genderInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
    zIndex: 1000,
  }
});
