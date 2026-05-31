import { useBoundStore } from '../store/boundStore';

export default function SettingsPanel() {
  const showSettings = useBoundStore(s => s.showSettings);
  const settings = useBoundStore(s => s.settings);
  const darkTheme = useBoundStore(s => s.darkTheme);
  const showBankNumber = useBoundStore(s => s.showBankNumber);
  const wordBanks = useBoundStore(s => s.wordBanks);

  const toggleSettings = useBoundStore(s => s.toggleSettings);
  const toggleAutoAudio = useBoundStore(s => s.toggleAutoAudio);
  const setSettings = useBoundStore(s => s.setSettings);
  const toggleTheme = useBoundStore(s => s.toggleTheme);
  const toggleBankNumber = useBoundStore(s => s.toggleBankNumber);
  const showModal = useBoundStore(s => s.showModal);

  if (!showSettings) return null;

  return (
    <div className="settings-overlay show" onClick={() => toggleSettings(false)}>
      <div className="settings-box" onClick={e => e.stopPropagation()}>
        <h3>⚙️ 设置</h3>

        <div className="settings-row">
          <span>自动发音</span>
          <button className={`settings-toggle ${settings.autoAudio ? 'on' : ''}`} onClick={toggleAutoAudio}>
            {settings.autoAudio ? '开' : '关'}
          </button>
        </div>

        <div className="settings-row">
          <span>默认发音</span>
          <select value={settings.defaultAudioType} onChange={e => setSettings({ defaultAudioType: parseInt(e.target.value) })}>
            <option value={1}>英式</option>
            <option value={0}>美式</option>
          </select>
        </div>

        <div className="settings-row">
          <span>主题</span>
          <button onClick={toggleTheme}>{darkTheme ? '☀️ 浅色' : '🌙 深色'}</button>
        </div>

        <div className="settings-row">
          <span>显示词库编号前缀</span>
          <button className={`settings-toggle ${showBankNumber ? 'on' : ''}`} onClick={toggleBankNumber}>
            {showBankNumber ? '开' : '关'}
          </button>
        </div>

        <hr />

        <div className="settings-section-title">📦 离线音频包</div>
        <div className="settings-row settings-hint">
          <span>下载发音到本地，离线可用。每个词库约 150MB。</span>
        </div>
        {wordBanks && Object.keys(wordBanks).map(k => {
          const b = wordBanks[k];
          if (!b) return null;
          return (
            <div key={k} className="settings-row">
              <span>{b.label}</span>
              <button className="settings-download-btn" onClick={() => {
                useBoundStore.getState().showToast(`📥 ${b.label} 音频包下载功能将在后续版本中提供`);
              }}>
                📥 下载
              </button>
            </div>
          );
        })}

        <hr />

        <button className="settings-clear" onClick={() => {
          toggleSettings(false);
          showModal('清除所有数据', '确定要清除所有学习记录吗？包括已掌握单词、收藏、设置。此操作不可撤销。', () => {
            // 清除逻辑
            useBoundStore.setState({
              masteredWords: {},
              favorites: new Set(),
              settings: { autoAudio: false, defaultAudioType: 1 },
              dailyLog: {},
              streakDays: 0,
              currentStreak: 0,
              bestStreak: 0,
              libStates: {},
            });
            useBoundStore.getState().showToast('🗑 所有数据已清除');
          });
        }}>
          🗑 清除所有数据
        </button>

        <button className="settings-close" onClick={() => toggleSettings(false)}>关闭</button>
      </div>
    </div>
  );
}
