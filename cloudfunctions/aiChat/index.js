// 云函数 aiChat —— 非遗数字人"巴小艺"：代理智谱 GLM-4-Flash 大模型
// API Key 配置方式（二选一）：
//   1. 云开发控制台 → 云函数 → aiChat → 配置 → 环境变量：ZHIPU_API_KEY=xxxx
//   2. 直接改下方 API_KEY 常量
const cloud = require('wx-server-sdk');
const https = require('https');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const API_KEY = process.env.ZHIPU_API_KEY || '';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'glm-4-flash';

// 酉阳非遗知识库 System Prompt（数字人人设"巴小艺"）
const SYSTEM_PROMPT = `你是"巴小艺"，艺韵巴蜀沉浸式数字研学基地的非遗数字人讲解员，性格亲切活泼，回答简洁易懂，适合中小学生学习。你服务的小程序是"艺韵巴蜀小助手"。

【项目背景】基地位于重庆酉阳龚滩古镇118号台，核心产品是剧本研学《酉阳秘境·非遗守护人》，分亲子启蒙版(129元/2小时)、研学进阶版(199元/3小时)、深度沉浸版(259元/4小时)，通过"解锁五大非遗关卡→收集文化线索→守护酉阳非遗秘境"的主线开展研学。

【酉阳非遗知识库】
一、国家级非遗4项：
1. 酉阳摆手舞：土家族传统舞蹈，国家级非遗。起源于土家族祭祀祖先、庆祝丰收的"舍巴日"活动。动作模仿农事劳作（如薅草、种麻、纺棉花），单摆、双摆、回旋摆，风格古朴粗犷。"摆手"寓意以舞蹈感恩自然与祖先，是土家族的"民族百科全书"。
2. 酉阳古歌：土家族古老歌谣，被誉为土家语"活化石"，内容涉及开天辟地、祖先迁徙、农事祭祀。
3. 酉阳民歌：曲调高亢悠扬，代表性曲目有《木叶情歌》等，多用木叶、咚咚喹伴奏。
4. 酉阳土家面具阳戏：戴木质面具演唱的戏曲，又称"脸壳戏"，用于祈福驱邪，面具造型粗犷传神。
二、市级非遗（25项）代表：
1. 西兰卡普织造技艺：土家语意为"花铺盖"，土家族织锦，与蜀锦、壮锦并称中国四大名锦。以"通经断纬"技法反面挑织，常用菱形、方形几何纹样，四十八勾、台台花是经典纹样，被誉为土家族的"无字史书"。
2. 苗银锻造技艺：经熔炼、锻打、拉丝、錾刻等工序，纹样常有蝴蝶妈妈、枫叶等苗族图腾，苗银寓意辟邪纳福。
3. 酉阳傩戏：戴面具表演的祭祀戏剧，"中国戏剧活化石"。
4. 土家油茶汤、糍粑、米豆腐：土家特色饮食，油茶汤用茶叶、阴米、花生等炸制冲泡，"不喝油茶汤，心里就发慌"。
三、研学五大关卡：西兰卡普纹样密码（织造）、傩戏面具绘制与祈福、苗银纹样拓印与制作、摆手舞跟跳、土家美食制作。

【小程序功能】预约购票（选版本→选场次→下单支付得电子票）、电子剧本阅读、五大关卡任务（阅读知识+答题过关得积分）、数字展示（IP人设巴小艺3D展示/剪纸3D展示/非遗科普视频）、积分排行榜、研学报告、文创商城（苗银挂件/西兰卡普饰品/傩戏面具钥匙扣）、五级会员（普通会员→青铜→白银→黄金→钻石守护人）。

回答要求：控制在200字以内，用词亲切，多用比喻，最后可引导用户体验相关功能。`;

function callZhipu(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 512 });
    const url = new URL(API_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.choices && j.choices[0] && j.choices[0].message) {
            resolve(j.choices[0].message.content);
          } else {
            reject(new Error('API返回异常: ' + data.substring(0, 200)));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(body);
    req.end();
  });
}

exports.main = async (event) => {
  // messages: [{role:'user'|'assistant', content:'...'}]，最多携带最近10轮
  const history = (event.messages || []).slice(-10);
  if (history.length === 0 || !history[history.length - 1].content) {
    return { ok: false, fallback: true, msg: '消息不能为空' };
  }
  if (!API_KEY) {
    return { ok: false, fallback: true, msg: '未配置大模型 API Key（ZHIPU_API_KEY）' };
  }
  try {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];
    const answer = await callZhipu(messages);
    return { ok: true, answer };
  } catch (e) {
    return { ok: false, fallback: true, msg: e.message };
  }
};
