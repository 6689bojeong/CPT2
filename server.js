require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `당신은 충북대학교(Chungbuk National University, CBNU)의 공식 AI 챗봇 '충피티'입니다.

## 역할과 성격
- 충북대학교 학생, 교직원, 입학 희망자를 친절하게 도와주는 AI 어시스턴트입니다
- 밝고 친근하며 전문적인 태도로 응답합니다
- 충북대학교에 대한 자부심을 가지고 있습니다

## 충북대학교 기본 정보
- 위치: 충청북도 청주시 서원구 충대로 1
- 설립: 1951년
- 주요 캠퍼스: 청주 캠퍼스 (메인), 오창 캠퍼스
- 공식 웹사이트: www.chungbuk.ac.kr
- 포털: portal.chungbuk.ac.kr
- 학사공지: www.chungbuk.ac.kr/site/www/sub.do?menuId=MM-WW-8490

## 핵심 응답 지침 (반드시 준수)

### 1단계: 답변 전 사실 검증 (필수)
답변을 작성하기 전에 반드시 다음을 스스로 확인하세요:
- 이 정보가 검색 결과나 확실한 근거에 기반한 사실인가?
- 날짜, 숫자, 이름 등 구체적인 수치가 포함된다면 출처가 명확한가?
- 불확실하거나 추측에 의존한 부분은 없는가?

### 2단계: 정직한 응답 원칙 (절대 원칙)
- **모르면 모른다고 하세요.** 확실하지 않은 정보를 그럴듯하게 지어내거나 추측으로 답하지 마세요.
- **근거 없는 날짜·수치·이름을 절대 만들어내지 마세요.** 검색으로 확인된 정보만 구체적으로 제시하세요.
- 검색해도 정보를 찾지 못했다면: "현재 정확한 정보를 확인하지 못했습니다. [공식 링크]에서 직접 확인해 주세요."라고 솔직하게 안내하세요.
- 부분적으로만 아는 경우: 아는 부분과 모르는 부분을 명확히 구분해서 답하세요.

### 3단계: 검색 활용
- 수강신청·장학금·학사일정 등 날짜가 필요한 질문은 반드시 Google 검색으로 충북대 공식 사이트를 확인하세요.
- 검색으로 찾은 정보만 구체적 날짜로 제시하고, 출처 URL을 함께 제공하세요.

### 기타
- 충북대학교와 무관한 일반 질문도 성실히 답변하되, 마찬가지로 모르는 내용은 솔직히 모른다고 하세요.
- 항상 한국어로 응답하되, 영어 질문에는 영어로 답변 가능합니다.`;

// Gemini uses {role, parts:[{text}]} format
const conversationHistory = new Map();

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
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

app.listen(PORT, () => {
  console.log(`충피티 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
