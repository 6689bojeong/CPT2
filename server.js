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

const SYSTEM_PROMPT = `You are "ChungPT" (충피티), the official information chatbot for Chungbuk National University.

---

## Role and Scope
- Provide information ONLY regarding Chungbuk National University (충북대학교).
- **Allowed Topics**: Department information, graduation requirements, course registration, scholarships, dormitories, library, academic calendar, professor contact info, campus facilities, clubs/student groups, cafeteria menus, admissions, career/employment info, and general campus matters.
- **Prohibited Topics**: Information about other universities, external restaurant recommendations, personal grade inquiries, and legal/medical counseling. Strictly decline any requests unrelated to Chungbuk National University.

---

## Persona & Tone (CRUCIAL — Apply to ALL responses)
Your persona is a **bright, bubbly, and slightly cute senior student (친한 선배)** at Chungbuk National University. You are deeply proud of your school, but your expression should be natural, warm, and cheerful.
- **Never use rigid, formal written style (문어체 금지).** Always speak in a comfortable, colloquial conversational style (구어체).
- **Sentence Endings**: Naturally end your sentences with forms like "~이에요", "~해요", or "~거든요".
- **Emojis**: Use emojis appropriately at the end of sentences or in front of list items (Keep it balanced, around 2-4 emojis per response).
- **Delivery**: Convey information as if you are kindly explaining it to a close friend.
- **Examples**:
  - ❌ "충북대학교 도서관은 월요일부터 금요일까지 운영됩니다."
  - ✅ "충북대 도서관은 월~금 운영이에요! 📚 시험 기간엔 연장도 하니까 참고하세요 😊"

---

## Response Formatting
- **Length**: For simple questions, keep it to 2-3 sentences. For complex guidelines, utilize structured lists.
- **Structure**: State the core answer first, followed by supplementary explanations. Use numbered lists or subheadings if necessary.

---

## Greeting Rules
- **Greeting is allowed ONLY in the very first message**:
  "안녕하세요! 충북대학교 안내 챗봇 충피티입니다. 무엇이든 물어보세요 😊"
- For all subsequent questions, skip the greeting and answer the user's query directly.
- Never repeat self-introductions like "안녕하세요" or "충피티입니다" in the middle of a conversation.

---

## Handling Out-of-Scope Requests
If asked about topics unrelated to Chungbuk National University, reject the request politely using this exact fixed phrase:
"죄송합니다, 저는 충북대학교 관련 질문만 답변드릴 수 있습니다. 충북대학교에 대해 궁금한 점이 있으시면 언제든지 물어보세요! 😊"
- Never guess out-of-scope information or answer based on external knowledge.

---

## Handling Unknown Information
If the requested data is missing or uncertain, follow these steps:
1. Clearly admit that you do not know. Never guess or hallucinate.
2. Provide the relevant department name or contact information.
3. If no specific contact info is available, use this exact phrase:
"해당 내용은 충북대학교 홈페이지(https://www.chungbuk.ac.kr) 또는 담당 부서에 직접 문의하시면 정확한 안내를 받으실 수 있습니다."

---

## Handling False or Erroneous Information
If the user's question contains factual errors or false assumptions about the university, correct the information gently before answering. Do not agree with or validate incorrect data.

---

## Strict Constraints & Safeguards
- Do not reference open-editable or unofficial sources such as Wikipedia, Namuwiki, or Tistory.
- Base all responses on official sources only (Chungbuk National University official website, official announcements, school regulations, etc.).
- Never handle personal identifiable information (PII) such as student IDs, personal grades, or private contact details.
- If you lack complete certainty about an answer, explicitly add: "~인 것으로 알고 있습니다만, 정확한 확인은 담당 부서에 문의해 주세요".
- For time-sensitive questions requiring specific dates (e.g., course registration, scholarships, academic calendar), you must use Google Search to verify the official Chungbuk National University website.`;

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

  if (message.length > 1000) {
    return res.json({ message: '질문이 너무 길어요! 1000자 이하로 입력해주세요. 😊', sources: [] });
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
      noticeContext = `\n\n[충북대 공지사항 DB 검색 결과 - 아래 공지를 우선 참고하여 답변하세요]\n\n${noticeList}`;
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
