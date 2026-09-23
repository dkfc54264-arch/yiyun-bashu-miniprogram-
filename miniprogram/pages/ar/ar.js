// pages/ar/ar.js —— 数字展示：IP 人设 3D / 剪纸 3D / 非遗科普视频（三种形式展示项目非遗）
const VIDEOS = require('../../data/videos');

Page({
  data: {
    // 三段切换：ip 人设 / paper 剪纸 / video 科普视频
    activeTab: 'ip',

    // ═══ IP 人设 3D 展示 ═══
    ipCharacters: [
      {
        id: 'baxiaoyi',
        name: '巴小艺',
        glyph: '巴',
        role: '非遗数字人讲解员',
        slogan: '让非遗开口说话',
        color: '#1A4735',
        gradient: 'linear-gradient(135deg, #1A4735 0%, #14352A 100%)',
        desc: '艺韵巴蜀的AI数字人讲解员，扎根酉阳非遗知识库，24小时在线为你讲解西兰卡普、傩戏、苗银、摆手舞与土家美食背后的故事。'
      },
      {
        id: 'youxiaoqu',
        name: '酉小趣',
        glyph: '酉',
        role: '品牌吉祥物',
        slogan: '酉见非遗，趣玩传承',
        color: '#C9A227',
        gradient: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
        desc: '来自桃花源的小画眉，衔来非遗秘境的邀请函，陪你解锁五大关卡、收集文化线索，是守护人路上最活泼的伙伴。'
      }
    ],
    currentIp: 0,

    // ═══ 3D 旋转状态（IP 卡片与剪纸模型共用） ═══
    rotateX: -15,
    rotateY: 25,
    touching: false,
    touchStartX: 0,
    touchStartY: 0,
    startRotateX: 0,
    startRotateY: 0,
    momentum: false,
    velocityX: 0,
    velocityY: 0,
    isAutoRotate: true,
    autoRotateTimer: null,

    // ═══ 剪纸 3D 展示 ═══
    currentModel: 0,
    models: [
      { id: 'papercut1', name: '花开富贵', type: '剪纸窗花' },
      { id: 'papercut2', name: '双蝶戏花', type: '剪纸窗花' },
      { id: 'papercut3', name: '连年有余', type: '剪纸窗花' }
    ],
    exhibitInfo: null,
    exhibits: [
      {
        id: 'papercut',
        name: '非遗剪纸',
        category: '传统美术',
        description: '剪纸是中国传统民间艺术之一，通过剪刀或刻刀在纸上剪刻出各种图案，常用于节日装饰和民俗活动。基地以剪纸为载体，让游客在立体展示中感受传统纹样之美。',
        history: '剪纸艺术起源于汉代，至今已有两千多年的历史。它以其独特的艺术形式和深厚的文化内涵，成为中华民族文化遗产的重要组成部分。',
        technique: '剪纸技法包括阳刻、阴刻、阴阳刻结合等多种方式，讲究线条流畅、构图精美。'
      },
      {
        id: 'paper',
        name: '古法造纸',
        category: '传统技艺',
        description: '古法造纸是中国古代四大发明之一，采用天然植物纤维为原料，经过多道工序手工制作。',
        history: '造纸术发明于东汉时期，由蔡伦改进。古法造纸工艺复杂，需经过浸泡、蒸煮、打浆、抄纸、晾晒等数十道工序。',
        technique: '传统造纸主要使用竹、麻、树皮等原料，采用石灰水浸泡、日光漂白等天然方法处理。'
      },
      {
        id: 'shadow',
        name: '皮影戏',
        category: '传统戏剧',
        description: '皮影戏是一种以兽皮或纸板做成的人物剪影表演故事的民间戏剧形式。',
        history: '皮影戏起源于西汉，兴盛于唐代，至今仍在许多地区流传，是世界非物质文化遗产之一。',
        technique: '皮影制作需要经过选皮、制皮、画稿、雕刻、着色等工序，表演时通过灯光投影在幕布上。'
      }
    ],

    // ═══ 非遗科普视频 ═══
    videos: VIDEOS,
    currentVideo: 0
  },

  onLoad() {
    this.setData({ exhibitInfo: this.data.exhibits[0] });
    this.startAutoRotate();
  },

  onShow() {
    if (!this.data.autoRotateTimer) {
      this.startAutoRotate();
    }
  },

  onHide() {
    this.stopAutoRotate();
  },

  onUnload() {
    this.stopAutoRotate();
  },

  // ─── 三段切换 ───
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
    wx.vibrateShort({ type: 'light' });
  },

  // ─── IP 人设切换 ───
  selectIp(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentIp: index,
      rotateY: this.data.rotateY + 360 // 切换旋转特效
    });
    wx.vibrateShort({ type: 'light' });
  },

  // ─── 视频切换 ───
  selectVideo(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentVideo: index });
  },

  onVideoError() {
    wx.showToast({ title: '视频加载失败，请检查网络', icon: 'none' });
  },

  // ══════════════ 3D 旋转（触摸/惯性/自转） ══════════════

  onTouchStart(e) {
    const touch = e.touches[0];
    this.stopAutoRotate();
    this.setData({
      touching: true,
      momentum: false,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      startRotateX: this.data.rotateX,
      startRotateY: this.data.rotateY,
      isAutoRotate: false
    });
  },

  onTouchMove(e) {
    if (!this.data.touching) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.data.touchStartX;
    const deltaY = touch.clientY - this.data.touchStartY;
    const sensitivity = 0.4;
    const newRotateY = this.data.startRotateY + deltaX * sensitivity;
    const newRotateX = this.data.startRotateX - deltaY * sensitivity;
    const clampedX = Math.max(-60, Math.min(60, newRotateX));
    this.setData({
      rotateY: newRotateY,
      rotateX: clampedX,
      velocityX: deltaX,
      velocityY: deltaY
    });
  },

  onTouchEnd() {
    if (!this.data.touching) return;
    const absVX = Math.abs(this.data.velocityX);
    const absVY = Math.abs(this.data.velocityY);
    this.setData({ touching: false });
    if (absVX > 10 || absVY > 10) {
      this.applyMomentum();
    } else {
      this.scheduleAutoRotate();
    }
  },

  applyMomentum() {
    let vx = this.data.velocityX * 0.15;
    let vy = this.data.velocityY * 0.15;
    const friction = 0.92;
    const threshold = 0.1;

    const step = () => {
      if (Math.abs(vx) < threshold && Math.abs(vy) < threshold) {
        this.setData({ momentum: false });
        this.scheduleAutoRotate();
        return;
      }
      vx *= friction;
      vy *= friction;
      let newX = this.data.rotateX - vy * 0.3;
      const newY = this.data.rotateY + vx * 0.3;
      newX = Math.max(-60, Math.min(60, newX));
      this.setData({ rotateX: newX, rotateY: newY, momentum: true });
      setTimeout(step, 16);
    };

    this.setData({ momentum: true });
    step();
  },

  startAutoRotate() {
    this.stopAutoRotate();
    this.setData({ isAutoRotate: true });
    this.data.autoRotateTimer = setInterval(() => {
      if (this.data.touching) return;
      this.setData({ rotateY: this.data.rotateY + 0.3 });
    }, 16);
  },

  stopAutoRotate() {
    if (this.data.autoRotateTimer) {
      clearInterval(this.data.autoRotateTimer);
      this.data.autoRotateTimer = null;
    }
  },

  scheduleAutoRotate() {
    if (this.data._resumeTimeout) {
      clearTimeout(this.data._resumeTimeout);
    }
    this.data._resumeTimeout = setTimeout(() => {
      this.startAutoRotate();
    }, 1500);
  },

  toggleAutoRotate() {
    if (this.data.isAutoRotate) {
      this.stopAutoRotate();
      this.setData({ isAutoRotate: false });
    } else {
      this.startAutoRotate();
      this.setData({ isAutoRotate: true });
    }
  },

  resetView() {
    this.stopAutoRotate();
    this.setData({ rotateX: -15, rotateY: 25, momentum: true });
    setTimeout(() => {
      this.setData({ momentum: false });
      this.startAutoRotate();
    }, 600);
  },

  // ─── 剪纸模型/展品切换 ───
  selectModel(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentModel: index,
      rotateY: this.data.rotateY + 360
    });
    wx.vibrateShort({ type: 'light' });
  },

  selectExhibit(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ exhibitInfo: this.data.exhibits[index] });
  },

  onShareAppMessage() {
    return { title: '艺韵巴蜀数字展示｜IP人设·剪纸3D·非遗科普', path: '/pages/ar/ar' };
  }
});
