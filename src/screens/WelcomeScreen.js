import React from 'react';
import {
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { userAPI } from '../services/api';
import { COLORS, FONTS } from '../styles/commonStyles';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.getProfile();
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const fullName = userData?.name || 'Người dùng';
  
  const handleGoToHome = () => {
    navigation.replace('Home', {
      ...userData,
      isLoggedIn: true
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground 
        source={require('../assets/images/backgr.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeTitle}>
                Welcome, <Text style={styles.nameHighlight}>{fullName}</Text>
              </Text>
              <Text style={styles.welcomeMessage}>
                You are all set now, let's reach your{'\n'}
                goals together with us
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.goToHomeButton} 
              onPress={handleGoToHome}
              activeOpacity={0.8}
            >
              <Text style={styles.goToHomeButtonText}>Go To Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: width * 0.06,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.05,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: height * 0.05,
  },
  welcomeTitle: {
    fontSize: width * 0.08,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    marginBottom: height * 0.02,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  nameHighlight: {
    color: COLORS.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeMessage: {
    fontSize: width * 0.045,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: width * 0.06,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  goToHomeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: height * 0.02,
    borderRadius: height * 0.035,
    width: '100%',
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
  goToHomeButtonText: {
    color: COLORS.white,
    fontSize: width * 0.05,
    fontWeight: FONTS.bold,
    letterSpacing: 1,
  },
});