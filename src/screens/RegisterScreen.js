import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS, SIZES, SPACING } from '../styles/commonStyles';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [hasStartedTypingConfirmPassword, setHasStartedTypingConfirmPassword] = useState(false);

const handleResendOtp = async (userEmail) => {
  try {
    await authAPI.resendOtp({ email: userEmail });
    Alert.alert(
      'Thành công',
      'OTP mới đã được gửi đến email của bạn',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate("OTPVerification", { userData: { email: userEmail } })
        }
      ]
    );
  } catch (error) {
    Alert.alert('Lỗi', error.response?.data?.message || "Không thể gửi lại OTP");
  }
};

const handleRegister = async () => {
  try {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Thông báo', 'Email không hợp lệ');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
      return;
    }

    const payload = { name: fullName, email, password };
    const res = await authAPI.register(payload);
    Alert.alert(
      'Thành công',
      'Kiểm tra email của bạn để nhận mã OTP xác thực.',
      [{ text: 'OK', onPress: () => navigation.navigate("OTPVerification", { userData: { email } }) }]
    );
  } catch (error) {
    const errorMessage = error.response?.data?.message;
    
    // Kiểm tra nếu email đang chờ xác thực OTP
    if (error.response?.status === 409 && errorMessage?.includes('chờ xác thực OTP')) {
      Alert.alert(
        'Email chưa xác thực',
        'Email này đang chờ xác thực OTP. Bạn có muốn gửi lại mã OTP không?',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Gửi lại OTP',
            onPress: () => handleResendOtp(email)
          }
        ]
      );
    } else {
      Alert.alert('Lỗi', errorMessage || "Có lỗi xảy ra khi đăng ký");
    }
  }
};

  const handleLogin = () => {
    navigation.navigate('Auth');
  };
  
  const handleGoogleRegister = () => {
    console.log('Google Register');
  };

  const handleFacebookRegister = () => {
    console.log('Facebook Register');
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    setHasStartedTypingConfirmPassword(true);
    // Chỉ kiểm tra lỗi khi người dùng nhập vào trường xác nhận mật khẩu
    if (text && password && text !== password) {
      setPasswordError('Mật khẩu xác nhận không khớp');
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin Chào,</Text>
        <Text style={styles.title}>Tạo Tài Khoản</Text>
      </View>

      <View style={styles.form}>
       
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

        <View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={24} color="#ADA4A5" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
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
        </View>

        <View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={24} color="#ADA4A5" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#ADA4A5"
              />
            </TouchableOpacity>
          </View>
          {hasStartedTypingConfirmPassword && passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.termsText}>
            <Text style={styles.termsTextNormal}>Để tiếp tục, bạn hãy chấp nhận </Text>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Chính Sách Bảo Mật</Text>
            </TouchableOpacity>
            <Text style={styles.termsTextNormal}> và </Text>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Điều Khoản Sử Dụng</Text>
            </TouchableOpacity>
          </View>
        </View>


        <TouchableOpacity 
          style={[styles.registerButton, !acceptTerms && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={!acceptTerms}
        >
          <Text style={styles.registerButtonText}>Đăng Ký</Text>
        </TouchableOpacity>
        
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

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
  errorText: {
    color: '#FF0000',
    fontSize: SIZES.body3,
    marginTop: 4,
    marginLeft: 16,
    marginBottom: 8,
  },
});
