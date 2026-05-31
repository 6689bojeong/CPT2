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

// ======== 빠른 메뉴 고정 응답 데이터 ========
const quickMenuData = {
  'chatbot-intro': {
    label: '챗봇소개',
    text: '안녕하세요! 저는 **충피티**입니다 🐯\n\n충북대학교 경영정보학과 학생들이 2026년 수업 과제로 개발한 AI 챗봇이에요.\n\n**제공하는 주요 서비스:**\n• 학사일정 및 학교 정보 안내\n• 장학금·등록금 정보\n• 학식 메뉴 및 운영시간\n• 교내 연락처·이메일·와이파이\n• 졸업 요건 안내\n• 그 외 충북대 생활 전반에 대한 질문\n\n💡 충피티는 AI 기반으로 동작하므로 간혹 부정확한 정보를 제공할 수 있습니다. 중요한 사항은 공식 포털에서 꼭 확인하세요!',
    links: [{ title: '충북대학교 공식 홈페이지', uri: 'https://www.cbnu.ac.kr' }]
  },
  'academic-calendar': {
    label: '학사일정',
    text: '📅 **2026학년도 충북대 학사일정 안내**\n\n**주요 일정 (매 학기 기준):**\n• 수강신청: 개강 약 2~3주 전\n• 수강변경: 개강 첫째 주\n• 중간고사: 개강 후 약 8주차\n• 기말고사: 개강 후 약 15~16주차\n• 성적 열람: 기말고사 후 약 1~2주 이내\n\n정확한 날짜는 아래 공식 학사일정 페이지에서 확인하세요!\n\n💡 수강신청은 개신누리(eis.cbnu.ac.kr)에서 진행합니다.',
    links: [
      { title: '학사일정 확인하기', uri: 'https://www.cbnu.ac.kr/www/selectWebSchdulList.do?key=455&schdulSeNo=1' },
      { title: '수강신청 (개신누리)', uri: 'https://eisa.cbnu.ac.kr/' }
    ]
  },
  'cafeteria': {
    label: '학식',
    text: '🍽️ **충북대학교 학생식당 안내**\n\n**⏰ 운영 시간:**\n• 아침: 08:00 ~ 10:00\n• 점심: 11:00 ~ 14:00\n• 저녁: 17:00 ~ 18:40\n\n**🏫 운영 식당:**\n• 학생회관 식당\n• 생활관 식당\n\n💡 메뉴는 매주 변경되며, 재료 소진 시 조기 마감될 수 있습니다.\n이번 주 메뉴는 아래 링크에서 확인하세요!',
    links: [{ title: '이번 주 식단 확인', uri: 'https://www.cbnucoop.com/service/restaurant/' }]
  },
  'contact': {
    label: '교내 연락처',
    text: '📞 **충북대학교 주요 연락처**\n\n☎️ **대표번호:** 043-261-2114\n📍 **주소:** 충북 청주시 서원구 충대로 1\n\n**주요 부서 연락처:**\n• 학사지원과: 043-261-2013\n• 학생처: 043-261-2053\n• 장학복지과: 043-261-2070\n• 총무처: 043-261-2016\n\n**⏰ 업무시간:** 월~금 09:00~18:00\n(점심시간 12:00~13:00)\n\n🔎 전체 부서별 연락처는 아래 전화번호부에서 확인하세요!',
    links: [{ title: '전체 전화번호부 조회', uri: 'https://www.cbnu.ac.kr/www/selectWebTelInfoList.do?key=664' }]
  },
  'tuition': {
    label: '등록금',
    text: '💳 **충북대학교 등록금 안내**\n\n**납부 가능 은행:**\n• 농협, 신한, 국민, 우리, 하나은행\n\n**납부 방법:**\n• 가상계좌 이체\n• 신용카드 납부\n• 은행 창구 고지서 납부\n\n**고지서 확인 방법:**\n개신누리(eis.cbnu.ac.kr) 로그인 → 등록 → 고지서 조회\n\n💡 등록금 액수는 학과·학년별로 다르므로\n개신누리에서 본인의 고지서를 직접 확인하세요.',
    links: [
      { title: '등록 안내 페이지', uri: 'https://www.cbnu.ac.kr/www/contents.do?key=483' },
      { title: '개신누리 로그인', uri: 'https://eis.cbnu.ac.kr' }
    ]
  },
  'scholarship': {
    label: '장학금',
    text: '🎓 **충북대학교 장학금 안내**\n\n**📌 국가장학금 (I·II 유형)**\n→ 소득 8분위 이하 학생 대상\n→ 한국장학재단 홈페이지에서 신청\n\n**📌 교내장학금 (복지·특별·법정)**\n→ 성적우수, 가계곤란 학생 대상\n→ 매 학기 초 신청 공고 확인 필요\n\n**📌 천사장학금**\n→ 학업 의지가 있으나 경제적 어려움을 겪는 학생 지원\n\n**📌 교외장학금**\n→ 각종 기업·기관 장학금 (수시 공지)\n\n💡 장학금 신청 일정은 매 학기 공지사항을 확인하세요!',
    links: [
      { title: '장학제도 전체 안내', uri: 'https://www.cbnu.ac.kr/www/contents.do?key=491' },
      { title: '한국장학재단 (국가장학금)', uri: 'https://www.kstudy.com' }
    ]
  },
  'graduation': {
    label: '졸업',
    text: '🏫 **충북대학교 졸업 안내**\n\n**졸업 요건 확인 방법:**\n개신누리 로그인 → 학사정보 → 졸업기준 내역조회\n\n**일반적인 졸업 요건 (학과마다 상이):**\n• 졸업 이수학점 충족 (전공·교양·일반선택)\n• 졸업논문 또는 졸업시험 통과\n• 영어 졸업인증 요건 충족\n• 봉사활동 시간 이수\n\n⚠️ 졸업 요건은 **학과·입학년도별로 다르므로**\n반드시 개신누리에서 본인 기준을 직접 확인하세요!\n\n졸업 관련 문의: 학사지원과 043-261-2013',
    links: [{ title: '개신누리 졸업기준 조회', uri: 'https://eis.cbnu.ac.kr' }]
  },
  'email': {
    label: '교내이메일',
    text: '📧 **충북대학교 교내 이메일 안내**\n\n충북대학교 학생에게는 **@chungbuk.ac.kr** 이메일 계정이 제공됩니다.\n\n**접속 방법:**\n• 주소: mail.chungbuk.ac.kr\n• 아이디: 개신누리 학번\n• 초기 비밀번호: 개신누리 비밀번호와 동일\n\n**주요 활용처:**\n• 교수님께 메일 발송\n• 학교 공식 공지 수신\n• 각종 기관·기업 학생 인증\n\n💡 개신누리 비밀번호 변경 시 교내 이메일 비밀번호도 함께 변경됩니다.',
    links: [{ title: '교내 이메일 접속하기', uri: 'https://mail.chungbuk.ac.kr' }]
  },
  'wifi': {
    label: '와이파이',
    text: '📶 **충북대학교 교내 와이파이 안내**\n\n**사용 가능한 네트워크:**\n• **CBNU_WiFi**: 교내 전용 무선랜\n• **eduroam**: 전 세계 106개국 교육기관에서 이용 가능\n\n**접속 방법:**\n① SSID: CBNU_WiFi 또는 eduroam 선택\n② 아이디: 개신누리 아이디@chungbuk.ac.kr\n③ 비밀번호: 개신누리 비밀번호 입력\n\n💡 개신누리 비밀번호 변경 시 Wi-Fi 재연결이 필요합니다!\n\n자세한 연결 방법(Android·iOS·Windows)은 아래 안내 페이지를 참고하세요.',
    links: [
      { title: 'Wi-Fi 안내 페이지', uri: 'http://wifi.cbnu.ac.kr/' },
      { title: 'eduroam 연결 방법', uri: 'https://www.cbnu.ac.kr/icc/selectBbsNttView.do?key=54&bbsNo=79&nttNo=1794' }
    ]
  }
};

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

