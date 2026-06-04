import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, 'Szy');

function writeDay(w1OrW2, dayName, label, words) {
  const dir = path.join(base, w1OrW2, dayName);
  fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify({ label, words }, null, 2);
  fs.writeFileSync(path.join(dir, 'words.json'), json, 'utf-8');
  console.log('OK:', path.join(w1OrW2, dayName));
}

// E001-W1: Day1~5
writeDay('E001-W1-核心词汇', 'Day1-基础名词', 'Day1-基础名词', [
  { s:'variable', p:'n. 变量（像游戏里存储玩家血量的容器）', ex:{ en:"The variable stores the player's health.", cn:'变量存储了玩家的血量。'} },
  { s:'function', p:'n. 函数（按一个键就触发一整段跳跃逻辑）', ex:{ en:'This function handles the jump action.', cn:'这个函数处理跳跃动作。'} },
  { s:'value', p:'n. 值（角色当前的攻击力数字）', ex:{ en:'The value of the score increases by 10.', cn:'分数的值增加了10。'} },
  { s:'data', p:'n. 数据（存档文件里记录的所有游戏信息）', ex:{ en:'The system saves the player data.', cn:'系统保存了玩家数据。'} },
  { s:'element', p:'n. 元素（UI界面上一个按钮是一个界面元素）', ex:{ en:'Each UI element has a position.', cn:'每个UI元素都有一个位置。'} },
  { s:'structure', p:'n. 结构（游戏里一棵技能树就是个树形结构）', ex:{ en:'The team designed a new data structure.', cn:'团队设计了一个新的数据结构。'} },
  { s:'resource', p:'n. 资源（角色的体力值是一种有限资源）', ex:{ en:'The game manages memory resources carefully.', cn:'游戏仔细管理内存资源。'} },
  { s:'action', p:'n. 动作（玩家按空格触发跳跃动作）', ex:{ en:'Every action in the game triggers an animation.', cn:'游戏中的每个动作都触发一个动画。'} },
  { s:'event', p:'n. 事件（玩家按下按键这个事件驱动后续逻辑）', ex:{ en:'The event fires when the enemy dies.', cn:'当敌人死亡时触发该事件。'} },
  { s:'process', p:'n. 进程/过程（游戏运行时后台有一个主循环进程）', ex:{ en:'The rendering process runs every frame.', cn:'渲染进程每帧运行。'} },
]);

writeDay('E001-W1-核心词汇', 'Day2-基础动词', 'Day2-基础动词', [
  { s:'define', p:'v. 定义（在代码开头给怪物设定一个类型）', ex:{ en:'We define the enemy class at the top of the file.', cn:'我们在文件顶部定义了敌人类。'} },
  { s:'execute', p:'v. 执行（玩家按攻击键执行一套连招逻辑）', ex:{ en:'The program executes the movement code.', cn:'程序执行移动代码。'} },
  { s:'generate', p:'v. 生成（地图程序自动生成随机地形）', ex:{ en:'The algorithm generates a new dungeon layout.', cn:'算法生成了一个新的地下城布局。'} },
  { s:'transform', p:'v. 变换/转换（把世界坐标转成屏幕坐标）', ex:{ en:'The matrix transforms the 3D model into screen space.', cn:'矩阵将3D模型转换为屏幕空间。'} },
  { s:'implement', p:'v. 实现（把策划文档描述的跳跃功能写出代码）', ex:{ en:'The developer implements the physics system.', cn:'开发者实现了物理系统。'} },
  { s:'trigger', p:'v. 触发（玩家进入某个区域触发机关）', ex:{ en:'Stepping on the platform triggers a trap.', cn:'踩上平台触发陷阱。'} },
  { s:'assign', p:'v. 分配/赋值（给每个敌人分配一个独立编号）', ex:{ en:'The system assigns a unique ID to each object.', cn:'系统为每个对象分配唯一ID。'} },
  { s:'modify', p:'v. 修改（运行时动态调整角色属性）', ex:{ en:"The buff modifies the player's attack power.", cn:'增益效果修改了玩家的攻击力。'} },
  { s:'detect', p:'v. 检测（碰撞系统检测两物体是否接触）', ex:{ en:'The engine detects when two objects collide.', cn:'引擎检测到两个物体何时碰撞。'} },
  { s:'configure', p:'v. 配置（在设置菜单里调整画质选项）', ex:{ en:'The player configures the control settings.', cn:'玩家配置控制设置。'} },
]);

