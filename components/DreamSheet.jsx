import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Animated, PanResponder, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDreamStore } from '../store/useDreamStore'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const moodMap = {
  '非常差': require('../img/very-bad.png'),
  '差': require('../img/bad.png'),
  '普通': require('../img/neutral.png'),
  '好': require('../img/good.png'),
  '非常好': require('../img/very-good.png'),
};

const DreamSheet = ({ selectedDate }) => {
  const router = useRouter();
  const dreams = useDreamStore((state) => state.dreams);
  const deleteDream = useDreamStore((state) => state.deleteDream); 
  
  let currentDream = null;
  if (Array.isArray(dreams)) {
    currentDream = dreams.find(d => d.date === selectedDate);
  } else if (dreams && typeof dreams === 'object') {
    currentDream = dreams[selectedDate];
  }

  const lastOffset = useRef(0);
  const dragY = useRef(new Animated.Value(0)).current;

  // 切換日期時重置位置到最底部 (0)
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
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        dragY.setOffset(lastOffset.current);
        dragY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: dragY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        dragY.flattenOffset();
        
        // --- 修改處：將拉上去的目標高度調低 (原本是 -SCREEN_HEIGHT * 0.5) ---
        const expandedHeight = -SCREEN_HEIGHT * 0.35; 
        
        // 判定回彈：如果手勢移動超過設定的高度範圍，則彈至展開狀態，否則收回
        const destination = gestureState.moveY < SCREEN_HEIGHT * 0.7 ? expandedHeight : 0;
        
        Animated.spring(dragY, { toValue: destination, friction: 8, tension: 40, useNativeDriver: false }).start();
        lastOffset.current = destination;
      },
    })
  ).current;

  return (
    <Animated.View 
      style={[styles.sheetContainer, { 
        transform: [{ translateY: dragY.interpolate({
          // --- 修改處：插值範圍需與上方 expandedHeight 一致 ---
          inputRange: [-SCREEN_HEIGHT * 0.35, 0], 
          outputRange: [-SCREEN_HEIGHT * 0.35, 0],
          extrapolate: 'clamp'
        }) }] 
      }]}
    >
      <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
        <View style={styles.sheetHandle} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.sheetContent} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.noDataText} numberOfLines={1}>
            {currentDream?.summary || "暫無資料"}
          </Text>
          <View style={styles.headerButtons}>
            {currentDream && (
              <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                <Image source={require('../img/delete.png')} style={styles.deleteImage} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => 
                currentDream 
                ? router.push({ 
                    pathname: '/edit', 
                    params: { 
                      ...currentDream, 
                      tags: Array.isArray(currentDream.tags) ? currentDream.tags.join(',') : currentDream.tags 
                    } 
                  }) 
                : router.push(`/select-mode?date=${selectedDate}`)
              }
            >
              <Image source={require('../img/edit.png')} style={styles.editImage} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.dateInfo}>日期：{selectedDate}</Text>

        {currentDream ? (
          <View style={styles.dreamDataContainer}>
            <View style={styles.tagRow}>
              <View style={styles.moodTransparentWrapper}>
                <Image 
                  source={moodMap[currentDream.mood] || moodMap['普通']} 
                  style={styles.sheetMoodImage} 
                />
              </View>
              {currentDream.tags && currentDream.tags.length > 0 ? (
                (Array.isArray(currentDream.tags) ? currentDream.tags : currentDream.tags.split(',')).map((tag, i) => (
                  <Text key={i} style={styles.tagBadge}>#{tag}</Text>
                ))
              ) : (
                <Text style={styles.emptyContentText}>無屬性標籤</Text>
              )}
            </View>
            
            <Text style={styles.contentLabel}>夢境詳情</Text>
            {currentDream.mode === 'full' ? (
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>
                  {(!currentDream.content || currentDream.content.trim() === "") 
                    ? "目前尚無夢境內容描述。" 
                    : currentDream.content}
                </Text>
              </View>
            ) : (
              <View style={styles.tagRow}>
                {(!currentDream.content || currentDream.content.trim() === "") ? (
                  <View style={[styles.contentBox, { width: '100%' }]}>
                    <Text style={styles.contentText}>目前尚無關鍵字標籤。</Text>
                  </View>
                ) : (
                  currentDream.content.split(',').map((tag, i) => (
                    <Text key={i} style={styles.tagBadge}>{tag}</Text>
                  ))
                )}
              </View>
            )}

            <Text style={styles.contentLabel}>AI 解夢分析</Text>
            <View style={styles.aiBox}>
                <Text style={styles.aiText}>{currentDream.aiResponse || "尚未取得 AI 分析。"}</Text>
            </View>

            {currentDream.imageUri && (
              <View style={styles.imageSection}>
                <Text style={styles.contentLabel}>夢境印象</Text>
                <View style={styles.imagePreviewWrapper}>
                  <Image 
                    source={{ uri: currentDream.imageUri }} 
                    style={styles.dreamImage} 
                    onError={(e) => console.log('圖片載入失敗', e.nativeEvent.error)}
                  />
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
    height: SCREEN_HEIGHT * 1.5, 
    backgroundColor: '#F3F3F3', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    elevation: 20, 
    marginTop: 45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  dragHandleArea: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
  },
  sheetHandle: { 
    width: 60, 
    height: 8, 
    backgroundColor: '#D9D9D9', 
    borderRadius: 10, 
  },
  sheetContent: { 
    paddingHorizontal: 30, 
    paddingTop: 5, 
    paddingBottom: SCREEN_HEIGHT * 0.6 
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginRight: 5 },
  deleteImage: { width: 30, height: 30, marginRight: 15 },
  editImage: { width: 28, height: 28 },
  noDataText: { fontSize: 24, flex: 1, fontWeight: 'bold', color: '#252736' },
  dateInfo: { color: '#999', fontSize: 14, marginBottom: 10},
  dreamDataContainer: { marginTop: 10,marginBottom: 200 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 15 },
  moodTransparentWrapper: { marginRight: 12 },
  sheetMoodImage: { width: 25, height: 25, resizeMode: 'contain' },
  tagBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, fontSize: 12, marginRight: 8, marginBottom: 5, color: '#666' },
  imageSection: { marginTop: 20 },
  imagePreviewWrapper: { 
    width: '100%', 
    minHeight: 200, 
    maxHeight: 500, 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: '#E0E0E3', 
    borderWidth: 1, 
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dreamImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain'
  },
  contentLabel: { fontSize: 18, fontWeight: 'bold', color: '#252736', marginTop: 10, marginBottom: 10 },
  contentBox: { marginBottom: 15,backgroundColor: '#866CD1', padding: 20, borderRadius: 20 },
  aiBox: { backgroundColor: '#252732', padding: 20, borderRadius: 20,color: '#FFF', },
  contentText: { letterSpacing: 1,color: '#FFF', lineHeight: 22 },
  aiText: { letterSpacing: 1,color: '#FFF', lineHeight: 20 },
  emptyState: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#CCC', fontSize: 16 },
  emptyContentText: { color: '#999', fontSize: 14 }
});

export default DreamSheet;