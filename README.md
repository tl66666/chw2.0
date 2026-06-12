# 城会玩2.0

> 一款围绕「城市探索、旅行记录、角色卡收集、成就激励」设计的微信小程序

[![微信小程序](https://img.shields.io/badge/平台-微信小程序-07C160?logo=wechat&logoColor=white)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![微信云开发](https://img.shields.io/badge/后端-微信云开发-2AAE67?logo=cloud&logoColor=white)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🌐 项目展示页

**在线预览：** [https://tl66666.github.io/chw2.0/](https://tl66666.github.io/chw2.0/)

> 项目展示页包含功能介绍、技术栈说明、界面展示和项目亮点，建议优先访问了解项目全貌。

---

## 📁 源码目录

| 目录 | 说明 |
|------|------|
| [`城会玩2.0/`](./城会玩2.0) | 微信小程序完整源码 |
| [`site-assets/`](./site-assets) | 项目展示页资源文件 |
| [`index.html`](./index.html) | GitHub Pages 项目展示页 |

---

## ✨ 核心功能

### 🗺️ 城市地图点亮
- 支持中国 **34** 个省级行政区、**300+** 城市的足迹点亮
- 地图标记展示已探索城市，形成可视化旅行足迹
- 城市详情页展示城市介绍、图片、探索状态与相关互动入口

### 🃏 角色卡收集
- 通过探索城市解锁具有地域特色的角色卡
- 角色卡包含稀有度、角色形象、名称和地域风格设定
- 支持角色卡列表、筛选、详情查看和解锁反馈

### 🏆 成就系统
- 根据探索城市数量、收集角色卡、社交互动等行为解锁成就
- 成就分为**探索、收集、社交、特殊**四大类，共 **30+** 个成就徽章
- 通过积分、进度条和完成状态给用户持续反馈

### 📸 旅行相册
- 记录每个城市的旅行照片和回忆
- 打造个人专属的城市记忆墙

### 👥 社交群组
- 创建或加入旅行群组
- 与志同道合的旅行者分享探索心得

---

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| **微信小程序原生框架** | WXML / WXSS / JavaScript / JSON |
| **微信云开发 CloudBase** | 云函数 + 云数据库 + 云存储 |
| **云函数 Node.js** | 登录鉴权、数据同步、资源解析 |
| **分包加载** | 3 个分包策略，主包体积优化至 1.4MB |
| **本地缓存 Storage** | 用户状态、成就进度、角色卡数据持久化 |
| **代码生成 WAV** | 8bit PCM 音频合成，解决跨域播放限制 |

---

## 📊 项目数据

| 指标 | 数值 |
|------|------|
| 省级行政区 | 34 |
| 城市数据 | 300+ |
| 成就徽章 | 30+ |
| 角色卡 | 30+ |
| 云函数 | 5 个 |
| 分包数量 | 3 个 |

---

## 🚀 快速开始

### 环境准备
1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册微信小程序账号并获取 AppID

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/tl66666/chw2.0.git

# 2. 进入源码目录
cd chw2.0/城会玩2.0

# 3. 使用微信开发者工具导入本项目
#    - 选择「导入项目」
#    - 目录指向 chw2.0/城会玩2.0
#    - 填写你的小程序 AppID

# 4. 开通微信云开发
#    - 在开发者工具中点击「云开发」按钮
#    - 创建环境并记录环境 ID

# 5. 部署云函数
#    - 右键 cloudfunctions/login → 创建并部署：云端安装依赖
#    - 右键 cloudfunctions/syncData → 创建并部署：云端安装依赖
#    - 右键 cloudfunctions/getAssetUrl → 创建并部署：云端安装依赖
#    - 右键 cloudfunctions/group → 创建并部署：云端安装依赖
#    - 右键 cloudfunctions/listCloudFiles → 创建并部署：云端安装依赖

# 6. 上传云存储资源
#    - 在云开发控制台「存储」中创建 cities/ 和 cards/ 目录
#    - 上传城市图片和角色卡图片

# 7. 编译运行
#    - 点击开发者工具「编译」按钮
```

---

## 📂 项目结构

```
城会玩2.0/
├── app.js                  # 小程序入口逻辑
├── app.json                # 页面、分包与 tabBar 配置
├── app.wxss                # 全局样式
├── pages/                  # 主包页面（地图、我的、城市详情等）
│   ├── index/              # 地图首页
│   ├── city-detail/        # 城市详情
│   ├── cards/              # 角色卡列表
│   ├── album/              # 相册
│   ├── profile/            # 我的页面
│   └── ...
├── package-cards/          # 角色卡相关分包
│   ├── pages/card-detail/  # 角色卡详情
│   └── pages/unlock-card/  # 抽卡页面
├── package-album/          # 相册相关分包
│   └── pages/upload/       # 照片上传
├── package-others/         # 其他扩展分包
│   ├── pages/achievements/ # 成就系统
│   └── pages/group/        # 社交群组
├── cloudfunctions/         # 微信云函数
│   ├── login/              # 用户登录
│   ├── syncData/           # 数据同步
│   ├── getAssetUrl/        # 资源地址解析
│   ├── group/              # 群组管理
│   └── listCloudFiles/     # 云文件列表
├── utils/                  # 工具函数
│   ├── achievements.js     # 成就系统逻辑
│   ├── audio-manager.js    # 音频管理器
│   ├── characters.js       # 角色卡数据
│   ├── cities.js           # 城市数据
│   └── cloudImage.js       # 云图片解析
└── images/                 # 本地静态资源
```

---

## 🎯 项目亮点

### 📦 分包体积优化
- 主包体积从 **26MB** 优化至 **1.4MB**，通过 3 个分包策略实现
- **16** 张 PNG 大图转 JPG，体积减少 **88%**
- 云存储管理城市图片和角色卡图片，降低本地包体压力

### ☁️ 云开发架构
- **5** 个云函数处理登录、数据同步、资源解析、群组管理
- 云数据库存储用户数据、群组信息
- 云存储托管城市图片、角色卡图片等大体积资源

### 🎵 创新音频方案
- 代码生成 **8bit PCM WAV** 音频，解决云存储音频跨域播放限制
- 无需依赖外部音频文件，纯代码实现音效播放

### 🎮 游戏化设计
- 抽卡动画、成就解锁动效、等级体系
- 让旅行记录更有目标感和持续动力

---

## 📝 相关文档

- [项目展示页](https://tl66666.github.io/chw2.0/) - 在线预览项目介绍
- [源码目录](./城会玩2.0) - 微信小程序完整源码
- [LICENSE](./LICENSE) - MIT 开源协议
- [AUTHOR.md](./AUTHOR.md) - 作者信息

---

## 👤 作者

**唐乐**

- GitHub: [@tl66666](https://github.com/tl66666)
- 本项目为个人学习、作品集展示和求职项目展示用途

---

## 📄 License

本项目基于 [MIT License](./LICENSE) 开源协议。
