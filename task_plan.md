# PVPM Assistant 完善计划

## 目标
让光伏产品经理助手小程序更稳定、体验更好，Coze AI 集成可用。

## 改进项

### 1. 云函数修复 (cloudfunctions/ai-assistant/index.js)
- [ ] 定义缺失变量: ASR_PROVIDER, TTS_PROVIDER
- [ ] Coze 调用失败时返回更友好的错误信息
- [ ] 减少 chat 消息轮询间隔(1500ms→1000ms)，减少最大等待次数(60→40)

### 2. 前端交互优化 (game.js)
- [ ] 减少 callAI 超时时间 (20s→15s)
- [ ] 云函数调用失败时提示用户检查配置
- [ ] Coze 模式下，等待时显示"AI思考中"而非"网络繁忙"

### 3. 部署准备
- [ ] 更新部署指南，标注 Coze 已配置
- [ ] 确认所有依赖完整性
