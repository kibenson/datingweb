/**
 * chat.js - 聊天功能模块
 * 负责AI对话交互、打字动画、消息渲染等
 */

/** 聊天状态管理 */
const ChatState = {
  character: null,        // 当前相亲对象
  userGender: null,       // 用户性别
  messages: [],           // 完整对话历史 [{role, content}]
  isLoading: false,       // 是否正在等待AI回复
  roundCount: 0,          // 对话轮次
  startTime: null,        // 开始时间
  apiConfig: null         // API配置
};

/**
 * 初始化聊天模块
 * @param {Object} character - 角色数据
 * @param {string} userGender - 用户性别
 * @param {Object} config - API配置 { apiKey, baseUrl }
 */
function initChat(character, userGender, config) {
  ChatState.character = character;
  ChatState.userGender = userGender;
  ChatState.messages = [];
  ChatState.isLoading = false;
  ChatState.roundCount = 0;
  ChatState.startTime = Date.now();
  ChatState.apiConfig = config;

  // 设置聊天页头部信息
  updateChatHeader(character);

  // 清空消息区
  const messagesEl = document.getElementById('chat-messages');
  if (messagesEl) {
    messagesEl.innerHTML = '';
    // 添加开始时间标签
    appendTimeLabel(messagesEl, '今天');
  }

  // 更新轮次计数
  updateRoundCounter();

  // 触发AI发送开场白
  sendOpeningMessage();
}

/**
 * 更新聊天头部信息
 * @param {Object} character
 */
function updateChatHeader(character) {
  const avatarEl = document.getElementById('chat-header-avatar');
  const nameEl = document.getElementById('chat-header-name');
  if (avatarEl) avatarEl.textContent = character.avatar;
  if (nameEl) nameEl.textContent = character.name;
}

/**
 * AI发送开场白
 */
async function sendOpeningMessage() {
  const { character, userGender } = ChatState;
  const openingPrompt = `请用一句话打招呼，${character.persona.openingHint}，要符合你的性格特点`;

  try {
    await requestAIReply(openingPrompt, true);
  } catch (e) {
    // 开场白失败时使用默认文案
    const defaultOpenings = [
      `你好呀～我是${character.name}，很高兴认识你 😊`,
      `嗨！终于等到你了，我是${character.name}～`,
      `哦哦，你好！我叫${character.name}，幸会幸会～`,
    ];
    const opening = defaultOpenings[Math.floor(Math.random() * defaultOpenings.length)];
    appendAIMessage(opening);
    ChatState.messages.push({ role: 'assistant', content: opening });
  }
}

/**
 * 用户发送消息
 * @param {string} text - 消息内容
 */
async function userSendMessage(text) {
  if (!text.trim() || ChatState.isLoading) return;

  const trimmed = text.trim();

  // 渲染用户消息
  appendUserMessage(trimmed);

  // 加入历史
  ChatState.messages.push({ role: 'user', content: trimmed });
  ChatState.roundCount++;
  updateRoundCounter();

  // 请求AI回复
  await requestAIReply(trimmed, false);
}

/**
 * 请求AI回复
 * @param {string} userInput - 用户输入（开场白时为提示词）
 * @param {boolean} isOpening - 是否为开场白
 */
async function requestAIReply(userInput, isOpening) {
  if (ChatState.isLoading) return;
  ChatState.isLoading = true;

  const messagesEl = document.getElementById('chat-messages');

  // 显示打字动画
  const typingEl = appendTypingIndicator(messagesEl);

  try {
    let reply;

    if (ChatState.apiConfig && ChatState.apiConfig.enabled) {
      // 真实API调用
      reply = await callQwenAPI(userInput, isOpening);
    } else {
      // 模拟回复（无API时）
      await simulateDelay(800 + Math.random() * 800);
      reply = generateMockReply(ChatState.character, userInput, isOpening);
    }

    // 移除打字动画
    typingEl.remove();

    // 渲染AI消息（逐字显示）
    await appendAIMessageTyping(reply, messagesEl);

    // 加入历史
    if (!isOpening) {
      ChatState.messages.push({ role: 'assistant', content: reply });
    } else {
      ChatState.messages.push({ role: 'assistant', content: reply });
    }

  } catch (error) {
    typingEl.remove();
    console.error('AI回复失败:', error);
    const errMsg = '抱歉，网络好像有点问题，稍等一下呢～';
    appendAIMessage(errMsg);
    ChatState.messages.push({ role: 'assistant', content: errMsg });
    showToast('AI回复失败，请检查API配置');
  } finally {
    ChatState.isLoading = false;
  }
}

