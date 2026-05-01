import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getUserWithChildren, updateUserProfile, updateChildProfile, uploadProfileImageAsync } from '../services/firestore';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, resetPassword, deleteAccount, logout } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  const [parentName, setParentName] = useState('');
  const [parentAvatar, setParentAvatar] = useState('👩');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childReligion, setChildReligion] = useState('');
  const [childAvatar, setChildAvatar] = useState('🧒');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      getUserWithChildren(user.uid).then((d: any) => {
        setUserData(d);
        if (d) {
          setParentName(d.displayName || '');
          setParentAvatar(d.avatar || '👩');
          setPhone(d.phone || '');
          if (d.children?.length > 0) {
            const c = d.children[0];
            setChildName(c.name || '');
            setChildAge(c.age || '');
            setChildReligion(c.religion || '');
            setChildAvatar(c.avatar || '🧒');
          }
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: parentName, phone: phone, avatar: parentAvatar });
      const child = userData?.children?.[0];
      if (child) {
        await updateChildProfile(user.uid, child._id, {
          name: childName,
          age: childAge,
          religion: childReligion,
          avatar: childAvatar
        });
      }
      router.back();
    } catch (e) {
      console.log(e);
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      Alert.alert('Email Sent', 'A password reset link has been sent to your email.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send reset email.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e: any) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'For security reasons, please log out and log back in before deleting your account.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log Out', onPress: () => { logout(); router.replace('/'); } }
                  ]
                );
              } else {
                Alert.alert('Error', e.message || 'Failed to delete account.');
              }
            }
          }
        }
      ]
    );
  };

  const avatars = ['🧒', '👧', '🦊', '🐰', '🦋', '🌸'];
  const parentAvatars = ['👩', '👨', '🧑', '👵', '👴', '🧕'];

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && user) {
      setSaving(true);
      try {
        const downloadUrl = await uploadProfileImageAsync(user.uid, result.assets[0].uri);
        setParentAvatar(downloadUrl);
      } catch (err) {
        alert("Failed to upload image.");
        console.log(err);
      }
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EDE4FF', '#FFE4EE']} style={styles.editHeader} start={[0, 0]} end={[1, 1]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.editNav}>
            <TouchableOpacity onPress={() => router.back()} disabled={saving}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtn}>{saving ? 'Saving...' : 'Save ✓'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.editAvatarSection}>
          <View style={styles.editBigAvatar}>
            {parentAvatar.startsWith('http') ? (
              <Image source={{ uri: parentAvatar }} style={{ width: 84, height: 84, borderRadius: 42 }} />
            ) : (
              <Text style={{ fontSize: 40 }}>{parentAvatar}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handlePickImage} disabled={saving}>
            <Text style={styles.changePhoto}>📷 Change photo</Text>
          </TouchableOpacity>
          <View style={[styles.ceAvatarRow, { marginTop: 10, marginBottom: 0 }]}>
            {parentAvatars.map(a => (
              <TouchableOpacity
                key={a}
                onPress={() => setParentAvatar(a)}
                style={[styles.ceAvOption, parentAvatar === a && styles.ceAvOptionSel]}
              >
                <Text style={{ fontSize: 20 }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.editBody}>
          <Text style={styles.sectionTitle}>👩 PARENT DETAILS</Text>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.fieldVal} value={parentName} onChangeText={setParentName} placeholder="E.g. John Doe" />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={[styles.fieldVal, { fontSize: 12, color: Colors.mid }]}>{userData?.email || 'johndoe@gmail.com'}</Text>
            </View>
            <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.fieldVal} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>🧒 CHILD PROFILE</Text>
          <View style={styles.childEditCard}>
            <View style={styles.ceHeader}>
              <Text style={{ fontSize: 24 }}>{childAvatar}</Text>
              <Text style={styles.ceTitle}>{childName || 'Child'}</Text>
              <TouchableOpacity><Text style={styles.ceDelete}>Remove</Text></TouchableOpacity>
            </View>
            <Text style={styles.avatarLabel}>Choose avatar</Text>
            <View style={styles.ceAvatarRow}>
              {avatars.map(a => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setChildAvatar(a)}
                  style={[styles.ceAvOption, childAvatar === a && styles.ceAvOptionSel]}
                >
                  <Text style={{ fontSize: 20 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ceFields}>
              <View style={styles.ceField}>
                <Text style={styles.ceFieldLabel}>Name</Text>
                <TextInput style={styles.ceFieldVal} value={childName} onChangeText={setChildName} placeholder="Child's name" />
              </View>
              <View style={styles.ceField}>
                <Text style={styles.ceFieldLabel}>Age</Text>
                <TextInput style={styles.ceFieldVal} value={childAge} onChangeText={setChildAge} placeholder="E.g. 6 years" />
              </View>
              <View style={styles.ceField}>
                <Text style={styles.ceFieldLabel}>Religion</Text>
                <TextInput style={styles.ceFieldVal} value={childReligion} onChangeText={setChildReligion} placeholder="E.g. Hindu" />
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>🌍 APP LANGUAGE</Text>
          <View style={styles.langSection}>
            <TouchableOpacity style={styles.langRow}>
              <Text style={styles.langFlag}>🇬🇧</Text>
              <Text style={styles.langName}>English</Text>
              <Text style={styles.langCheck}>✅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.langRow} activeOpacity={0.8}>
              <Text style={styles.langFlag}>🇮🇳</Text>
              <Text style={styles.langName}>Hindi · हिन्दी</Text>
              <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>SOON</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langRow, { borderBottomWidth: 0 }]} activeOpacity={0.8}>
              <Text style={styles.langFlag}>🇸🇦</Text>
              <Text style={styles.langName}>Arabic · عربي</Text>
              <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>SOON</Text></View>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleChangePassword}>
              <Text style={[styles.dangerBtnText, { color: Colors.saffron }]}>🔑 Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
              <Text style={[styles.dangerBtnText, { color: Colors.pinkD }]}>🗑 Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  editHeader: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  editNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  backBtn: { fontSize: 15, fontWeight: '700', color: Colors.brown },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.brown },
  saveBtn: { fontSize: 15, fontWeight: '800', color: Colors.lavD },
  editAvatarSection: { alignItems: 'center', marginVertical: 20, gap: 8 },
  editBigAvatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, borderWidth: 3, borderColor: 'white' },
  changePhoto: { fontSize: 13, fontWeight: '800', color: Colors.lavD },
  editBody: { paddingHorizontal: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.brown, letterSpacing: 0.8, marginBottom: 2 },
  fieldGroup: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5EDE5', gap: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: Colors.mid, width: 60 },
  fieldVal: { fontSize: 15, fontWeight: '700', color: Colors.brown, flex: 1, padding: 0 },
  childEditCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  ceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  ceTitle: { fontSize: 16, fontWeight: '900', color: Colors.brown, flex: 1 },
  ceDelete: { fontSize: 12, fontWeight: '800', color: Colors.pinkD },
  avatarLabel: { fontSize: 11, fontWeight: '700', color: Colors.mid, marginBottom: 8 },
  ceAvatarRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ceAvOption: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5EDE5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  ceAvOptionSel: { borderColor: Colors.lavD },
  ceFields: { backgroundColor: '#FFF9F4', borderRadius: 12, overflow: 'hidden' },
  ceField: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8E0', gap: 10 },
  ceFieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.mid, width: 60 },
  ceFieldVal: { fontSize: 14, fontWeight: '800', color: Colors.brown, flex: 1, padding: 0 },
  langSection: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5EDE5', gap: 12 },
  langFlag: { fontSize: 24 },
  langName: { fontSize: 14, fontWeight: '800', color: Colors.brown, flex: 1 },
  langCheck: { fontSize: 16, color: Colors.mintD },
  comingSoonBadge: { backgroundColor: '#F5EDE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  comingSoonText: { fontSize: 9, fontWeight: '800', color: Colors.mid },
  dangerZone: { marginTop: 10, gap: 10 },
  dangerBtn: { backgroundColor: 'white', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  dangerBtnText: { fontSize: 14, fontWeight: '800' }
});
