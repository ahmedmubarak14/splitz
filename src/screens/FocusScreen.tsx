import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, SkipForward, TreePine } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Card, CardContent, Button } from '@/components/ui';

type SessionType = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

export const FocusScreen = () => {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [treesPlanted, setTreesPlanted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const settings: TimerSettings = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 500, 200, 500]);

    if (sessionType === 'focus') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      setTreesPlanted((prev) => prev + 1);

      // After 4 focus sessions, take a long break
      if (newSessionsCompleted % 4 === 0) {
        setSessionType('longBreak');
        setTimeLeft(settings.longBreak);
      } else {
        setSessionType('shortBreak');
        setTimeLeft(settings.shortBreak);
      }
    } else {
      setSessionType('focus');
      setTimeLeft(settings.focus);
    }
  };

  const toggleTimer = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(!isRunning);
  };

  const resetTimer = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setTimeLeft(settings[sessionType]);
  };

  const skipSession = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSessionComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'focus':
        return '#6366f1';
      case 'shortBreak':
        return '#10b981';
      case 'longBreak':
        return '#f59e0b';
    }
  };

  const progress = 1 - timeLeft / settings[sessionType];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card style={styles.timerCard}>
          <CardContent style={styles.timerContent}>
            <Text style={[styles.sessionLabel, { color: getSessionColor() }]}>
              {getSessionLabel()}
            </Text>

            <View style={styles.timerContainer}>
              <View
                style={[
                  styles.progressRing,
                  { borderColor: getSessionColor() },
                ]}
              >
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={resetTimer}
              >
                <RotateCcw color="#71717a" size={24} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.playButton,
                  { backgroundColor: getSessionColor() },
                ]}
                onPress={toggleTimer}
              >
                {isRunning ? (
                  <Pause color="#ffffff" size={32} />
                ) : (
                  <Play color="#ffffff" size={32} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={skipSession}
              >
                <SkipForward color="#71717a" size={24} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        <View style={styles.stats}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{sessionsCompleted}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.treeContainer}>
                <TreePine color="#10b981" size={24} />
                <Text style={styles.statValue}>{treesPlanted}</Text>
              </View>
              <Text style={styles.statLabel}>Trees Planted</Text>
            </CardContent>
          </Card>
        </View>

        <Card style={styles.instructionsCard}>
          <CardContent style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>How it works</Text>
            <Text style={styles.instructionsText}>
              1. Focus for 25 minutes{'\n'}
              2. Take a 5-minute break{'\n'}
              3. After 4 sessions, take a 15-minute break{'\n'}
              4. Plant virtual trees as you focus!
            </Text>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timerCard: {
    marginBottom: 16,
  },
  timerContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  sessionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  timerContainer: {
    marginBottom: 32,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#09090b',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09090b',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  treeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionsCard: {
    marginTop: 'auto',
  },
  instructionsContent: {
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#71717a',
    lineHeight: 22,
  },
});
