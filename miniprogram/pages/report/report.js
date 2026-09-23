// pages/report/report.js —— 研学报告
// 概览数据来自 biz/getReportOverview；报告生成后 biz/saveReport 落库；分享报告 +200 积分
const app = getApp();
const { callCloud } = require('../../utils/request');
const GATES = require('../../data/gates');

Page({
  data: {
    // 当前步骤: 'overview' | 'write' | 'preview'
    step: 'overview',

    // ─── 概览数据（biz/getReportOverview 聚合） ───
    overview: {
      theme: '《酉阳秘境·非遗守护人》剧本研学',
      date: '—',
      totalProgress: 0,
      tasksDone: 0,
      tasksTotal: 5,
      clues: 0,
      score: 0,
      rank: '—',
      scoreRank: '未上榜',
      level: '普通会员',
      bookingName: '暂未预约场次',
      bookingTime: '—'
    },

    // ─── 任务完成详情（五大关卡） ───
    taskDetails: GATES.map(g => ({ name: g.name, desc: g.category || '', done: false })),

    // ─── 报告写作区域 ───
    activeSection: 0,
    filledCount: 0,
    sections: [
      {
        key: 'summary',
        title: '研学概述',
        icon: '📋',
        hint: '简要介绍本次研学活动的主题、时间、地点和参与情况',
        content: '',
        placeholder: '例：本次我参加了艺韵巴蜀研学基地的《酉阳秘境·非遗守护人》剧本研学活动，基地位于重庆酉阳龚滩古镇118号台，我们跟随剧本主线解锁五大非遗关卡……'
      },
      {
        key: 'knowledge',
        title: '文化认知',
        icon: '📚',
        hint: '通过五大关卡学到了哪些酉阳非遗知识（西兰卡普、傩戏、苗银、摆手舞、土家美食等）',
        content: '',
        placeholder: '例：在"西兰卡普纹样密码"关卡，我了解到西兰卡普是土家织锦，与蜀锦、壮锦并称中国四大名锦，用"通经断纬"技法反面挑织，被誉为土家族的"无字史书"……'
      },
      {
        key: 'script',
        title: '剧本体验',
        icon: '📖',
        hint: '阅读《酉阳秘境·非遗守护人》剧本章节后的感受，包括收集到的守护线索',
        content: '',
        placeholder: '例：剧本以"守护酉阳非遗秘境"为主线，我扮演一名初入秘境的守护者学徒。每过一关就能解锁一条文化线索，当五条线索拼合在一起时，终于揭开了酉阳非遗的千年秘密……'
      },
      {
        key: 'digital',
        title: '数字展示',
        icon: '🎭',
        hint: '数字展示页三种体验的感受：IP人设3D形象、剪纸3D模型、非遗科普视频',
        content: '',
        placeholder: '例：在数字展示页面，我转动了"巴小艺"和"酉小趣"的3D人设卡片认识基地IP，360°欣赏了剪纸艺术精品，还观看了摆手舞科普视频。科技让非遗变得触手可及……'
      },
      {
        key: 'practice',
        title: '实践收获',
        icon: '✂️',
        hint: '动手实践环节的体验、遇到的困难和解决过程（织造拓印、面具绘制、打糍粑等）',
        content: '',
        placeholder: '例：在"苗银纹样拓印"关卡，我第一次尝试把蝴蝶妈妈图腾拓印在银片上，起初手劲掌握不好，纹样总是模糊，在导师指导下反复调整力道，终于拓出了清晰的纹样……'
      },
      {
        key: 'reflection',
        title: '总结反思',
        icon: '💭',
        hint: '对本次研学活动的整体评价、个人成长和对非遗传承的展望',
        content: '',
        placeholder: '例：本次酉阳非遗研学让我深刻体会到武陵山区民族文化的魅力。摆手舞、西兰卡普不只是"老手艺"，更是活着的民族史诗。作为新时代青少年，我们理应成为非遗的守护人与传播者……'
      }
    ],

    // ─── 预览与导出 ───
    reportGenerated: false,
    generatedReport: '',
    savedDrafts: []
  },

  /* ═══════════════════════ 生命周期 ═══════════════════════ */

  onLoad() {
    this.loadDrafts();
    this.loadOverview();
  },

  // 聚合概览 + 五大关卡完成详情
  loadOverview() {
    callCloud('biz', 'getReportOverview', {}, { loading: false })
      .then((r) => {
        const o = r.overview || {};
        const booking = o.booking || null;
        const rankNum = (o.scoreRank || '').replace(/[^0-9]/g, '');
        this.setData({
          overview: {
            theme: '《酉阳秘境·非遗守护人》剧本研学',
            date: booking ? booking.time.split(' ')[0] : this.formatDate(new Date()),
            totalProgress: o.progress || 0,
            tasksDone: o.tasksDone || 0,
            tasksTotal: o.tasksTotal || 5,
            clues: (o.clues || []).length,
            score: o.score || 0,
            rank: rankNum || '—',
            scoreRank: o.scoreRank || '未上榜',
            level: o.level || '普通会员',
            bookingName: booking ? booking.name : '暂未预约场次',
            bookingTime: booking ? booking.time : '—'
          }
        });
      })
      .catch(() => {});

    callCloud('biz', 'getMyTasks', {}, { loading: false })
      .then((r) => {
        const list = r.list || [];
        this.setData({
          taskDetails: GATES.map(g => ({
            name: g.name,
            desc: g.category || '',
            done: list.some(t => t.gateId === g.gateId && t.status === 1)
          }))
        });
      })
      .catch(() => {});
  },

  formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /* ═══════════════════════ 步骤切换 ═══════════════════════ */

  goToWrite() {
    this.setData({ step: 'write' });
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  goToOverview() {
    this.setData({ step: 'overview' });
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  /* ═══════════════════════ 概览操作 ═══════════════════════ */

  goToTask() {
    wx.navigateTo({
      url: '/pages/task/task'
    });
  },

  goToDigital() {
    wx.navigateTo({
      url: '/pages/ar/ar'
    });
  },

  /* ═══════════════════════ 写作表单 ═══════════════════════ */

  switchSection(e) {
    const index = e.currentTarget.dataset.index;
    if (index < 0 || index >= this.data.sections.length) return;
    this.setData({ activeSection: index });
  },

  onContentInput(e) {
    const index = e.currentTarget.dataset.index;
    const key = `sections[${index}].content`;
    this.setData({ [key]: e.detail.value });
    this.updateFilled();
  },

  // 更新已填写板块数（WXML 绑定 data.filledCount）
  updateFilled() {
    const count = this.data.sections.filter(s => s.content.trim().length >= 10).length;
    this.setData({ filledCount: count });
  },

  // 自动填充所有输入框（演示/快速填写）
  autoFill() {
    const fills = [
      '本次我参加了艺韵巴蜀研学基地的《酉阳秘境·非遗守护人》剧本研学活动。基地位于重庆酉阳龚滩古镇118号台，千年古镇就是我们的天然课堂。活动通过"解锁五大非遗关卡→收集文化线索→守护酉阳非遗秘境"的主线展开，内容包括知识阅读、关卡答题、动手实践和数字展馆参观。',
      '通过五大关卡，我系统了解了酉阳的非遗瑰宝：西兰卡普是土家织锦，与蜀锦、壮锦并称中国四大名锦，被誉为土家族的"无字史书"；傩戏戴着木雕面具表演，被称为"中国戏剧活化石"；苗银要经熔炼、锻打、拉丝、錾刻四道工序；摆手舞是国家级非遗，动作模仿薅草、纺棉花等农事劳作；还有"不喝油茶汤，心里就发慌"的土家美食文化。',
      '剧本《酉阳秘境·非遗守护人》把我带入了一个千年秘境：我收到一封神秘的守护者邀请函，化身守护者学徒，每通过一关就能解锁一条文化线索。当西兰卡普的纹样、傩戏面具的祝福、苗银的图腾、摆手舞的鼓点和美食的香气五条线索拼合在一起时，我终于读懂了酉阳非遗的密码，正式成为一名非遗守护人！',
      '数字展示页有三种打开非遗的方式：我转动了"巴小艺"数字人讲解员的3D卡片，转到背面还看到了她的自我介绍；360°旋转欣赏了"花开富贵""双蝶戏花"等剪纸精品的精细纹理；还观看了摆手舞科普视频，原来摆手舞的"单摆、双摆、回旋摆"都来自土家人的劳作生活。科技与文化的结合让非遗真正"活"了起来。',
      '实践环节我最难忘的是"苗银纹样拓印"：第一次把蝴蝶妈妈图腾拓印到银片上时手劲不够，纹样总是模糊，在导师指导下我学会了控制腕力，最终拓出了清晰的蝶纹。打糍粑时我们轮流抡木槌，糯米在石臼里渐渐变得绵软拉丝，亲身体验让我明白每一项非遗技艺背后都是数十年的坚守。',
      '本次酉阳非遗研学让我收获满满：五道关卡全部通过，收集齐了守护线索，还认识了一群志同道合的小伙伴。非遗不是躺在博物馆里的标本，而是可以触摸、可以体验、可以传承的生活方式。今后我会向身边更多人介绍酉阳非遗，也希望再次来到龚滩古镇，解锁深度沉浸版的更多剧情！'
    ];

    const sections = this.data.sections.map((s, i) => ({
      ...s,
      content: fills[i] || s.content
    }));
    this.setData({ sections });
    this.updateFilled();

    wx.showToast({ title: '已自动填充', icon: 'success' });
  },

  // 一键清空
  clearAll() {
    wx.showModal({
      title: '确认清空',
      content: '将清除所有已填写的内容，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const sections = this.data.sections.map(s => ({ ...s, content: '' }));
          this.setData({ sections, filledCount: 0, reportGenerated: false, generatedReport: '' });
          wx.showToast({ title: '已清空', icon: 'none' });
        }
      }
    });
  },

  /* ═══════════════════════ 生成报告 ═══════════════════════ */

  generateReport() {
    const filled = this.data.sections.filter(s => s.content.trim().length >= 10).length;
    if (filled < 3) {
      wx.showToast({
        title: `请至少填写 3 个板块（当前 ${filled}/6）`,
        icon: 'none'
      });
      return;
    }

    const { overview, sections } = this.data;
    const dateStr = this.formatDate(new Date());

    // 构建完整报告文本
    let report = '';
    report += `══════════════════════════\n`;
    report += `  酉阳非遗剧本研学报告\n`;
    report += `══════════════════════════\n\n`;
    report += `📌 基本信息\n`;
    report += `  研学主题：${overview.theme}\n`;
    report += `  活动日期：${overview.date}\n`;
    report += `  预约场次：${overview.bookingName}\n`;
    report += `  报告日期：${dateStr}\n\n`;
    report += `📊 学习数据\n`;
    report += `  完成进度：${overview.totalProgress}%\n`;
    report += `  完成任务：${overview.tasksDone}/${overview.tasksTotal}\n`;
    report += `  守护线索：${overview.clues} 条\n`;
    report += `  当前积分：${overview.score} 分（${overview.scoreRank}）\n`;
    report += `  守护等级：${overview.level}\n\n`;
    report += `──────────────────────────\n\n`;

    sections.forEach((s) => {
      if (s.content.trim()) {
        report += `${s.icon} ${s.title}\n`;
        report += `${'─'.repeat(20)}\n`;
        report += `${s.content.trim()}\n\n`;
      }
    });

    report += `══════════════════════════\n`;
    report += `  报告生成于 ${dateStr}\n`;
    report += `  艺韵巴蜀沉浸式数字研学基地\n`;
    report += `══════════════════════════\n`;

    this.setData({
      generatedReport: report,
      reportGenerated: true,
      step: 'preview'
    });

    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
    wx.showToast({ title: '报告生成成功', icon: 'success' });

    // 报告落库（fire-and-forget，失败不阻断演示）
    callCloud('biz', 'saveReport', {
      content: report,
      overview: {
        theme: overview.theme,
        tasksDone: overview.tasksDone,
        clues: overview.clues,
        score: overview.score,
        level: overview.level,
        progress: overview.totalProgress
      }
    }, { loading: false }).catch(() => {});
  },

  /* ═══════════════════════ 预览 ═══════════════════════ */

  backToWrite() {
    this.setData({ step: 'write' });
  },

  /* ═══════════════════════ 导出操作 ═══════════════════════ */

  copyReport() {
    wx.setClipboardData({
      data: this.data.generatedReport,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  saveDraft() {
    const { sections } = this.data;
    const hasContent = sections.some(s => s.content.trim().length > 0);
    if (!hasContent) {
      wx.showToast({ title: '暂无内容可保存', icon: 'none' });
      return;
    }

    const drafts = wx.getStorageSync('report_drafts') || [];
    const draft = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      sections: sections.map(s => ({ key: s.key, title: s.title, content: s.content })),
      preview: sections.find(s => s.content.trim())?.content.trim().substring(0, 60) + '……'
    };

    // 最多保存 5 份草稿
    if (drafts.length >= 5) drafts.shift();
    drafts.push(draft);
    wx.setStorageSync('report_drafts', drafts);

    this.setData({ savedDrafts: drafts });
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  loadDrafts() {
    const drafts = wx.getStorageSync('report_drafts') || [];
    this.setData({ savedDrafts: drafts });
  },

  loadDraft(e) {
    const id = e.currentTarget.dataset.id;
    const draft = this.data.savedDrafts.find(d => d.id === id);
    if (!draft) return;

    wx.showModal({
      title: '加载草稿',
      content: `加载 ${draft.date} 的草稿？当前未保存内容将丢失。`,
      success: (res) => {
        if (res.confirm) {
          const sections = this.data.sections.map(s => {
            const match = draft.sections.find(ds => ds.key === s.key);
            return match ? { ...s, content: match.content } : s;
          });
          this.setData({ sections, step: 'write' });
          this.updateFilled();
          wx.showToast({ title: '草稿已加载', icon: 'success' });
        }
      }
    });
  },

  deleteDraft(e) {
    const id = e.currentTarget.dataset.id;
    let drafts = wx.getStorageSync('report_drafts') || [];
    drafts = drafts.filter(d => d.id !== id);
    wx.setStorageSync('report_drafts', drafts);
    this.setData({ savedDrafts: drafts });
    wx.showToast({ title: '草稿已删除', icon: 'none' });
  },

  /* ═══════════════════════ 分享（+200 积分） ═══════════════════════ */

  onShareAppMessage() {
    // 分享研学报告奖励 200 积分（每次进入页面仅奖励一次，防刷）
    if (!this._shareRewarded) {
      this._shareRewarded = true;
      callCloud('user', 'addScore', { delta: 200, reason: '分享研学报告' }, { loading: false })
        .then((r) => {
          app.setUser({ score: r.score, level: r.level, levelName: r.levelName });
          wx.showToast({ title: '分享成功 +200积分', icon: 'none' });
          // 刷新概览积分显示
          this.setData({
            'overview.score': r.score,
            'overview.level': r.levelName
          });
        })
        .catch(() => {});
    }
    return {
      title: '我在艺韵巴蜀解锁了酉阳非遗守护线索，快来挑战！',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
