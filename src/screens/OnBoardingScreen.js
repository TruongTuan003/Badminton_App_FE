import React from "react";
import { Dimensions, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUTTONS, COLORS, FONTS } from "../styles/commonStyles";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground 
        source={require("../assets/images/backgr.png")} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topSpacer} />
          
          <View style={styles.contentContainer}>
            <View style={styles.titleWrapper}>
              <Text style={styles.welcome}>Welcome</Text>
              <Text style={styles.welcome1}>to</Text>
              <Text style={styles.title}>Bad2Pro</Text>
            </View>
            <Text style={styles.description}>Everybody Can Train</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.replace("Auth")}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  safeArea: {
    flex: 1,
    paddingBottom: height * 0.05,
  },
  topSpacer: {
    flex: 0.3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  welcome: {
    fontSize: width * 0.09,
    fontWeight: FONTS.medium,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcome1: {
    fontSize: width * 0.06,
    fontWeight: FONTS.medium,
    color: COLORS.white,
    marginVertical: height * 0.005,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: width * 0.1,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  description: {
    fontSize: width * 0.06,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.95,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: width * 0.15,
    marginBottom: height * 0.03,
    width: '100%',
  },
  button: {
    ...BUTTONS.primary,
    height: height * 0.07,
    borderRadius: height * 0.035,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: FONTS.bold,
    fontSize: width * 0.05,
    letterSpacing: 1,
  },
});