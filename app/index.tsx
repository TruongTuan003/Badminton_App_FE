import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ActivityHistoryScreen from '../src/screens/ActivityHistoryScreen';
import AuthScreen from '../src/screens/AuthScreen';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import ExerciseDetailScreen from '../src/screens/ExerciseDetailScreen';
import FoodScreen from '../src/screens/FoodScreen';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';
import GoalSelectionScreen from '../src/screens/GoalSelectionScreen';
import HomeScreen from '../src/screens/HomeScreen';
import MealPlanSelectScreen from '../src/screens/MealPlanSelectScreen';
import MenuDetailScreen from '../src/screens/MenuDetailScreen';
import MenuScreen from '../src/screens/MenuScreen';
import OnboardingScreen from '../src/screens/OnBoardingScreen';
import OTPVerificationScreen from '../src/screens/OTPVerificationScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import ResetPasswordScreen from '../src/screens/ResetPasswordScreen';
import ScheduleScreen from '../src/screens/ScheduleScreen';
import TrainingDetailScreen from '../src/screens/TrainingDetailScreen';
import TrainingListScreen from '../src/screens/TrainingListScreen';
import TrainingPlanDetailScreen from '../src/screens/TrainingPlanDetailScreen';
import TrainingPlanListScreen from '../src/screens/TrainingPlanListScreen';
import UserScreen from '../src/screens/UserScreen';
import WelcomeScreen from '../src/screens/WelcomeScreen';
import WorkoutScreen from '../src/screens/WorkoutScreen';


const Stack = createStackNavigator();

export default function App() {
  // ==================== THÊM ĐOẠN NÀY VÀO ĐÂY ====================
  const navigationRef = React.useRef<any>(null);
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (!url) return;

      console.log('Deep link nhận được:', url); // để debug trong Expo Go hoặc console

      try {
        const { queryParams } = Linking.parse(url);

        if (queryParams?.token) {
          const token = queryParams.token as string;

          // Lưu token ngay lập tức
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('isLoggedIn', 'true');

          Alert.alert('Đăng nhập thành công!', 'Chào mừng bạn trở lại 🎉', [
            { text: 'OK', onPress: () => {
              navigationRef.current?.navigate('Home');
            } }
          ]);

          // Tự động chuyển về Home (nếu đang ở Auth hoặc Onboarding)
          // Stack.Navigator sẽ tự handle vì token đã có
        }

        if (queryParams?.error) {
          Alert.alert('Lỗi đăng nhập', queryParams.error as string);
        }
      } catch (err) {
        console.error('Lỗi xử lý deep link:', err);
      }
    };

    // Khi app đang mở và nhận link
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Khi app bị đóng hoàn toàn và được mở bởi deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Cleanup
    return () => subscription?.remove();
  }, []);
  // ============================================================ 
  return (
    <SafeAreaProvider>
    <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        // Thêm dòng này để lấy được navigation từ bên ngoài
        // @ts-ignore
        ref={navigationRef}
      >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="User" component={UserScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Workout" component={WorkoutScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />
      <Stack.Screen name="Food" component={FoodScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="TrainingList" component={TrainingListScreen} />
      <Stack.Screen name="TrainingDetail" component={TrainingDetailScreen} />
      <Stack.Screen name="TrainingPlanList" component={TrainingPlanListScreen} />
      <Stack.Screen name="TrainingPlanDetail" component={TrainingPlanDetailScreen} />
      <Stack.Screen name="MealPlanSelect" component={MealPlanSelectScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} options={{ title: 'Lịch sử hoạt động', headerShown: false }} />
    </Stack.Navigator>
    </SafeAreaProvider>
  );
}