// ======== Quick buttons (사이드바) ========
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const msg = btn.dataset.msg;
    if (msg) {
      messageInput.value = msg;
      messageInput.dispatchEvent(new Event('input'));
      sendMessage();
      closeSidebar();
    }
  });
});

// ======== 빠른 메뉴 (웰컴 화면) ========
let quickMenuCurrentPage = 0;
const quickMenuPages = document.querySelectorAll('.quick-menu-page');
const quickMenuDots = document.querySelectorAll('.qm-dot');

function goToQuickMenuPage(page) {
  quickMenuPages[quickMenuCurrentPage].classList.remove('active');
  quickMenuDots[quickMenuCurrentPage].classList.remove('active');
  quickMenuCurrentPage = page;
  quickMenuPages[quickMenuCurrentPage].classList.add('active');
  quickMenuDots[quickMenuCurrentPage].classList.add('active');
}

quickMenuDots.forEach(dot => {
  dot.addEventListener('click', () => {
    goToQuickMenuPage(parseInt(dot.dataset.page));
  });
});

document.querySelectorAll('.quick-menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    const data = quickMenuData[key];
    if (!data) return;

    appendMessage('user', data.label);
    appendMessage('bot', data.text, false, data.links);
    scrollToBottom();
  });
});

// ======== New chat ========
newChatBtn.addEventListener('click', async () => {
  await clearConversation();
  closeSidebar();
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

// ======== Sidebar ========
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
overlay.addEventListener('click', closeSidebar);
document.body.appendChild(overlay);

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

// ======== 의견 보내기 ========
const feedbackForm = document.getElementById('feedbackForm');
const feedbackInput = document.getElementById('feedbackInput');
const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
const feedbackSuccess = document.getElementById('feedbackSuccess');

feedbackForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = feedbackInput.value.trim();
  if (!text) return;

  feedbackSubmitBtn.disabled = true;
  feedbackSubmitBtn.textContent = '전송 중...';

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, sessionId }),
    });
    if (!res.ok) throw new Error();
  } catch {
    alert('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    feedbackSubmitBtn.disabled = false;
    feedbackSubmitBtn.textContent = '보내기';
    return;
  }

  feedbackForm.style.display = 'none';
  feedbackSuccess.style.display = 'block';

  setTimeout(() => {
    feedbackForm.style.display = 'flex';
    feedbackSuccess.style.display = 'none';
    feedbackInput.value = '';
    feedbackSubmitBtn.disabled = false;
    feedbackSubmitBtn.textContent = '보내기';
  }, 3000);
});

