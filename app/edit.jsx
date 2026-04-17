import React, { useState, useEffect } from 'react'; 
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router'; 
import { useDreamStore } from '../store/useDreamStore';
import { Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// 定義初始預設標籤，方便過濾與比對
const DEFAULT_TAG_POOL = [
  '清醒夢', '續集夢', '夢中夢', '預知夢', '噩夢', '超現實',
  '第1視角', '第2視角', '第3視角', 
  '跳轉', '連貫', '極短', '1天', '2天以上' 
];

export default function EditPage() {
  const router = useRouter();
  const navigation = useNavigation(); 
  const params = useLocalSearchParams();
  const { date, mode, tags, mood: prevMood, summary: prevSummary, content: prevContent, imageUri: prevImageUri } = params; 
  const addDream = useDreamStore((state) => state.addDream);

  // --- 狀態管理 ---
  const [tagPool, setTagPool] = useState(DEFAULT_TAG_POOL);
  
  const [selectedTags, setSelectedTags] = useState(params.currentTags ? params.currentTags.split(',') : (tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [])); 
  const [newTagInput, setNewTagInput] = useState('');
  const [mood, setMood] = useState(params.currentMood || prevMood || null); 
  const [summary, setSummary] = useState(params.currentSummary || prevSummary || '');
  const [content, setContent] = useState(params.currentContent || prevContent || '');
  
  const [imageUri, setImageUri] = useState(params.imageUri || prevImageUri || null);
  const [imageSource, setImageSource] = useState(params.imageUri ? 'draw' : (prevImageUri ? 'picker' : null));
  const [existingPaths, setExistingPaths] = useState(params.existingPaths || null);

  const initialContentTags = (mode === 'partial' && (params.currentContent || prevContent)) 
    ? (params.currentContent || prevContent).split(',') 
    : [];
  const [contentTagPool, setContentTagPool] = useState(initialContentTags); 
  const [selectedContentTags, setSelectedContentTags] = useState(initialContentTags);
  const [newContentTagInput, setNewContentTagInput] = useState('');
  
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  // ✨ 核心修正：同步自定義標籤到 pool 中，確保編輯時能顯示按鈕
  useEffect(() => {
    if (selectedTags.length > 0) {
      setTagPool(prev => {
        const missing = selectedTags.filter(t => !prev.includes(t));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
    }
  }, [selectedTags]);

  useEffect(() => {
    if (params.imageUri) {
      setImageUri(params.imageUri);
      setImageSource('draw');
    }
    if (params.existingPaths) {
      setExistingPaths(params.existingPaths);
    }
  }, [params.imageUri, params.existingPaths]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const hasChanges = summary !== (prevSummary || '') || 
                         content !== (prevContent || '') || 
                         selectedTags.length > (tags ? (Array.isArray(tags) ? tags.length : tags.split(',').length) : 0) ||
                         mood !== (prevMood || null) ||
                         imageUri !== (prevImageUri || null);

      if (isSaved || !hasChanges) return;
      e.preventDefault();
      Alert.alert(
        '捨棄變更？',
        '您有尚未儲存的更動，確定要離開並捨棄這些內容嗎？',
        [{ text: '取消', style: 'cancel' }, { text: '確定離開', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) }]
      );
    });
    return unsubscribe;
  }, [navigation, isSaved, summary, content, selectedTags, mood, imageUri]);

  const addNewTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tagPool.includes(trimmed)) {
      setTagPool([...tagPool, trimmed]);
    }
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setNewTagInput('');
  };

  const addNewContentTag = () => {
    const trimmed = newContentTagInput.trim();
    if (!trimmed) return;
    if (!contentTagPool.includes(trimmed)) {
      setContentTagPool([...contentTagPool, trimmed]);
      setSelectedContentTags([...selectedContentTags, trimmed]);
    } else if (!selectedContentTags.includes(trimmed)) {
      setSelectedContentTags([...selectedContentTags, trimmed]);
    }
    setNewContentTagInput('');
  };

  const toggleTag = (label, list, setList) => {
    if (list.includes(label)) {
      setList(list.filter(t => t !== label));
    } else {
      setList([...list, label]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageSource('picker');
      setExistingPaths(null);
    }
  };

  const handleGoToDrawing = () => {
    router.push({
      pathname: '/drawing',
      params: { 
        ...params, 
        existingPaths: existingPaths,
        currentSummary: summary,
        currentContent: mode === 'partial' ? selectedContentTags.join(',') : content,
        currentMood: mood,
        currentTags: selectedTags.join(',')
      }
    });
  };

  const handleEditImage = () => {
    if (imageSource === 'draw') {
      handleGoToDrawing();
    } else {
      pickImage();
    }
  };

  const handleDeleteImage = () => {
    setImageUri(null);
    setImageSource(null);
    setExistingPaths(null);
  };

  const handleSave = async (withAI) => {
    const finalMood = mood || '普通'; 
    let finalSummary = summary;
    let finalContent = content;
    let aiResponse = "尚未取得 AI 分析。";

    if (mode === 'partial') {
      finalSummary = selectedContentTags.slice(0, 3).join('、');
      finalContent = selectedContentTags.join(','); 
    }

    if (withAI) {
      setIsLoading(true);
      try {
        const apiKey = "AIzaSyBZsbAbBcZ6vmsXdzcZICNW8uTRv3LhjXA";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;

        const prompt = `你是一位專業且溫暖的解夢機器。請針對以下夢境資訊提供一段約 100 字的深度分析與建議：
        - 夢境內容：${finalContent}
        - 夢境標籤：${selectedTags.join(', ')}
        - 夢中情緒：${finalMood}
        請務必使用「繁體中文」回答，語氣要親切。`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        });

        const data = await response.json();
        if (response.ok && data.candidates && data.candidates[0].content) {
          aiResponse = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error(data.error?.message || "AI 回應異常");
        }
      } catch (error) {
        console.error("AI 分析失敗", error);
        aiResponse = "分析失敗，請檢查網路或 API 權限。";
        Alert.alert("分析失敗", error.message);
      } finally {
        setIsLoading(false);
      }
    }

    setIsSaved(true); 
    addDream({
      date: date || new Date().toLocaleDateString('sv-SE'),
      mode: mode,
      tags: selectedTags,
      mood: finalMood,
      summary: finalSummary,
      content: finalContent,
      aiRequested: withAI,
      aiResponse: aiResponse, 
      imageUri: imageUri,
      existingPaths: existingPaths 
    });

    router.dismissAll();
    router.replace('/'); 
  };

  const TagBtn = ({ label, selectedList, onToggle }) => (
    <TouchableOpacity 
      style={[styles.tagBtn, selectedList.includes(label) && styles.tagBtnActive]} 
      onPress={() => onToggle(label)}
    >
      <Text style={[styles.tagText, selectedList.includes(label) && styles.tagTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const moodOptions = [
    { label: '非常差', image: require('../img/very-bad.png') },
    { label: '差', image: require('../img/bad.png') },
    { label: '普通', image: require('../img/neutral.png') },
    { label: '好', image: require('../img/good.png') },
    { label: '非常好', image: require('../img/very-good.png') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>標籤</Text>
      <Text style={styles.subTitle}>選擇符合您夢境的屬性標籤</Text>
      
      <View style={styles.purpleCard}>
        <Text style={styles.innerLabel}>類型</Text>
        <View style={styles.row}>
          {tagPool.filter(t => DEFAULT_TAG_POOL.slice(0,6).includes(t)).map(t => (
            <TagBtn key={t} label={t} selectedList={selectedTags} onToggle={(l) => toggleTag(l, selectedTags, setSelectedTags)} />
          ))}
        </View>

        <Text style={styles.innerLabel}>視角</Text>
        <View style={styles.row}>
          {tagPool.filter(t => DEFAULT_TAG_POOL.slice(6,9).includes(t)).map(t => (
            <TagBtn key={t} label={t} selectedList={selectedTags} onToggle={(l) => toggleTag(l, selectedTags, setSelectedTags)} />
          ))}
        </View>

        <Text style={styles.innerLabel}>時間</Text>
        <View style={styles.row}>
          {tagPool.filter(t => DEFAULT_TAG_POOL.slice(9,14).includes(t)).map(t => (
            <TagBtn key={t} label={t} selectedList={selectedTags} onToggle={(l) => toggleTag(l, selectedTags, setSelectedTags)} />
          ))}
        </View>

        <Text style={styles.innerLabel}>新增標籤</Text>
        <View style={styles.inputWrapper}>
          <TextInput 
            style={styles.whiteInput} 
            value={newTagInput} 
            onChangeText={setNewTagInput} 
            placeholder="自定義標籤..." 
            placeholderTextColor="#ddd"
            onSubmitEditing={addNewTag}
          />
          <TouchableOpacity onPress={addNewTag}>
            <Check stroke="#fff" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          {/* 顯示所有不屬於預設清單的標籤（自定義標籤） */}
          {tagPool.filter(t => !DEFAULT_TAG_POOL.includes(t)).map((t, idx) => (
            <TagBtn key={`custom-${idx}`} label={t} selectedList={selectedTags} onToggle={(l) => toggleTag(l, selectedTags, setSelectedTags)} />
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>心情指數</Text>
      <Text style={styles.subTitle}>選擇符合您夢境的心情指數</Text>
      <View style={styles.greenCard}>
        <View style={styles.moodRow}>
          {moodOptions.map((m) => (
            <TouchableOpacity key={m.label} style={styles.moodBtn} onPress={() => setMood(m.label)}>
              <Image source={m.image} style={[styles.moodImage, mood === m.label && styles.moodImageActive]} />
              <Text style={[styles.moodLabel, mood === m.label && styles.moodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {mode === 'full' ? (
        <View>
          <Text style={styles.sectionTitle}>夢境大綱</Text>
          <Text style={styles.subTitle}>10字以內說明夢境</Text>
          <TextInput style={styles.darkInput} value={summary} onChangeText={(t) => setSummary(t.substring(0, 10))} placeholder="說明夢境..." placeholderTextColor="#888" />
          <Text style={styles.sectionTitle}>詳細內容</Text>
          <Text style={styles.subTitle}>夢境敘述</Text>
          <TextInput style={styles.contentInput} multiline value={content} onChangeText={setContent} placeholder="寫下夢細節..." placeholderTextColor="#ccc" scrollEnabled={false} />
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>內容</Text>
          <View style={styles.purpleCard}>
            <Text style={styles.innerLabel}>新增內容標籤</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.whiteInput} 
                value={newContentTagInput} 
                onChangeText={setNewContentTagInput} 
                placeholder="寫下夢中有印象的人、物..." 
                placeholderTextColor="#ddd" 
                onSubmitEditing={addNewContentTag}
              />
              <TouchableOpacity onPress={addNewContentTag}>
                <Check stroke="#fff" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              {contentTagPool.map((t, index) => (
                <TagBtn key={`content-${index}`} label={t} selectedList={selectedContentTags} onToggle={(l) => toggleTag(l, selectedContentTags, setSelectedContentTags)} />
              ))}
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>繪圖</Text>
      <Text style={styles.subTitle}>畫出或選擇你對夢境的印象</Text>
      
      <View style={styles.greenCard}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image 
              key={imageUri}
              source={{ uri: imageUri }} 
              style={styles.previewImage }
            />
            <View style={styles.previewOverlay}>
              <TouchableOpacity onPress={handleEditImage} style={styles.previewActionBtn}>
                <Image source={require('../img/edit.png')} style={styles.previewActionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteImage} style={styles.previewActionBtn}>
                <Image source={require('../img/delete.png')} style={styles.previewActionIcon} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
              <Text style={styles.BtnText}>上傳圖片</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageDrawBtn} onPress={handleGoToDrawing}>
              <Text style={styles.BtnText}>前往繪圖</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ marginTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#866CD1" />
          <Text style={{ marginTop: 10, color: '#866CD1' }}>AI 正在分析夢境中...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.finalAIBtn} onPress={() => handleSave(true)}>
            <Text style={styles.BtnText}>更新並送至 AI 解夢</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finalSaveBtn} onPress={() => handleSave(false)}>
            <Text style={styles.BtnText}>直接更新儲存</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3', paddingHorizontal: 25, paddingTop: 10 },
  sectionTitle: { fontSize: 25, fontWeight: 'bold', marginTop: 60, marginBottom: 4 },
  subTitle: { fontSize: 18, color: '#252736', marginBottom: 13 },
  purpleCard: { backgroundColor: '#866CD1', borderRadius: 30, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 35 },
  greenCard: { backgroundColor: '#C0FF1A', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 25 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  innerLabel: { color: '#fff', marginTop: 15, fontSize: 18, fontWeight: '600' },
  tagBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#000', minWidth: 70, alignItems: 'center' },
  tagBtnActive: { backgroundColor: '#252736' },
  tagText: { color: '#000', fontSize: 14 },
  tagTextActive: { color: '#fff' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#fff' },
  whiteInput: { flex: 1, color: '#fff', height: 50, fontSize: 15 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  moodBtn: { alignItems: 'center', padding: 5 },
  moodImage: { width: 40, height: 40 },
  moodImageActive: { transform: [{ scale: 1.3 }], borderWidth: 1, borderColor: '#000', borderRadius: 20 },
  moodLabel: { marginTop: 8, fontSize: 12, color: '#000' },
  moodLabelActive: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  darkInput: { letterSpacing: 1,backgroundColor: '#252736', borderRadius: 30, color: '#fff', padding: 20 },
  contentInput: { letterSpacing: 1,backgroundColor: '#866cd1', borderRadius: 30, color: '#fff', padding: 20, minHeight: 120, textAlignVertical: 'top' },
  imageUploadBtn: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 15, borderWidth: 1 },
  imageDrawBtn: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 30, alignItems: 'center', borderWidth: 1 },
  finalAIBtn:{borderWidth: 1, borderColor: '#252736', borderRadius: 30, padding: 15, alignItems: 'center', marginTop: 60},
  finalSaveBtn: { borderWidth: 1, borderColor: '#252736', borderRadius: 30, padding: 15, alignItems: 'center', marginTop: 15, marginBottom: 60 },
  BtnText:{fontSize:18},
  previewContainer: { 
    width: '100%', 
    height: 300, 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: '#EEE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain' 
  },
  previewOverlay: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 10 },
  previewActionBtn: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 10 },
  previewActionIcon: { width: 22, height: 22 }
});