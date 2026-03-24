# Changelog

本项目的所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增 (Added)
- 添加 GitHub Issue/PR 模板
- 添加贡献指南 (CONTRIBUTING.md)
- 添加行为准则 (CODE_OF_CONDUCT.md)
- 添加 CI/CD 工作流

## [1.0.0] - 2026-02

### 新增 (Added)
- 智能持仓管理
  - 支持代码/名称/拼音搜索添加股票
  - 动态成本价计算（移动加权平均法）
  - 交易情绪与原因标签
- 分批管理（股权激励场景）
  - 分批持仓追踪
  - 自动识别解禁状态
  - FIFO 卖出分配
- 多账户支持
  - 多证券账户管理
  - 账户间数据隔离
  - 一键汇总收益
- 做T计算器
  - 快速计算做T成本
  - 自定义费率设置
- 实时收益分析
  - 东方财富 API 行情
  - 收益分享截图生成
- 复盘管理
  - 每日/每周复盘
  - AI 智能分析
  - Markdown/PDF 导出
- 智能资讯聚合
  - 实时市场新闻
  - 持仓相关资讯筛选
- 事件日历
  - 多视图展示
  - 事件标签分类
- 数据管理
  - 本地存储
  - JSON 导入/导出

### 技术栈
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- Tailwind CSS 3.4.19

---

## 版本说明

- **[Unreleased]**: 开发中的功能
- **[Major]**: 重大版本更新，可能包含破坏性变更
- **[Minor]**: 功能更新，向后兼容
- **[Patch]**: Bug 修复，向后兼容

[Unreleased]: https://github.com/TurtleTrace2026/TurtleTrace/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/TurtleTrace2026/TurtleTrace/releases/tag/v1.0.0
