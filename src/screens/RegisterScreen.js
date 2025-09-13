import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS, SIZES, SPACING } from '../styles/commonStyles';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

const handleRegister = async () => {
  try {
    if (!fullName || !email || !password) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Email không hợp lệ');
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const payload = { name: fullName, email, password };
    const res = await authAPI.register(payload);

    // Khi nhập đầy đủ thông tin, qua trang otp
    alert("Đăng ký thành công!");

    // Chuyển qua màn OTPVerification
    navigation.navigate("OTPVerification", { userData: { email } });
  } catch (error) {
    alert(error.response?.data?.message || "Có lỗi xảy ra khi đăng ký");
  }
};

  const handleLogin = () => {
    navigation.navigate('Auth');
  };
  
  const handleGoogleRegister = () => {
    console.log('Google Register');
    // Trong thực tế, bạn sẽ gọi API đăng ký bằng Google ở đây
  };

  const handleFacebookRegister = () => {
    console.log('Facebook Register');
    // Trong thực tế, bạn sẽ gọi API đăng ký bằng Facebook ở đây
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey there,</Text>
        <Text style={styles.title}>Create an Account</Text>
      </View>

      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="person-outline" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={24} color="#ADA4A5" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={24}
              color="#ADA4A5"
            />
          </TouchableOpacity>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.termsText}>
            <Text style={styles.termsTextNormal}>By continuing you accept our </Text>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.termsTextNormal}> and </Text>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Terms of Use</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity 
          style={[styles.registerButton, !acceptTerms && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={!acceptTerms}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        
        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Register Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handleGoogleRegister}>
            <AntDesign name="google" size={24} color="#DB4437" />
          </TouchableOpacity>
    
          <TouchableOpacity style={styles.iconButton} onPress={handleFacebookRegister}>
            <FontAwesome name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.l,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E1E1',
  },
  dividerText: {
    marginHorizontal: SPACING.m,
    color: COLORS.gray,
    fontSize: SIZES.body3,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.m,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.m,
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.height * 0.05,
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: SIZES.body1,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: SPACING.m,
  },
  form: {
    flex: 1,
    justifyContent: 'flex-start',
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
  },
  input: {
    flex: 1,
    fontSize: SIZES.body2,
    paddingVertical: 0,
    color: COLORS.black,
  },
  eyeIcon: {
    padding: SPACING.s,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.m,
    marginBottom: SPACING.l,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.primary,
  },
  termsText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsTextNormal: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    lineHeight: 20,
  },
  termsLink: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    fontWeight: FONTS.bold,
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    marginVertical: SPACING.l,
    ...SHADOWS.primaryShadow,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: SIZES.body1,
    fontWeight: FONTS.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: SIZES.body3,
  },
  loginText: {
    color: COLORS.primary,
    fontSize: SIZES.body3,
    fontWeight: FONTS.bold,
  },
});
