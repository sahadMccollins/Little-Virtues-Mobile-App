import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUserWithChildren, completeSession, addActivity } from '../../services/firestore';
import { getValueById, getValues } from '../../services/api';
import { logEvent } from '../../services/analytics';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useRevenueCat } from '../../context/RevenueCatProvider';

export default function TeachScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, logout } = useAuth();
  const { isPro, presentPaywall } = useRevenueCat();

  const handleRequiresAuth = (callback: () => void) => {
    if (!user || user.isAnonymous) {
      Alert.alert(
        'Account Required',
        'Please sign in or create an account to upgrade to Little Virtues Pro.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In', onPress: () => {
              logout();
              router.replace('/');
            }
          }
        ]
      );
      return;
    }
    callback();
  };

  const [loading, setLoading] = useState(true);
  let [valueData, setValueData] = useState<any>(null);
  const [childId, setChildId] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [statsObj, setStatsObj] = useState<any>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [continueAnyway, setContinueAnyway] = useState(false);
  const [allLessonsComplete, setAllLessonsComplete] = useState(false);

  // Flow State
  const [stepIndex, setStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [storyPageIndex, setStoryPageIndex] = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);

  // Dynamic Flow Generation
  const flowSteps = useMemo(() => {
    if (!valueData) return [];
    const steps = [];
    if (valueData.story) steps.push('story');
    if (valueData.flashcards?.length > 0) steps.push('flashcards');
    if (valueData.actionTask && valueData.actionTask.trim() !== '') steps.push('actionTask');
    if (valueData.reflectionQuestion && valueData.reflectionQuestion.trim() !== '') steps.push('reflection');
    return steps;
  }, [valueData]);

  // Audio States
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(1);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    return soundObj ? () => { soundObj.unloadAsync(); } : undefined;
  }, [soundObj]);

  const stopAudio = async () => {
    if (soundObj) {
      await soundObj.stopAsync();
      setIsPlaying(false);
    }
  };

  const playAudio = async (url: string | undefined | null) => {
    if (isPlaying) {
      if (soundObj) {
        await soundObj.pauseAsync();
        setIsPlaying(false);
      }
      return;
    }

    if (soundObj) {
      await soundObj.playAsync();
      setIsPlaying(true);
      return;
    }

    if (!url) {
      Alert.alert('No Audio', 'No narration is available for this page.');
      return;
    }

    try {
      const audioUrl = url.startsWith('http') ? url : `https://original-wonder-3fccc0ad1b.strapiapp.com${url}`;
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSoundObj(sound);
      setIsPlaying(true);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis || 0);
          setDurationMillis(status.durationMillis || 1);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPositionMillis(0);
            sound.setPositionAsync(0);
          }
        }
      });
    } catch (e) {
      console.log("Audio Error:", e);
      Alert.alert('Playback Error', 'Could not stream the audio.');
    }
  };

  useEffect(() => {
    setStartTime(Date.now());
    loadValueData(id);
  }, [id]);

  const loadValueData = async (valueId?: any) => {
    try {
      let dbUser: any = null;
      let child: any = null;

      if (user) {
        dbUser = await getUserWithChildren(user.uid);
        child = dbUser?.children?.[0];
        if (child) {
          setChildId(child._id);
          if (child.lastSessionDate) {
            const lastDate = child.lastSessionDate.toDate ? child.lastSessionDate.toDate() : new Date(child.lastSessionDate);
            if (lastDate.toDateString() === new Date().toDateString()) {
              setCompletedToday(true);
            }
          }
        }
      }

      let val = null;
      if (valueId) {
        const vData = await getValueById(valueId as string);
        val = vData?.data;
      } else {
        const valRes = await getValues();
        let stValues = valRes.data || [];
        stValues.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        if (child) {
          const comp = child.completedValues || [];
          const unplayed = stValues.filter((v: any) => !comp.includes(v.id) && !comp.includes(v.documentId));
          val = unplayed.length > 0 ? unplayed[0] : null;
        } else {
          val = stValues[0];
        }
      }

      if (val) {
        logEvent('session_started', { valueId: val.id });
        setValueData(val);
        if (!val.isFree && !isPro && !dbUser?.isPremium) {
          let unlocked = dbUser?.unlockedPacks || [];
          if (!unlocked.includes(val.pack?.documentId || val.pack?.id)) {
            setIsLocked(true);
            logEvent('upgrade_prompt_shown', { valueId: val.id });
            if (user && !user.isAnonymous) {
              presentPaywall();
            }
          }
        }
      } else if (!valueId) {
        setAllLessonsComplete(true);
      }
      setLoading(false);
    } catch (e) {
      console.log('Error fetching teaching value', e);
      setLoading(false);
    }
  };

  const currentStepString = flowSteps[stepIndex];

  const handleSeek = async (value: number) => {
    if (soundObj) {
      await soundObj.setPositionAsync(value);
      setPositionMillis(value);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleNextStep = () => {
    if (stepIndex < flowSteps.length - 1) {
      logEvent('session_step_completed', { valueId: id, step: stepIndex + 1 });
      stopAudio();
      setSoundObj(null);
      setStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0 && !isCompleted) {
      stopAudio();
      setSoundObj(null);
      setStepIndex(prev => prev - 1);
      return;
    }

    if (!isCompleted) {
      Alert.alert('Exit Session?', 'Are you sure? Your progress will be saved.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit', style: 'destructive', onPress: () => {
            logEvent('session_abandoned', { valueId: id, atStep: stepIndex + 1 });
            stopAudio();
            router.back();
          }
        }
      ]);
    } else {
      stopAudio();
      router.back();
    }
  };

  const handleFinish = async () => {
    if (!valueData) return;
    try {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      let stat = null;

      if (user && childId) {
        stat = await completeSession(user.uid, childId, valueData.id, duration);
        if (stat) {
          logEvent('session_completed', { valueId: valueData.id, durationSeconds: duration, isRepeat: stat.isRepeat });
          if (!stat.isRepeat) {
            logEvent('streak_updated', { newLength: stat.newLength, previousLength: stat.previousLength });
          }

          // Add the session to the child's activity timeline even if it's a repeat
          await addActivity(user.uid, childId, {
            type: 'session',
            title: valueData.title || 'Completed Session',
            stars: stat.isRepeat ? 10 : 50,
            valueId: valueData.id,
            duration: duration,
            isRepeat: stat.isRepeat || false
          });
        }
      }

      logEvent('session_step_completed', { valueId: id, step: flowSteps.length });

      setStatsObj(stat || { newLength: 0 });
      stopAudio();
      setIsCompleted(true);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.lavD} />
      </View>
    );
  }

  if (completedToday && !continueAnyway) {
    return (
      <LinearGradient colors={['#E4F7EE', '#C8EFDF']} style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 80 }}>🌟</Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.brown, textAlign: 'center', marginVertical: 20 }}>Daily Goal Met!</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', color: Colors.mid, marginBottom: 40 }}>You have already completed a teaching session today. Great job!</Text>
        <TouchableOpacity style={[styles.nextBtn, { width: '100%', marginBottom: 16, backgroundColor: Colors.sage }]} onPress={() => setContinueAnyway(true)}>
          <Text style={styles.nextText}>Review Anyway</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 10 }} onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: Colors.brown, fontWeight: '700' }}>← Return Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (isLocked && !isPro) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 70 }}>🔒</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.brown, textAlign: 'center', marginVertical: 20 }}>Premium Access</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', color: Colors.mid, marginBottom: 40 }}>This session requires Little Virtues Pro. Subscribe to unlock unlimited access!</Text>
        <TouchableOpacity onPress={() => handleRequiresAuth(presentPaywall)} style={{ width: '100%', marginBottom: 16 }}>
          <LinearGradient colors={['#9A81E8', '#EE7A9D']} start={[0, 0]} end={[1, 0]} style={styles.nextBtnGradient}>
            <Text style={styles.nextText}>✨ Unlock Pro</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 10 }} onPress={() => router.replace('/')}>
          <Text style={{ color: Colors.mid, fontWeight: '700' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (allLessonsComplete) {
    return (
      <LinearGradient colors={['#D4FFEA', '#A8E6CF']} style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 80 }}>🌟</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.brown, textAlign: 'center', marginVertical: 20 }}>Wow! All Lessons Complete!</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', color: Colors.mid, marginBottom: 40 }}>You have finished the entire curriculum. Check back later for new modules!</Text>
        <TouchableOpacity style={[styles.nextBtn, { width: '100%', marginBottom: 16, backgroundColor: Colors.brown }]} onPress={() => router.replace('/explore')}>
          <Text style={styles.nextText}>📚 Explore Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 10 }} onPress={() => router.replace('/')}>
          <Text style={{ fontSize: 16, color: Colors.brown, fontWeight: '700' }}>← Return Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (isCompleted) {
    return (
      <LinearGradient colors={['#FFD6E7', '#E4F7EE']} style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 100 }}>🎉</Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.brown, marginTop: 24, textAlign: 'center' }}>Session Complete!</Text>
        <View style={styles.badgeCard}>
          <Text style={{ fontSize: 60 }}>{valueData?.story?.icon || '⭐'}</Text>
        </View>
        <Text style={{ fontSize: 18, color: Colors.mid, fontWeight: '700', marginTop: 24 }}>+50 Stars Earned</Text>
        {statsObj && !statsObj.isRepeat && (
          <Text style={{ fontSize: 16, color: Colors.peachD, fontWeight: '800', marginTop: 8 }}>🔥 {statsObj.newLength} day streak!</Text>
        )}
        <TouchableOpacity style={[styles.nextBtn, { width: '100%', marginTop: 40, backgroundColor: Colors.brown }]} onPress={() => router.replace('/jar')}>
          <Text style={styles.nextText}>🫙 View Virtues Jar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20, padding: 10 }} onPress={() => router.back()}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.mid }}>← Go Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const renderDots = () => {
    return flowSteps.map((s, idx) => (
      <View key={s} style={[styles.pd, idx === stepIndex && styles.pdOn, idx < stepIndex && styles.pdDone]} />
    ));
  };

  const renderContent = () => {
    console.log('currentStepString', currentStepString);
    switch (currentStepString) {
      case 'story':
        if (!valueData?.story) {
          return <View style={styles.stepContainer}><Text style={styles.hintText}>No story available.</Text></View>;
        }
        return (
          <View style={[styles.stepContainer, { paddingHorizontal: 16, paddingTop: 16 }]}>

            <View style={styles.storyCard}>
              <LinearGradient colors={[valueData?.story?.gradientColor1 || '#FFDCE8', valueData?.story?.gradientColor2 || '#C3F2E7']} start={[0, 0]} end={[0.8, 1]} style={styles.storyArt}>
                <Text style={{ fontSize: 100 }}>{valueData?.story?.icons || '🐰🌷'}</Text>
                <View style={styles.forChildBadge}>
                  <Text style={styles.fcText}>📱 Show this to your child!</Text>
                </View>
              </LinearGradient>

              <View style={styles.storyBodyWrap}>
                <Text style={styles.storyValueTag}>{valueData?.story?.subtitle}</Text>
                <Text style={styles.storyTitle}>{valueData?.story?.title || "Story Time"}</Text>
                <Text style={styles.storyBodyText}>
                  {valueData?.story?.storyText || "..."}
                </Text>
              </View>
            </View>

            <View style={styles.readBar}>
              <TouchableOpacity style={styles.playBtn} onPress={() => playAudio(valueData?.story?.audioFile?.url ? `https://original-wonder-3fccc0ad1b.strapiapp.com/${valueData.story.audioFile.url}` : null)}>
                <Text style={{ color: 'white', right: isPlaying ? 0 : -2, fontSize: isPlaying ? 12 : 16 }}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={durationMillis}
                  value={positionMillis}
                  onSlidingComplete={handleSeek}
                  minimumTrackTintColor="#9A81E8"
                  maximumTrackTintColor="#E4D9F5"
                  thumbTintColor="#9A81E8"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: -8 }}>
                  <Text style={{ fontSize: 11, color: '#977FA5', fontWeight: '700' }}>{formatTime(positionMillis)}</Text>
                  <Text style={{ fontSize: 11, color: '#977FA5', fontWeight: '700' }}>{formatTime(durationMillis)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.askHint}>
              <Text style={styles.hintText}>💬 <Text style={{ fontStyle: 'italic' }}>Ask your child:</Text> "{valueData?.story?.question || 'What would you do if your friend was sad?'}"</Text>
            </View>

          </View>
        );

      case 'flashcards':
        const cards = valueData?.flashcards || [];
        if (!cards.length) {
          return <View style={styles.stepContainer}><Text style={styles.hintText}>No flashcards available.</Text></View>;
        }
        return (
          <View style={styles.stepContainer}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.brown, textAlign: 'center', marginVertical: 20 }}>Flashcards</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16, justifyContent: 'space-between' }}>
              {cards.map((cfCard: any, idx: number) => (
                <View key={idx} style={{ width: '47%', backgroundColor: 'white', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
                  {cfCard?.image?.url ? (
                    <Image source={{ uri: `https://original-wonder-3fccc0ad1b.strapiapp.com${cfCard.image.url}` }} style={{ width: '100%', height: 100, borderRadius: 10, marginBottom: 10, resizeMode: 'cover' }} />
                  ) : (
                    <LinearGradient colors={['#FFF3CC', '#FFE4EE']} style={{ width: '100%', height: 100, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ fontSize: 40 }}>🃏</Text>
                    </LinearGradient>
                  )}
                  {cfCard.text && cfCard.text.includes(':') ? (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.brown, textAlign: 'center' }}>{cfCard.text.split(':')[0]}</Text>
                      <Text style={{ fontSize: 12, color: Colors.mid, textAlign: 'center', marginTop: 4 }}>{cfCard.text.split(':').slice(1).join(':').trim()}</Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.brown, textAlign: 'center' }}>{cfCard.text || 'Concept'}</Text>
                  )}
                  {cfCard?.audioUrl && (
                    <TouchableOpacity style={{ marginTop: 10, backgroundColor: Colors.lavD, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 }} onPress={() => playAudio(cfCard.audioUrl)}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Play Audio</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        );

      case 'actionTask':
        return (
          <View style={[styles.stepContainer, { justifyContent: 'center', paddingHorizontal: 20 }]}>
            <Text style={{ fontSize: 80, textAlign: 'center' }}>🏃‍♂️</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.brown, textAlign: 'center', marginVertical: 20 }}>Action Task</Text>
            <Text style={{ fontSize: 20, color: Colors.mid, fontWeight: '700', textAlign: 'center', lineHeight: 30 }}>
              {valueData?.actionTask || `Try showing ${valueData?.title || 'this value'} to someone today!`}
            </Text>
            <View style={[styles.askHint, { marginTop: 40 }]}>
              <Text style={[styles.hintText, { fontSize: 13 }]}>👨‍👧 Parent Tip: Encourage your child to participate and praise their efforts to build positive reinforcement.</Text>
            </View>
            <LinearGradient colors={['#D4FFEA', '#A8E6CF']} style={styles.weDidItBadge}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.brown }}>+ Bonus Stars Awarded Upon Finish</Text>
            </LinearGradient>
          </View>
        );

      case 'reflection':
        return (
          <View style={[styles.stepContainer, { justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(255,240,220,0.3)' }]}>
            <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 20 }}>💭</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: Colors.brown, textAlign: 'center', lineHeight: 36 }}>
              {valueData?.reflectionQuestion || `What is one kind thing you did today?`}
            </Text>
            <Text style={{ fontSize: 16, color: Colors.mid, textAlign: 'center', marginTop: 30, fontWeight: '600' }}>
              Give your child time to answer. There's no right or wrong!
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 40 }}>
              <TouchableOpacity style={styles.reactionBtn}><Text style={{ fontSize: 32 }}>❤️</Text></TouchableOpacity>
              <TouchableOpacity style={styles.reactionBtn}><Text style={{ fontSize: 32 }}>⭐</Text></TouchableOpacity>
            </View>
          </View>
        );

      default: return null;
    }
  };

  const getNextButtonText = () => {
    if (stepIndex === flowSteps.length - 1) return 'Finish Session ✨';
    if (currentStepString === 'actionTask') return 'We Did It! ✓';
    return 'Next: ' + (flowSteps[stepIndex + 1] ? flowSteps[stepIndex + 1].replace(/^\w/, (c: string) => c.toUpperCase()) : 'Continue') + ' →';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFE4EE', '#EDE4FF']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={handleBack} style={{ width: 80, alignItems: 'flex-start' }} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <Text style={{ fontSize: 13, color: Colors.brown, fontWeight: '700' }}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.steps}>
              {renderDots()}
            </View>
            <View style={{ width: 80 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.brown, textAlign: 'right' }}>Step {stepIndex + 1} of {flowSteps.length}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} bounces={false}>
        {renderContent()}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
          <Text style={styles.nextText}>{getNextButtonText()}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  body: { flexGrow: 1, paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  back: { fontSize: 14, fontWeight: '700', color: Colors.brown, width: 60 },
  stepLbl: { fontSize: 14, fontWeight: '700', color: Colors.brown, width: 60, textAlign: 'right' },
  steps: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'center' },
  pd: { width: 14, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)' },
  pdOn: { backgroundColor: Colors.lavD, width: 24 },
  pdDone: { backgroundColor: Colors.mint, width: 14 },
  stepContainer: { flex: 1 },
  introImg: { width: 200, height: 200, borderRadius: 100, marginTop: 40, backgroundColor: '#eee' },
  storyCard: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#F5EDE5' },
  storyArt: { height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  forChildBadge: { position: 'absolute', bottom: 16, backgroundColor: 'white', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fcText: { fontSize: 13, fontWeight: '800', color: '#5A3F28' },
  storyBodyWrap: { padding: 24 },
  storyValueTag: { fontSize: 13, fontWeight: '800', color: '#8898C6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  storyTitle: { fontSize: 26, fontWeight: '900', color: '#684523', marginBottom: 16 },
  storyBodyText: { fontSize: 17, color: Colors.mid, fontWeight: '600', lineHeight: 28 },
  readBar: { marginTop: 32, padding: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#9A81E8', alignItems: 'center', justifyContent: 'center', shadowColor: '#9A81E8', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  waves: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 14 },
  wb: { width: 4, borderRadius: 2, backgroundColor: '#BDA6F2' },
  readLbl: { fontSize: 15, fontWeight: '700', color: '#977FA5' },
  askHint: { backgroundColor: '#FDF3E6', marginTop: 16, padding: 18, borderRadius: 18 },
  hintText: { fontSize: 14, fontWeight: '800', color: '#976136', lineHeight: 22 },
  nextBtn: { backgroundColor: Colors.lavD, marginHorizontal: 16, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 24 },
  nextBtnGradient: { marginHorizontal: 16, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 24 },
  nextText: { color: 'white', fontSize: 17, fontWeight: '800' },
  badgeCard: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  weDidItBadge: { marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 16, alignItems: 'center' },
  reactionBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }
});
