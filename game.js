// ============================================================
// 光伏产品经理助手 - AI驱动光伏产品管理专家
// ============================================================
const cvs = wx.createCanvas();
const ctx = cvs.getContext('2d');
const sys = wx.getSystemInfoSync();
const W = sys.windowWidth, H = sys.windowHeight, SB = sys.statusBarHeight || 20;
const NAV_H = 52, INPUT_H = 56, AVATAR_S = 28;

// ====== 颜色 ======
const C = {
  bg: '#f0f2f5', white: '#fff', text: '#1a1a2e', textSec: '#6b7280',
  green: '#1a6b3c', greenD: '#0d4a2a', greenL: '#e8f5e9',
  greenB: '#1a6b3c', greenM: '#2d8a4e', greenLight: 'rgba(26,107,60,0.08)',
  blue: '#2563eb', orange: '#ea580c', red: '#dc2626', purple: '#7c3aed', teal: '#0d9488',
  gray: '#9ca3af', grayL: '#e5e7eb', border: '#e5e7eb',
  msgUser: '#95ec69', msgAI: '#fff',
  shadow1: 'rgba(0,0,0,0.03)', shadow2: 'rgba(0,0,0,0.06)',
  headerGrad: null
};
C.headerGrad = ctx.createLinearGradient(0, 0, 0, SB + NAV_H + 20);
C.headerGrad.addColorStop(0, '#0d4a2a');
C.headerGrad.addColorStop(0.5, '#1a6b3c');
C.headerGrad.addColorStop(1, '#2d8a4e');

// ====== 工具函数 ======
function rndPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}
function hit(tx, ty, x, y, w, h) { return tx>=x && tx<=x+w && ty>=y && ty<=y+h; }
function truncate(str, maxW) {
  if (ctx.measureText(str).width <= maxW) return str;
  while (str.length > 0 && ctx.measureText(str+'...').width > maxW) str = str.slice(0, -1);
  return str + '...';
}

// ====== 角色 ======
const ROLES = [
  { id:'value-definer', name:'产品价值定义者', icon:'🔍', desc:'市场洞察 · 竞品分析 · 需求挖掘', color:C.green },
  { id:'business-planner', name:'产品经营规划者', icon:'📊', desc:'商业目标 · 财务建模 · 策略制定', color:C.blue },
  { id:'delivery-coordinator', name:'开发交付统筹者', icon:'⚙️', desc:'项目管理 · 供应链 · 风险管控', color:C.orange },
  { id:'marketing-promoter', name:'上市营销推动者', icon:'🚀', desc:'GTM策略 · 定价模型 · 渠道铺设', color:C.red },
  { id:'lifecycle-operator', name:'生命周期运营者', icon:'🔄', desc:'迭代优化 · 客户管理 · 退市决策', color:C.purple },
  { id:'team-builder', name:'跨团队建设者', icon:'🤝', desc:'协作机制 · 能力建设 · 流程优化', color:C.teal }
];

// ====== 状态 ======
const APP = {
  msgs: [], input: '', waiting: false, scY: 0, maxScY: 0,
  role: null, recording: false, showToolbox: false, recordStartTime: 0,
  keyboardOn: false, showScrollBtn: false
};

// ====== 消息队列 ======
function addMsg(text, isSelf, type) {
  const lines = parseContent(text);
  APP.msgs.push({ text, lines, isSelf, type: type || 'text', time: Date.now(), height: calcHeight(lines, isSelf) });
  scrollToBottom();
}
function scrollToBottom() { setTimeout(function(){ scrollTo(99999); }, 50); }
function scrollTo(y) {
  var maxH = calcTotalHeight();
  var viewH = H - (SB + NAV_H + 25) - INPUT_H - 16;
  APP.maxScY = Math.max(0, maxH - viewH);
  APP.scY = Math.max(0, Math.min(y, APP.maxScY));
  APP.showScrollBtn = APP.maxScY > 0 && APP.scY < APP.maxScY - 20;
}

