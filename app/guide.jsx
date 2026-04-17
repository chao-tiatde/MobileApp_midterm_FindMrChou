import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../components/BottomTab';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Guide = () => {
  const router = useRouter();

  const categories = [
    {
      title: '類型',
      titleColor: '#252736',
      items: [
        { name: '清醒夢', color: '#9782E3', desc: '你在夢中「意識」到自己在做夢。這時你可以控制夢境走向，例如飛行或改變環境。' },
        { name: '續集夢', color: '#9782E3', desc: '夢境在不同夜晚連續發生，像影集一樣。這通常與長期關注的壓力或未完成的心願有關。' },
        { name: '夢中夢', color: '#9782E3', desc: '你以為自己醒了（例如起床刷牙），結果發現還在夢中。這常伴隨著層層嵌套的結構。' },
        { name: '預知夢', color: '#9782E3', desc: '夢見的場景在未來現實中發生。科學上常解釋為「既視感」(Déjà vu) 或大腦潛意識訊息的強力推演。' },
        { name: '噩夢', color: '#9782E3', desc: '伴隨強烈恐懼、焦慮的夢。通常是壓力過大或創傷後壓力症候群 (PTSD) 的表現。' },
        { name: '超現實', color: '#9782E3', desc: '完全不符合邏輯，例如物體變形、物理規律消失。這反映了大腦在 REM 睡眠期將不相關的記憶碎片強行隨機組合。' },
      ]
    },
    {
      title: '視角',
      titleColor: '#252736',
      items: [
        { name: '第一視角', color: '#252736', desc: '最常見。你即是主角，能看見雙手、感受情緒與觸覺，沈浸感最強，通常與近期壓力或直覺情緒相關。' },
        { name: '第二視角', color: '#252736', desc: '較特殊。你可能附身在他人身上看著原本的自己，或感受到「某個視線」盯著主角。' },
        { name: '第三視角', color: '#252736', desc: '像看電影。你以旁觀者身份觀察「自己」在演戲，大腦與情感保持距離，常見於邏輯分析或重構過去記憶。' },

      ]
    },
    {
      title: '時間',
      titleColor: '#252736',
      items: [
        { name: '跳轉', color: '#D4FF33', textColor: '#252736', desc: '像電影剪輯。前一秒在教室，下一秒突然到了海邊，大腦會自動忽略中間的移動過程。' },
        { name: '連貫', color: '#D4FF33', textColor: '#252736', desc: '夢中的情節按照線性邏輯發展，感受不到明顯的時間斷層，通常這種夢醒後記憶較為完整。' },
        { name: '極短', color: '#D4FF33', textColor: '#252736', desc: '感覺只過了一瞬間，通常發生在快醒來前的淺眠期，或是受到外界聲音干擾產生的反射夢。' },
        { name: '1天', color: '#D4FF33', textColor: '#252736', desc: '在夢中經歷了完整的一整天，包含從早到晚的完整作息，醒來時會有強烈的疲憊感。' },
        { name: '兩天以上', color: '#D4FF33', textColor: '#252736', desc: '夢境跨越數日甚至數年。雖然現實中可能只睡了 8 小時，但大腦透過快速的場景切換與「既定認知」，讓你以為時間過得很長。' },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>標籤種類大全</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: cat.titleColor }]}>{cat.title}</Text>
            {cat.items.map((item, i) => (
              <View key={i} style={[styles.card, { backgroundColor: item.color }]}>
                <Text style={[styles.cardName, { color: item.textColor || '#FFF' }]}>{item.name}</Text>
                <Text style={[styles.cardDesc, { color: item.textColor || '#FFF' }]}>{item.desc}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Nav Mockup */}
      <BottomTab />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    marginTop:60
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#252736',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 180, // 留空間給底部導航
  },
  section: {
    marginTop: 35,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    borderRadius: 30,
    padding: 25,
    marginBottom: 25,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 15,
    letterSpacing:1,
    lineHeight: 22,
  },
});

export default Guide;