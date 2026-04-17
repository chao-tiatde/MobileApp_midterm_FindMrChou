import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Animated, PanResponder, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDreamStore } from '../store/useDreamStore'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✨ 確保 moodMap 完整
const moodMap = {
  '非常差': require('../img/very-bad.png'),
  '差': require('../img/bad.png'),
  '普通': require('../img/neutral.png'),
  '好': require('../img/good.png'),
  '非常好': require('../img/very-good.png'),
};

const DreamSheet2 = ({ selectedDate, expandedRatio = 0.51 }) => {
  const router = useRouter();
  const dreams = useDreamStore((state) => state.dreams);
  const deleteDream = useDreamStore((state) => state.deleteDream); 
  
  const EXPANDED_HEIGHT = -SCREEN_HEIGHT * expandedRatio;

  // ✨ 精確抓取當前夢境資料
  let currentDream = null;
  if (Array.isArray(dreams)) {
    currentDream = dreams.find(d => d.date === selectedDate);
  } else if (dreams && typeof dreams === 'object') {
    currentDream = dreams[selectedDate];
  }

  const lastOffset = useRef(0);
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(dragY, { toValue: 0, friction: 8, useNativeDriver: false }).start();
    lastOffset.current = 0;
  }, [selectedDate]);

  const handleDelete = () => {
    if (!deleteDream) return;
    Alert.alert("刪除紀錄", `確定要刪除 ${selectedDate} 的夢境紀錄嗎？`, [
      { text: "取消", style: "cancel" },
      { 
        text: "刪除", 
        style: "destructive", 
        onPress: () => { 
          deleteDream(selectedDate); 
          Animated.spring(dragY, { toValue: 0, friction: 8, useNativeDriver: false }).start();
          lastOffset.current = 0;
        } 
      }
    ]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderGrant: () => {
        dragY.setOffset(lastOffset.current);
        dragY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: dragY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        dragY.flattenOffset();
        const destination = gestureState.moveY < SCREEN_HEIGHT * 0.75 ? EXPANDED_HEIGHT : 0;
        Animated.spring(dragY, { toValue: destination, friction: 8, tension: 40, useNativeDriver: false }).start();
        lastOffset.current = destination;
      },
    })
  ).current;

  return (
    <Animated.View 
      style={[styles.sheetContainer, { 
        transform: [{ translateY: dragY.interpolate({
          inputRange: [EXPANDED_HEIGHT, 0], 
          outputRange: [EXPANDED_HEIGHT, 0],
          extrapolate: 'clamp'
        }) }] 
      }]}
    >
      <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
        <View style={styles.sheetHandle} />
      </View>
      
      <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}>
          <Text style={styles.noDataText} numberOfLines={1}>{currentDream?.summary || "暫無資料"}</Text>
          <View style={styles.headerButtons}>
            {currentDream && (
              <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                <Image source={require('../img/delete.png')} style={styles.deleteImage} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => currentDream ? router.push({ pathname: '/edit', params: { ...currentDream, tags: Array.isArray(currentDream.tags) ? currentDream.tags.join(',') : currentDream.tags } }) : router.push(`/select-mode?date=${selectedDate}`)}>
              <Image source={require('../img/edit.png')} style={styles.editImage} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.dateInfo}>日期：{selectedDate}</Text>

        {currentDream ? (
          <View style={styles.dreamDataContainer}>
            {/* ✨ 1. 心情與屬性標籤 */}
            <View style={styles.tagRow}>
              <View style={styles.moodTransparentWrapper}>
                <Image 
                  source={moodMap[currentDream.mood] || moodMap['普通']} 
                  style={styles.sheetMoodImage} 
                />
              </View>
              {currentDream.tags && (Array.isArray(currentDream.tags) ? currentDream.tags : currentDream.tags.split(',')).map((tag, i) => (
                <Text key={i} style={styles.tagBadge}>#{tag}</Text>
              ))}
            </View>
            
            {/* ✨ 2. 夢境詳情 (判斷關鍵字或純文字模式) */}
            <Text style={styles.contentLabel}>夢境詳情</Text>
            {currentDream.mode === 'full' ? (
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>{currentDream.content || "目前尚無夢境內容描述。"}</Text>
              </View>
            ) : (
              <View style={styles.tagRow}>
                {currentDream.content?.split(',').map((tag, i) => (
                  <Text key={i} style={styles.tagBadge}>{tag}</Text>
                )) || <Text style={styles.emptyContentText}>無內容標籤</Text>}
              </View>
            )}

            {/* ✨ 3. AI 解夢分析 */}
            <Text style={styles.contentLabel}>AI 解夢分析</Text>
            <View style={styles.aiBox}>
                <Text style={styles.aiText}>{currentDream.aiResponse || "尚未取得 AI 分析。"}</Text>
            </View>

            {/* ✨ 4. 夢境印象圖片 */}
            {currentDream.imageUri && (
              <View style={styles.imageSection}>
                <Text style={styles.contentLabel}>夢境印象</Text>
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: currentDream.imageUri }} style={styles.dreamImage} />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>這天還沒有紀錄夢境喔</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: { 
    height: SCREEN_HEIGHT, 
    backgroundColor: '#F3F3F3', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT * 0.68, // 初始位置
    elevation: 20, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  dragHandleArea: { width: '100%', paddingVertical: 15, alignItems: 'center' },
  sheetHandle: { width: 60, height: 8, backgroundColor: '#D9D9D9', borderRadius: 10 },
  sheetContent: { paddingHorizontal: 30, paddingBottom: SCREEN_HEIGHT * 0.6 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  deleteImage: { width: 30, height: 30, marginRight: 15 },
  editImage: { width: 28, height: 28 },
  noDataText: { fontSize: 24, flex: 1, fontWeight: 'bold', color: '#252736' },
  dateInfo: { color: '#999', fontSize: 14, marginBottom: 10},
  dreamDataContainer: { marginTop: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 15 },
  moodTransparentWrapper: { marginRight: 12 },
  sheetMoodImage: { width: 25, height: 25, resizeMode: 'contain' },
  tagBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, fontSize: 12, marginRight: 8, marginBottom: 5, color: '#666' },
  contentLabel: { fontSize: 18, fontWeight: 'bold', color: '#252736', marginTop: 10, marginBottom: 10 },
  contentBox: { backgroundColor: '#866CD1', padding: 20, borderRadius: 20, marginBottom: 15 },
  aiBox: { backgroundColor: '#252732', padding: 20, borderRadius: 20 },
  contentText: { color: '#FFF', lineHeight: 22 },
  aiText: { color: '#FFF', lineHeight: 20 },
  imageSection: { marginTop: 20 },
  imagePreviewWrapper: { minHeight: 200, width: '100%', 
    maxHeight: 500, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E0E0E3' },
  dreamImage: { width: '100%', height: '100%', resizeMode: 'cover',marginBottom:200, },
  emptyState: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#CCC', fontSize: 16 }
});

export default DreamSheet2;