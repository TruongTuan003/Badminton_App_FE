import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session"; // 
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function GoogleLoginButton({ onLoginSuccess }) {
  useEffect(() => {
    // 👇 Dòng này sẽ in ra Redirect URI thật của Expo
    console.log(
      "👉 Redirect URI:",
      AuthSession.makeRedirectUri({ useProxy: true })
    );
  }, []);
  const handleLogin = async () => {
    try {
      // ⚡️ Đổi localhost thành IP máy thật nếu test trên thiết bị thật
      const backendUrl = "http://192.168.1.142:3000/api/auth/google";

      const result = await WebBrowser.openAuthSessionAsync(backendUrl);

      if (result.type === "success" && result.url.includes("token=")) {
        const token = result.url.split("token=")[1];
        await AsyncStorage.setItem("token", token);
        if (onLoginSuccess) onLoginSuccess(token);
        Alert.alert("Đăng nhập thành công");
      } else {
        Alert.alert("Đăng nhập thất bại", "Không thể xác thực Google.");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Lỗi", "Không thể kết nối máy chủ.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={handleLogin}>
        <AntDesign name="google" size={24} color="#DB4437" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
});
