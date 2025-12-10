import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginButton({ onLoginSuccess }) {
  useEffect(() => {
    console.log(
      "👉 Redirect URI:",
      AuthSession.makeRedirectUri({ useProxy: true })
    );
  }, []);

  const handleLogin = async () => {
    try {
      const backendUrl = "https://bad2pro.site/api/auth/google";

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
    <TouchableOpacity style={styles.iconButton} onPress={handleLogin}>
      <AntDesign name="google" size={28} color="#DB4437" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
