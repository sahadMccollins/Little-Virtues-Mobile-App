import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    // In a real app, send api request here to register.
    if (name && email && password) {
      await login({ email, name });
      router.replace('/(tabs)');
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
