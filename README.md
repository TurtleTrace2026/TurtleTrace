# TurtleTrace 龟迹复盘

> 一个简洁实用的个人股票投资组合管理工具，帮助您追踪持仓、分析收益、复盘交易，像乌龟一样稳健投资，通过复盘追踪投资足迹。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)](https://vite.dev/)

---

## 项目简介

TurtleTrace（龟迹复盘）是一款面向个人投资者的股票组合管理工具，专注于持仓追踪、收益分析和交易复盘。所有数据本地存储，无需注册登录，保护您的投资隐私。

---

## 功能亮点

### 📊 智能持仓管理
- 支持通过代码/名称/拼音快速搜索添加股票
- 自动计算动态成本价（移动加权平均法）
- 交易情绪与原因标签，帮助复盘决策逻辑
- 完整的交易历史记录

### 📈 实时收益分析
- 接入东方财富 API，获取实时行情数据
- 直观展示总成本、总市值、盈亏比例
- 个股明细与清仓收益追踪
- 一键生成收益分享截图

### 📝 每日复盘
- 大盘指数自动同步（上证、深证、创业板等）
- 自动提取当日交易记录
- 模板化复盘板块：大盘数据、持仓统计、操作回顾、总结感悟
- 日历视图浏览历史复盘
- 支持 Markdown/PDF 导出

### 📅 每周复盘
- 周度维度总结回顾，自动聚合每周交易记录
- 本周持仓统计与盈亏汇总
- 本周操作回顾与下周计划
- 模板化复盘板块：市场观察、持仓回顾、操作分析、下周规划
- 支持 Markdown/PDF 导出

### 📰 智能资讯聚合
- 实时获取市场新闻快讯
- 自动筛选持仓相关股票资讯
- 简洁的卡片式阅读界面

### 💾 隐私优先
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

## 安装与配置

### 依赖说明

项目主要依赖：

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 19.0.0 | 前端框架 |
| TypeScript | 5.9.3 | 类型检查 |
| Vite | 7.2.4 | 构建工具 |
| Tailwind CSS | 3.4.19 | 样式框架 |
| lucide-react | latest | 图标库 |

### 股票数据库

项目内置 A 股股票基础数据（约 5000+ 只股票），数据来源：
- TuShare A股股票基础数据
- 包含：股票代码、名称、行业、交易所等信息

### 环境变量

项目使用公开 API，无需配置环境变量即可运行。

---

## 使用示例

### 添加持仓

```typescript
// 通过代码、名称或拼音搜索
const stock = searchStock("600519"); // 贵州茅台
addPosition({
  code: "600519",
  name: "贵州茅台",
  buyPrice: 1800.00,
  quantity: 100,
  emotion: "理性建仓",
  reason: "长期价值投资"
});
```

### 每日复盘流程

1. 选择复盘日期
2. 系统自动填充：大盘指数、持仓盈亏、当日交易
3. 填写复盘内容：
   - 市场观察与情绪判断
   - 操作回顾与反思
   - 总结感悟
4. 保存复盘记录
5. 导出分享（可选）

### 每周复盘流程

1. 选择复盘周次（自动识别本周日期范围）
2. 系统自动填充：本周持仓统计、本周交易记录
3. 填写复盘内容：
   - 本周市场观察
   - 持仓回顾与盈亏分析
   - 操作回顾与反思
   - 下周计划
4. 保存复盘记录
5. 导出 PDF 分享

### 数据备份

```javascript
// 导出数据
exportData(); // 下载 JSON 备份文件

// 导入数据
importData(jsonFile); // 从备份文件恢复
```

---

## 项目结构

```
TurtleTrace/
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 基础组件
│   │   └── dashboard/               # 业务功能组件
│   │       ├── PositionManager.tsx  # 持仓管理
│   │       ├── ProfitDashboard.tsx  # 收益分析
│   │       ├── NewsFeed.tsx         # 新闻快讯
│   │       ├── DataExport.tsx       # 数据管理
│   │       ├── review/              # 每日复盘模块
│   │       └── weekly-review/       # 每周复盘模块
│   ├── services/                    # API 服务层
│   ├── types/                       # TypeScript 类型定义
│   ├── utils/                       # 工具函数
│   └── App.tsx                      # 主应用入口
├── scripts/                         # 构建脚本
├── public/                          # 静态资源
└── dist/                            # 构建输出
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

A: 在"数据管理"页面点击"导出数据"即可下载 JSON 备份文件。

**Q: 股票数据多久更新一次？**

A: 点击"刷新价格"按钮可手动获取最新行情，数据来自东方财富 API。

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