// ====== 文本解析 ======
function parseContent(text) {
  var lines = [];
  var raw = text.split('\n');
  for (var i=0;i<raw.length;i++) {
    var l = raw[i];
    // Horizontal rule
    if (/^-{3,}$/.test(l.trim())) { lines.push({ type:'hr', text:'' }); }
    // Headers
    else if (/^#{1,3}\s/.test(l)) {
      var level = l.match(/^#+/)[0].length;
      lines.push({ type:'h'+level, text:l.replace(/^#+\s*/,'') });
    }
    // Table rows
    else if (l.indexOf('|') >= 0 && l.split('|').length >= 3) {
      var cells = l.split('|').filter(function(c){ return c.trim(); });
      var isSep = /[-]+/.test(cells[0]);
      if (isSep) { lines.push({ type:'tsep' }); }
      else { lines.push({ type:'trow', cells: cells }); }
    }
    // Bullet
    else if (/^[•●\-*]\s/.test(l.trim()) || /^\d+[\.、]/.test(l.trim())) {
      lines.push({ type:'bullet', text:l.replace(/^[\s]*[•●\-*\d+\.、]\s*/,'') });
    }
    // Table-like line (数据行)
    else if (l.indexOf('|') >= 0) {
      var cells = l.split('|').filter(function(c){ return c.trim(); });
      if (cells.length >= 2) lines.push({ type:'trow', cells:cells });
      else lines.push({ type:'p', text:l });
    }
    // Empty
    else if (!l.trim()) { lines.push({ type:'spacer' }); }
    // Regular paragraph
    else { lines.push({ type:'p', text:l }); }
  }
  return lines;
}

function calcHeight(lines, isSelf) {
  var h = 12; // padding top
  // AI消息实际渲染宽度: p用W*0.75-28, bullet用W*0.75-42
  // 用户消息: 统一用W*0.75-16
  var pW = isSelf ? W * 0.75 - 16 : W * 0.75 - 28;
  var bulletW = isSelf ? W * 0.75 - 16 : W * 0.75 - 42;
  for (var i=0;i<lines.length;i++) {
    var l = lines[i];
    if (l.type === 'spacer') h += 6;
    else if (l.type === 'hr') h += 12;
    else if (l.type === 'h1') h += 28;
    else if (l.type === 'h2') h += 24;
    else if (l.type === 'h3') h += 20;
    else if (l.type === 'trow') h += 22;
    else if (l.type === 'tsep') h += 4;
    else if (l.type === 'bullet') h += 18 * estimateWrappedLines(l.text, bulletW, 14);
    else h += 18 * estimateWrappedLines(l.text, pW, 14); // p
  }
  return h + 12; // padding bottom
}

function calcTotalHeight() {
  var h = 0;
  for (var i=0;i<APP.msgs.length;i++) {
    h += APP.msgs[i].height + 10; // gap
  }
  return h;
}

// ====== AI对话 ======
function callAI(userText) {
  APP.waiting = true;
  var roleId = APP.role ? APP.role.id : 'value-definer';
  var roleName = APP.role ? APP.role.name : '综合';

  wx.cloud.callFunction({
    name: 'ai-assistant',
    data: {
      action: 'chat',
      role: roleId,
      roleName: roleName,
      message: userText,
      history: APP.msgs.slice(-8).map(function(m) {
        return { role: m.isSelf ? 'user' : 'assistant', content: m.text.length > 500 ? m.text.substring(0,500) : m.text };
      })
    },
    success: function(res) {
      APP.waiting = false;
      var reply = res.result && res.result.reply ? res.result.reply : fallbackReply(userText, roleId);
      addMsg(reply, false, 'analysis');
    },
    fail: function() {
      APP.waiting = false;
      addMsg('⚠️ 云函数调用失败，已切换到本地知识库回复。\n\n' + fallbackReply(userText, roleId), false, 'analysis');
    }
  });

  setTimeout(function() {
    if (APP.waiting) {
      APP.waiting = false;
      addMsg('⚠️ AI响应超时，已切换到本地知识库回复。\n\n' + fallbackReply(userText, roleId), false, 'analysis');
    }
  }, 25000);
}

// ====== 本地兜底回复（云函数不可用时的备用） ======
function fallbackReply(text, roleId) {
  var t = text.toLowerCase();
  var role = ROLES.find(function(r){ return r.id === roleId; }) || ROLES[0];

  if (t.indexOf('报告')>=0 || t.indexOf('需求分析')>=0) {
    return '## 📑 需求分析报告\n\n----------------------------\n\n### 一、市场概况\n\n根据PV InfoLink数据，2025年全球光伏新增装机预计达**500GW**，同比增长25%。其中：\n\n- 中国市场：约**200GW**（占比40%）\n- 欧洲市场：约**90GW**（占比18%）\n- 美国市场：约**45GW**（占比10%）\n\n### 二、技术趋势\n\n**TOPCon**已成为主流技术路线，量产效率达**26.5%**，成本$0.20/W。HJT和钙钛矿叠层是未来方向。\n\n### 三、客户需求\n\n| 客户类型 | 核心需求 |\n|----------|----------|\n| 电站投资者 | LCOE最优+供货稳定 |\n| EPC承包商 | 技术支持+交付保障 |\n| 户用业主 | 品牌信赖+发电收益 |\n\n### 四、建议\n\n1. **锁定目标细分市场**\n2. **建立竞品数据库**\n3. **启动客户验证访谈**\n\n----------------------------\n*分析报告由光伏产品经理AI生成*';
  }

  if (t.indexOf('市场')>=0 || t.indexOf('装机')>=0) {
    return '## 📊 市场分析\n\n### 全球光伏市场概况\n\n| 区域 | 2025E新增(GW) | 份额 | 增速 |\n|------|--------------|------|------|\n| 中国 | **200** | 40% | 15% |\n| 欧洲 | **90** | 18% | 25% |\n| 美国 | **45** | 10% | 20% |\n| 其他 | **165** | 33% | 35% |\n\n**增长驱动力：**\n1. 🌍 全球碳中和目标（145国家已承诺）\n2. 💰 光伏LCOE已低于煤电（0.03-0.05$/kWh）\n3. 🔋 储能配套解决间歇性问题\n\n**行动建议：**\n> 聚焦**分布式+储能**高增长细分，优先布局华东/华南工商业市场';
  }

  if (t.indexOf('技术')>=0 || t.indexOf('topcon')>=0 || t.indexOf('hjt')>=0 || t.indexOf('钙钛矿')>=0) {
    return '## 🔬 技术路线分析\n\n| 技术 | 量产效率 | 成本($/W) | 成熟度 |\n|------|----------|-----------|--------|\n| PERC | 24.5% | 0.18 | ✅ 成熟期 |\n| **TOPCon** | **26.5%** | **0.20** | **📈 主力** |\n| HJT | 25.2% | 0.28 | ⏳ 降本中 |\n| 钙钛矿叠层 | 33%(Lab) | — | 🔬 前沿 |\n\n### 策略建议\n**短期（2025-2026）：** 80%资源投入TOPCon\n**中期（2027-2028）：** 布局HJT+钙钛矿叠层\n**长期（2029+）：** 钙钛矿量产导入';
  }

  if (t.indexOf('成本')>=0 || t.indexOf('lcoe')>=0 || t.indexOf('irr')>=0) {
    return '## 💰 成本分析\n\n### LCOE基准\n| 指标 | 当前值 | 目标值 |\n|------|--------|--------|\n| 初始投资 | 3.5-4.0元/W | 3.0-3.5元/W |\n| LCOE | 0.28-0.35元/kWh | 0.22-0.28元/kWh |\n\n**降本路径：**\n1. 银浆国产化 → -$0.012/W\n2. 薄片化130→110μm → -$0.008/W\n3. 良率97%→99% → -$0.003/W';
  }

  if (t.indexOf('政策')>=0 || t.indexOf('双碳')>=0 || t.indexOf('补贴')>=0) {
    return '## 📋 政策分析\n\n**国内：** 双碳目标+整县推进+绿电交易\n**欧盟：** REPowerEU 650GW目标 + CBAM 2026实施\n**美国：** IRA法案3750亿$清洁能源投资\n\n> 💡 CBAM将使出口欧洲成本增加3-5%，建议提前建立碳管理能力';
  }

  return '### 👋 您好！我是您的**' + role.name + '**AI助手\n\n' + role.desc + '。\n\n**您可以这样跟我说：**\n\n1️⃣ 📊 "分析2025年全球光伏市场" — 市场分析\n2️⃣ 🔬 "对比TOPCon和HJT技术" — 技术对比\n3️⃣ 📑 "做一份需求分析报告" — 报告生成\n4️⃣ 💰 "测算100MW电站的IRR" — 成本分析\n5️⃣ 🎤 点击麦克风语音输入\n\n请告诉我您的需求！';
}

// ====== 录音 ======
var recorderMgr = null;
try { recorderMgr = wx.getRecorderManager(); } catch(e) {}

function startRecording() {
  if (!recorderMgr) { wx.showToast({title:'设备不支持录音', icon:'none'}); return; }
  APP.recording = true;
  APP.recordStartTime = Date.now();
  try { recorderMgr.start({ format:'mp3', sampleRate:16000, numberOfChannels:1, encodeBitRate:24000 }); } catch(e) {}
  recorderMgr.onStop(function(res) {
    APP.recording = false;
    if (res.tempFilePath) {
      var idx = APP.msgs.length;
      addMsg('🎤 [语音识别中...]', true, 'voice');
      try {
        var audioData = wx.getFileSystemManager().readFileSync(res.tempFilePath, 'base64');
        wx.cloud.callFunction({
          name: 'ai-assistant',
          data: { action:'voice', audioPath:res.tempFilePath, voiceData: audioData },
          success: function(r) {
            var recognized = (r.result && r.result.text) ? r.result.text : '';
            if (recognized && recognized.indexOf('（语音') === -1) {
              if (APP.msgs[idx]) APP.msgs[idx].text = recognized;
              APP.input = recognized;
              sendMsg();
            } else {
              if (APP.msgs[idx]) APP.msgs[idx].text = '🎤 语音输入完成';
            }
          },
          fail: function() {
            if (APP.msgs[idx]) APP.msgs[idx].text = '🎤 语音输入完成';
          }
        });
      } catch(e) {
        if (APP.msgs[idx]) APP.msgs[idx].text = '🎤 语音输入完成';
      }
    }
  });
  recorderMgr.onError(function() { APP.recording = false; });
}

function stopRecording() {
  if (recorderMgr && APP.recording) { try { recorderMgr.stop(); } catch(e) { APP.recording = false; } }
  else APP.recording = false;
}

// ====== 发送 ======
function sendMsg() {
  var text = APP.input.trim();
  if (!text || APP.waiting) return;
  APP.input = '';
  addMsg(text, true, 'text');
  callAI(text);
}

// ====== 行内渲染（处理**加粗**） ======
function renderLine(text, x, y, maxW, color, fontSize) {
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = (fontSize||14)+'px sans-serif';
  var parts = text.split(/\*\*/);
  var px = x;
  for (var i=0;i<parts.length;i++) {
    var p = parts[i];
    if (!p) continue;
    if (i%2===1) { ctx.font = 'bold '+(fontSize||14)+'px sans-serif'; ctx.fillStyle = C.greenB; }
    else { ctx.font = (fontSize||14)+'px sans-serif'; ctx.fillStyle = color||C.text; }
    ctx.fillText(p, px, y);
    px += ctx.measureText(p).width;
    if (px > x + maxW) break;
  }
}

// ====== 自动换行渲染（用于长文本段落） ======
function renderWrapped(text, x, y, maxW, color, fontSize, lineH) {
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  var fs = fontSize || 14;
  var lh = lineH || 18;
  ctx.font = fs + 'px sans-serif';
  // 去除**标记后测宽度，判断是否需要换行
  var plain = text.replace(/\*\*/g, '');
  if (ctx.measureText(plain).width <= maxW) {
    renderLine(text, x, y, maxW, color, fs);
    return lh;
  }
  // 逐字换行
  var chars = text.split('');
  var line = '', ly = y;
  var linesRendered = 0;
  for (var i = 0; i < chars.length; i++) {
    var testLine = line + chars[i];
    var testPlain = testLine.replace(/\*\*/g, '');
    if (ctx.measureText(testPlain).width > maxW && line.length > 0) {
      renderLine(line, x, ly, maxW, color, fs);
      ly += lh;
      linesRendered++;
      line = chars[i];
    } else {
      line = testLine;
    }
  }
  if (line.length > 0) {
    renderLine(line, x, ly, maxW, color, fs);
    linesRendered++;
  }
  return linesRendered * lh;
}

// ====== 预估文本换行后的行数（用于高度计算） ======
function estimateWrappedLines(text, maxW, fontSize) {
  var fs = fontSize || 14;
  ctx.font = fs + 'px sans-serif';
  var plain = text.replace(/\*\*/g, '');
  if (ctx.measureText(plain).width <= maxW) return 1;
  // 用中文字符宽估算
  var charW = ctx.measureText('中').width;
  var maxChars = Math.max(1, Math.floor(maxW / charW));
  return Math.ceil(plain.length / maxChars);
}

// ====== 渲染 ======
function render() {
  ctx.clearRect(0, 0, W, H);

  // --- Background ---
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // --- Header ---
  var hdrH = SB + NAV_H;
  ctx.fillStyle = C.headerGrad;
  ctx.fillRect(0, 0, W, hdrH + 12);
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.moveTo(0, hdrH + 12);
  ctx.quadraticCurveTo(W/2, hdrH + 22, W, hdrH + 12);
  ctx.lineTo(W, hdrH + 12);
  ctx.lineTo(0, hdrH + 12);
  ctx.fill();

  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('光伏产品经理助手', W/2, SB + NAV_H/2 - 3);

  // Role pill
  var pillY = SB + 5, pillH = 24;
  var pillW = 130;
  var label = APP.role ? '▼ ' + APP.role.name : '▼ 选择角色';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rndPath(ctx, W/2 - pillW/2, pillY, pillW, pillH, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W/2, pillY + pillH/2);
  APP.roleRect = { x: W/2 - pillW/2, y: pillY, w: pillW, h: pillH };

  // Tools icon
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧰', W - 18, SB + NAV_H/2 - 2);
  APP.toolsRect = { x: W-48, y: SB, w: 44, h: NAV_H };

  // --- Messages ---
  var msgTop = hdrH + 16;
  var msgBot = H - INPUT_H;
  var viewH = msgBot - msgTop;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, msgTop, W, viewH);
  ctx.clip();

  var yOff = msgTop + 8 - APP.scY;
  var maxBubW = W * 0.75;

  for (var mi=0; mi<APP.msgs.length; mi++) {
    var msg = APP.msgs[mi];
    var lines = msg.lines || parseContent(msg.text);
    var bh = msg.height || calcHeight(lines);

    if (yOff + bh < msgTop) { yOff += bh + 10; continue; }
    if (yOff > msgBot) break;

    if (msg.isSelf) {
      // --- User message ---
      var bubX = 10;
      var bubW = maxBubW;
      ctx.fillStyle = C.msgUser;
      rndPath(ctx, W - bubW - 14, yOff, bubW, bh, 12);
      ctx.fill();

      var ly = yOff + 10;
      ctx.textAlign = 'left';
      for (var li=0; li<lines.length; li++) {
        var l = lines[li];
        if (l.type === 'p' || l.type === 'bullet') {
          var txt = l.type === 'bullet' ? '• ' + l.text : l.text;
          ly += renderWrapped(txt, W - bubW - 4, ly, bubW - 16, C.text, 14, 18);
        } else if (l.type === 'spacer') { ly += 6; }
        else { ly += renderWrapped(l.text, W - bubW - 4, ly, bubW - 16, C.text, 14, 18); }
      }
    } else {
      // --- AI message ---
      // Avatar
      var ax = 10;
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.arc(ax + AVATAR_S/2, yOff + AVATAR_S/2, AVATAR_S/2, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PM', ax + AVATAR_S/2, yOff + AVATAR_S/2 + 1);

      // Bubble
      var bx = 44;
      var bubW = Math.min(maxBubW, W - bx - 10);
      ctx.fillStyle = C.msgAI;
      rndPath(ctx, bx, yOff, bubW, bh, 12);
      ctx.fill();

      // Left accent bar
      ctx.fillStyle = C.green;
      ctx.fillRect(bx, yOff + 6, 3, bh - 12);

      // Content
      var lx = bx + 14;
      var ly = yOff + 10;
      ctx.textAlign = 'left';
      for (var li=0; li<lines.length; li++) {
        var l = lines[li];
        var lw = bubW - 28;

        if (l.type === 'spacer') { ly += 6; continue; }

        if (l.type === 'hr') {
          ctx.strokeStyle = C.grayL;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lx, ly + 5);
          ctx.lineTo(lx + lw, ly + 5);
          ctx.stroke();
          ly += 12; continue;
        }

        if (l.type === 'h1') {
          ctx.fillStyle = C.greenD;
          ctx.font = 'bold 16px sans-serif';
          ctx.textBaseline = 'top';
          renderLine(l.text, lx, ly, lw, C.greenD, 16);
          ly += 26; continue;
        }

        if (l.type === 'h2') {
          ctx.fillStyle = C.greenD;
          ctx.font = 'bold 14px sans-serif';
          ctx.textBaseline = 'top';
          renderLine(l.text, lx, ly, lw, C.greenD, 14);
          ly += 22; continue;
        }

        if (l.type === 'h3') {
          ctx.fillStyle = C.text;
          ctx.font = 'bold 13px sans-serif';
          ctx.textBaseline = 'top';
          renderLine(l.text, lx, ly, lw, C.text, 13);
          ly += 20; continue;
        }

        if (l.type === 'trow') {
          var cells = l.cells;
          var colW = lw / Math.min(cells.length, 5);
          ctx.fillStyle = C.text;
          ctx.font = '12px sans-serif';
          ctx.textBaseline = 'top';
          for (var ci=0; ci<cells.length && ci<5; ci++) {
            var cellText = cells[ci].trim();
            // Bold check for | **text** |
            if (cellText.indexOf('**') >= 0) {
              renderLine(cellText, lx + ci*colW + 4, ly, colW-8, C.text, 12);
            } else {
              ctx.font = '12px sans-serif';
              ctx.fillStyle = C.text;
              ctx.fillText(cellText, lx + ci*colW + 4, ly);
            }
          }
          // Draw light cell borders
          ctx.strokeStyle = 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (var ci=1; ci<cells.length && ci<5; ci++) {
            ctx.moveTo(lx + ci*colW, ly + 2);
            ctx.lineTo(lx + ci*colW, ly + 18);
          }
          ctx.stroke();
          ly += 22; continue;
        }

        if (l.type === 'tsep') {
          ctx.fillStyle = 'rgba(0,0,0,0.04)';
          ctx.fillRect(lx, ly, lw, 2);
          ly += 4; continue;
        }

        if (l.type === 'bullet') {
          ctx.fillStyle = C.greenB;
          ctx.font = '14px sans-serif';
          ctx.textBaseline = 'top';
          ctx.fillText('•', lx, ly);
          ly += renderWrapped(l.text, lx + 14, ly, lw - 14, C.text, 14, 18);
          continue;
        }

        // Regular paragraph (带自动换行)
        ly += renderWrapped(l.text, lx, ly, lw, C.text, 14, 18);
      }

      // Role badge on first AI message or long content
      if ((mi <= 1 || bh > 80) && APP.role) {
        ctx.fillStyle = C.greenLight;
        rndPath(ctx, lx, yOff + bh - 18, 90, 16, 8);
        ctx.fill();
        ctx.fillStyle = C.green;
        ctx.font = '9px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('🤖 ' + APP.role.name, lx + 6, yOff + bh - 10);
      }
    }

    yOff += bh + 10;
  }

  // Typing indicator
  if (APP.waiting) {
    var ty = yOff;
    ctx.fillStyle = C.msgAI;
    rndPath(ctx, 44, ty, 85, 34, 12);
    ctx.fill();
    ctx.fillStyle = C.green;
    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'middle';
    var c = Math.floor((Date.now() % 2400) / 800) + 1;
    ctx.fillText('思考中' + '.'.repeat(c), 54, ty + 17);
  }

  ctx.restore();

  // Scroll indicator
  if (APP.showScrollBtn) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(W/2, msgBot - 20, 14, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↓', W/2, msgBot - 20);
  }

  // --- Input Area ---
  var inY = H - INPUT_H;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, inY, W, INPUT_H);
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(0, inY, W, 1);

  // Mic
  var micX = 8, micS = 40;
  ctx.fillStyle = APP.recording ? '#ef4444' : C.gray;
  ctx.beginPath(); ctx.arc(micX+micS/2, inY+INPUT_H/2, micS/2-2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎤', micX+micS/2, inY+INPUT_H/2+1);
  APP.micRect = { x: micX, y: inY+5, w: micS, h: INPUT_H-10 };

  // Input box
  var inpX = 54, inpW = W - 118;
  ctx.fillStyle = '#f0f2f5';
  rndPath(ctx, inpX, inY+7, inpW, INPUT_H-14, 10);
  ctx.fill();
  if (APP.input) {
    ctx.fillStyle = C.text;
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'middle';
    var display = APP.input;
    var maxW = inpW - 18;
    if (ctx.measureText(display).width > maxW) display = truncate(display, maxW);
    ctx.fillText(display, inpX+10, inY+INPUT_H/2);
  } else {
    ctx.fillStyle = C.gray;
    ctx.font = '13px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('输入需求，或点击🎤语音输入...', inpX+10, inY+INPUT_H/2);
  }
  APP.inputRect = { x: inpX, y: inY+7, w: inpW, h: INPUT_H-14 };

  // Send
  var sx = W - 56, sy = inY+8;
  var canSend = APP.input.trim() && !APP.waiting;
  ctx.fillStyle = canSend ? C.green : '#d1d5db';
  rndPath(ctx, sx, sy, 48, INPUT_H-16, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('发送', sx+24, sy+(INPUT_H-16)/2);
  ctx.textAlign = 'left';
  APP.sendRect = { x: sx, y: sy, w: 48, h: INPUT_H-16 };

  // Recording indicator
  if (APP.recording) {
    var dur = Math.floor((Date.now() - APP.recordStartTime) / 1000);
    ctx.fillStyle = 'rgba(239,68,68,0.9)';
    rndPath(ctx, W/2-65, H-85, 130, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔴 录音中 ' + dur + 's  点击停止', W/2, H-71);
    ctx.textAlign = 'left';
  }

  // --- Toolbox ---
  if (APP.showToolbox) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    rndPath(ctx, 15, 60, W-30, 270, 16);
    ctx.fill();

    ctx.fillStyle = C.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('🧰 分析工具箱', W/2, 88);
    ctx.textAlign = 'left';

    ctx.fillStyle = C.border;
    ctx.fillRect(25, 103, W-50, 1);

    var tools = [
      {icon:'🌍', name:'PESTEL', desc:'宏观环境六维分析（政治/经济/社会/技术/环境/法律）'},
      {icon:'📐', name:'TAM/SAM/SOM', desc:'市场规模三级量化，从全球到可获市场'},
      {icon:'⚡', name:'SWOT', desc:'四象限战略分析（优势/劣势/机会/威胁）'},
      {icon:'💰', name:'NPV/IRR', desc:'投资回报测算+敏感性分析'},
      {icon:'📈', name:'波士顿矩阵', desc:'产品组合策略（明星/金牛/问题/瘦狗）'},
      {icon:'🚀', name:'GTM策略', desc:'产品上市推广四象限优先级分析'}
    ];

    var ty2 = 115;
    for (var ti=0; ti<tools.length; ti++) {
      var rowH = 42;
      ctx.fillStyle = (ti % 2 === 0) ? '#f9fafb' : '#fff';
      ctx.fillRect(25, ty2, W-50, rowH);
      ctx.fillStyle = C.text;
      ctx.font = '16px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(tools[ti].icon, 35, ty2 + rowH/2);
      ctx.fillStyle = C.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(tools[ti].name, 60, ty2 + 12);
      ctx.fillStyle = C.textSec;
      ctx.font = '11px sans-serif';
      ctx.fillText(tools[ti].desc, 60, ty2 + 28);
      ty2 += rowH;
      APP['tool_' + ti] = { x: 25, y: ty2 - rowH, w: W-50, h: rowH, tool: tools[ti] };
    }

    APP.toolboxClose = { x: W-48, y: 63, w: 28, h: 28 };
    ctx.fillStyle = C.gray;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', APP.toolboxClose.x + 14, APP.toolboxClose.y + 14);
  }
}

// ====== 触摸 ======
var _tx = 0, _ty = 0, _touchStartTime = 0;
var _lastScY = 0;

wx.onTouchStart(function(e) {
  var t = e.touches[0];
  _tx = t.x || t.clientX || 0;
  _ty = t.y || t.clientY || 0;
  _touchStartTime = Date.now();
  _lastScY = APP.scY;
});

wx.onTouchMove(function(e) {
  var t = e.touches[0];
  var y = t.y || t.clientY || 0;
  // Scroll only in message area and not in toolbox mode
  if (!APP.showToolbox && e.touches.length === 1) {
    var dy = (_ty - y);
    if (Math.abs(dy) > 5) {
      var newY = _lastScY + dy;
      scrollTo(newY);
    }
  }
});

wx.onTouchEnd(function(e) {
  var x = _tx, y = _ty;
  if (e.changedTouches && e.changedTouches[0]) {
    x = e.changedTouches[0].x || e.changedTouches[0].clientX || x;
    y = e.changedTouches[0].y || e.changedTouches[0].clientY || y;
  }

  var dt = Date.now() - _touchStartTime;
  var moved = Math.abs(x - _tx) + Math.abs(y - _ty);

  // If scrolled more than tapped, treat as scroll not tap
  if (moved > 15 && dt > 100) return;

  // Toolbox bg close
  if (APP.showToolbox) {
    // Check toolbox close button
    if (APP.toolboxClose && hit(x, y, APP.toolboxClose.x, APP.toolboxClose.y, APP.toolboxClose.w, APP.toolboxClose.h)) {
      APP.showToolbox = false; return;
    }
    // Check tool items
    for (var ti=0; ti<6; ti++) {
      var rt = APP['tool_' + ti];
      if (rt && hit(x, y, rt.x, rt.y, rt.w, rt.h)) {
        APP.showToolbox = false;
        var msg = '请使用' + rt.tool.name + '方法，为我分析团队相关的产品管理场景，输出详细分析结果。';
        addMsg('📌 使用工具：【' + rt.tool.name + '】' + rt.tool.desc, true, 'text');
        callAI(msg);
        return;
      }
    }
    APP.showToolbox = false; return;
  }

  // Tools button
  if (APP.toolsRect && hit(x, y, APP.toolsRect.x, APP.toolsRect.y, APP.toolsRect.w, APP.toolsRect.h)) {
    APP.showToolbox = !APP.showToolbox; return;
  }

  // Role selector
  if (APP.roleRect && hit(x, y, APP.roleRect.x, APP.roleRect.y, APP.roleRect.w, APP.roleRect.h)) {
    wx.showActionSheet({
      itemList: ROLES.map(function(r){ return r.icon + ' ' + r.name; }),
      success: function(res) {
        APP.role = ROLES[res.tapIndex];
        APP.msgs = [];
        APP.scY = 0;
        var welcome = '### 👋 您好！我已切换至 **' + APP.role.name + '** 角色\n\n' +
          APP.role.desc + '。\n\n' +
          '**您可以这样使用：**\n' +
          '• 直接描述您的需求场景\n' +
          '• 点击 🎤 语音输入\n' +
          '• 选择 🧰 工具箱使用分析工具\n\n' +
          '请告诉我您想分析的问题！';
        addMsg(welcome, false);
      }
    });
    return;
  }

  // Scroll down tap
  var msgBot = H - INPUT_H;
  var msgTop = SB + NAV_H + 16;
  if (APP.showScrollBtn && hit(x, y, W/2-15, msgBot-35, 30, 30)) {
    scrollToBottom(); return;
  }

  // Mic
  if (APP.micRect && hit(x, y, APP.micRect.x, APP.micRect.y, APP.micRect.w, APP.micRect.h)) {
    if (APP.recording) { stopRecording(); }
    else { startRecording(); }
    return;
  }

  // Send
  if (APP.sendRect && hit(x, y, APP.sendRect.x, APP.sendRect.y, APP.sendRect.w, APP.sendRect.h)) {
    sendMsg(); return;
  }

  // Input
  if (APP.inputRect && hit(x, y, APP.inputRect.x, APP.inputRect.y, APP.inputRect.w, APP.inputRect.h)) {
    wx.showKeyboard({ defaultValue: APP.input, maxLength: 2000, multiple: false });
    wx.onKeyboardInput(function(r) { APP.input = r.value; APP.keyboardOn = true; });
    wx.onKeyboardConfirm(function(r) {
      APP.input = r.value;
      if (r.value.trim()) { wx.hideKeyboard(); APP.keyboardOn = false; sendMsg(); }
    });
    wx.onKeyboardComplete(function() { APP.keyboardOn = false; });
    return;
  }

  wx.hideKeyboard();
  APP.keyboardOn = false;
});

// ====== 主循环 ======
function loop() {
  render();
  requestAnimationFrame(loop);
}

// ====== 初始化 ======
addMsg('### 👋 您好！我是光伏产品经理助手\n\n我是您的**专属AI分析伙伴**，覆盖产品经理六大核心角色。\n\n----------------------------\n\n### 🚀 快速开始\n\n1️⃣ **点击顶部选择角色** 👆\n• 🔍 产品价值定义者 — 市场分析/竞品对标/需求挖掘\n• 📊 产品经营规划者 — 目标设定/财务模型/策略\n• ⚙️ 开发交付统筹者 — 项目管理/风险管控\n• 🚀 上市营销推动者 — GTM策略/定价/渠道\n• 🔄 生命周期运营者 — 迭代优化/退市决策\n• 🤝 跨团队建设者 — 协作机制/能力建设\n\n2️⃣ **在输入框描述需求**\n例："分析2025年全球光伏市场"\n    "对比TOPCon和HJT技术"\n    "做一份需求分析报告"\n    "测算100MW电站的IRR"\n\n3️⃣ **点击🎤语音输入** — 说话更方便\n\n4️⃣ **🧰工具箱** — PESTEL/SWOT/NPV等专业工具\n\n----------------------------\n\n现在就告诉我您的需求！', false);

loop();
