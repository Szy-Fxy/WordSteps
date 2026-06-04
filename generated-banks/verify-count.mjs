// 验证 scanUserBanks 修复后的计数逻辑
// 正确逻辑：跳过"孙级"key（即以其他 child key 为前缀的 key）

function simulateMerge(children) {
  const childKeys = Object.keys(children);
  let total = 0;
  for (const ck of childKeys) {
    // 跳过孙级
    const isGrandchild = childKeys.some(other => other !== ck && ck.startsWith(other + '-'));
    if (!isGrandchild) {
      total += children[ck].words.length;
    }
  }
  return total;
}

// 模拟 Szy 层级
const szyChildren = {
  'Szy-E001-W1-核心词汇': { words: new Array(50) },
  'Szy-E001-W1-核心词汇-Day1-基础名词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day2-基础动词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day3-基础形容词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day4-常用副词介词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day5-编程逻辑词': { words: new Array(10) },
  'Szy-E001-W2-核心词汇': { words: new Array(50) },
  'Szy-E001-W2-核心词汇-Day6-基础名词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day7-基础动词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day8-基础形容词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day9-副词介词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day10-编程逻辑词二': { words: new Array(10) },
};

const szy = simulateMerge(szyChildren);
console.log(`Szy = ${szy} ${szy === 100 ? '✅' : '❌ 应为 100'}`);

// 模拟 E001-W1 层级
const w1Children = {
  'Szy-E001-W1-核心词汇-Day1-基础名词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day2-基础动词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day3-基础形容词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day4-常用副词介词': { words: new Array(10) },
  'Szy-E001-W1-核心词汇-Day5-编程逻辑词': { words: new Array(10) },
};
const w1 = simulateMerge(w1Children);
console.log(`E001-W1 = ${w1} ${w1 === 50 ? '✅' : '❌ 应为 50'}`);

// 模拟 E001-W2 层级
const w2Children = {
  'Szy-E001-W2-核心词汇-Day6-基础名词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day7-基础动词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day8-基础形容词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day9-副词介词二': { words: new Array(10) },
  'Szy-E001-W2-核心词汇-Day10-编程逻辑词二': { words: new Array(10) },
};
const w2 = simulateMerge(w2Children);
console.log(`E001-W2 = ${w2} ${w2 === 50 ? '✅' : '❌ 应为 50'}`);

// 验证 Day1 层级（无子节点）
const day1Children = {};
const day1 = simulateMerge(day1Children);
console.log(`Day1 = ${day1} ${day1 === 0 ? '✅' : '❌ 应为 0（无子节点）'}`);
