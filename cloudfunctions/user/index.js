// 云函数 user —— 用户体系：登录、信息、积分、会员等级、资料
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const usersCol = db.collection('users');

// 五级会员体系（项目书 5.5.1"非遗守护人"会员）
const LEVELS = [
  { level: 1, name: '普通会员', min: 0 },
  { level: 2, name: '青铜守护人', min: 500 },
  { level: 3, name: '白银守护人', min: 2000 },
  { level: 4, name: '黄金守护人', min: 5000 },
  { level: 5, name: '钻石守护人', min: 10000 }
];

function calcLevel(score) {
  let lv = LEVELS[0];
  for (const l of LEVELS) {
    if (score >= l.min) lv = l;
  }
  return lv;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const action = event.action;

  try {
    // ── 登录/注册（静默） ──
    if (action === 'login') {
      let res = await usersCol.where({ openid: OPENID }).get();
      let user;
      if (res.data.length === 0) {
        const now = Date.now();
        const add = await usersCol.add({
          data: {
            openid: OPENID,
            nickname: '研学旅人',
            avatar: '',
            score: 0,
            level: 1,
            levelName: '普通会员',
            createTime: now
          }
        });
        user = { _id: add._id, openid: OPENID, nickname: '研学旅人', avatar: '', score: 0, level: 1, levelName: '普通会员', createTime: now };
      } else {
        user = res.data[0];
      }
      return { ok: true, user };
    }

    // ── 获取用户信息 ──
    if (action === 'getInfo') {
      const res = await usersCol.where({ openid: OPENID }).get();
      if (res.data.length === 0) return { ok: false, msg: '用户不存在' };
      return { ok: true, user: res.data[0] };
    }

    // ── 积分变动（正负均可），自动升级会员 ──
    if (action === 'addScore') {
      const delta = Number(event.delta) || 0;
      const reason = event.reason || '';
      const res = await usersCol.where({ openid: OPENID }).get();
      if (res.data.length === 0) return { ok: false, msg: '用户不存在' };
      const user = res.data[0];
      const newScore = Math.max(0, (user.score || 0) + delta);
      const lv = calcLevel(newScore);
      const levelUp = lv.level > (user.level || 1);
      await usersCol.doc(user._id).update({
        data: { score: newScore, level: lv.level, levelName: lv.name }
      });
      return { ok: true, score: newScore, level: lv.level, levelName: lv.name, levelUp, reason };
    }

    // ── 更新资料（昵称/头像） ──
    if (action === 'updateProfile') {
      const data = {};
      if (event.nickname) data.nickname = event.nickname;
      if (event.avatar) data.avatar = event.avatar;
      const res = await usersCol.where({ openid: OPENID }).get();
      if (res.data.length === 0) return { ok: false, msg: '用户不存在' };
      await usersCol.doc(res.data[0]._id).update({ data });
      return { ok: true };
    }

    return { ok: false, msg: '未知 action: ' + action };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
};
