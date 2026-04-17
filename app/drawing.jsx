import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  StatusBar,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Rect, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Color from 'color';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import ViewShot from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');
const CANVAS_BG = '#F3F3F3';

// 獨立的圓形按鈕組件
const CircleButton = React.memo(({ Icon, name, onPress, isActive, activeColor }) => (
  <TouchableOpacity 
    style={[styles.independentCircle, isActive && styles.circleActive]} 
    onPress={onPress}
  >
    <Icon 
      name={name} 
      size={26} 
      color={isActive ? (activeColor || "#000") : "#444"} 
    />
  </TouchableOpacity>
));

// 全寬度滑桿組件
const FullWidthSlider = React.memo(({ value, onValueChange, max, gradientSteps, id, isHue }) => (
  <View style={styles.fullSliderRow}>
    <View style={styles.fullSliderWrapper}>
      <Svg height="48" width={width} style={styles.fullGradientBg}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            {isHue ? (
              ['#f00','#ff0','#0f0','#0ff','#00f','#f0f','#f00'].map((c,i)=> <Stop key={i} offset={i/6} stopColor={c} />)
            ) : (
              gradientSteps.map((s, i) => <Stop key={i} offset={s.offset} stopColor={s.color} />)
            )}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="48" fill={`url(#${id})`} />
      </Svg>
      <Slider 
        style={{ width: width, height: 60 }} 
        thumbTintColor="#fff" 
        minimumValue={0} 
        maximumValue={max} 
        value={value} 
        onValueChange={onValueChange} 
        minimumTrackTintColor="transparent" 
        maximumTrackTintColor="transparent" 
      />
    </View>
  </View>
));

