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
        image: '/images/baxiaoyi.jpg',
        role: '非遗数字人讲解员',
        slogan: '让非遗开口说话',
        color: '#1F3830',
        gradient: 'linear-gradient(135deg, #1F3830 0%, #14241F 100%)',
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
        description: '剪纸是中国最古老的民间艺术之一，一把剪刀、一张红纸，便能剪出山河花鸟与世间祝愿。基地以立体展示让传统纹样在指尖转动，感受一刀一剪里的民俗之美。',
        history: '剪纸起源于汉代，与造纸术相伴而生，至今已逾两千年。在武陵山区，土家、苗家百姓逢年过节、婚丧嫁娶都要剪纸贴花，红纸纹样里藏着代代相传的生活祈愿。',
        technique: '剪纸分阳刻、阴刻与阴阳刻结合：阳刻线线相连，玲珑剔透；阴刻线线相断，厚重古朴。讲究线条如银丝，构图求对称饱满。'
      },
      {
        id: 'windowflower',
        name: '窗花灯影',
        category: '岁时民俗',
        description: '窗花是贴在窗棂上的剪纸，逢春节换新，红梅、喜鹊、门神、瑞兽跃然纸上，光影透过红纸洒进屋内，是年味最浓的一抹颜色。',
        history: '贴窗花的习俗盛行于唐宋，延续至今。土家山寨的除夕，家家户户剪窗花、糊新窗，以红纸压胜避邪，迎接新春进门。',
        technique: '窗花多用阳刻，线条细密而不杂乱，需适应窗格的方圆形状构图，讲究"图中有意，意中吉祥"。'
      },
      {
        id: 'happinessflower',
        name: '喜花团花',
        category: '婚俗礼俗',
        description: '喜花是婚嫁喜庆时的专用剪纸，双喜扣合、鸳鸯并蒂、蝶戏牡丹，多剪成圆形团花，寓意花好月圆、圆满和美。',
        history: '团花是剪纸中最古老的形制，出土的唐代皮革团花已见对称纹样雏形。土苗婚俗中，喜花贴于嫁妆、喜堂与洞房，是仪式中不可缺少的祝福。',
        technique: '团花采用折叠对称剪法：红纸数折，一剪展开即成辐射对称图案，最见手艺人的构图功夫。'
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
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
  },

  // 左上角返回键：回首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
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
    return { title: '艺韵巴蜀数字展示｜IP人设·剪纸3D·非遗科普', path: '/pages/index/index' };
  }
});
