// pages/ai/ai.js —— AI研学助手"巴小艺"
// 优先调用 aiChat 云函数（智谱 GLM-4-Flash 代理）；未配置 Key 或异常时降级为本地关键词库
const WELCOME = '您好！我是非遗数字人"巴小艺"，艺韵巴蜀研学基地的讲解员。关于酉阳非遗（西兰卡普、傩戏、苗银、摆手舞等）、预约购票、研学玩法的问题都可以问我～';

Page({
  data: {
    messages: [
      { id: 1, type: 'system', content: WELCOME }
    ],
    inputValue: '',
    isLoading: false,
    quickQuestions: [
      '什么是西兰卡普？',
      '傩戏面具有什么讲究？',
      '摆手舞是怎么跳的？',
      '苗银是怎么锻造的？',
      '如何预约研学？',
      '积分有什么用？'
    ]
  },

  onLoad() {
    this.scrollToBottom();
  },

  onShow() {
    this.scrollToBottom();
  },

  inputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 组装最近10轮对话（system 消息不传给大模型）
  buildHistory() {
    const history = this.data.messages
      .filter(m => m.type === 'user' || m.type === 'ai')
      .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
    return history.slice(-10);
  },

  sendMessage() {
    const inputValue = this.data.inputValue.trim();
    if (!inputValue || this.data.isLoading) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    };

    this.setData({
      messages: [...this.data.messages, newMessage],
      inputValue: '',
      isLoading: true
    });

    this.scrollToBottom();

    wx.cloud.callFunction({
      name: 'aiChat',
      data: { messages: [...this.buildHistory(), { role: 'user', content: inputValue }] }
    }).then(res => {
      const r = res.result || {};
      if (r.ok && r.answer) {
        this.appendAIAnswer(r.answer);
      } else {
        // 未配置 Key / 大模型异常 → 本地关键词库兜底
        this.simulateAIResponse(inputValue);
      }
    }).catch(() => {
      this.simulateAIResponse(inputValue);
    });
  },

  appendAIAnswer(answer) {
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: answer
    };
    this.setData({
      messages: [...this.data.messages, aiMessage],
      isLoading: false
    });
    this.scrollToBottom();
  },

  // 本地关键词兜底（酉阳非遗知识库精简版）
  simulateAIResponse(question) {
    let answer = '';
    const q = question.toLowerCase();

    if (q.includes('西兰卡普') || q.includes('织锦') || q.includes('织造')) {
      answer = '西兰卡普是土家语"花铺盖"的意思，是土家族的织锦，与蜀锦、壮锦并称中国四大名锦哦！它用"通经断纬"的技法反面挑织，四十八勾、台台花是经典纹样，被誉为土家族的"无字史书"。来基地的"西兰卡普纹样密码"关卡，亲手破解织锦里的纹样秘密吧～';
    } else if (q.includes('傩戏') || q.includes('面具') || q.includes('阳戏')) {
      answer = '傩戏被称为"中国戏剧活化石"，表演时要戴上木雕面具，所以也叫"脸壳戏"。面具造型粗犷传神，色彩讲究：红色代表忠勇、黑色代表刚直、白色代表奸诈。在酉阳，傩戏用来祈福驱邪。我们基地的关卡可以亲手绘制傩戏面具，把祝福画上去带回家！';
    } else if (q.includes('苗银') || q.includes('银子') || q.includes('锻造')) {
      answer = '苗银锻造要经过熔炼、锻打、拉丝、錾刻四道大工序，把银块变成薄如蝉翼的银片和细如发丝的银丝，非常考验手艺人的耐心。纹样里常见蝴蝶妈妈、枫叶等苗族图腾，寓意辟邪纳福。来"苗银纹样拓印"关卡，体验指尖上的银光艺术吧～';
    } else if (q.includes('摆手舞') || q.includes('跳舞') || q.includes('舞蹈')) {
      answer = '摆手舞是国家级非遗，起源于土家族祭祀祖先的"舍巴日"活动。动作模仿薅草、种麻、纺棉花等农事劳作，分单摆、双摆、回旋摆，风格古朴粗犷，被称为土家族的"民族百科全书"。跟着鼓点"同边手同边脚"摆起来就好啦，基地的摆手舞关卡等你来跳！';
    } else if (q.includes('油茶') || q.includes('糍粑') || q.includes('米豆腐') || q.includes('美食')) {
      answer = '土家美食可多啦！油茶汤用茶叶、阴米、花生炸制冲泡，土家人说"不喝油茶汤，心里就发慌"；糍粑是把蒸熟的糯米打进石臼里捶打而成，又糯又香；还有酸辣开胃的米豆腐。基地的"土家美食"关卡可以亲手打糍粑哦～';
    } else if (q.includes('酉阳') || q.includes('龚滩')) {
      answer = '酉阳土家族苗族自治县位于重庆东南部，武陵山区腹地，有摆手舞、酉阳古歌等4项国家级非遗和25项市级非遗，被称为"非遗富矿"。我们的研学基地就在酉阳龚滩古镇118号台，千年古镇配千年非遗，等你来探索秘境！';
    } else if (q.includes('预约') || q.includes('购票') || q.includes('报名') || q.includes('门票')) {
      answer = '在首页点击"预约购票"，先选研学版本：亲子启蒙版129元/2小时、研学进阶版199元/3小时、深度沉浸版259元/4小时，再选场次、填信息、支付后就拿到带核销码的电子票啦。团队出行还有B端团单价139元/人，更划算哦～';
    } else if (q.includes('巴小艺') || q.includes('数字人') || q.includes('ip') || q.includes('吉祥物')) {
      answer = '"巴小艺"就是我呀！我是基地的非遗数字人讲解员，穿着西兰卡普花纹的衣服，肚子里装满了酉阳非遗故事。你可以在"数字展示"页面看到我的3D形象，转到背面还有我的自我介绍，快来和我转个圈吧～';
    } else if (q.includes('数字展示') || q.includes('3d') || q.includes('剪纸') || q.includes('视频')) {
      answer = '在"数字展示"页面有三种打开非遗的方式：①看我和酉小艺的IP人设3D形象，转动卡片认识我们；②360°旋转欣赏剪纸艺术精品；③观看非遗科普视频，了解摆手舞、西兰卡普背后的故事。三种体验，一次看遍酉阳非遗！';
    } else if (q.includes('任务') || q.includes('关卡') || q.includes('进度')) {
      answer = '研学共有五大关卡：西兰卡普纹样密码、傩戏面具绘制、苗银纹样拓印、摆手舞跟跳、土家美食制作。每关先阅读知识卡再答题，答对2题即过关，能拿100积分还能解锁一条守护线索！在"任务进度"页面随时查看挑战情况～';
    } else if (q.includes('积分') || q.includes('排行') || q.includes('会员')) {
      answer = '积分可以通过过关（每关100分）、提交研学报告、分享小程序等方式获得。积分越高守护人等级越高：普通会员→青铜→白银→黄金→钻石守护人！排行榜能看你的排名，积分还能在文创商城兑换苗银挂件、西兰卡普饰品等好礼～';
    } else if (q.includes('报告') || q.includes('心得')) {
      answer = '研学结束后，在"研学报告"页面写下你的收获和感悟吧！记录解锁的线索、学到的非遗知识、最难忘的瞬间。提交报告能获得积分奖励，优秀报告还会被展示给其他小伙伴学习哦～';
    } else if (q.includes('剧本') || q.includes('故事') || q.includes('秘境')) {
      answer = '《酉阳秘境·非遗守护人》是我们基地的沉浸式剧本研学！你将收到一封神秘的守护者邀请函，跟随剧情闯过五大非遗关卡、收集文化线索，最终成为酉阳非遗的守护人。分亲子启蒙、研学进阶、深度沉浸三个版本，全家都能玩！';
    } else if (q.includes('你好') || q.includes('您好') || q.includes('嗨') || q.includes('哈喽')) {
      answer = '你好呀！我是巴小艺，很高兴认识你！想了解酉阳的非遗宝贝，还是想知道怎么玩转研学基地？尽管问我吧～';
    } else if (q.includes('谢谢') || q.includes('感谢')) {
      answer = '不客气！很高兴能帮到你。如果还想了解酉阳非遗的更多秘密，随时来找我聊～';
    } else {
      answer = `关于"${question}"，我知道酉阳有摆手舞、西兰卡普、傩戏、苗银锻造等好多非遗宝贝！你可以问我"什么是西兰卡普"、"摆手舞怎么跳"，或者问我预约购票、积分玩法，我都知道哦～`;
    }

    this.appendAIAnswer(answer);
  },

  quickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({
      inputValue: question
    });
    this.sendMessage();
  },

  scrollToBottom() {
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('.message-list').boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          wx.pageScrollTo({
            scrollTop: res[0].height,
            duration: 300
          });
        }
      });
    }, 100);
  },

  clearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [
              { id: 1, type: 'system', content: WELCOME }
            ]
          });
        }
      }
    });
  }
});
