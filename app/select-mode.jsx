import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SelectMode() {
  const router = useRouter();
  const { date } = useLocalSearchParams();

  // 封裝一個按鈕組件，減少重複程式碼並處理「點選中」的樣式
  const ModeButton = ({ text, mode }) => (
    <Pressable
      onPress={() => router.push(`/edit?date=${date}&mode=${mode}`)}
      style={({ pressed }) => [
        styles.btnWhite,
        pressed && styles.btnActive // 當被按下時套用黑色背景
      ]}
    >
      {({ pressed }) => (
        <Text style={[
          styles.btnTextBlack,
          pressed && styles.btnTextActive // 當被按下時文字變白色
        ]}>
          {text}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>您對於該天夢境{"\n"}的記憶強度？</Text>
      
      <ModeButton 
        text={`我大概記得夢裡\n發生了什麼。`} 
        mode="full" 
      />

      <ModeButton 
        text={`我只記得夢裡\n出現過的人、物。`} 
        mode="partial" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F3F3', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 50, 
    lineHeight: 35 
  },
  btnWhite: { 
    width: '85%', 
    padding: 25, 
    borderRadius: 30, 
    borderWidth: 1, 
    backgroundColor: '#FFFFF',
    borderColor: '#000', 
    marginBottom: 25,
    paddingVertical: 8, // 這會覆蓋 padding 的垂直部分
    backgroundColor: 'transparent', // 預設透明或白色
  },
  // --- 新增：點選後的按鈕樣式 ---
  btnActive: {
    backgroundColor: '#DEDFE3',
    borderWidth: 0, 
  },
  btnTextBlack: { 
    textAlign: 'center', 
    fontSize: 24, 
    fontWeight: '500',
    color: '#000',
  },
  // --- 新增：點選後的文字樣式 ---
  btnTextActive: {
    color: '#000',
  },
});