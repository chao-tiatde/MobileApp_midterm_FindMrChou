import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Animated, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDreamStore } from '../store/useDreamStore';
import BottomTab from '../components/BottomTab';

const { width } = Dimensions.get('window');

// --- 子組件維持不變 (AnimatedNumber, StatBar) ---
const AnimatedNumber = ({ value, duration = 1000, active }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      animatedValue.setValue(0);
      setDisplayValue(0);
      const anim = Animated.timing(animatedValue, {
        toValue: value,
        duration: duration,
        useNativeDriver: false,
      });
      const timer = setTimeout(() => anim.start(), 50);
      const listenerId = animatedValue.addListener(({ value }) => {
        setDisplayValue(Math.floor(value));
      });
      return () => {
        clearTimeout(timer);
        anim.stop();
        animatedValue.removeListener(listenerId);
      };
    }
  }, [value, active]);

  return <Text style={styles.hugeCount}>{displayValue}</Text>;
};

const StatBar = ({ percentage, label, color, percentTextColor, isEmoji = false, active }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      animatedHeight.setValue(0);
      Animated.spring(animatedHeight, {
        toValue: percentage || 0,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }
  }, [percentage, active]);

  return (
    <View style={styles.barContainer}>
      <View style={styles.barTrack}>
        <Animated.View 
          style={[
            styles.barFill, 
            { 
              backgroundColor: color, 
              height: animatedHeight.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }
          ]} 
        >
          <Text style={[styles.percentText, { color: percentTextColor }]}>
            {Math.round(percentage)}%
          </Text>
        </Animated.View>
      </View>
      {isEmoji ? (
        <Image source={label} style={styles.moodImageLabel} resizeMode="contain" />
      ) : (
        <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      )}
    </View>
  );
};

