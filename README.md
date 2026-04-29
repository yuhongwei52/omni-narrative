# 🌌 OmniNarrative - AI 驱动的无尽互动小说引擎

OmniNarrative 是一款基于最新一代大语言模型（LLM）构建的动态文字冒险与互动小说引擎。系统能够根据玩家的自由输入实时推演剧情，生成拥有无限分支的沉浸式虚拟世界。

## ✨ 核心特性

- 🎭 极高自由度的互动：玩家可以通过自然语言输入任何行动，AI 将根据物理法则和既定世界观逻辑，实时推演并描述后续发展。
- 🧠 动态世界观加载：支持在初始化阶段自定义剧本类型与背景设定，AI 驱动引擎将严格遵循设定的世界规则。
- 🔌 灵活的 API 驱动：兼容标准的 OpenAI Chat Completions API 格式。只需填入 API Key 即可一键接入主流大模型。
- 💻 极客风 UI 设计：现代化的暗黑极客主题界面，配备响应式布局和打字机式剧情加载动效。

## 🚀 快速开始

环境依赖：Node.js 与 npm

1. 克隆仓库到本地:
git clone https://github.com/yuhongwei52/omni-narrative.git
cd omni-narrative

2. 安装项目依赖:
npm install

3. 启动本地开发服务器:
npm run dev

## ⚙️ 如何配置大模型 API

1. 打开应用左侧的“设置区域”。
2. API Key：填入你的有效密钥。
3. API 接口地址：根据服务商填写（例如 https://api.xiaomimimo.com/v1/chat/completions ）。
4. 模型名称：填入模型 ID（例如 mimo-v2.5-pro ）。
5. 演示模式：若无 API Key，可直接点击“载入世界引擎”运行内置预览。

## 🛠️ 技术栈
- 前端框架: React.js (Vite)
- UI 样式: Tailwind CSS
- 图标组件: Lucide React

本项目采用 MIT License 开源许可协议。