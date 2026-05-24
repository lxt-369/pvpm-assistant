App({
  globalData: {
    openid: '',
  },
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-d7girkqhp8b5ba071',
    });

    // 获取用户 openid
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        if (res.result && res.result.openid) {
          this.globalData.openid = res.result.openid;
        }
      },
    });
  },
});
