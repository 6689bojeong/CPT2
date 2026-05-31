const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('충피티 크롤링_최종.json', 'utf8'));

function cleanContent(title, content) {
  // 1. 제목이 content 안에 두 번 나오는 경우 → 두 번째 등장 이후부터 실제 본문
  const titleIdx = content.indexOf(title);
  if (titleIdx !== -1) {
    content = content.slice(titleIdx + title.length).trim();
  }

  // 2. 푸터 노이즈 제거 (이 패턴 이후는 전부 쓸모없음)
  const footerMarkers = [
    '대학생활-공지사항 상세보기',
    '게시물삭제',
    '이전글',
    '목록',
  ];
  for (const marker of footerMarkers) {
    const idx = content.indexOf(marker);
    if (idx !== -1) {
      content = content.slice(0, idx).trim();
    }
  }

  // 3. 앞에 남은 네비게이션 찌꺼기 제거 (공지글 신청 이후부터)
  const navEnd = content.indexOf('공지글 신청');
  if (navEnd !== -1) {
    content = content.slice(navEnd + '공지글 신청'.length).trim();
  }

  // 4. "이미지 확대보기" 같은 잔여 UI 텍스트 제거
  content = content.replace(/이미지 확대보기/g, '').trim();

  return content;
}

function extractDate(content) {
  // content에서 날짜 패턴 추출 (2026.05.22 형식)
  const matches = content.match(/20\d{2}\.\d{2}\.\d{2}/g);
  if (matches && matches.length > 0) {
    return matches[0]; // 첫 번째 날짜
  }
  return null;
}

const is404 = content => content.includes('404 에러페이지') || content.includes('페이지를 찾을 수 없습니다');

let removed404 = 0;

const cleaned = raw
  .filter(item => {
    if (is404(item.content)) { removed404++; return false; }
    return true;
  })
  .map(item => {
    const cleanedContent = cleanContent(item.title, item.content);
    const extractedDate = extractDate(item.content);

    return {
      category: item.category,
      title: item.title,
      url: item.url,
      date: extractedDate,
      view_count: Number(item.date),
      content: cleanedContent,
    };
  })
  .filter(item => item.content.length > 30); // 정제 후 내용 너무 짧은 것도 제거

console.log(`원본: ${raw.length}개`);
console.log(`404 삭제된 항목: ${removed404}개`);
console.log(`최종 유효 데이터: ${cleaned.length}개`);

const cats = {};
cleaned.forEach(item => { cats[item.category] = (cats[item.category] || 0) + 1; });
console.log('\n카테고리별 유효 데이터:');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([cat, count]) => console.log(`  ${cat}: ${count}개`));

const avgBefore = raw.reduce((s, i) => s + i.content.length, 0) / raw.length;
const avgAfter = cleaned.reduce((s, i) => s + i.content.length, 0) / cleaned.length;
console.log(`\ncontent 평균 길이: ${Math.round(avgBefore)}자 → ${Math.round(avgAfter)}자`);

console.log('\n--- 정제 결과 샘플 ---');
console.log('제목:', cleaned[0].title);
console.log('날짜:', cleaned[0].date);
console.log('content:', cleaned[0].content.slice(0, 200));

fs.writeFileSync('충피티_정제완료.json', JSON.stringify(cleaned, null, 2), 'utf8');
console.log('\n정제된 파일 저장 완료: 충피티_정제완료.json');
