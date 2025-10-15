import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../services/api';
import { COLORS, FONTS, SHADOWS, SIZES, SPACING } from '../styles/commonStyles';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

const handleLogin = async () => {
  try {
    const res = await authAPI.login(email, password);
    console.log("Login response:", res.data);
    
    if (res.data.token) {
      await AsyncStorage.setItem("token", res.data.token);
    }
    
    const userData = res.data.user || {
      firstName: 'Stefani',
      lastName: 'Wong',
      email: email,
      isLoggedIn: true
    };
    navigation.replace('Welcome', { userData });
  } catch (error) {
    alert(error.response?.data?.message || "Email hoặc mật khẩu không đúng!");
  }
};

  const handleForgotPassword = () => {
    console.log('Forgot password', email);
    navigation.navigate('ForgotPassword', { email });
  };

  const handleGoogleLogin = () => {
    console.log('Google Login');
    const userData = {
      firstName: 'Stefani',
      lastName: 'Wong',
      email: 'stefani.wong@gmail.com',
      isLoggedIn: true
    };
    navigation.replace('Home', userData);
  };

  const handleFacebookLogin = () => {
    console.log('Facebook Login');
    const userData = {
      firstName: 'Stefani',
      lastName: 'Wong',
      email: 'stefani.wong@facebook.com',
      isLoggedIn: true
    };
    navigation.replace('Home', userData);
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey there,</Text>
        <Text style={styles.title}>Welcome Back</Text>
      </View>

      <View style={styles.form}>
        {/* Email */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={24} color="#888" style={styles.inputIcon} />
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
              color="#888"
            />
          </TouchableOpacity>
        </View>

      
        <TouchableOpacity 
          style={styles.forgotPasswordContainer} 
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>

      
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <MaterialIcons name="login" size={20} color={COLORS.white} style={styles.loginIcon} />
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

       
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

    
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handleGoogleLogin}>
            <AntDesign name="google" size={24} color="#DB4437" />
          </TouchableOpacity>
    
          <TouchableOpacity style={styles.iconButton} onPress={handleFacebookLogin}>
            <FontAwesome name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account yet? </Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
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
    marginTop: SPACING.l,
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
    color: '#ADA4A5',
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    marginVertical: SPACING.l,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primaryShadow,
  },
  loginIcon: {
    marginRight: SPACING.xs,
  },
  loginButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: SIZES.body1,
    fontWeight: FONTS.bold,
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
  registerText: {
    color: COLORS.primary,
    fontSize: SIZES.body3,
    fontWeight: FONTS.bold,
  },
});
