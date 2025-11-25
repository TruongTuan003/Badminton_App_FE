import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ActivityHistoryScreen from '../src/screens/ActivityHistoryScreen';
import AuthScreen from '../src/screens/AuthScreen';
import BadmintonSurveyScreen from '../src/screens/BadmintonSurveyScreen';
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
 
  return (
    <SafeAreaProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
      <Stack.Screen name="BadmintonSurvey" component={BadmintonSurveyScreen} />
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