writeDay('E001-W1-核心词汇', 'Day3-基础形容词', 'Day3-基础形容词', [
  { s:'dynamic', p:'adj. 动态的（游戏里血量条会动态变化）', ex:{ en:'The lighting system is fully dynamic.', cn:'光照系统是完全动态的。'} },
  { s:'static', p:'adj. 静态的（场景里不会动的背景建筑）', ex:{ en:'The static objects do not move during gameplay.', cn:'静态物体在游戏过程中不会移动。'} },
  { s:'global', p:'adj. 全局的（整个游戏通用的金币数量）', ex:{ en:'The global score is displayed on every screen.', cn:'全局分数在每个屏幕上都显示。'} },
  { s:'local', p:'adj. 局部的（只在当前关卡生效的临时变量）', ex:{ en:'The local variable only exists inside this function.', cn:'局部变量只存在于这个函数内部。'} },
  { s:'virtual', p:'adj. 虚拟的（游戏世界是一个虚拟空间）', ex:{ en:'The virtual camera follows the player character.', cn:'虚拟相机跟随玩家角色。'} },
  { s:'physical', p:'adj. 物理的（角色跳起后会受重力影响落回地面）', ex:{ en:'The engine simulates physical collisions.', cn:'引擎模拟物理碰撞。'} },
  { s:'primary', p:'adj. 主要的（主武器和副武器的区别）', ex:{ en:'The primary objective is to defeat the boss.', cn:'主要目标是击败Boss。'} },
  { s:'secondary', p:'adj. 次要的/辅助的（副手装备的武器）', ex:{ en:'The secondary effect slows the enemy.', cn:'次要效果减慢敌人的速度。'} },
  { s:'efficient', p:'adj. 高效的（优化后的代码占CPU更少）', ex:{ en:'An efficient algorithm runs faster.', cn:'高效的算法运行更快。'} },
  { s:'complex', p:'adj. 复杂的（大型开放世界的逻辑非常复杂）', ex:{ en:'The boss AI has a complex behavior tree.', cn:'Boss AI有复杂的行为树。'} },
]);

writeDay('E001-W1-核心词汇', 'Day4-常用副词介词', 'Day4-常用副词介词', [
  { s:'automatically', p:'adv. 自动地（游戏启动时自动加载存档）', ex:{ en:'The game saves automatically every five minutes.', cn:'游戏每五分钟自动保存一次。'} },
  { s:'manually', p:'adv. 手动地（玩家自己点按钮保存进度）', ex:{ en:'You can manually adjust the camera angle.', cn:'你可以手动调整相机角度。'} },
  { s:'directly', p:'adv. 直接地（不经过中间类直接修改属性）', ex:{ en:'The input system directly reads the keyboard state.', cn:'输入系统直接读取键盘状态。'} },
  { s:'simultaneously', p:'adv. 同时地（多个敌人同时发起攻击）', ex:{ en:'The sound and animation play simultaneously.', cn:'声音和动画同时播放。'} },
  { s:'frequently', p:'adv. 频繁地（游戏循环里每帧都要检查输入）', ex:{ en:'The collision system is called frequently.', cn:'碰撞系统被频繁调用。'} },
  { s:'gradually', p:'adv. 逐渐地（血量槽缓慢减少而非瞬间清零）', ex:{ en:'The difficulty level increases gradually.', cn:'难度逐渐增加。'} },
  { s:'normally', p:'adv. 正常地（没有异常时游戏正常运行）', ex:{ en:'The game runs normally at 60 frames per second.', cn:'游戏以60帧每秒正常运行。'} },
  { s:'within', p:'prep. 在……之内（检测攻击范围是否在判定区域内）', ex:{ en:'The enemy must be within range to be hit.', cn:'敌人必须在范围内才能被击中。'} },
  { s:'between', p:'prep. 在……之间（角色移动在两点之间插值）', ex:{ en:'The game loads between levels seamlessly.', cn:'游戏在关卡之间无缝加载。'} },
  { s:'beyond', p:'prep. 超出（离开地图边界就无法继续前进）', ex:{ en:'The character cannot move beyond the boundary.', cn:'角色不能移动到边界之外。'} },
]);

