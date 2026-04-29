/**
 * scoring.js - 评分系统模块
 * 根据聊天记录计算多维度评分，生成相亲报告
 */

/**
 * 话题相关关键词池（用于检测共同话题）
 */
const TOPIC_KEYWORDS = [
  '旅行', '摄影', '阅读', '健身', '美食', '音乐', '电影', '绘画',
  '登山', '瑜伽', '游泳', '烘焙', '咖啡', '工作', '生活', '爱好',
  '喜欢', '感觉', '觉得', '希望', '梦想', '家人', '朋友', '周末'
];

/**
 * 情感正向词汇（提升情感温度）
 */
const WARM_WORDS = ['哈哈', '嗯嗯', '对', '是啊', '太好了', '真的', '谢谢', '喜欢', '开心', '棒', '好的', '不错', '厉害'];

/**
 * 常用 emoji 列表（用于检测 emoji 数量）
 */
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu;

/**
 * 计算字符串中 emoji 的数量
 * @param {string} text
 * @returns {number}
 */
function countEmoji(text) {
  const matches = text.match(EMOJI_REGEX);
  return matches ? matches.length : 0;
}

/**
 * 计算字符串中关键词的匹配数量
 * @param {string} text
 * @param {Array<string>} keywords
 * @returns {number}
 */
function countKeywords(text, keywords) {
  let count = 0;
  keywords.forEach(kw => {
    if (text.includes(kw)) count++;
  });
  return count;
}

/**
 * 核心评分函数
 * @param {Array} messages - 聊天记录 [{role: 'user'|'ai', content: ''}]
 * @returns {Object} 评分结果
 */
function calculateScore(messages) {
  // 分离用户消息和AI消息
  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'ai');

  // 对话总轮次（以用户发言次数为准）
  const totalRounds = userMessages.length;

  // 所有消息合并文本
  const allText = messages.map(m => m.content).join(' ');
  const userText = userMessages.map(m => m.content).join(' ');

  // ---- 维度1：话题契合度（满分30） ----
  // 算法：共同关键词命中数 / 总消息数 * 30，上限30
  const topicHits = countKeywords(allText, TOPIC_KEYWORDS);
  const topicBase = totalRounds > 0 ? (topicHits / Math.max(totalRounds, 1)) * 8 : 0;
  const topicScore = Math.min(Math.round(topicBase + (topicHits * 0.8)), 30);

  // ---- 维度2：互动积极性（满分25） ----
  // 算法：对话轮次 * 2.5，上限25
  const interactionScore = Math.min(Math.round(totalRounds * 2.5), 25);

  // ---- 维度3：情感温度（满分25） ----
  // 算法：(emoji数量 + 问候词数量) / 总消息数 * 25
  const emojiCount = countEmoji(allText);
  const warmCount = countKeywords(userText, WARM_WORDS);
  const emotionBase = totalRounds > 0
    ? ((emojiCount + warmCount) / Math.max(messages.length, 1)) * 12
    : 0;
  const emotionScore = Math.min(Math.round(emotionBase + (warmCount * 0.5)), 25);

  // ---- 维度4：深度交流（满分20） ----
  // 算法：用户平均消息长度 / 10 * 20
  const avgUserLength = userMessages.length > 0
    ? userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length
    : 0;
  const depthScore = Math.min(Math.round((avgUserLength / 10) * 20), 20);

  // ---- 总分 ----
  const totalScore = topicScore + interactionScore + emotionScore + depthScore;

  // ---- 生成个性化推荐 ----
  const recommendations = generateRecommendations(totalScore, topicScore, interactionScore, emotionScore, depthScore);

  // ---- 生成总结 ----
  const summary = generateSummary(totalScore, totalRounds, topicScore, emotionScore);

  return {
    total: totalScore,
    dimensions: [
      {
        label: '话题契合度',
        score: topicScore,
        max: 30,
        desc: '分析共同话题与兴趣匹配度'
      },
      {
        label: '互动积极性',
        score: interactionScore,
        max: 25,
        desc: '对话轮次与消息活跃度'
      },
      {
        label: '情感温度',
        score: emotionScore,
        max: 25,
        desc: '对话氛围与情感表达'
      },
      {
        label: '深度交流',
        score: depthScore,
        max: 20,
        desc: '是否深入了解彼此'
      }
    ],
    recommendations,
    summary
  };
}

/**
 * 根据各维度评分生成个性化推荐建议
 * @param {number} total
 * @param {number} topic
 * @param {number} interaction
 * @param {number} emotion
 * @param {number} depth
 * @returns {Array<string>}
 */
function generateRecommendations(total, topic, interaction, emotion, depth) {
  const recs = [];

  if (topic >= 20) {
    recs.push('你在话题上表现出色，适合寻找有共同兴趣爱好的伴侣');
  } else {
    recs.push('建议多尝试了解对方的兴趣，共同话题是感情的催化剂');
  }

  if (emotion >= 18) {
    recs.push('你的情感表达很温暖，适合感性体贴、重视情感交流的对象');
  } else {
    recs.push('适当增加情感互动，让对方感受到你的真诚与热情');
  }

  if (depth >= 15) {
    recs.push('你善于深度交流，适合有深度、能聊得来的知性型伴侣');
  } else {
    recs.push('尝试分享更多自己的想法和感受，深度交流能拉近彼此距离');
  }

  if (total >= 70) {
    recs.push('你整体表现优秀，适合活泼开朗、能带动气氛的伴侣');
  } else if (total >= 50) {
    recs.push('建议寻找有共同兴趣的文艺型对象，慢慢培养感情');
  } else {
    recs.push('多练习表达，放开心扉，真诚的交流是最好的开始');
  }

  // 固定推荐一条
  recs.push('找一个欣赏你、也被你欣赏的人，比什么都重要 💕');

  return recs.slice(0, 5);
}

/**
 * 生成相亲总结文字
 * @param {number} total
 * @param {number} rounds
 * @param {number} topic
 * @param {number} emotion
 * @returns {string[]}
 */
function generateSummary(total, rounds, topic, emotion) {
  const lines = [];

  if (rounds === 0) {
    return ['本次相亲还没有开始聊天哦，快去打个招呼吧！💬', '勇敢迈出第一步，缘分就在眼前 💝'];
  }

  if (total >= 75) {
    lines.push(`✨ 亮点：你本次聊天表现非常出色！共进行了 ${rounds} 轮对话，话题自然，互动积极，情感流露真诚，对方一定对你印象深刻！`);
  } else if (total >= 50) {
    lines.push(`💬 亮点：你本次共进行了 ${rounds} 轮对话，整体表现不错，有一定的话题深度和互动质量。`);
  } else {
    lines.push(`💡 亮点：你本次进行了 ${rounds} 轮对话，能够打破沉默已经很棒啦，继续加油！`);
  }

  if (topic >= 20) {
    lines.push('💕 建议：话题契合度很高，可以多深入了解彼此的生活和梦想，感情会升温更快！');
  } else if (emotion >= 15) {
    lines.push('💌 建议：情感表达不错，下次可以多找共同话题，兴趣相投是长久感情的基础。');
  } else {
    lines.push('📝 建议：下次相亲时，多问问对方的兴趣爱好，分享自己的生活故事，让对话更有温度。');
  }

  return lines;
}

// 导出到全局
window.ScoringModule = {
  calculateScore
};

console.log('[Scoring] 评分模块加载完成');
