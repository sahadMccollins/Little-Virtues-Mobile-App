import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUserWithChildren, updateChildProfile } from '../../services/firestore';
import { getValues } from '../../services/api';

export default function HomeScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [todayValue, setTodayValue] = useState<any>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [unplayedCount, setUnplayedCount] = useState(0);
  const [totalValuesCount, setTotalValuesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // console.log("todayValue", todayValue);
  // console.log("isSessionComplete", isSessionComplete);
  // console.log("allComplete", allComplete);

  const loadData = async () => {
    if (!user) return;
    try {
      const fetchedUser = await getUserWithChildren(user.uid);
      // console.log("fetchedUser", fetchedUser);
      const child: any = fetchedUser?.children?.[0];
      // console.log("child", child);

      if (child) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let lastDate: Date | null = null;
        if (child.lastSessionDate) {
          lastDate = typeof child.lastSessionDate.toDate === 'function'
            ? child.lastSessionDate.toDate()
            : new Date(child.lastSessionDate); // fallback if mock
          lastDate?.setHours(0, 0, 0, 0);
        }

        // Streak Zero logic
        if (lastDate && today.getTime() - lastDate.getTime() > 86400000 && child.currentStreak > 0) {
          child.currentStreak = 0;
          child.streak = 0;
          updateChildProfile(user.uid, child._id, { currentStreak: 0, streak: 0 }); // Intentionally non-blocking async
        }

        setIsSessionComplete(lastDate ? lastDate.getTime() === today.getTime() : false);
      }
      // console.log("fetchedUser", fetchedUser);
      setUserData(fetchedUser);

      const valRes = await getValues();
      // console.log("valRes", valRes);
      let stValues = valRes.data || [];
      stValues.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setTotalValuesCount(stValues.length);

      if (child) {
        const comp = child.completedValues || [];
        const unplayed = stValues.filter((v: any) => !comp.includes(v.id));
        setUnplayedCount(unplayed.length);
        if (unplayed.length === 0) {
          setAllComplete(true);
          setTodayValue(null);
        } else {
          setTodayValue(unplayed[0]);
        }
      } else {
        setUnplayedCount(stValues.length);
        setTodayValue(stValues[0]);
      }

    } catch (err) {
      console.log("Error loading user", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

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
                <Text style={styles.parentGreeting}>Good morning, {userData?.displayName || 'Parent'} 🌤</Text>
                <Text style={styles.parentName}>Ready to teach? 📖</Text>
              </View>
              <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
                {userData?.avatar?.startsWith('http') ? (
                  <Image source={{ uri: userData.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <Text style={{ fontSize: 24 }}>{userData?.avatar || '👩'}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.teachingTip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>Today: Sit with {child?.name || 'your child'} and read together — it only takes 5 minutes!</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.homeBody}>
          {allComplete ? (
            <LinearGradient colors={['#D4FFEA', '#A8E6CF']} style={styles.todayTeach} start={[0, 0]} end={[1, 1]}>
              <Text style={styles.teachLabel}>🎉 Incredible Job!</Text>
              <Text style={[styles.teachValue, { color: Colors.brown }]}>All Values Completed</Text>
              <Text style={[styles.teachHint, { color: Colors.mid }]}>You've played every available session. Check the library!</Text>
              <TouchableOpacity style={[styles.teachBtn, { backgroundColor: Colors.brown }]} onPress={() => router.push('/explore')}>
                <Text style={{ color: 'white', fontWeight: '800' }}>📚 Explore Library</Text>
              </TouchableOpacity>
              <Text style={styles.bookEmojiBg}>🌟</Text>
            </LinearGradient>
          ) : isSessionComplete ? (
            <LinearGradient colors={['#E4FFE8', '#C3ECD4']} style={styles.todayTeach} start={[0, 0]} end={[1, 1]}>
              <Text style={styles.teachLabel}>✅ Done for Today</Text>
              <Text style={[styles.teachValue, { color: Colors.brown }]}>Session Complete!</Text>
              <Text style={[styles.teachHint, { color: Colors.mid }]}>Your streak is protected. See you tomorrow!</Text>
              <TouchableOpacity style={styles.teachBtn} onPress={() => router.push('/explore')}>
                <Text style={[styles.teachBtnText, { color: Colors.brown }]}>Replay past values</Text>
              </TouchableOpacity>
              <Text style={styles.bookEmojiBg}>🏆</Text>
            </LinearGradient>
          ) : todayValue ? (
            <LinearGradient colors={['#FFB3C6', '#C9B8F0']} style={styles.todayTeach} start={[0, 0]} end={[1, 1]}>
              <Text style={styles.teachLabel}>📚 Today's Teaching Session</Text>
              <Text style={styles.teachValue}>{todayValue.title} {todayValue.icon || '💛'}</Text>
              <Text style={styles.teachHint}>Story + flashcards + action task</Text>
              <TouchableOpacity
                style={styles.teachBtn}
                onPress={() => router.push({ pathname: '/teach', params: { id: todayValue.documentId || todayValue.id } })}
              >
                <Text style={styles.teachBtnText}>▶ Start Teaching · 5 min</Text>
              </TouchableOpacity>
              <Text style={styles.bookEmojiBg}>📖</Text>
            </LinearGradient>
          ) : null}

          <View style={styles.grid2}>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#FFF3CC' }]} onPress={() => router.push('/jar')}>
              <Text style={styles.mfIcon}>🫙</Text>
              <Text style={styles.mfTitle}>Virtues Jar</Text>
              <Text style={styles.mfSub}>{child?.stars || 0} / 500 pts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#E4E0FF' }]} onPress={() => router.push('/stories')}>
              <Text style={styles.mfIcon}>🌙</Text>
              <Text style={styles.mfTitle}>Bedtime Stories</Text>
              <Text style={styles.mfSub}>{unplayedCount > 0 ? `${unplayedCount} new stories` : 'All read 🎉'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#E4F7EE' }]} onPress={() => router.push('/downloads')}>
              <Text style={styles.mfIcon}>📚</Text>
              <Text style={styles.mfTitle}>Downloads</Text>
              {/* <Text style={styles.mfSub}>{totalValuesCount} total values</Text> */}
              <Text style={styles.mfSub}>Gita, Hanuman...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniFeature, { backgroundColor: '#FFE4EE' }]} onPress={() => router.push('/progress')}>
              <Text style={styles.mfIcon}>📊</Text>
              <Text style={styles.mfTitle}>Progress</Text>
              <Text style={styles.mfSub}>{child?.name || 'Child'}'s journey</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.childCard}>
            <View style={styles.childAvatar}><Text style={{ fontSize: 20 }}>{child?.avatar || '🧒'}</Text></View>
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