writeDay('E001-W1-核心词汇', 'Day5-编程逻辑词', 'Day5-编程逻辑词', [
  { s:'condition', p:'n. 条件（如果血量小于0则触发死亡画面）', ex:{ en:'The condition checks if the player has enough mana.', cn:'条件检查玩家是否有足够的法力值。'} },
  { s:'loop', p:'n. 循环（游戏的主循环每秒执行60次）', ex:{ en:'The game loop updates all objects each frame.', cn:'游戏循环每帧更新所有对象。'} },
  { s:'logic', p:'n. 逻辑（游戏里判定输赢的规则系统）', ex:{ en:'The game logic determines whether the player wins.', cn:'游戏逻辑决定玩家是否获胜。'} },
  { s:'parameter', p:'n. 参数（调用跳跃函数时传递跳跃高度值）', ex:{ en:'This function takes a speed parameter.', cn:'这个函数接收一个速度参数。'} },
  { s:'interface', p:'n. 接口（玩家和游戏交互的UI界面）', ex:{ en:'The user interface shows the health bar.', cn:'用户界面显示血量条。'} },
  { s:'instance', p:'n. 实例（每个敌人对战中都是一个具体实例）', ex:{ en:'Each instance of the enemy has its own health.', cn:'每个敌人实例有自己的血量。'} },
  { s:'attribute', p:'n. 属性（角色的血量、蓝量、攻击力都是属性）', ex:{ en:'The class has an attribute for movement speed.', cn:'该类有一个移动速度属性。'} },
  { s:'method', p:'n. 方法（角色类里的跳跃函数就是一个方法）', ex:{ en:'The player class has a method called Jump.', cn:'玩家类有一个叫Jump的方法。'} },
  { s:'module', p:'n. 模块（把游戏UI做成独立的模块方便复用）', ex:{ en:'Each module in the engine handles a specific task.', cn:'引擎中的每个模块处理一个特定任务。'} },
  { s:'algorithm', p:'n. 算法（找敌人的路径需要寻路算法）', ex:{ en:'The pathfinding algorithm finds the shortest route.', cn:'寻路算法找到最短路径。'} },
]);

// E001-W2: Day6~10
writeDay('E001-W2-核心词汇', 'Day6-基础名词二', 'Day6-基础名词二', [
  { s:'component', p:'n. 组件（游戏的渲染系统是一个独立组件）', ex:{ en:'The physics component handles gravity and collisions.', cn:'物理组件处理重力和碰撞。'} },
  { s:'container', p:'n. 容器（角色的背包是一个物品容器）', ex:{ en:'The inventory container holds up to 20 items.', cn:'物品容器最多容纳20件物品。'} },
  { s:'pattern', p:'n. 模式/模板（Boss的攻击有固定模式）', ex:{ en:'The enemy follows a repeating movement pattern.', cn:'敌人遵循重复的移动模式。'} },
  { s:'sequence', p:'n. 序列（玩家输入的方向键序列触发组合技）', ex:{ en:'The animation sequence plays when the player attacks.', cn:'玩家攻击时播放动画序列。'} },
  { s:'source', p:'n. 源/来源（音频文件是声音的源头）', ex:{ en:'The light source casts shadows in real time.', cn:'光源实时投射阴影。'} },
  { s:'target', p:'n. 目标（按下锁定键选取一个攻击目标）', ex:{ en:'The missile tracks its target automatically.', cn:'导弹自动追踪目标。'} },
  { s:'version', p:'n. 版本（游戏发布时会标注版本号v1.0）', ex:{ en:'The latest version fixes several bugs.', cn:'最新版本修复了几个Bug。'} },
  { s:'status', p:'n. 状态（角色面板显示当前各种状态数值）', ex:{ en:'The status bar shows health and mana.', cn:'状态栏显示血量和法力值。'} },
  { s:'range', p:'n. 范围（弓箭手的攻击范围比战士远）', ex:{ en:'The effect applies to all enemies in range.', cn:'效果作用于范围内的所有敌人。'} },
  { s:'mode', p:'n. 模式（游戏有单人模式和多人模式）', ex:{ en:'Switch to debug mode to see the collision boxes.', cn:'切换到调试模式查看碰撞框。'} },
]);

