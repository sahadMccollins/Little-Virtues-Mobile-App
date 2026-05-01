import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, login, loginWithApple, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (name && email && password) {
      try {
        await register({ email, password, name });
        router.replace('/(tabs)');
      } catch (error: any) {
        alert(error.message || 'Registration failed.');
      }
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Little Virtues today</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

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
              placeholder="Create a password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Apple Login */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
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
                  // Handle successful Apple sign in/up
                  if (credential.identityToken) {
                    await loginWithApple(
                      credential.identityToken, 
                      credential.fullName?.givenName || 'Apple User', 
                      credential.email || ''
                    );
                    router.replace('/(tabs)');
                  } else {
                    alert('No identity token returned from Apple.');
                  }
                } catch (e: any) {
                  if (e.code === 'ERR_REQUEST_CANCELED') {
                    // handle that the user canceled the sign-in flow
                  } else {
                    // handle other errors
                    alert(e.message || 'Apple Sign-In failed.');
                  }
                }
              }}
            />
          )}

          {/* Google Login */}
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={async () => {
              try {
                await loginWithGoogle();
                router.replace('/(tabs)');
              } catch (e: any) {
                alert(e.message || 'Google Sign-In failed.');
              }
            }}
          >
            <Text style={styles.googleButtonText}>G Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerLink}>Sign In</Text>
            </Text>
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
    marginBottom: 40,
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
  registerButton: {
    backgroundColor: Colors.pinkD,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.pinkD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  registerButtonText: {
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
  },
  footerLink: {
    color: Colors.brown,
    fontWeight: '700',
  },
});
