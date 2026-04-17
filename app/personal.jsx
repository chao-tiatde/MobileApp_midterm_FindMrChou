import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomTab from '../components/BottomTab';

export default function PersonalScreen() {
  const router = useRouter();

  // 統一的彈窗提示
  const handleTodoAlert = () => {
    Alert.alert('提示', '此功能還在開發中，敬請期待！', [{ text: '好的' }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部標題與返回箭頭 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#252736" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>個人資料</Text>
      </View>

      {/* 頭像區域 (截圖中的交叉圓圈) */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <View style={styles.crossLine1} />
          <View style={styles.crossLine2} />
        </View>
      </View>

      {/* 功能按鈕區 */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.grayButton} onPress={handleTodoAlert}>
          <Text style={styles.grayButtonText}>定義標籤</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.grayButton} onPress={handleTodoAlert}>
          <Text style={styles.grayButtonText}>設置密碼</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton} onPress={handleTodoAlert}>
          <Text style={styles.outlineButtonText}>切換帳號</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton} onPress={handleTodoAlert}>
          <Text style={styles.outlineButtonText}>登出</Text>
        </TouchableOpacity>
        
      </View>
        <BottomTab />
      {/* 底部導覽列 (模擬截圖樣式) */}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    height: 80,
    marginTop:40,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 50, // 抵銷 backButton 的寬度讓標題置中
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 50,
  },
  avatarCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  crossLine1: {
    position: 'absolute',
    width: '140%',
    height: 1,
    backgroundColor: '#333',
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    position: 'absolute',
    width: '140%',
    height: 1,
    backgroundColor: '#333',
    transform: [{ rotate: '-45deg' }],
  },
  buttonGroup: {
    paddingHorizontal: 40,
    gap: 20,
  },
  grayButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
  },
  grayButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  outlineButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  
});