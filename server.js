require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// QA 데이터 로드
let qaContext = '';
try {
  const qaData = JSON.parse(fs.readFileSync(path.join(__dirname, 'qa_data.json'), 'utf8'));
  const validPairs = qaData.qa_pairs.filter(q => !q.answer.includes('[데이터 입력 필요]'));
  qaContext = '\n\n## 자주 묻는 질문 참고 데이터\n' +
    validPairs.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');
} catch {}

const SYSTEM_PROMPT = `당신은 충북대학교 공식 안내 챗봇 **충피티(ChungPT)**입니다.

---

## 역할 및 범위

- 충북대학교에 관한 정보만 안내합니다.
- 안내 가능한 주제: 학과 정보, 졸업요건, 수강신청, 장학금, 기숙사, 도서관, 학사일정, 교수 연락처, 교내 시설, 동아리·소모임, 학식 메뉴, 입학 안내, 취업 정보 등 충북대학교 관련 사항 전반.
- 안내 불가한 주제: 타 대학 정보, 외부 맛집 추천, 개인 성적 조회, 법률·의료 상담 등 충북대학교와 무관한 사항.

---

## 말투 (최우선 원칙 — 모든 답변에 반드시 적용)

당신의 말투는 **상큼하고 살짝 귀여운 친한 선배** 스타일입니다. 내적으로는 충북대 자부심이 넘치지만, 겉으로는 자연스럽고 밝게 표현합니다.

- 딱딱한 문어체 금지. 항상 구어체로 편하게 말하세요.
- 문장 끝을 "~입니다" 보다 "~이에요", "~해요", "~거든요" 등으로 자연스럽게 마무리하세요.
- 이모지는 문장 끝이나 항목 앞에 **적절히** 사용하세요 (과하지 않게, 2~4개 정도).
- 정보를 전달할 때도 딱딱하지 않게, 마치 친구에게 알려주듯 말하세요.
- 예시 말투:
  - ❌ "충북대학교 도서관은 월요일부터 금요일까지 운영됩니다."
  - ✅ "충북대 도서관은 월~금 운영이에요! 📚 시험 기간엔 연장도 하니까 참고하세요 😊"

## 답변 형식

- **길이**: 단순 질문은 2~3문장, 복잡한 안내는 목록 활용.
- **구조**: 핵심 답변 먼저, 보충 설명은 이후. 필요 시 번호 목록이나 소제목 활용.

---

## 인사 규칙

- **첫 번째 메시지**에만 인사합니다: "안녕하세요! 충북대학교 안내 챗봇 충피티입니다. 무엇이든 물어보세요 😊"
- 이후 질문부터는 인사 없이 바로 답변합니다.
- 대화 중간에 "안녕하세요", "충피티입니다" 등의 자기소개를 반복하지 않습니다.

---

## 범위 외 질문 처리

충북대학교와 무관한 질문을 받으면 다음 고정 문구로 정중히 거절합니다:
"죄송합니다, 저는 충북대학교 관련 질문만 답변드릴 수 있습니다. 충북대학교에 대해 궁금한 점이 있으시면 언제든지 물어보세요! 😊"

절대로 범위 외 정보를 추측하거나 외부 정보를 바탕으로 답변하지 않습니다.

---

## 모를 때 처리

데이터에 없거나 확실하지 않은 정보는 다음 방식으로 안내합니다:
1. 모른다는 사실을 명확히 인정합니다. 절대 추측하지 않습니다.
2. 담당 부서 또는 연락처를 안내합니다.

연락처 정보가 없는 경우: "해당 내용은 충북대학교 홈페이지(https://www.chungbuk.ac.kr) 또는 담당 부서에 직접 문의하시면 정확한 안내를 받으실 수 있습니다."

---

## 거짓·오류 정보 포함 질문 처리

질문에 사실과 다른 정보가 포함된 경우, 수정하여 답변합니다. 거짓 정보를 그대로 인정하거나 동조하지 않습니다.

---

## 주의사항

- 위키피디아, 나무위키, 티스토리 등 수정 가능한 비공식 출처는 참조하지 않습니다.
- 공식 출처(충북대학교 홈페이지, 공문, 학칙 등)에 근거하여 답변합니다.
- 개인정보(학번, 성적, 개인 연락처 등)는 취급하지 않습니다.
- 답변에 확신이 없을 때는 "~인 것으로 알고 있습니다만, 정확한 확인은 담당 부서에 문의해 주세요"라고 명시합니다.
- 수강신청·장학금·학사일정 등 날짜가 필요한 질문은 반드시 Google 검색으로 충북대 공식 사이트를 확인하세요.`;

