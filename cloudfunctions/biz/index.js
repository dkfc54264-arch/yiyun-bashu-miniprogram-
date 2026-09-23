// 云函数 biz —— 统一业务入口：场次/订单/关卡任务/报告/排行/商城
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const usersCol = db.collection('users');
const sessionsCol = db.collection('sessions');
const bookingsCol = db.collection('bookings');
const userTasksCol = db.collection('user_tasks');
const reportsCol = db.collection('reports');
const productsCol = db.collection('products');

// 五大关卡答题标准答案（与前端 data/gates.js 题目对应，防作弊判分在后端）
const QUIZ_ANSWERS = {
  1: [0, 0, 1], // 西兰卡普
  2: [0, 1, 0], // 傩戏面具
  3: [1, 2, 0], // 苗银锻造
  4: [1, 0, 0], // 摆手舞
  5: [1, 1, 0]  // 土家美食
};
const GATE_NAMES = {
  1: '西兰卡普纹样密码',
  2: '傩戏面具绘制与祈福',
  3: '苗银纹样拓印与制作',
  4: '土家族摆手舞',
  5: '土家特色美食'
};
const GATE_REWARD = 100; // 每关奖励积分

// 三版本剧本信息（id 对应 sessions.scriptVersion）
const VERSIONS = {
  kids: { name: '亲子启蒙版', price: 129 },
  advance: { name: '研学进阶版', price: 199 },
  deep: { name: '深度沉浸版', price: 259 }
};

// 生成 6 位核销码
function makeCheckCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += Math.floor(Math.random() * 10);
  return s;
}

async function addScore(openid, delta) {
  const res = await usersCol.where({ openid }).get();
  if (res.data.length === 0) return null;
  const user = res.data[0];
  const newScore = Math.max(0, (user.score || 0) + delta);
  const LEVELS = [[1, 0], [2, 500], [3, 2000], [4, 5000], [5, 10000]];
  let lv = 1, lvName = '普通会员';
  for (const [l, min] of LEVELS) {
    if (newScore >= min) { lv = l; lvName = ['普通会员', '青铜守护人', '白银守护人', '黄金守护人', '钻石守护人'][l - 1]; }
  }
  await usersCol.doc(user._id).update({ data: { score: newScore, level: lv, levelName: lvName } });
  return { score: newScore, level: lv, levelName: lvName };
}

