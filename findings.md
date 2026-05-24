# PVPM Assistant 完善记录

## 修改内容

### 1. cloudfunctions/ai-assistant/index.js
- 添加了缺失的 `ASR_PROVIDER` 和 `TTS_PROVIDER` 变量定义
- Coze 轮询优化: 60次×1.5s → 40次×1s (从最多90s缩短到40s)
- Coze 超时返回 `{ error, fallbackToMock }` 对象，主入口判断后降级到本地知识库
- Coze 创建聊天失败时返回详细错误信息

### 2. game.js
- 前端超时 20s → 15s
- 超时提示语优化: 明确告知"AI响应超时，已切换到本地知识库"
- 云函数调用失败时提示更清晰

### 3. 部署与接入指南.md
- 更新 AI 配置说明，注明 Coze 已配置
- 增加 2025年5月更新日志
- 补充降级机制说明

## 部署步骤
1. 右键 `cloudfunctions/ai-assistant` → 上传并部署: 云端安装依赖
2. 在微信开发者工具中编译预览
3. 确认 Coze AI 能正常回复
