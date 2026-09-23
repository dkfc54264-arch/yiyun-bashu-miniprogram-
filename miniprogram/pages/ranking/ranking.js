// pages/ranking/ranking.js —— 积分排行榜
// 数据源：biz/getRank（users 集合）；真实用户不足 5 人时合并演示数据，保证演示效果
const app = getApp();
const { callCloud } = require('../../utils/request');

// 五级守护人等级配色（与项目书 5.5.1 会员体系对应）
const LEVEL_COLORS = {
  '普通会员': '#b2bec3',
  '青铜守护人': '#cd7f32',
  '白银守护人': '#8fa4b0',
  '黄金守护人': '#f39c12',
  '钻石守护人': '#3498db'
};

const AVATAR_COLORS = ['#e74c3c', '#e67e22', '#f39c12', '#9b59b6', '#1abc9c', '#2ecc71', '#3498db', '#e91e63', '#00bcd4', '#ff5722', '#795548', '#607d8b', '#c0392b', '#16a085', '#d35400'];

// 演示种子数据（等级按积分阈值：钻石10000+/黄金5000+/白银2000+/青铜500+）
const DEMO_USERS = [
  { id: 'd1',  name: '陈思远', score: 10240, level: '钻石守护人', change: 0 },
  { id: 'd2',  name: '林雨桐', score: 5320,  level: '黄金守护人', change: 5 },
  { id: 'd3',  name: '王梓涵', score: 5150,  level: '黄金守护人', change: -2 },
  { id: 'd4',  name: '张一辰', score: 5010,  level: '黄金守护人', change: 8 },
  { id: 'd5',  name: '赵雪莹', score: 3480,  level: '白银守护人', change: 15 },
  { id: 'd6',  name: '刘浩然', score: 3150,  level: '白银守护人', change: -3 },
  { id: 'd7',  name: '周若曦', score: 2870,  level: '白银守护人', change: 0 },
  { id: 'd8',  name: '吴俊杰', score: 2340,  level: '白银守护人', change: 22 },
  { id: 'd9',  name: '郑雅文', score: 1980,  level: '青铜守护人', change: -7 },
  { id: 'd10', name: '孙明哲', score: 1750,  level: '青铜守护人', change: 3 },
  { id: 'd11', name: '黄诗琪', score: 1560,  level: '青铜守护人', change: 10 },
  { id: 'd12', name: '马天宇', score: 1320,  level: '青铜守护人', change: -5 },
  { id: 'd13', name: '朱晓萌', score: 980,   level: '青铜守护人', change: 18 },
  { id: 'd14', name: '胡嘉乐', score: 720,   level: '青铜守护人', change: -11 },
  { id: 'd15', name: '何雨晴', score: 460,   level: '普通会员',   change: 6 },
  { id: 'd16', name: '罗志远', score: 435,   level: '普通会员',   change: 0 },
  { id: 'd17', name: '杨若兰', score: 392,   level: '普通会员',   change: 14 },
  { id: 'd18', name: '丁一鸣', score: 346,   level: '普通会员',   change: -8 },
  { id: 'd19', name: '宋欣怡', score: 280,   level: '普通会员',   change: 3 },
  { id: 'd20', name: '沈博文', score: 210,   level: '普通会员',   change: -2 }
];

Page({
  data: {
    myInfo: {
      id: 'me',
      name: '我',
      avatar: '我',
      avatarBg: '#1A4735',
      score: 0,
      level: '普通会员',
      levelColor: '#b2bec3',
      change: 0,
      rank: '-'
    },
    rankList: []
  },

  onLoad() {
    this.loadRank(true);
  },

  onShow() {
    // 从答题/报告页返回后静默刷新积分
    if (this._loaded) this.loadRank(false);
  },

  loadRank(withLoading) {
    callCloud('biz', 'getRank', {}, { loading: withLoading })
      .then((r) => {
        const meOpenid = (app.globalData.userInfo || {}).openid;
        const list = (r.list || []).map((u, i) => ({
          id: u._id || 'u' + i,
          name: u.nickname || '研学旅人',
          avatar: (u.nickname || '旅').substring(0, 1),
          avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
          score: u.score || 0,
          level: u.levelName || '普通会员',
          levelColor: LEVEL_COLORS[u.levelName] || '#b2bec3',
          change: 0,
          isMe: u.openid === meOpenid
        }));
        if (list.length < 5) {
          // 真实用户太少 → 合并演示数据
          this.renderList([...list, ...this.demoList()], 0);
        } else {
          this.renderList(list, r.myRank || 0);
        }
        this._loaded = true;
      })
      .catch(() => {
        // 云端不可用 → 本地积分 + 演示数据兜底
        this.renderList([...this.demoList(), this.meFromLocal()], 0);
        this._loaded = true;
      });
  },

  demoList() {
    return DEMO_USERS.map((u, i) => ({
      ...u,
      avatar: u.name.substring(0, 1),
      avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
      levelColor: LEVEL_COLORS[u.level] || '#b2bec3',
      isMe: false
    }));
  },

  // 云端异常时用本地缓存的用户信息构造"我"
  meFromLocal() {
    const u = app.globalData.userInfo || {};
    const level = u.levelName || '普通会员';
    return {
      id: 'me',
      name: u.nickname || '我',
      avatar: '我',
      avatarBg: '#1A4735',
      score: u.score || 0,
      level,
      levelColor: LEVEL_COLORS[level] || '#b2bec3',
      change: 0,
      isMe: true
    };
  },

  renderList(users, serverMyRank) {
    const sorted = [...users].sort((a, b) => b.score - a.score).map((u, i) => ({
      ...u,
      rank: i + 1
    }));
    const me = sorted.find(u => u.isMe);
    let myInfo = this.data.myInfo;
    if (me) {
      myInfo = {
        ...me,
        name: '我',
        avatar: '我',
        avatarBg: '#1A4735',
        // 演示合并模式下用列表内排名；真实模式用云函数全站排名
        rank: serverMyRank || me.rank
      };
    }
    this.setData({ rankList: sorted, myInfo });
  }
});
