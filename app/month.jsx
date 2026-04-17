import React, { useMemo, useRef, useState, useEffect, memo, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useDreamStore } from '../store/useDreamStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BottomTab from '../components/BottomTab';
import Switch from '../components/Switch';
import DreamSheet2 from '../components/DreamSheet2';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 350; 
const COLUMN_WIDTH = (width - 30) / 7;

// --- DayCell 組件更新 ---
const DayCell = memo(({ dayNum, dateStr, hasDream, isToday, isSelected, onPress, isEmpty }) => {
  return (
    <View style={styles.cellContainer}>
      {!isEmpty && (
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[
            styles.circleBase, 
            // 1. 如果有夢境但沒被選中，顯示 35x35 的紫色圓圈
            hasDream && !isSelected && styles.hasDreamCircle,
            // 2. 如果被選中，不論有無夢境，皆顯示 40x40 的螢光綠圓圈
            isSelected && styles.selectedCircle 
          ]}
          onPress={() => onPress(dateStr)}
        >
          <Text style={[
            styles.dayText, 
            // 今天但未選中時：螢光綠字體
            isToday && !isSelected && styles.todayText,
            // 選中時：黑色字體
            isSelected && styles.selectedDayText 
          ]}>
            {dayNum}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default function MonthPage() {
  const router = useRouter();
  const { year: paramYear, month: paramMonth } = useLocalSearchParams();
  const [viewMode, setViewMode] = useState('month');
  
  const todayStr = "2026-04-16"; 
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [currentVisibleYear, setCurrentVisibleYear] = useState(paramYear || "2026");

  const dreams = useDreamStore((state) => state.dreams);
  const setSelectedInStore = useDreamStore((state) => state.setSelectedDate);
  const flatListRef = useRef(null);

  const monthsData = useMemo(() => {
    const data = [];
    for (let year = 2006; year <= 2046; year++) {
      for (let month = 1; month <= 12; month++) {
        data.push({ id: `${year}-${month}`, year, month });
      }
    }
    return data;
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const topItem = viewableItems[0].item;
      setCurrentVisibleYear(topItem.year.toString());
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    let targetYear, targetMonth;
    if (paramYear && paramMonth) {
      targetYear = parseInt(paramYear);
      targetMonth = parseInt(paramMonth);
    } else {
      const [y, m] = todayStr.split('-').map(Number);
      targetYear = y;
      targetMonth = m;
    }

    const index = (targetYear - 2006) * 12 + (targetMonth - 1);

    if (index >= 0 && index < monthsData.length) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [paramYear, paramMonth, monthsData]);

  const renderMonthItem = useCallback(({ item }) => {
    const { year, month } = item;
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const items = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      items.push(<DayCell key={`empty-${year}-${month}-${i}`} isEmpty={true} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      items.push(
        <DayCell
          key={dStr}
          dayNum={d}
          dateStr={dStr}
          hasDream={!!dreams[dStr]}
          isToday={dStr === todayStr}
          isSelected={dStr === selectedDate}
          onPress={(date) => {
            setSelectedDate(date);
            setSelectedInStore(date);
          }}
        />
      );
    }

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

    return (
      <View style={styles.monthSection}>
        <Text style={styles.sectionHeader}>{`${monthName} ${year}`}</Text>
        <View style={styles.daysGrid}>
          {items}
        </View>
      </View>
    );
  }, [dreams, setSelectedInStore, selectedDate]);

  return (
    <View style={styles.container}>
      <Switch 
        mode={viewMode} 
        onModeChange={(m) => {
          if (m === 'year') {
            router.push({
              pathname: '/year',
              params: { year: currentVisibleYear }
            });
          } else {
            setViewMode(m);
          }
        }} 
      />

      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={monthsData}
          renderItem={renderMonthItem}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({ offset: ITEM_HEIGHT * info.index, animated: false });
          }}
        />
      </View>
      
      <DreamSheet2 
        selectedDate={selectedDate} 
        expandedRatio={0.5} 
      />
      
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#252736', paddingTop: 60 },
  monthSection: { height: ITEM_HEIGHT, paddingTop: 10 },
  sectionHeader: { 
    color: '#C0FF1A', 
    fontSize: 25, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10 
  },
  daysGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  cellContainer: { 
    width: COLUMN_WIDTH, 
    height: 48, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  circleBase: {
    justifyContent: 'center', 
    alignItems: 'center',
  },
  // ✨ 沒被選中但有夢境：長寬 35
  hasDreamCircle: { 
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#7B68EE' 
  },
  // ✨ 被選中（不論有無夢境）：長寬 40
  selectedCircle: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C0FF1A', 
  },
  dayText: { color: '#fff', fontSize: 16 },
  todayText: { color: '#C0FF1A', fontWeight: 'bold' },
  selectedDayText: { color: '#000', fontWeight: 'bold' },
});