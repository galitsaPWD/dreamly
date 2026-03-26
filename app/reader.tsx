import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { getStories, getStoryById, saveStory, SavedStory } from '@/services/storage';
import { generateAndSaveAudio, VOICES } from '@/services/elevenlabs';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withTiming, interpolateColor, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioPlayerBar } from '@/components/reader/AudioPlayerBar';

const AMBIENT_SOUNDS: Record<string, any> = {
  rain: require('../assets/sounds/rain.mp3'),
  ocean: require('../assets/sounds/ocean.mp3'),
  forest: require('../assets/sounds/forest.mp3'),
  magic: require('../assets/sounds/magic.mp3'),
  space: require('../assets/sounds/space.mp3'),
  fire: require('../assets/sounds/fire.mp3'),
};

// Estimate reading time for text at given speech rate
const estimateReadingTimeMs = (text: string, rate: number): number => {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // Average TTS speed is ~150 words/min at rate 1.0
  const wordsPerMinute = 150 * rate;
  return (wordCount / wordsPerMinute) * 60 * 1000;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
};

export default function ReaderScreen() {
  const { storyId } = useLocalSearchParams();
  const [story, setStory] = useState<SavedStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [voiceId, setVoiceId] = useState<string | undefined>();
  const [speed, setSpeed] = useState(0.85);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeParagraph, setActiveParagraph] = useState(-1);
  const [userScrolled, setUserScrolled] = useState(false);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [isRepairing, setIsRepairing] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const narrationSoundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paragraphOffsetsRef = useRef<number[]>([]);
  const pausedElapsedRef = useRef<number>(0);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadedRef = useRef(false);

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Split story into paragraphs
  const paragraphs = React.useMemo(() => {
    if (!story?.content) return [];
    return story.content.split(/\n\n+/).filter(p => p.trim().length > 0);
  }, [story?.content]);

  // Calculate cumulative timing for each paragraph
  const paragraphTimings = React.useMemo(() => {
    if (paragraphs.length === 0) return [];
    // Include title reading time + pause
    const titleTime = story ? estimateReadingTimeMs(story.title, speed) + 2000 : 2000;
    let cumulative = titleTime;
    return paragraphs.map(p => {
      const start = cumulative;
      const duration = estimateReadingTimeMs(p, speed);
      cumulative += duration + 400; // small pause between paragraphs
      return { start, end: cumulative };
    });
  }, [paragraphs, speed, story?.title]);

  const totalEstimatedMs = React.useMemo(() => {
    if (paragraphTimings.length === 0) return 0;
    return paragraphTimings[paragraphTimings.length - 1].end;
  }, [paragraphTimings]);

  const stopNarration = useCallback(async () => {
    setIsSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (story?.audioUri && narrationSoundRef.current) {
      try {
        const status = await narrationSoundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await narrationSoundRef.current.pauseAsync();
        }
      } catch (e: any) {
        console.log('[Reader] stopNarration (Sound not loaded or failed):', e.message);
      }
    } else {
      Speech.stop();
    }
  }, [story?.audioUri]);

  useEffect(() => {
    loadStory();
    setupVoice();
    setupAudioMode();
    
    return () => {
      stopNarration();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (narrationSoundRef.current) {
        narrationSoundRef.current.unloadAsync();
        narrationSoundRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    };
  }, [storyId, stopNarration]);

  // Update active paragraph based on elapsed time
  useEffect(() => {
    if (!isSpeaking || paragraphTimings.length === 0) return;

    const idx = paragraphTimings.findIndex(t => elapsedMs >= t.start && elapsedMs < t.end);
    if (idx !== -1 && idx !== activeParagraph) {
      setActiveParagraph(idx);

      // Auto-scroll if user hasn't manually scrolled
      if (!userScrolled && scrollRef.current && paragraphOffsetsRef.current[idx] !== undefined) {
        scrollRef.current.scrollTo({
          y: Math.max(0, paragraphOffsetsRef.current[idx] - 120),
          animated: true,
        });
      }
    }
  }, [elapsedMs, isSpeaking, paragraphTimings, activeParagraph, userScrolled]);

  useEffect(() => {
    if (isSpeaking && __DEV__) {
      const progressPercent = totalDurationMs > 0 ? (elapsedMs / totalDurationMs) * 100 : 0;
      // Keep as log but only in dev
    }
  }, [elapsedMs, totalDurationMs, isSpeaking]);

  // Automated stall recovery
  useEffect(() => {
    if (!isSpeaking || !narrationSoundRef.current) return;
    
    let lastMs = elapsedMs;
    let stuckCount = 0;
    
    const interval = setInterval(() => {
      if (elapsedMs === lastMs && isSpeaking) {
        stuckCount++;
        if (stuckCount > 20) { // 2 seconds of no movement
           console.log('[Reader] Stall detected, kicking playback...');
           narrationSoundRef.current?.playAsync().catch(() => {});
           stuckCount = 0;
        }
      } else {
        stuckCount = 0;
      }
      lastMs = elapsedMs;
    }, 100);
    
    return () => clearInterval(interval);
  }, [isSpeaking, elapsedMs]);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('Audio mode setup failed:', e);
    }
  };

  const setupVoice = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const englishVoices = voices.filter(v => v.language.startsWith('en'));
      
      let bestVoice;
      if (Platform.OS === 'ios') {
        bestVoice = englishVoices.find(v => v.name.includes('Siri') || v.quality === 'Enhanced') 
                 || englishVoices.find(v => v.language === 'en-GB')
                 || englishVoices[0];
      } else if (Platform.OS === 'android') {
        bestVoice = englishVoices.find(v => v.identifier.includes('network') && v.language === 'en-GB')
                 || englishVoices.find(v => v.identifier.includes('network'))
                 || englishVoices[0];
      } else {
        bestVoice = englishVoices.find(v => v.name.includes('Natural') && v.name.includes('Aria'))
                 || englishVoices.find(v => v.name.includes('Natural'))
                 || englishVoices.find(v => v.name.includes('Online'))
                 || englishVoices.find(v => v.name.includes('Google UK English Female'))
                 || englishVoices.find(v => v.name.includes('Google US English'))
                 || englishVoices[0];
      }

      if (bestVoice) setVoiceId(bestVoice.identifier);
    } catch (e) {
      console.log('Voice setup failed, will use default', e);
    }
  };

  const loadStory = async () => {
    try {
      const found = await getStoryById(storyId as string);
      
      // Clean up stale URLs on Web (blobs or file paths saved from mobile/dev)
      if (found && Platform.OS === 'web' && found.audioUri) {
        if (found.audioUri.startsWith('blob:') || found.audioUri.startsWith('file:///')) {
          console.log('[Reader] Clearing stale local/blob URI on web');
          found.audioUri = undefined;
        }
      }

      setStory(found || null);
      if (found) {
        console.log('Story loaded:', found.title);
        
        // Background repair if audio is missing (from offline creation)
        if (!found.audioUri) {
          repairAudio(found);
        }

        // Initial estimate for fallback - use found.content instead of paragraphs state
        const foundParagraphs = found.content.split(/\n\n+/).filter(p => p.trim().length > 0);
        const estimated = foundParagraphs.map((p, i) => {
          const titleTime = estimateReadingTimeMs(found.title, speed) + 2000;
          let cumulative = titleTime;
          for (let j = 0; j < i; j++) {
            cumulative += estimateReadingTimeMs(foundParagraphs[j], speed) + 400;
          }
          return { start: cumulative, end: cumulative + estimateReadingTimeMs(p, speed) + 400 };
        });
        const totalEstimated = estimated.length > 0 ? estimated[estimated.length - 1].end : 0;
        setTotalDurationMs(totalEstimated);
        console.log('Initial duration estimate (ms):', totalEstimated);
      }
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setLoading(false);
    }
  };

  const repairAudio = async (currentStory: SavedStory) => {
    if (isRepairing) return;
    if (!currentStory) return;
    
    setIsRepairing(true);
    try {
      console.log('[Reader] Attempting to repair narration for offline story...');
      
      // Ensure we use a valid, current voice ID
      let activeVoiceId = currentStory.voiceId || VOICES.alice.id;
      const validVoiceIds = Object.values(VOICES).map((v: any) => v.id);
      
      if (!validVoiceIds.includes(activeVoiceId)) {
        console.log(`[Reader] Voice ID ${activeVoiceId} is legacy or invalid. Falling back to Alice.`);
        const fallbackId = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice (Premade)
        activeVoiceId = fallbackId;
      }

      const audioUri = await generateAndSaveAudio(currentStory.id, currentStory.content, activeVoiceId);
      if (audioUri) {
        const updatedStory = { ...currentStory, audioUri: audioUri };
        await saveStory(updatedStory);
        setStory(updatedStory);
        console.log('[Reader] Narration repaired successfully!');

        // If user is ALREADY listening to the robot, hot-swap to the premium voice!
        if (isSpeaking && !narrationSoundRef.current) {
          console.log('[Reader] Hot-swapping robot for premium voice...');
          Speech.stop();
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Start the premium audio from the same position
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { 
              shouldPlay: true, 
              rate: speed, 
              positionMillis: elapsedMs,
              progressUpdateIntervalMillis: 100,
            }
          );
          narrationSoundRef.current = sound;
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) {
              if ((status as any).error) {
                console.warn('[Reader] Audio playback error during hot-swap:', (status as any).error);
              }
              return;
            }
            
            if (status.positionMillis !== undefined) {
              setElapsedMs(status.positionMillis);
            }
            if (status.durationMillis && status.durationMillis > 0) {
              setTotalDurationMs(status.durationMillis);
            }
            if (status.didJustFinish) {
              setIsSpeaking(false);
              setElapsedMs(0);
              pausedElapsedRef.current = 0;
              stopAmbientSound();
            }
          });
        }
      }
    } catch (e) {
      console.log('[Reader] Narration repair skipped (offline or error)');
    } finally {
      setIsRepairing(false);
    }
  };

  const identifyAmbientSound = (title: string, content: string) => {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('ocean') || text.includes('sea') || text.includes('waves') || text.includes('beach') || text.includes('water')) return 'ocean';
    if (text.includes('rain') || text.includes('storm') || text.includes('thunder') || text.includes('wet')) return 'rain';
    if (text.includes('forest') || text.includes('trees') || text.includes('nature') || text.includes('woods') || text.includes('mountain')) return 'forest';
    if (text.includes('fire') || text.includes('flame') || text.includes('dragon') || text.includes('warm') || text.includes('camp')) return 'fire';
    if (text.includes('space') || text.includes('star') || text.includes('planet') || text.includes('rocket') || text.includes('moon')) return 'space';
    return 'magic';
  };

  const getAmbientLabel = () => {
    if (!story) return 'Magic';
    const cat = story.ambientSound || identifyAmbientSound(story.title, story.content);
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const startAmbientSound = async () => {
    if (!story) return;
    try {
      if (!soundRef.current) {
        const category = story.ambientSound || identifyAmbientSound(story.title, story.content);
        const soundFile = AMBIENT_SOUNDS[category] || AMBIENT_SOUNDS.magic;
        const { sound } = await Audio.Sound.createAsync(
          soundFile,
          { isLooping: true, volume: 0.3 }
        );
        soundRef.current = sound;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        await soundRef.current.setVolumeAsync(0.3);
        await soundRef.current.playAsync();
      }
    } catch (e) {
      console.warn('Ambient sound play failed:', e);
    }
  };

  const stopAmbientSound = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) await soundRef.current.pauseAsync();
      } catch(e) {}
    }
  };

  const startTtsFallback = () => {
    if (!story) return;
    const fullText = `${story.title}. ${story.content}`;
    // Find where we left off (approximate)
    const words = fullText.split(/\s+/);
    const totalWords = words.length;
    const progress = totalEstimatedMs > 0 ? pausedElapsedRef.current / totalEstimatedMs : 0;
    const startIndex = Math.floor(progress * totalWords);
    const remainingText = words.slice(startIndex).join(' ');

    Speech.speak(remainingText, {
      rate: speed,
      voice: voiceId,
      onStart: () => {
        const startTime = Date.now() - pausedElapsedRef.current;
        timerRef.current = setInterval(() => {
          const now = Date.now();
          const currentElapsed = now - startTime;
          setElapsedMs(currentElapsed);
          if (currentElapsed >= totalEstimatedMs) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsSpeaking(false);
            stopAmbientSound();
          }
        }, 100);
      },
      onDone: () => {
        setIsSpeaking(false);
        if (timerRef.current) clearInterval(timerRef.current);
        stopAmbientSound();
      },
      onError: () => {
        setIsSpeaking(false);
        if (timerRef.current) clearInterval(timerRef.current);
        stopAmbientSound();
      },
    });
  };

  const toggleNarration = useCallback(async () => {
    if (isSpeaking) {
      await stopNarration();
      await stopAmbientSound();
      pausedElapsedRef.current = elapsedMs;
    } else if (story) {
      setIsSpeaking(true);
      setIsPlayerExpanded(true);
      setUserScrolled(false);
      
      await startAmbientSound();

      // PRIORITY 1: ElevenLabs Local/Cloud Audio
      if (story?.audioUri) {
        console.log(`[Reader] Attempting ElevenLabs playback: ${story.audioUri.substring(0, 60)}...`);
        try {
          if (!narrationSoundRef.current) {
            console.log('[Reader] Creating new Audio.Sound instance...');
            const { sound } = await Audio.Sound.createAsync(
              { uri: story.audioUri },
              { 
                shouldPlay: false, 
                rate: speed, 
                shouldCorrectPitch: true,
                progressUpdateIntervalMillis: 100
              }
            );
            narrationSoundRef.current = sound;
            
            sound.setOnPlaybackStatusUpdate((status) => {
              if (!status.isLoaded) {
                if ((status as any).error) {
                  console.warn('[Reader] Audio playback error:', (status as any).error);
                }
                return;
              }
              
              if (status.positionMillis !== undefined) {
                setElapsedMs(status.positionMillis);
              }
              if (status.durationMillis && status.durationMillis > 0) {
                setTotalDurationMs(status.durationMillis);
              }
              if (status.didJustFinish) {
                setIsSpeaking(false);
                setElapsedMs(0);
                pausedElapsedRef.current = 0;
                stopAmbientSound();
              }
            });
          }
          
          await narrationSoundRef.current.setPositionAsync(pausedElapsedRef.current);
          await narrationSoundRef.current.setRateAsync(speed, true);
          await narrationSoundRef.current.playAsync();
          console.log('[Reader] ElevenLabs playback started');
        } catch (e: any) {
          console.warn('[Reader] ElevenLabs playback failed, falling back to System TTS:', e.message || e);
          startTtsFallback();
        }
      } else if (isRepairing) {
        // If we are currently generating, wait a bit or use fallback
        startTtsFallback();
      } else {
        // PRIORITY 2: Expo Speech Fallback
        startTtsFallback();
      }
    }
  }, [isSpeaking, story, elapsedMs, speed, stopNarration, startAmbientSound, stopAmbientSound, isRepairing]);

  const handleSeek = useCallback(async (newProgress: number) => {
    if (totalDurationMs <= 0) return;
    
    const newMs = newProgress * totalDurationMs;
    setElapsedMs(newMs);
    pausedElapsedRef.current = newMs;

    if (story?.audioUri && narrationSoundRef.current) {
      try {
        await narrationSoundRef.current.setPositionAsync(newMs);
      } catch (e) {
        console.warn('Seek failed:', e);
      }
    } else {
      // For Expo Speech, we have to stop and restart from the new position
      await stopNarration();
      // Small delay to ensure stop finished before restarting
      setTimeout(() => toggleNarration(), 100);
    }
  }, [totalDurationMs, story?.audioUri, stopNarration, toggleNarration]);

  const handleSpeedChange = useCallback(async (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isSpeaking) {
      if (story?.audioUri && narrationSoundRef.current) {
        await narrationSoundRef.current.setRateAsync(newSpeed, true);
      } else {
        // For Expo Speech, we have to restart to change speed
        await stopNarration();
        pausedElapsedRef.current = elapsedMs;
        // Small delay to ensure stop finished
        setTimeout(() => toggleNarration(), 100);
      }
    }
  }, [isSpeaking, story?.audioUri, elapsedMs, stopNarration, toggleNarration]);

  const handleScrollBegin = () => {
    // User manually scrolled — pause auto-scroll temporarily
    setUserScrolled(true);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 5000); // Resume auto-scroll after 5s of no manual input
  };

  const storeParagraphOffset = (index: number, event: LayoutChangeEvent) => {
    paragraphOffsetsRef.current[index] = event.nativeEvent.layout.y;
  };

  const progress = totalDurationMs > 0 ? Math.min(1, elapsedMs / totalDurationMs) : 0;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0EA5E9" />
      </View>
    );
  }

  if (!story) {
    return (
      <SafeAreaView className="flex-1">
        <Animated.View 
          entering={FadeInDown.duration(600).springify().damping(15)}
          className="flex-1 items-center justify-center p-6"
        >
          <Text className="text-sky-900 dark:text-white text-xl mb-4 text-center font-bold">Story not found.</Text>
          <Pressable onPress={() => router.back()} className="bg-sky-500 px-8 py-4 rounded-[24px] shadow-lg shadow-sky-200">
            <Text className="text-white font-black">Go Back</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const getThemeColors = () => {
    const category = story.ambientSound || identifyAmbientSound(story.title, story.content);
    const themes: Record<string, { light: readonly [string, string], dark: readonly [string, string] }> = {
      ocean: { light: ['#F0F9FF', '#E0F2FE'], dark: ['#031018', '#082F49'] },
      rain: { light: ['#F8FAFC', '#E2E8F0'], dark: ['#020617', '#0F172A'] },
      forest: { light: ['#F0FDF4', '#DCFBDF'], dark: ['#012018', '#064E3B'] },
      fire: { light: ['#FFF7ED', '#FFEDD5'], dark: ['#2A0A0A', '#450A0A'] },
      space: { light: ['#FAF5FF', '#F3E8FF'], dark: ['#0B0014', '#1E103A'] },
      magic: { light: ['#FDF4FF', '#FAE8FF'], dark: ['#0F0414', '#2E063D'] },
    };
    const colors = themes[category] || themes.magic;
    return isDark ? (colors.dark as [string, string]) : (colors.light as [string, string]);
  };

  return (
    <View className="flex-1">
      <LinearGradient 
        colors={getThemeColors()} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />
      <SafeAreaView className="flex-1">
        <View style={{ flex: 1, paddingTop: 24 }}>
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(800).springify()}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginBottom: 12 }}
          >
            <Pressable 
              onPress={() => { 
                 Speech.stop(); 
                 if (timerRef.current) clearInterval(timerRef.current);
                 if (router.canGoBack()) router.back();
                 else router.replace('/');
              }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginLeft: -12 }}
            >
              <Ionicons name="chevron-back" size={22} color={isDark ? '#71717A' : '#0EA5E9'} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-sky-600 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[2px]">Story Time</Text>
              <Text className="text-zinc-900 dark:text-white font-black text-lg">Dreamly Reader</Text>
            </View>
          </Animated.View>

          {/* Scrolling Content */}
          <ScrollView 
            ref={scrollRef}
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 160 }}
            onScrollBeginDrag={handleScrollBegin}
          >
            <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
              <Text className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">
                {formatDate(story.date || new Date().toISOString())} {isRepairing && "• Generating Premium Voice..."}
              </Text>
              <Text className="text-sky-950 dark:text-white text-[34px] font-black leading-tight tracking-tight mt-6 mb-8">
                {story.title}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(1000).springify()}>
              {paragraphs.map((paragraph, index) => (
                <View 
                  key={index} 
                  onLayout={(e) => storeParagraphOffset(index, e)}
                  style={{ marginBottom: 20 }}
                >
                  <Text
                    style={{
                      color: isDark ? '#D4D4D8' : '#18181B',
                      fontSize: 20,
                      lineHeight: 36,
                      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                    }}
                  >
                    {paragraph}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Audio Player Bar */}
      <AudioPlayerBar
        isSpeaking={isSpeaking}
        isExpanded={isPlayerExpanded}
        onToggle={toggleNarration}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
        progress={progress}
        elapsedTime={formatTime(elapsedMs)}
        totalTime={formatTime(totalDurationMs)}
        onRefresh={loadStory}
        ambientLabel={getAmbientLabel()}
        speed={speed}
        isDark={isDark}
        isRepairing={isRepairing}
      />
    </View>
  );
}
