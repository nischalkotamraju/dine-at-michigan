import { create } from 'zustand';

interface HomeFilterStore {
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
}

export const useHomeFilterStore = create<HomeFilterStore>()((set) => ({
  selectedFilter: 'all',
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
}));
