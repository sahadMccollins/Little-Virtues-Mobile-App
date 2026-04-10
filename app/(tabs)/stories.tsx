import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

const STORIES = [
  { id: 1, icon: '🦁', title: 'The Brave Little Cub', meta: 'Courage · 6 min · Ages 5–8', color: ['#2D1B6B', '#4A2B9B'] },
  { id: 2, icon: '🐢', title: 'Slow & Steady Wins Hearts', meta: 'Patience · 5 min · Ages 4–6', color: ['#1A3A40', '#0D5C63'] },
  { id: 3, icon: '🌸', title: 'Radha\'s Garden of Kindness', meta: 'Kindness · 7 min · Ages 6–9', color: ['#3A1A40', '#6B2D8B'] },
];

export default function StoriesScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D1B6B', '#1A1040']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.btTitle}>🌙 Bedtime Stories</Text>
          <Text style={styles.btSub}>Calm, values-based stories for sleep time</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
          <View style={[styles.moodChip, styles.moodChipOn]}><Text style={styles.moodTextOn}>All ✨</Text></View>
          <View style={styles.moodChip}><Text style={styles.moodTextOff}>Calming 🌊</Text></View>
          <View style={styles.moodChip}><Text style={styles.moodTextOff}>Brave 🦁</Text></View>
          <View style={styles.moodChip}><Text style={styles.moodTextOff}>Grateful 🙏</Text></View>
        </ScrollView>

        <View style={styles.featuredCard}>
          <LinearGradient colors={['#1A1040', '#2D1B6B']} style={styles.btArt}>
            <Text style={{fontSize: 60}}>🌙</Text>
          </LinearGradient>
          <View style={styles.btInfo}>
            <Text style={styles.btStoryTag}>🌟 Featured Tonight</Text>
            <Text style={styles.btStoryName}>The Grateful Little Star</Text>
            <Text style={styles.btStoryMeta}>Gratitude · <Text style={{color: Colors.mint}}>8 min</Text> · Ages 4–7</Text>
          </View>
        </View>

        <View style={styles.list}>
          {STORIES.map(story => (
            <View key={story.id} style={styles.listItem}>
               <LinearGradient colors={story.color as any} style={styles.listArt}>
                 <Text style={{fontSize: 24}}>{story.icon}</Text>
               </LinearGradient>
               <View style={{flex: 1}}>
                 <Text style={styles.listTitle}>{story.title}</Text>
                 <Text style={styles.listMeta}>{story.meta}</Text>
               </View>
               <TouchableOpacity style={styles.playBtn}><Text style={{color: Colors.lav, fontSize: 12}}>▶</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1040' },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  btTitle: { fontSize: 20, fontWeight: '900', color: '#F0E8FF', marginTop: 10 },
  btSub: { fontSize: 13, color: '#9B80C8', fontWeight: '700', marginTop: 4 },
  body: { padding: 16, gap: 16 },
  moodRow: { flexDirection: 'row', gap: 10, paddingBottom: 10 },
  moodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  moodChipOn: { backgroundColor: Colors.lavD },
  moodTextOn: { color: 'white', fontWeight: '700', fontSize: 12 },
  moodTextOff: { color: '#C8B8E8', fontWeight: '700', fontSize: 12 },
  featuredCard: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  btArt: { height: 150, alignItems: 'center', justifyContent: 'center' },
  btInfo: { padding: 16 },
  btStoryTag: { fontSize: 11, fontWeight: '800', color: Colors.lav, textTransform: 'uppercase', letterSpacing: 1 },
  btStoryName: { fontSize: 18, fontWeight: '900', color: '#F0E8FF', marginVertical: 6 },
  btStoryMeta: { fontSize: 12, color: '#9B80C8', fontWeight: '700' },
  list: { gap: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  listArt: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 15, fontWeight: '800', color: '#F0E8FF' },
  listMeta: { fontSize: 11, color: '#9B80C8', fontWeight: '600', marginTop: 4 },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(155, 128, 216, 0.3)', alignItems: 'center', justifyContent: 'center' }
});
