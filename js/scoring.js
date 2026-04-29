/**
 * scoring.js - 相亲评分系统模块
 * 基于对话数据计算多维度评分并生成个性化报告
 */

// ===== 评分关键词库 =====

/** 积极话题关键词（提升话题契合度） */
const POSITIVE_TOPIC_KEYWORDS = [
  '旅行', '美食', '音乐', '电影', '读书', '运动', '健身', '摄影', '爱好',
  '喜欢', '有趣', '好玩', '开心', '快乐', '赞', '哇', '棒', '厉害',
  '一起', '周末', '假期', '出去', '尝试', '体验'
];

/** 情感温暖关键词（提升情感温度） */
const WARM_KEYWORDS = [
  '哈哈', '嗯嗯', '好呀', '开心', '有缘', '聊得来', '投机', '理解',
  '懂你', '感同身受', '真的', '确实', '对对', '太棒了', '可爱', '喜欢你',
  '好感', '期待', '再聊', '以后', '下次'
];

/** 深度交流关键词（提升深度分） */
const DEEP_KEYWORDS = [
  '梦想', '目标', '计划', '未来', '人生', '价值观', '理想', '观点',
  '思考', '感悟', '经历', '故事', '成长', '改变', '认为', '觉得',
  '重要', '意义', '影响', '家人', '朋友'
];

/** 冷场/消极关键词（降低评分） */
const NEGATIVE_KEYWORDS = [
  '好吧', '随便', '无所谓', '不知道', '没什么', '算了', '不想聊',
  '再说', '看情况', '懒得'
];

// ===== 评分维度配置 =====
const SCORE_DIMENSIONS = [
  {
    key: 'topicMatch',
    name: '话题契合度',
    icon: '💬',
    maxScore: 30,
    description: '根据对话内容分析双方兴趣是否匹配'
  },
  {
    key: 'interaction',
    name: '互动积极性',
    icon: '⚡',
    maxScore: 25,
    description: '对话轮次、回复活跃度、主动性'
  },
  {
    key: 'emotion',
    name: '情感温度',
    icon: '💕',
    maxScore: 25,
    description: '对话氛围是否愉快、有无尴尬冷场'
  },
  {
    key: 'depth',
    name: '深度交流',
    icon: '🔍',
    maxScore: 20,
    description: '是否有深入了解彼此'
  }
];

// ===== 主要评分函数 =====

/**
 * 计算各维度评分
 * @param {Object} chatData - 聊天数据 { messages, roundCount, character, duration }
 * @returns {Object} 各维度得分
 */
function calculateDimensionScores(chatData) {
  const { messages, roundCount, character } = chatData;

  // 提取用户消息和AI消息
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const aiMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
  const allText = [...userMessages, ...aiMessages].join(' ');
  const userText = userMessages.join(' ');

  // 1. 话题契合度（满分30分）
  const topicScore = calculateTopicScore(userText, allText, character, roundCount);

  // 2. 互动积极性（满分25分）
  const interactionScore = calculateInteractionScore(roundCount, userMessages);

  // 3. 情感温度（满分25分）
  const emotionScore = calculateEmotionScore(allText, userMessages);

  // 4. 深度交流（满分20分）
  const depthScore = calculateDepthScore(userText, roundCount);

  return {
    topicMatch: topicScore,
    interaction: interactionScore,
    emotion: emotionScore,
    depth: depthScore
  };
}

/**
 * 计算话题契合度（30分）
 * @param {string} userText
 * @param {string} allText
 * @param {Object} character
 * @param {number} roundCount
 * @returns {number}
 */
function calculateTopicScore(userText, allText, character, roundCount) {
  let score = 10; // 基础分

  // 匹配角色兴趣爱好（每匹配一个+4分，最多+16分）
  let hobbyMatches = 0;
  for (const hobby of character.hobbies) {
    if (allText.includes(hobby)) hobbyMatches++;
  }
  score += Math.min(hobbyMatches * 4, 16);

  // 匹配通用积极话题关键词
  const topicHits = POSITIVE_TOPIC_KEYWORDS.filter(kw => allText.includes(kw)).length;
  score += Math.min(topicHits * 1.5, 8);

  // 轮次加成（聊得越多话题越丰富）
  if (roundCount >= 5) score += 2;
  if (roundCount >= 10) score += 2;

  // 消极关键词扣分
  const negativeHits = NEGATIVE_KEYWORDS.filter(kw => userText.includes(kw)).length;
  score -= negativeHits * 2;

  return Math.max(5, Math.min(30, Math.round(score)));
}

/**
 * 计算互动积极性（25分）
 * @param {number} roundCount
 * @param {string[]} userMessages
 * @returns {number}
 */
