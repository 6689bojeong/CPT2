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
    text: '안녕하세요! 저는 **충피티**입니다 우왕! \n\n충북대학교 경영정보학과 학생들이 2026년 수업 과제로 개발한 AI 챗봇이에요.\n\n**제공하는 주요 서비스:**\n• 학사일정 및 학교 정보 안내\n• 장학금·등록금 정보\n• 학식 메뉴 및 운영시간\n• 교내 연락처·이메일·와이파이\n• 졸업 요건 안내\n• 그 외 충북대 생활 전반에 대한 질문\n\n💡 충피티는 AI 기반으로 동작하므로 간혹 부정확한 정보를 제공할 수 있습니다. 중요한 사항은 공식 포털에서 꼭 확인하세요!',
    links: [{ title: '충북대학교 공식 홈페이지', uri: 'https://www.cbnu.ac.kr' }]
  },
  'academic-calendar': {
    label: '학사일정',
    text: '충북대학교의 **2026학년도 연간 주요 학사일정**을 알려드릴게요! 📅✨\n\n🌱 **[1학기 & 여름방학]**\n• 03.03(화) : 1학기 개강\n• 04.20(월) ~ 04.24(금) : 중간시험 권장 기간\n• 05.04(월) ~ 05.07(목) : 하기계절수업 수강신청(1차)\n• 06.08(월) ~ 06.19(금) : 기말시험 권장 기간 📝\n• 06.22(월) ~ 08.31(월) : 여름방학 (하기휴가) ☀️\n• 06.26(금) ~ 06.30(화) : 1학기 성적 확인\n• 08.03(월) ~ 08.07(금) : 2학기 정규 수강신청 💻\n• 08.24(월) ~ 08.26(수) : 2학기 등록금 납부\n\n🍁 **[2학기 & 겨울방학]**\n• 09.01(화) : 2학기 개강\n• 09.27(일) : 개교 75주년 기념일 🎂\n• 09.29(화) ~ 10.01(목) : 개신축전 🎉\n• 10.19(월) ~ 10.23(금) : 중간시험 권장 기간\n• 10.28(수) ~ 10.30(금) : 동기계절수업 수강신청(1차)\n• 12.07(월) ~ 12.18(금) : 기말시험 권장 기간 📝\n• 12.21(월) ~ 27.02.28(토) : 겨울방학 (동기휴가) ❄️\n• 12.28(월) ~ 12.31(목) : 2학기 성적 확인\n\n⚠️ 정확한 날짜는 아래 공식 학사일정 페이지에서 꼭 확인하세요!',
    links: [
      { title: '학사일정 확인하기', uri: 'https://www.cbnu.ac.kr/www/selectWebSchdulList.do?key=455&schdulSeNo=1' },
      { title: '수강신청 (개신누리)', uri: 'https://eisa.cbnu.ac.kr/' }
    ]
  },
  'cafeteria': {
    label: '오늘의 학식',
    text: '🍽️ **충북대학교 학생식당 안내**\n\n**⏰ 운영 시간:**\n• 아침: 08:00 ~ 10:00\n• 점심: 11:00 ~ 14:00\n• 저녁: 17:00 ~ 18:40\n\n**🏫 운영 식당:**\n• 학생회관 식당\n• 생활관 식당\n\n💡 메뉴는 매주 변경되며, 재료 소진 시 조기 마감될 수 있습니다.\n이번 주 메뉴는 아래 링크에서 확인하세요!',
    links: [{ title: '이번 주 식단 확인', uri: 'https://www.cbnucoop.com/service/restaurant/' }]
  },
  'contact': {
    label: '교내 연락처',
    text: '충북대학교의 주요 연락처를 알려드릴게요!\n\n📞 **충북대학교 주요 연락처**\n\n☎️ **대표번호:** 043-261-2114\n📍 **주소:** 충북 청주시 서원구 충대로 1\n\n**주요 연락처:**\n• 종합서비스센터: 043-261-3305\n• 통합경비상황실: 043-261-3650\n• 교내장학: 043-261-2027\n• 학생과: 043-261-2021\n• 중앙도서관: 043-261-2888\n\n🔎 아래 링크에서 전체 부서별 연락처 확인하기!',
    links: [{ title: '전체 연락처 보러가기', uri: 'https://www.cbnu.ac.kr/www/selectWebTelInfoList.do?key=664' }]
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
    text: '주요 장학금을 안내해 드리기 전에 알아두실 게 있어요! 🎓\n\n💡 **충북대학교 등록금 구조**\n수업료1 : 수업료2 = 1 : 3 비율로 구성돼요.\n장학금 등급에 따라 감면 범위가 달라집니다!\n• **A급:** 등록금 전액\n• **B1급:** 수업료2의 100%\n• **B2급:** 수업료2의 50%\n• **C급:** 수업료1의 100%\n\n🏅 **주요 장학금 안내**\n\n**학과수석장학금**\n• A급 + 수학보조금 500,000원\n\n**리더장학금**\n• 총학생회 임원 등 대상\n• A급 / B1급 / B2급 / C급 (성적 C+ 이상)\n\n**국가장학금 Ⅰ·Ⅱ유형**\n• Ⅰ유형\n  - 기초·차상위: 등록금 전액\n  - 1~3분위: 연간 570만원\n  - 4~6분위: 연간 420만원\n  - 7~8분위: 연간 350만원\n• Ⅱ유형: 대학 자체 노력계획에 따라 지원\n\n📞 **장학금 관련 연락처**\n• 교내 장학금: 043-261-2027\n• 교외 장학금: 043-261-3888\n• 국가 장학금: 043-261-2028',
    links: [
      { title: '교내장학금 알아보기', uri: 'https://www.cbnu.ac.kr/www/contents.do?key=492' },
      { title: '교외장학금 알아보기', uri: 'https://www.cbnu.ac.kr/www/contents.do?key=493' },
      { title: '천사장학금 알아보기', uri: 'https://www.cbnu.ac.kr/www/contents.do?key=494' },
    ]
  },
  'graduation': {
    label: '졸업',
    text: '🎓 **학사과정의 졸업**\n\n충북대학교는 소정의 전 교육과정을 이수하고 졸업논문을 제출하여 논문심사에 통과된 사람에 대하여 학사학위를 수여해요!\n\n졸업에 대해 더 알아보고 싶다면 아래 링크를 눌러주세요!\n\n📞 **졸업 관련 문의 연락처**\n• 학사지원과: 043-261-2014',
    links: [
      { title: '자주하는 질문 보러가기', uri: 'https://www.cbnu.ac.kr/www/selectBbsNttList.do?bbsNo=90&key=471' },
      { title: '학과별 졸업요건 확인하기', uri: 'https://eis.cbnu.ac.kr/CBNU/cview.jsp?view_id=89614F263A9559D8A9B2FDD0B1B60CF7' },
    ]
  },
  'email': {
    label: '교내이메일',
    text: '📧 **충북대학교 학생 이메일(G-Suite) 이용을 안내할게요!**\n\n**이메일 생성 방법**\n• 계정은 구글이 아닌, 반드시 학교 포털인 **개신누리**를 통해 생성해야 합니다.\n• **가입 경로:** 개신누리 로그인 → 메인 화면 상단 **[학내링크]** → **[이메일]** 클릭 → 가입 정보 작성 후 신청\n\n**이용 방법**\n구글에서 사용할 수 있어요!\n• **로그인 ID:** 가입 시 신청한 아이디 (`메일ID@chungbuk.ac.kr`)\n• **비밀번호:** 이메일 가입 시 설정한 비밀번호\n\n⚠️ **이용 시 주의사항**\n• **휴면 계정 전환:** 6개월(180일) 동안 로그인하지 않으면 휴면 상태로 전환돼요! (다시 로그인하면 즉시 복구됩니다.)\n• **계정 영구 삭제:** 휴면 전환 후 추가로 6개월이 지나면 계정이 삭제되니 정기적으로 로그인해주세요!\n\n📞 **관련 문의처**\n• 정보화본부 정보화기반팀: 043-261-2117',
    links: [{ title: '개신누리 로그인', uri: 'https://eis.cbnu.ac.kr' }]
  },
  'wifi': {
    label: '와이파이',
    text: '충북대학교의 학생 및 교직원이라면 이용할 수 있는 와이파이를 소개해드릴게요 우왕! 📶\n\n**🔵 학교전용 무선랜 (CBNU-Wifi / CBNU-Wifi_5G)**\n충북대학교 전용 서비스로 무선인터넷을 자유롭게 이용할 수 있습니다.\n• 인증: 개신누리ID / 개신누리PW\n\n**🌐 글로벌 공유 무선랜 (eduroam)**\n개신누리ID로 글로벌 로밍 서비스 eduroam을 자유롭게 이용할 수 있습니다.\n• 인증: 개신누리ID@cbnu.ac.kr / 개신누리PW\n\n**🤖 Android 연결 방법**\n1. 설정 > 연결에서 Wi-Fi 사용 중으로 선택\n2. 네트워크 목록에서 CBNU-WIFI 또는 CBNU-WIFI_5G 선택\n3. EAP 방식: PEAP 또는 TTLS 선택\n4. ID·비밀번호에 개신누리ID / 개신누리PW 입력\n5. CA 인증서: "인증 안 함" 선택\n6. 2단계 인증이 안 보이면 "더보기" 선택\n7. 2단계 인증: GTC 선택, 익명 ID는 빈칸\n\n자세한 연결 방법(Android·iOS·Windows)은 아래 안내 페이지를 참고하세요!\n\n📞 **무선랜 서비스 문의:** 043-261-2773',
    links: [
      { title: 'Wi-Fi 상세 안내 페이지', uri: 'http://wifi.cbnu.ac.kr/#m2' },
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
  btn.addEventListener('click', async () => {
    const key = btn.dataset.key;
    const data = quickMenuData[key];
    if (!data) return;

    appendMessage('user', data.label);

    if (key === 'cafeteria') {
      const typingEl = appendTypingIndicator();
      scrollToBottom();
      try {
        const res = await fetch('/api/cafeteria');
        const json = await res.json();
        typingEl.remove();
        if (!res.ok) {
          appendMessage('bot', json.error || '학식 정보를 불러오지 못했어요.', true);
        } else {
          appendCafeteriaMessage(json.menu, json.dayIndex);
        }
      } catch {
        typingEl.remove();
        appendMessage('bot', '서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.', true);
      }
      scrollToBottom();
      return;
    }

    if (key === 'tuition') {
      appendTuitionMessage();
      scrollToBottom();
      return;
    }

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
  '우왕이는 언제나 20살이에요 🎂',
  '중앙도서관 앞에서 산책하는 리트리버 감자를 만날 수 있어요 🦮',
  '우왕이는 소들의 왕이에요 👑',
  '충북대학교의 교목은 느티나무에요 🌳',
  '충북대학교의 마스코트는 우왕이, 좌왕이, 스테디, 타나, 느루, 은송이 총 6종이에요! 🐾',
  '충북대학교 수의대에는 진짜 소가 살고 있답니다 🐮',
  '우리 학교 기숙사는 통금이 없어서 밤늦게까지 자유로워요 ✨',
  '외국인 학생 비율이 무려 국립대 1위인 글로벌한 학교예요 🗺️',
  '솔못에는 자라가 살고 있어요! 비 오는 날 눈여겨봐요 🐢',
  '행복담길 나무 위를 잘 보면 가끔 청솔모가 놀고 있어요 🐿️',
  '양성재와 농대 쪽에서는 가끔 고라니가 출몰하곤 해요 🦌',
  '농구장과 제2학생회관 사이 언덕은 오를 때 목이 말라서 \'목마르뜨\'라고 불러요 💦',
  '바보계단에서 넘어지면 3년간 연애를 못 한다는 무시무시한 속설이 있어요 😮',
  '바보계단은 오르는 모습이 바보 같아서 붙은 이름이지만 지금은 보수공사로 고른 계단이에요 🪜',
  'S19동 건물의 벽을 자세히 보면 신기하게도 나무가 자라고 있어요 🌿',
  '전 마스코트 우람이는 99학번이고, 지금 마스코트 우왕이는 21학번이에요 🎓',
  '중앙도서관 2관은 알쓸신잡으로 유명한 건축가 유현준 씨가 설계했어요 🏛️',
  '간혹 학교 근처에서 약초를 수확하러 오시는 어르신들을 만날 수 있어요 🌿',
  '우리 학교 부지 넓이는 무려 전국 30위나 된답니다 🏃‍♂️',
];

let _lastFactIdx = -1;
function getRandomFact() {
  let idx;
  do { idx = Math.floor(Math.random() * chungFacts.length); } while (idx === _lastFactIdx && chungFacts.length > 1);
  _lastFactIdx = idx;
  return chungFacts[idx];
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

  const factInterval = setInterval(() => {
    factEl.style.opacity = '0';
    setTimeout(() => {
      factEl.textContent = '💡 ' + getRandomFact();
      factEl.style.opacity = '1';
    }, 300);
  }, 3000);

  const originalRemove = group.remove.bind(group);
  group.remove = () => { clearInterval(factInterval); originalRemove(); };

  bubble.appendChild(indicator);
  bubble.appendChild(factEl);
  bubbleWrapper.appendChild(bubble);
  group.appendChild(avatar);
  group.appendChild(bubbleWrapper);
  messagesContainer.appendChild(group);

  return group;
}

// ======== 등록금 데이터 (2026년, 수업료 기준, 단위: 원) ========
// fees: [1학년, 2학년, 3학년, 4학년이상]  null = 해당없음
const TUITION_DATA = {
  '인문대학': {
    '고고미술사학과': [1733000, 1733000, 1733000, 1733000],
    '국어국문학과':   [1733000, 1733000, 1733000, 1733000],
    '중어중문학과':   [1733000, 1733000, 1733000, 1733000],
    '영어영문학과':   [1733000, 1733000, 1733000, 1733000],
    '독일어문학과':   [1733000, 1733000, 1733000, 1733000],
    '프랑스언어문학과': [1733000, 1733000, 1733000, 1733000],
    '러시아언어문학과': [1733000, 1733000, 1733000, 1733000],
    '사학과':         [1733000, 1733000, 1733000, 1733000],
    '철학과':         [1733000, 1733000, 1733000, 1733000],
    '인문자율전공학부': [1733000, 1733000, 1733000, 1733000],
  },
  '사회과학대학': {
    '사회학과':         [1733000, 1733000, 1733000, 1733000],
    '행정학과':         [1733000, 1733000, 1733000, 1733000],
    '정치외교학과':     [1733000, 1733000, 1733000, 1733000],
    '경제학과':         [1733000, 1733000, 1733000, 1733000],
    '사회과학자율전공학부': [1733000, 1733000, 1733000, 1733000],
    '심리학과':         [1733000, 1760000, 1760000, 1760000],
  },
  '자연과학대학': {
    '천문우주학과':       [2133000, 2133000, 2133000, 2133000],
    '생명과학부':         [2133000, 2133000, 2133000, 2133000],
    '미생물학과':         [2133000, 2133000, 2133000, 2133000],
    '수학과':             [2133000, 2133000, 2133000, 2133000],
    '수학정보통계학부':   [2133000, 2133000, 2133000, 2133000],
    '화학과':             [2133000, 2133000, 2133000, 2133000],
    '물리학과':           [2133000, 2133000, 2133000, 2133000],
    '지구환경과학과':     [2133000, 2133000, 2133000, 2133000],
    '자연과학자율전공학부': [2133000, 2133000, 2133000, 2133000],
  },
  '경영대학': {
    '경영학부':         [1733000, 1733000, 1733000, 1733000],
    '경영정보학과':     [1733000, 1733000, 1733000, 1733000],
    '국제경영학과':     [1733000, 1733000, 1733000, 1733000],
    '경영자율전공학부': [1733000, 1733000, 1733000, 1733000],
  },
  '공과대학': {
    '기계공학부':       [2312000, 2312000, 2312000, 2312000],
    '신소재공학과':     [2312000, 2312000, 2312000, 2312000],
    '안전공학과':       [2312000, 2312000, 2312000, 2312000],
    '환경공학과':       [2312000, 2312000, 2312000, 2312000],
    '토목공학부':       [2312000, 2312000, 2312000, 2312000],
    '건축공학과':       [2312000, 2312000, 2312000, 2312000],
    '도시공학과':       [2312000, 2312000, 2312000, 2312000],
    '화학공학과':       [2312000, 2312000, 2312000, 2312000],
    '건축학과':         [2312000, 2312000, 2312000, 2312000],
    '공학자율전공학부': [2312000, 2312000, 2312000, 2312000],
  },
  '전자정보대학': {
    '전기공학부':           [2312000, 2312000, 2312000, 2312000],
    '전자공학부':           [2312000, 2312000, 2312000, 2312000],
    '반도체공학부':         [2312000, 2312000, 2312000, 2312000],
    '정보통신공학부':       [2312000, 2312000, 2312000, 2312000],
    '소프트웨어학부':       [2312000, 2312000, 2312000, 2312000],
    '컴퓨터공학과':         [2312000, 2312000, 2312000, 2312000],
    '지능로봇공학과':       [2312000, 2312000, 2312000, 2312000],
    '전자정보자율전공학부': [2312000, 2312000, 2312000, 2312000],
  },
  '농업생명환경대학': {
    '농업경제학과':         [1761000, 1761000, 1761000, 1761000],
    '식물자원환경화학부':   [2083000, 2083000, 2083000, 2083000],
    '식품생명축산과학부':   [2083000, 2083000, 2083000, 2083000],
    '응용생명공학부':       [2083000, 2083000, 2083000, 2083000],
    '식물의학과':           [2083000, 2083000, 2083000, 2083000],
    '응용식물학과':         [2083000, 2083000, 2083000, 2083000],
    '바이오시스템공학과':   [2083000, 2083000, 2083000, 2083000],
    '산림학과':             [2083000, 2083000, 2083000, 2083000],
    '환경생명화학과':       [2083000, 2083000, 2083000, 2083000],
    '지역건설공학과':       [2083000, 2083000, 2083000, 2083000],
    '농업생명환경자율전공학부': [2083000, 2083000, 2083000, 2083000],
  },
  '사범대학': {
    '교육학과':     [1780000, 1780000, 1800000, 1815000],
    '역사교육과':   [1780000, 1780000, 1800000, 1815000],
    '사회교육과':   [1780000, 1780000, 1800000, 1815000],
    '윤리교육과':   [1828000, 1828000, 1848000, 1863000],
    '영어교육과':   [1783000, 1783000, 1803000, 1818000],
    '국어교육과':   [1783000, 1783000, 1803000, 1818000],
    '지리교육과':   [1783000, 1783000, 1803000, 1818000],
    '지구과학교육과': [2183000, 2183000, 2203000, 2218000],
    '수학교육과':   [2010000, 2010000, 2030000, 2045000],
    '컴퓨터교육과': [2083000, 2083000, 2103000, 2118000],
    '체육교육과':   [2133000, 2133000, 2153000, 2168000],
    '물리교육과':   [2272000, 2272000, 2292000, 2307000],
    '화학교육과':   [2272000, 2272000, 2292000, 2307000],
    '생물교육과':   [2272000, 2272000, 2292000, 2307000],
  },
  '생활과학대학': {
    '아동복지학과':         [1733000, 1733000, 1733000, 1733000],
    '소비자학과':           [1733000, 1733000, 1733000, 1733000],
    '생활과학자율전공학부': [1733000, 1733000, 1733000, 1733000],
    '주거환경학과':         [2130000, 2130000, 2130000, 2130000],
    '패션디자인정보학과':   [2130000, 2130000, 2130000, 2130000],
    '의류학과':             [2130000, 2130000, 2130000, 2130000],
    '식품영양학과':         [2083000, 2083000, 2083000, 2083000],
  },
  '수의과대학': {
    '수의학과': [3207000, 3207000, 3207000, 3207000],
    '수의예과': [2187000, 2376000, null,    null   ],
  },
  '약학대학': {
    '약학과·제약학과':  [3035000, 3035000, 3035000, 3035000],
    '산업제약학과':     [3035000, 3035000, 3035000, 3035000],
  },
  '의과대학': {
    '의학과': [4238000, 4238000, 4238000, 4238000],
    '의예과': [2237000, 2237000, null,    null   ],
  },
  '간호대학': {
    '간호학과': [2083000, 2083000, 2083000, 2083000],
  },
  '창의융합대학': {
    '바이오헬스학부':       [2350000, 2350000, 2350000, 2350000],
    '자율전공학부':         [1903000, 1903000, null,    null   ],
    '인문사회자율전공계열': [2083000, 2083000, null,    null   ],
    '자연과학자율전공계열': [2083000, 2083000, null,    null   ],
  },
  '예술학과군': {
    '조형예술학과': [2293000, 2293000, 2293000, 2293000],
    '미술학과':     [2293000, 2293000, 2293000, 2293000],
    '디자인학과':   [2217000, 2217000, 2217000, 2217000],
  },
};

// ======== 등록금 드롭다운 렌더링 ========
function appendTuitionMessage() {
  const group = document.createElement('div');
  group.className = 'message-group bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  const img = document.createElement('img');
  img.src = '우왕이.png';
  img.alt = '충피티';
  avatar.appendChild(img);

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = 'message-bubble-wrapper';

  const senderName = document.createElement('span');
  senderName.className = 'sender-name';
  senderName.textContent = '충피티';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble tuition-bubble';

  bubble.innerHTML = `
    <div class="tuition-title">💳 2026년 학과별 등록금 조회</div>
    <div class="tuition-desc">단과대와 학과를 선택하면 등록금(수업료)을 확인할 수 있어요!</div>
    <div class="tuition-selects">
      <select class="tuition-select" id="collegeSelect">
        <option value="">단과대 선택</option>
        ${Object.keys(TUITION_DATA).map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select class="tuition-select" id="deptSelect" disabled>
        <option value="">학과 선택</option>
      </select>
    </div>
    <div class="tuition-result" id="tuitionResult" style="display:none">
      <table class="tuition-table">
        <thead><tr><th>학년</th><th>수업료</th></tr></thead>
        <tbody id="tuitionBody"></tbody>
      </table>
      <div class="tuition-note">※ 입학금 별도 · 매년 변동될 수 있으니 공식 홈페이지를 꼭 확인하세요</div>
    </div>
    <div class="tuition-info">
      <div class="tuition-info-section">
        <div class="tuition-info-label">📅 납부 일정 안내</div>
        <li><strong>신입생:</strong> 합격자 발표 시 안내된 별도 기간 내 납부</li>
        <li><strong>재학생·복학생·수료후등록생</strong></li>
        <li class="sub-li">1학기: 2월 말경 (학기 개시 전 10일 이내)</li>
        <li class="sub-li">2학기: 8월 말경 (학기 개시 전 10일 이내)</li>
        <div class="notice">※ 매 학기 정확한 일정은 학교 홈페이지 공지사항을 꼭 확인해 주세요.</div>
      </div>
      <div class="tuition-info-section">
        <div class="tuition-info-label">🧾 고지서 확인 방법</div>
        <li>개신누리 로그인 → 학생서비스 → 장학/등록 → 등록고지서 출력</li>
        <div class="notice">※ 등록금 납부 전날 오전 9시부터 조회 및 출력 가능합니다.</div>
      </div>
    </div>
    <div class="tuition-links">
      <a class="source-chip" href="https://www.cbnu.ac.kr/www/contents.do?key=485" target="_blank" rel="noopener">🔗 등록금 반환 안내</a>
      <a class="source-chip" href="https://www.cbnu.ac.kr/www/selectBbsNttList.do?bbsNo=92&key=487" target="_blank" rel="noopener">🔗 자주하는 질문</a>
      <a class="source-chip" href="https://eis.cbnu.ac.kr" target="_blank" rel="noopener">🔗 개신누리 로그인</a>
    </div>
  `;

  const timeEl = document.createElement('span');
  timeEl.className = 'message-time';
  timeEl.textContent = formatTime(new Date());

  bubbleWrapper.appendChild(senderName);
  bubbleWrapper.appendChild(bubble);
  bubbleWrapper.appendChild(timeEl);
  group.appendChild(avatar);
  group.appendChild(bubbleWrapper);
  messagesContainer.appendChild(group);

  // 이벤트 연결 (DOM에 추가된 후)
  const collegeSelect = bubble.querySelector('#collegeSelect');
  const deptSelect = bubble.querySelector('#deptSelect');
  const tuitionResult = bubble.querySelector('#tuitionResult');
  const tuitionBody = bubble.querySelector('#tuitionBody');

  collegeSelect.addEventListener('change', () => {
    const college = collegeSelect.value;
    deptSelect.innerHTML = '<option value="">학과 선택</option>';
    deptSelect.disabled = !college;
    tuitionResult.style.display = 'none';

    if (college) {
      Object.keys(TUITION_DATA[college]).forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        deptSelect.appendChild(opt);
      });
    }
  });

  deptSelect.addEventListener('change', () => {
    const college = collegeSelect.value;
    const dept = deptSelect.value;
    if (!college || !dept) { tuitionResult.style.display = 'none'; return; }

    const fees = TUITION_DATA[college][dept];
    const labels = ['1학년', '2학년', '3학년', '4학년 이상'];
    tuitionBody.innerHTML = fees.map((fee, i) =>
      fee !== null
        ? `<tr><td>${labels[i]}</td><td>${fee.toLocaleString()}원</td></tr>`
        : ''
    ).join('');
    tuitionResult.style.display = 'block';
  });

  group.style.opacity = '0';
  group.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    group.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    group.style.opacity = '1';
    group.style.transform = 'translateY(0)';
  });
}

