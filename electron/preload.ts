// Preload - 类型安全的 IPC 桥接
import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannel, IpcReq, IpcRes } from '../src/types/ipc-channels';

const IPC_CHANNELS = {
  'window:minimize':  {} as { req: void; res: void },
  'window:close':     {} as { req: void; res: void },
  'window:hide':      {} as { req: void; res: void },
  'window:show':      {} as { req: void; res: void },
  'window:set-ratio': {} as { req: { idx: number }; res: void },
  'window:get-ratio': {} as { req: void; res: number },
  'bank:list-user':   {} as { req: void; res: Record<string, import('../src/types').WordBank> },
  'bank:open-folder': {} as { req: void; res: void },
  'storage:save':      {} as { req: Record<string, unknown>; res: void },
  'bank:create-user':  {} as { req: { name: string }; res: { success: boolean; key?: string; error?: string } },
} as const;

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: <K extends IpcChannel>(channel: K, req: IpcReq<K>): Promise<IpcRes<K>> => {
    return ipcRenderer.invoke(channel, req);
  },
  minimizeWindow: () => ipcRenderer.invoke('window:minimize', undefined),
  closeWindow: () => ipcRenderer.invoke('window:close', undefined),
  hideWindow: () => ipcRenderer.invoke('window:hide', undefined),
  showWindow: () => ipcRenderer.invoke('window:show', undefined),
  setRatio: (idx: number) => ipcRenderer.invoke('window:set-ratio', { idx }),
  getRatio: () => ipcRenderer.invoke('window:get-ratio', undefined),
  listUserBanks: () => ipcRenderer.invoke('bank:list-user', undefined),
  openUserBanksFolder: () => ipcRenderer.invoke('bank:open-folder', undefined),
  saveStorage: (data: Record<string, unknown>) => ipcRenderer.invoke('storage:save', data),
  createUserBank: (name: string) => ipcRenderer.invoke('bank:create-user', { name }),
});
