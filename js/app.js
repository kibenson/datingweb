/**
 * app.js - 应用主控制器
 * 管理页面流程：性别选择 → 卡片浏览 → 聊天 → 评分报告
 */

/**
 * 应用状态对象
 * 统一管理所有全局状态
 */
const appState = {
  userGender: null,       // 用户性别：'male' | 'female'
  characters: [],         // 生成的3个角色数组
  currentCardIndex: 0,    // 当前展示的卡片索引
  currentCharacter: null, // 当前聊天的角色
  chatMessages: [],       // 聊天记录 [{role, content, time}]
  isSending: false,       // 是否正在等待AI回复
};

/**
 * 应用控制对象（挂载到全局 window.app）
 */
const app = {

  // ======================================================
  // 页面切换
  // ======================================================

  /**
   * 切换到指定页面（带动画）
   * @param {string} pageId - 页面ID
   */
  showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    const targetPage = document.getElementById(pageId);

    // 隐藏所有页面
    pages.forEach(p => {
      if (p.classList.contains('active')) {
        p.classList.add('slide-out');
        setTimeout(() => {
          p.classList.remove('active', 'slide-out');
          p.style.display = 'none';
        }, 350);
      }
    });

    // 显示目标页面
    setTimeout(() => {
      targetPage.style.display = 'flex';
      targetPage.classList.add('slide-in');
      // 强制reflow以触发CSS过渡动画（必须读取offsetHeight）
      void targetPage.offsetHeight;
      targetPage.classList.remove('slide-in');
      targetPage.classList.add('active');
    }, 100);
  },

  // ======================================================
  // 页面1：性别选择
  // ======================================================

  /**
   * 用户选择性别
   * @param {string} gender - 'male' | 'female'
   */
  selectGender(gender) {
    console.log('[App] 用户选择性别:', gender);
    appState.userGender = gender;

    // 生成3个异性角色
    appState.characters = CharacterModule.generateCharacters(gender);
    appState.currentCardIndex = 0;

    console.log('[App] 生成角色:', appState.characters.map(c => c.name));

    // 跳转到卡片页
    this.showPage('page-cards');
    // 渲染卡片（延迟等待页面显示）
    setTimeout(() => this.renderCards(), 150);
  },

  // ======================================================
  // 页面2：配对卡片
  // ======================================================

  /**
   * 渲染角色卡片列表
   */
  renderCards() {
    const stack = document.getElementById('card-stack');
    const indicators = document.getElementById('card-indicators');
    const subtitle = document.getElementById('cards-subtitle');

    if (!stack) return;

    // 更新副标题
    const genderText = appState.userGender === 'male' ? '女生' : '男生';
    subtitle.textContent = `为你精选3位优秀${genderText} 💝`;

    // 清空旧内容
    stack.innerHTML = '';
    indicators.innerHTML = '';

    // 生成卡片和指示器
    appState.characters.forEach((char, index) => {
      const card = this.createCardElement(char, index);
      stack.appendChild(card);

      const dot = document.createElement('div');
      dot.className = 'indicator-dot' + (index === 0 ? ' active' : '');
      indicators.appendChild(dot);
    });

    // 显示第0张卡片
    this.updateCardDisplay();
    this.updateNavButtons();
  },

  /**
   * 创建单个卡片DOM元素
   * @param {Object} char - 角色对象
   * @param {number} index - 索引
   * @returns {HTMLElement}
   */
  createCardElement(char, index) {
    const card = document.createElement('div');
    card.className = 'profile-card' + (index === 0 ? ' active' : '');
    card.dataset.index = index;

    // 标签HTML
    const tagsHtml = char.tags.map(t => `<span class="card-tag">${t}</span>`).join('');
    // 兴趣HTML
    const interestsHtml = char.interests.map(i => `<span class="card-interest">${i}</span>`).join('');

    card.innerHTML = `
      <div class="card-avatar">${char.avatar}</div>
      <div class="card-name">${char.name}</div>
      <div class="card-basic">${char.age}岁 · ${char.height} · ${char.occupation}</div>
      <div class="card-tags">${tagsHtml}</div>
      <div class="card-interests">${interestsHtml}</div>
      <div class="card-signature">"${char.signature}"</div>
      <button class="card-chat-btn" onclick="app.startChat(${index})">💬 开始聊天</button>
    `;

    // 添加触摸滑动支持
    this.addSwipeSupport(card);

    return card;
  },

  /**
   * 为卡片添加触摸滑动事件
   * @param {HTMLElement} card
   */
  addSwipeSupport(card) {
    let startX = 0;
    let startY = 0;

    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    card.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      // 水平滑动距离 > 50px 且 水平分量大于垂直
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          this.nextCard();
        } else {
          this.prevCard();
        }
      }
    }, { passive: true });
  },

  /**
   * 更新卡片显示状态（active/prev/hidden）
   */
  updateCardDisplay() {
    const cards = document.querySelectorAll('.profile-card');
    const dots = document.querySelectorAll('.indicator-dot');
    const current = appState.currentCardIndex;

    cards.forEach((card, i) => {
      card.classList.remove('active', 'prev');
      if (i === current) {
        card.classList.add('active');
      } else if (i < current) {
        card.classList.add('prev');
      }
    });

    // 更新指示器
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  },

  /**
   * 切换到下一张卡片
   */
  nextCard() {
    if (appState.currentCardIndex < appState.characters.length - 1) {
      appState.currentCardIndex++;
      this.updateCardDisplay();
      this.updateNavButtons();
    }
  },

  /**
   * 切换到上一张卡片
   */
  prevCard() {
    if (appState.currentCardIndex > 0) {
      appState.currentCardIndex--;
      this.updateCardDisplay();
      this.updateNavButtons();
    }
  },

  /**
   * 更新导航按钮的禁用状态
   */
  updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = appState.currentCardIndex === 0;
    if (nextBtn) nextBtn.disabled = appState.currentCardIndex === appState.characters.length - 1;
  },

  // ======================================================
  // 页面3：聊天
  // ======================================================

  /**
   * 开始与指定角色聊天
   * @param {number} index - 角色索引
   */
  startChat(index) {
    const char = appState.characters[index];
    if (!char) return;

    appState.currentCharacter = char;
    appState.chatMessages = [];

    console.log('[App] 开始聊天，角色:', char.name);

    // 更新聊天头部信息
    document.getElementById('chat-avatar').textContent = char.avatar;
    document.getElementById('chat-name').textContent = char.name;
    document.getElementById('chat-meta').textContent = `${char.age}岁 · ${char.occupation}`;

    // 清空消息列表
    document.getElementById('chat-messages').innerHTML = '';

    // 清空输入框
    const input = document.getElementById('chat-input');
    input.value = '';
    input.style.height = 'auto';

    // 切换到聊天页面
    this.showPage('page-chat');

    // 延迟发送AI的开场白
    setTimeout(() => this.sendAIOpening(), 600);
  },

  /**
   * 发送AI的开场白（第一句话）
   */
  async sendAIOpening() {
    const char = appState.currentCharacter;
    if (!char) return;

    // 构造开场白（根据角色性格）
    const openings = {
      '开朗活泼': `嗨～你好呀！我是${char.name}，很高兴认识你！😊`,
      '温柔体贴': `你好，我是${char.name}，第一次相亲有点紧张呢～`,
      '知性优雅': `你好，我是${char.name}，${char.occupation}，很高兴认识你`,
      '幽默风趣': `哈哈，终于来了！我是${char.name}，咱们今天要聊什么？😄`,
      '成熟稳重': `你好，我是${char.name}，期待今天的交流`,
      '热情奔放': `嗨！你好！我是${char.name}，超期待跟你聊天！🎉`,
    };

    // 找到匹配的性格
    let openingText = `你好，我是${char.name}，很高兴认识你！`;
    for (const [tag, text] of Object.entries(openings)) {
      if (char.tags.includes(tag)) {
        openingText = text;
        break;
      }
    }

    // 添加AI消息（带打字动画）
    await this.appendAIMessage(openingText, true);
  },

  /**
   * 处理用户输入框的键盘事件
   * Enter发送，Shift+Enter换行
   * @param {KeyboardEvent} e
   */
  handleInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },

  /**
   * 自动调整输入框高度
   * @param {HTMLTextAreaElement} el
   */
  autoResizeInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  },

  /**
   * 发送用户消息
   */
  async sendMessage() {
    if (appState.isSending) return;

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // 清空输入框并重置高度
    input.value = '';
    input.style.height = 'auto';

    // 禁用发送按钮
    appState.isSending = true;
    document.getElementById('send-btn').disabled = true;

    // 添加用户消息到界面
    const userMsg = { role: 'user', content: text, time: ChatModule.formatTime() };
    appState.chatMessages.push(userMsg);
    this.appendUserMessage(text);

    // 显示"对方正在输入..."
    const typingIndicator = document.getElementById('typing-indicator');
    const typingName = document.getElementById('typing-name');
    typingName.textContent = appState.currentCharacter.name;
    typingIndicator.style.display = 'block';

    try {
      // 准备发给API的消息历史（只传最近10条，节省token）
      const recentMessages = appState.chatMessages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      // 调用AI
      const aiReply = await ChatModule.fetchAIReply(appState.currentCharacter, recentMessages);

      // 隐藏输入状态
      typingIndicator.style.display = 'none';

      // 添加AI消息（带打字动画）
      await this.appendAIMessage(aiReply, true);

      // 保存AI消息到记录
      appState.chatMessages.push({
        role: 'ai',
        content: aiReply,
        time: ChatModule.formatTime()
      });

    } catch (err) {
      console.error('[App] 发送消息失败:', err);
      typingIndicator.style.display = 'none';
      await this.appendAIMessage('抱歉，我好像出了点小问题，再说一次好吗？😅', false);
    } finally {
      // 恢复发送按钮
      appState.isSending = false;
      document.getElementById('send-btn').disabled = false;
      input.focus();
    }
  },

  /**
   * 添加用户消息气泡到界面
   * @param {string} text
   */
  appendUserMessage(text) {
    const container = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper user-msg';
    wrapper.innerHTML = `
      <div class="message-bubble">${this.escapeHtml(text)}</div>
      <div class="message-time">${ChatModule.formatTime()}</div>
    `;
    container.appendChild(wrapper);
    this.scrollToBottom();
  },

  /**
   * 添加AI消息气泡到界面（可选打字动画）
   * @param {string} text
   * @param {boolean} useAnimation - 是否使用打字动画
   */
  async appendAIMessage(text, useAnimation = true) {
    const container = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper ai-msg';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = ChatModule.formatTime();

    wrapper.appendChild(bubble);
    wrapper.appendChild(timeEl);
    container.appendChild(wrapper);
    this.scrollToBottom();

    if (useAnimation) {
      // 打字动画
      await ChatModule.typewriterAnimation(bubble, text, 40);
    } else {
      bubble.textContent = text;
    }

    // 保存到聊天记录（如果不在sendMessage流程中）
    this.scrollToBottom();
  },

  /**
   * 滚动聊天区域到底部
   */
  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  /**
   * 返回卡片页面
   */
  backToCards() {
    this.showPage('page-cards');
  },

  /**
   * 结束相亲，显示评分报告
   */
  endDate() {
    if (appState.chatMessages.length === 0) {
      // 还没聊天就结束，提示一下
      if (!confirm('还没开始聊天呢，确定要结束相亲吗？')) {
        return;
      }
    }

    console.log('[App] 结束相亲，开始计算评分');
    console.log('[App] 消息记录数:', appState.chatMessages.length);

    // 计算评分
    const scoreResult = ScoringModule.calculateScore(appState.chatMessages);
    console.log('[App] 评分结果:', scoreResult);

    // 渲染报告
    this.renderReport(scoreResult);
    this.showPage('page-report');
  },

  // ======================================================
  // 页面4：评分报告
  // ======================================================

  /**
   * 渲染评分报告
   * @param {Object} result - 评分结果对象
   */
  renderReport(result) {
    // 总分（动画滚动数字）
    const totalEl = document.getElementById('total-score');
    this.animateNumber(totalEl, 0, result.total, 800);

    // 维度评分条
    const scoreItemsEl = document.getElementById('score-items');
    scoreItemsEl.innerHTML = '';
    result.dimensions.forEach(dim => {
      const percent = Math.round((dim.score / dim.max) * 100);
      const item = document.createElement('div');
      item.className = 'score-item';
      item.innerHTML = `
        <div class="score-item-header">
          <span class="score-item-label">${dim.label} <small style="color:#aaa;font-size:12px;">${dim.desc}</small></span>
          <span class="score-item-value">${dim.score}/${dim.max}</span>
        </div>
        <div class="score-bar-bg">
          <div class="score-bar-fill" data-percent="${percent}"></div>
        </div>
      `;
      scoreItemsEl.appendChild(item);
    });

    // 延迟触发进度条动画
    setTimeout(() => {
      document.querySelectorAll('.score-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.percent + '%';
      });
    }, 300);

    // 推荐建议
    const recsEl = document.getElementById('recommendations');
    recsEl.innerHTML = '';
    result.recommendations.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      item.textContent = rec;
      recsEl.appendChild(item);
    });

    // 总结
    const summaryEl = document.getElementById('summary-box');
    summaryEl.innerHTML = '';
    result.summary.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      summaryEl.appendChild(p);
    });
  },

  /**
   * 数字滚动动画
   * @param {HTMLElement} el - 显示元素
   * @param {number} from - 起始值
   * @param {number} to - 目标值
   * @param {number} duration - 动画时长(ms)
   */
  animateNumber(el, from, to, duration) {
    const startTime = Date.now();
    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut效果
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  },

  // ======================================================
  // 重置 / 再来一次
  // ======================================================

  /**
   * 重置所有状态，回到性别选择页
   */
  restart() {
    console.log('[App] 重新开始');
    appState.userGender = null;
    appState.characters = [];
    appState.currentCardIndex = 0;
    appState.currentCharacter = null;
    appState.chatMessages = [];
    appState.isSending = false;
    this.showPage('page-gender');
  },

  // ======================================================
  // 工具函数
  // ======================================================

  /**
   * HTML转义，防止XSS
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

// 挂载到全局
window.app = app;

// 初始化：确保第一个页面可见
document.addEventListener('DOMContentLoaded', () => {
  const genderPage = document.getElementById('page-gender');
  if (genderPage) {
    genderPage.style.display = 'flex';
  }
  console.log('[App] 网页相亲模拟器初始化完成 💕');
});
