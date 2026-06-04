import { useBoundStore } from '../store/boundStore';
import { LEVEL_LIBS } from '../constants';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export default function BankSelector() {
  const wordBanks = useBoundStore(s => s.wordBanks);
  const lib = useBoundStore(s => s.lib);
  const masteredWords = useBoundStore(s => s.masteredWords);
  const todayCount = useBoundStore(s => s.todayCount);
  const reviewQueue = useBoundStore(s => s.reviewQueue);
  const showBankNumber = useBoundStore(s => s.showBankNumber);
  const favoritesCount = useBoundStore(s => s.favorites.size);
  const todayWords = useBoundStore(s => s.todayWords);

  const [open, setOpen] = useState<'level' | 'my' | null>(null);
  const [creating, setCreating] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [expandedRoot, setExpandedRoot] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [subPos, setSubPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  // 关闭下拉时清空悬停
  useEffect(() => {
    if (open !== 'my') {
      setHoverKey(null);
      setSubPos(null);
    }
  }, [open]);

  if (!wordBanks) return null;
  const bank = wordBanks[lib];

  const handleSwitch = (key: string) => {
    setOpen(null);
    if (key === lib) return;
    const store = useBoundStore.getState();

    if (key.startsWith('my-') && (key === 'my-all' || key === 'my-today')) {
      store.switchMyBank(key);
      return;
    }

    if (todayCount > 0 || reviewQueue.length > 0) {
      store.showModal('切换词库', `当前有学习进度（${todayCount}词已学），切换后本轮进度清空，已掌握保留。`, () => store.switchLib(key));
    } else {
      store.switchLib(key);
    }
  };

  // ── 级联菜单 ──

  const getDirectChildren = (parentKey: string, allKeys: string[]): string[] => {
    const prefix = parentKey + '-';
    const candidates = allKeys.filter(k => k.startsWith(prefix));
    return candidates.filter(k =>
      !candidates.some(other => other !== k && k.startsWith(other + '-'))
    );
  };

  const handleSubEnter = (key: string, el: HTMLElement) => {
    if (subTimerRef.current) clearTimeout(subTimerRef.current);
    const rect = el.getBoundingClientRect();
    // fixed 定位，往右弹（left: rect.right），不下遮兄弟项
    setSubPos({ top: rect.top, left: rect.right - 4 });
    setHoverKey(key);
  };

  const handleSubLeave = () => {
    subTimerRef.current = setTimeout(() => {
      setHoverKey(null);
      setSubPos(null);
    }, 250);
  };

  /** 计算简洁标签：去掉父前缀，可选项是否去掉末尾汉字说明 */
  /** 计算简洁标签：去掉父前缀，可选项是否去掉末尾汉字说明 */
  const shortLabel = (key: string, parentKey: string | undefined, stripChinese = true): string => {
    const b = wordBanks[key];
    if (!b) return key;
    if (parentKey) {
      const relPath = key.startsWith(parentKey + '-') ? key.slice(parentKey.length + 1) : key;
      let label = stripChinese ? relPath.replace(/-[\u4e00-\u9fff].*$/, '') : relPath;
      // 去掉末尾的序号字（基础名词二 → 基础名词）
      label = label.replace(/[一二三四五六七八九十]$/, '');
      return label;
    }
    return showBankNumber ? key : (b.label ?? key);
  };

  const renderCustomBanks = () => {
    const customKeys = Object.keys(wordBanks).filter(k =>
      !LEVEL_LIBS.includes(k as typeof LEVEL_LIBS[number])
    );
    customKeys.sort();

    const roots = customKeys.filter(k =>
      !customKeys.some(pk => pk !== k && k.startsWith(pk + '-'))
    );

    // 构建悬停子菜单的列表（在 drop-menu 内 fixed 渲染）
    let hoverSubMenu: ReactNode = null;
    if (hoverKey && subPos) {
      const subKeys = getDirectChildren(hoverKey, customKeys)
        .sort((a, b) => {
          // 按 Day 数字排序，让 Day1 < Day2 < ... < Day10
          const na = parseInt(a.match(/Day(\d+)/)?.[1] ?? '0', 10);
          const nb = parseInt(b.match(/Day(\d+)/)?.[1] ?? '0', 10);
          return na - nb;
        });
      if (subKeys.length > 0) {
        hoverSubMenu = (
          <div
            className="drop-menu-fixed"
            style={{ top: subPos.top, left: subPos.left }}
            onMouseEnter={() => { if (subTimerRef.current) clearTimeout(subTimerRef.current); }}
            onMouseLeave={handleSubLeave}
          >
            {subKeys.map(sk => {
              const sb = wordBanks[sk];
              if (!sb) return null;
              const label = shortLabel(sk, hoverKey, false); // Day 保留完整标签
              const mastered = sb.words.filter(w => masteredWords[w.s]).length;
              const isActive = sk === lib;
              return (
                <div
                  key={sk}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => { setHoverKey(null); setSubPos(null); handleSwitch(sk); }}
                >
                  <span>{label}</span>
                  <span className="menu-count">{mastered}/{sb.words.length}</span>
                </div>
              );
            })}
          </div>
        );
      }
    }

    return (
      <>
        {roots.map(key => {
          const b = wordBanks[key];
          if (!b) return null;
          const label = showBankNumber ? key : (b.label ?? key);
          const mastered = b.words.filter(w => masteredWords[w.s]).length;
          const childKeys = getDirectChildren(key, customKeys);
          const hasChildren = childKeys.length > 0;
          const isActive = key === lib;
          const isExpanded = expandedRoot === key;

          return (
            <div key={key}>
              <div
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (hasChildren) {
                    setExpandedRoot(isExpanded ? null : key);
                  } else {
                    handleSwitch(key);
                  }
                }}
              >
                <span>{hasChildren ? (isExpanded ? '📂 ' : '📁 ') : ''}{label}</span>
                <span className="menu-count">{mastered}/{b.words.length}</span>
              </div>
              {isExpanded && childKeys.map(ck => {
                // W1/W2 层：精简，不要汉字说明
                const cl = shortLabel(ck, key, true);
                const cb = wordBanks[ck];
                if (!cb) return null;
                const cm = cb.words.filter(w => masteredWords[w.s]).length;
                const isChildActive = ck === lib;
                const grandChildren = getDirectChildren(ck, customKeys);
                return (
                  <div key={ck} style={{ paddingLeft: 16 }}>
                    <div
                      className={`menu-item ${isChildActive ? 'active' : ''}`}
                      onMouseEnter={grandChildren.length > 0 ? (e) => handleSubEnter(ck, e.currentTarget) : undefined}
                      onMouseLeave={grandChildren.length > 0 ? handleSubLeave : undefined}
                      onClick={() => { setHoverKey(null); setSubPos(null); handleSwitch(ck); }}
                    >
                      <span>{cl}</span>
                      <span className="menu-count">{cm}/{cb.words.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {/* 浮动子菜单：fixed 定位在悬停项的右侧，不遮挡下方兄弟 */}
        {hoverSubMenu}
      </>
    );
  };

  const confirmCreateBank = async () => {
    const name = newBankName.trim();
    if (!name) {
      useBoundStore.getState().showToast('词库名不能为空');
      return;
    }
    const illegal = /[<>:"\\\/\|\?\*]/;
    if (illegal.test(name)) {
      useBoundStore.getState().showToast('名称不能包含：\\ / : * ? " < > |');
      return;
    }
    const customKeys = Object.keys(wordBanks).filter(k => !LEVEL_LIBS.includes(k as typeof LEVEL_LIBS[number]));
    if (customKeys.includes(name)) {
      useBoundStore.getState().showToast('这个词库名已存在，请换一个');
      return;
    }
    if (!window.electronAPI) {
      useBoundStore.getState().showToast('该功能需要在桌面客户端中使用');
      setCreating(false);
      setOpen(null);
      return;
    }
    const res = await window.electronAPI.createUserBank(name);
    if (res?.success && res.key) {
      useBoundStore.getState().showToast(`已切换到 ${res.key}`);
      await useBoundStore.getState().loadBanks();
      useBoundStore.getState().switchLib(res.key, true);
    } else {
      useBoundStore.getState().showToast(res?.error || '创建失败');
    }
    setCreating(false);
    setOpen(null);
  };

  const cancelCreate = () => {
    setCreating(false);
    setNewBankName('');
  };

  return (
    <div className="bank-selector">
      <div className="bank-dropdown">
        <button className="drop-btn" onClick={() => setOpen(open === 'level' ? null : 'level')}>
          {bank?.label || '选择词库'} <span className="arrow">▼</span>
        </button>
        {open === 'level' && (
          <div className="drop-menu">
            {LEVEL_LIBS.map(k => {
              const b = wordBanks[k];
              if (!b) return null;
              const m = b.words.filter(w => masteredWords[w.s]).length;
              return (
                <div key={k} className={`menu-item ${k === lib ? 'active' : ''}`} onClick={() => handleSwitch(k)}>
                  <span>{b.label}</span><span className="menu-count">{m}/{b.words.length}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="bank-dropdown">
        <button className="drop-btn my-btn" onClick={() => setOpen(open === 'my' ? null : 'my')}>
          我的词库 <span className="arrow">▼</span>
        </button>
        {open === 'my' && (
          <div className="drop-menu">
            <div className={`menu-item ${lib === 'my-all' ? 'active' : ''}`} onClick={() => handleSwitch('my-all')}>
              <span>⭐ 全部收藏</span><span className="menu-count">{favoritesCount}</span>
            </div>
            <div className={`menu-item ${lib === 'my-today' ? 'active' : ''}`} onClick={() => handleSwitch('my-today')}>
              <span>📅 今日所学</span>
              {todayWords.length > 0 && <span className="menu-count">{todayWords.length}</span>}
            </div>
            <div className="menu-divider" />
            {renderCustomBanks()}
            <div className="menu-divider" />
            {creating ? (
              <div className="bank-create-input-wrap">
                <input
                  ref={inputRef}
                  className="bank-create-input"
                  type="text"
                  placeholder="输入词库名称..."
                  value={newBankName}
                  onChange={e => setNewBankName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmCreateBank(); if (e.key === 'Escape') cancelCreate(); }}
                />
                <div className="bank-create-actions">
                  <button className="bank-create-btn bank-create-confirm" onClick={confirmCreateBank}>确认</button>
                  <button className="bank-create-btn bank-create-cancel" onClick={cancelCreate}>取消</button>
                </div>
              </div>
            ) : (
              <div className="menu-item menu-action" onClick={() => { setCreating(true); setNewBankName(''); }}>
                ＋ 新建词库
              </div>
            )}
            <div className="menu-item menu-action" onClick={() => {
              setOpen(null);
              window.electronAPI?.invoke('bank:open-folder', undefined);
            }}>
              📂 打开词库文件夹
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
