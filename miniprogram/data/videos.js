// data/videos.js —— 非遗科普视频讲解模块数据源
// 说明：src 为演示用占位视频，正式演示前请录制/上传酉阳非遗科普短视频至云存储，
// 替换为云存储 fileID（如 cloud://cloud1-d9gh6b85b2c0f6570.xxxx/video/baijiawu.mp4）
const VIDEOS = [
  {
    id: 1,
    title: '酉阳摆手舞：会讲故事的舞蹈',
    desc: '国家级非遗摆手舞，单摆薅草、双摆插秧，一舞看尽土家人的四季劳作。',
    duration: '2 分 30 秒',
    tag: '国家级非遗',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    poster: ''
  },
  {
    id: 2,
    title: '西兰卡普：织在布上的史书',
    desc: '通经断纬、反面挑织，看土家织娘如何不用图纸织出四十八勾。',
    duration: '3 分 10 秒',
    tag: '织造技艺',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    poster: ''
  },
  {
    id: 3,
    title: '傩戏面具：戴上它就换了一个魂',
    desc: '中国戏剧活化石，木质面具背后的正神、凶神与丑角。',
    duration: '2 分 45 秒',
    tag: '戏曲文化',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    poster: ''
  }
];

module.exports = VIDEOS;
