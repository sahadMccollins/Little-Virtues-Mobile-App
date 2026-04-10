import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';
import { useRouter } from 'expo-router';

export default function TeachScreen() {
  const router = useRouter();
  const [complete, setComplete] = useState(false);

  const handleFinish = async () => {
    try {
      const user = await api.get('/user').then(res => res.data);
      if (user && user.children.length > 0) {
        await api.post(`/child/${user.children[0]._id}/activity`, {
           type: 'teaching',
           title: 'Kindness — Session completed (New)',
           stars: 50
        });
        setComplete(true);
        setTimeout(() => {
          setComplete(false);
          router.push('/progress');
        }, 1500);
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (complete) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{fontSize: 80}}>🎉</Text>
        <Text style={{fontSize: 24, fontWeight: 'bold', color: Colors.brown, marginTop: 20}}>Session Complete!</Text>
        <Text style={{fontSize: 16, color: Colors.mid, marginTop: 10}}>+50 Stars Earned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFE4EE', '#EDE4FF']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
            <View style={styles.steps}>
               <View style={[styles.pd, styles.pdOn]} />
               <View style={styles.pd} />
               <View style={styles.pd} />
            </View>
            <Text style={styles.stepLbl}>Step 1</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bigCard}>
         <LinearGradient colors={['#FFD6E7', '#D4FFEA']} style={styles.storyArt}>
           <Text style={{fontSize: 80}}>🐰🌷</Text>
           <View style={styles.forChildBadge}><Text style={styles.fcText}>📱 Show this to your child!</Text></View>
         </LinearGradient>
         <View style={styles.storyBody}>
           <Text style={styles.storyTag}>📖 Kindness — Story</Text>
           <Text style={styles.storyTitle}>Lily's Kind Heart</Text>
           <Text style={styles.storyText}>Lily the rabbit saw her friend Benny crying near the garden gate. She stopped her game and asked softly, "What's wrong, Benny? I'm here."</Text>
         </View>
      </View>

      <LinearGradient colors={['#FFE8F0', '#EDE4FF']} style={styles.readBar}>
         <View style={styles.playBtn}><Text style={{color: 'white', fontSize: 14}}>▶</Text></View>
         <View style={styles.waves}>
           <View style={[styles.wb, {height: 8}]} />
           <View style={[styles.wb, {height: 20}]} />
           <View style={[styles.wb, {height: 12}]} />
           <View style={[styles.wb, {height: 24}]} />
           <View style={[styles.wb, {height: 16}]} />
           <View style={[styles.wb, {height: 28}]} />
           <View style={[styles.wb, {height: 10}]} />
         </View>
         <Text style={styles.readLbl}>Read aloud</Text>
      </LinearGradient>

      <View style={styles.askHint}>
         <Text style={styles.hintText}>💬 <Text style={{fontStyle: 'italic'}}>Ask your child:</Text> "What would you do if your friend was sad?"</Text>
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={handleFinish}>
         <Text style={styles.nextText}>Finish & Earn Stars ✨</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  back: { fontSize: 14, fontWeight: '700', color: Colors.brown },
  steps: { flexDirection: 'row', gap: 6 },
  pd: { width: 24, height: 6, borderRadius: 3, backgroundColor: 'rgba(200, 180, 160, 0.3)' },
  pdOn: { backgroundColor: Colors.lavD },
  stepLbl: { fontSize: 13, fontWeight: '700', color: Colors.mid },
  bigCard: { margin: 16, backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  storyArt: { height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  forChildBadge: { position: 'absolute', bottom: 16, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  fcText: { fontSize: 11, fontWeight: '800', color: Colors.brown },
  storyBody: { padding: 20 },
  storyTag: { fontSize: 11, fontWeight: '800', color: Colors.lavD, textTransform: 'uppercase', letterSpacing: 1 },
  storyTitle: { fontSize: 24, fontWeight: '900', color: Colors.brown, marginVertical: 8 },
  storyText: { fontSize: 15, color: Colors.mid, fontWeight: '600', lineHeight: 24 },
  readBar: { marginHorizontal: 16, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.lavD, alignItems: 'center', justifyContent: 'center' },
  waves: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  wb: { width: 4, borderRadius: 2, backgroundColor: Colors.lav },
  readLbl: { fontSize: 13, fontWeight: '700', color: Colors.mid },
  askHint: { backgroundColor: 'rgba(255,240,220,0.5)', margin: 16, padding: 16, borderRadius: 16 },
  hintText: { fontSize: 14, fontWeight: '700', color: Colors.brown, lineHeight: 22 },
  nextBtn: { backgroundColor: Colors.lavD, marginHorizontal: 16, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  nextText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
