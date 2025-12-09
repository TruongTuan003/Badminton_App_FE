import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { authAPI, userAPI } from "../services/api";
import { COLORS, FONTS, SHADOWS, SIZES, SPACING } from "../styles/commonStyles";

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleResendOtp = async (targetEmail) => {
    try {
      await authAPI.resendOtp({ email: targetEmail });
      Alert.alert(
        "Đã gửi lại OTP",
        "Vui lòng kiểm tra email để lấy mã OTP mới.",
        [
          {
            text: "Nhập OTP",
            onPress: () =>
              navigation.navigate("OTPVerification", {
                userData: { email: targetEmail },
              }),
          },
          { text: "Đóng", style: "cancel" },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message ||
          "Không thể gửi lại OTP. Vui lòng thử lại sau."
      );
    }
  };

  // Hàm kiểm tra profile và điều hướng đến màn hình phù hợp
  const checkProfileAndNavigate = (profileData) => {
    const { age, gender, height, weight, goal, badmintonExperience, badmintonLevel, trainingPreference } = profileData;

    // Kiểm tra thông tin cơ bản (age, gender, height, weight)
    if (!age || !gender || !height || !weight) {
      console.log("Thiếu thông tin cơ bản, chuyển đến ProfileScreen");
      navigation.replace("Profile", { userData: profileData });
      return;
    }

    // Kiểm tra goal
    if (!goal || !Array.isArray(goal) || goal.length === 0) {
      console.log("Thiếu mục tiêu, chuyển đến GoalSelectionScreen");
      navigation.replace("GoalSelection", { profileData });
      return;
    }

    // Kiểm tra thông tin khảo sát cầu lông
    // Chỉ kiểm tra nếu user có goal liên quan đến cầu lông
    // Goal được lưu là title: "Nâng cao kỹ năng cầu lông"
    const hasBadmintonGoal = goal.some(g => {
      const goalStr = String(g).toLowerCase();
      return goalStr.includes("cầu lông") || 
             goalStr.includes("kỹ năng cầu lông") ||
             goalStr === "nâng cao kỹ năng cầu lông";
    });

    if (hasBadmintonGoal && (!badmintonExperience || !badmintonLevel || !trainingPreference)) {
      console.log("Thiếu thông tin khảo sát, chuyển đến BadmintonSurveyScreen");
      navigation.replace("BadmintonSurvey", { profileData });
      return;
    }

    // Nếu đầy đủ thông tin, chuyển đến Home
    console.log("Profile đầy đủ, chuyển đến Home");
    navigation.replace("Home", { 
      ...profileData,
      isLoggedIn: true 
    });
  };

  const handleLogin = async () => {
    try {
      const res = await authAPI.login(email, password);
      console.log("Login response:", res.data);

      if (res.data.token) {
        await AsyncStorage.setItem("token", res.data.token);
      }

      // Lấy đầy đủ thông tin profile từ API
      try {
        const profileResponse = await userAPI.getProfile();
        const fullProfileData = profileResponse.data;
        console.log("Full profile data:", fullProfileData);

        // Kiểm tra profile và điều hướng
        checkProfileAndNavigate(fullProfileData);
      } catch (profileError) {
        console.error("Error fetching profile:", profileError);
        // Nếu không lấy được profile, sử dụng dữ liệu từ login response
        const userData = res.data.user || {
          email: email,
          isLoggedIn: true,
        };
        // Chuyển đến Profile để điền thông tin
        navigation.replace("Profile", { userData });
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message = data?.message || "Email hoặc mật khẩu không đúng!";

      // Nếu account đang chờ OTP
      if (status === 403 && data?.isPending) {
        const targetEmail = data?.email || email;
        Alert.alert(
          "Tài khoản chưa xác thực",
          "Email này đang chờ xác thực OTP. Bạn muốn làm gì?",
          [
            {
              text: "Hủy",
              style: "cancel",
            },

            {
              text: "Gửi lại OTP",
              onPress: () => handleResendOtp(targetEmail),
            },
          ]
        );
        return;
      }

      Alert.alert("Lỗi đăng nhập", message);
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password", email);
    navigation.navigate("ForgotPassword", { email });
  };

  const handleFacebookLogin = () => {
    console.log("Facebook Login");
    Alert.alert(
      "Chức năng đang phát triển",
      "Đăng nhập bằng Facebook hiện đang được phát triển. Vui lòng sử dụng các phương thức đăng nhập khác.",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Chào Bạn,</Text>
        <Text style={styles.title}>Chào Mừng Trở Lại</Text>
      </View>

      <View style={styles.form}>
        {/* Email */}
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="email"
            size={24}
            color="#888"
            style={styles.inputIcon}
          />
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
          <MaterialIcons
            name="lock-outline"
            size={24}
            color="#888"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
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
              name={showPassword ? "visibility" : "visibility-off"}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <MaterialIcons
            name="login"
            size={20}
            color={COLORS.white}
            style={styles.loginIcon}
          />
          <Text style={styles.loginButtonText}>Đăng Nhập</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <View style={styles.iconButton}>
            <GoogleLoginButton
              onLoginSuccess={(user) => {
                // lưu user vào AsyncStorage
                AsyncStorage.setItem("user", JSON.stringify(user));
                navigation.replace("Home", { userData: user });
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleFacebookLogin}
          >
            <FontAwesome name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerText}>Đăng Ký</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
  },
  header: {
    alignItems: "center",
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
    justifyContent: "flex-start",
    marginTop: SPACING.l,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8F8",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputIcon: {
    fontSize: 24,
    marginRight: 12,
    color: "#ADA4A5",
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
    alignItems: "flex-end",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.primaryShadow,
  },
  loginIcon: {
    marginRight: SPACING.xs,
  },
  loginButtonText: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: SIZES.body1,
    fontWeight: FONTS.bold,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.l,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E1E1E1",
  },
  dividerText: {
    marginHorizontal: SPACING.m,
    color: COLORS.gray,
    fontSize: SIZES.body3,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: SPACING.m,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.m,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
