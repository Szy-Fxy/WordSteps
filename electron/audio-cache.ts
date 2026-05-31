/**
 * 音频缓存服务 - Electron 主进程
 * 优先使用本地缓存，缺失时回退在线 API
 */

import { app, net, protocol } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const CACHE_DIR = 'audio';

export function getAudioPath(bankKey: string, word: string): string {
  const safeName = word.replace(/[\\/:*?"<>|]/g, '_') + '.mp3';
  const filePath = path.join(app.getPath('userData'), CACHE_DIR, bankKey, safeName);
  return filePath;
}

export function hasLocalAudio(bankKey: string, word: string): boolean {
  return fs.existsSync(getAudioPath(bankKey, word));
}

export function getLocalAudioUrl(bankKey: string, word: string, type: 0 | 1 = 1): string {
  if (hasLocalAudio(bankKey, word)) {
    const p = getAudioPath(bankKey, word);
    return `file://${p}`;
  }
  // fallback to youdao
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
}

/**
 * 注册自定义协议，直接从本地缓存加载音频
 * 路由: wordsteps-audio://<bank>/<word>
 */
export function registerAudioProtocol() {
  protocol.handle('wordsteps-audio', async (request) => {
    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/+/, '').split('/');
    const bankKey = parts[0];
    const word = parts[1];
    if (!bankKey || !word) return new Response('bad request', { status: 400 });

    const filePath = getAudioPath(bankKey, word);
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath);
      return new Response(new Uint8Array(data), {
        status: 200,
        headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000' },
      });
    }
    return new Response('not found', { status: 404 });
  });
}