/**
 * 调用千问API（通过后端代理）
 * @param {string} userInput
 * @param {boolean} isOpening
 * @returns {Promise<string>}
 */
async function callQwenAPI(userInput, isOpening) {
  const { character, userGender, messages, apiConfig } = ChatState;

  // 构建消息列表
  const systemPrompt = buildSystemPrompt(character, userGender);
  const apiMessages = [
    { role: 'system', content: systemPrompt }
  ];

  if (isOpening) {
    // 开场白：让AI主动打招呼
    apiMessages.push({ role: 'user', content: userInput });
  } else {
    // 加入历史对话（最多保留最近20条）
    const recentMessages = messages.slice(-20);
    apiMessages.push(...recentMessages);
  }

  const requestBody = {
    messages: apiMessages,
    character: character
  };

  // 优先使用后端代理
  const proxyUrl = apiConfig.proxyUrl || 'http://localhost:3000/api/chat';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000) // 30秒超时
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.reply || data.content || '嗯嗯，说得对～';
}

/**
 * 生成模拟回复（无API时使用）
 * @param {Object} character
 * @param {string} userInput
 * @param {boolean} isOpening
 * @returns {string}
 */
function generateMockReply(character, userInput, isOpening) {
  const { name, personalityTags, hobbies, persona } = character;

  if (isOpening) {
    const openings = {
      lively: `嗨嗨！我是${name}，很高兴认识你呀～😊`,
      gentle: `你好，我是${name}，今天能认识你很开心 😊`,
      humorous: `哦豁，缘分啊！我是${name}，请多关照哈哈`,
      intellectual: `你好，我是${name}。听说缘分这东西，妙不可言。`,
      sporty: `嘿！我是${name}，感觉你是个有活力的人！`,
      artistic: `你好呀，${name}。很高兴在这里遇见你～`,
      mature: `你好，我是${name}，希望我们能聊得来。`,
      sweet: `嘿嘿，你好呀！我是${name}～好开心认识你！🌸`,
      independent: `你好，我是${name}，很高兴有机会了解你。`,
      romantic: `遇见你，应该是今天最美好的事 ✨ 我叫${name}～`
    };
    return openings[persona.id] || `你好，我是${name}，很高兴认识你 😊`;
  }

  // 基于输入关键词生成回复
  const input = userInput.toLowerCase();
  const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
  const tag = personalityTags[0];

  if (input.includes('你好') || input.includes('hi') || input.includes('hello')) {
    return `哈哈，你好你好～ 感觉你挺有趣的，你平时喜欢做什么呀？`;
  }
  if (input.includes('工作') || input.includes('职业') || input.includes('上班')) {
    return `我是做${character.job}的，工作挺忙的但很有意思。你呢？`;
  }
  if (input.includes('爱好') || input.includes('兴趣') || input.includes('喜欢')) {
    return `我超喜欢${hobby}！还有${hobbies[1] || '旅行'}，感觉这些能让生活更丰富 😊 你有什么爱好？`;
  }
  if (input.includes('吃') || input.includes('美食') || input.includes('饭')) {
    return `哈哈说到吃我可来劲了！你喜欢吃什么类型的？`;
  }
  if (input.includes('电影') || input.includes('剧') || input.includes('综艺')) {
    return `最近确实没怎么看，你有什么好推荐吗？`;
  }
  if (input.includes('旅行') || input.includes('旅游') || input.includes('去过')) {
    return `我也好喜欢旅行！感觉旅行能开阔眼界，你最喜欢哪个地方？`;
  }

  // 通用回复池
  const genericReplies = [
    `你说的这个我也有同感，${tag}的我觉得很重要 😊`,
    `哈哈这个话题好有趣，我觉得呢……${hobby}可能更能放松心情？`,
    `嗯嗯，你是个很有想法的人！我喜欢和这样的人聊天 ✨`,
    `哦对了，你平时周末都怎么过的？`,
    `感觉我们聊得挺投机的，真好～`,
    `你这个角度很特别，没想到这样想……哈哈`,
    `我也这么觉得！真的！感觉有缘分 🍀`
  ];

  return genericReplies[Math.floor(Math.random() * genericReplies.length)];
}

