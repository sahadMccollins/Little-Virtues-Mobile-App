import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUserWithChildren, updateUserProfile } from '../../services/firestore';
import { useRevenueCat } from '../../context/RevenueCatProvider';

export default function ProfileScreen() {
  const { user, logout, bedtimeMode } = useAuth();
  const { isPro, presentCustomerCenter, presentPaywall } = useRevenueCat();
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    if (!user) return;
    try {
      const fetchedUser = await getUserWithChildren(user.uid);
      setUserData(fetchedUser);
    } catch (err) {
      console.log("Error loading user profile", err);
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

  const child = userData?.children?.[0]; // Support multiple in future via map

  const toggleBedtimeMode = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { bedtimeMode: !bedtimeMode });
    } catch (e) {
      console.log('Failed to toggle bedtime mode', e);
    }
  };

  const handleRequiresAuth = (callback: () => void) => {
    if (!user || user.isAnonymous) {
      Alert.alert(
        'Account Required',
        'Please sign in or create an account to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => {
              logout();
              router.replace('/');
          } }
        ]
      );
      return;
    }
    callback();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <LinearGradient colors={['#EDE4FF', '#FFE4EE']} style={styles.profileTop} start={[0, 0]} end={[1, 1]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.profileTopRow}>
              <Text style={styles.profileTopTitle}>My Profile</Text>
              <TouchableOpacity style={styles.settingsBtn} onPress={logout}>
                <Text style={{ fontSize: 16 }}>🚪</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.avatarSection}>
              <View style={styles.bigAvatar}>
                {userData?.avatar?.startsWith('http') ? (
                  <Image source={{ uri: userData.avatar }} style={{width: 74, height: 74, borderRadius: 37}} />
                ) : (
                  <Text style={{fontSize: 36}}>{userData?.avatar || '👩'}</Text>
                )}
                <View style={styles.avatarEdit}><Text style={{ fontSize: 10 }}>✏️</Text></View>
              </View>
              <Text style={styles.parentNameBig}>{userData?.displayName || user?.email || 'Guest'}</Text>
              <Text style={styles.parentSince}>Parent · Member since {userData?.createdAt ? new Date(userData.createdAt.toDate ? userData.createdAt.toDate() : userData.createdAt).getFullYear() : new Date().getFullYear()}</Text>
              <View style={styles.parentPlanBadge}>
                {isPro ? (
                  <LinearGradient colors={[Colors.saffron, '#FF6B35']} style={styles.badgeBg} start={[0, 0]} end={[1, 1]}>
                    <Text style={styles.badgeText}>✨ Family Pro Plan</Text>
                  </LinearGradient>
                ) : (
                  <TouchableOpacity onPress={() => handleRequiresAuth(presentPaywall)}>
                    <LinearGradient colors={['#A8E6CF', '#3BC18A']} style={styles.badgeBg} start={[0, 0]} end={[1, 1]}>
                      <Text style={styles.badgeText}>Unlock Family Pro →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.profileBody}>
          <Text style={styles.sectionTitle}>👶 MY CHILDREN</Text>

          {child && (
            <TouchableOpacity style={styles.childProfileCard} onPress={() => router.push('/child-detail')}>
              <View style={styles.cpAvatar}><Text style={{ fontSize: 24 }}>{child.avatar || '🧒'}</Text></View>
              <View style={styles.cpInfo}>
                <Text style={styles.cpName}>{child.name}</Text>
                <Text style={styles.cpMeta}>🔥 {child.streak || 0}-day streak · {child.values || 0} values</Text>
                <View style={styles.cpTags}>
                  <View style={[styles.cpTag, { backgroundColor: '#FFE4EE' }]}><Text style={[styles.cpTagText, { color: Colors.pinkD }]}>Active</Text></View>
                  <View style={[styles.cpTag, { backgroundColor: '#FFF3CC' }]}><Text style={[styles.cpTagText, { color: Colors.gold }]}>⭐ {child.stars || 0} pts</Text></View>
                </View>
              </View>
              <Text style={styles.cpArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.addChildBtn} 
            onPress={() => handleRequiresAuth(() => router.push('/add-child' as any))}
          >
            <View style={styles.addIcon}><Text style={{ fontSize: 16 }}>➕</Text></View>
            <Text style={styles.addText}>Add another child</Text>
          </TouchableOpacity>

          <LinearGradient colors={['#2D1B6B', '#4A2B9B']} style={styles.subCard} start={[0, 0]} end={[1, 1]}>
            <View style={styles.subRow}>
              <View>
                <Text style={styles.subLabel}>CURRENT PLAN</Text>
                <Text style={styles.subPlan}>{isPro ? 'Family Pro ✨' : 'Basic Plan'}</Text>
                {isPro && <Text style={styles.subRenew}>Renews automatically</Text>}
              </View>
              <View style={styles.subBadge}><Text style={styles.subBadgeText}>{isPro ? 'Active' : 'Free'}</Text></View>
            </View>
            <View style={styles.subFeatures}>
              <View style={styles.subFeat}><Text style={styles.subFeatText}>Unlimited stories</Text></View>
              <View style={styles.subFeat}><Text style={styles.subFeatText}>All packs</Text></View>
              <View style={styles.subFeat}><Text style={styles.subFeatText}>3 children</Text></View>
              <View style={styles.subFeat}><Text style={styles.subFeatText}>Offline</Text></View>
            </View>
            {isPro ? (
              <TouchableOpacity style={styles.manageSubBtn} onPress={presentCustomerCenter}>
                <Text style={styles.manageSubText}>Manage Subscription →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.manageSubBtn, { backgroundColor: Colors.saffron, borderColor: Colors.saffron }]} onPress={() => handleRequiresAuth(presentPaywall)}>
                <Text style={styles.manageSubText}>Upgrade to Pro →</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>⚙️ PREFERENCES</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingRow} onPress={() => handleRequiresAuth(() => router.push('/profile-edit'))}>
              <View style={[styles.sIcon, { backgroundColor: '#FFE4EE' }]}><Text>✏️</Text></View>
              <View style={styles.sTextWrap}>
                <Text style={styles.sLabel}>Edit Profile</Text>
                <Text style={styles.sHint}>Change name, child details</Text>
              </View>
              <Text style={styles.sArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={toggleBedtimeMode} activeOpacity={0.8}>
              <View style={[styles.sIcon, { backgroundColor: '#EDE4FF' }]}><Text>🌙</Text></View>
              <View style={styles.sTextWrap}>
                <Text style={styles.sLabel}>Bedtime Mode</Text>
                <Text style={styles.sHint}>Auto-dims at 8:00 PM</Text>
              </View>
              <View style={[styles.sToggle, bedtimeMode ? {} : styles.sToggleOff]}>
                <View style={[styles.sToggleKnob, bedtimeMode ? {} : styles.sToggleKnobOff]} />
              </View>
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={[styles.sIcon, { backgroundColor: '#E4FFE8' }]}><Text>🌍</Text></View>
              <View style={styles.sTextWrap}>
                <Text style={styles.sLabel}>Language</Text>
              </View>
              <Text style={styles.sValue}>English</Text>
              <Text style={styles.sArrow}>›</Text>
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={logout}>
              <View style={[styles.sIcon, { backgroundColor: '#FFF3CC' }]}><Text>🚪</Text></View>
              <View style={styles.sTextWrap}>
                <Text style={styles.sLabel}>Log Out</Text>
              </View>
              <Text style={styles.sArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  profileTop: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  profileTopTitle: { fontSize: 20, fontWeight: '900', color: Colors.brown },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  avatarSection: { alignItems: 'center', marginTop: 12, gap: 4 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, borderWidth: 3, borderColor: 'white', position: 'relative' },
  avatarEdit: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, backgroundColor: Colors.lavD, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  parentNameBig: { fontSize: 22, fontWeight: '900', color: Colors.brown, marginTop: 4 },
  parentSince: { fontSize: 13, fontWeight: '700', color: Colors.mid },
  parentPlanBadge: { marginTop: 6 },
  badgeBg: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '800' },
  profileBody: { padding: 16, gap: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.brown, letterSpacing: 0.8, marginBottom: 2 },
  childProfileCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderColor: '#f0e8e0', borderWidth: 1 },
  cpAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFE4EE', alignItems: 'center', justifyContent: 'center' },
  cpInfo: { flex: 1 },
  cpName: { fontSize: 16, fontWeight: '900', color: Colors.brown },
  cpMeta: { fontSize: 12, fontWeight: '700', color: Colors.mid, marginTop: 2 },
  cpTags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  cpTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cpTagText: { fontSize: 10, fontWeight: '800' },
  cpArrow: { fontSize: 24, color: Colors.mid, paddingHorizontal: 10 },
  addChildBtn: { backgroundColor: 'white', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderStyle: 'dashed', borderColor: '#D4C4B4', borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8 },
  addIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5EDE5', alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 14, fontWeight: '800', color: Colors.mid },
  subCard: { borderRadius: 16, padding: 16, overflow: 'hidden' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(200,184,240,0.8)', letterSpacing: 1 },
  subPlan: { fontSize: 20, fontWeight: '900', color: 'white' },
  subRenew: { fontSize: 12, fontWeight: '700', color: 'rgba(200,184,240,0.7)', marginTop: 4 },
  subBadge: { backgroundColor: Colors.saffron, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  subBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  subFeatures: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  subFeat: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subFeatText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  manageSubBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  manageSubText: { color: 'white', fontSize: 13, fontWeight: '800' },
  settingsList: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5EDE5' },
  sIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sTextWrap: { flex: 1 },
  sLabel: { fontSize: 15, fontWeight: '800', color: Colors.brown },
  sHint: { fontSize: 12, fontWeight: '600', color: Colors.mid, marginTop: 2 },
  sValue: { fontSize: 13, fontWeight: '700', color: Colors.mid, marginRight: 8 },
  sArrow: { fontSize: 18, color: '#D4C4B4' },
  sToggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.mintD, position: 'relative' },
  sToggleOff: { backgroundColor: '#D4C4B4' },
  sToggleKnob: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
  sToggleKnobOff: { right: 'auto', left: 2 },
});
