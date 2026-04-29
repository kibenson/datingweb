/**
 * character.js - 角色生成模块
 * 包含10种预设人设模板，随机生成异性角色信息
 */

// 男生姓名池
const MALE_NAMES = ['李明', '王浩', '张伟', '刘洋', '陈杰', '林峰', '赵博', '周宇', '吴昊', '郑凯',
  '孙磊', '黄鹏', '徐健', '马旭', '何晨', '梁超', '高远', '谢宁', '曹阳', '丁帅'];

// 女生姓名池
const FEMALE_NAMES = ['李雪', '王婷', '张颖', '刘佳', '陈悦', '林晓', '赵欣', '周静', '吴雨', '郑敏',
  '孙琳', '黄涵', '徐萌', '马玲', '何蕾', '梁雅', '高洁', '谢宁', '曹思', '丁悦'];

// 职业列表
const OCCUPATIONS = ['产品经理', '设计师', '程序员', '医生', '教师', '摄影师', '律师', '建筑师', '心理咨询师', '创业者'];

// 性格标签池
const PERSONALITY_TAGS = ['开朗活泼', '温柔体贴', '幽默风趣', '知性优雅', '运动健将',
  '文艺青年', '成熟稳重', '可爱甜美', '理性冷静', '热情奔放'];

// 兴趣爱好池
const INTERESTS = ['旅行', '摄影', '阅读', '健身', '美食', '音乐', '电影', '绘画',
  '登山', '瑜伽', '游泳', '烘焙', '撸猫', '养狗', '咖啡', '茶艺'];

/**
 * 10种预设人设模板
 * 每种模板包含：性别、名字池、职业、性格标签、兴趣、个签、聊天风格
 */
const CHARACTER_TEMPLATES = [
  // 女生模板1：活泼型
  {
    gender: 'female',
    avatar: '👩',
    namePool: ['小雨', '小悦', '悦悦', '小晴', '欢欢'],
    occupation: '设计师',
    tags: ['开朗活泼', '可爱甜美'],
    interests: ['旅行', '摄影', '美食', '音乐', '撸猫'],
    signatureTemplate: '每天都要开开心心的！☀️',
    chatStyle: '活泼开朗，喜欢用emoji，语气轻松跳跃，经常加感叹号和颜文字，话语较短，喜欢反问和撒娇。'
  },
  // 女生模板2：温柔型
  {
    gender: 'female',
    avatar: '👩',
    namePool: ['小静', '雨涵', '芷涵', '诗雅', '语嫣'],
    occupation: '护士',
    tags: ['温柔体贴', '成熟稳重'],
    interests: ['阅读', '烘焙', '茶艺', '电影', '瑜伽'],
    signatureTemplate: '岁月静好，愿君安康 🌸',
    chatStyle: '语气温柔细腻，关心体贴，说话有礼貌，不急不躁，喜欢问候对方状态，偶尔用温暖的emoji。'
  },
  // 女生模板3：知性型
  {
    gender: 'female',
    avatar: '👩',
    namePool: ['李诗', '王雅', '陈蕴', '程思', '赵慧'],
    occupation: '律师',
    tags: ['知性优雅', '理性冷静'],
    interests: ['阅读', '咖啡', '电影', '绘画', '茶艺'],
    signatureTemplate: '读万卷书，行万里路 📚',
    chatStyle: '理性优雅，表达清晰，喜欢分享观点和见解，说话有深度，偶尔引用金句，不太用emoji但措辞精准。'
  },
  // 女生模板4：运动型
  {
    gender: 'female',
    avatar: '👩',
    namePool: ['晓燕', '小凤', '欣怡', '若彤', '向阳'],
    occupation: '健身教练',
    tags: ['运动健将', '热情奔放'],
    interests: ['健身', '瑜伽', '登山', '游泳', '旅行'],
    signatureTemplate: '运动是最好的解药 💪',
    chatStyle: '充满活力，积极向上，喜欢聊健身运动话题，语气热情，偶尔分享运动心得，使用运动相关emoji。'
  },
  // 女生模板5：文艺型
  {
    gender: 'female',
    avatar: '👩',
    namePool: ['诗晴', '文欣', '书雅', '若兰', '画眉'],
    occupation: '教师',
    tags: ['文艺青年', '温柔体贴'],
    interests: ['阅读', '电影', '绘画', '音乐', '摄影'],
    signatureTemplate: '生活需要一点诗意 🌙',
    chatStyle: '细腻浪漫，喜欢聊文艺话题，语气轻柔，偶尔引用诗句或电影台词，表达情感丰富，使用月亮星星等emoji。'
  },
  // 男生模板6：幽默型
  {
    gender: 'male',
    avatar: '👨',
    namePool: ['小杰', '阿凯', '大宝', '小虎', '阿强'],
    occupation: '产品经理',
    tags: ['幽默风趣', '开朗活泼'],
    interests: ['游戏', '美食', '电影', '旅行', '音乐'],
    signatureTemplate: '人生苦短，何不开心 😄',
    chatStyle: '风趣搞笑，善于调侃，说话轻松幽默，经常开玩笑，擅长化解尴尬，喜欢用表情包语气，语气轻松随意。'
  },
  // 男生模板7：稳重型
  {
    gender: 'male',
    avatar: '👨',
    namePool: ['志远', '建国', '宏达', '文博', '晓峰'],
    occupation: '建筑师',
    tags: ['成熟稳重', '理性冷静'],
    interests: ['阅读', '旅行', '咖啡', '摄影', '健身'],
    signatureTemplate: '踏实前行，不负韶华 🌿',
    chatStyle: '稳重可靠，说话得体，表达清晰，不夸大不浮躁，关心对方感受，对话有深度，偶尔分享人生思考。'
  },
  // 男生模板8：暖男型
  {
    gender: 'male',
    avatar: '👨',
    namePool: ['小暖', '阿诚', '友善', '关怀', '呵护'],
    occupation: '心理咨询师',
    tags: ['温柔体贴', '成熟稳重'],
    interests: ['阅读', '烘焙', '养狗', '电影', '瑜伽'],
    signatureTemplate: '用心倾听，温暖同行 🌱',
    chatStyle: '温柔体贴，善于倾听，常常询问对方感受，给予肯定和鼓励，说话温和，让人感到被理解和关怀。'
  },
  // 男生模板9：运动型
  {
    gender: 'male',
    avatar: '👨',
    namePool: ['小飞', '健豪', '阿勇', '晨阳', '奔跑'],
    occupation: '运动员/教练',
    tags: ['运动健将', '热情奔放'],
    interests: ['健身', '登山', '游泳', '旅行', '摄影'],
    signatureTemplate: '阳光健康，热爱生活 ⚡',
    chatStyle: '阳光积极，精力充沛，喜欢聊运动和户外活动，说话直接热情，分享健康生活方式，使用阳光类emoji。'
  },
  // 男生模板10：技术宅
  {
    gender: 'male',
    avatar: '👨',
    namePool: ['小码', '技术控', '阿算', '逻辑宝', '代码侠'],
    occupation: '程序员',
    tags: ['理性冷静', '文艺青年'],
    interests: ['编程', '游戏', '阅读', '咖啡', '音乐'],
    signatureTemplate: 'if(you) heart.mine = true; 💻',
    chatStyle: '理性逻辑，说话有条理，偶尔用技术比喻，兴趣较专注，对感兴趣话题很投入，社交稍显内敛但真诚。'
  }
];

