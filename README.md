# 城会玩 2.0

> 🗺️ 一款围绕「城市探索、旅行记录、角色卡收集、成就激励」设计的微信小程序，让每一次旅行都成为可收藏的回忆。

<p align="center">
  <a href="https://tl66666.github.io/chw2.0/"><strong>🌐 项目展示页</strong></a> ·
  <a href="./城会玩2.0"><strong>📁 源码目录</strong></a> ·
  <a href="./index.html"><strong>📄 Pages 首页</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/平台-微信小程序-07C160?logo=wechat&logoColor=white" alt="微信小程序">
  <img src="https://img.shields.io/badge/后端-微信云开发-2AAE67?logo=cloud&logoColor=white" alt="微信云开发">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

---

## 📁 仓库结构

```
.
├── index.html           ← GitHub Pages 项目展示页
├── README.md            ← 本文件
├── LICENSE              ← MIT 开源协议
├── .gitignore
├── site-assets/         ← 展示页静态资源（图片、截图）
│   ├── logo.jpg
│   ├── badge-*.jpg
│   ├── icon-*.jpg
│   └── ...
└── 城会玩2.0/            ← 微信小程序完整源码
    ├── pages/           # 主包页面（地图、城市详情、我的等）
    ├── package-cards/   # 角色卡分包
    ├── package-album/   # 相册分包
    ├── package-others/  # 成就、群组等扩展分包
    ├── cloudfunctions/  # 云函数
    ├── utils/           # 工具函数
    ├── images/          # 本地静态资源
    ├── app.js
    └── app.json
```

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🗺️ **城市地图点亮** | 34个省级行政区、300+城市足迹可视化展示 |
| 🏙️ **城市详情探索** | 每个城市独立详情页，含介绍、图片、探索状态 |
| 🃏 **角色卡收集** | 探索城市解锁地域特色角色卡，含稀有度与风格 |
| 🏆 **成就系统** | 探索/收集/社交/特殊四大类 30+ 成就徽章 |
| 📸 **旅行相册** | 城市旅行照片记录，打造个人专属回忆墙 |
| 👥 **社交群组** | 创建/加入旅行群组，分享探索心得 |

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| 微信小程序原生框架 | WXML / WXSS / JavaScript / JSON |
| 微信云开发 CloudBase | 云函数 · 云数据库 · 云存储 |
| Node.js（云函数） | 登录鉴权 · 数据同步 · 资源解析 |
| 分包加载 | 3 个分包，主包 26MB → 1.4MB |
| 代码生成 WAV 音频 | 8bit PCM 纯代码合成，零外部依赖 |
| 本地缓存 Storage | 用户状态、成就、角色卡数据持久化 |

---

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/tl66666/chw2.0.git

# 2. 使用微信开发者工具导入
#    → 选择「城会玩2.0/」目录
#    → 填写你的小程序 AppID

# 3. 开通云开发 → 部署云函数 → 上传云存储资源 → 编译运行
```

---

## 🎯 项目亮点

- **📦 分包体积优化** — 主包从 26MB 压缩到 1.4MB，PNG→JPG 节省 88%
- **☁️ 全栈云开发** — 5 个云函数 + 云数据库 + 云存储，无需独立后端
- **🎵 代码生成音效** — 8bit PCM WAV 纯代码合成，无外部音频文件依赖
- **🎮 游戏化设计** — 抽卡动画、成就解锁、等级体系，让旅行更有动力

---

## 👤 作者

**唐乐** · GitHub: [@tl66666](https://github.com/tl66666)

本项目为个人学习、作品集展示和求职项目展示用途。

---

## 📄 License

[MIT](./LICENSE)
