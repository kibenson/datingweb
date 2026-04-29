/**
 * chat.js - 聊天功能模块
 * 负责与后端API通信，实现打字机动画效果
 */

// 后端API地址（本地开发时指向本地服务器）
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : '';  // 生产环境时使用相对路径

/**
 * 构造发送给千问API的系统提示词
 * 严格控制角色风格和回复长度
 * @param {Object} character - 角色对象
 * @returns {string} 系统提示词
 */
function buildSystemPrompt(character) {
  return `你正在扮演一个相亲对象，你的个人信息如下：
名字：${character.name}
年龄：${character.age}岁
身高：${character.height}
职业：${character.occupation}
性格：${character.tags.join('、')}
兴趣爱好：${character.interests.join('、')}
个性签名：${character.signature}
聊天风格：${character.chatStyle}

【重要规则】
1. 严格用15-50个汉字回复，不能超过50字
2. 完全按照上述性格和聊天风格说话
3. 内容围绕：寒暄问候、共同兴趣、工作生活、对方的问题
4. 适当使用emoji（根据性格决定是否多用）
5. 不能说你是AI，不能跳出角色
6. 用第一人称，自然真实地回应
7. 禁止重复之前说过的话
8. 如果对方说"再见"或结束对话，礼貌道别`;
}

/**
 * 调用后端API获取AI回复
 * @param {Object} character - 角色对象
 * @param {Array} messages - 历史消息记录（最近的N条）
 * @returns {Promise<string>} AI回复文本
 */
async function fetchAIReply(character, messages) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        character,
        messages,
        systemPrompt: buildSystemPrompt(character)
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.reply || '（对方没有回复）';
  } catch (error) {
    console.error('[Chat] API调用失败:', error.message);
    // API失败时的友好降级回复
    return getFallbackReply(character, messages);
  }
}

/**
 * API调用失败时的降级回复（预设台词库）
 * @param {Object} character - 角色对象
 * @param {Array} messages - 历史消息
 * @returns {string}
 */
function getFallbackReply(character, messages) {
  // 根据角色性格选择不同风格的降级回复
  const tags = character.tags || [];
  const isLively = tags.includes('开朗活泼') || tags.includes('幽默风趣') || tags.includes('热情奔放');
  const isGentle = tags.includes('温柔体贴') || tags.includes('成熟稳重');

  // 各种场景的回复
  const livelyReplies = [
    `哈哈，你说得对～ 我也觉得呢！😄`,
    `嗯嗯！我平时也喜欢${character.interests[0]}，特别减压！`,
    `哇真的嘛！这个我也感兴趣，有机会可以一起啊 🎉`,
    `你也这样想啊，太有缘了吧！😆`,
    `嗯，感觉我们挺聊得来的，挺好的～`
  ];

  const gentleReplies = [
    `嗯，你说的很有道理，我也有同感 😊`,
    `谢谢你的分享，听你说话感觉很舒服`,
    `是啊，我平时也很喜欢${character.interests[0]}，能放松心情`,
    `感觉我们还挺有共同话题的，很开心认识你`,
    `你是一个很真诚的人，跟你聊天很愉快 🌸`
  ];

  const defaultReplies = [
    `嗯，我也这么觉得，你挺有想法的`,
    `有意思，可以多聊聊你平时都喜欢什么`,
    `我的工作是${character.occupation}，平时比较忙，但空余时间喜欢${character.interests[0]}`,
    `感觉你是个不错的人，期待多了解你`,
    `哈哈，差不多吧，你呢？`
  ];

  const replies = isLively ? livelyReplies : (isGentle ? gentleReplies : defaultReplies);
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 打字机动画：逐字显示文字
 * @param {HTMLElement} element - 要显示文字的DOM元素
 * @param {string} text - 要显示的文本
 * @param {number} speed - 每个字的间隔毫秒数（默认50ms）
 * @returns {Promise<void>} 动画完成后resolve
 */
function typewriterAnimation(element, text, speed = 50) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';

    // 添加光标元素
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);

    function typeNextChar() {
      if (i < text.length) {
        // 在光标前插入字符
        element.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
        setTimeout(typeNextChar, speed);
      } else {
        // 动画结束，移除光标
        cursor.remove();
        resolve();
      }
    }

    typeNextChar();
  });
}

/**
 * 格式化时间为 HH:MM
 * @returns {string}
 */
function formatTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 导出到全局
window.ChatModule = {
  fetchAIReply,
  typewriterAnimation,
  formatTime,
  buildSystemPrompt
};

console.log('[Chat] 聊天模块加载完成');
