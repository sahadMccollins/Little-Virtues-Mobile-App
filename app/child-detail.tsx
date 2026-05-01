import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getUserWithChildren } from '../services/firestore';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function ChildDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [child, setChild] = useState<any>(null);

  const [teachReminder, setTeachReminder] = useState(false);
  const [teachTime, setTeachTime] = useState(new Date(new Date().setHours(18, 30, 0, 0)));
  const [bedtimeReminder, setBedtimeReminder] = useState(false);
  const [bedtimeTime, setBedtimeTime] = useState(new Date(new Date().setHours(20, 0, 0, 0)));
  const [showTeachPicker, setShowTeachPicker] = useState(false);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);

  useEffect(() => {
    if (user) {
      getUserWithChildren(user.uid).then(d => {
        if (d?.children?.[0]) setChild(d.children[0]);
      });
    }

    // load notification settings
    (async () => {
      await Notifications.requestPermissionsAsync();
      const tRem = await AsyncStorage.getItem('teachReminder');
      const tTime = await AsyncStorage.getItem('teachTime');
      const bRem = await AsyncStorage.getItem('bedtimeReminder');
      const bTime = await AsyncStorage.getItem('bedtimeTime');

      if (tRem === 'true') setTeachReminder(true);
      if (tTime) setTeachTime(new Date(tTime));
      if (bRem === 'true') setBedtimeReminder(true);
      if (bTime) setBedtimeTime(new Date(bTime));
    })();
  }, [user]);

  const scheduleTeachReminder = async (time: Date, enabled: boolean) => {
    await Notifications.cancelScheduledNotificationAsync('teachReminder');
    if (enabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'teachReminder',
        content: { title: "Teaching Time! 📚", body: "It's time for a short lesson with your child." },
        trigger: { hour: time.getHours(), minute: time.getMinutes(), repeats: true } as any,
      });
    }
  };

  const scheduleBedtimeReminder = async (time: Date, enabled: boolean) => {
    await Notifications.cancelScheduledNotificationAsync('bedtimeReminder');
    if (enabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'bedtimeReminder',
        content: { title: "Bedtime Story 🌙", body: "Ready for tonight's bedtime story?" },
        trigger: { hour: time.getHours(), minute: time.getMinutes(), repeats: true } as any,
      });
    }
  };

  const toggleTeachReminder = async () => {
    const newVal = !teachReminder;
    setTeachReminder(newVal);
    await AsyncStorage.setItem('teachReminder', String(newVal));
    scheduleTeachReminder(teachTime, newVal);
  };

  const toggleBedtimeReminder = async () => {
    const newVal = !bedtimeReminder;
    setBedtimeReminder(newVal);
    await AsyncStorage.setItem('bedtimeReminder', String(newVal));
    scheduleBedtimeReminder(bedtimeTime, newVal);
  };

  const onTeachTimeChange = async (event: any, selectedTime?: Date) => {
    setShowTeachPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTeachTime(selectedTime);
      await AsyncStorage.setItem('teachTime', selectedTime.toISOString());
      scheduleTeachReminder(selectedTime, teachReminder);
    }
  };

  const onBedtimeTimeChange = async (event: any, selectedTime?: Date) => {
    setShowBedtimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setBedtimeTime(selectedTime);
      await AsyncStorage.setItem('bedtimeTime', selectedTime.toISOString());
      scheduleBedtimeReminder(selectedTime, bedtimeReminder);
    }
  };

  const formatTime = (d: Date) => {
    let hours = d.getHours();
    let mins = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strMins = mins < 10 ? '0' + mins : mins;
    return `${hours}:${strMins} ${ampm}`;
  };

  const valueBadges = [
    { icon: '💛', name: 'Kindness', bg1: '#FFE4EE', bg2: '#FFB3C6', unlocked: true },
    { icon: '🙏', name: 'Gratitude', bg1: '#EDE4FF', bg2: '#C9B8F0', unlocked: true },
    { icon: '🦁', name: 'Courage', bg1: '#E4F7EE', bg2: '#A8E6CF', unlocked: true },
    { icon: '🌟', name: 'Honesty', bg1: '#FFF3CC', bg2: '#FFE0B2', unlocked: true },
    { icon: '🕊️', name: 'Peace', bg1: '#FFE4EE', bg2: '#FFCBA4', unlocked: true },
    { icon: '🐢', name: 'Patience', bg1: '#E4E8FF', bg2: '#C9D0F0', unlocked: true },
    { icon: '🔒', name: 'Sharing', bg1: '#F0E8D8', bg2: '#F0E8D8', unlocked: false },
    { icon: '🔒', name: 'Respect', bg1: '#F0E8D8', bg2: '#F0E8D8', unlocked: false },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFE4EE', '#FFF3CC']} style={styles.header} start={[0,0]} end={[1,1]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>{child?.name || 'Child'}'s Profile</Text>
            <Text style={{opacity: 0}}>·</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.hero}>
          <View style={styles.heroAvatarWrap}>
            <LinearGradient colors={['#FFE4EE', '#FFF3CC']} style={styles.heroAvatar} start={[0,0]} end={[1,1]}>
              <Text style={{fontSize: 44}}>{child?.avatar || '🧒'}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.heroName}>{child?.name || 'Sophia'}</Text>
          <Text style={styles.heroSub}>Age {child?.age || '6'} · Learning since {child?.createdAt ? new Date(child.createdAt.toDate ? child.createdAt.toDate() : child.createdAt).getFullYear() : new Date().getFullYear()}</Text>
          <View style={styles.heroPills}>
            <View style={[styles.pill, {backgroundColor: '#FFE4EE'}]}><Text style={[styles.pillText, {color: Colors.pinkD}]}>🔥 {child?.streak || 0}-day streak</Text></View>
            <View style={[styles.pill, {backgroundColor: '#FFF3CC'}]}><Text style={[styles.pillText, {color: Colors.gold}]}>⭐ {child?.stars || 0} pts</Text></View>
            <View style={[styles.pill, {backgroundColor: '#E4FFE8'}]}><Text style={[styles.pillText, {color: Colors.mintD}]}>{child?.values || 0} values</Text></View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>🌿 VALUES LEARNED</Text>
          <View style={styles.valuesGrid}>
            {valueBadges.map((v, i) => (
              <View key={i} style={[styles.vItem, v.unlocked ? {} : {opacity: 0.35}]}>
                <LinearGradient colors={[v.bg1, v.bg2]} style={styles.vIconWrap} start={[0,0]} end={[1,1]}>
                  <Text style={styles.vIcon}>{v.icon}</Text>
                </LinearGradient>
                <Text style={styles.vName}>{v.name}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, {marginTop: 10}]}>🏅 ACHIEVEMENTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsRow}>
            <View style={styles.achCard}>
              <Text style={styles.achEmoji}>🏅</Text>
              <Text style={styles.achTitle}>Kind Heart</Text>
              <Text style={styles.achPts}>100 pts</Text>
            </View>
            <View style={styles.achCard}>
              <Text style={styles.achEmoji}>📜</Text>
              <Text style={styles.achTitle}>Certificate</Text>
              <Text style={styles.achPts}>300 pts</Text>
            </View>
            <View style={[styles.achCard, {opacity: 0.4}]}>
              <Text style={styles.achEmoji}>🎁</Text>
              <Text style={styles.achTitle}>Surprise!</Text>
              <Text style={[styles.achPts, {color: Colors.saffron}]}>500 pts</Text>
            </View>
          </ScrollView>

          <Text style={[styles.sectionTitle, {marginTop: 10}]}>🔔 REMINDERS</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={[styles.sIcon, {backgroundColor: '#FFF3CC'}]}><Text>📚</Text></View>
              <View style={styles.sTextWrap}>
                <Text style={styles.sLabel}>Teaching Reminder</Text>
                <TouchableOpacity onPress={() => setShowTeachPicker(true)}>
                  <Text style={[styles.sHint, { color: Colors.lavD }]}>Every day at {formatTime(teachTime)}</Text>
                </TouchableOpacity>
              </View>
              <Switch value={teachReminder} onValueChange={toggleTeachReminder} trackColor={{ false: '#d9d9d9', true: Colors.mintD }} />
            </View>
            <View style={[styles.settingRow, {borderBottomWidth: 0}]}>
              <View style={[styles.sIcon, {backgroundColor: '#E4F7EE'}]}><Text>🌙</Text></View>
              <View style={styles.sTextWrap}>
                <Text style={styles.sLabel}>Bedtime Story Alert</Text>
                <TouchableOpacity onPress={() => setShowBedtimePicker(true)}>
                  <Text style={[styles.sHint, { color: Colors.lavD }]}>Every night at {formatTime(bedtimeTime)}</Text>
                </TouchableOpacity>
              </View>
              <Switch value={bedtimeReminder} onValueChange={toggleBedtimeReminder} trackColor={{ false: '#d9d9d9', true: Colors.mintD }} />
            </View>
          </View>
          
          {showTeachPicker && (
            <DateTimePicker value={teachTime} mode="time" display="default" onChange={onTeachTimeChange} />
          )}
          {showBedtimePicker && (
            <DateTimePicker value={bedtimeTime} mode="time" display="default" onChange={onBedtimeTimeChange} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  backBtn: { fontSize: 15, fontWeight: '700', color: Colors.brown },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.brown },
  hero: { alignItems: 'center', paddingHorizontal: 20, marginTop: 24, gap: 6 },
  heroAvatarWrap: { marginBottom: 4 },
  heroAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  heroName: { fontSize: 24, fontWeight: '900', color: Colors.brown },
  heroSub: { fontSize: 13, fontWeight: '700', color: Colors.mid },
  heroPills: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  pillText: { fontSize: 11, fontWeight: '800' },
  body: { paddingHorizontal: 16, marginTop: 24, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.brown, letterSpacing: 0.8, marginBottom: 2 },
  valuesGrid: { backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, justifyContent: 'space-between' },
  vItem: { width: '22%', alignItems: 'center', gap: 6, marginBottom: 14 },
  vIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  vIcon: { fontSize: 22 },
  vName: { fontSize: 10, fontWeight: '800', color: Colors.brown, textAlign: 'center' },
  achievementsRow: { gap: 12, paddingBottom: 8 },
  achCard: { width: 90, backgroundColor: 'white', borderRadius: 16, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  achEmoji: { fontSize: 32 },
  achTitle: { fontSize: 12, fontWeight: '800', color: Colors.brown, marginTop: 8 },
  achPts: { fontSize: 11, fontWeight: '700', color: Colors.mid, marginTop: 2 },
  settingsList: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5EDE5' },
  sIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sTextWrap: { flex: 1 },
  sLabel: { fontSize: 15, fontWeight: '800', color: Colors.brown },
  sHint: { fontSize: 12, fontWeight: '600', color: Colors.mid, marginTop: 2 },
  sToggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.mintD, position: 'relative' },
  sToggleKnob: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
});
