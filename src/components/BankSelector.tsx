import { useBoundStore } from '../store/boundStore';
import { LEVEL_LIBS } from '../constants';
import { useState } from 'react';

export default function BankSelector() {
  const wordBanks = useBoundStore(s => s.wordBanks);
  const lib = useBoundStore(s => s.lib);
  const masteredWords = useBoundStore(s => s.masteredWords);
  const todayCount = useBoundStore(s => s.todayCount);
  const reviewQueue = useBoundStore(s => s.reviewQueue);
  const showBankNumber = useBoundStore(s => s.showBankNumber);
  const favoritesCount = useBoundStore(s => s.favorites.size);

  const [open, setOpen] = useState<'level' | 'my' | null>(null);

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

  // 自定义词库层级渲染（使用 key 前缀匹配判断父子关系）
  const renderCustomBanks = () => {
    const customKeys = Object.keys(wordBanks).filter(k => !LEVEL_LIBS.includes(k as typeof LEVEL_LIBS[number]));
    customKeys.sort();

    // 父节点：有其他 key 以 "parentKey-" 为前缀
    const parents = customKeys.filter(k =>
      customKeys.some(ck => ck !== k && ck.startsWith(k + '-'))
    );
    // 根节点：不是任何其他 key 的子节点
    const roots = customKeys.filter(k =>
      !customKeys.some(pk => pk !== k && k.startsWith(pk + '-'))
    );

    return (
      <>
        {roots.map(key => {
          const b = wordBanks[key]!;
          const label = showBankNumber ? key : (b.label ?? key);
          const m = b.words.filter(w => masteredWords[w.s]).length;
          const childKeys = customKeys.filter(ck => ck !== key && ck.startsWith(key + '-'));
          const hasChildren = childKeys.length > 0;

          return (
            <div key={key}>
              <div
                className={`menu-item ${key === lib ? 'active' : ''}`}
                onClick={() => handleSwitch(key)}
              >
                <span>{hasChildren ? '📁 ' : ''}{label}</span>
                <span className="menu-count">{m}/{b.words.length}</span>
              </div>
              {hasChildren && childKeys.map(ck => {
                const cb = wordBanks[ck];
                if (!cb) return null;
                const childLabel = showBankNumber
                  ? ck.slice(key.length + 1)
                  : (cb.label ?? ck);
                const cm = cb.words.filter(w => masteredWords[w.s]).length;
                return (
                  <div key={ck} className={`menu-item menu-child ${ck === lib ? 'active' : ''}`} onClick={() => handleSwitch(ck)}>
                    <span>&nbsp;&nbsp;├ {childLabel}</span>
                    <span className="menu-count">{cm}/{cb.words.length}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
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
              <span>📅 今日收录</span>
            </div>
            <div className="menu-divider" />
            {renderCustomBanks()}
            <div className="menu-divider" />
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
