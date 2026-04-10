import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Little Virtues!',
    description: 'A magical place for parents and children to learn together.',
    emoji: '✨',
    colors: [Colors.pink, Colors.pinkD] as const,
  },
  {
    id: '2',
    title: 'Teach with Joy',
    description: 'Discover lessons, bedtime stories, and fun activities to build character.',
    emoji: '📚',
    colors: [Colors.sky, Colors.skyD] as const,
  },
  {
    id: '3',
    title: 'Track Their Journey',
    description: 'Use the Virtues Jar to celebrate every step of their growth.',
    emoji: '🫙',
    colors: [Colors.butter, Colors.butterD] as const,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <LinearGradient colors={currentSlide.colors as any} style={styles.background} start={[0, 0]} end={[1, 1]} />
      
      <View style={styles.content}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{currentSlide.emoji}</Text>
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity style={styles.button} onPress={nextSlide}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Let's Begin" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '60%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  emojiContainer: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brown,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.mid,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.pinkD,
  },
  button: {
    backgroundColor: Colors.brown,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
