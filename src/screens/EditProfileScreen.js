import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../services/api';

const { width } = Dimensions.get('window');

const GOALS = [
  { id: 1, title: 'Nâng cao kỹ năng cầu lông', icon: 'badminton' },
  { id: 2, title: 'Cải thiện thể chất', icon: 'run' },
  { id: 3, title: 'Quản lí hình thể và sức khỏe', icon: 'heart' }
];

export default function EditProfileScreen({ navigation, route }) {
  // Lấy thông tin người dùng từ route params hoặc API
  const [userData, setUserData] = useState(route.params || null);
  const [name, setName] = useState(userData?.name || '');
  const [gender, setGender] = useState(userData?.gender || '');
  const [age, setAge] = useState(userData?.age ? String(userData.age) : '');
  const [weight, setWeight] = useState(userData?.weight ? String(userData.weight) : '');
  const [height, setHeight] = useState(userData?.height ? String(userData.height) : '');
  const [selectedGoals, setSelectedGoals] = useState(userData?.goal || []);
  const [weightUnit, setWeightUnit] = useState('KG');
  const [heightUnit, setHeightUnit] = useState('CM');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  useEffect(() => {
    // Nếu không có userData từ route params, fetch từ API
    if (!userData) {
      const fetchUserData = async () => {
        try {
          const response = await userAPI.getProfile();
          const data = response.data;
          setUserData(data);
          setName(data.name || '');
          setGender(data.gender || '');
          setAge(data.age ? String(data.age) : '');
          setWeight(data.weight ? String(data.weight) : '');
          setHeight(data.height ? String(data.height) : '');
          setSelectedGoals(data.goal || []);
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
        }
      };
      fetchUserData();
    }
  }, [userData]);

  const toggleGoal = (goalTitle) => {
    setSelectedGoals(prevGoals => {
      if (prevGoals.includes(goalTitle)) {
        return prevGoals.filter(g => g !== goalTitle);
      } else {
        return [...prevGoals, goalTitle];
      }
    });
  };

  const handleSave = async () => {
    try {
      // Kiểm tra xem có trường nào đã điền chưa
      if (!name) {
        Alert.alert('Lỗi', 'Vui lòng điền tên của bạn');
        return;
      }
      
      if (selectedGoals.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một mục tiêu');
        return;
      }
      
      // Chuẩn bị dữ liệu cập nhật (userId được lấy từ JWT token ở backend)
      const profileData = {
        name,
        goals: selectedGoals,
        ...(gender ? { gender } : {}),
        ...(age ? { age: parseInt(age) } : {}),
        ...(weight ? { weight: parseInt(weight) } : {}),
        ...(height ? { height: parseInt(height) } : {})
      };
      
      // Gọi API để cập nhật thông tin profile
      const response = await userAPI.updateProfile(profileData);
      
      // Lưu token nếu có
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }
      
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
      navigation.goBack();
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
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

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
        <View style={styles.emptySpace} />
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
       {/* Header */}
    
      {/* Profile Form */}
      <View style={styles.form}>
        {/* Name */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="person-outline" size={24} color="#ADA4A5" />
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Choose Gender */}
        <View style={styles.genderInputContainer}>
          <MaterialIcons name="person-outline" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TouchableOpacity 
            style={styles.genderSelector}
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
          >
            <Text style={[styles.genderText, !gender && styles.placeholderText]}>
              {gender || 'Choose Gender'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          {/* Gender Dropdown */}
          {showGenderDropdown && (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => selectGender('Male')}
              >
                <Text style={styles.dropdownItemText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => selectGender('Female')}
              >
                <Text style={styles.dropdownItemText}>Female</Text>
              </TouchableOpacity>
               <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => selectGender('Other')}
              >
                <Text style={styles.dropdownItemText}>Other</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Age */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="cake" size={24} color="#ADA4A5" />
          <TextInput
            style={styles.input}
            placeholder="Your Age"
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
            placeholder="Your Weight"
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
            placeholder="Your Height"
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

        {/* Your Goals */}
        <View style={styles.goalsSection}>
          <Text style={styles.goalsSectionTitle}>Mục tiêu của bạn</Text>
          <Text style={styles.goalsSectionSubtitle}>Chọn một hoặc nhiều mục tiêu</Text>
          
          <View style={styles.goalsContainer}>
            {GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalButton,
                  selectedGoals.includes(goal.title) && styles.goalButtonActive
                ]}
                onPress={() => toggleGoal(goal.title)}
              >
                <MaterialCommunityIcons 
                  name={goal.icon} 
                  size={24} 
                  color={selectedGoals.includes(goal.title) ? '#fff' : '#92A3FD'} 
                />
                <Text style={[
                  styles.goalButtonText,
                  selectedGoals.includes(goal.title) && styles.goalButtonTextActive
                ]}>
                  {goal.title}
                </Text>
                {selectedGoals.includes(goal.title) && (
                  <MaterialIcons name="check-circle" size={20} color="#fff" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1617',
    letterSpacing: 0.5,
  },
  emptySpace: {
    width: 40,
  },
  form: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  // Input Styles - Đồng bộ
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
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
    borderColor: '#E1E5E9',
    position: 'relative',
    zIndex: 1000,
  },
  inputIcon: {
    marginRight: 12,
    color: '#ADA4A5',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    color: '#1D1617',
    fontWeight: '500',
  },
  // Gender Dropdown Styles
  genderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  genderText: {
    fontSize: 16,
    color: '#1D1617',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#ADA4A5',
    fontWeight: '400',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#ADA4A5',
    marginLeft: 8,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    marginTop: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1D1617',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Unit Button Styles - Thống nhất màu
  unitButton: {
    backgroundColor: '#E1E5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#92A3FD',
    shadowColor: '#92A3FD',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B6F72',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  // Goals Section - Đồng bộ với input
  goalsSection: {
    marginTop: 24,
    marginBottom: 10,
  },
  goalsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  goalsSectionSubtitle: {
    fontSize: 14,
    color: '#7B6F72',
    marginBottom: 16,
  },
  goalsContainer: {
    marginTop: 8,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  goalButtonActive: {
    backgroundColor: '#92A3FD',
    borderColor: '#92A3FD',
    shadowColor: '#92A3FD',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  goalButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#7B6F72',
    marginLeft: 12,
  },
  goalButtonTextActive: {
    color: '#FFFFFF',
  },
  checkIcon: {
    marginLeft: 8,
  },
  // Action Buttons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F7F8F8',
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7B6F72',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#92A3FD',
    paddingVertical: 18,
    borderRadius: 30,
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
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
