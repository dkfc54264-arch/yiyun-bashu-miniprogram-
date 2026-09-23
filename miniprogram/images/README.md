# 图片资源

## 首页主形象 · `mascot.webp`

首页 Hero 区的任务 Q 版角色，已做「自适应去背景 + 压缩」处理：

- 文件：`miniprogram/images/mascot.webp`（透明背景 WebP，约 130 KB）
- 原图：1884×4096 RGB → 处理后 640×1391 透明 WebP
- 引用位置：`pages/index/index.js` 的 `mascot` 字段，首页以 `heightFix` 自适应展示

如需更换角色形象，将新图（建议竖版、单主体、浅色背景）放到本目录，
命名 `mascot.webp` 覆盖即可；若背景未透明，可参考原处理流程重新去背景。
