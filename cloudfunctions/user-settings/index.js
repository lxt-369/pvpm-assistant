/**
 * 云函数：用户设置
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { action, settings } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (action === 'save') {
    try {
      await db.collection('user_settings').doc(openid).set({
        data: {
          openid: openid,
          settings: settings,
          updatedAt: db.serverDate()
        }
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (action === 'get') {
    try {
      const result = await db.collection('user_settings').doc(openid).get();
      return { success: true, settings: result.data?.settings || {} };
    } catch (e) {
      return { success: true, settings: {} };
    }
  }

  return { error: '未知操作' };
};
