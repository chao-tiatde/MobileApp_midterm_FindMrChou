import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDreamStore } from '../store/useDreamStore'; // ✨ 引入 Store
import Switch from '../components/Switch';

const { width } = Dimensions.get('window');
const YEAR_ITEM_HEIGHT = 600; 

// ✨ 定義今天的日期字串 (保持與 MonthPage 一致)
const todayStr = "2026-04-16"; 

export default function YearPage() {
  const router = useRouter();
  const { year: paramYear } = useLocalSearchParams();
  const [viewMode, setViewMode] = useState('year');
  const flatListRef = useRef(null);

  // ✨ 從 Store 讀取夢境數據
  const dreams = useDreamStore((state) => state.dreams);

  const [currentVisibleYear, setCurrentVisibleYear] = useState(paramYear || "2026");

  const yearsData = useMemo(() => {
    const data = [];
    for (let y = 2006; y <= 2046; y++) {
      data.push(y);
    }
    return data;
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const topYear = viewableItems[0].item;
      setCurrentVisibleYear(topYear.toString());
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    if (paramYear) {
      const targetYear = parseInt(paramYear);
      const index = targetYear - 2006;
      if (index >= 0 && index < yearsData.length) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: false,
            viewPosition: 0,
          });
        }, 100);
      }
    }
  }, [paramYear, yearsData]);

  const handleModeChange = (newMode) => {
    setViewMode(newMode);
    if (newMode === 'month') {
      router.push({
        pathname: '/month',
        params: { year: currentVisibleYear, month: "01" }
      });
    }
  };

  const renderMiniMonth = (month, year) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${year}-${month}-${i}`} style={styles.miniDayBox} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      // ✨ 構造日期字串用於比對
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasDream = !!dreams[dStr];
      const isToday = dStr === todayStr;

      days.push(
        <View key={dStr} style={styles.miniDayBox}>
          <View style={[
            styles.miniCircle, 
            hasDream && styles.hasDreamCircle, 
            isToday && styles.todayCircle
          ]}>
            <Text style={[
                styles.miniDayText, 
                isToday && styles.todayText
            ]}>
                {d}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        key={month} 
        style={styles.miniMonthContainer}
        onPress={() => {
          router.push({ 
            pathname: '/month', 
            params: { year: year, month: month } 
          });
        }}
      >
        <Text style={styles.miniMonthTitle}>{month}月</Text>
        <View style={styles.miniGrid}>
          {days}
        </View>
      </TouchableOpacity>
    );
  };

  const renderYearItem = ({ item: year }) => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return (
      <View style={styles.yearSection}>
        <Text style={styles.yearHeader}>{year}</Text>
        <View style={styles.monthsGrid}>
          {months.map(m => renderMiniMonth(m, year))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Switch mode={viewMode} onModeChange={handleModeChange} />
      
      <FlatList
        ref={flatListRef}
        data={yearsData}
        renderItem={renderYearItem}
        keyExtractor={(item) => item.toString()}
        getItemLayout={(data, index) => ({
          length: YEAR_ITEM_HEIGHT,
          offset: YEAR_ITEM_HEIGHT * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: YEAR_ITEM_HEIGHT * info.index, animated: false });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#252736', paddingTop: 60 },
  yearSection: { height: YEAR_ITEM_HEIGHT },
  yearHeader: { 
    color: '#C0FF1A', 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: 10,
    marginBottom: 15 
  },
  monthsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15 
  },
  miniMonthContainer: { 
    width: (width - 60) / 3,
    marginBottom: 20,
    backgroundColor: '#252736',
    borderRadius: 8,
  },
  miniMonthTitle: { 
    color: '#fff', 
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center'
  },
  miniGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    width: '100%',
  },
  miniDayBox: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✨ 圓圈樣式
  miniCircle: {
    width: '90%',
    height: '90%',
    borderRadius: 10, // 只要大於寬度一半即可
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasDreamCircle: {
    backgroundColor: '#7B68EE', // 夢境紫色
  },
  todayCircle: {
    
  },
  miniDayText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 7,
    textAlign: 'center',
  },
  todayText: {
    color: '#C0FF1A', // 今天的數字變黑色比較清楚
    fontWeight: 'bold',
  }
});