// Supabase 공지사항 검색
async function searchNotices(query) {
  const cleanQuery = query.replace(/[?？!！.,~\n]/g, '').trim();
  if (!cleanQuery) return [];

  // 1단계: 전체 문장으로 제목 검색
  const { data: fullMatch } = await supabase
    .from('notices')
    .select('title, content, url, category, date')
    .ilike('title', `%${cleanQuery}%`)
    .limit(3);

  if (fullMatch && fullMatch.length > 0) return fullMatch;

  // 2단계: 단어별로 쪼개서 제목 검색 (2글자 이상 단어만)
  const words = cleanQuery.split(/\s+/).filter(w => w.length >= 2);
  for (const word of words.slice(0, 5)) {
    const { data: wordMatch } = await supabase
      .from('notices')
      .select('title, content, url, category, date')
      .ilike('title', `%${word}%`)
      .limit(3);

    if (wordMatch && wordMatch.length > 0) return wordMatch;
  }

  return [];
}

// Gemini uses {role, parts:[{text}]} format
const conversationHistory = new Map();

app.post('/api/chat', async (req, res) => {
  const { message, sessionId, userTypeContext } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: '메시지를 입력해주세요.' });
  }

  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }

  const history = conversationHistory.get(sessionId);

  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }

  try {
    // Supabase 1차 검색
    const notices = await searchNotices(message);
    let noticeContext = '';
    if (notices.length > 0) {
      const noticeList = notices.map(n =>
        `제목: ${n.title}\n카테고리: ${n.category}${n.date ? ' | 날짜: ' + n.date : ''}\n내용: ${(n.content || '').slice(0, 300)}\n출처: ${n.url}`
      ).join('\n\n');
      noticeContext = `\n\n## 충북대 공지사항 데이터베이스 검색 결과\n아래 공지를 우선적으로 참고하여 답변하세요.\n\n${noticeList}`;
    }

    const fullPrompt = SYSTEM_PROMPT + qaContext + noticeContext +
      (userTypeContext ? `\n\n## 현재 사용자 유형\n${userTypeContext}` : '');

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: fullPrompt,
      tools: [{ googleSearch: {} }],
      generationConfig: {
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const response = result.response;
    const assistantMessage = response.text();

    // Extract grounding sources if available
    const sources = [];
    const groundingMeta = response.candidates?.[0]?.groundingMetadata;
    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      }
    }

    // Store only text in history to avoid issues with grounding metadata parts
    history.push({ role: 'user', parts: [{ text: message }] });
    history.push({ role: 'model', parts: [{ text: assistantMessage }] });

    res.json({ message: assistantMessage, sources });
  } catch (error) {
    console.error('Gemini API 오류:', error);
    if (error.status === 400 || error.message?.includes('API_KEY')) {
      res.status(401).json({ error: 'API 키가 유효하지 않습니다. .env 파일을 확인해주세요.' });
    } else {
      res.status(500).json({ error: '응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
  }
});

app.post('/api/clear', (req, res) => {
  const { sessionId } = req.body;
  conversationHistory.delete(sessionId);
  res.json({ success: true });
});

// 사용자 의견 저장
app.post('/api/feedback', async (req, res) => {
  const { content, sessionId } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '의견 내용을 입력해주세요.' });
  }
  const { error } = await supabase
    .from('feedback')
    .insert({ content: content.trim(), session_id: sessionId });

  if (error) {
    console.error('피드백 저장 오류:', error);
    return res.status(500).json({ error: '저장에 실패했습니다.' });
  }
  res.json({ success: true });
});

// 관리자 페이지
app.get('/admin', async (req, res) => {
  const { password } = req.query;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>충피티 관리자</title>
  <style>
    body { font-family: 'Pretendard', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f4ff; }
    .box { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
    h2 { color: #1a56db; margin-bottom: 24px; }
    input { padding: 10px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; width: 200px; }
    button { margin-left: 8px; padding: 10px 20px; background: #1a56db; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="box">
    <h2>🔒 충피티 관리자</h2>
    <form action="/admin" method="get">
      <input type="password" name="password" placeholder="비밀번호 입력" autofocus />
      <button type="submit">확인</button>
    </form>
  </div>
</body>
</html>`);
  }

  const { data: feedbacks, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).send('데이터 불러오기 실패');
  }

  const rows = (feedbacks || []).map(f => `
    <tr>
      <td>${f.id}</td>
      <td>${new Date(f.created_at).toLocaleString('ko-KR')}</td>
      <td style="white-space:pre-wrap">${f.content.replace(/</g, '&lt;')}</td>
    </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>충피티 관리자</title>
  <style>
    body { font-family: 'Pretendard', sans-serif; padding: 40px; background: #f0f4ff; }
    h2 { color: #1a56db; }
    .count { color: #666; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    th { background: #1a56db; color: white; padding: 14px 16px; text-align: left; }
    td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8f9ff; }
    .refresh { float: right; padding: 8px 16px; background: #1a56db; color: white; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <h2>📋 충피티 사용자 의견</h2>
  <p class="count">총 ${(feedbacks || []).length}건 <a class="refresh" href="/admin?password=${password}">새로고침</a></p>
  <table>
    <tr><th>#</th><th>날짜</th><th>의견</th></tr>
    ${rows || '<tr><td colspan="3" style="text-align:center;color:#999;padding:40px">아직 의견이 없습니다</td></tr>'}
  </table>
</body>
</html>`);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`충피티 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  });
}

module.exports = app;
