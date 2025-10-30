import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { authAPI } from '../services/api';
import { COLORS, FONTS, SHADOWS, SIZES, SPACING } from '../styles/commonStyles';

export default function OTPVerificationScreen({ navigation, route }) {
  const userData = route.params?.userData || {};
  const email = route.params?.email || userData.email || '';
  const isPasswordReset = route.params?.isPasswordReset || false;
  const customMessage = route.params?.message;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); 
  const [isResendActive, setIsResendActive] = useState(false);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];


  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      setIsResendActive(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        inputRefs[index + 1].current.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

const handleVerify = async () => {
  try {
    if (otp.some(digit => digit === '')) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    const otpString = otp.join('');
    
    if (isPasswordReset) {
      navigation.navigate('ResetPassword', {
        email: email,
        otp: otpString
      });
    } else {
 
      const res = await authAPI.verifyOtp(email, otpString);
      console.log("OTP verified:", res.data);

      if (res.data.token) {
        await AsyncStorage.setItem("token", res.data.token);
      }

      navigation.replace("Profile", { 
        userData: {
          id: res.data.userId, 
          email: email,
          name: res.data.name || ''
        }
      });
    }
  } catch (error) {
    console.error("Verify error:", error.response?.data || error.message);
    Alert.alert('Lỗi', error.response?.data?.message || "OTP không đúng!");
  }
};

const handleResendOtp = async () => {
  if (isResendActive) {
    console.log('Resending OTP to:', email);
    try {
      if (isPasswordReset) {
        await authAPI.forgotPassword(email);
      } else {
        await authAPI.resendOtp(email);
      }
      
      setTimer(300); 
      setIsResendActive(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
      Alert.alert('Thông báo', 'Mã OTP mới đã được gửi đến email của bạn');
    } catch (error) {
      console.error("Resend OTP error:", error.response?.data || error.message);
      Alert.alert('Lỗi', error.response?.data?.message || "Có lỗi xảy ra khi gửi lại mã OTP");
    }
  }
};


  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="left" size={24} color="#1D1617" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Xác thực OTP</Text>
          <Text style={styles.subtitle}>
            {customMessage || 'Chúng tôi đã gửi mã xác thực đến email'}
          </Text>
          <Text style={styles.email}>{email}</Text>
          
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                autoFocus={index === 0}
              />
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={handleVerify}
          >
            <Text style={styles.verifyButtonText}>Xác nhận</Text>
          </TouchableOpacity>
          
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Không nhận được mã? </Text>
            <TouchableOpacity 
              onPress={handleResendOtp}
              disabled={!isResendActive}
            >
              <Text style={[
                styles.resendButton, 
                !isResendActive && styles.resendButtonDisabled
              ]}>
                {isResendActive ? 'Gửi lại' : `Gửi lại sau ${formatTimer(timer)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  email: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xl * 1.5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: SPACING.xl * 1.5,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#F7F8F8',
    fontSize: 20,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: SPACING.l,
    ...SHADOWS.primaryShadow,
  },
  verifyButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: SIZES.body1,
    fontWeight: FONTS.bold,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  resendText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  resendButton: {
    fontSize: SIZES.body3,
    fontWeight: FONTS.bold,
    color: COLORS.primary,
  },
  resendButtonDisabled: {
    color: COLORS.gray,
  },
});