// ======== 학식 메뉴 렌더링 ========
const RESTAURANT_ICONS = { '한빛식당': '🌟', '별빛식당': '⭐', '은하수식당': '🌌' };
const DAY_KR = ['월', '화', '수', '목', '금'];

function appendCafeteriaMessage(menu, dayIndex) {
  const group = document.createElement('div');
  group.className = 'message-group bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  const img = document.createElement('img');
  img.src = '우왕이.png';
  img.alt = '충피티';
  avatar.appendChild(img);

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = 'message-bubble-wrapper';

  const senderName = document.createElement('span');
  senderName.className = 'sender-name';
  senderName.textContent = '충피티';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble cafeteria-bubble';

  const todayLabel = dayIndex >= 0
    ? `오늘(${DAY_KR[dayIndex]}) 학식 메뉴 🍽️`
    : '주말에는 학생식당이 운영하지 않아요 😊';

  let html = `<div class="cafe-title">${todayLabel}</div>`;

  if (dayIndex >= 0) {
    for (const [restName, meals] of Object.entries(menu.restaurants)) {
      const icon = RESTAURANT_ICONS[restName] || '🍴';
      html += `<div class="cafe-restaurant">`;
      html += `<div class="cafe-rest-name">${icon} ${restName}</div>`;

      for (const [mealName, mealData] of Object.entries(meals)) {
        const items = mealData.days[dayIndex];
        html += `<div class="cafe-meal-label">${mealName} <span class="cafe-time">${mealData.time}</span></div>`;

        if (!items || items.length === 0) {
          html += `<div class="cafe-closed">미운영</div>`;
          continue;
        }

        html += `<table class="cafe-table"><thead><tr><th>코너</th><th>반찬</th><th>가격</th></tr></thead><tbody>`;
        for (const item of items) {
          const sides = item.sides.join(', ') || '-';
          const price = item.memberPrice
            ? `${item.price}<br><small>${item.memberPrice}</small>`
            : item.price || '-';
          html += `<tr><td><strong>${item.name}</strong></td><td>${sides}</td><td>${price}</td></tr>`;
        }
        html += `</tbody></table>`;
      }
      html += `</div>`;
    }
    const dateStr = menu.days[dayIndex] || '';
    html += `<div class="cafe-footer">📅 ${dateStr} 기준 · <a href="https://www.cbnucoop.com/service/restaurant/" target="_blank" rel="noopener">생협 사이트</a></div>`;
  }

  bubble.innerHTML = html;

  const timeEl = document.createElement('span');
  timeEl.className = 'message-time';
  timeEl.textContent = formatTime(new Date());

  bubbleWrapper.appendChild(senderName);
  bubbleWrapper.appendChild(bubble);
  bubbleWrapper.appendChild(timeEl);
  group.appendChild(avatar);
  group.appendChild(bubbleWrapper);
  messagesContainer.appendChild(group);

  group.style.opacity = '0';
  group.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    group.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    group.style.opacity = '1';
    group.style.transform = 'translateY(0)';
  });
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
