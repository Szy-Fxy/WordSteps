import type { IpcChannel, IpcReq, IpcRes } from './ipc-channels';

declare global {
  interface Window {
    electronAPI?: {
      invoke: <K extends IpcChannel>(channel: K, req: IpcReq<K>) => Promise<IpcRes<K>>;
      createUserBank: (name: string) => Promise<{ success: boolean; key?: string; error?: string }>;
    };
  }
}

export {};
