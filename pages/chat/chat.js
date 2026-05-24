Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    userId: '',
  },

  onLoad() {
    const app = getApp();
    const userId = app?.globalData?.openid || `user_${Date.now()}`;
    this.setData({ userId });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isLoading) return;
    this.setData({ inputText: '' });

    this.addMessage('user', text);
    this.setData({ isLoading: true });
    this.callCozeAPI(text);
  },

  callCozeAPI(message) {
    wx.cloud.callFunction({
      name: 'coze-api',
      data: { action: 'chat', message, userId: this.data.userId },
      success: (res) => {
        const result = res.result;
        if (result && result.code === 0 && result.data?.reply) {
          this.addMessage('assistant', result.data.reply);
        } else {
          this.addMessage('assistant', `⚠️ ${result?.message || 'AI 回复失败'}`, true);
        }
      },
      fail: () => {
        this.addMessage('assistant', '⚠️ 网络连接失败，请检查网络', true);
      },
      complete: () => {
        this.setData({ isLoading: false });
      },
    });
  },

  addMessage(role, content, isError = false) {
    const messages = [...this.data.messages, {
      role,
      content,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isError,
    }];
    this.setData({ messages });
  },
});
