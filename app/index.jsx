import { useDreamStore } from '../store/useDreamStore';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react'; // 引入 useMemo 提升效能
import { StyleSheet, View, Text, Image, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Calendar } from 'react-native-calendars'; 

import DreamSheet from '../components/DreamSheet';
import BottomTab from '../components/BottomTab';

const today = new Date().toLocaleDateString('sv-SE');

export default function Page() {
  const router = useRouter();
  const dreams = useDreamStore((state) => state.dreams);
  const selected = useDreamStore((state) => state.selectedDate || today);
  const setSelected = useDreamStore((state) => state.setSelectedDate);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerStep, setPickerStep] = useState(1);
  const [tempYear, setTempYear] = useState(new Date(selected).getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i); 
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const formatTitle = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const [currentTitle, setCurrentTitle] = useState(formatTitle(selected));

  const openPicker = () => {
    setPickerStep(1);
    setTempYear(new Date(selected).getFullYear());
    setShowPicker(true);
  };

  const handleYearSelect = (year) => {
    setTempYear(year);
    setPickerStep(2);
  };

  const handleFinalJump = (month) => {
    // 確保月份始終是兩位數 (01, 02...)
    const formattedMonth = String(month).padStart(2, '0');
    const newDate = `${tempYear}-${formattedMonth}-01`;
    
    // ✨ 更新全域狀態
    setSelected(newDate);
    setCurrentTitle(formatTitle(newDate));
    setShowPicker(false);
  };

  // --- 優化標記計算：確保跨年分資料依然存在 ---
  const markedDates = useMemo(() => {
    let marks = {};

    // 1. 從 Store 中讀取所有夢境日期
    // 假設 dreams 格式為 { "2024-04-15": { ... }, "2026-04-16": { ... } }
    const dreamDates = Object.keys(dreams || {});
    dreamDates.forEach(date => {
      marks[date] = {
        customStyles: {
          container: { backgroundColor: '#7B68EE', borderRadius: 20 },
          text: { color: '#fff' }
        }
      };
    });

    // 2. 標註今天
    if (marks[today]) {
      marks[today].customStyles.text = { color: '#C0FF1A', fontWeight: 'bold' };
    } else {
      marks[today] = {
        customStyles: {
          text: { color: '#C0FF1A', fontWeight: 'bold' }
        }
      };
    }

    // 3. 標註選中日期（最高優先級）
    marks[selected] = {
      ...marks[selected],
      selected: true,
      customStyles: {
        container: {
          backgroundColor: '#C0FF1A',
          width: 40,
          height: 40,
          borderRadius: 20,
          position: 'absolute',
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          top: -5, 
        },
        text: {
          color: '#000',
          fontWeight: 'bold',
          zIndex: 1, 
        },
      },
    };
    return marks;
  }, [dreams, selected]); // 當 dreams 資料或選中日期改變時重新計算

  return (
    <View style={styles.container}>
      <View style={styles.calendarSection}>
        <View style={styles.headerRow}>
  {/* 月份文字現在是純文字，不可點擊 */}
  <Text style={styles.monthText}>{currentTitle}</Text>

  {/* 只有箭頭圖標可以點擊觸發 openPicker */}
  <TouchableOpacity 
    activeOpacity={0.7} 
    onPress={openPicker}
    style={styles.arrowClickArea} // 建議加上一點點 padding 增加好點擊度
  >
    <Image 
      source={require('../img/arrow-down.png')} 
      style={styles.downArrowImage} 
    />
  </TouchableOpacity>

  {/* 中間撐開空間 */}
  <View style={{ flex: 1 }} />

  {/* 右側日曆圖標 */}
  {/* 右側日曆圖標 */}
<TouchableOpacity 
  activeOpacity={0.7} 
  onPress={() => {
    // 1. 拆分當前選擇的日期 (例如 "2026-04-16")
    const [y, m] = selected.split('-'); 
    
    // 2. 將年和月作為參數傳遞
    router.push({
      pathname: '/month',
      params: { 
        year: y, 
        month: m 
      }
    });
  }} 
  style={styles.calendarClickArea}
>
  <Image 
    source={require('../img/calendar.png')} 
    style={styles.calenderImage} 
  />
</TouchableOpacity>
</View>

        <Modal visible={showPicker} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <View style={styles.dropdownContainer}>
              <Text style={styles.pickerHeader}>
                {pickerStep === 1 ? '請選擇年份' : `${tempYear}年 - 選擇月份`}
              </Text>
              
              <View style={styles.pickerContent}>
                {pickerStep === 1 ? (
                  <ScrollView showsVerticalScrollIndicator={true}>
                    {years.map(y => (
                      <TouchableOpacity key={y} style={styles.item} onPress={() => handleYearSelect(y)}>
                        <Text style={[styles.itemText, y === tempYear && {color: '#C0FF1A', fontWeight: 'bold'}]}>
                          {y}年
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={true}>
                    <View style={styles.monthGrid}>
                      {months.map(m => (
                        <TouchableOpacity key={m} style={styles.monthItem} onPress={() => handleFinalJump(m)}>
                          <Text style={[styles.itemText, (new Date(selected).getMonth() + 1) === m && (tempYear === new Date(selected).getFullYear()) && {color: '#C0FF1A'}]}>
                            {m}月
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Pressable>
        </Modal>

        <Calendar
          key={`calendar-${selected.substring(0, 7)}`} // ✨ 強制組件在月份切換時重繪
          current={selected}
          renderHeader={() => null}
          hideArrows={true}
          hideHeader={true}
          enableSwipeMonths={true}
          hideExtraDays={false}
          markingType={'custom'}
          onMonthChange={(month) => {
            setCurrentTitle(formatTitle(month.dateString));
            setSelected(month.dateString);
            
          }}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: '#fff',
            todayTextColor: '#C0FF1A',
            dayTextColor: '#fff',
            textDisabledColor: '#f3f3f3',
            'stylesheet.day.basic': {
            base: {
              width: 32,
              height: 32,
              alignItems: 'center'
            },
            disabledText: {
              color: 'rgba(255, 255, 255, 0.25)', // 強制覆蓋 disabled 文字顏色
            }
          },
            arrowColor: 'transparent',
          }}
          markedDates={markedDates}
          onDayPress={day => {
            setSelected(day.dateString);
          }}
        />
      </View>

      <DreamSheet 
        selectedDate={selected} 
      />
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252736',
    paddingTop: 61,
  },
  calendarSection: {
    paddingHorizontal: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    marginBottom: 25,
  },
  monthText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#C0FF1A',
    marginRight: 16,
  },
  downArrowImage: { width: 40, height: 22, resizeMode: 'contain' },
  calenderImage: { width: 32, height: 32, resizeMode: 'contain' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#32354a',
    borderRadius: 20,
    width: '80%',
    maxHeight: '60%',
    padding: 20,
  },
  pickerHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 10,
  },
  pickerContent: { height: 300 },
  item: { paddingVertical: 15, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#444' },
  itemText: { color: '#fff', fontSize: 18 },
  backBtn: { padding: 10, marginBottom: 10, backgroundColor: '#444', borderRadius: 8, alignItems: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthItem: { width: '30%', paddingVertical: 20, alignItems: 'center', marginVertical: 5, backgroundColor: '#3d405b', borderRadius: 10 }
});