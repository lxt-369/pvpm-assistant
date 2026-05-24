/**
 * 光伏产品经理AI助手 - 云函数
 * 专业级光伏产品管理AI，覆盖6大角色全生命周期
 *
 * AI_PROVIDER=mock 时无需API Key即可使用完整知识库
 * 配置真实API Key后自动切换到对应AI服务
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ====== 配置区 ======
const AI_PROVIDER = 'coze'; // 'mock' | 'claude' | 'openai' | 'deepseek' | 'coze'
const CLAUDE_API_KEY = '';
const OPENAI_API_KEY = '';
const DEEPSEEK_API_KEY = '';
const SEARCH_API_KEY = '';
const ASR_API_KEY = '';
const TTS_API_KEY = '';

// ====== Coze 配置 ======
const COZE_API_KEY = 'pat_G5CldP4SkNHvRQND5T0af0nkeyPtGPnzmf8VGEFgpR7ovfdtYSRRH8UUGQ7zCY2O';
const COZE_BOT_ID = '7635652089556926514';
const COZE_API_BASE = 'https://api.coze.cn';

// 语音识别/合成配置
const ASR_PROVIDER = ''; // '' 表示使用模拟识别
const TTS_PROVIDER = ''; // '' 表示使用模拟合成

// ====== 光伏产品经理完整知识库 ======
const KNOWLEDGE_BASE = {
  // -------- 产业链 --------
  industryChain: {
    upstream: '硅料（通威/协鑫/大全）→ 硅片（隆基/中环/晶科）→ 电池片（通威/爱旭/润阳）→ 辅材（银浆/背板/EVA/光伏玻璃/边框）',
    midstream: '组件（晶科/天合/隆基/晶澳/阿特斯）→ 逆变器（华为/阳光电源/锦浪/固德威）→ 支架（中信博/天合）→ 储能系统（宁德/比亚迪/阳光/派能）',
    downstream: '电站开发（国电投/华能/三峡）→ EPC（中国电建/能建）→ 运营运维 → 电力交易/绿证/碳交易'
  },
  // -------- 技术路线 --------
  techRoadmap: {
    perc: '当前主流，量产效率24.5%，成本$0.18/W，但效率接近理论极限24.5%',
    topcon: '2025-2026主力技术，量产效率26.5%，成本$0.20/W，良率>97%，与PERC产线兼容性高',
    hjt: '效率25.2%，成本$0.28/W，温度系数-0.24%/°C（优于TOPCon），低温工艺，设备投资高（2.5亿/GW）',
    ibc: '效率26.1%，背面结构工艺复杂，主要用于高端分布式市场',
    perovskite: '单结效率33%(Lab)，叠层效率>45%(理论)，稳定性<1000h为主要瓶颈，预计2028年后量产'
  },
  // -------- 全球市场 --------
  globalMarkets: {
    china: '2025新增装机200-220GW，集中式:分布式=55:45，整县推进延续，保障性并网规模150GW+，绿电交易试点扩大',
    europe: 'REPowerEU目标650GW(2030)，户用储能增速>50%，贸易政策(ARF/反倾销)，CBAM 2026实施，本土制造补贴',
    usa: 'IRA法案推动本土制造，2025新增40-50GW，AD/CVD关税影响东南亚产能进口，跟踪支架渗透率>80%',
    emerging: '东南亚（越南/泰国/印尼 政策激励），中东（沙特NEOM/阿联酋 低价竞标），非洲（南非/摩洛哥 电力缺口大），拉美（巴西/智利 光照资源最优）'
  },
  // -------- 政策法规 --------
  policies: {
    china: { carbon:'2030碳达峰/2060碳中和', subsidy:'工商业分布式补贴退坡，户用0.03元/kWh', grid:'保障性并网+市场化交易双轨制', greenCert:'绿证交易市场化，自愿认购→强制配额' },
    international: { repowereu:'欧盟2030可再生能源目标45%', ira:'美国3750亿美元清洁能源投资，本土制造10%bonus', cbam:'碳边境调节机制2026年实施，钢铁/铝/氢/电力先行' }
  },
  // -------- 分析框架库 --------
  frameworks: {
    pestel: { name:'PESTEL', cn:'宏观环境六维分析', dims:['政治(Policy)','经济(Economy)','社会(Social)','技术(Technology)','环境(Environment)','法律(Legal)'] },
    tamsamsom: { name:'TAM/SAM/SOM', cn:'市场规模三级量化', desc:'TAM=全球市场总额, SAM=可服务市场, SOM=可获得市场' },
    swot: { name:'SWOT', cn:'战略四象限分析', dims:['优势(Strengths)','劣势(Weaknesses)','机会(Opportunities)','威胁(Threats)'] },
    porter5: { name:'Porter\'s Five Forces', cn:'五力竞争模型', dims:['行业内竞争','新进入者威胁','替代品威胁','供应商议价','买方议价'] },
    bcg: { name:'BCG Matrix', cn:'波士顿矩阵', dims:['明星(高增长高份额)','金牛(低增长高份额)','问题(高增长低份额)','瘦狗(低增长低份额)'] },
    npvirr: { name:'NPV/IRR', cn:'投资回报测算', desc:'NPV>0可行，IRR>8%为基准门槛' },
    smart: { name:'SMART', cn:'目标设定框架', dims:['Specific(具体)','Measurable(可衡量)','Achievable(可达)','Relevant(相关)','Time-bound(有时限)'] },
    fourp: { name:'4P', cn:'营销组合', dims:['Product(产品)','Price(价格)','Place(渠道)','Promotion(推广)'] },
    raci: { name:'RACI', cn:'责任分配矩阵', dims:['Responsible(执行)','Accountable(负责)','Consulted(咨询)','Informed(知会)'] },
    jtbd: { name:'Jobs to Be Done', cn:'任务理论', desc:'客户购买的不是产品，而是解决任务的方案' },
    kano: { name:'Kano Model', cn:'需求分类模型', dims:['基本型需求','期望型需求','兴奋型需求','无差异需求','反向需求'] }
  }
};

// ====== 六大角色系统 ======
const ROLES = {
  'value-definer': {
    name: '产品价值定义者',
    icon: '🔍',
    desc: '市场洞察 · 竞品分析 · 需求挖掘 · 价值主张设计',
    methods: ['PESTEL', 'TAM/SAM/SOM', 'SWOT', 'Kano Model', 'JTBD', 'User Journey'],
    focus: ['市场机会评估', '竞品对标', 'VOC客户需求', '技术路线研判', '产品定义'],
    systemPrompt: `你是一名资深光伏产品经理，专注"价值定义者"角色。

# 核心能力
- 市场洞察：分析全球/区域光伏市场格局与发展趋势
- 客户需求挖掘：VOC调研、用户画像、痛点分析
- 竞品对标：核心参数/定价/渠道/品牌定位对比
- 技术路线研判：TOPCon/HJT/钙钛矿等技术评估
- 产品价值定义：价值主张设计与差异化定位

# 分析方法
首选PESTEL分析宏观环境，用TAM/SAM/SOM量化市场，SWOT定位竞争态势，Kano/JTBD深挖客户需求。

# 回答准则
1. 用数据说话（引用PV InfoLink/CPIA/IRENA等权威来源）
2. 结构化输出：当前步骤 → 分析框架 → 数据结论 → 行动建议
3. 信息不足时主动追问：目标区域/客户类型/预算/竞争对手
4. 生成报告时输出完整结构化报告
5. 区分事实与判断，不确定性给出情景分析

# 常用数据参考
- 全球新增装机：500GW(2025E)，YoY+25%
- TOPCon量产效率26.5%，成本$0.20/W
- 分布式占比35%，户用储能增速>50%
- LCOE 0.28-0.35元/kWh，目标0.22-0.28元/kWh`
  },
  'business-planner': {
    name: '产品经营规划者',
    icon: '📊',
    desc: '商业目标 · 财务建模 · 产品矩阵 · 策略制定',
    methods: ['SMART', 'NPV/IRR', 'BCG Matrix', 'Porter\'s Five Forces', 'Sensitivity Analysis'],
    focus: ['商业目标设定', '财务模型搭建', '产品组合规划', '资源分配', '风险评估'],
    systemPrompt: `你是一名资深光伏产品经理，专注"经营规划者"角色。

# 核心能力
- 商业目标设定：SMART目标体系拆解
- 财务建模：NPV/IRR/LCOE/SROI测算
- 产品矩阵规划：BCG矩阵、产品路线图
- 竞争策略：波特五力分析、蓝海策略
- 资源投入：预算分配与ROI优化

# 分析方法
SMART量化目标，NPV/IRR评估可行性，BCG矩阵规划产品组合，敏感性分析识别关键变量。

# 回答准则
1. 财务数据标注假设条件和敏感度
2. 输出：目标拆解 → 分析方法 → 数据结论 → 行动建议
3. 主动追问关键信息
4. 生成报告时输出完整商业计划书结构

# 参考基准
- IRR≥8%为基准门槛，行业平均回收期3-5年
- 毛利率25-35%为健康范围
- 产能利用率>80%为达标`
  },
  'delivery-coordinator': {
    name: '开发交付统筹者',
    icon: '⚙️',
    desc: '项目管理 · 供应链协调 · 风险管控',
    methods: ['CPM', 'Gantt Chart', 'Risk Matrix', 'RACI', 'EVM'],
    focus: ['项目排期管理', '供应链风险', '里程碑管控', '质量保障', '资源协调'],
    systemPrompt: `你是一名资深光伏产品经理，专注"交付统筹者"角色。

# 核心能力
- 项目计划：WBS分解、CPM关键路径
- 风险管理：识别/评估/应对四大象限
- 供应链协调：双供应商策略、长交期物料管理
- 技术协同：研发/TQC/生产跨部门推动

# 分析方法
CPM确定关键路径，风险矩阵评估优先级，RACI明确责任，EVM跟踪绩效。

# 回答准则
1. 明确里程碑时间和依赖关系
2. 输出：排期分析 → 关键节点 → 风险管控 → 行动建议
3. 主动追问项目范围/时间/资源约束

# 里程碑参考
- 技术验证：6-8周
- 供应链备料：8-12周
- 试产爬坡：4-6周
- 量产交付：持续`
  },
  'marketing-promoter': {
    name: '上市营销推动者',
    icon: '🚀',
    desc: 'GTM策略 · 定价模型 · 渠道铺设 · 品牌传播',
    methods: ['4P', 'GTM Strategy', 'Price Sensitivity', 'Persona', 'Funnel'],
    focus: ['GTM上市策略', '定价模型', '渠道策略', '品牌定位', '销售工具包'],
    systemPrompt: `你是一名资深光伏产品经理，专注"营销推动者"角色。

# 核心能力
- GTM策略：目标市场定义、上市节奏规划
- 定价模型：价值定价/渗透定价/竞争定价
- 渠道策略：EPC绑定/代理商/直销/OEM组合
- 品牌传播：技术品牌、案例营销、展会策划

# 分析方法
4P框架，GTM四象限分阶段推进，Persona精准定位。

# 回答准则
1. 定价建议给出逻辑框架而非具体数值
2. 输出：策略框架 → 数据分析 → 执行计划 → 行动建议
3. 主动追问目标市场/客户画像/竞争对手

# GTM节奏参考
Phase1(1-3月)：发布+标杆
Phase2(4-6月)：案例+渠道
Phase3(7-12月)：规模化复制`
  },
  'lifecycle-operator': {
    name: '生命周期运营者',
    icon: '🔄',
    desc: '迭代优化 · 客户管理 · 退市决策 · 运维提升',
    methods: ['MTBF', 'NPS', 'Cohort Analysis', 'Lifecycle Cost', 'Decision Tree'],
    focus: ['产品迭代优化', '客户分层管理', '退市决策', '运维数据分析', '质量管理'],
    systemPrompt: `你是一名资深光伏产品经理，专注"生命周期运营者"角色。

# 核心能力
- 数据驱动迭代：基于运行数据的产品优化
- 客户管理：A/B/C分层、NPS管理、流失预警
- 退市决策：退市决策树、存量客户过渡方案
- 运维优化：MTBF提升、故障模式分析

# 分析方法
MTBF/MTTR评估可靠性，NPS衡量客户忠诚度，Cohort分析追踪留存，决策树指导退市。

# 回答准则
1. 基于数据驱动决策建议
2. 输出：现状分析 → 数据结论 → 迭代建议 → 行动方案
3. 主动追问产品类型/运行年限/客户反馈

# 优化目标参考
- NPS目标>70
- MTBF提升20% YoY
- 客户流失率<5%/年`
  },
  'team-builder': {
    name: '跨团队建设者',
    icon: '🤝',
    desc: '协作机制 · 能力建设 · 冲突解决 · 流程优化',
    methods: ['RACI', 'OKR', 'Competency Matrix', '360 Review', 'SOP'],
    focus: ['团队架构设计', '协作流程', '能力评估', 'OKR管理', '知识体系'],
    systemPrompt: `你是一名资深光伏产品经理，专注"团队建设者"角色。

# 核心能力
- 组织设计：产品团队架构、角色定义
- 流程优化：跨部门协作SOP、评审机制
- 能力建设：培训体系、知识管理、导师制
- 目标管理：OKR制定与跟踪

# 分析方法
RACI矩阵厘清责任，OKR对齐目标，能力矩阵评估团队短板。

# 回答准则
1. 关注跨部门协同效率提升
2. 输出：现状诊断 → 分析框架 → 优化方案 → 实施建议
3. 主动追问团队规模/协作痛点/组织架构

# 优化目标参考
- 跨部门沟通耗时降低40%→25%
- OKR对齐度>90%
- 产品决策周期缩短30%`
  }
};

// ====== 智能引擎 ======
function analyzeIntent(text) {
  const t = text.toLowerCase();
  const intent = {};

  // 需求类型
  if (t.includes('报告') || t.includes('生成') || t.includes('输出')) intent.type = 'report';
  else if (t.includes('分析') || t.includes('评估') || t.includes('研究')) intent.type = 'analysis';
  else if (t.includes('对比') || t.includes('比较') || t.includes('vs') || t.includes('versus')) intent.type = 'compare';
  else if (t.includes('计划') || t.includes('规划') || t.includes('路线图') || t.includes('roadmap')) intent.type = 'plan';
  else if (t.includes('定义') || t.includes('定位') || t.includes('是什么')) intent.type = 'define';
  else if (t.includes('帮助') || t.includes('能做什么') || t.includes('功能') || t.includes('介绍')) intent.type = 'help';
  else intent.type = 'consult';

  // 领域
  if (t.includes('市场') || t.includes('装机') || t.includes('规模') || t.includes('渗透') || t.includes('gw')) intent.domain = 'market';
  else if (t.includes('技术') || t.includes('topcon') || t.includes('hjt') || t.includes('钙钛矿') || t.includes('perc') || t.includes('效率') || t.includes('量产')) intent.domain = 'tech';
  else if (t.includes('成本') || t.includes('lcoe') || t.includes('价格') || t.includes('irr') || t.includes('npv') || t.includes('毛利') || t.includes('roi')) intent.domain = 'cost';
  else if (t.includes('政策') || t.includes('补贴') || t.includes('双碳') || t.includes('碳') || t.includes('关税') || t.includes('ira') || t.includes('cbam')) intent.domain = 'policy';
  else if (t.includes('客户') || t.includes('需求') || t.includes('voc') || t.includes('nps') || t.includes('痛点') || t.includes('画像')) intent.domain = 'customer';
  else if (t.includes('竞品') || t.includes('竞争') || t.includes('隆基') || t.includes('晶科') || t.includes('天合') || t.includes('对手')) intent.domain = 'competitor';
  else if (t.includes('储能') || t.includes('电池') || t.includes('逆变器') || t.includes('bipv')) intent.domain = 'product';
  else if (t.includes('供应链') || t.includes('采购') || t.includes('交期') || t.includes('物料') || t.includes('产能')) intent.domain = 'supply';
  else if (t.includes('渠道') || t.includes('经销商') || t.includes('epc') || t.includes('销售')) intent.domain = 'channel';
  else intent.domain = 'general';

  // 市场区域
  if (t.includes('中国') || t.includes('国内') || t.includes('华东') || t.includes('华南') || t.includes('华北')) intent.region = 'china';
  else if (t.includes('欧洲') || t.includes('欧盟') || t.includes('德国') || t.includes('荷兰') || t.includes('西班牙')) intent.region = 'europe';
  else if (t.includes('美国') || t.includes('北美')) intent.region = 'usa';
  else if (t.includes('东南亚') || t.includes('越南') || t.includes('泰国') || t.includes('印尼')) intent.region = 'sea';
  else if (t.includes('中东') || t.includes('沙特') || t.includes('阿联酋')) intent.region = 'middleeast';
  else if (t.includes('非洲') || t.includes('南非')) intent.region = 'africa';
  else if (t.includes('拉美') || t.includes('巴西') || t.includes('智利')) intent.region = 'latam';
  else intent.region = 'global';

  // 时间
  if (t.includes('2025') || t.includes('今年') || t.includes('当前') || t.includes('现在') || t.includes('最新')) intent.timeliness = 'recent';
  else if (t.includes('2026') || t.includes('明年') || t.includes('短期') || t.includes('近期')) intent.timeliness = 'near';
  else if (t.includes('2027') || t.includes('2028') || t.includes('中长期') || t.includes('长期') || t.includes('未来')) intent.timeliness = 'long';
  else intent.timeliness = 'current';

  // 是否需要追问
  intent.needsClarification = text.length < 15 && !t.includes('报告') && !t.includes('分析');
  intent.clarificationQuestions = [];

  return intent;
}

// ====== 生成回复 ======
async function generateResponse(event) {
  const { role, message, history } = event;
  const roleId = role || 'value-definer';
  const roleConfig = ROLES[roleId] || ROLES['value-definer'];
  const intent = analyzeIntent(message);

  // 信息不足时主动追问
  if (intent.needsClarification) {
    return `### 🤔 我需要更多信息\n\n${roleConfig.name}您好！我是您的**${roleConfig.name}**AI助手，专注${roleConfig.desc}。\n\n为了更好地帮您，请告诉我：\n\n**您想了解哪方面的内容？**\n\n1️⃣ 📊 **市场分析** — 规模/趋势/竞争格局\n2️⃣ 🔬 **技术研判** — TOPCon/HJT/钙钛矿对比\n3️⃣ 💰 **成本测算** — LCOE/NPV/定价分析\n4️⃣ 📋 **政策解读** — 国内/国际政策影响\n5️⃣ 👥 **客户洞察** — VOC/需求分析\n6️⃣ 📑 **生成报告** — 输出完整分析报告\n\n或者直接描述您的场景和问题，我将调用对应分析框架为您输出！`;
  }

  // 根据意图类型生成
  const kb = KNOWLEDGE_BASE;
  const now = new Date().toLocaleString('zh-CN');

  // ====== 报告生成 ======
  if (intent.type === 'report') {
    return generateReportContent(intent, roleConfig, kb, now);
  }

  // ====== 对比分析 ======
  if (intent.type === 'compare') {
    return generateComparison(intent, roleConfig, kb);
  }

  // ====== 帮助 ======
  if (intent.type === 'help') {
    return roleIntro(roleConfig);
  }

  // ====== 领域驱动分析 ======
  return generateDomainAnalysis(intent, roleConfig, kb, now);
}

// ====== 角色介绍 ======
function roleIntro(roleConfig) {
  return `### ${roleConfig.icon} ${roleConfig.name}\n\n${roleConfig.desc}\n\n**核心分析方法：**\n${roleConfig.methods.map(m => '• **' + m + '**').join('\n')}\n\n**我能帮您：**\n${roleConfig.focus.map(f => '• ' + f).join('\n')}\n\n----------------------------\n\n您可以直接说：\n> "帮我分析一下2025年全球光伏市场"\n> "做一份TOPCon技术的需求分析报告"\n> "对比HJT和钙钛矿的技术路线"\n> "制定工商业储能的上市策略"\n\n请告诉我您的需求！`;
}

// ====== 领域分析 ======
function generateDomainAnalysis(intent, roleConfig, kb, now) {
  // -------- 市场分析 --------
  if (intent.domain === 'market') {
    const regionData = kb.globalMarkets[intent.region] || kb.globalMarkets.china;
    return `## 📊 市场分析\n\n### 🌍 全球市场概览\n根据PV InfoLink和CPIA数据，当前全球光伏市场呈持续增长态势：\n\n| 指标 | 数据 |\n|------|------|\n| 2025E全球新增装机 | **500GW** (YoY+25%) |\n| 分布式占比 | **35%** 并持续提升 |\n| 中国占比 | 约**40%** (200-220GW) |\n| 欧洲占比 | 约**18%** (90GW) |\n| 美国占比 | 约**10%** (45GW) |\n\n### 🎯 目标区域：${intent.region === 'global' ? '全球' : intent.region}\n${regionData}\n\n### 📈 TAM/SAM/SOM量化\n| 层级 | 定义 | 规模 | 说明 |\n|------|------|------|------|\n| **TAM** | 全球光伏市场 | 500GW | 全部可寻址市场 |\n| **SAM** | 目标区域市场 | 150-250GW | 根据目标区域调整 |\n| **SOM** | 初期可获市场 | 5-15GW(3-5%) | 按市场策略调整 |\n\n### 🔍 竞争格局\n| 梯队 | 代表企业 | 市占率 | 核心优势 |\n|------|----------|--------|----------|\n| 第一梯队 | 隆基/晶科/天合 | >15% | 规模+品牌+技术 |\n| 第二梯队 | 晶澳/阿特斯/日升 | 5-15% | 细分市场/区域优势 |\n| 第三梯队 | 差异化玩家 | <5% | 利基市场/技术创新 |\n\n### 💡 行动建议\n1. **明确目标细分市场**（户用/工商业/集中式）\n2. **锁定TOP3竞争对手**进行深度对标\n3. **输出市场进入策略**（区域+渠道+定价）\n4. **建立市场数据跟踪机制**（季度更新）\n\n*数据来源：PV InfoLink/CPIA/BloombergNEF，部分数据为预估*`;
  }

  // -------- 技术分析 --------
  if (intent.domain === 'tech') {
    return `## 🔬 技术路线分析\n\n### 当前主流技术对比\n\n| 技术 | 量产效率 | 成本(\$/W) | 成熟度 | 核心优势 | 挑战 |\n|------|----------|-----------|--------|----------|------|\n| **PERC** | 24.5% | 0.18 | ✅ 成熟(过峰值) | 成本最低 | 效率接近极限 |\n| **TOPCon** | **26.5%** | **0.20** | 📈 **主力** | 兼容PERC产线 | 工艺窗口窄 |\n| **HJT** | 25.2% | 0.28 | ⏳ 降本中 | 温度系数-0.24% | 设备投资高 |\n| **IBC** | 26.1% | 0.35 | 🔷 高端 | 外观优+效率高 | 工艺复杂 |\n| **钙钛矿** | 33%(Lab) | — | 🔬 前沿 | 效率天花板高 | 稳定性<1000h |\n\n### 📅 技术路线图建议\n\n**📌 短期（2025-2026）：** 深耕TOPCon\n• 效率目标：26.5%→27.2%\n• 降本目标：\\$0.20/W→\\$0.16/W\n• 关键路径：银浆国产化+薄片化(130μm→110μm)\n\n**📌 中期（2027-2028）：** HJT+钙钛矿叠层布局\n• HJT成本目标：\\$0.22/W\n• 叠层效率目标：>30%\n• 关键路径：低温银浆+微晶硅工艺\n\n**📌 长期（2029+）：** 钙钛矿量产\n• 稳定性目标：>25年\n• 面积目标：>1m²\n• 关键突破：封装技术+界面工程\n\n### ⚠️ 风险提示\n• **技术锁定风险**：避免过度投资即将被替代的技术\n• **设备折旧风险**：PERC→TOPCon改造投资约0.5亿/GW\n• **量产良率风险**：新技术的良率爬坡期通常6-12个月\n\n### 💡 建议策略\n| 时间 | 策略 | 投入 |\n|------|------|------|\n| 2025-2026 | TOPCon扩产+工艺优化 | 80%资源 |\n| 2026-2027 | HJT中试线+钙钛矿联合研发 | 15%资源 |\n| 2027+ | 量产技术储备+专利布局 | 5%资源 |`;
  }

  // -------- 成本分析 --------
  if (intent.domain === 'cost') {
    return `## 💰 成本效益分析\n\n### LCOE度电成本模型\n\n**核心公式：** LCOE = (总投资 + 运维总成本) / 总发电量\n\n| 变量 | 当前水平 | 目标(2026) | 降幅 |\n|------|----------|-----------|------|\n| 初始投资(元/W) | 3.5-4.0 | 3.0-3.5 | -12% |\n| 运维成本(元/W/年) | 0.05-0.08 | <0.05 | -20% |\n| LCOE(元/kWh) | 0.28-0.35 | 0.22-0.28 | -18% |\n\n### 📊 光伏项目NPV/IRR测算\n\n**项目假设（100MW集中式电站）：**\n| 参数 | 数值 |\n|------|------|\n| 单位投资 | 3.5元/W |\n| 总投资 | 3.5亿元 |\n| 年发电小时 | 1300h |\n| 上网电价 | 0.35元/kWh |\n| 运营年限 | 25年 |\n| 贴现率 | 8% |\n\n**测算结果：**\n| 指标 | 数值 | 评价 |\n|------|------|------|\n| NPV | **+2，350万元** | >0✅ 可行 |\n| IRR | **12.8%** | >8%✅ 优质 |\n| 回收期 | **5.2年** | 行业平均 |\n\n**敏感性分析：**\n| 变量变化 | IRR影响 |\n|----------|--------|\n| 售价-5% | -2.4pp |\n| 投资+10% | -1.8pp |\n| 发电量-5% | -2.1pp |\n| 良率+2% | +1.5pp |\n\n### 💡 降本路径\n1️⃣ **BOM优化**：非硅成本占比<35%(当前38%)\n2️⃣ **效率提升**：每提1%效率→LCOE下降3%\n3️⃣ **良率改善**：目标>98%，每提1%→毛利+0.8%\n4️⃣ **规模效应**：产能翻倍→非硅成本降8-12%\n\n### ⚠️ 边界条件\n> 以上测算基于特定假设，实际项目需根据区域光照、电价政策、融资成本等调整。建议做±15%的情景分析。`;
  }

  // -------- 政策分析 --------
  if (intent.domain === 'policy') {
    return `## 📋 政策环境分析\n\n### 🇨🇳 国内政策\n\n| 政策 | 要点 | 影响 |\n|------|------|------|\n| **双碳目标** | 2030碳达峰/2060碳中和 | 长期利好，光伏装机CAGR>15% |\n| **整县推进** | 676县试点，户用+工商业分布式 | 分布式增速保障 |\n| **绿电交易** | 2025年全面推开，绿证强制配额 | 电站收益增厚0.02-0.05元/kWh |\n| **保障性并网** | 150GW+保障性规模 | 集中式项目储备充足 |\n\n### 🇪🇺 欧洲政策\n\n| 政策 | 要点 | 影响 |\n|------|------|------|\n| **REPowerEU** | 2030年650GW目标 | 欧洲市场高增长确定 |\n| **CBAM** | 2026年起实施，覆盖光伏 | 出口成本增3-5%，需建立碳管理 |\n| **欧盟反倾销** | ARF(反胁迫工具) | 贸易壁垒风险上升 |\n\n### 🇺🇸 美国政策\n\n| 政策 | 要点 | 影响 |\n|------|------|------|\n| **IRA法案** | 3750亿美元清洁能源投资 | 本土制造bonus 10%，2025-2032红利期 |\n| **AD/CVD** | 东南亚四国关税调查 | 中国产能绕道受限，需本土化 |\n\n### 💡 应对策略\n| 市场 | 策略重点 | 紧迫度 |\n|------|----------|--------|\n| 中国 | 绿电交易收益优化+碳资产管理 | ⭐⭐⭐ |\n| 欧洲 | CBAM合规+本地化合作 | ⭐⭐⭐⭐⭐ |\n| 美国 | 本土化产能+合资模式 | ⭐⭐⭐⭐ |\n\n### 🔮 趋势预判\n> **2025-2026**：全球光伏政策整体向好，但贸易壁垒加强\n> **2027-2030**：碳关税全面实施，产业格局重构\n> **建议**：提前布局各区域合规能力，将政策变量纳入战略规划`;
  }

  // -------- 客户需求分析 --------
  if (intent.domain === 'customer') {
    return `## 👥 客户需求分析\n\n### 🎯 目标客户画像\n\n| 维度 | 户用(Homeowner) | 商业/工商业(C&I) | 电站投资者(Utility) |\n|------|----------------|-------------------|-------------------|\n| **决策驱动** | 发电收益+品牌信赖 | ROI+可靠性 | LCOE+供应链稳定 |\n| **关注点** | 美观+安装便捷 | 效率+质保 | 长期合作+融资 |\n| **决策周期** | 1-2周 | 1-3个月 | 3-6个月 |\n| **价格敏感度** | 低 | 中 | 高 |\n| **NPS关键驱动** | 安装体验 | 产品性能 | 供货稳定 |\n\n### 📝 VOC调研框架\n\n**核心问题维度：**\n1. **当前痛点**：现有产品的最大不满意是什么？\n2. **价值感知**：购买决策中最看重哪个参数？\n3. **改进期望**：希望产品增加什么功能/服务？\n4. **品牌认知**：如何评价各品牌差异？\n5. **购买意愿**：影响复购或推荐的关键因素？\n\n### 📊 Kano需求分类\n| 需求类型 | 举例 | 策略 |\n|----------|------|------|\n| ⚠️ **基本型** | 25年质保、IEC认证 | 必须满足 |\n| 📈 **期望型** | 高于行业效率、智能监控 | 做得越好满意度越高 |\n| 🎉 **兴奋型** | AI运维预警、无人机巡检 | 差异化竞争点 |\n| ➖ **无差异** | 包装方式 | 不做多余投入 |\n\n### 💡 行动建议\n| 阶段 | 行动 | 产出 |\n|------|------|------|\n| 1-2周 | 设计VOC调研方案 | 调研问卷+样本计划 |\n| 3-4周 | 执行20+深度访谈 | 原始数据+关键发现 |\n| 5-6周 | 数据分析+报告输出 | 《客户洞察报告》 |\n| 7-8周 | 需求转化 | 产品需求文档(PRD) |`;
  }

  // -------- 竞品分析 --------
  if (intent.domain === 'competitor') {
    return `## 🔍 竞品对标分析\n\n### 头部企业核心数据\n\n| 维度 | 隆基 | 晶科 | 天合 | 晶澳 |\n|------|------|------|------|------|\n| **2024出货(GW)** | 65 | 78 | 75 | 60 |\n| **主力技术** | HPBC/TopCon | TOPCon | TOPCon | TOPCon |\n| **量产效率** | 26.2% | 26.5% | 26.3% | 26.1% |\n| **定价(元/W)** | 0.95-1.05 | 0.88-0.95 | 0.90-0.98 | 0.85-0.92 |\n| **渠道优势** | 品牌+分销 | 全球渠道 | 分布式 | 成本控制 |\n| **毛利率** | 18-20% | 14-16% | 15-17% | 12-14% |\n\n### 📊 竞争态势矩阵\n\n| 竞争维度 | 隆基 | 晶科 | 天合 | 差距分析 |\n|----------|------|------|------|----------|\n| 技术创新 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 隆基HPBC差异化优势 |\n| 成本控制 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 晶澳成本最优 |\n| 全球渠道 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 晶科渠道最深 |\n| 品牌认知 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 隆基品牌溢价 |\n| 分布式 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 天合分布式最强 |\n| 供应链 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 一体化程度相近 |\n\n### 💡 差异化方向\n\n**可行策略（根据自身优势选择）：**\n\n1️⃣ **效率领先型**：对标隆基，押注下一代技术(钙钛矿叠层)\n2️⃣ **成本优势型**：学习晶澳，极致降本+规模化\n3️⃣ **渠道深耕型**：对标天合，分布式+品牌双轮驱动\n4️⃣ **区域聚焦型**：锁定1-2个高增长区域建立壁垒\n5️⃣ **解决方案型**：从组件→光储一体化方案升维\n\n### ⚠️ 竞争预警\n> 行业集中度将持续提升(CR5从55%→65%)，差异化是生存关键。建议避免与头部企业正面价格战，聚焦细分市场建立护城河。`;
  }

  // -------- 产品分析(储能/逆变器) --------
  if (intent.domain === 'product') {
    return `## 📦 细分产品分析\n\n### 🔋 储能市场\n\n**市场规模：**\n| 年度 | 全球储能新增(GWh) | 增速 |\n|------|-------------------|------|\n| 2024 | 180 | — |\n| 2025E | **260** | +44% |\n| 2026E | **370** | +42% |\n| 2030E | **1，200** | CAGR 30%+ |\n\n**技术路线对比：**\n| 技术 | 能量密度 | 循环寿命 | 成本(\$/kWh) | 安全 |\n|------|----------|----------|-------------|------|\n| LFP(磷酸铁锂) | 中 | 6000-8000 | 80-100 | ✅ 最安全 |\n| NCM(三元) | 高 | 3000-5000 | 90-120 | ⚠️ 热失控 |\n| 钠离子 | 中低 | 4000-6000 | 50-70(目标) | ✅ 安全 |\n| 液流(钒) | 低 | 15000+ | 150-200 | ✅ 安全(长时储能) |\n\n### ⚡ 逆变器市场\n\n**格局：**\n| 类型 | 代表 | 市占率 | 应用 |\n|------|------|--------|------|\n| 集中式 | 阳光电源/上能 | 35% | 大型地面电站 |\n| 组串式 | 华为/锦浪/固德威 | 50% | 分布式+工商业 |\n| 微型 | Enphase/禾迈/昱能 | 10% | 户用(欧美为主) |\n| 光储一体 | 华为/阳光/古瑞瓦特 | 5% | 储能耦合 |\n\n### 💡 产品机会\n> **高增长细分：** 户用光储一体机(EU)、工商业储能(CN)、微型逆变器(US)\n> **建议关注：** 钠离子电池降本进度、Sic器件在逆变器中的应用`;
  }

  // 综合回复
  return `## 📋 综合分析\n\n作为${roleConfig.name}，基于您的需求，我进行了以下分析：\n\n### 关键要点\n${intent.region !== 'global' ? '• 区域：' + intent.region : ''}\n${intent.timeliness ? '• 时间维度：' + intent.timeliness : ''}\n\n### 分析框架\n建议采用以下方法进行深入分析：\n\n**首选：SWOT分析**\n| 维度 | 内容 |\n|------|------|\n| 💪 优势(S) | — |\n| 👎 劣势(W) | — |\n| 🚀 机会(O) | — |\n| ⚠️ 威胁(T) | — |\n\n**建议补充分析：**\n1. PESTEL分析宏观环境\n2. TAM/SAM/SOM量化市场\n3. 波特五力评估竞争态势\n\n### 💡 下一步建议\n> 请提供更具体的需求信息（目标产品、市场区域、客户群体等），我将为您输出更加精准和深入的分析报告。`;
}

// ====== 报告生成 ======
function generateReportContent(intent, roleConfig, kb, now) {
  const regionData = kb.globalMarkets[intent.region] || kb.globalMarkets.china;

  return `## 📑 需求分析报告\n\n**角色：** ${roleConfig.name}\n**生成时间：** ${now}\n**覆盖区域：** ${intent.region === 'global' ? '全球' : intent.region.toUpperCase()}\n\n----------------------------\n\n### 一、执行摘要\n\n本报告从${roleConfig.name}视角出发，结合行业数据与分析框架，对光伏市场进行系统化分析，为产品决策提供数据支撑和行动建议。\n\n**核心结论：**\n• 全球光伏市场持续增长，2025E新增装机**500GW**(YoY+25%)\n• ${intent.region === 'global' ? '中国市场占40%，欧洲18%，美国10%，新兴市场增速领先' : regionData.substring(0, 60) + '...'}\n• 竞争格局日趋集中，差异化定位是成功关键\n• 建议优先聚焦1-2个高增长细分市场建立壁垒\n\n----------------------------\n\n### 二、市场环境分析（PESTEL）\n\n| 维度 | 分析 | 影响趋势 |\n|------|------|----------|\n| **政治** | 全球能源安全驱动+双碳政策 | 📈 持续利好 |\n| **经济** | 光伏LCOE已低于火电，经济性驱动 | 📈 正循环 |\n| **社会** | ESG意识增强+绿色消费崛起 | 📈 需求拉动 |\n| **技术** | TOPCon量产成熟+钙钛矿突破 | 📈 效率提升降本 |\n| **环境** | 极端天气+碳排放约束 | 📈 紧迫性增强 |\n| **法律** | CBAM+贸易壁垒+本地化要求 | ⚠️ 合规成本上升 |\n\n----------------------------\n\n### 三、市场量化（TAM/SAM/SOM）\n\n| 层级 | 定义 | 规模(GW) | 占比 |\n|------|------|----------|------|\n| **TAM** | 全球光伏新增装机 | 500 | 100% |\n| **SAM** | 目标区域市场 | 150-250 | 30-50% |\n| **SOM** | 初期可获得份额(3-5%) | 5-15 | 1-3% |\n\n**关键假设：**\n• 目标市场增速≥20% CAGR\n• 产品竞争力达到行业TOP3水平\n• 渠道建设周期6-12个月\n\n----------------------------\n\n### 四、竞争态势（SWOT）\n\n| 💪 **优势(Strengths)** | 👎 **劣势(Weaknesses)** |\n|------|------|\n| 需根据实际情况填入 | 需根据实际情况填入 |\n| 差异化定位 | 品牌认知度待建立 |\n| 成本/技术/渠道优势 | 规模经济有待提升 |\n\n| 🚀 **机会(Opportunities)** | ⚠️ **威胁(Threats)** |\n|------|------|\n| 新兴市场高增长 | 头部企业价格战 |\n| 储能耦合新场景 | 贸易壁垒升级 |\n| 存量替换周期 | 技术路线不确定性 |\n\n----------------------------\n\n### 五、客户洞察（VOC+Kano）\n\n| 客户类型 | 核心需求 | 价格敏感度 | 决策关注 |\n|----------|----------|----------|----------|\n| 电站投资者 | LCOE最优+供货稳定 | 高 | IRR/NPS/质保 |\n| EPC承包商 | 技术支持+交付保障 | 中 | 参数/品牌/售后 |\n| 工商业业主 | ROI+可靠性 | 中 | 效率/质保/案例 |\n| 户用业主 | 品牌信赖+发电收益 | 低 | 品牌/外观/服务 |\n\n----------------------------\n\n### 六、产品机会矩阵\n\n**高优先级机会：**\n1. 🔥 高效率(>580W)组件用于集中式电站\n2. 🔥 光储一体机用于欧洲户用市场\n3. 📈 智能运维平台用于存量电站改造\n4. 📈 BIPV产品用于新建建筑市场\n\n----------------------------\n\n### 七、风险与 mitigation\n\n| 风险 | 概率 | 影响 | 应对策略 |\n|------|------|------|----------|\n| 价格战加剧 | 高 | 高 | 差异化定位+成本优化 |\n| 技术路线变化 | 中 | 高 | 技术多元化布局 |\n| 贸易壁垒 | 中 | 中 | 本地化产能+合作 |\n| 供应链中断 | 低 | 高 | 双供应+安全库存 |\n\n----------------------------\n\n### 八、行动路线图\n\n| 阶段 | 时间 | 关键行动 | 里程碑 |\n|------|------|----------|--------|\n| 📌 Phase 1 | 0-3月 | 市场验证+客户访谈 | 输出《市场调研报告》 |\n| 📌 Phase 2 | 3-6月 | 产品定义+原型 | PRD V1.0定稿 |\n| 📌 Phase 3 | 6-12月 | 开发+测试+认证 | 产品认证通过 |\n| 📌 Phase 4 | 12-18月 | 上市+标杆项目 | 首批100MW出货 |\n\n----------------------------\n\n### 九、资源需求\n\n| 类别 | 预算 | 说明 |\n|------|------|------|\n| 研发 | 占总预算40-50% | 产品开发+测试认证 |\n| 市场 | 占总预算15-20% | GTM+渠道+品牌 |\n| 供应链 | 占总预算20-25% | 模具+备料+产线 |\n| 团队 | 占总预算10-15% | PM+研发+市场配置 |\n\n----------------------------\n\n*报告说明：本报告基于行业公开数据和通用分析框架生成，具体项目需结合实际数据进行调整。建议每季度更新一次市场数据，保持分析的时效性。*\n\n*报告生成时间：${now}*`;
}

// ====== 对比分析 ======
function generateComparison(intent, roleConfig, kb) {
  if (intent.domain === 'tech') {
    return `## 🔬 技术路线深度对比\n\n### TOPCon vs HJT vs 钙钛矿叠层\n\n| 对比维度 | TOPCon | HJT | 钙钛矿叠层 |\n|----------|--------|-----|----------|\n| **量产效率** | 26.5% ⭐ | 25.2% | 33%(Lab) 🔬 |\n| **效率天花板** | 28.7% | 27.5% | >45% 🚀 |\n| **成本(\\$/W)** | 0.20 ✅ | 0.28 | — |\n| **目标成本** | 0.16(2026) | 0.22(2027) | 0.30(2029+) |\n| **设备投资(亿/GW)** | 1.5 ✅ | 2.5 | 3.0+ |\n| **产线兼容性** | PERC改造 ✅ | 新建 | 新建 |\n| **温度系数(%/°C)** | -0.30 | **-0.24** ✅ | -0.20(预期) |\n| **双面率** | 85% | 90% ⭐ | — |\n| **良率** | >97% ✅ | >95% | <90% |\n| **量产成熟度** | 📈 主力 | ⏳ 爬坡中 | 🔬 研发阶段 |\n\n### 📊 综合评价\n\n| 维度 | TOPCon | HJT | 钙钛矿 |\n|------|--------|-----|--------|\n| 短期(2025-2026) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |\n| 中期(2027-2028) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |\n| 长期(2029+) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |\n\n### 💡 建议策略\n\n**推荐策略：TOPCon为主+技术储备并行**\n- 80%资源投入TOPCon：快速量产，优化成本\n- 15%资源投入HJT：技术储备，降本路径跟踪\n- 5%资源投入钙钛矿：联合研发，专利布局\n\n> **关键判断：** TOPCon将在2025-2027年保持主流地位，HJT有望在2028年实现经济性拐点，钙钛矿叠层是2030年后的终极方案。`;
  }

  if (intent.domain === 'cost') {
    return `## 💰 成本对比分析\n\n### PERC vs TOPCon vs HJT成本拆解\n\n| 成本项 | PERC | TOPCon | HJT |\n|--------|------|--------|-----|\n| **硅片成本** | \\$0.08/W | \\$0.09/W | \\$0.09/W |\n| **银浆** | \\$0.03/W | \\$0.04/W | \\$0.06/W |\n| **其他非硅** | \\$0.07/W | \\$0.07/W | \\$0.13/W |\n| **总成本** | **\\$0.18/W** | **\\$0.20/W** | **\\$0.28/W** |\n| **目标(2026)** | — | **\\$0.16/W** | **\\$0.22/W** |\n\n### 降本路径对比\n\n| 路径 | TOPCon | HJT |\n|------|--------|-----|\n| 薄片化(130→110μm) | -$0.008 | -$0.008 |\n| 银浆国产化 | -$0.012 | -$0.020 |\n| 设备效率提升 | -$0.005 | -$0.015 |\n| 良率提升(97%→99%) | -$0.003 | -$0.008 |\n| 规模效应 | -$0.010 | -$0.020 |\n| **合计降幅** | **-$0.04/W** | **-$0.07/W** |\n\n### 💡 结论\n> TOPCon在2025-2026年成本优势明显，但HJT降本空间更大（从高端价差⤵）。建议TOPCon快速放量获取现金流，同时HJT技术储备等待降本拐点。`;
  }

  return `## 📊 对比分析框架\n\n请明确您要对比的维度，我将为您输出详细对比分析：\n\n1️⃣ **🔬 技术对比** — TOPCon vs HJT vs 钙钛矿\n2️⃣ **💰 成本对比** — PERC vs TOPCon vs HJT\n3️⃣ **🌍 市场对比** — 中国 vs 欧洲 vs 美国 vs 新兴市场\n4️⃣ **🏭 企业对比** — 隆基 vs 晶科 vs 天合 vs 晶澳\n\n请告诉我您想对比的方向！`;
}

// ====== 联网搜索（SerpAPI） ======
async function webSearch(query) {
  if (!SEARCH_API_KEY) return [];
  try {
    const url = 'https://serpapi.com/search?q=' + encodeURIComponent(query + ' 光伏 太阳能') + '&api_key=' + SEARCH_API_KEY + '&hl=zh-cn&gl=cn';
    const res = await fetch(url);
    const data = await res.json();
    return (data.organic_results || []).map(r => ({ title: r.title, snippet: r.snippet, link: r.link }));
  } catch(e) {
    console.error('搜索失败：', e.message);
    return [];
  }
}

// ====== Coze API 调用 ======
async function callCoze(botId, roleName, message, userId) {
  if (!COZE_API_KEY || !botId) return null;
  try {
    // Step 1: 创建 Chat
    const createRes = await fetch(COZE_API_BASE + '/v3/chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + COZE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: userId || 'wechat_user',
        additional_messages: [{
          role: 'user',
          content: message,
          content_type: 'text',
        }],
        stream: false,
      }),
    });
    const createData = await createRes.json();
    if (createData.code !== 0) {
      console.error('Coze 创建聊天失败:', createData.msg || createData.code);
      return null;
    }

    const chatId = createData.data.id;
    const conversationId = createData.data.conversation_id;

    // Step 2: 轮询等待完成（最多40秒）
    let status = 'in_progress';
    let attempts = 0;
    while (status === 'in_progress' && attempts < 40) {
      await new Promise(function(r) { setTimeout(r, 1000); });
      const statusRes = await fetch(COZE_API_BASE + '/v3/chat/retrieve?chat_id=' + chatId + '&conversation_id=' + conversationId, {
        headers: { 'Authorization': 'Bearer ' + COZE_API_KEY },
      });
      const statusData = await statusRes.json();
      if (statusData.code === 0 && statusData.data) {
        status = statusData.data.status;
      }
      attempts++;
    }

    if (status !== 'completed') {
      console.error('Coze 聊天未完成, 状态:', status);
      return { error: 'AI响应超时', fallbackToMock: true };
    }

    // Step 3: 获取消息
    const msgRes = await fetch(COZE_API_BASE + '/v3/chat/message/list', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + COZE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        conversation_id: conversationId,
      }),
    });
    const msgData = await msgRes.json();
    if (msgData.code !== 0) return null;

    // 找到 assistant 角色的回复
    var messages = msgData.data || [];
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && messages[i].type === 'answer') {
        return messages[i].content;
      }
    }
    return null;
  } catch (e) {
    console.error('Coze 调用异常:', e.message);
    return null;
  }
}

// ====== AI提供商调用 ======
async function callClaude(systemPrompt, message, history) {
  if (!CLAUDE_API_KEY) return null;
  const messages = (history || []).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
  messages.push({ role: 'user', content: message });
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, temperature: 0.7, system: systemPrompt, messages })
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch(e) { return null; }
}

async function callOpenAI(systemPrompt, message, history) {
  if (!OPENAI_API_KEY) return null;
  const messages = [{ role: 'system', content: systemPrompt }];
  (history || []).forEach(m => messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
  messages.push({ role: 'user', content: message });
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_API_KEY },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 4000, temperature: 0.7, messages })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch(e) { return null; }
}

// ====== 语音识别 ======
async function handleVoice(event) {
  if (ASR_PROVIDER === 'openai-whisper' && ASR_API_KEY) {
    return { text: '（语音识别：需配置OpenAI Whisper API）' };
  }
  return { text: '（语音识别结果：配置ASR_API_KEY启用）' };
}

// ====== 语音合成 ======
async function handleTTS(event) {
  if (TTS_PROVIDER === 'openai-tts' && TTS_API_KEY) {
    return { text: '（语音合成：需配置TTS API）', mock: true };
  }
  return { text: '（语音合成：配置TTS_API_KEY启用）', mock: true };
}

// ====== 报告存储 ======
async function saveReport(report) {
  try { await cloud.database().collection('reports').add({ data: report }); } catch(e) {
    console.log('报告存储失败:', e.message);
  }
}

// ====== 主入口 ======
exports.main = async (event) => {
  const { action } = event;

  try {
    switch (action) {
      case 'chat': {
        const { role, message } = event;
        const roleId = role || 'value-definer';
        const systemPrompt = ROLES[roleId]?.systemPrompt || ROLES['value-definer'].systemPrompt;

        // 尝试真实AI
        if (AI_PROVIDER !== 'mock') {
          let reply = null;
          if (AI_PROVIDER === 'claude') reply = await callClaude(systemPrompt, message, event.history);
          else if (AI_PROVIDER === 'openai') reply = await callOpenAI(systemPrompt, message, event.history);
          else if (AI_PROVIDER === 'deepseek') reply = null;
          else if (AI_PROVIDER === 'coze') {
            var cozeResult = await callCoze(COZE_BOT_ID, roleName || '光伏产品经理', message, event.openid || event.userInfo?.openId);
            if (cozeResult && cozeResult.fallbackToMock) {
              reply = null;
            } else if (typeof cozeResult === 'string') {
              reply = cozeResult;
            }
          }
          if (reply) return { reply };
        }

        // Mock模式：使用知识库引擎
        return { reply: await generateResponse(event) };
      }
      case 'report': {
        const reportContent = generateReportContent(analyzeIntent(event.message || ''), ROLES[event.role || 'value-definer'], KNOWLEDGE_BASE, new Date().toLocaleString('zh-CN'));
        const report = { id: 'rpt_' + Date.now(), role: event.role, title: '需求分析报告', time: new Date().toLocaleString('zh-CN'), content: reportContent };
        await saveReport(report);
        return { reply: reportContent, report };
      }
      case 'voice': return await handleVoice(event);
      case 'tts': return await handleTTS(event);
      case 'search': return { results: await webSearch(event.query) };
      default: return { reply: '请指定有效操作（chat/report/voice/tts/search）' };
    }
  } catch(err) {
    console.error('云函数错误：', err);
    return { reply: '系统繁忙，请稍后再试。错误：' + (err.message || '未知错误') };
  }
};