function calculateInteractionScore(roundCount, userMessages) {
  let score = 0;

  // 对话轮次评分（核心指标）
  if (roundCount === 0) return 5;
  if (roundCount >= 3) score += 8;
  if (roundCount >= 6) score += 5;
  if (roundCount >= 10) score += 5;
  if (roundCount >= 15) score += 3;
  if (roundCount < 3) score += roundCount * 2;

  // 用户消息平均长度评分（主动分享信息的指标）
  const avgLength = userMessages.reduce((sum, m) => sum + m.length, 0) / (userMessages.length || 1);
  if (avgLength > 20) score += 4;
  else if (avgLength > 10) score += 2;

  // 问句（主动提问）加分
  const questionCount = userMessages.filter(m => m.includes('？') || m.includes('?') || m.includes('吗') || m.includes('呢')).length;
  score += Math.min(questionCount * 1, 4);

  return Math.max(5, Math.min(25, Math.round(score)));
}

/**
 * 计算情感温度（25分）
 * @param {string} allText
 * @param {string[]} userMessages
 * @returns {number}
 */
function calculateEmotionScore(allText, userMessages) {
  let score = 8; // 基础分

  // 温暖关键词命中
  const warmHits = WARM_KEYWORDS.filter(kw => allText.includes(kw)).length;
  score += Math.min(warmHits * 1.5, 10);

  // emoji使用（表情丰富说明气氛活跃）
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (allText.match(emojiRegex) || []).length;
  score += Math.min(emojiCount * 0.5, 6);

  // 消极关键词扣分
  const negativeHits = NEGATIVE_KEYWORDS.filter(kw => allText.includes(kw)).length;
  score -= negativeHits * 2;

  // 超短回复（说明冷场）扣分
  const coldResponses = userMessages.filter(m => m.length <= 3).length;
  score -= coldResponses * 1.5;

  return Math.max(5, Math.min(25, Math.round(score)));
}

/**
 * 计算深度交流（20分）
 * @param {string} userText
 * @param {number} roundCount
 * @returns {number}
 */
function calculateDepthScore(userText, roundCount) {
  let score = 3;

  // 深度话题关键词
  const depthHits = DEEP_KEYWORDS.filter(kw => userText.includes(kw)).length;
  score += Math.min(depthHits * 2, 10);

  // 聊天越多，深度越高
  if (roundCount >= 8) score += 5;
  else if (roundCount >= 5) score += 3;
  else if (roundCount >= 3) score += 2;

  // 长消息说明分享较深入
  const longMessages = [...userText.split(/[。！？.!?]/)].filter(s => s.length > 30).length;
  score += Math.min(longMessages * 1.5, 4);

  return Math.max(2, Math.min(20, Math.round(score)));
}

/**
 * 根据总分获取评语和emoji
 * @param {number} total
 * @returns {Object} { emoji, title, sub }
 */
function getScoreComment(total) {
  if (total >= 90) {
    return {
      emoji: '🔥',
      title: '天作之合！',
      sub: '你们的化学反应超级强烈，这次相亲堪称完美！'
    };
  } else if (total >= 75) {
    return {
      emoji: '💕',
      title: '缘分匪浅！',
      sub: '聊得很投机，对方对你印象不错，继续保持！'
    };
  } else if (total >= 60) {
    return {
      emoji: '🌸',
      title: '还不错哦！',
      sub: '整体表现良好，有一定好感基础，可以进一步发展～'
    };
  } else if (total >= 40) {
    return {
      emoji: '🤔',
      title: '加油加油！',
      sub: '聊天有些保守，多主动分享自己会更好哦～'
    };
  } else {
    return {
      emoji: '😅',
      title: '继续努力！',
      sub: '这次发挥得有点保守，下次大胆一些，相信你！'
    };
  }
}

/**
 * 根据对话分析生成适合异性的推荐标签
 * @param {Object} chatData
 * @param {Object} dimensionScores
 * @returns {Object} { tags, text }
 */
function generateRecommendations(chatData, dimensionScores) {
  const { messages, character } = chatData;
  const allText = messages.map(m => m.content).join(' ');
  const tags = [];
  const comments = [];

  // 根据互动风格推荐
  if (dimensionScores.emotion >= 20) {
    tags.push('温柔体贴');
    comments.push('你的沟通风格温暖，适合找一个温柔体贴、善于倾听的类型');
  }

  if (dimensionScores.interaction >= 20) {
    tags.push('活泼开朗');
    comments.push('你更适合找一个活泼开朗、能带动气氛的伴侣');
  }

  if (dimensionScores.depth >= 15) {
    tags.push('有思想内涵');
    comments.push('你注重精神交流，建议寻找有共同话题、有内涵的对象');
  }

  // 根据角色兴趣爱好推荐
  const hobbyMentioned = character.hobbies.filter(h => allText.includes(h));
  if (hobbyMentioned.length >= 2) {
    tags.push('共同兴趣爱好');
    comments.push(`你在聊${hobbyMentioned[0]}话题时状态很好，建议寻找有共同兴趣爱好的文艺型对象`);
  }

  // 补充默认标签
  if (tags.length < 3) {
    const defaultTags = ['真诚坦率', '有安全感', '成熟稳重', '幽默有趣', '上进积极'];
    for (const t of defaultTags) {
      if (!tags.includes(t) && tags.length < 4) {
        tags.push(t);
      }
    }
  }

  if (comments.length === 0) {
    comments.push('多主动分享自己的故事，找到一个欣赏你、与你共鸣的人');
  }

  return {
    tags: tags.slice(0, 5),
    text: comments.join('；') + '。'
  };
}

