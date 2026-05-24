/**
 * 光伏产品经理助手 - Coze API 云函数
 * 封装 Coze 智能体为 HTTP API，支持 wx.request / wx.cloud.callFunction
 *
 * 使用方式：
 *   方式一：wx.cloud.callFunction({ name: 'coze-api', data: { action: 'chat', message: '...' } })
 *   方式二：开启 HTTP 访问后，POST https://<env>.service.tcloudbase.com/coze-api
 *
 * 开启 HTTP 访问：
 *   微信开发者工具 → 云开发 → 云函数 → 选择 coze-api → HTTP访问 → 开启
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ====== Coze 配置 ======
const COZE_API_KEY = 'pat_G5CldP4SkNHvRQND5T0af0nkeyPtGPnzmf8VGEFgpR7ovfdtYSRRH8UUGQ7zCY2O';
const COZE_BOT_ID = '7635652089556926514';
const COZE_API_BASE = 'https://api.coze.cn';

// ====== HTTP 模式处理（开启 HTTP 访问后使用） ======
function parseHTTPEvent(event) {
  // WeChat Cloud HTTP 触发时，event 包含 httpMethod, body, path 等字段
  if (event.httpMethod && event.body) {
    try {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      return body;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function httpResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(data),
  };
}

// ====== 调用 Coze API ======
async function callCoze(message, userId) {
  // Step 1: 创建聊天
  const createRes = await fetch(`${COZE_API_BASE}/v3/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COZE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bot_id: COZE_BOT_ID,
      user_id: userId || `user_${Date.now()}`,
      additional_messages: [{
        role: 'user',
        content: message.trim(),
        content_type: 'text',
      }],
      stream: false,
    }),
  });
  const createData = await createRes.json();

  if (createData.code !== 0) {
    console.error('Coze 创建聊天失败:', createData.msg || createData.code);
    return { code: 502, message: 'AI 服务暂时不可用' };
  }

  const chatId = createData.data.id;
  const conversationId = createData.data.conversation_id;

  // Step 2: 轮询等待完成（最多 30 秒）
  let status = 'in_progress';
  let attempts = 0;
  while (status === 'in_progress' && attempts < 30) {
    await new Promise(r => setTimeout(r, 1000));
    const statusRes = await fetch(
      `${COZE_API_BASE}/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
      { headers: { 'Authorization': `Bearer ${COZE_API_KEY}` } }
    );
    const statusData = await statusRes.json();
    if (statusData.code === 0 && statusData.data) {
      status = statusData.data.status;
    }
    attempts++;
  }

  if (status !== 'completed') {
    return { code: 504, message: 'AI 响应超时，请稍后重试' };
  }

  // Step 3: 获取消息
  const msgRes = await fetch(`${COZE_API_BASE}/v3/chat/message/list`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COZE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      conversation_id: conversationId,
    }),
  });
  const msgData = await msgRes.json();

  if (msgData.code !== 0) {
    return { code: 502, message: '获取 AI 回复失败' };
  }

  // 提取 AI 回复
  let reply = '';
  for (const msg of (msgData.data || [])) {
    if (msg.role === 'assistant' && msg.type === 'answer') {
      reply = msg.content;
      break;
    }
  }

  if (!reply) {
    return { code: 500, message: 'AI 未返回有效回复' };
  }

  return {
    code: 0,
    message: '成功',
    data: {
      reply,
      conversation_id: conversationId,
      chat_id: chatId,
    },
  };
}

// ====== 云函数主入口 ======
exports.main = async (event) => {
  // 支持三种调用方式：

  // 1. HTTP 模式（开启云函数 HTTP 访问后）
  const httpBody = parseHTTPEvent(event);
  if (httpBody) {
    const { message, userId } = httpBody;
    if (!message || !message.trim()) {
      return httpResponse(400, { code: 400, message: '缺少消息内容', data: null });
    }
    if (message.length > 2000) {
      return httpResponse(400, { code: 400, message: '消息过长（限2000字）', data: null });
    }
    const result = await callCoze(message, userId || event.headers?.['x-wx-openid']);
    return httpResponse(200, result);
  }

  // 2. wx.cloud.callFunction 模式
  if (event.action === 'chat') {
    const { message, userId } = event;
    if (!message || !message.trim()) {
      return { code: 400, message: '缺少消息内容', data: null };
    }
    const result = await callCoze(message, userId);
    return result;
  }

  // 3. 健康检查
  if (event.action === 'ping') {
    return { code: 0, message: 'pong', data: { time: new Date().toISOString() } };
  }

  // 默认返回
  return {
    code: 400,
    message: '请指定 action: chat / ping',
    data: null,
  };
};
