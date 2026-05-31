import type { IpcChannel, IpcReq, IpcRes } from './ipc-channels';

declare global {
  interface Window {
    electronAPI?: {
      invoke: <K extends IpcChannel>(channel: K, req: IpcReq<K>) => Promise<IpcRes<K>>;
    };
  }
}

export {};
