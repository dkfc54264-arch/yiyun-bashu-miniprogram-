// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数决定小程序发起的云开发调用（wx.cloud.xxx）请求到哪个云环境
      env: "cloud1-d9gh6b85b2c0f6570",
      userInfo: null,
      // 首页清单跳研学 tab 时预选段落：'task' | 'script'
      studySegment: ''
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }
    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true,
    });
    // 静默登录（云函数 user/login 自动注册+返回用户信息）
    this.login();
  },

  // 登录并缓存用户信息；页面可通过 getUser(cb) 等待登录完成
  login: function () {
    const { callCloud } = require('./utils/request');
    return callCloud('user', 'login', {}, { loading: false })
      .then((r) => {
        this.globalData.userInfo = r.user;
        this._userReady = true;
        (this._userCbs || []).forEach((cb) => cb(r.user));
        this._userCbs = [];
        return r.user;
      })
      .catch(() => {});
  },

  // 获取用户信息（若登录未完成则等待）
  getUser: function (cb) {
    if (this.globalData.userInfo) {
      cb(this.globalData.userInfo);
    } else {
      this._userCbs = this._userCbs || [];
      this._userCbs.push(cb);
    }
  },

  // 更新本地缓存的用户信息（积分变动后调用）
  setUser: function (patch) {
    if (this.globalData.userInfo) {
      this.globalData.userInfo = Object.assign({}, this.globalData.userInfo, patch);
    }
  },
});
