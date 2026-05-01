import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { getDownloads } from '../../services/api';
import * as Linking from 'expo-linking';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDownloads().then(res => {
      setDownloads(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.log('Error fetching downloads:', err);
      setLoading(false);
    });
  }, []);

  const handleDownload = (item: any) => {
    if (!item.file?.url) {
      Alert.alert('File Unavailable', 'This download does not have an attached PDF/File yet.');
      return;
    }
    const fileUrl = `https://original-wonder-3fccc0ad1b.strapiapp.com${item.file.url}`;
    Linking.openURL(fileUrl).catch(e => {
      console.error('Download error:', e);
      Alert.alert('Download Error', 'Could not open the file.');
    });
  };
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFE8CC', '#FFD6B2']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.dlTitle}>📥 Download Centre</Text>
          <Text style={styles.dlSub}>Printable flashcard packs for offline use</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.dlPreview}>
          <Text style={styles.dlPreviewTitle}>⚡ Preview — Bhagavad Gita Flashcards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewCards}>
            <View style={styles.previewCard}>
              <Text style={styles.pcEmoji}>🙏</Text>
              <Text style={styles.pcTag}>Gita</Text>
              <Text style={styles.pcText}>Do your duty with love</Text>
            </View>
            <View style={styles.previewCard}>
              <Text style={styles.pcEmoji}>🌸</Text>
              <Text style={styles.pcTag}>Gita</Text>
              <Text style={styles.pcText}>Act without expecting reward</Text>
            </View>
            <View style={styles.previewCard}>
              <Text style={styles.pcEmoji}>🕊️</Text>
              <Text style={styles.pcTag}>Gita</Text>
              <Text style={styles.pcText}>Stay calm in all situations</Text>
            </View>
          </ScrollView>
        </View>

        <Text style={styles.sectionLbl}>🕉️ Sacred Texts for Kids</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.saffron} style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.list}>
            {downloads.map(item => (
              <View key={item.id} style={styles.packCard}>
                <LinearGradient colors={[item.gradientStart || '#FF9933', item.gradientEnd || '#FF6B35']} style={styles.packStrip} />
                <View style={[styles.packIcon, { backgroundColor: item.color || '#FFF0E0' }]}>
                  <Text style={{ fontSize: 24 }}>{item.icon || '📚'}</Text>
                </View>
                <View style={styles.packInfo}>
                  <Text style={styles.packTitle}>{item.title}</Text>
                  <Text style={styles.packSub}>{item.sub || 'Flashcards · PDF'}</Text>
                  <View style={styles.chipRow}>
                    <View style={[styles.chip, { backgroundColor: item.color || '#FFF0E0' }]}><Text style={[styles.chipText, { color: item.textColor || '#FF6B35' }]}>{item.language || 'English'}</Text></View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.dlBtn, item.btnMode === 'free' ? { backgroundColor: Colors.mintD } : { backgroundColor: Colors.saffron }]}
                  onPress={() => handleDownload(item)}
                >
                  <Text style={{ color: 'white', fontWeight: '800' }}>⬇</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  dlTitle: { fontSize: 22, fontWeight: '900', color: Colors.brown, marginTop: 10 },
  dlSub: { fontSize: 13, color: Colors.mid, fontWeight: '700', marginTop: 4 },
  body: { padding: 16, gap: 16 },
  dlPreview: { backgroundColor: '#FFF3CC', borderRadius: 18, padding: 14 },
  dlPreviewTitle: { fontSize: 12, fontWeight: '800', color: Colors.brown, marginBottom: 12 },
  previewCards: { gap: 10 },
  previewCard: { width: 90, height: 110, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  pcEmoji: { fontSize: 24 },
  pcTag: { fontSize: 9, fontWeight: '800', color: Colors.saffron, textTransform: 'uppercase' },
  pcText: { fontSize: 10, fontWeight: '700', color: Colors.brown, textAlign: 'center' },
  sectionLbl: { fontSize: 12, fontWeight: '800', color: Colors.brown, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10 },
  list: { gap: 12 },
  packCard: { backgroundColor: 'white', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  packStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  packIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  packInfo: { flex: 1 },
  packTitle: { fontSize: 14, fontWeight: '800', color: Colors.brown },
  packSub: { fontSize: 11, color: Colors.mid, fontWeight: '600', marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  chip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 10, fontWeight: '700' },
  dlBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});
