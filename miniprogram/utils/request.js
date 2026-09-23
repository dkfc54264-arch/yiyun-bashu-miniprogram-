// utils/request.js —— 云函数调用统一封装
/**
 * 调用云函数（action 路由式）
 * @param {string} name 云函数名：user | biz | aiChat
 * @param {string} action 操作名
 * @param {object} data 业务参数
 * @param {object} opts { loading: 是否显示loading, loadingText }
 * @returns {Promise<object>} 云函数返回值（ok=false 时抛出 toast 并 reject）
 */
function callCloud(name, action, data = {}, opts = {}) {
  const { loading = true, loadingText = '加载中' } = opts;
  if (loading) wx.showLoading({ title: loadingText, mask: true });
  return wx.cloud.callFunction({
    name,
    data: { action, ...data }
  }).then(res => {
    if (loading) wx.hideLoading();
    const r = res.result || {};
    if (r.ok === false) {
      wx.showToast({ title: r.msg || '操作失败', icon: 'none' });
      return Promise.reject(r);
    }
    return r;
  }).catch(err => {
    if (loading) wx.hideLoading();
    // 仅对网络级错误（带 errMsg）弹"网络异常"；业务 reject（r 对象无 errMsg）的 toast 已在上方弹过，避免重复
    if (err && err.errMsg && err.errMsg.indexOf('ok') === -1) {
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    }
    return Promise.reject(err);
  });
}

module.exports = { callCloud };
