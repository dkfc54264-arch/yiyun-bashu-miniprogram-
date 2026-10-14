// pages/profile/profile.js —— 个人中心：会员卡/五级守护人/我的门票/守护人证书
const app = getApp();
const { callCloud } = require('../../utils/request');

// 五级会员体系（与云函数 user LEVELS、项目书 5.5.1 一致）
const LEVELS = [
  { level: 1, name: '普通会员', min: 0, glyph: '🌱', color: '#b2bec3', right: '基础研学功能与任务体验' },
  { level: 2, name: '青铜守护人', min: 500, glyph: '🥉', color: '#cd7f32', right: '文创商城全场 95 折' },
  { level: 3, name: '白银守护人', min: 2000, glyph: '🥈', color: '#8fa4b0', right: '场次优先预约权' },
  { level: 4, name: '黄金守护人', min: 5000, glyph: '🥇', color: '#f39c12', right: '深度沉浸版票价 9 折' },
  { level: 5, name: '钻石守护人', min: 10000, glyph: '💎', color: '#3498db', right: '年度守护人礼盒 + 定制剧本' }
];

Page({
  data: {
    userInfo: null,
    levels: LEVELS,
    curLevel: LEVELS[0],
    nextLevel: null,
    levelPct: 0,
    remain: 0,
    orders: [],
    certVisible: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.refreshUser();
    this.loadOrders();
  },

  refreshUser() {
    callCloud('user', 'getInfo', {}, { loading: false })
      .then((r) => {
        app.setUser(r.user);
        this.applyUser(r.user);
      })
      .catch(() => {
        app.getUser((u) => this.applyUser(u));
      });
  },

  applyUser(u) {
    if (!u) return;
    const score = u.score || 0;
    const cur = LEVELS.find(l => l.level === (u.level || 1)) || LEVELS[0];
    const next = LEVELS.find(l => l.level === cur.level + 1) || null;
    let pct = 100;
    let remain = 0;
    if (next) {
      pct = Math.min(100, Math.round((score - cur.min) / (next.min - cur.min) * 100));
      remain = Math.max(0, next.min - score);
    }
    this.setData({ userInfo: u, curLevel: cur, nextLevel: next, levelPct: pct, remain });
  },

  loadOrders() {
    callCloud('biz', 'myOrders', {}, { loading: false })
      .then((r) => {
        const paid = (r.list || []).filter(b => b.status === 'paid' || b.status === 'used');
        this.setData({ orders: paid.slice(0, 3) });
      })
      .catch(() => {});
  },

  /* ─── 页面跳转 ─── */
  goBooking() { wx.navigateTo({ url: '/pages/booking/booking' }); },
  goTask() { wx.switchTab({ url: '/pages/study/study' }); },
  goRank() { wx.navigateTo({ url: '/pages/ranking/ranking' }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },

  /* ═══════════ 守护人证书（canvas 2d） ═══════════ */

  openCert() {
    this.setData({ certVisible: true }, () => this.drawCert());
  },

  closeCert() {
    this.setData({ certVisible: false });
  },

  noop() {},

  drawCert() {
    const u = this.data.userInfo || {};
    const cur = this.data.curLevel || LEVELS[0];
    const query = wx.createSelectorQuery();
    query.select('#certCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) return;
      const canvas = res[0].node;
      this._certCanvas = canvas;
      const ctx = canvas.getContext('2d');
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : { pixelRatio: 2 }).pixelRatio || 2;
      const W = res[0].width;
      const H = res[0].height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      // 宣纸底 + 双层描边
      ctx.fillStyle = '#F6F0E2';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#C9A227';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.strokeStyle = 'rgba(31, 56, 48, 0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, W - 36, H - 36);

      ctx.textAlign = 'center';
      // 标题
      ctx.fillStyle = '#1F3830';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('酉阳非遗守护人证书', W / 2, 64);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#9A948A';
      ctx.fillText('YIYUN BASHU · IMMERSIVE STUDY BASE', W / 2, 84);
      // 分隔线
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 102);
      ctx.lineTo(W - 60, 102);
      ctx.stroke();
      // 正文
      ctx.fillStyle = '#6B6659';
      ctx.font = '13px sans-serif';
      ctx.fillText('兹 授 予', W / 2, 134);
      ctx.fillStyle = '#C9A227';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(u.nickname || '研学旅人', W / 2, 170);
      ctx.fillStyle = '#2B2B2B';
      ctx.font = '13px sans-serif';
      ctx.fillText('已完成《酉阳秘境·非遗守护人》剧本研学', W / 2, 206);
      ctx.fillText('解锁五大非遗关卡 · 守护酉阳非遗秘境', W / 2, 228);
      // 等级积分
      ctx.fillStyle = '#1F3830';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`${cur.name} · ${u.score || 0} 积分`, W / 2, 264);
      // 落款
      const d = new Date();
      ctx.fillStyle = '#9A948A';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`, W / 2, 316);
      ctx.fillText('艺韵巴蜀沉浸式数字研学基地', W / 2, 338);
    });
  },

  saveCert() {
    if (!this._certCanvas) {
      wx.showToast({ title: '证书未就绪', icon: 'none' });
      return;
    }
    wx.canvasToTempFilePath({
      canvas: this._certCanvas,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: (err) => {
            if (err.errMsg && err.errMsg.indexOf('auth') !== -1) {
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中允许保存图片到相册',
                confirmText: '去设置',
                success: (r) => { if (r.confirm) wx.openSetting(); }
              });
            }
          }
        });
      },
      fail: () => wx.showToast({ title: '生成失败，请重试', icon: 'none' })
    });
  }
});
