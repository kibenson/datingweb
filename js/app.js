/**
 * app.js - 主应用逻辑
 * 负责页面路由管理、整体流程控制、UI交互
 */

// ===== 应用状态 =====
const AppState = {
  userGender: null,      // 用户性别 'male' | 'female'
  characters: [],        // 生成的相亲对象列表
  currentCardIndex: 0,   // 当前卡片索引
  selectedCharacter: null, // 选择的对象
  apiConfig: {           // API配置
    enabled: false,      // 是否启用真实API
    proxyUrl: 'http://localhost:3000/api/chat'
  }
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * 初始化应用
 */
function initApp() {
  // 加载配置（如果有的话）
  loadConfig();

  // 绑定全局Toast
  window.showToast = showToast;

  // 显示性别选择页
  showPage('gender');

  // 绑定性别选择按钮
  document.getElementById('btn-male').addEventListener('click', () => {
    selectGender('male');
  });
  document.getElementById('btn-female').addEventListener('click', () => {
    selectGender('female');
  });

  // 绑定结束相亲按钮
  document.getElementById('btn-end-chat').addEventListener('click', endChat);

  // 绑定重新开始
  document.getElementById('btn-restart').addEventListener('click', restartAll);
  document.getElementById('btn-chat-again').addEventListener('click', chatAgain);

  // 绑定发送消息
  const sendBtn = document.getElementById('send-btn');
  const chatInput = document.getElementById('chat-input');

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // 自动调整输入框高度
  chatInput.addEventListener('input', autoResizeInput);
}

/**
 * 加载API配置
 */
function loadConfig() {
  // 尝试从全局CONFIG变量读取（由config.js设置）
  if (typeof CONFIG !== 'undefined' && CONFIG.apiKey) {
    AppState.apiConfig.enabled = true;
    AppState.apiConfig.proxyUrl = CONFIG.proxyUrl || AppState.apiConfig.proxyUrl;
  }

  // 尝试从localStorage读取用户自定义配置
  try {
    const stored = localStorage.getItem('datingweb_config');
    if (stored) {
      const config = JSON.parse(stored);
      if (config.proxyUrl) {
        AppState.apiConfig.proxyUrl = config.proxyUrl;
        AppState.apiConfig.enabled = true;
      }
    }
  } catch (e) {
    // 忽略localStorage错误
  }
}

// ===== 页面路由 =====

/**
 * 切换到指定页面
 * @param {string} pageId - 'gender' | 'cards' | 'chat' | 'score'
 */
function showPage(pageId) {
  const allPages = document.querySelectorAll('.page');

  // 先让当前活跃页退出
  allPages.forEach(page => {
    if (page.classList.contains('active')) {
      page.classList.add('exit-left');
      page.classList.remove('active');
      setTimeout(() => {
        page.classList.remove('exit-left');
      }, 350);
    }
  });

  // 显示目标页
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    setTimeout(() => {
      targetPage.classList.add('active');
    }, 50);
  }
}

// ===== 性别选择 =====

/**
 * 选择性别并跳转到卡片页
 * @param {string} gender - 'male' | 'female'
 */
function selectGender(gender) {
  AppState.userGender = gender;

  // 生成3张异性卡片
  AppState.characters = generateCharacters(gender, 3);
  AppState.currentCardIndex = 0;

  // 渲染卡片
  renderCards();

  // 切换页面
  showPage('cards');
}

// ===== 卡片渲染 =====

/**
 * 渲染所有卡片
 */
function renderCards() {
  const track = document.getElementById('cards-track');
  const indicators = document.getElementById('cards-indicators');
  if (!track || !indicators) return;

  track.innerHTML = '';
  indicators.innerHTML = '';

  AppState.characters.forEach((char, index) => {
    // 卡片DOM
    const card = createCardElement(char, index);
    track.appendChild(card);

    // 指示器点
    const dot = document.createElement('div');
    dot.className = 'dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToCard(index));
    indicators.appendChild(dot);
  });

  // 设置初始位置和样式
  updateCardStyles();
  updateCardsPosition();

  // 绑定滑动事件
  initSwipe(track);
}

/**
 * 创建单张卡片DOM元素
 * @param {Object} char - 角色数据
 * @param {number} index - 卡片索引
 * @returns {HTMLElement}
 */
