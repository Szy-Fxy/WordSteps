// IPC channel 映射表 - 类型安全的通信协议
export const IPC_CHANNELS = {
  'window:minimize':  {} as { req: void;                res: void },
  'window:close':     {} as { req: void;                res: void },
  'window:hide':      {} as { req: void;                res: void },
  'window:show':      {} as { req: void;                res: void },
  'window:set-ratio': {} as { req: { idx: number };     res: void },
  'window:get-ratio': {} as { req: void;                res: number },
  'bank:list-user':   {} as { req: void;                res: Record<string, import('../types').WordBank> },
  'bank:open-folder': {} as { req: void;                res: void },
  'storage:save':     {} as { req: Record<string, unknown>; res: void },
} as const;

export type IpcChannel = keyof typeof IPC_CHANNELS;
export type IpcReq<K extends IpcChannel> = (typeof IPC_CHANNELS)[K]['req'];
export type IpcRes<K extends IpcChannel> = (typeof IPC_CHANNELS)[K]['res'];
