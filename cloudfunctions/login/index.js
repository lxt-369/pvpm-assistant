/**
 * 云函数：用户登录
 * 通过微信code换取openid
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();

  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    token: `pvp_${wxContext.OPENID.substring(0, 16)}`,
    message: '登录成功'
  };
};
