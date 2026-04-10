import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, continueAsGuest } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // In a real app, send api request here.
    if (email && password) {
      await login({ email, name: 'Parent' });
      router.replace('/(tabs)');
    } else {
      alert('Please enter your email and password.');
    }
  };

  const handleGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Apple Login */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={15}
              style={styles.appleButton}
              onPress={async () => {
                try {
                  const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                      AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                  });
                  // Handle successful Apple sign in
                  await login({ name: credential.fullName?.givenName || 'User', email: credential.email });
                  router.replace('/(tabs)');
                } catch (e: any) {
                  if (e.code === 'ERR_REQUEST_CANCELED') {
                    // handle that the user canceled the sign-in flow
                  } else {
                    // handle other errors
                  }
                }
              }}
            />
          )}

          {/* Fake Google Login for testing UI */}
          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleButtonText}>G Sign in with Google</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerText}>
              Don't have an account? <Text style={styles.footerLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mid,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brown,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    color: Colors.brown,
  },
  loginButton: {
    backgroundColor: Colors.brown,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.mid,
    fontSize: 14,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 56,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    color: Colors.brown,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.mid,
    marginBottom: 24,
  },
  footerLink: {
    color: Colors.pinkD,
    fontWeight: '700',
  },
  guestButton: {
    padding: 16,
  },
  guestButtonText: {
    color: Colors.mid,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
