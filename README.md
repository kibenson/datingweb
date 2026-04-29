# 网页相亲模拟器 💕

一个完整可运行的手机端相亲模拟器 Web 应用，集成阿里云千问 AI 实现智能对话，支持多角色切换、真实感聊天和多维度相亲评分。

## 功能概述

- 🚻 **性别选择页面**：粉色渐变背景，心形装饰，一键选择性别
- 💝 **配对卡片页面**：根据性别随机生成 3 位异性，支持左右滑动，展示头像、姓名、年龄、职业、性格、兴趣、个性签名
- 💬 **AI聊天页面**：与角色自然对话，AI 回复符合人设风格，打字机动画效果，"对方正在输入…"状态提示
- 📊 **评分报告页面**：结束相亲后展示总体匹配度（0-100）、四个维度评分（进度条）、适合的异性方向、相亲总结与改进建议

## 技术栈

| 类型 | 技术 |
|------|------|
| 前端 | HTML5 / CSS3 / 原生 JavaScript |
| 后端 | Node.js + Express |
| AI接口 | 阿里云千问 API（qwen-turbo） |
| 风格 | 移动端优先，响应式布局 |

## 效果预览

```
页面1：性别选择
  粉色渐变背景 + 漂浮心形装饰
  两个大按钮：「我是男生 👨」 「我是女生 👩」

页面2：配对卡片
  卡片展示：emoji头像 + 姓名 + 基本信息 + 性格标签 + 兴趣爱好 + 个性签名
  支持左右滑动切换3张卡片
  底部「开始聊天」按钮

页面3：聊天对话
  顶部：头像 + 姓名 + 职业 + 「结束相亲」按钮
  AI消息：左侧白色气泡 + 打字机动画
  用户消息：右侧蓝色气泡
  底部固定输入框

页面4：评分报告
  大圆圈显示总分（0-100）
  四维度进度条评分
  个性化推荐 + 相亲总结
  「再来一次」按钮
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/kibenson/datingweb.git
cd datingweb
```

### 2. 安装后端依赖

```bash
cd server
npm install
```

### 3. 配置 API 密钥

```bash
# 在 server/ 目录下创建 .env 文件
echo "QWEN_API_KEY=你的千问API密钥" > .env
```

> 💡 不配置 API 密钥也可以运行，AI 会使用预设的降级回复，但没有智能对话。

### 4. 启动后端服务

```bash
npm start
```

### 5. 访问应用

打开浏览器访问：**http://localhost:3000**

用手机浏览器访问（同局域网）：`http://你的电脑IP:3000`

---

## 千问 API 申请教程

1. **访问阿里云官网**：https://www.aliyun.com/
2. **注册/登录账号**：支持手机号、支付宝等方式
3. **开通模型服务灵积（DashScope）**：
   - 进入控制台 → 搜索"灵积"或访问 https://dashscope.aliyun.com/
   - 点击"开通服务"
4. **获取 API Key**：
   - 控制台右上角 → API-KEY 管理
   - 点击"创建新的 API-KEY"
   - 复制生成的密钥（格式：`sk-xxxxxxxxxx`）
5. **配置到项目**：将密钥写入 `server/.env` 文件

> 新用户有免费 token 额度，日常测试完全够用。

---

## 配置说明

在 `server/.env` 文件中（参考 `config.example.js`）：

```env
# 千问API密钥（必填，不填则使用降级回复）
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 模型选择（可选）
# qwen-turbo  - 响应快，适合日常对话
# qwen-plus   - 平衡性能与质量
# qwen-max    - 最强质量
QWEN_MODEL=qwen-turbo

# 服务端口（可选，默认3000）
PORT=3000
```

---

## 目录结构

```
datingweb/
├── index.html          # 主页面（包含4个页面的HTML结构）
├── css/
│   └── style.css       # 全局样式（移动端优先，粉色主题）
├── js/
│   ├── app.js          # 应用主控制器（页面流程、事件处理）
│   ├── character.js    # 角色生成模块（10种人设模板）
│   ├── chat.js         # 聊天功能（API调用、打字动画）
│   └── scoring.js      # 评分系统（4维度算法）
├── server/
│   ├── server.js       # Express后端（静态文件+API代理）
│   └── package.json    # 后端依赖配置
├── config.example.js   # 配置说明示例
└── README.md           # 项目文档
```

---

## 常见问题

**Q：AI不回复或回复"API未配置"？**
A：请检查 `server/.env` 文件是否存在，且 `QWEN_API_KEY` 填写正确。运行 `curl http://localhost:3000/api/health` 查看状态。

**Q：出现跨域（CORS）错误？**
A：确保通过 `http://localhost:3000` 访问，不要直接双击打开 `index.html`。

**Q：手机无法访问？**
A：查看电脑 IP（`ipconfig` 或 `ifconfig`），用手机访问 `http://电脑IP:3000`，确保手机和电脑在同一局域网。

**Q：千问API调用失败？**
A：检查 API Key 是否正确，账户是否有余额/免费额度，网络是否可以访问阿里云。

---

## 许可证

[MIT](LICENSE) © 2024 kibenson