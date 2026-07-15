import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onGetStarted?: () => void;
}

const SuitcaseIllustration = () => (
  <View style={styles.suitcaseWrapper}>
    <Image
      source={require('../assets/images/splashSuitCase.png')}
      style={styles.suitcaseImage}
      resizeMode="contain"
    />
  </View>
);

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(180)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );

    rotation.start();

    const timer = setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }, 700);

    return () => {
      rotation.stop();
      clearTimeout(timer);
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <LinearGradient colors={['#EAF1FF', '#DCE8FF', '#F5F8FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        
        <View style={styles.container}>

          {/* 🔹 TOP CONTENT */}
          <View style={styles.topContent}>
            
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerIconBox}>
                <Text style={styles.headerIcon}>
                  <FontAwesome name="plane" size={30}/>
                </Text>
              </View>
            </View>

            {/* TITLE */}
            <Text style={styles.title}>VizTravel</Text>

            <Text style={styles.subtitle}>
               Discover the world&apos;s most amazing{"\n"}destinations with us.
            </Text>

            {/* ILLUSTRATION */}
            <View style={styles.illustrationBox}>
              <Animated.View
                style={[styles.circle, { transform: [{ rotate }] }]}
              />

              <View style={styles.iconTopRight}>
                <Text>📷</Text>
              </View>

              <View style={styles.iconBottomLeft}>
                <Text style={{ color: '#fff' }}>👥</Text>
              </View>

              <View style={styles.suitcaseCenter}>
                <SuitcaseIllustration />
              </View>
            </View>

          </View>

          {/* 🔻 BOTTOM SHEET */}
          <View style={styles.bottomContainer}>

            {/* Background Layer */}
            <View style={styles.backgroundCard} />

            {/* Modal */}
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.dragHandle} />

              {/* Card */}
              <View style={styles.cardRow}>
                <View style={styles.cardIconWrapper}>
                  <FontAwesome name="shield" size={20} color="#0B3C6D" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Secure & Easy Booking</Text>
                  <Text style={styles.cardSubtitle}>
                    Plan your entire trip in minutes with our secure system.
                  </Text>
                </View>
              </View>

              {/* Terms */}
              <Text style={styles.terms}>
                By tapping Get Started, you agree to our{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL('https://yourdomain.com/terms')
                  }
                >
                  Terms & Privacy Policy
                </Text>
              </Text>

              {/* Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={() => (router.push('/(auth)/login'))}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Get Started →</Text>
              </TouchableOpacity>

            </Animated.View>
          </View>

        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },

  topContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    flex: 1,
  },

  header: {
    marginTop: 10,
  },

  headerIconBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    elevation: 5,
  },

  headerIcon: {
    fontSize: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0B3C6D',
    marginTop: 10,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7A90',
    textAlign: 'center',
    lineHeight: 20,
  },

  illustrationBox: {
    width: width * 0.8,
    height: width * 0.8,
    marginTop: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circle: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#A7C7FF',
  },

  suitcaseCenter: {
    position: 'absolute',
  },

  suitcaseWrapper: {
    width: 180,
    height: 180,
  },

  suitcaseImage: {
    width: '100%',
    height: '100%',
  },

  iconTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    elevation: 4,
  },

  iconBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#0B3C6D',
    padding: 10,
    borderRadius: 12,
    elevation: 4,
  },

  bottomContainer: {
    width: '100%',
  },

  backgroundCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 260,
    backgroundColor: '#EAF1FF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },

  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 20,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 15,
  },

  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
  },

  cardIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E3EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cardTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#0B3C6D',
  },

  cardSubtitle: {
    fontSize: 13,
    color: '#6B7A90',
    marginTop: 4,
    lineHeight: 18,
  },

  terms: {
    fontSize: 12,
    color: '#5B6B7A',
    textAlign: 'center',
    marginTop: 10,
  },

  link: {
    color: '#0B3C6D',
    fontWeight: '600',
  },

  button: {
    marginTop: 18,
    backgroundColor: '#FF9F1C',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',

    shadowColor: '#FF9F1C',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});