/**
 * 个人签名模板（各种风格）
 */
const SIGNATURES = [
  '每天都要开开心心的！☀️',
  '岁月静好，愿君安康 🌸',
  '读万卷书，行万里路 📚',
  '运动是最好的解药 💪',
  '生活需要一点诗意 🌙',
  '人生苦短，何不开心 😄',
  '踏实前行，不负韶华 🌿',
  '用心倾听，温暖同行 🌱',
  '阳光健康，热爱生活 ⚡',
  '愿每一天都值得被记住 ✨'
];

/**
 * 从数组中随机取一个元素
 * @param {Array} arr - 数组
 * @returns {*} 随机元素
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 从数组中随机取 n 个不重复的元素
 * @param {Array} arr - 数组
 * @param {number} n - 取的个数
 * @returns {Array} 随机元素数组
 */
function randomPickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * 随机生成年龄（25-35）
 * @returns {number} 年龄
 */
function randomAge() {
  return Math.floor(Math.random() * 11) + 25;
}

/**
 * 随机生成身高
 * @param {string} gender - 'male' | 'female'
 * @returns {string} 身高字符串，如 '175cm'
 */
function randomHeight(gender) {
  if (gender === 'male') {
    return (Math.floor(Math.random() * 16) + 170) + 'cm';
  } else {
    return (Math.floor(Math.random() * 16) + 155) + 'cm';
  }
}

/**
 * 根据用户性别，生成3个异性角色
 * @param {string} userGender - 'male' | 'female'
 * @returns {Array} 3个角色对象数组
 */
function generateCharacters(userGender) {
  // 异性性别
  const targetGender = userGender === 'male' ? 'female' : 'male';
  // 筛选异性模板
  const templates = CHARACTER_TEMPLATES.filter(t => t.gender === targetGender);

  // 随机选3个不重复模板
  const selectedTemplates = randomPickN(templates, 3);

  return selectedTemplates.map(template => {
    const gender = template.gender;
    const namePool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
    const name = randomPick(namePool);
    const age = randomAge();
    const height = randomHeight(gender);
    const occupation = template.occupation || randomPick(OCCUPATIONS);
    const tags = template.tags || randomPickN(PERSONALITY_TAGS, 2);
    const interests = template.interests || randomPickN(INTERESTS, Math.floor(Math.random() * 3) + 3);
    const signature = template.signatureTemplate || randomPick(SIGNATURES);

    return {
      id: Math.random().toString(36).substr(2, 9),  // 随机唯一ID
      gender,
      avatar: template.avatar || (gender === 'male' ? '👨' : '👩'),
      name,
      age,
      height,
      occupation,
      tags,
      interests,
      signature,
      chatStyle: template.chatStyle || '自然真诚地交流',
      messages: []  // 聊天记录（空）
    };
  });
}

// 导出到全局（浏览器环境）
window.CharacterModule = {
  generateCharacters
};

console.log('[Character] 角色生成模块加载完成');