// ======== Send message ========
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isLoading) return;

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
  if (role === 'bot') {
    const img = document.createElement('img');
    img.src = '우왕이.png';
    img.alt = '충피티';
    avatar.appendChild(img);
  } else {
    avatar.textContent = '나';
  }

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

// ======== 충피티 랜덤 팩트 ========
const chungFacts = [
  '우왕이는 언제나 스무살이에요!',
];

function getRandomFact() {
  return chungFacts[Math.floor(Math.random() * chungFacts.length)];
}

// ======== Typing indicator ========
function appendTypingIndicator() {
  const group = document.createElement('div');
  group.className = 'message-group bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  const typingImg = document.createElement('img');
  typingImg.src = '우왕이.png';
  typingImg.alt = '충피티';
  avatar.appendChild(typingImg);

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

  const factEl = document.createElement('div');
  factEl.className = 'typing-fact';
  factEl.textContent = '💡 ' + getRandomFact();

  bubble.appendChild(indicator);
  bubble.appendChild(factEl);
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

// ======== 이용안내 모달 ========
const infoBtn = document.getElementById('infoBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

infoBtn?.addEventListener('click', () => modalOverlay.classList.add('visible'));
modalClose?.addEventListener('click', () => modalOverlay.classList.remove('visible'));
modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('visible');
});

// ======== 홈 버튼 (로고 클릭) ========
document.getElementById('homeBtn')?.addEventListener('click', async () => {
  await clearConversation();
  chatArea.scrollTo({ top: 0, behavior: 'smooth' });
});

// ======== Initial focus ========
messageInput.focus();