// 预约成功后初始化五大关卡任务
async function initUserTasks(openid) {
  const exist = await userTasksCol.where({ openid }).get();
  if (exist.data.length >= 5) return;
  const batch = [];
  for (let gateId = 1; gateId <= 5; gateId++) {
    if (!exist.data.find(t => t.gateId === gateId)) {
      batch.push(userTasksCol.add({
        data: { openid, gateId, status: 0, score: 0, clueUnlocked: false, quizRight: 0, updateTime: Date.now() }
      }));
    }
  }
  await Promise.all(batch);
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const action = event.action;

  try {
    // ═══════════ 预约购票 ═══════════

    // 场次列表（可按剧本版本筛选）
    if (action === 'getSessions') {
      let query = {};
      if (event.scriptVersion) query.scriptVersion = event.scriptVersion;
      const res = await sessionsCol.where(query).orderBy('date', 'asc').orderBy('time', 'asc').get();
      const list = res.data.map(s => ({
        ...s,
        remaining: Math.max(0, s.capacity - s.booked),
        versionName: (VERSIONS[s.scriptVersion] || {}).name || s.scriptVersion
      }));
      return { ok: true, list };
    }

    // 创建订单（校验余位）
    if (action === 'createOrder') {
      const { sessionId, name, phone, count } = event;
      const num = Math.max(1, Math.min(10, Number(count) || 1));
      if (!name || !phone || !sessionId) return { ok: false, msg: '参数不完整' };
      const sres = await sessionsCol.doc(sessionId).get();
      const session = sres.data;
      if (!session) return { ok: false, msg: '场次不存在' };
      if (session.capacity - session.booked < num) return { ok: false, msg: '该场次余位不足' };
      const v = VERSIONS[session.scriptVersion] || { name: session.scriptVersion, price: 199 };
      const amount = v.price * num;
      const add = await bookingsCol.add({
        data: {
          openid: OPENID, sessionId, scriptVersion: session.scriptVersion,
          versionName: v.name, date: session.date, time: session.time,
          name, phone, count: num, amount, price: v.price,
          status: 'pending', checkCode: makeCheckCode(), createTime: Date.now()
        }
      });
      return { ok: true, bookingId: add._id, amount, versionName: v.name };
    }

    // 模拟支付（演示版；正式版替换为 wx.requestPayment 回调）
    if (action === 'mockPay') {
      const bres = await bookingsCol.doc(event.bookingId).get();
      const b = bres.data;
      if (!b) return { ok: false, msg: '订单不存在' };
      if (b.status !== 'pending') return { ok: false, msg: '订单状态异常' };
      await bookingsCol.doc(event.bookingId).update({ data: { status: 'paid', payTime: Date.now() } });
      // 占座
      await sessionsCol.doc(b.sessionId).update({ data: { booked: _.inc(b.count) } });
      // 初始化五大关卡任务
      await initUserTasks(OPENID);
      return { ok: true, checkCode: b.checkCode };
    }

    // 我的门票/订单
    if (action === 'myOrders') {
      const res = await bookingsCol.where({ openid: OPENID }).orderBy('createTime', 'desc').get();
      return { ok: true, list: res.data };
    }

    // ═══════════ 五大关卡任务 ═══════════

    // 我的关卡进度
    if (action === 'getMyTasks') {
      const res = await userTasksCol.where({ openid: OPENID }).get();
      let list = res.data.sort((a, b) => a.gateId - b.gateId);
      // 无任务数据时先初始化（允许未购票体验答题，演示友好）
      if (list.length === 0) {
        await initUserTasks(OPENID);
        const res2 = await userTasksCol.where({ openid: OPENID }).get();
        list = res2.data.sort((a, b) => a.gateId - b.gateId);
      }
      const done = list.filter(t => t.status === 1).length;
      return { ok: true, list, done, total: 5, progress: Math.round(done / 5 * 100) };
    }

    // 提交关卡答题（answers: 长度3的选项下标数组）
    if (action === 'submitQuiz') {
      const gateId = Number(event.gateId);
      const answers = event.answers || [];
      const key = QUIZ_ANSWERS[gateId];
      if (!key) return { ok: false, msg: '关卡不存在' };
      let right = 0;
      key.forEach((ans, i) => { if (answers[i] === ans) right++; });

      const tres = await userTasksCol.where({ openid: OPENID, gateId }).get();
      if (tres.data.length === 0) return { ok: false, msg: '任务未初始化' };
      const task = tres.data[0];
      if (task.status === 1) return { ok: true, passed: true, right, alreadyDone: true, msg: '该关卡已完成' };

      if (right < 2) {
        await userTasksCol.doc(task._id).update({ data: { quizRight: right, updateTime: Date.now() } });
        return { ok: true, passed: false, right, msg: `答对 ${right}/3 题，需答对 2 题过关` };
      }
      await userTasksCol.doc(task._id).update({
        data: { status: 1, quizRight: right, clueUnlocked: true, score: GATE_REWARD, updateTime: Date.now() }
      });
      const scoreRes = await addScore(OPENID, GATE_REWARD);
      return { ok: true, passed: true, right, reward: GATE_REWARD, gateName: GATE_NAMES[gateId], score: scoreRes };
    }

    // ═══════════ 研学报告 ═══════════

    if (action === 'saveReport') {
      const now = Date.now();
      const add = await reportsCol.add({
        data: { openid: OPENID, date: now, content: event.content || '', overview: event.overview || {} }
      });
      return { ok: true, reportId: add._id };
    }

    // 报告概览数据聚合
    if (action === 'getReportOverview') {
      const [tasks, orders, user] = await Promise.all([
        userTasksCol.where({ openid: OPENID }).get(),
        bookingsCol.where({ openid: OPENID, status: _.in(['paid', 'used']) }).orderBy('createTime', 'desc').get(),
        usersCol.where({ openid: OPENID }).get()
      ]);
      const doneTasks = tasks.data.filter(t => t.status === 1);
      const u = user.data[0] || {};
      const score = u.score || 0;
      // 我的排名
      const higher = await usersCol.where({ score: _.gt(score) }).count();
      return {
        ok: true,
        overview: {
          tasksDone: doneTasks.length,
          tasksTotal: 5,
          progress: Math.round(doneTasks.length / 5 * 100),
          score,
          scoreRank: `第 ${higher.total + 1} 名`,
          level: u.levelName || '普通会员',
          booking: orders.data[0] ? { name: orders.data[0].versionName + '研学专场', time: orders.data[0].date + ' ' + orders.data[0].time } : null,
          clues: doneTasks.map(t => t.gateId)
        }
      };
    }

    // ═══════════ 排行榜 ═══════════

    if (action === 'getRank') {
      const top = await usersCol.orderBy('score', 'desc').limit(50).get();
      const me = await usersCol.where({ openid: OPENID }).get();
      const myScore = me.data[0] ? me.data[0].score : 0;
      const higher = await usersCol.where({ score: _.gt(myScore) }).count();
      return { ok: true, list: top.data, myRank: higher.total + 1 };
    }

    // ═══════════ 文创商城 ═══════════

    if (action === 'getProducts') {
      const res = await productsCol.get();
      return { ok: true, list: res.data };
    }

    // 兑换/购买（mode: points 积分兑换 | cash 模拟现金购买）
    if (action === 'exchangeProduct') {
      const pres = await productsCol.doc(event.productId).get();
      const p = pres.data;
      if (!p) return { ok: false, msg: '商品不存在' };
      if (p.stock <= 0) return { ok: false, msg: '库存不足' };
      const ures = await usersCol.where({ openid: OPENID }).get();
      if (ures.data.length === 0) return { ok: false, msg: '用户不存在' };
      const user = ures.data[0];
      if (event.mode === 'points' && user.score < p.points) return { ok: false, msg: '积分不足' };
      await productsCol.doc(event.productId).update({ data: { stock: _.inc(-1) } });
      if (event.mode === 'points') {
        const r = await addScore(OPENID, -p.points);
        return { ok: true, msg: '兑换成功', score: r.score };
      }
      return { ok: true, msg: '下单成功（演示版模拟支付）' };
    }

    return { ok: false, msg: '未知 action: ' + action };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
};
