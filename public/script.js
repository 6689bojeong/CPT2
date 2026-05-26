// 충피티 - Chungbuk National University AI Chatbot

const chatArea = document.getElementById('chatArea');
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const sidebarOpen = document.getElementById('sidebarOpen');
const sidebarClose = document.getElementById('sidebarClose');
const sidebar = document.getElementById('sidebar');

// Unique session ID for conversation history
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2);

let isLoading = false;

// ======== Input handling ========
messageInput.addEventListener('input', () => {
  const hasText = messageInput.value.trim().length > 0;
  sendBtn.disabled = !hasText || isLoading;

  // Auto-resize textarea
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// ======== Quick buttons & suggestion cards ========
document.querySelectorAll('.quick-btn, .suggestion-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const msg = btn.dataset.msg;
    if (msg) {
      messageInput.value = msg;
      messageInput.dispatchEvent(new Event('input'));
      sendMessage();
      if (window.innerWidth <= 768) closeSidebar();
    }
  });
});

// ======== New chat ========
newChatBtn.addEventListener('click', async () => {
  await clearConversation();
  if (window.innerWidth <= 768) closeSidebar();
});

async function clearConversation() {
  try {
    await fetch('/api/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
  } catch {}

  messagesContainer.innerHTML = '';
  welcomeScreen.style.display = '';
  messagesContainer.style.display = '';
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;
}

// ======== Sidebar (mobile) ========
sidebarOpen?.addEventListener('click', openSidebar);
sidebarClose?.addEventListener('click', closeSidebar);

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('visible');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
}

const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
overlay.addEventListener('click', closeSidebar);
document.body.appendChild(overlay);

// ======== Send message ========
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isLoading) return;

  // Hide welcome screen, show messages
  welcomeScreen.style.display = 'none';

  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;
  isLoading = true;

  appendMessage('user', text);

  const typingEl = appendTypingIndicator();
  scrollToBottom();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId }),
    });

    const data = await res.json();
    typingEl.remove();

    if (!res.ok) {
      appendMessage('bot', data.error || '오류가 발생했습니다.', true);
    } else {
      appendMessage('bot', data.message, false, data.sources || []);
    }
  } catch (err) {
    typingEl.remove();
    appendMessage('bot', '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', true);
  }

  isLoading = false;
  sendBtn.disabled = messageInput.value.trim().length === 0;
  scrollToBottom();
}

// ======== Append message ========
function appendMessage(role, text, isError = false, sources = []) {
  const group = document.createElement('div');
  group.className = `message-group ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role}`;
  avatar.textContent = role === 'bot' ? '충' : '나';

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = 'message-bubble-wrapper';

  const senderName = document.createElement('span');
  senderName.className = 'sender-name';
  senderName.textContent = role === 'bot' ? '충피티' : '나';

  const bubble = document.createElement('div');
  bubble.className = `message-bubble${isError ? ' error-bubble' : ''}`;
  bubble.innerHTML = formatText(text);

  const timeEl = document.createElement('span');
  timeEl.className = 'message-time';
  timeEl.textContent = formatTime(new Date());

  bubbleWrapper.appendChild(senderName);
  bubbleWrapper.appendChild(bubble);

  // Render source chips for bot messages
  if (role === 'bot' && sources.length > 0) {
    const chips = document.createElement('div');
    chips.className = 'source-chips';
    const seen = new Set();
    for (const src of sources) {
      if (seen.has(src.uri)) continue;
      seen.add(src.uri);
      const a = document.createElement('a');
      a.className = 'source-chip';
      a.href = src.uri;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '🔗 ' + (src.title.length > 30 ? src.title.slice(0, 30) + '…' : src.title);
      chips.appendChild(a);
    }
    bubbleWrapper.appendChild(chips);
  }

  bubbleWrapper.appendChild(timeEl);

  group.appendChild(avatar);
  group.appendChild(bubbleWrapper);

  messagesContainer.appendChild(group);

  // Animate in
  group.style.opacity = '0';
  group.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    group.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    group.style.opacity = '1';
    group.style.transform = 'translateY(0)';
  });
}

// ======== Typing indicator ========
function appendTypingIndicator() {
  const group = document.createElement('div');
  group.className = 'message-group bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  avatar.textContent = '충';

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = 'message-bubble-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.style.padding = '0';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    indicator.appendChild(dot);
  }

  bubble.appendChild(indicator);
  bubbleWrapper.appendChild(bubble);
  group.appendChild(avatar);
  group.appendChild(bubbleWrapper);
  messagesContainer.appendChild(group);

  return group;
}

// ======== Format text (simple markdown) ========
function formatText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

// ======== Format time ========
function formatTime(date) {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

// ======== Scroll ========
function scrollToBottom() {
  setTimeout(() => {
    chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
  }, 50);
}

// ======== Initial focus ========
messageInput.focus();