/**
 * 生成亮点与改进建议
 * @param {Object} chatData
 * @param {Object} dimensionScores
 * @returns {Object} { highlights, improvements }
 */
function generateHighlights(chatData, dimensionScores) {
  const { roundCount, messages } = chatData;
  const highlights = [];
  const improvements = [];

  // 亮点
  if (roundCount >= 8) highlights.push('对话持续时间长，展现了真诚的交流意愿');
  if (dimensionScores.emotion >= 18) highlights.push('聊天氛围轻松愉快，情感温度很高');
  if (dimensionScores.depth >= 12) highlights.push('有深入分享自己的想法，让对方更了解你');
  if (dimensionScores.topicMatch >= 22) highlights.push('话题涵盖广泛，展现了丰富的兴趣爱好');
  const questionCount = messages.filter(m => m.role === 'user' && (m.content.includes('？') || m.content.includes('吗'))).length;
  if (questionCount >= 3) highlights.push('善于提问，表现出对对方的关心与兴趣');

  if (highlights.length === 0) highlights.push('完成了这次相亲体验，敢于尝试就是进步！');

  // 改进建议
  if (roundCount < 5) improvements.push('下次多聊几轮，让对方更了解你');
  if (dimensionScores.depth < 10) improvements.push('可以适当分享自己的经历和想法，加深了解');
  if (dimensionScores.interaction < 15) improvements.push('多主动提问，展现你对对方的兴趣');
  if (dimensionScores.emotion < 15) improvements.push('放松心态，多用幽默和emoji活跃气氛');

  if (improvements.length === 0) improvements.push('整体表现很好，继续保持你的真诚与热情！');

  return { highlights, improvements };
}

/**
 * 计算完整评分报告
 * @param {Object} chatData - { messages, roundCount, character, userGender, duration }
 * @returns {Object} 完整报告数据
 */
function calculateScore(chatData) {
  const dimensionScores = calculateDimensionScores(chatData);
  const total = Object.values(dimensionScores).reduce((a, b) => a + b, 0);
  const comment = getScoreComment(total);
  const recommendations = generateRecommendations(chatData, dimensionScores);
  const { highlights, improvements } = generateHighlights(chatData, dimensionScores);

  return {
    total,
    dimensionScores,
    comment,
    recommendations,
    highlights,
    improvements,
    roundCount: chatData.roundCount,
    characterName: chatData.character.name
  };
}

/**
 * 渲染评分报告到页面
 * @param {Object} report - calculateScore返回的数据
 */
function renderScoreReport(report) {
  const { total, dimensionScores, comment, recommendations, highlights, improvements, characterName } = report;

  // 头部
  const headerEl = document.getElementById('score-header-text');
  if (headerEl) headerEl.textContent = `与 ${characterName} 的相亲报告`;

  // 总分
  const numberEl = document.getElementById('score-number');
  if (numberEl) {
    animateNumber(numberEl, 0, total, 1200);
  }

  // 评语
  const emojiEl = document.getElementById('score-emoji');
  const titleEl = document.getElementById('score-title');
  const subEl = document.getElementById('score-sub');
  if (emojiEl) emojiEl.textContent = comment.emoji;
  if (titleEl) titleEl.textContent = comment.title;
  if (subEl) subEl.textContent = comment.sub;

  // 维度评分
  SCORE_DIMENSIONS.forEach(dim => {
    const scoreVal = dimensionScores[dim.key];
    const pct = Math.round((scoreVal / dim.maxScore) * 100);

    const scoreEl = document.getElementById(`dim-score-${dim.key}`);
    const barEl = document.getElementById(`dim-bar-${dim.key}`);

    if (scoreEl) scoreEl.textContent = `${scoreVal}/${dim.maxScore}`;

    if (barEl) {
      // 延迟触发动画
      setTimeout(() => {
        barEl.style.width = `${pct}%`;
      }, 100);
    }
  });

  // 推荐标签
  const recTagsEl = document.getElementById('rec-tags');
  if (recTagsEl) {
    recTagsEl.innerHTML = recommendations.tags
      .map(tag => `<span class="rec-tag">${tag}</span>`)
      .join('');
  }

  const recTextEl = document.getElementById('rec-text');
  if (recTextEl) recTextEl.textContent = recommendations.text;

  // 亮点
  const hlContainer = document.getElementById('highlights-container');
  if (hlContainer) {
    const hlHTML = highlights.map(h => `
      <div class="hl-item">
        <span class="hl-icon">✨</span>
        <span>${h}</span>
      </div>
    `).join('');
    const impHTML = improvements.map(i => `
      <div class="hl-item">
        <span class="hl-icon">💡</span>
        <span>${i}</span>
      </div>
    `).join('');
    hlContainer.innerHTML = hlHTML + impHTML;
  }
}

/**
 * 数字滚动动画
 * @param {HTMLElement} el
 * @param {number} from
 * @param {number} to
 * @param {number} duration
 */
function animateNumber(el, from, to, duration) {
  const start = Date.now();
  function update() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    // 缓动函数
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateScore, renderScoreReport };
}
