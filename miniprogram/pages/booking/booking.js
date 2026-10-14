// pages/booking.js —— 预约购票：版本→场次→下单→模拟支付→电子票
const { callCloud } = require('../../utils/request');
const SCRIPTS = require('../../data/scripts');

const B_GROUP_PRICE = 139; // B端团单（10人以上研学团）

Page({
  data: {
    // 三版本剧本（源自 data/scripts.js，与项目书定价一致）
    versions: [],
    selectedVersion: '',

    // 场次（云端 sessions 集合）
    sessions: [],
    selectedSession: '',
    selectedSessionInfo: null,

    // 联系人
    name: '',
    phone: '',
    num: 1,
    price: 0,
    total: 0,

    // 模拟支付弹层
    showPay: false,
    payAmount: 0,
    payDesc: '',
    paying: false,

    // 我的门票
    orders: []
  },

  onLoad(options) {
    const versions = Object.keys(SCRIPTS).map(id => ({
      id,
      name: SCRIPTS[id].name,
      price: SCRIPTS[id].price,
      duration: SCRIPTS[id].duration,
      difficultyText: SCRIPTS[id].difficultyText
    }));
    this.setData({ versions });
    // 首页"研学三境"卡片可带版本预选
    if (options && options.version && SCRIPTS[options.version]) {
      this.selectVersion({ currentTarget: { dataset: { id: options.version } } });
    }
  },

  onShow() {
    if (this.data.selectedVersion) this.loadSessions(this.data.selectedVersion);
    this.loadMyOrders();
  },

  // ── 版本选择 ──
  selectVersion(e) {
    const id = e.currentTarget.dataset.id;
    const v = this.data.versions.find(x => x.id === id);
    this.setData({
      selectedVersion: id,
      selectedSession: '',
      selectedSessionInfo: null,
      price: v.price,
      total: v.price * this.data.num
    });
    this.loadSessions(id);
  },

  loadSessions(versionId) {
    callCloud('biz', 'getSessions', { scriptVersion: versionId }, { loadingText: '场次加载中' })
      .then(r => {
        this.setData({ sessions: r.list });
        if (r.list.length === 0) {
          wx.showToast({ title: '该版本暂无场次，请稍后再来', icon: 'none' });
        }
      })
      .catch(() => {
        this.setData({ sessions: [] });
      });
  },

  // ── 场次选择 ──
  selectSession(e) {
    const id = e.currentTarget.dataset.id;
    const s = this.data.sessions.find(x => x._id === id);
    if (!s || s.remaining <= 0) {
      wx.showToast({ title: '该场次已约满', icon: 'none' });
      return;
    }
    this.setData({ selectedSession: id, selectedSessionInfo: s });
  },

  // ── 表单 ──
  inputName(e) { this.setData({ name: e.detail.value }); },
  inputPhone(e) { this.setData({ phone: e.detail.value }); },
  inputNum(e) {
    const num = parseInt(e.detail.value) || 1;
    this.setData({ num: Math.max(1, Math.min(10, num)), total: this.data.price * Math.max(1, Math.min(10, num)) });
  },

  // ── 提交预约 → 创建订单 ──
  submitBooking() {
    const { name, phone, selectedSession, selectedVersion, num, price } = this.data;
    if (!name.trim()) return wx.showToast({ title: '请输入姓名', icon: 'none' });
    if (!phone.trim() || phone.length !== 11) return wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
    if (!selectedVersion) return wx.showToast({ title: '请选择剧本版本', icon: 'none' });
    if (!selectedSession) return wx.showToast({ title: '请选择场次', icon: 'none' });

    callCloud('biz', 'createOrder', { sessionId: selectedSession, name: name.trim(), phone: phone.trim(), count: num })
      .then(r => {
        this.setData({
          showPay: true,
          payAmount: r.amount,
          payDesc: `${r.versionName} · ${num} 人 · ${this.data.selectedSessionInfo.date} ${this.data.selectedSessionInfo.time}`,
          pendingBookingId: r.bookingId
        });
      })
      .catch(() => {
        // 失败提示已由 callCloud 统一处理，此处静默避免未捕获告警
      });
  },

  // ── 模拟支付 ──
  cancelPay() {
    this.setData({ showPay: false });
    wx.showToast({ title: '已取消支付', icon: 'none' });
  },

  confirmPay() {
    if (this.data.paying) return;
    this.setData({ paying: true });
    wx.showLoading({ title: '支付中', mask: true });
    callCloud('biz', 'mockPay', { bookingId: this.data.pendingBookingId }, { loading: false })
      .then(r => {
        wx.hideLoading();
        this.setData({ showPay: false, paying: false });
        wx.showToast({ title: '预约成功', icon: 'success' });
        this.loadMyOrders();
        this.loadSessions(this.data.selectedVersion);
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ paying: false });
      });
  },

  // ── 我的门票 ──
  loadMyOrders() {
    callCloud('biz', 'myOrders', {}, { loading: false })
      .then(r => this.setData({ orders: r.list }))
      .catch(() => {});
  },

  statusText(status) {
    return { pending: '待支付', paid: '已支付', used: '已核销' }[status] || status;
  },

  // ── 待支付订单继续支付（取消支付后可重新拉起支付弹层） ──
  continuePay(e) {
    const id = e.currentTarget.dataset.id;
    const o = this.data.orders.find(x => x._id === id);
    if (!o || o.status !== 'pending') return;
    this.setData({
      pendingBookingId: id,
      showPay: true,
      paying: false,
      payAmount: o.amount,
      payDesc: `${o.versionName} · ${o.count} 人 · ${o.date} ${o.time}`
    });
  }
});
