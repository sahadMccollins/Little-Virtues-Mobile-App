import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { getStories, getBedtimeCategories } from '../../services/api';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export default function StoriesScreen() {
  const [stories, setStories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All ✨');
  const [loading, setLoading] = useState(true);

  // Audio States
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);

  // Cleanup audio safely
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    return soundObj ? () => { soundObj.unloadAsync(); } : undefined;
  }, [soundObj]);

  useEffect(() => {
    Promise.all([getStories(), getBedtimeCategories()]).then(([sData, cData]) => {
      setStories(sData.data || []);
      setCategories(cData.data || []);
      setLoading(false);
    }).catch(err => {
      console.log('Error fetching stories data:', err);
      setLoading(false);
    });
  }, []);

  const featuredStory = stories.find(s => s.isFeatured) || stories[0];
  const filteredStories = activeCategory === 'All ✨'
    ? stories.filter(s => s.id !== featuredStory?.id)
    : stories.filter(s => {
      if (!s.categoryName) return false;
      return activeCategory.toLowerCase().includes(s.categoryName.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase());
    });

  const togglePlay = async (story: any) => {
    if (playingId === story.id) {
      if (soundObj) {
        await soundObj.stopAsync();
        await soundObj.unloadAsync();
      }
      setPlayingId(null);
      setSoundObj(null);
      return;
    }

    if (!story.audioFile?.url) {
      Alert.alert('No Audio', 'This story does not have an MP3 attached yet.');
      return;
    }

    try {
      if (soundObj) await soundObj.unloadAsync();

      const audioUrl = `https://original-wonder-3fccc0ad1b.strapiapp.com${story.audioFile.url}`;
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSoundObj(sound);
      setPlayingId(story.id);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.log("Audio Error:", e);
      Alert.alert('Playback Error', 'Could not stream the story audio.');
    }
  };

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
          <TouchableOpacity onPress={() => setActiveCategory('All ✨')}>
            <View style={[styles.moodChip, activeCategory === 'All ✨' && styles.moodChipOn]}>
              <Text style={activeCategory === 'All ✨' ? styles.moodTextOn : styles.moodTextOff}>All ✨</Text>
            </View>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.name)}>
              <View style={[styles.moodChip, activeCategory === cat.name && styles.moodChipOn]}>
                <Text style={activeCategory === cat.name ? styles.moodTextOn : styles.moodTextOff}>{cat.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.lavD} style={{ marginTop: 40 }} />
        ) : (
          <>
            {featuredStory && activeCategory === 'All ✨' && (
              <View style={styles.featuredCard}>
                <LinearGradient colors={[featuredStory.colorStart || '#1A1040', featuredStory.colorEnd || '#2D1B6B']} style={styles.btArt}>
                  <Text style={{ fontSize: 60 }}>{featuredStory.icon}</Text>
                </LinearGradient>
                <View style={[styles.btInfo, { flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.btStoryTag}>🌟 Featured Tonight</Text>
                    <Text style={styles.btStoryName}>{featuredStory.title}</Text>
                    <Text style={styles.btStoryMeta}>{featuredStory.categoryName} · <Text style={{ color: Colors.mint }}>{featuredStory.duration} min</Text> · Ages {featuredStory.ageRange}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.playBtn, { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.lavD }]}
                    onPress={() => togglePlay(featuredStory)}
                  >
                    <Text style={{ color: 'white', fontSize: playingId === featuredStory.id ? 14 : 18, marginLeft: playingId === featuredStory.id ? 0 : 4 }}>
                      {playingId === featuredStory.id ? '⏸️' : '▶'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.list}>
              {filteredStories.map(story => (
                <View key={story.id} style={styles.listItem}>
                  <LinearGradient colors={[story.colorStart || '#2D1B6B', story.colorEnd || '#4A2B9B']} style={styles.listArt}>
                    <Text style={{ fontSize: 24 }}>{story.icon}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{story.title}</Text>
                    <Text style={styles.listMeta}>{story.categoryName} · {story.duration} min · Ages {story.ageRange}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => togglePlay(story)}
                  >
                    <Text style={{ color: Colors.lav, fontSize: playingId === story.id ? 10 : 12 }}>
                      {playingId === story.id ? '⏸️' : '▶'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
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
