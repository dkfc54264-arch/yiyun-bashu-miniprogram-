// pages/task/task.js —— 五大非遗关卡：阅读知识卡 + 答题过关 + 积分/线索联动
const GATES = require('../../data/gates');
const { callCloud } = require('../../utils/request');

Page({
  data: {
    totalProgress: 0,
    doneCount: 0,
    totalTask: 5,

    // 关卡列表（云端进度 + 本地内容合并）
    taskList: [],

    // 关卡详情弹层
    showGate: false,
    gate: null,          // 当前关卡（含 knowledge/quiz）
    gateStep: 'read',    // read 阅读知识 → quiz 答题 → result 结果
    quizAnswers: [null, null, null],
    quizResult: null     // {passed, right, msg}
  },

  onShow() {
    this.loadTasks();
  },

  // ── 加载我的关卡进度 ──
  loadTasks() {
    callCloud('biz', 'getMyTasks', {}, { loadingText: '加载进度' })
      .then(r => {
        const taskList = GATES.map(g => {
          const t = r.list.find(x => x.gateId === g.gateId) || {};
          return {
            gateId: g.gateId,
            glyph: g.glyph,
            name: g.name,
            desc: g.desc,
            category: g.category,
            reward: g.reward,
            color: g.color,
            status: t.status || 0,
            quizRight: t.quizRight || 0,
            clueUnlocked: !!t.clueUnlocked
          };
        });
        this.setData({
          taskList,
          doneCount: r.done,
          totalTask: r.total,
          totalProgress: r.progress
        });
      })
      .catch(() => {
        // 云端不可用（如云函数未部署）时用本地 GATES 静态数据兜底，保证关卡列表仍可查看
        const fallbackList = GATES.map(g => ({
          gateId: g.gateId,
          glyph: g.glyph,
          name: g.name,
          desc: g.desc,
          category: g.category,
          reward: g.reward,
          color: g.color,
          status: 0,
          quizRight: 0,
          clueUnlocked: false
        }));
        this.setData({ taskList: fallbackList });
      });
  },

  // ── 打开关卡详情 ──
  openGate(e) {
    const gateId = e.currentTarget.dataset.id;
    const gate = GATES.find(g => g.gateId === gateId);
    if (!gate) return;
    const task = this.data.taskList.find(t => t.gateId === gateId);
    this.setData({
      showGate: true,
      gate,
      gateStep: task && task.status === 1 ? 'result' : 'read',
      quizAnswers: [null, null, null],
      quizResult: task && task.status === 1
        ? { passed: true, right: task.quizRight || 3, msg: '该关卡已完成，再读一遍知识卡温故知新吧' }
        : null
    });
  },

  closeGate() {
    this.setData({ showGate: false, gate: null, gateStep: 'read' });
  },

  // ── 步骤切换 ──
  startQuiz() {
    this.setData({ gateStep: 'quiz' });
  },

  backToRead() {
    this.setData({ gateStep: 'read', quizAnswers: [null, null, null] });
  },

  // ── 答题 ──
  selectOption(e) {
    const { qindex, oindex } = e.currentTarget.dataset;
    const key = `quizAnswers[${qindex}]`;
    this.setData({ [key]: oindex });
  },

  submitQuiz() {
    const { gate, quizAnswers } = this.data;
    if (quizAnswers.some(a => a === null)) {
      wx.showToast({ title: '还有题目未作答', icon: 'none' });
      return;
    }
    callCloud('biz', 'submitQuiz', { gateId: gate.gateId, answers: quizAnswers }, { loadingText: '判分中' })
      .then(r => {
        this.setData({
          gateStep: 'result',
          quizResult: { passed: r.passed, right: r.right, reward: r.reward || 0, msg: r.msg, alreadyDone: !!r.alreadyDone }
        });
        if (r.passed && !r.alreadyDone) {
          // 同步积分与等级到全局（积分/等级/等级名一起更新，避免首页等级显示滞后）
          if (r.score) {
            const app = getApp();
            app.setUser({ score: r.score.score, level: r.score.level, levelName: r.score.levelName });
          }
          this.loadTasks();
        }
      })
      .catch(() => {});
  },

  noop() {}
});
