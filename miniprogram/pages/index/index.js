// pages/index/index.js —— 首页：云端用户数据 + 研学进度
const { callCloud } = require('../../utils/request');

Page({
  data: {
    statusBarHeight: 0,
    mascot: '/images/mascot.webp',
    mascotFail: false,

    // 用户信息区（云端真实数据，默认兜底值）
    userInfo: {
      avatar: '旅',
      avatarBg: '#2A5E46',
      greeting: '你好，研学旅人',
      level: '普通会员',
      score: 0,
      rank: '--'
    },

    // 核心功能入口
    features: [
      { id: 'script', glyph: '剧', title: '电子剧本', desc: '酉阳秘境沉浸故事', url: '/pages/script/script' },
      { id: 'show',   glyph: '观', title: '数字展示',   desc: 'IP·剪纸·科普视频', url: '/pages/ar/ar' },
      { id: 'ai',     glyph: '智', title: 'AI 巴小艺', desc: '非遗知识智能问答', url: '/pages/ai/ai' },
      { id: 'rank',   glyph: '榜', title: '积分排行',   desc: '查看研学排名',     url: '/pages/ranking/ranking' },
      { id: 'report', glyph: '报', title: '研学报告',   desc: '生成专属研学报告', url: '/pages/report/report' },
      { id: 'book',   glyph: '约', title: '预约购票',   desc: '非遗研学场次预约', url: '/pages/booking/booking' },
      { id: 'shop',   glyph: '购', title: '文创商城',   desc: '非遗好物积分兑换', url: '/pages/shop/shop' },
      { id: 'me',     glyph: '我', title: '个人中心',   desc: '门票证书与会员',   url: '/pages/profile/profile' }
    ],

    // 研学进度概览（云端五大关卡数据）
    progress: {
      total: 0,
      done: 0,
      totalTask: 5
    }
  },

  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const statusBarHeight = (info && info.statusBarHeight) || 20;
    const hour = new Date().getHours();
    let greeting = '早上好，旅人';
    if (hour >= 12 && hour < 18) {
      greeting = '下午好，旅人';
    } else if (hour >= 18 || hour < 6) {
      greeting = '晚上好，旅人';
    }

    this.setData({ statusBarHeight, 'userInfo.greeting': greeting });
  },

  onShow() {
    this.refreshUserData();
  },

  // 拉取云端用户数据与任务进度
  refreshUserData() {
    const app = getApp();
    app.getUser((user) => {
      this.setData({
        'userInfo.avatar': (user.nickname || '旅').substring(0, 1),
        'userInfo.level': user.levelName || '普通会员',
        'userInfo.score': user.score || 0
      });
    });
    callCloud('biz', 'getMyTasks', {}, { loading: false })
      .then((r) => {
        this.setData({
          'progress.done': r.done,
          'progress.totalTask': r.total,
          'progress.total': r.progress
        });
      })
      .catch(() => {});
    callCloud('biz', 'getRank', {}, { loading: false })
      .then((r) => {
        this.setData({ 'userInfo.rank': `第 ${r.myRank} 名` });
      })
      .catch(() => {});
  },

  onShareAppMessage() {
    return {
      title: '艺韵巴蜀 · 非遗剧本研学｜酉见非遗，趣玩传承',
      path: '/pages/index/index'
    };
  },

  // 主形象图加载失败时优雅降级为墨绿渐变底
  onMascotError() {
    this.setData({ mascotFail: true });
  },

  // 通用功能跳转
  goFeature(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  },

  goToScript() {
    wx.navigateTo({ url: '/pages/script/script' });
  },

  goToRank() {
    wx.navigateTo({ url: '/pages/ranking/ranking' });
  },

  goToTask() {
    wx.navigateTo({ url: '/pages/task/task' });
  }
});
