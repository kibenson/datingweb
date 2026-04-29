/**
 * character.js - 角色生成模块
 * 负责随机生成相亲对象的详细信息卡片
 */

// ===== 数据池 =====

/** 男性常见姓名 */
const MALE_NAMES = [
  '伟强', '志远', '浩然', '俊杰', '宇轩', '天宇', '子豪', '明轩',
  '嘉豪', '思远', '建国', '文博', '晨阳', '鑫磊', '云飞', '永昌',
  '子睿', '博文', '旭东', '哲远'
];

/** 女性常见姓名 */
const FEMALE_NAMES = [
  '婉儿', '雨桐', '诗涵', '梦琪', '欣怡', '晨曦', '若晴', '嘉怡',
  '佳欣', '紫萱', '淑雅', '雪莹', '思雨', '芷若', '凌云', '婧涵',
  '月儿', '静怡', '冰冰', '小雅'
];

/** 常见姓氏 */
const SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'
];

/** 职业列表（男性倾向） */
const MALE_JOBS = [
  '产品经理', '软件工程师', '数据分析师', '建筑师', '医生',
  '摄影师', '品牌策划', '金融分析师', '市场总监', '创业者',
  '机械工程师', '教师', '律师', '设计师', '运营专家'
];

/** 职业列表（女性倾向） */
const FEMALE_JOBS = [
  '平面设计师', 'UI设计师', '教师', '护士', '运营经理',
  '摄影师', '公关策划', '新媒体编辑', '产品经理', '市场专员',
  '翻译', '心理咨询师', '主持人', '美妆博主', '人力资源'
];

/** 身高范围（厘米） */
const MALE_HEIGHTS = ['172', '173', '175', '176', '178', '180', '181', '183', '185'];
const FEMALE_HEIGHTS = ['158', '160', '162', '163', '165', '167', '168', '170'];

/** 性格标签 */
const PERSONALITY_TAGS = [
  '开朗活泼', '温柔体贴', '幽默风趣', '知性优雅', '运动健将',
  '文艺青年', '成熟稳重', '可爱甜美', '独立自强', '浪漫主义',
  '务实派', '冒险家', '暖心大叔', '学霸型', '话唠星人'
];

/** 兴趣爱好池 */
const HOBBIES_POOL = [
  '旅行', '摄影', '阅读', '健身', '美食探店', '听音乐', '看电影',
  '绘画', '登山徒步', '瑜伽', '游泳', '烘焙', '编程', '桌游',
  '骑行', '冥想', '玩游戏', '看展', '学外语', '养猫', '弹吉他',
  '手工制作', '跑步', '网球', '滑板'
];

/** 男性头像 emoji */
const MALE_AVATARS = ['👨', '👨‍💻', '👨‍🎨', '👨‍⚕️', '👨‍🏫', '🧑‍💼', '👨‍🍳', '🧑‍🎤', '👨‍🔬', '🧑‍✈️'];

/** 女性头像 emoji */
const FEMALE_AVATARS = ['👩', '👩‍💻', '👩‍🎨', '👩‍⚕️', '👩‍🏫', '🧑‍💼', '👩‍🍳', '🧑‍🎤', '👩‍🔬', '👩‍🎤'];

/**
 * 10种人设模板（聊天风格特征）
 * 每种人设定义了：风格描述、系统提示词关键词
 */
const PERSONA_TEMPLATES = [
  {
    id: 'lively',
    style: '喜欢用emoji，说话简短有趣，经常发笑脸和小表情',
    emojiRate: 'high',
    openingHint: '第一句话要活泼，带emoji'
  },
  {
    id: 'gentle',
    style: '温柔含蓄，说话细腻，喜欢问对方感受，用"嗯嗯"、"哈哈"等语气词',
    emojiRate: 'medium',
    openingHint: '第一句话温柔亲切'
  },
  {
    id: 'humorous',
    style: '爱开玩笑，喜欢用俏皮话，有时会说冷笑话，幽默风趣',
    emojiRate: 'medium',
    openingHint: '第一句话带点幽默'
  },
  {
    id: 'intellectual',
    style: '说话理性，喜欢分享见解，用词准确，偶尔引用名言',
    emojiRate: 'low',
    openingHint: '第一句话知性有内涵'
  },
  {
    id: 'sporty',
    style: '充满活力，喜欢聊运动话题，说话直接爽朗，常提健身打球',
    emojiRate: 'medium',
    openingHint: '第一句话活力十足'
  },
  {
    id: 'artistic',
    style: '文艺范，说话有诗意，喜欢聊音乐电影书籍，感性细腻',
    emojiRate: 'low',
    openingHint: '第一句话有文艺气息'
  },
  {
    id: 'mature',
    style: '成熟稳重，说话平实，关注生活细节，给人安全感',
    emojiRate: 'low',
    openingHint: '第一句话稳重有气质'
  },
  {
    id: 'sweet',
    style: '超级可爱，说话娇憨，喜欢用"嘿嘿"、"哇哦"，萌萌哒',
    emojiRate: 'high',
    openingHint: '第一句话超可爱'
  },
  {
    id: 'independent',
    style: '独立自信，说话干练，有主见，不依赖，谈自己经历多',
    emojiRate: 'low',
    openingHint: '第一句话展现自信'
  },
  {
    id: 'romantic',
    style: '浪漫感性，喜欢制造惊喜，说话带诗意，有仪式感',
    emojiRate: 'medium',
    openingHint: '第一句话浪漫有情调'
  }
];

