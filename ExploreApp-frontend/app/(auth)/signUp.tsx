import React, { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const [tab, setTab] = useState('email');
  const [containerWidth, setContainerWidth] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: tab === 'email' ? 0 : 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [tab]);



const register = async () => {
  if (password !== confirmPassword) {
    return alert('Passwords do not match');
  }

  setLoading(true);

  try {
    const body = {
      fullname: name,
      password,
      ...(tab === 'email' ? { email } : { phone }),
    };

    console.log("SENDING:", body); 

    const res = await fetch('https://application-tours.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log("RESPONSE:", data);

    if (!res.ok) {
      alert(data.msg || "Something went wrong");
    } else {
      alert("Registered Successfully ✅");
    }

  } catch (err) {
    console.log("ERROR:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <LinearGradient colors={['#F0F7FF', '#E8F4FF', '#F5F5F5']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join & explore the world ✈️</Text>
          </View>

          {/* Toggle */}
          <View
            style={styles.toggleContainer}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                styles.slider,
                {
                  width: containerWidth / 2,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, containerWidth / 2],
                      }),
                    },
                  ],
                },
              ]}
            />

            <TouchableOpacity onPress={() => setTab('email')} style={styles.toggleBtn}>
              <Text style={tab === 'email' ? styles.activeText : styles.text}>
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTab('phone')} style={styles.toggleBtn}>
              <Text style={tab === 'phone' ? styles.activeText : styles.text}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person" size={18} color="#999" />
              <TextInput
                placeholder="John Doe"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              {tab === 'email' ? 'Email Address' : 'Phone Number'}
            </Text>
            <View style={styles.inputBox}>
              <Ionicons name={tab === 'email' ? 'mail' : 'call'} size={18} color="#999" />
              <TextInput
                placeholder="Enter value"
                style={styles.input}
                value={tab === 'email' ? email : phone}
                onChangeText={tab === 'email' ? setEmail : setPhone}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={18} color="#999" />
              <TextInput
                secureTextEntry
                placeholder="••••••"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={18} color="#999" />
              <TextInput
                secureTextEntry
                placeholder="••••••"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* OTP */}
          {/* <View style={styles.inputWrapper}>
            <Text style={styles.label}>Enter OTP</Text>
            <View style={styles.otpRow}>
              <TextInput
                placeholder="1234"
                style={[styles.input, { flex: 1 }]}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.otpBtn} onPress={sendOtp}>
                <Text style={{ color: '#2563eb', fontWeight: '600' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* Button */}
          <TouchableOpacity onPress={register} disabled={loading} style={{ margin: 20 }}>
            <LinearGradient colors={['#003D82', '#2563eb']} style={styles.button}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#003D82' },
  subtitle: { color: '#666', marginTop: 5 },

  toggleContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#EEF3F8',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
  },

  slider: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },

  text: {
    color: '#888',
    fontWeight: '500',
  },

  activeText: {
    color: '#003D82',
    fontWeight: '700',
  },

  inputWrapper: { marginHorizontal: 20, marginBottom: 15 },

  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  input: { flex: 1, padding: 14 },

  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  otpBtn: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#E8F0F7',
    borderRadius: 8,
  },

  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});