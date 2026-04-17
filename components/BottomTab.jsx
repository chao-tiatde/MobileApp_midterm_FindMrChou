import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router'; // 引入 usePathname

const BottomTab = () => {
  const router = useRouter();
  const pathname = usePathname(); // 取得目前的路由路徑

  // 判斷是否為當前頁面的 Helper function
  const isActive = (path) => pathname === path;

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabBar}>
        
        {/* 日曆頁面 (index) */}
        <TouchableOpacity onPress={() => router.push('/')}>
          <Image 
            source={
              isActive('/') 
                ? require('../img/calendar1.png') // 選中狀態
                : require('../img/calendar.png')  // 原本狀態 (請確保有這張圖，或依你需求調整)
            } 
            style={styles.Calendar1Image} 
          />
        </TouchableOpacity>

        {/* 統計頁面 (statistic) */}
        <TouchableOpacity onPress={() => router.push('/statistic')}>
          <Image 
            source={
              isActive('/statistic') 
                ? require('../img/statistics1.png') 
                : require('../img/statistics.png')
            } 
            style={styles.StatisticsImage} 
          />
        </TouchableOpacity>

        {/* 指南頁面 (guide) */}
        <TouchableOpacity onPress={() => router.push('/guide')}>
          <Image 
            source={
              isActive('/guide') 
                ? require('../img/guide1.png') 
                : require('../img/guide.png')
            } 
            style={styles.GuideImage} 
          />
        </TouchableOpacity>

        {/* 個人中心頁面 (persona) */}
        <TouchableOpacity onPress={() => router.push('/personal')}>
          <Image 
            source={
              isActive('/personal') 
                ? require('../img/personal1.png') 
                : require('../img/personal.png')
            } 
            style={styles.PersonalImage} 
          />
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#252736',
    paddingHorizontal: 10,
    width: '90%',
    height: 70,
    borderRadius: 100,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  Calendar1Image: { width: 28, height: 28, resizeMode: 'contain' },
  StatisticsImage: { width: 28, height: 28, resizeMode: 'contain' },
  GuideImage: { width: 28, height: 28, resizeMode: 'contain' },
  PersonalImage: { width: 28, height: 28, resizeMode: 'contain' },
});

export default BottomTab;