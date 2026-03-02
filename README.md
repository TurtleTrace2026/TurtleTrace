# TurtleTrace 龟迹复盘

> 一个简洁实用的个人股票投资组合管理工具，帮助您追踪持仓、管理分批解禁、分析收益、复盘交易。像乌龟一样稳健投资，通过复盘追踪投资足迹。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescript-lang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)](https://vite.dev/)

---

## 项目简介

TurtleTrace（龟迹复盘）是一款面向个人投资者的股票组合管理工具，专注于持仓追踪、分批管理、收益分析和交易复盘。所有数据本地存储，无需注册登录，保护您的投资隐私。

---

## 功能亮点

### 📊 智能持仓管理
- 支持通过代码/名称/拼音快速搜索添加股票
- 自动计算动态成本价（移动加权平均法）
- 交易情绪与原因标签，帮助复盘决策逻辑
- 完整的交易历史记录

### 📦 分批管理（股权激励）
- 支持同一股票分批持仓管理
- 适用于股权激励分批解禁场景
- 自动识别解禁状态（基于日期）
- FIFO（先进先出）卖出分配
- 独立追踪每批次的成本和解禁日期

### 👥 多账户支持
- 支持创建多个证券账户
- 账户间数据独立隔离
- 快速切换查看不同账户
- 一键汇总全部账户收益

### 🧮 做T计算器
- 快速计算做T成本和盈亏平衡点
- 自定义佣金费率、印花税、过户费
- 历史记录本地保存
- 全局快捷入口，随时可用

### 📈 实时收益分析
- 接入东方财富 API，获取实时行情数据
- 直观展示总成本、总市值、盈亏比例
- 个股明细与清仓收益追踪
- 一键生成收益分享截图

### 📝 复盘管理
- **每日复盘**：大盘指数自动同步，自动提取当日交易
- **每周复盘**：周度维度总结回顾
- **AI 智能复盘**：支持 AI 辅助分析和评价
- 模板化复盘板块：市场观察、持仓回顾、操作分析
- 支持 Markdown/PDF 导出

### 📰 智能资讯聚合
- 实时获取市场新闻快讯
- 自动筛选持仓相关股票资讯
- 简洁的卡片式阅读界面

### 🔐 隐私优先
- 所有数据存储在浏览器本地
- 支持 JSON 格式数据导入/导出
- 无需云端账户，完全掌控您的数据

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/TurtleTrace2026/TurtleTrace.git
cd TurtleTrace

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:5173`

---

## 项目结构

```
TurtleTrace/
├── src/
│   ├── components/
│   │   ├── ui/                          # shadcn/ui 基础组件
│   │   └── dashboard/
│   │       ├── PositionManager.tsx      # 持仓管理
│   │       ├── PositionBatch/           # 分批管理模块
│   │       ├── ProfitDashboard.tsx      # 收益分析
│   │       ├── TCalculator/             # 做T计算器
│   │       ├── AccountManager.tsx       # 账户管理
│   │       ├── AccountSwitcher.tsx      # 账户切换
│   │       ├── NewsFeed.tsx             # 新闻快讯
│   │       ├── DataExport.tsx           # 数据管理
│   │       └── review/                  # 复盘模块
│   ├── services/                        # 服务层
│   │   ├── accountService.ts            # 账户服务
│   │   ├── batchService.ts              # 分批管理服务
│   │   ├── tCalculatorService.ts        # 做T计算器服务
│   │   └── welcomeService.ts            # 欢迎页服务
│   ├── types/                           # TypeScript 类型定义
│   ├── utils/                           # 工具函数
│   └── App.tsx                          # 主应用入口
├── scripts/                             # 构建脚本
├── public/                              # 静态资源
└── dist/                                # 构建输出
```

---

## 主要依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 19.2.0 | 前端框架 |
| TypeScript | 5.9.3 | 类型检查 |
| Vite | 7.2.4 | 构建工具 |
| Tailwind CSS | 3.4.19 | 样式框架 |
| Framer Motion | 12.x | 动画库 |
| Lucide React | latest | 图标库 |
| Recharts | 3.7.0 | 图表库 |

---

## 使用指南

### 首次使用

首次打开应用时，会显示欢迎向导：
1. **欢迎页**：了解产品定位
2. **功能介绍**：核心功能概览
3. **初始配置**：设置账户名称和可选费率
4. **开始使用**：进入主界面

### 添加持仓

1. 在「持仓管理」点击添加按钮
2. 输入股票代码/名称/拼音搜索
3. 填写买入价格、数量
4. 可选：添加交易情绪和原因标签

### 使用分批管理

适用于股权激励等分批解禁场景：
1. 展开持仓，点击「添加批次」
2. 填写数量、成本价、解禁日期
3. 系统自动识别锁定/解禁状态
4. 卖出时自动按 FIFO 分配

### 做T计算

1. 点击顶部栏「做T」按钮
2. 输入买入价、卖出价、数量
3. 查看盈亏金额、收益率、手续费明细
4. 可自定义费率设置

### 每日复盘

1. 选择复盘日期
2. 系统自动填充：大盘指数、持仓盈亏、当日交易
3. 填写复盘内容
4. 保存并导出分享

### 数据备份

```javascript
// 导出数据
exportData(); // 下载 JSON 备份文件

// 导入数据
importData(jsonFile); // 从备份文件恢复
```

---

## 贡献指南

欢迎社区贡献！请遵循以下流程：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发规范

- 遵循 ESLint 配置的代码规范
- 使用 TypeScript 编写，确保类型安全
- 组件使用函数式组件 + Hooks
- 提交信息清晰描述改动内容

---

## 常见问题

**Q: 数据是否会上传到服务器？**

A: 不会。所有数据存储在您的浏览器本地，完全保护您的隐私。

**Q: 支持哪些市场？**

A: 目前支持 A 股市场（沪市、深市、北交所）。

**Q: 如何备份数据？**

A: 在「设置」页面点击「导出数据」即可下载 JSON 备份文件。

**Q: 股票数据多久更新一次？**

A: 点击「刷新价格」按钮可手动获取最新行情，数据来自东方财富 API。

**Q: 如何管理多个证券账户？**

A: 在「账户管理」中添加多个账户，支持在不同账户间切换查看持仓和收益。

**Q: 分批管理适合什么场景？**

A: 适用于股权激励分批解禁、定投分批建仓等需要按批次追踪成本和解禁日期的场景。

---

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源协议。

---

## 致谢

- 股票行情数据来自 [东方财富网](https://www.eastmoney.com/)
- 股票基础数据来自 [TuShare](https://tushare.pro/)
- UI 组件基于 [shadcn/ui](https://ui.shadcn.com/)
- 图标来自 [Lucide](https://lucide.dev/)

---

## 免责声明

本项目仅供学习交流使用，所有数据仅供参考，不构成任何投资建议。股票投资有风险，入市需谨慎。

---

<p align="center">
  Made with ❤️ by TurtleTrace Team
</p>