/** 个性签名模板 */
const SIGNATURES = [
  '生活不止眼前的苟且，还有诗和远方 ✨',
  '努力工作，认真生活，偶尔发呆 🌙',
  '喜欢平静的生活，也期待一点小惊喜 🌸',
  '愿意为了喜欢的事情付出一切 💪',
  '相信每一次相遇都是缘分 🍀',
  '努力成为更好的自己，遇见更好的你 🌟',
  '热爱生活的每一个细节 🎈',
  '简单快乐，是我追求的人生哲学 ☀️',
  '爱笑的人运气不会太差 😊',
  '人生苦短，多吃点好的 🍜'
];

// ===== 工具函数 =====

/**
 * 从数组中随机取一个元素
 * @param {Array} arr
 * @returns {*}
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 从数组中随机取 n 个不重复的元素
 * @param {Array} arr
 * @param {number} n
 * @returns {Array}
 */
function randomItems(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * 生成随机年龄（25-35岁）
 * @returns {number}
 */
function randomAge() {
  return Math.floor(Math.random() * 11) + 25;
}

/**
 * 生成随机中文姓名
 * @param {string} gender - 'male' | 'female'
 * @returns {string}
 */
function generateName(gender) {
  const surname = randomItem(SURNAMES);
  const given = randomItem(gender === 'male' ? MALE_NAMES : FEMALE_NAMES);
  // 随机决定是单字名还是双字名
  if (Math.random() < 0.3) {
    return surname + given.charAt(0); // 单字名
  }
  return surname + given;
}

// ===== 主要导出函数 =====

/**
 * 生成一个异性角色卡片数据
 * @param {string} userGender - 用户性别 'male' | 'female'
 * @returns {Object} 角色数据对象
 */
function generateCharacter(userGender) {
  // 生成相反性别
  const targetGender = userGender === 'male' ? 'female' : 'male';

  const name = generateName(targetGender);
  const age = randomAge();
  const height = randomItem(targetGender === 'male' ? MALE_HEIGHTS : FEMALE_HEIGHTS);
  const job = randomItem(targetGender === 'male' ? MALE_JOBS : FEMALE_JOBS);
  const avatar = randomItem(targetGender === 'male' ? MALE_AVATARS : FEMALE_AVATARS);

  // 随机2-3个性格标签
  const personalityTags = randomItems(PERSONALITY_TAGS, Math.random() < 0.5 ? 2 : 3);

  // 随机3-5个兴趣爱好
  const hobbyCount = Math.floor(Math.random() * 3) + 3;
  const hobbies = randomItems(HOBBIES_POOL, hobbyCount);

  // 随机签名
  const signature = randomItem(SIGNATURES);

  // 随机人设模板
  const persona = randomItem(PERSONA_TEMPLATES);

  return {
    id: Date.now() + Math.random(), // 唯一ID
    gender: targetGender,
    name,
    age,
    height: `${height}cm`,
    job,
    avatar,
    personalityTags,
    hobbies,
    signature,
    persona // 包含聊天风格信息
  };
}

/**
 * 生成多个不重复的角色卡片
 * @param {string} userGender - 用户性别
 * @param {number} count - 生成数量（默认3）
 * @returns {Array<Object>}
 */
function generateCharacters(userGender, count = 3) {
  const characters = [];
  const usedPersonaIds = new Set();

  for (let i = 0; i < count; i++) {
    let character;
    let attempts = 0;

    // 尽量避免人设重复
    do {
      character = generateCharacter(userGender);
      attempts++;
    } while (usedPersonaIds.has(character.persona.id) && attempts < 10);

    usedPersonaIds.add(character.persona.id);
    characters.push(character);
  }

  return characters;
}

/**
 * 生成角色的系统提示词（供AI使用）
 * @param {Object} character - 角色数据
 * @param {string} userGender - 用户性别
 * @returns {string}
 */
function buildSystemPrompt(character, userGender) {
  const userGenderLabel = userGender === 'male' ? '男生' : '女生';
  const selfGenderLabel = character.gender === 'male' ? '男生' : '女生';

  return `你正在扮演一个相亲对象，你的信息如下：
名字：${character.name}
年龄：${character.age}岁
职业：${character.job}
身高：${character.height}
性格：${character.personalityTags.join('、')}
兴趣爱好：${character.hobbies.join('、')}
个性签名：${character.signature}

你的聊天风格：${character.persona.style}

你正在和一位${userGenderLabel}相亲，你是${selfGenderLabel}。

重要规则：
1. 每次回复控制在15-50字以内，要符合真实聊天节奏，不要说长篇大论
2. 聊天内容围绕相亲场景：礼貌寒暄、兴趣爱好交流、工作生活话题
3. 严格按照你的性格和聊天风格回复，体现你的个性
4. 自然地在对话中提及你的兴趣爱好
5. 避免过于私密、政治敏感或不适当的话题
6. 用中文回复，保持真实感，不要太正式也不要太随意
7. 可以适当地反问对方，推进对话`;
}

// 导出模块（兼容浏览器环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateCharacter, generateCharacters, buildSystemPrompt };
}
