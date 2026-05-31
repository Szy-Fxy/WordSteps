// Bound Store - 组合 4 个 slice
import { create } from 'zustand';
import { createWordbankSlice, type WordbankSlice } from './wordbankSlice';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createStatsSlice, type StatsSlice } from './statsSlice';
import { createUiSlice, type UiSlice } from './uiSlice';

export type BoundStore = WordbankSlice & SessionSlice & StatsSlice & UiSlice;

export const useBoundStore = create<BoundStore>()((...a) => ({
  ...createWordbankSlice(...a),
  ...createSessionSlice(...a),
  ...createStatsSlice(...a),
  ...createUiSlice(...a),
}));
