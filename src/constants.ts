// 常量 - 集中管理所有魔法字符串

// localStorage key（迁移后废弃，保留用于兼容读取）
export const LS_KEYS = {
  mastered: 'wordsteps_mastered',
  favorites: 'wordsteps_favorites',
  settings: 'wordsteps_settings',
  libState: 'wordsteps_libstate',
  dailylog: 'wordsteps_dailylog',
  winsize: 'wordsteps_winsize',
  theme: 'wordsteps_theme',
} as const;

// 复习队列窗口大小 - 超过此值的复习词视为过期
export const REVIEW_WINDOW = 10;

// 拼写模式跳过停留时间（ms）
export const SPELL_SKIP_DELAY = 2000;

// 动画时间（ms）
export const ANIM_OUT_DURATION = 250;
export const ANIM_IN_DURATION = 350;

// 等级词库 keys
export const LEVEL_LIBS = ['junior', 'senior', 'cet4', 'cet6', 'postgraduate', 'toefl'] as const;

// 词库编号显示前缀
export const BANK_PREFIX_ENABLED_DEFAULT = true;
