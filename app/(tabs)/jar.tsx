import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getUserWithChildren } from '../../services/firestore';

export default function JarScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await getUserWithChildren(user.uid);
      setUserData(data);
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

  const child = userData?.children?.[0];
  const stars = child?.stars || 0;
  const progressRatio = Math.min((stars / 500) * 100, 100);

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <LinearGradient colors={['#FFF3CC', '#FFE0B2']} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.jarTitle}>🫙 {child?.name || 'Your'}'s Virtues Jar</Text>
            <Text style={styles.jarSub}>Earn stars by learning values every day</Text>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Jar UI (Simplified composed views) */}
          <View style={styles.jarContainer}>
            <LinearGradient colors={['#D4A017', '#B8861A']} style={styles.jarLid} />
            <View style={styles.jarGlass}>
              <LinearGradient colors={['#FFD166', '#FFAD0D']} style={[styles.jarFill, { height: `${progressRatio}%` }]} />
              <View style={styles.jarStars}>
                <Text style={styles.jstar}>⭐</Text>
                <Text style={styles.jstar}>⭐</Text>
                <Text style={styles.jstar}>⭐</Text>
              </View>
            </View>
            <Text style={styles.jarPts}>{stars} ⭐</Text>
            <Text style={styles.jarPtsLabel}>stars collected</Text>
          </View>

          <View style={styles.jarProgressRow}>
            <Text style={styles.jpTitle}>🎁 Next reward at 500 stars</Text>
            <View style={styles.progBarBg}>
              <LinearGradient colors={[Colors.butterD, Colors.saffron]} style={[styles.progBarFill, {width: `${progressRatio}%`}]} start={[0,0]} end={[1,0]} />
            </View>
            <View style={styles.jpMeta}>
              <Text style={{fontSize: 12, color: Colors.mid, fontWeight: '700'}}>{stars} stars</Text>
              <Text style={{fontSize: 12, color: Colors.mid, fontWeight: '700'}}>{Math.max(500 - stars, 0)} to go!</Text>
            </View>
          </View>

          <View style={styles.rewardsRow}>
            <View style={styles.rewardChip}>
              <Text style={styles.rcEmoji}>🏅</Text>
              <Text style={styles.rcLabel}>Kind Heart Badge</Text>
              <Text style={styles.rcPts}>100 ⭐ — {stars >= 100 ? 'Done' : 'Soon'}</Text>
            </View>
            <View style={styles.rewardChip}>
              <Text style={styles.rcEmoji}>📜</Text>
              <Text style={styles.rcLabel}>Print Certificate</Text>
              <Text style={styles.rcPts}>300 ⭐ — {stars >= 300 ? 'Done' : 'Soon'}</Text>
            </View>
            <View style={[styles.rewardChip, {opacity: stars >= 500 ? 1 : 0.5}]}>
              <Text style={styles.rcEmoji}>🎁</Text>
              <Text style={styles.rcLabel}>Surprise Pack</Text>
              <Text style={styles.rcPts}>500 ⭐ — Soon</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.earnMoreBtn}>
            <Text style={styles.earnMoreText}>+ Earn more stars today ✨</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  jarTitle: { fontSize: 22, fontWeight: '900', color: Colors.brown, marginTop: 10 },
  jarSub: { fontSize: 13, color: Colors.mid, fontWeight: '700', marginTop: 4 },
  body: { padding: 16, alignItems: 'center', gap: 20 },
  jarContainer: { alignItems: 'center', marginVertical: 20 },
  jarLid: { width: 150, height: 26, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: -2, zIndex: 2 },
  jarGlass: { width: 180, height: 220, backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(212, 160, 23, 0.4)', borderWidth: 4, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  jarFill: { position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.8 },
  jarStars: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  jstar: { fontSize: 24 },
  jarPts: { fontSize: 28, fontWeight: '900', color: Colors.brown, marginTop: 16 },
  jarPtsLabel: { fontSize: 12, color: Colors.mid, fontWeight: '700' },
  jarProgressRow: { width: '100%', backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  jpTitle: { fontSize: 13, fontWeight: '800', color: Colors.brown, marginBottom: 12 },
  progBarBg: { backgroundColor: '#F0E8D8', borderRadius: 10, height: 12, overflow: 'hidden' },
  progBarFill: { height: '100%', borderRadius: 10 },
  jpMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rewardsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10 },
  rewardChip: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  rcEmoji: { fontSize: 28 },
  rcLabel: { fontSize: 10, fontWeight: '700', color: Colors.brown, textAlign: 'center', marginVertical: 4 },
  rcPts: { fontSize: 10, fontWeight: '800', color: Colors.saffron },
  earnMoreBtn: { width: '100%', backgroundColor: Colors.saffron, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  earnMoreText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
