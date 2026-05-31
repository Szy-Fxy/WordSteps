// 词库加载服务 - 内置词库 + 用户词库扫描
import type { WordBanks, WordBank, WordEntry } from '../types';

export async function loadAllWordbanks(): Promise<WordBanks> {
  // 1. 内置词库（打包在 public/ 中）
  const builtin = await fetch('./wordbanks-enriched.json').then(r => r.json());

  // 2. 用户词库（Electron 主进程扫描文件系统）
  let userBanks: WordBanks = {};
  try {
    userBanks = await window.electronAPI?.invoke('bank:list-user', undefined) ?? {};
  } catch {
    // 非 Electron 环境或无用户词库，静默跳过
  }

  return { ...builtin, ...userBanks };
}

/** 递归扫描文件夹，构建词库 */
export function scanDirectoryTree(
  dirPath: string,
  parentKey: string,
): WordBank | null {
  // 由 Electron 主进程实现，渲染进程仅通过 IPC 调用
  throw new Error('scanDirectoryTree should be called from main process only');
}

/** Fisher-Yates 洗牌 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
