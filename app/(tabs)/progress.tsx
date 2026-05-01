import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getUserWithChildren, fetchChildActivities } from '../../services/firestore';

const getDynamicChartData = (activities: any[]) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const colors = [
    Colors.mint,     // Mon
    Colors.lavD,     // Tue
    Colors.pink,     // Wed
    Colors.butterD,  // Thu
    Colors.mintD,    // Fri
    Colors.peachD,   // Sat
    Colors.skyD      // Sun
  ];

  const weekData = days.map((day, idx) => ({ day, count: 0, defaultColor: colors[idx] }));

  if (activities && Array.isArray(activities)) {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    activities.forEach(act => {
      let actDate;
      if (act.createdAt?.toDate) {
        actDate = act.createdAt.toDate();
      } else if (typeof act.createdAt === 'string' || typeof act.createdAt === 'number') {
        actDate = new Date(act.createdAt);
      } else if (act.createdAt instanceof Date) {
        actDate = act.createdAt;
      }

      if (actDate && actDate >= startOfWeek) {
        const dIndex = actDate.getDay() === 0 ? 6 : actDate.getDay() - 1;
        if (weekData[dIndex]) {
          weekData[dIndex].count += 1;
        }
      }
    });
  }

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  return weekData.map(d => ({
    day: d.day,
    h: `${Math.max(5, (d.count / maxCount) * 100)}%`, // min 5% height
    c: d.count > 0 ? d.defaultColor : '#F0E8D8'
  }));
};

export default function ProgressScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await getUserWithChildren(user.uid);
      if (data && data.children && data.children.length > 0) {
        const childId = data.children[0]._id;
        const activitiesData = await fetchChildActivities(user.uid, childId);
        // Combine child data with activities exactly how the UI expects
        const childData = {
          ...data.children[0],
          activities: activitiesData.activities || []
        };
        setUserData(childData);
      }
    } catch (err) {
      console.log("Error loading progress", err);
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

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <LinearGradient colors={['#E4F7EE', '#C8EFDF']} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.progTitle}>📊 {userData?.name || 'Child'}'s Progress</Text>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, {color: Colors.saffron}]}>🔥{userData?.streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{userData?.values || 0}</Text>
              <Text style={styles.statLabel}>Values Learned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, {color: Colors.butterD}]}>⭐{userData?.stars || 0}</Text>
              <Text style={styles.statLabel}>Stars Earned</Text>
            </View>
          </View>

          <View style={styles.weeklyChart}>
            <Text style={styles.chartTitle}>This Week — Sessions Completed</Text>
            <View style={styles.chartBars}>
              {getDynamicChartData(userData?.activities).map(b => (
                <View key={b.day} style={styles.chartBarWrap}>
                   <View style={[styles.chartBar, {height: b.h as any, backgroundColor: b.c}]} />
                   <Text style={styles.chartDay}>{b.day}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.timeline}>
             {(!userData?.activities || userData.activities.length === 0) ? (
               <View style={styles.emptyState}>
                 <Text style={styles.emptyStateEmoji}>🌱</Text>
                 <Text style={styles.emptyStateTitle}>No activities yet!</Text>
                 <Text style={styles.emptyStateDesc}>Complete a session or read a story to see your progress here.</Text>
               </View>
             ) : (
               userData.activities.map((act: any, i: number) => {
                 const isStory = act.type === 'story';
                 return (
                   <View key={i} style={[styles.tlItem, i === userData.activities.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[styles.tlDot, {backgroundColor: isStory ? '#FFF3CC' : '#FFE4EE'}]}>
                        <Text>{isStory ? '🌙' : '💛'}</Text>
                      </View>
                      <View style={styles.tlContent}>
                         <Text style={styles.tlTitle}>{act.title}</Text>
                         <Text style={styles.tlDate}>{(act.createdAt?.toDate ? act.createdAt.toDate() : new Date(act.createdAt)).toLocaleDateString()} · +{act.stars} ⭐</Text>
                      </View>
                      <View style={[styles.tlBadge, {backgroundColor: isStory ? '#EDE4FF' : '#E4FFE8'}]}>
                        <Text style={[styles.tlBadgeText, {color: isStory ? Colors.lavD : Colors.mintD}]}>{isStory ? 'Story' : 'Done'}</Text>
                      </View>
                   </View>
                 );
               })
             )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  progTitle: { fontSize: 22, fontWeight: '900', color: Colors.brown, marginTop: 10 },
  body: { padding: 16, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: 'white', borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  statVal: { fontSize: 24, fontWeight: '900', color: Colors.brown },
  statLabel: { fontSize: 11, fontWeight: '700', color: Colors.mid, marginTop: 4 },
  weeklyChart: { backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  chartTitle: { fontSize: 12, fontWeight: '800', color: Colors.brown, marginBottom: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, justifyContent: 'space-between' },
  chartBarWrap: { alignItems: 'center', flex: 1, gap: 6, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '80%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartDay: { fontSize: 10, fontWeight: '700', color: Colors.mid },
  activityTitle: { fontSize: 13, fontWeight: '800', color: Colors.brown, marginTop: 10 },
  timeline: { backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  tlItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  tlDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tlContent: { flex: 1 },
  tlTitle: { fontSize: 13, fontWeight: '800', color: Colors.brown },
  tlDate: { fontSize: 11, fontWeight: '600', color: Colors.mid, marginTop: 2 },
  tlBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tlBadgeText: { fontSize: 10, fontWeight: '800' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  emptyStateEmoji: { fontSize: 48 },
  emptyStateTitle: { fontSize: 16, fontWeight: '800', color: Colors.brown },
  emptyStateDesc: { fontSize: 13, fontWeight: '600', color: Colors.mid, textAlign: 'center', paddingHorizontal: 20 },
});
