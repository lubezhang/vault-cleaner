# Clean Files - Obsidian清理插件

一个简洁的Obsidian清理插件，专注于识别和清理空目录和无关联文件。

## 功能特性

- 🔍 **智能扫描**：自动识别空目录和无关联文件
- 🛡️ **安全保护**：自动排除Obsidian支持的文档格式（.md, .canvas, .pdf等）
- ✅ **批量操作**：支持批量选择和删除
- 🎯 **精准清理**：只清理真正无用的文件
- 💡 **简洁界面**：遵循最小化设计原则

## 安装方法

### 手动安装

1. 下载最新版本的插件文件
2. 将文件解压到你的Obsidian插件目录：`{vault}/.obsidian/plugins/clean-files/`
3. 在Obsidian设置中启用"Clean Files"插件

### 开发安装

1. 克隆此仓库到你的插件目录
2. 运行 `pnpm install` 安装依赖
3. 运行 `pnpm run build` 构建插件
4. 在Obsidian中启用插件

## 使用方法

1. **打开插件**：
   - 点击侧边栏的垃圾桶图标
   - 或使用命令面板搜索"清理文件"

2. **扫描文件**：
   - 点击"开始扫描"按钮
   - 等待扫描完成

3. **选择删除**：
   - 查看扫描结果
   - 勾选要删除的项目
   - 点击"删除选中项目"
   - 确认删除操作

## 扫描规则

### 会被清理的文件：
- 空目录
- 临时文件（.tmp, .log, .cache等）
- 备份文件（.bak, .old等）
- 系统文件（.DS_Store, Thumbs.db等）
- 其他非Obsidian支持的文件格式

### 不会被清理的文件：
- Markdown文件（.md）
- Canvas文件（.canvas）
- 图片文件（.jpg, .png, .gif, .svg等）
- 音频文件（.mp3, .wav等）
- 视频文件（.mp4, .webm等）
- PDF文件（.pdf）
- 其他Obsidian支持的格式

## 安全机制

- ✅ 删除前需要用户确认
- ✅ 显示详细的删除列表
- ✅ 自动排除重要文件格式
- ✅ 错误处理和日志记录

## 开发

### 环境要求

- Node.js 16+
- pnpm

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm run dev

# 构建生产版本
pnpm run build

# 版本更新
pnpm version patch
```

### 项目结构

```
clean-files/
├── main.ts          # 插件主文件
├── scanner.ts       # 文件扫描服务
├── ui.ts           # 用户界面组件
├── types.ts        # 类型定义
├── styles.css      # 样式文件
├── manifest.json   # 插件清单
├── package.json    # 项目配置
└── README.md       # 说明文档
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 基本的扫描和删除功能
- 简洁的用户界面
- 安全的删除确认机制