function createCardElement(char, index) {
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.dataset.index = index;

  // 随机渐变色（区分卡片）
  const gradients = [
    'linear-gradient(135deg, #ff6b9d 0%, #c678dd 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ];
  const gradient = gradients[index % gradients.length];

  const tagsHTML = char.personalityTags
    .map(t => `<span class="tag">${t}</span>`)
    .join('');

  const hobbiesHTML = char.hobbies
    .map(h => `<span class="hobby-tag">🎯 ${h}</span>`)
    .join('');

  card.innerHTML = `
    <div class="card-avatar" style="background: ${gradient}">
      <span class="avatar-emoji">${char.avatar}</span>
      <div class="card-badge">${char.job}</div>
    </div>
    <div class="card-body">
      <div class="card-name-row">
        <span class="card-name">${char.name}</span>
        <span class="card-age">${char.age}岁</span>
      </div>
      <div class="card-info-row">
        <span class="info-chip"><span class="icon">📏</span>${char.height}</span>
        <span class="info-chip"><span class="icon">💼</span>${char.job}</span>
      </div>
      <div class="card-tags">${tagsHTML}</div>
      <div class="card-hobbies">${hobbiesHTML}</div>
      <div class="card-signature">"${char.signature}"</div>
      <button class="card-start-btn" onclick="startChat(${index})">
        💌 开始聊天
      </button>
    </div>
  `;

  return card;
}

/**
 * 切换到指定卡片
 * @param {number} index
 */
function goToCard(index) {
  const total = AppState.characters.length;
  if (index < 0 || index >= total) return;
  AppState.currentCardIndex = index;
  updateCardsPosition();
  updateCardStyles();
  updateIndicators();
}

/**
 * 更新卡片轨道位置
 */
function updateCardsPosition() {
  const track = document.getElementById('cards-track');
  if (!track) return;

  // 每张卡片占 80% + 10% margin*2 = 100% 有效宽度
  const cardWidth = 90; // 百分比（80% 宽 + 左右各5% margin）
  const offset = AppState.currentCardIndex * cardWidth;

  // 初始偏移：第一张卡片从 10% 开始（padding）
  track.style.transform = `translateX(calc(-${offset}% + 0px))`;
}

/**
 * 更新卡片中心样式
 */
function updateCardStyles() {
  const cards = document.querySelectorAll('.profile-card');
  cards.forEach((card, i) => {
    if (i === AppState.currentCardIndex) {
      card.classList.add('center-card');
    } else {
      card.classList.remove('center-card');
    }
  });
}

/**
 * 更新指示器状态
 */
function updateIndicators() {
  const dots = document.querySelectorAll('.cards-indicators .dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === AppState.currentCardIndex);
  });
}

// ===== 触摸滑动支持 =====

/**
 * 初始化触摸/鼠标滑动
 * @param {HTMLElement} track
 */
function initSwipe(track) {
  let startX = 0;
  let isDragging = false;

  const getX = (e) => e.touches ? e.touches[0].clientX : e.clientX;

  const onStart = (e) => {
    startX = getX(e);
    isDragging = true;
  };

  const onEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // 向左滑，下一张
        goToCard(AppState.currentCardIndex + 1);
      } else {
        // 向右滑，上一张
        goToCard(AppState.currentCardIndex - 1);
      }
    }
  };

  track.addEventListener('touchstart', onStart, { passive: true });
  track.addEventListener('touchend', onEnd, { passive: true });
  track.addEventListener('mousedown', onStart);
  document.addEventListener('mouseup', onEnd);
}

// ===== 聊天流程 =====

/**
 * 开始和指定角色聊天
 * @param {number} cardIndex - 卡片索引
 */
function startChat(cardIndex) {
  const character = AppState.characters[cardIndex];
  if (!character) return;

  AppState.selectedCharacter = character;

  // 切换到聊天页
  showPage('chat');

  // 初始化聊天模块
  initChat(character, AppState.userGender, AppState.apiConfig);
}

/**
 * 处理发送按钮点击
 */
function handleSend() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  // 发送消息
  userSendMessage(text);

  // 清空输入框
  input.value = '';
  autoResizeInput.call(input);
}

/**
 * 自动调整输入框高度
 */
function autoResizeInput() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
}

// ===== 结束相亲 =====

/**
 * 结束相亲，生成评分报告
 */
function endChat() {
  // 确认对话框
  if (AppState.apiConfig.enabled || confirm('确定要结束这次相亲吗？')) {
    generateAndShowScore();
  }
}

/**
 * 生成并展示评分报告
 */
function generateAndShowScore() {
  // 获取聊天数据
  const chatData = getChatState();

  // 计算评分
  const report = calculateScore(chatData);

  // 切换到评分页
  showPage('score');

  // 渲染报告（延迟一帧，等页面切换完成）
  setTimeout(() => {
    renderScoreReport(report);
  }, 400);
}

// ===== 重新开始 =====

/**
 * 完全重新开始（回到性别选择）
 */
function restartAll() {
  AppState.userGender = null;
  AppState.characters = [];
  AppState.currentCardIndex = 0;
  AppState.selectedCharacter = null;
  showPage('gender');
}

/**
 * 再次聊天（使用同一角色重新开始对话）
 */
function chatAgain() {
  if (!AppState.selectedCharacter) {
    showPage('cards');
    return;
  }
  showPage('chat');
  initChat(AppState.selectedCharacter, AppState.userGender, AppState.apiConfig);
}

// ===== 工具函数 =====

/**
 * 显示Toast提示
 * @param {string} msg
 * @param {number} duration - 显示时长（毫秒）
 */
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * 显示/隐藏加载遮罩
 * @param {boolean} visible
 * @param {string} text
 */
function setLoading(visible, text = '加载中...') {
  const overlay = document.getElementById('loading-overlay');
  const textEl = document.getElementById('loading-text');
  if (!overlay) return;

  if (textEl) textEl.textContent = text;

  if (visible) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}