writeDay('E001-W2-核心词汇', 'Day7-基础动词二', 'Day7-基础动词二', [
  { s:'calculate', p:'v. 计算（根据攻防计算最终伤害）', ex:{ en:'The engine calculates the damage reduction.', cn:'引擎计算伤害减免。'} },
  { s:'evaluate', p:'v. 评估（系统每帧评估角色是否在安全区）', ex:{ en:'The AI evaluates the best position to move.', cn:'AI评估最佳移动位置。'} },
  { s:'indicate', p:'v. 指示（血条颜色变化指示危险程度）', ex:{ en:'The arrow indicates the direction of the objective.', cn:'箭头指示目标的方向。'} },
  { s:'maintain', p:'v. 维护（开发者定期维护服务器保证联机稳定）', ex:{ en:'The engine maintains a steady frame rate.', cn:'引擎保持稳定的帧率。'} },
  { s:'operate', p:'v. 操作/运行（操作系统负责调度游戏进程）', ex:{ en:'The drone operates under player control.', cn:'无人机在玩家控制下运行。'} },
  { s:'perform', p:'v. 执行/表现（性能测试检查游戏帧率表现）', ex:{ en:'The function performs a collision check.', cn:'该函数执行碰撞检查。'} },
  { s:'resolve', p:'v. 解决/解析（引擎解析依赖才能正确加载）', ex:{ en:'The system resolves all references before loading.', cn:'系统在加载前解析所有引用。'} },
  { s:'represent', p:'v. 代表（每个3D模型代表游戏中的一个角色）', ex:{ en:'The icon represents the player on the minimap.', cn:'图标在小地图上代表玩家。'} },
  { s:'require', p:'v. 需要（虚幻引擎5需要高性能显卡）', ex:{ en:'This quest requires the player to find three keys.', cn:'这个任务需要玩家找到三把钥匙。'} },
  { s:'establish', p:'v. 建立（联机游戏首先要建立网络连接）', ex:{ en:'The game establishes a connection to the server.', cn:'游戏建立到服务器的连接。'} },
]);

writeDay('E001-W2-核心词汇', 'Day8-基础形容词二', 'Day8-基础形容词二', [
  { s:'abstract', p:'adj. 抽象的（游戏状态机是一个抽象概念）', ex:{ en:'An abstract class cannot be instantiated directly.', cn:'抽象类不能直接实例化。'} },
  { s:'concrete', p:'adj. 具体的（具体角色模型而不是通用模板）', ex:{ en:'The concrete enemy type has unique behavior.', cn:'具体的敌人类型有独特的行为。'} },
  { s:'fundamental', p:'adj. 基本的（碰撞检测是游戏物理的基础）', ex:{ en:'Understanding vectors is fundamental to 3D graphics.', cn:'理解向量是3D图形的基础。'} },
  { s:'optional', p:'adj. 可选的（支线任务不强制完成）', ex:{ en:'The high-resolution texture pack is optional.', cn:'高分辨率纹理包是可选的。'} },
  { s:'temporary', p:'adj. 临时的（捡到的临时增益过一会消失）', ex:{ en:'The speed boost is temporary and lasts ten seconds.', cn:'速度提升是临时的，持续10秒。'} },
  { s:'permanent', p:'adj. 永久的（解锁成就带来的称号是永久的）', ex:{ en:'The upgrade gives a permanent health increase.', cn:'升级提供了永久的血量提升。'} },
  { s:'original', p:'adj. 原始的/最初的（原始设计文档定义了机制）', ex:{ en:'The original game had only four levels.', cn:'最初的游戏只有四个关卡。'} },
  { s:'specific', p:'adj. 具体的/特定的（特定按键触发特定技能）', ex:{ en:'This potion restores a specific type of resource.', cn:'这瓶药水恢复特定类型的资源。'} },
  { s:'general', p:'adj. 一般的/通用的（通用算法适用于多种场景）', ex:{ en:'The general rule applies to all game objects.', cn:'通用规则适用于所有游戏对象。'} },
  { s:'positive', p:'adj. 积极的/正的（增益效果给玩家正面影响）', ex:{ en:'The positive feedback loop makes the game more fun.', cn:'正反馈循环让游戏更有趣。'} },
]);