// --- 主組件 ---
export default function StatisticPage() {
  const router = useRouter();
  const dreams = useDreamStore((state) => state.dreams);
  const pagerRef = useRef(null);
  
  // 核心狀態：當前顯示的基準日期
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerStep, setPickerStep] = useState(1);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  const moodEmojiMap = {
    '非常差': require('../img/very-bad.png'),
    '差': require('../img/bad.png'),
    '普通': require('../img/neutral.png'),
    '好': require('../img/good.png'),
    '非常好': require('../img/very-good.png'),
  };

  // 生成三頁日期數據 (關鍵：使用 currentDate 作為中心)
  const displayMonths = useMemo(() => {
    const getMonthData = (date) => ({
      fullLabel: date.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    });

    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const curr = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    return [getMonthData(prev), getMonthData(curr), getMonthData(next)];
  }, [currentDate]);

  // 處理滑動邏輯
  const onPageSelected = (e) => {
    const index = e.nativeEvent.position;
    
    // 如果滑到左邊或右邊
    if (index !== 1) {
      const newDate = new Date(currentDate);
      if (index === 0) {
        newDate.setMonth(newDate.getMonth() - 1); // 往前推一個月
      } else if (index === 2) {
        newDate.setMonth(newDate.getMonth() + 1); // 往後推一個月
      }

      // 1. 更新日期狀態，這會觸發 displayMonths 重新計算
      setCurrentDate(newDate);

      // 2. 秘密跳回中間頁 (index 1)，不觸發動畫，讓使用者可以再次左右滑
      // 使用 setTimeout 確保在狀態更新後執行
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(1);
      }, 50);
    }
  };

  // 年份與月份選擇器
  const years = useMemo(() => {
    const list = [];
    for (let i = 2006; i <= 2046; i++) list.push(i);
    return list; 
  }, []);
  const selectableMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearSelect = (year) => {
    setTempYear(year);
    setPickerStep(2);
  };

  const handleFinalJump = (month) => {
    setCurrentDate(new Date(tempYear, month - 1, 1));
    setShowPicker(false);
    // 跳轉後也要確保 Pager 停留在中間
    pagerRef.current?.setPageWithoutAnimation(1);
  };

  // 獲取數據邏輯
  const getStats = (monthKey) => {
    const dreamsArray = Array.isArray(dreams) ? dreams : Object.values(dreams || {});
    const monthDreams = dreamsArray.filter(d => d?.date?.replace(/\//g, '-').startsWith(monthKey));

    const totalCount = monthDreams.length;
    const tagMap = {};
    monthDreams.forEach(d => {
      let tags = Array.isArray(d.tags) ? d.tags : (d.tags?.split(',').map(t => t.trim()).filter(Boolean) || []);
      tags.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
    });
    
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({
      name, percent: totalCount > 0 ? (count / totalCount) * 100 : 0
    }));

    const moodOrder = ['非常差', '差', '普通', '好', '非常好'];
    const moodStats = moodOrder.map(m => ({
      emoji: moodEmojiMap[m],
      percent: totalCount > 0 ? (monthDreams.filter(d => d.mood === m).length / totalCount) * 100 : 0
    }));

    return { totalCount, topTags, moodStats };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#252736" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.monthTitle}>{displayMonths[1].fullLabel}</Text>
          <TouchableOpacity onPress={() => { setPickerStep(1); setShowPicker(true); }}>
            <Image source={require('../img/arrow-down-black.png')} style={styles.downArrowImage} />
          </TouchableOpacity>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Modal 選擇器 */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={styles.dropdownContainer}>
            <Text style={styles.pickerHeader}>{pickerStep === 1 ? '請選擇年份' : `${tempYear}年 - 選擇月份`}</Text>
            <View style={styles.pickerContent}>
              {pickerStep === 1 ? (
                <ScrollView>
                  {years.map(y => (
                    <TouchableOpacity key={y} style={styles.item} onPress={() => handleYearSelect(y)}>
                      <Text style={[styles.itemText, y === tempYear && {color: '#866CD1', fontWeight: 'bold'}]}>{y}年</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <ScrollView>
                  <View style={styles.monthGrid}>
                    {selectableMonths.map(m => (
                      <TouchableOpacity key={m} style={styles.monthItem} onPress={() => handleFinalJump(m)}>
                        <Text style={styles.itemText}>{m}月</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* 無限輪播 PagerView (固定三頁) */}
      <PagerView 
        ref={pagerRef}
        style={styles.pager} 
        initialPage={1}
        onPageSelected={onPageSelected}
        key={currentDate.toISOString()} // 關鍵：當日期變動時重置 PagerView
      >
        {displayMonths.map((m, index) => {
          const stats = getStats(m.key);
          const isCurrent = index === 1; // 只有中間那一頁會啟動動畫
          return (
            <View key={m.key} style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <AnimatedNumber value={stats.totalCount} active={isCurrent} />
                <Text style={styles.countSub}>為您本月的作夢天數</Text>
                
                <View style={[styles.card, { backgroundColor: '#866CD1' }]}>
                  <Text style={styles.cardTitle}>標籤</Text>
                  <View style={styles.barRow}>
                    {stats.topTags.length > 0 ? stats.topTags.map((tag, i) => (
                      <StatBar key={tag.name} label={tag.name} percentage={tag.percent} color={i % 2 === 0 ? '#252736' : '#C0FF1A'} percentTextColor={i % 2 === 0 ? '#FFF' : '#252736'} active={isCurrent} />
                    )) : <Text style={styles.emptyText}>本月尚無標籤數據</Text>}
                  </View>
                </View>

                <View style={[styles.card, { backgroundColor: '#252736' }]}>
                  <Text style={styles.cardTitle}>心情指數</Text>
                  <View style={styles.barRow}>
                    {stats.totalCount > 0 ? stats.moodStats.map((mood, i) => (
                      <StatBar key={i} label={mood.emoji} percentage={mood.percent} color={i % 2 === 0 ? '#866cd1' : '#C0FF1A'} percentTextColor={i % 2 === 0 ? '#FFF' : '#252736'} isEmoji active={isCurrent} />
                    )) : <Text style={styles.emptyText}>本月尚無心情數據</Text>}
                  </View>
                </View>
              </ScrollView>
            </View>
          );
        })}
      </PagerView>
      <BottomTab />
    </View>
  );
}

// 樣式保持原樣
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, zIndex: 10, backgroundColor: '#F3F3F3' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backButton: { padding: 5 },
  pager: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 150 },
  monthTitle: { fontSize: 25, fontWeight: 'bold', color: '#252736' },
  hugeCount: { fontSize: 85, fontWeight: '900', color: '#252736', marginTop: 10 },
  countSub: { fontSize: 25, color: '#252736', marginBottom: 40 },
  card: { width: '100%', borderRadius: 30, padding: 30, marginBottom: 30 },
  cardTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 180, width: '100%' },
  barContainer: { flex: 1, alignItems: 'center' },
  barTrack: { width: 45, height: 180, backgroundColor: 'rgba(217,217,217,0.3)', borderRadius: 100, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  percentText: { fontSize: 12, fontWeight: 'bold', position: 'absolute', bottom: 10 },
  barLabel: { marginTop: 12, fontSize: 13, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  moodImageLabel: { width: 24, height: 24, marginTop: 15 }, 
  emptyText: { fontSize: 15, color: '#FFF', textAlign: 'center', width: '100%', opacity: 0.7 },
  downArrowImage: { width: 40, height: 22, resizeMode: 'contain' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownContainer: { backgroundColor: '#FFF', borderRadius: 20, width: '80%', maxHeight: '60%', padding: 20, elevation: 5 },
  pickerHeader: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#252736', borderBottomWidth: 1, borderBottomColor: '#f3f3f3', paddingBottom: 10 },
  pickerContent: { height: 300 },
  item: { paddingVertical: 15, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  itemText: { fontSize: 16, color: '#252736' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthItem: { width: '30%', paddingVertical: 20, alignItems: 'center', marginVertical: 5, backgroundColor: '#F9F9F9', borderRadius: 10 }
});