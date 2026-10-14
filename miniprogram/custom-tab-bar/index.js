// custom-tab-bar/index.js —— 底部主导航（黛山朱砂新中式）
Component({
  data: {
    selected: 0,
    safeBottom: 0,
    list: [
      { id: 'home', pagePath: '/pages/index/index', text: '首页' },
      { id: 'study', pagePath: '/pages/study/study', text: '研学' },
      { id: 'gallery', pagePath: '/pages/ar/ar', text: '展馆' },
      { id: 'me', pagePath: '/pages/profile/profile', text: '我的' }
    ]
  },
  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      let safeBottom = 0;
      // 路径一：safeAreaInsets（iOS 全面屏 / 安卓手势条）
      if (info.safeAreaInsets) safeBottom = info.safeAreaInsets.bottom || 0;
      // 路径二：由 safeArea 与 screenHeight 反推（旧基础库兼容）
      if (!safeBottom && info.safeArea && info.screenHeight) {
        safeBottom = Math.max(0, info.screenHeight - info.safeArea.bottom);
      }
      this.setData({ safeBottom });
    }
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      wx.switchTab({ url: path });
      this.setData({ selected: index });
    }
  }
});
