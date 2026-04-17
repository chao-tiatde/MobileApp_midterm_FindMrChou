import { create } from 'zustand';

export const useDreamStore = create((set) => ({
  // 1. 夢境資料庫 (維持原結構)
  dreams: {}, // 結構範例: { '2026-04-11': { mood: '好', summary: '...', tags: [] } }

  // 2. 全局選中的日期，預設為今天 (格式: YYYY-MM-DD)
  selectedDate: new Date().toLocaleDateString('sv-SE'),

  // 3. 動作：更新選中的日期
  setSelectedDate: (date) => set({ selectedDate: date }),

  // 4. 動作：新增或更新夢境
  addDream: (data) => set((state) => ({
    dreams: {
      ...state.dreams,
      [data.date]: data // 使用日期作為 Key
    }
  })),

  // 5. 動作：刪除夢境
  deleteDream: (date) => set((state) => {
    const newDreams = { ...state.dreams };
    delete newDreams[date]; // 從物件中移除該日期的資料
    return { dreams: newDreams };
  }),
}));