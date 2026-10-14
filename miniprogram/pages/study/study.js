// pages/study/study.js —— 研学聚合页：关卡任务 + 电子剧本（一个 tab 内双段切换）
const app = getApp();
const GATES = require('../../data/gates');
const SCRIPTS = require('../../data/scripts');
const { callCloud } = require('../../utils/request');

Page({
  data: {
    studyTab: 'task',   // task 关卡任务 | script 电子剧本

    /* ── 任务侧 ── */
    totalProgress: 0,
    doneCount: 0,
    totalTask: 5,
    taskList: [],
    showGate: false,
    gate: null,
    gateStep: 'read',
    quizAnswers: [null, null, null],
    quizResult: null,

    /* ── 剧本侧 ── */
    versions: [],
    currentVersion: 'advance',
    script: null,
    chapters: [],
    currentChapter: 0,
    clues: [],
    cluesDone: 0,
    showClues: false
  },

  onLoad() {
    const versions = Object.keys(SCRIPTS).map(id => ({
      id,
      name: SCRIPTS[id].name,
      difficultyText: SCRIPTS[id].difficultyText
    }));
    this.setData({ versions });
    this.applyVersion('advance');
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    // 首页清单"电子剧本/关卡任务"入口可预选段落
    if (app.globalData.studySegment) {
      this.setData({ studyTab: app.globalData.studySegment });
      app.globalData.studySegment = '';
    }
    this.loadTasks();
    this.loadClues();
  },

  switchStudyTab(e) {
    this.setData({ studyTab: e.currentTarget.dataset.tab });
  },

  // 左上角返回键：回首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  /* ═══════════════════════ 任务侧 ═══════════════════════ */

  loadTasks() {
    callCloud('biz', 'getMyTasks', {}, { loading: false })
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
        this.setData({ taskList, doneCount: r.done, totalTask: r.total, totalProgress: r.progress });
      })
      .catch(() => {
        const fallbackList = GATES.map(g => ({
          gateId: g.gateId, glyph: g.glyph, name: g.name, desc: g.desc, category: g.category,
          reward: g.reward, color: g.color, status: 0, quizRight: 0, clueUnlocked: false
        }));
        this.setData({ taskList: fallbackList });
      });
  },

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

  startQuiz() {
    this.setData({ gateStep: 'quiz' });
  },

  backToRead() {
    this.setData({ gateStep: 'read', quizAnswers: [null, null, null] });
  },

  selectOption(e) {
    const { qindex, oindex } = e.currentTarget.dataset;
    this.setData({ [`quizAnswers[${qindex}]`]: oindex });
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
          if (r.score) {
            app.setUser({ score: r.score.score, level: r.score.level, levelName: r.score.levelName });
          }
          this.loadTasks();
          this.loadClues();
        }
      })
      .catch(() => {});
  },

  /* ═══════════════════════ 剧本侧 ═══════════════════════ */

  switchVersion(e) {
    this.applyVersion(e.currentTarget.dataset.id);
  },

  applyVersion(id) {
    const script = SCRIPTS[id];
    this.setData({ currentVersion: id, script, chapters: script.chapters, currentChapter: 0 });
  },

  loadClues() {
    callCloud('biz', 'getMyTasks', {}, { loading: false })
      .then(r => {
        const clues = GATES.map(g => {
          const t = r.list.find(x => x.gateId === g.gateId);
          return { gateId: g.gateId, name: g.name, clue: g.clue, unlocked: !!(t && t.clueUnlocked) };
        });
        this.setData({ clues, cluesDone: clues.filter(c => c.unlocked).length, showClues: true });
      })
      .catch(() => {});
  },

  toggleClues() {
    this.setData({ showClues: !this.data.showClues });
  },

  // 剧本线索卡 → 切到任务段
  goTaskFromScript() {
    this.setData({ studyTab: 'task' });
  },

  prevChapter() {
    const { currentChapter } = this.data;
    if (currentChapter <= 0) {
      wx.showToast({ title: '已经是第一章啦', icon: 'none' });
      return;
    }
    this.setData({ currentChapter: currentChapter - 1 });
  },

  nextChapter() {
    const { currentChapter, chapters } = this.data;
    if (currentChapter >= chapters.length - 1) {
      wx.showToast({ title: '已经是最后一章啦', icon: 'none' });
      return;
    }
    this.setData({ currentChapter: currentChapter + 1 });
  },

  noop() {},

  onShareAppMessage() {
    return {
      title: '艺韵巴蜀 · 《酉阳秘境·非遗守护人》沉浸式非遗研学剧本',
      path: '/pages/index/index'
    };
  }
});
