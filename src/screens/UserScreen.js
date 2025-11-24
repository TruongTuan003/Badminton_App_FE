import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Bot } from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../services/api';
import { calculateBMI } from '../utils/bmiCalculator';
import ChatBotAI from "../components/ChatBotAI";

// Hàm để lấy màu dựa trên chỉ số BMI
function getBmiColor(bmiValue) {
  if (bmiValue < 18.5) return '#4B9AFF'; // Underweight - blue
  if (bmiValue >= 18.5 && bmiValue < 25) return '#4CD964'; // Normal - green
  if (bmiValue >= 25 && bmiValue < 30) return '#FF9500'; // Overweight - orange
  return '#FF3B30'; // Obese - red
}

// Hàm để tính phần trăm vị trí của BMI trên thang đo
function getBmiPercentage(bmiValue) {
  // Giới hạn BMI từ 10 đến 40 để hiển thị trên thang đo
  const minBmi = 10;
  const maxBmi = 40;
  const normalizedBmi = Math.max(minBmi, Math.min(bmiValue, maxBmi));
  return ((normalizedBmi - minBmi) / (maxBmi - minBmi)) * 100;
}

export default function UserScreen({ navigation, route }) {
  // Lấy thông tin người dùng từ API
  const [userData, setUserData] = React.useState(null);
  const [isChatBotOpen, setIsChatBotOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("home");

  // Tạo hàm fetchUserData để có thể gọi lại khi cần
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.getProfile();
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);


  const fullName = userData?.name || 'Người dùng';
  const userProgram = userData?.userProgram || 'Lose a Fat Program';

  const height = userData?.profile?.height || userData?.height || '189';
  const weight = userData?.profile?.weight || userData?.weight || '65';

  const userHeight = `${height}cm`;
  const userWeight = `${weight}kg`;
  const userAge = userData?.profile?.age ? `${userData.profile.age}yo` : userData?.age ? `${userData.age}yo` : '22yo';
  
  const bmi = calculateBMI(parseFloat(weight), parseFloat(height));
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleEditPress = () => {
    navigation.navigate('EditProfile', userData);
  };
  

  const toggleNotifications = () => {
    setNotificationsEnabled(previousState => !previousState);
  };


  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive", 
          onPress: () => {
            setUserData(null);
  
            Alert.alert("Đăng xuất thành công", "Bạn đã đăng xuất thành công");
  
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" }],
              });
            }, 2000);
          },
        },
      ],
      { cancelable: true }
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
        </View>
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{fullName.charAt(0)}</Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, styles.statItemDivider]}>
            <Text style={styles.statValue}>{userHeight}</Text>
            <Text style={styles.statLabel}>Chiều cao</Text>
          </View>
          <View style={[styles.statItem, styles.statItemDivider]}>
            <Text style={styles.statValue}>{userWeight}</Text>
            <Text style={styles.statLabel}>Cân nặng</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userAge}</Text>
            <Text style={styles.statLabel}>Tuổi</Text>
          </View>
        </View>
        
        {/* BMI Display */}
        <View style={styles.bmiContainer}>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiTitle}>BMI (Chỉ số khối cơ thể)</Text>
            <Text style={[styles.bmiValue, { color: getBmiColor(bmi.value) }]}>{bmi.value}</Text>
          </View>
          <View style={styles.bmiCategoryContainer}>
            <Text style={styles.bmiCategoryLabel}>Phân loại:</Text>
            <Text style={[styles.bmiCategory, { color: getBmiColor(bmi.value) }]}>{bmi.category}</Text>
          </View>
          <View style={styles.bmiScaleContainer}>
            <View style={styles.bmiScale}>
              <View style={[styles.bmiScaleFill, { width: `${getBmiPercentage(bmi.value)}%` }]} />
              <View style={[styles.bmiScaleIndicator, { left: `${getBmiPercentage(bmi.value)}%` }]} />
            </View>
            <View style={styles.bmiScaleLabels}>
              <Text style={styles.bmiScaleLabel}>Gầy</Text>
              <Text style={styles.bmiScaleLabel}>Bình thường</Text>
              <Text style={styles.bmiScaleLabel}>Thừa cân</Text>
              <Text style={styles.bmiScaleLabel}>Béo phì</Text>
            </View>
          </View>
        </View>
        
        {/* Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Dữ liệu cá nhân</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialIcons name="emoji-events" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Thành tựu</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>
          
<TouchableOpacity 
  style={styles.menuItem}
  onPress={() => navigation.navigate('ActivityHistory')}
>
  <View style={styles.menuIconContainer}>
    <Ionicons name="time-outline" size={20} color="#92A3FD" />
  </View>
  <Text style={styles.menuItemText}>Lịch sử hoạt động</Text>
  <Feather name="chevron-right" size={20} color="#ADA4A5" />
</TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Tiến độ tập luyện</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>
        </View>
        
        {/* Notification Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="notifications-outline" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Thông báo bật lên</Text>
            <Switch
              trackColor={{ false: "#E6E7F2", true: "#C58BF2" }}
              thumbColor={notificationsEnabled ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#E6E7F2"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
              style={styles.switch}
            />
          </View>
        </View>
        
        {/* Other Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Khác</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialIcons name="headset-mic" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Liên hệ</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialIcons name="privacy-tip" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Chính sách bảo mật</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={20} color="#92A3FD" />
            </View>
            <Text style={styles.menuItemText}>Cài đặt</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="log-out" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.logoutText}>Đăng xuất</Text>
            <Feather name="chevron-right" size={20} color="#ADA4A5" />
          </TouchableOpacity>
        </View>
        
        {/* Bottom spacing for scroll view */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <ChatBotAI isOpen={isChatBotOpen} onToggle={setIsChatBotOpen} />
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeTab === "home" ? "#92A3FD" : "#ADA4A5"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("workout");
            navigation.navigate("Workout");
          }}
        >
          <Feather
            name="activity"
            size={24}
            color={activeTab === "workout" ? "#92A3FD" : "#ADA4A5"}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, isChatBotOpen ? {} : styles.navButtonRobot]}
          onPress={() => setIsChatBotOpen(!isChatBotOpen)}
        >
          {isChatBotOpen ? (
            <Feather 
              name="x" 
              size={24} 
              color="#FFFFFF" 
            />
          ) : (
            <Bot 
              size={24} 
              color="#92A3FD" 
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("food");
            navigation.navigate("Food");
          }}
        >
          <MaterialCommunityIcons name="food" size={24} color="#ADA4A5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("user");
            navigation.navigate("User", userData);
          }}
        >
          <Feather
            name="user"
            size={24}
            color={activeTab === "user" ? "#92A3FD" : "#ADA4A5"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',  
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Profile Info
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C58BF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: '#92A3FD',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statItemDivider: {
    borderRightWidth: 1,
    borderRightColor: '#E6E7F2',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7B6F72',
  },
  statDivider: {
  },
  
  // Sections
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: '#1D1617',
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    padding: 10,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#92A3FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#92A3FD',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSpacing: {
    height: 70,
  },
  // BMI Styles
  bmiContainer: {
    backgroundColor: '#F7F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1617',
  },
  bmiValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  bmiCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bmiCategoryLabel: {
    fontSize: 14,
    color: '#7B6F72',
    marginRight: 5,
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  bmiScaleContainer: {
    marginTop: 5,
  },
  bmiScale: {
    height: 8,
    backgroundColor: '#E6E7F2',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 5,
  },
  bmiScaleFill: {
    height: '100%',
    backgroundColor: '#92A3FD',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
  },
  bmiScaleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C58BF2',
    position: 'absolute',
    top: -2,
    marginLeft: -6,
  },
  bmiScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  bmiScaleLabel: {
    fontSize: 10,
    color: '#7B6F72',
  },
  navButtonRobot: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#92A3FD",
  }
});