// ===== DOM 操作函数 =====

/**
 * 添加时间标签
 * @param {HTMLElement} container
 * @param {string} text
 */
function appendTimeLabel(container, text) {
  const el = document.createElement('div');
  el.className = 'time-label';
  el.textContent = text;
  container.appendChild(el);
  scrollToBottom(container);
}

/**
 * 添加用户消息气泡
 * @param {string} text
 */
function appendUserMessage(text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'msg user';
  msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  container.appendChild(msg);
  scrollToBottom(container);
}

/**
 * 添加AI消息气泡（直接显示，不打字）
 * @param {string} text
 */
function appendAIMessage(text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const avatar = ChatState.character ? ChatState.character.avatar : '🤖';
  const msg = document.createElement('div');
  msg.className = 'msg ai';
  msg.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  container.appendChild(msg);
  scrollToBottom(container);
}

/**
 * 添加AI消息气泡（打字机效果）
 * @param {string} text
 * @param {HTMLElement} container
 * @returns {Promise}
 */
async function appendAIMessageTyping(text, container) {
  if (!container) container = document.getElementById('chat-messages');
  const avatar = ChatState.character ? ChatState.character.avatar : '🤖';

  const msg = document.createElement('div');
  msg.className = 'msg ai';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = '';

  msg.innerHTML = `<div class="msg-avatar">${avatar}</div>`;
  msg.appendChild(bubble);
  container.appendChild(msg);
  scrollToBottom(container);

  // 逐字显示
  const chars = [...text]; // 支持emoji（Unicode）
  const delay = Math.max(20, Math.min(60, 1200 / chars.length)); // 动态速度

  for (const char of chars) {
    bubble.textContent += char;
    scrollToBottom(container);
    await simulateDelay(delay);
  }
}

/**
 * 添加打字动画气泡
 * @param {HTMLElement} container
 * @returns {HTMLElement} 动画元素（用于后续删除）
 */
function appendTypingIndicator(container) {
  if (!container) container = document.getElementById('chat-messages');
  const avatar = ChatState.character ? ChatState.character.avatar : '🤖';

  const wrapper = document.createElement('div');
  wrapper.className = 'msg ai';
  wrapper.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(wrapper);
  scrollToBottom(container);
  return wrapper;
}

/**
 * 更新轮次计数显示
 */
function updateRoundCounter() {
  const el = document.getElementById('round-counter');
  if (el) {
    el.textContent = `已聊 ${ChatState.roundCount} 轮`;
  }
}

/**
 * 滚动到消息底部
 * @param {HTMLElement} container
 */
function scrollToBottom(container) {
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 10);
  }
}

// ===== 工具函数 =====

/**
 * 模拟延迟
 * @param {number} ms
 * @returns {Promise}
 */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 转义HTML特殊字符（防XSS）
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * 显示Toast提示
 * @param {string} msg
 */
function showToast(msg) {
  // 由app.js提供全局实现
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  }
}

/**
 * 获取当前聊天状态（供评分系统使用）
 * @returns {Object}
 */
function getChatState() {
  return {
    character: ChatState.character,
    userGender: ChatState.userGender,
    messages: [...ChatState.messages],
    roundCount: ChatState.roundCount,
    duration: Date.now() - ChatState.startTime
  };
}

// 导出（兼容浏览器环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initChat, userSendMessage, getChatState };
}
