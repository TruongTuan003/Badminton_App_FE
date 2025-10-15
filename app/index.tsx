import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AuthScreen from '../src/screens/AuthScreen';
import BadmintonSkillsScreen from '../src/screens/BadmintonSkillsScreen';
import BasicScreen from '../src/screens/BasicScreen';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import ExerciseDetailScreen from '../src/screens/ExerciseDetailScreen';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';
import GoalSelectionScreen from '../src/screens/GoalSelectionScreen';
import HomeScreen from '../src/screens/HomeScreen';
import OnboardingScreen from '../src/screens/OnBoardingScreen';
import OTPVerificationScreen from '../src/screens/OTPVerificationScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import ResetPasswordScreen from '../src/screens/ResetPasswordScreen';
import UserScreen from '../src/screens/UserScreen';
import WelcomeScreen from '../src/screens/WelcomeScreen';
import WorkoutScreen from '../src/screens/WorkoutScreen';
import ScheduleScreen from '../src/screens/ScheduleScreen';



const Stack = createStackNavigator();

export default function App() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="BadmintonSkills" component={BadmintonSkillsScreen} />
      <Stack.Screen name="Basic" component={BasicScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />

    </Stack.Navigator>
  );
}
