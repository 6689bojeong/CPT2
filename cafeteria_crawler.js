const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const RESTAURANT_URL = 'https://www.cbnucoop.com/service/restaurant/';
const OUTPUT_FILE = path.join(__dirname, 'cafeteria_menu.json');

// 배열로 정의해야 숫자형 키 자동정렬 버그 없이 순서 보장됨
const RESTAURANT_MAP = {
  '18': {
    name: '한빛식당',
    meals: [
      { id: '8',  name: '점심', time: '11:00~14:00' },
      { id: '10', name: '저녁', time: '17:00~18:40' },
    ],
  },
  '19': {
    name: '별빛식당',
    meals: [
      { id: '9', name: '아침', time: '08:00~10:00' },
      { id: '7', name: '점심', time: '11:30~14:00' },
    ],
  },
  '20': {
    name: '은하수식당',
    meals: [
      { id: '6',  name: '점심', time: '11:30~13:30' },
      { id: '13', name: '저녁', time: '17:30~19:00' },
    ],
  },
};

const DAY_NAMES = ['월', '화', '수', '목', '금'];

async function crawlCafeteria() {
  const res = await axios.get(RESTAURANT_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    responseType: 'arraybuffer',
    timeout: 15000,
  });

  const html = Buffer.from(res.data).toString('utf-8');
  // HTML 주석 제거 후 파싱 (메뉴 데이터가 주석 밖 #menu-result에 있음)
  const htmlClean = html.replace(/<!--[\s\S]*?-->/g, '');
  const $ = cheerio.load(htmlClean);

  // 요일 날짜 추출 (탭 공통, 첫 번째 탭 기준)
  const days = [];
  $('#tab1 .weekday-title').each((i, el) => {
    days.push($(el).text().trim()); // e.g. "06.02(화요일)"
  });

  // 결과 구조 초기화
  const result = {
    crawled_at: new Date().toISOString(),
    days,                    // ["06.02(화요일)", ...]
    restaurants: {},
  };

  // id -> mealInfo 역방향 맵 (크롤링 시 빠른 조회용)
  const mealById = {};
  for (const restInfo of Object.values(RESTAURANT_MAP)) {
    result.restaurants[restInfo.name] = {};
    for (const mealInfo of restInfo.meals) {
      result.restaurants[restInfo.name][mealInfo.name] = {
        time: mealInfo.time,
        days: Array(5).fill(null).map(() => []),
      };
      mealById[`${Object.keys(RESTAURANT_MAP).find(k => RESTAURANT_MAP[k] === restInfo)}-${mealInfo.id}`] = {
        restName: restInfo.name,
        mealName: mealInfo.name,
      };
    }
  }

  // #menu-result 내 .menu 파싱
  $('#menu-result .menu').each((_, el) => {
    const dataTable = $(el).attr('data-table');
    if (!dataTable) return;

    const parts = dataTable.split('-');
    if (parts.length !== 4) return;

    const [restId, mealTypeId, , dayIndexStr] = parts;
    const dayIdx = parseInt(dayIndexStr);
    if (isNaN(dayIdx) || dayIdx < 0 || dayIdx > 4) return;

    const mapping = mealById[`${restId}-${mealTypeId}`];
    if (!mapping) return;
    const { restName, mealName } = mapping;

    const items = [];
    $(el).find('.menu-body').each((_, menuBody) => {
      const name = $(menuBody).find('.card-header').text().trim();
      if (!name) return;
      // 미운영/휴무 항목은 건너뜀 → days[dayIdx]가 빈 배열로 남아 미운영 표시
      if (name.includes('미운영') || name.includes('휴무') || name.includes('판매중단')) return;

      const sides = [];
      $(menuBody).find('.side').each((_, side) => {
        const text = $(side).text().trim();
        if (text) sides.push(text);
      });

      // 가격: ￦9000 형태
      const bodyText = $(menuBody).find('.card-body').text();
      const priceMatches = [...bodyText.matchAll(/[￥￦]\s*([\d,]+)/g)];
      const price = priceMatches.length > 0 ? `${priceMatches[0][1]}원` : '';
      const memberPrice = priceMatches.length > 1 ? `${priceMatches[1][1]}원(조합원)` : '';

      items.push({ name, sides, price, memberPrice });
    });

    result.restaurants[restName][mealName].days[dayIdx] = items;
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[학식크롤러] 완료 - ${days[0] || '?'} 주간 메뉴 저장`);
  return result;
}

function loadCafeteriaMenu() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

module.exports = { crawlCafeteria, loadCafeteriaMenu };
