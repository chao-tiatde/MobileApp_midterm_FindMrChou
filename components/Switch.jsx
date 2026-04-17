import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWITCH_WIDTH = 140; 
const TAB_WIDTH = SWITCH_WIDTH / 2; 

export default function Switch({ mode, onModeChange }) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(mode === 'month' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: mode === 'month' ? 0 : 1,
      useNativeDriver: false, 
      friction: 8,
      tension: 50,
    }).start();
  }, [mode]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, TAB_WIDTH - 2],
  });

  return (
    <View style={styles.outerContainer}>
        
      {/* 第一層：返回按鈕 + 月年切換器 */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/')}
        >
          <Ionicons name="arrow-back" size={28} color="#C0FF1A" />
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Animated.View
            style={[
              styles.activeIndicator,
              { transform: [{ translateX }] }
            ]}
          />
          <TouchableOpacity
            style={styles.tab}
            activeOpacity={1}
            onPress={() => onModeChange('month')}
          >
            <Text style={[styles.tabText, mode === 'month' ? styles.activeText : styles.inactiveText]}>
              月
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            activeOpacity={1}
            onPress={() => onModeChange('year')}
          >
            <Text style={[styles.tabText, mode === 'year' ? styles.activeText : styles.inactiveText]}>
              年
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 第二層：星期標頭 (僅在月模式顯示) */}
      {mode === 'month' && (
        <View style={styles.staticWeekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w, i) => (
            <Text key={i} style={styles.weekText}>{w}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#252736', 
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 25,
    zIndex: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    width: SWITCH_WIDTH,
    height: 40,
    backgroundColor: '#1A1B26', 
    borderRadius: 20,
    padding: 2,
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    width: TAB_WIDTH , // 稍微縮減讓邊距好看
    height: 36,
    backgroundColor: '#C0FF1A', 
    borderRadius: 18,

  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeText: { color: '#000' },
  inactiveText: { color: '#fff' },
  
  staticWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15, // 必須與 MonthPage 的 daysGrid 保持一致
    marginTop: 15, // 與切換器拉開距離
  },
  weekText: { 
    color: '#fff', 
    fontSize: 13, 
    width: (SCREEN_WIDTH - 30) / 7, // 30 是 paddingHorizontal * 2
    textAlign: 'center',
  },
});