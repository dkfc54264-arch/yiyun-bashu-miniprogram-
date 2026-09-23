// pages/shop/shop.js —— 文创商城：积分兑换非遗好物（biz/getProducts + exchangeProduct）
const app = getApp();
const { callCloud } = require('../../utils/request');

// 演示商品（products 集合为空时展示；云端导入相同内容后可真实兑换）
const DEMO_PRODUCTS = [
  { _id: 'demo1', name: '苗银蝴蝶挂件', glyph: '🦋', desc: '苗银锻造工艺，蝴蝶妈妈图腾，寓意辟邪纳福', points: 800, price: 68, stock: 9, tag: '热销' },
  { _id: 'demo2', name: '西兰卡普编织手环', glyph: '🧶', desc: '四十八勾纹样手工织造，土家族"无字史书"', points: 600, price: 49, stock: 12, tag: '新品' },
  { _id: 'demo3', name: '傩戏面具钥匙扣', glyph: '🎭', desc: '迷你开山莽将面具造型，附赠祈福卡一张', points: 400, price: 29, stock: 20, tag: '人气' },
  { _id: 'demo4', name: '摆手舞徽章套装', glyph: '💃', desc: '单摆/双摆/回旋摆三枚一套，金属烤漆工艺', points: 350, price: 25, stock: 15, tag: '纪念' },
  { _id: 'demo5', name: '土家油茶汤礼盒', glyph: '🍵', desc: '阴米、花生、茶叶原产配料，在家复刻土家味', points: 900, price: 79, stock: 8, tag: '特产' },
  { _id: 'demo6', name: '守护人证书相框', glyph: '🖼️', desc: '实木相框，装裱你的专属非遗守护人证书', points: 1200, price: 99, stock: 5, tag: '限定' }
];

Page({
  data: {
    score: 0,
    products: [],
    isDemo: false,
    exchangingId: ''
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    const u = app.globalData.userInfo;
    if (u) this.setData({ score: u.score || 0 });
  },

  loadProducts() {
    callCloud('biz', 'getProducts', {}, { loading: true })
      .then((r) => {
        if ((r.list || []).length > 0) {
          this.setData({ products: r.list, isDemo: false });
        } else {
          this.setData({ products: DEMO_PRODUCTS, isDemo: true });
        }
      })
      .catch(() => {
        this.setData({ products: DEMO_PRODUCTS, isDemo: true });
      });
  },

  exchange(e) {
    const id = e.currentTarget.dataset.id;
    const p = this.data.products.find(x => x._id === id);
    if (!p || this.data.exchangingId) return;
    if (p.stock <= 0) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    if (this.data.score < p.points) {
      wx.showToast({ title: `积分不足，还差 ${p.points - this.data.score} 分`, icon: 'none' });
      return;
    }
    if (this.data.isDemo) {
      wx.showModal({
        title: '演示商品',
        content: '当前展示的是演示数据。在云开发控制台向 products 集合导入商品记录后即可真实兑换。',
        showCancel: false
      });
      return;
    }
    wx.showModal({
      title: '确认兑换',
      content: `用 ${p.points} 积分兑换「${p.name}」？`,
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ exchangingId: id });
        callCloud('biz', 'exchangeProduct', { productId: id, mode: 'points' }, { loading: true, loadingText: '兑换中' })
          .then((r) => {
            app.setUser({ score: r.score });
            const idx = this.data.products.findIndex(x => x._id === id);
            this.setData({
              score: r.score,
              exchangingId: '',
              [`products[${idx}].stock`]: Math.max(0, (p.stock || 1) - 1)
            });
            wx.showToast({ title: '兑换成功！', icon: 'success' });
          })
          .catch(() => this.setData({ exchangingId: '' }));
      }
    });
  },

  goTask() {
    wx.navigateTo({ url: '/pages/task/task' });
  }
});
