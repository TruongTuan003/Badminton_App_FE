import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../services/api';
import { COLORS, FONTS, SHADOWS, SIZES, SPACING } from '../styles/commonStyles';

export default function ResetPasswordScreen({ navigation, route }) {
  const { email, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    // Kiểm tra mật khẩu
    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmitting(true);

    try {
      // Gọi API reset password
      await authAPI.resetPassword(email, otp, password);
      
      Alert.alert(
        'Thành công',
        'Mật khẩu đã được đặt lại thành công',
        [
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('Auth')
          }
        ]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn
        </Text>
      </View>

      <View style={styles.form}>
        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons 
              name={showPassword ? "visibility" : "visibility-off"} 
              size={24} 
              color="#ADA4A5" 
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons 
              name={showConfirmPassword ? "visibility" : "visibility-off"} 
              size={24} 
              color="#ADA4A5" 
            />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleResetPassword}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  backButton: {
    marginTop: SIZES.height * 0.05,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8F8',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.l,
  },
  form: {
    marginTop: SPACING.xl,
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
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body2,
    paddingVertical: 0,
    color: COLORS.black,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: SPACING.xl,
    ...SHADOWS.primaryShadow,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: SIZES.body1,
    fontWeight: FONTS.bold,
  },
});
