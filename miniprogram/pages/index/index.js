// pages/index/index.js —— 首页：黛山朱砂新中式
// 深黛竖排品牌区 · 用户进度 · 2+3 汇总导航
const app = getApp();
const { callCloud } = require('../../utils/request');

Page({
  data: {
    // 用户问候
    greeting: '你好，研学旅人',
    nickname: '研学旅人',
    level: '普通会员',
    score: 0,
    rank: '--',
    progress: 0,
    done: 0
  },

  onLoad() {
    const hour = new Date().getHours();
    let g = '早上好';
    if (hour >= 12 && hour < 18) g = '下午好';
    else if (hour >= 18 || hour < 6) g = '晚上好';
    this.setData({ greeting: g });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refreshUserData();
  },

  refreshUserData() {
    app.getUser((user) => {
      this.setData({
        nickname: user.nickname || '研学旅人',
        level: user.levelName || '普通会员',
        score: user.score || 0
      });
    });
    callCloud('biz', 'getMyTasks', {}, { loading: false })
      .then((r) => {
        this.setData({ progress: r.progress, done: r.done });
      })
      .catch(() => {});
    callCloud('biz', 'getRank', {}, { loading: false })
      .then((r) => this.setData({ rank: r.myRank }))
      .catch(() => {});
  },

  // ───── 汇总导航跳转 ─────

  // 预约购票（直达）
  goBooking() {
    wx.navigateTo({ url: '/pages/booking/booking' });
  },

  // 研学任务：带段落标记进入研学 tab（task / script）
  goStudyTask(e) {
    app.globalData.studySegment = e.currentTarget.dataset.seg || 'task';
    wx.switchTab({ url: '/pages/study/study' });
  },

  // 数字展馆（tab 直达）
  goGallery() {
    wx.switchTab({ url: '/pages/ar/ar' });
  },

  // AI 巴小艺（直达）
  goAI() {
    wx.navigateTo({ url: '/pages/ai/ai' });
  },

  // 文创商城（直达）
  goShop() {
    wx.navigateTo({ url: '/pages/shop/shop' });
  },

  onShareAppMessage() {
    return {
      title: '艺韵巴蜀 · 非遗剧本研学｜在故事里，读懂非遗',
      path: '/pages/index/index'
    };
  }
});
