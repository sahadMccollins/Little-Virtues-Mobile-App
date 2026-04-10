import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const user = await api.get('/user').then(res => res.data);
      setUserData(user);
    } catch (err) {
      console.log("Error loading user", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const child = userData?.children?.[0]; // Assume first child for demo

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <LinearGradient colors={['#FFE4EE', '#EDE4FF']} style={styles.homeTop} start={[0, 0]} end={[1, 1]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.parentRow}>
              <View>
                <Text style={styles.parentGreeting}>Good morning, {userData?.name || 'Parent'} 🌤</Text>
                <Text style={styles.parentName}>Ready to teach? 📖</Text>
              </View>
              <View style={styles.avatar}><Text style={{ fontSize: 24 }}>👩</Text></View>
            </View>
            <View style={styles.teachingTip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>Today: Sit with {child?.name || 'your child'} and read together — it only takes 5 minutes!</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.homeBody}>
          <LinearGradient colors={['#FFB3C6', '#C9B8F0']} style={styles.todayTeach} start={[0, 0]} end={[1, 1]}>
            <Text style={styles.teachLabel}>📚 Today's Teaching Session</Text>
            <Text style={styles.teachValue}>Kindness 💛</Text>
            <Text style={styles.teachHint}>Story + 3 flashcards + action task</Text>
            <TouchableOpacity style={styles.teachBtn} onPress={() => router.push('/teach')}>
              <Text style={styles.teachBtnText}>▶ Start Teaching · 5 min</Text>
            </TouchableOpacity>
            <Text style={styles.bookEmojiBg}>📖</Text>
          </LinearGradient>

          <View style={styles.grid2}>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#FFF3CC' }]} onPress={() => router.push('/jar')}>
              <Text style={styles.mfIcon}>🫙</Text>
              <Text style={styles.mfTitle}>Virtues Jar</Text>
              <Text style={styles.mfSub}>{child?.stars || 0} / 500 pts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#E4E0FF' }]} onPress={() => router.push('/stories')}>
              <Text style={styles.mfIcon}>🌙</Text>
              <Text style={styles.mfTitle}>Bedtime Stories</Text>
              <Text style={styles.mfSub}>3 new stories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#E4F7EE' }]} onPress={() => router.push('/downloads')}>
              <Text style={styles.mfIcon}>⬇️</Text>
              <Text style={styles.mfTitle}>Downloads</Text>
              <Text style={styles.mfSub}>Gita, Hanuman…</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#FFE4EE' }]} onPress={() => router.push('/progress')}>
              <Text style={styles.mfIcon}>📊</Text>
              <Text style={styles.mfTitle}>Progress</Text>
              <Text style={styles.mfSub}>{child?.name || 'Child'}'s journey</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.childCard}>
            <View style={styles.childAvatar}><Text style={{ fontSize: 20 }}>🧒</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.childName}>{child?.name || 'Child'}</Text>
              <Text style={styles.childStreak}>🔥 {child?.streak || 0} day streak · {child?.values || 0} values learned</Text>
            </View>
            <View style={styles.childPtsWrap}>
              <Text style={styles.childPts}>⭐ {child?.stars || 0} pts</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  homeTop: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  parentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  parentGreeting: { fontSize: 13, color: Colors.mid, fontWeight: '700' },
  parentName: { fontSize: 22, fontWeight: '900', color: Colors.brown },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  teachingTip: { backgroundColor: 'white', borderRadius: 16, padding: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tipIcon: { fontSize: 18 },
  tipText: { fontSize: 12, fontWeight: '700', color: Colors.brown, flex: 1 },
  homeBody: { padding: 16, gap: 14 },
  todayTeach: { borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden' },
  bookEmojiBg: { position: 'absolute', right: 16, top: 16, fontSize: 50, opacity: 0.3 },
  teachLabel: { fontSize: 11, fontWeight: '800', color: 'white', opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 },
  teachValue: { fontSize: 26, fontWeight: '900', color: 'white', marginVertical: 4 },
  teachHint: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  teachBtn: { backgroundColor: 'white', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, marginTop: 16, alignItems: 'center' },
  teachBtnText: { color: Colors.brown, fontSize: 14, fontWeight: '800' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  miniFeature: { width: '48%', borderRadius: 18, padding: 16, gap: 4 },
  mfIcon: { fontSize: 28 },
  mfTitle: { fontSize: 14, fontWeight: '800', color: Colors.brown, marginTop: 4 },
  mfSub: { fontSize: 12, fontWeight: '600', color: Colors.mid },
  childCard: { backgroundColor: 'white', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  childAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4EE', alignItems: 'center', justifyContent: 'center' },
  childName: { fontSize: 16, fontWeight: '800', color: Colors.brown },
  childStreak: { fontSize: 11, fontWeight: '700', color: Colors.mid, marginTop: 2 },
  childPtsWrap: { backgroundColor: Colors.safLt, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  childPts: { fontSize: 12, fontWeight: '800', color: Colors.peachD },
});