writeDay('E001-W2-核心词汇', 'Day9-副词介词二', 'Day9-副词介词二', [
  { s:'accordingly', p:'adv. 相应地（伤害变化后血量条相应更新）', ex:{ en:'The AI adjusts its behavior accordingly.', cn:'AI相应地调整行为。'} },
  { s:'consequently', p:'adv. 因此（网络延迟高因此操作有明显卡顿）', ex:{ en:'The frame rate dropped and consequently the animation stuttered.', cn:'帧率下降，因此动画卡顿。'} },
  { s:'eventually', p:'adv. 最终（经过多次尝试最终击败Boss）', ex:{ en:'The player eventually unlocks all achievements.', cn:'玩家最终解锁所有成就。'} },
  { s:'initially', p:'adv. 最初（游戏最初加载时显示引擎Logo）', ex:{ en:'Initially the character has no special abilities.', cn:'最初角色没有特殊能力。'} },
  { s:'merely', p:'adv. 仅仅（这个错误仅仅是个警告不影响运行）', ex:{ en:'This variable is merely a counter for the loop.', cn:'这个变量仅仅是循环的计数器。'} },
  { s:'precisely', p:'adv. 精确地（物理引擎需要精确计算碰撞时间）', ex:{ en:'The raycast hits the target precisely.', cn:'射线投射精确命中目标。'} },
  { s:'relatively', p:'adv. 相对地（相比上一代引擎新版本相对高效）', ex:{ en:'The setup is relatively simple for an experienced developer.', cn:'对有经验的开发者来说配置相对简单。'} },
  { s:'subsequently', p:'adv. 随后（先加载关卡资源随后启动游戏逻辑）', ex:{ en:'The player defeats the boss and subsequently enters the next area.', cn:'玩家击败Boss后进入下一个区域。'} },
  { s:'approximately', p:'adv. 大约（加载速度大约需要10秒）', ex:{ en:'The download size is approximately 50 gigabytes.', cn:'下载大小大约是50GB。'} },
  { s:'virtually', p:'adv. 几乎/虚拟地（虚拟现实让玩家身临其境）', ex:{ en:'The loading time is virtually zero on modern hardware.', cn:'在现代硬件上加载时间几乎为零。'} },
]);

writeDay('E001-W2-核心词汇', 'Day10-编程逻辑词二', 'Day10-编程逻辑词二', [
  { s:'declaration', p:'n. 声明（在头文件里先声明变量类型再使用）', ex:{ en:'The declaration tells the compiler what type this variable is.', cn:'声明告诉编译器该变量是什么类型。'} },
  { s:'expression', p:'n. 表达式（health - damage就是一个计算表达式）', ex:{ en:'The expression evaluates to true if the player is alive.', cn:'如果玩家存活，表达式求值为true。'} },
  { s:'statement', p:'n. 语句（if(health<=0)是一条条件判断语句）', ex:{ en:'This statement checks whether the key is pressed.', cn:'该语句检查按键是否被按下。'} },
  { s:'identifier', p:'n. 标识符（每个游戏对象有一个唯一标识符）', ex:{ en:'The identifier must be unique across all objects.', cn:'标识符在所有对象中必须唯一。'} },
  { s:'constant', p:'n. 常量（游戏里的重力加速度是一个固定常量）', ex:{ en:'Define the maximum health as a constant at the top.', cn:'将最大血量定义为顶部的常量。'} },
  { s:'operation', p:'n. 操作（加减乘除都是基本的算术操作）', ex:{ en:'The operation adds two vectors together.', cn:'该操作将两个向量相加。'} },
  { s:'callback', p:'n. 回调（按钮被点击时执行一个回调函数）', ex:{ en:'The event system calls the callback when the timer ends.', cn:'事件系统在计时器结束时调用回调。'} },
  { s:'exception', p:'n. 异常（程序运行时出错会抛出异常）', ex:{ en:'The engine throws an exception when the file is missing.', cn:'引擎在文件缺失时抛出异常。'} },
  { s:'dependency', p:'n. 依赖（渲染模块依赖图形API才能工作）', ex:{ en:'The plugin has a dependency on the physics library.', cn:'该插件依赖物理库。'} },
  { s:'prototype', p:'n. 原型（先做一个快速原型来测试核心玩法）', ex:{ en:'The team builds a prototype before full production.', cn:'团队在全面生产前构建原型。'} },
]);

console.log('Done! All 10 Day words.json created.');
