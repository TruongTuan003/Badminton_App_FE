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
import { userAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function EditProfileScreen({ navigation, route }) {
  // Lấy thông tin người dùng từ route params hoặc API
  const [userData, setUserData] = useState(route.params || null);
  const [name, setName] = useState(userData?.name || '');
  const [gender, setGender] = useState(userData?.gender || '');
  const [age, setAge] = useState(userData?.age ? String(userData.age) : '');
  const [weight, setWeight] = useState(userData?.weight ? String(userData.weight) : '');
  const [height, setHeight] = useState(userData?.height ? String(userData.height) : '');
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
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
        }
      };
      fetchUserData();
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      // Kiểm tra xem có trường nào đã điền chưa
      if (!name) {
        Alert.alert('Lỗi', 'Vui lòng điền tên của bạn');
        return;
      }
      
      // Chuẩn bị dữ liệu cập nhật (userId được lấy từ JWT token ở backend)
      const profileData = {
        name,
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
       {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
        <View style={styles.emptySpace} />
      </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1617',
  },
  emptySpace: {
    width: 40,
  },
  form: {
    paddingHorizontal: 20,
    marginTop: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F7F8F8',
    paddingVertical: 18,
    borderRadius: 30,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#92A3FD',
    paddingVertical: 18,
    borderRadius: 30,
    marginLeft: 10,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
