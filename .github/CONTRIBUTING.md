# 贡献指南

感谢您有兴趣为 TurtleTrace 做贡献！本文档将帮助您了解如何参与项目开发。

## 目录

- [行为准则](#行为准则)
- [我能如何贡献](#我能如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)

---

## 行为准则

本项目采用贡献者公约作为行为准则。参与此项目即表示您同意遵守其条款。请阅读 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 了解详情。

---

## 我能如何贡献

### 报告 Bug

在提交 Bug 报告之前，请先：
1. 检查 [Issues](https://github.com/TurtleTrace2026/TurtleTrace/issues) 中是否已有相同问题
2. 确认您使用的是最新版本
3. 尝试清除浏览器缓存后重试

提交 Bug 报告时，请使用 [Bug 报告模板](.github/ISSUE_TEMPLATE/bug_report.yml)，包含：
- 清晰的问题描述
- 复现步骤
- 期望行为与实际行为
- 浏览器和操作系统信息
- 控制台错误日志（如有）

### 建议新功能

我们欢迎任何改进建议！请使用 [功能请求模板](.github/ISSUE_TEMPLATE/feature_request.yml) 提交。

### 改进文档

文档改进包括：
- 修正拼写或语法错误
- 补充缺失的信息
- 添加更多示例
- 翻译文档

### 提交代码

详见下方的开发流程。

---

## 开发流程

### 环境准备

```bash
# 要求
# - Node.js >= 18.0.0
# - npm >= 9.0.0

# 1. Fork 并克隆项目
git clone https://github.com/YOUR_USERNAME/TurtleTrace.git
cd TurtleTrace

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 运行代码检查
npm run lint
```

### 项目结构

```
src/
├── components/          # React 组件
│   ├── ui/             # shadcn/ui 基础组件
│   └── dashboard/      # 业务组件
├── services/           # 服务层（数据处理、API）
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── App.tsx             # 应用入口
```

### 分支策略

- `main` - 主分支，保持稳定可发布状态
- `feature/*` - 新功能开发
- `fix/*` - Bug 修复
- `docs/*` - 文档更新

---

## 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 避免使用 `any` 类型，优先定义具体类型
- 为函数和组件添加类型注解

```typescript
// ✅ Good
interface PositionProps {
  symbol: string
  quantity: number
}

function PositionCard({ symbol, quantity }: PositionProps): JSX.Element {
  // ...
}

// ❌ Bad
function PositionCard(props: any) {
  // ...
}
```

### React 组件

- 使用函数式组件和 Hooks
- 组件文件使用 PascalCase 命名
- 一个文件一个组件

```tsx
// ✅ Good
import { useState } from 'react'

export function PositionManager() {
  const [positions, setPositions] = useState<Position[]>([])
  // ...
}
```

### 样式

- 使用 Tailwind CSS
- 遵循现有组件的样式模式
- 金融数据颜色：红涨绿跌（A股惯例）

### 服务层

- 数据操作逻辑放在 `services/` 目录
- 使用 `localStorage` 作为存储
- 导出清晰的 API

```typescript
// services/positionService.ts
export const positionService = {
  getAll: () => Position[],
  add: (position: Position) => void,
  update: (id: string, data: Partial<Position>) => void,
  delete: (id: string) => void,
}
```

---

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 示例

```bash
# 新功能
feat(position): 添加持仓排序功能

# Bug 修复
fix(batch): 修复批次卖出时成本计算错误

# 文档
docs: 更新 README 安装说明

# 重构
refactor(service): 重构股票服务代码结构
```

---

## Pull Request 流程

### 提交前检查

1. **代码检查通过**
   ```bash
   npm run lint
   ```

2. **构建成功**
   ```bash
   npm run build
   ```

3. **本地测试通过**
   ```bash
   npm run dev
   # 手动测试相关功能
   ```

### PR 步骤

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **编写代码**
   - 遵循代码规范
   - 添加必要的注释
   - 更新相关文档

3. **提交变更**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. **推送到 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建 Pull Request**
   - 填写 PR 模板
   - 关联相关 Issue
   - 等待审核

### 审核标准

- 代码质量
- 功能正确性
- 测试覆盖
- 文档完整性
- 无破坏性变更（或已说明）

---

## 获取帮助

- 📖 [项目文档](../README.md)
- 💬 [Discussions](https://github.com/TurtleTrace2026/TurtleTrace/discussions)
- 🐛 [Issues](https://github.com/TurtleTrace2026/TurtleTrace/issues)

---

再次感谢您的贡献！
