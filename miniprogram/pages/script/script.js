// pages/script/script.js —— 电子剧本：三版本切换 + 章节阅读 + 线索收集进度
const SCRIPTS = require('../../data/scripts');
const GATES = require('../../data/gates');
const { callCloud } = require('../../utils/request');

Page({
  data: {
    versions: [],
    currentVersion: 'advance',
    script: null,
    chapters: [],
    currentChapter: 0, // 当前展示的章节索引

    // 线索收集进度（五大关卡）
    clues: [],      // [{gateId, name, unlocked, clue}]
    cluesDone: 0,
    showClues: false
  },

  onLoad(options) {
    const versions = Object.keys(SCRIPTS).map(id => ({
      id,
      name: SCRIPTS[id].name,
      difficultyText: SCRIPTS[id].difficultyText
    }));
    this.setData({ versions });
    // 支持 booking 页带版本跳转
    const v = SCRIPTS[options.version] ? options.version : 'advance';
    this.applyVersion(v);
  },

  onShow() {
    // 首次进入及从任务页返回后都刷新线索解锁进度
    this.loadClues();
  },

  // ── 版本切换 ──
  switchVersion(e) {
    this.applyVersion(e.currentTarget.dataset.id);
  },

  applyVersion(id) {
    const script = SCRIPTS[id];
    this.setData({
      currentVersion: id,
      script,
      chapters: script.chapters,
      currentChapter: 0
    });
  },

  // ── 线索收集进度 ──
  loadClues() {
    callCloud('biz', 'getMyTasks', {}, { loading: false })
      .then(r => {
        const clues = GATES.map(g => {
          const t = r.list.find(x => x.gateId === g.gateId);
          return { gateId: g.gateId, name: g.name, clue: g.clue, unlocked: !!(t && t.clueUnlocked) };
        });
        this.setData({
          clues,
          cluesDone: clues.filter(c => c.unlocked).length,
          showClues: true
        });
      })
      .catch(() => {});
  },

  toggleClues() {
    this.setData({ showClues: !this.data.showClues });
  },

  goToTask() {
    wx.navigateTo({ url: '/pages/task/task' });
  },

  // ── 章节切换 ──
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

  onShareAppMessage() {
    return { title: '《酉阳秘境·非遗守护人》— 沉浸式非遗研学剧本', path: '/pages/script/script' };
  }
});