export default function CombinedDrawingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const viewShotRef = useRef(null);

  const [paths, setPaths] = useState([]);
  const [initialPathsCount, setInitialPathsCount] = useState(0); // 紀錄初始路徑數量
  const [currentPath, setCurrentPath] = useState('');
  const [redoStack, setRedoStack] = useState([]);
  const [activeTool, setActiveTool] = useState('pen');
  const [isSaved, setIsSaved] = useState(false); // 標記是否按下確認儲存

  const [h, setH] = useState(0);
  const [s, setS] = useState(100);
  const [v, setV] = useState(100);
  const selectedColor = useMemo(() => Color.hsv(h, s, v).hex(), [h, s, v]);

  // 保持最新狀態給 PanResponder 使用
  const stateRef = useRef({ activeTool, selectedColor });
  
  useEffect(() => {
    stateRef.current = { activeTool, selectedColor };
  }, [activeTool, selectedColor]);

  // 初始化載入
  useEffect(() => {
    if (params.existingPaths) {
      try {
        const decoded = JSON.parse(params.existingPaths);
        setPaths(decoded);
        setInitialPathsCount(decoded.length);
      } catch (e) {
        console.error("解析路徑失敗", e);
      }
    }
  }, [params.existingPaths]);

  // 檢查變更並彈出警告
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 如果已經儲存，或是路徑沒有任何更動（數量相同），直接退出
      const hasChanges = paths.length !== initialPathsCount;
      
      if (isSaved || !hasChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        '捨棄變更？',
        '您有尚未儲存的繪圖內容，確定要離開嗎？',
        [
          { text: '取消', style: 'cancel', onPress: () => {} },
          {
            text: '確定離開',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, paths, isSaved, initialPathsCount]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
        setRedoStack([]); 
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        setCurrentPath((prevPath) => {
          if (prevPath) {
            const { activeTool: currentTool, selectedColor: currentColor } = stateRef.current;
            const isEraser = currentTool === 'eraser';
            const newPath = {
              d: prevPath,
              color: isEraser ? CANVAS_BG : currentColor, 
              strokeWidth: isEraser ? 40 : 5, 
            };
            setPaths((prevPaths) => [...prevPaths, newPath]);
          }
          return ''; 
        });
      },
    })
  ).current;

  const handleUndo = useCallback(() => {
    setPaths((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const last = prevRedo[prevRedo.length - 1];
      setPaths((p) => [...p, last]);
      return prevRedo.slice(0, -1);
    });
  }, []);

  const onConfirm = async () => {
  try {
    if (!viewShotRef.current) return;

    setIsSaved(true); // 設定為已儲存，避免觸發離開警告

    // 1. 稍微延遲，給予 SVG 渲染路徑的時間
    // 2. 使用 capture 參數確保捕捉的是目前的 Buffer
    const uri = await viewShotRef.current.capture({
      format: "png",
      quality: 1,
      result: "tmpfile", // 明確指定輸出到檔案
    });

    router.replace({
      pathname: '/edit',
      params: { 
        ...params,
        imageUri: uri,
        existingPaths: JSON.stringify(paths) 
      }
    });
    console.log('當前路徑數量:', paths.length)
  } catch (e) {
    console.error(e);
    setIsSaved(false); // 若失敗則重設狀態
  }
};

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* ViewShot 包裹畫布層，設定明確背景色 */}
      <ViewShot 
        ref={viewShotRef} 
        style={[styles.canvas, { backgroundColor: CANVAS_BG }]} 
        options={{ format: 'png', quality: 1.0 }}
      >
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          <Svg style={StyleSheet.absoluteFill} collapsable={false}>
            {paths.map((path, index) => (
              <Path 
                key={`path-${index}`} 
                d={path.d} 
                stroke={path.color} 
                strokeWidth={path.strokeWidth} 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={activeTool === 'eraser' ? CANVAS_BG : selectedColor}
                strokeWidth={activeTool === 'eraser' ? 40 : 5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
      </ViewShot>

      {/* UI 控制層 (在 ViewShot 之外，不會被截進去) */}
      <SafeAreaView style={styles.overlayUI} pointerEvents="box-none">
        <View style={styles.buttonRow}>
          <CircleButton Icon={MaterialCommunityIcons} name="pencil" isActive={activeTool === 'pen'} onPress={() => setActiveTool('pen')} activeColor={selectedColor} />
          <CircleButton Icon={MaterialCommunityIcons} name="eraser" isActive={activeTool === 'eraser'} onPress={() => setActiveTool('eraser')} />
          <CircleButton Icon={MaterialIcons} name="undo" onPress={handleUndo} />
          <CircleButton Icon={MaterialIcons} name="redo" onPress={handleRedo} /> 
          <CircleButton Icon={Ionicons} name="checkmark" onPress={onConfirm} />
        </View>
      </SafeAreaView>

      <View style={styles.bottomPicker}>
        <FullWidthSlider id="val" value={v} max={100} onValueChange={setV} gradientSteps={[{offset: '0', color: '#000'}, {offset: '1', color: Color.hsv(h, s, 100).hex()}]} />
        <FullWidthSlider id="sat" value={s} max={100} onValueChange={setS} gradientSteps={[{offset: '0', color: '#fff'}, {offset: '1', color: Color.hsv(h, 100, 100).hex()}]} />
        <FullWidthSlider id="hue" value={h} max={360} onValueChange={setH} isHue />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: CANVAS_BG 
  },
  canvas: { 
    flex: 1,
    width: width,
    height: height
  },
  overlayUI: { 
    position: 'absolute', 
    top: 66, 
    left: 0, 
    right: 0,
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingHorizontal: 15, 
    width: '100%' 
  },
  independentCircle: { 
    backgroundColor: '#FFF', 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  circleActive: { 
    backgroundColor: '#E0E0E0', 
    transform: [{ scale: 0.9 }] 
  },
  bottomPicker: { 
    position: 'absolute', 
    bottom: 42, 
    width: '100%' 
  },
  fullSliderRow: { 
    height: 48, 
    width: '100%',
    marginBottom: 0
  },
  fullSliderWrapper: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  fullGradientBg: { 
    position: 'absolute' 
  },
});