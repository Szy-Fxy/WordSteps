import { app, BrowserWindow, ipcMain, globalShortcut, dialog, shell } from 'electron';
import { join } from 'path';
import { readdirSync, readFileSync, existsSync, mkdirSync } from 'fs';

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('use-gl', 'swiftshader');
app.commandLine.appendSwitch('use-angle', 'swiftshader');

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// 预设比例表：[宽, 高, 标签]
const RATIOS: [number, number, string][] = [
  [9, 16, '9:16'],
  [3, 2, '3:2'],
  [1, 1, '1:1'],
  [3, 4, '3:4'],
  [2, 3, '2:3'],
  [16, 9, '16:9'],
];
let currentRatioIdx = 4; // 默认 2:3
let freeRatio = false;   // 自由缩放模式

function clampSize(w: number, h: number): [number, number] {
  if (freeRatio) return [w, h];
  const [rw, rh] = RATIOS[currentRatioIdx]!;
  const scale = Math.min(w / rw, h / rh);
  return [Math.round(rw * scale), Math.round(rh * scale)];
}

function createWindow() {
  const [rw, rh] = RATIOS[currentRatioIdx]!;
  const baseScale = 240;

  mainWindow = new BrowserWindow({
    width: rw * baseScale,
    height: rh * baseScale,
    minWidth: Math.min(rw, rh) * 120,
    minHeight: Math.min(rw, rh) * 120,
    title: 'WordSteps 步步记词',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    show: false,
    resizable: true,
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // 等比缩放：用 setAspectRatio 替代手动计算
  mainWindow.on('will-resize', (_event, newBounds) => {
    if (freeRatio) return;
    const [rw, rh] = RATIOS[currentRatioIdx]!;
    mainWindow?.setAspectRatio(rw / rh);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
}

// ── 用户词库目录 ──
function getUserBanksDir(): string {
  const userData = app.getPath('userData');
  const dir = join(userData, 'user-banks');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    // 首次创建时生成示例词库
    createSampleBank(dir);
  }
  return dir;
}

function createSampleBank(dir: string) {
  const sampleDir = join(dir, '示例词库');
  if (!existsSync(sampleDir)) {
    mkdirSync(sampleDir, { recursive: true });
    const template = {
      label: '示例词库',
      words: [
        { s: 'example', uk: "/ɪg'zɑːmpl/", us: "/ɪg'zæmpəl/", p: 'n. 例子；榜样', ex: { en: 'This is an <b>example</b>.', cn: '这是一个例子。' } },
      ],
    };
    writeFileSync(join(sampleDir, 'words.json'), JSON.stringify(template, null, 2), 'utf-8');
  }
}

// ── 递归扫描用户词库目录 ──
import { writeFileSync, statSync, readdirSync as rdSync } from 'fs';
import type { WordBank } from '../src/types';

function scanUserBanks(dir: string, prefix = '', maxDepth = 3): Record<string, WordBank> {
  const banks: Record<string, WordBank> = {};
  if (maxDepth <= 0) return banks;

  try {
    const entries = rdSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (!stat.isDirectory()) continue;

      // 解析命名约定：{编号}-{显示名}
      const parts = entry.split('-');
      const key = prefix ? `${prefix}-${entry}` : entry;
      const label = parts.length >= 2 ? parts.slice(1).join('-') : entry;
      const wordsFile = join(full, 'words.json');

      // 检查 words.json
      let words: any[] = [];
      if (existsSync(wordsFile)) {
        try {
          const parsed = JSON.parse(readFileSync(wordsFile, 'utf-8'));
          words = Array.isArray(parsed.words) ? parsed.words : (Array.isArray(parsed) ? parsed : []);
        } catch { /* 跳过损坏文件 */ }
      }

      // 递归扫描子文件夹
      const children = scanUserBanks(full, key, maxDepth - 1);
      if (Object.keys(children).length > 0) {
        // 父级：合并所有子级单词 + 自身单词
        const allWords = words;
        for (const ck of Object.keys(children)) {
          allWords.push(...(children[ck]?.words ?? []));
        }
        banks[key] = { label, key, words: allWords };
        Object.assign(banks, children);
      } else if (words.length > 0) {
        // 叶子节点
        banks[key] = { label, key, words };
      }
    }
  } catch { /* 目录不存在或权限不足 */ }

  return banks;
}

app.whenReady().then(() => {
  createWindow();

  // 全局快捷键 Ctrl+Alt+W 恢复窗口
  globalShortcut.register('Ctrl+Alt+W', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

// ── IPC handlers ──
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:hide', () => mainWindow?.hide());
ipcMain.handle('window:show', () => {
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
});
ipcMain.handle('window:close', () => {
  isQuitting = true;
  if (mainWindow) mainWindow.close();
  setImmediate(() => {
    if (BrowserWindow.getAllWindows().length === 0) app.quit();
  });
});

ipcMain.handle('window:set-ratio', (_e, { idx }: { idx: number }) => {
  if (idx < 0) {
    // 负数表示自由模式
    freeRatio = true;
    if (mainWindow) mainWindow.setAspectRatio(0);
    return;
  }
  freeRatio = false;
  currentRatioIdx = idx % RATIOS.length;
  const [rw, rh] = RATIOS[currentRatioIdx]!;
  if (mainWindow) {
    mainWindow.setAspectRatio(rw / rh);
    const [, h] = mainWindow.getSize();
    mainWindow.setSize(Math.round(h * rw / rh), h);
    mainWindow.center();
  }
});

ipcMain.handle('window:get-ratio', () => freeRatio ? -1 : currentRatioIdx);

ipcMain.handle('bank:list-user', () => {
  const dir = getUserBanksDir();
  return scanUserBanks(dir);
});

ipcMain.handle('bank:open-folder', () => {
  const dir = getUserBanksDir();
  shell.openPath(dir);
});

ipcMain.handle('storage:save', (_e, data: Record<string, unknown>) => {
  const userData = app.getPath('userData');
  const configPath = join(userData, 'wordsteps-state.json');
  try {
    writeFileSync(configPath, JSON.stringify(data), 'utf-8');
  } catch { /* 权限不足时静默失败 */ }
});

// 暴露初始存储状态给渲染进程
ipcMain.handle('storage:load', () => {
  const userData = app.getPath('userData');
  const configPath = join(userData, 'wordsteps-state.json');
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {}
  return null;
});
