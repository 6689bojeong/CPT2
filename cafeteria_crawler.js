require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const RESTAURANT_URL = 'https://www.cbnucoop.com/service/restaurant/';

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

async function crawlCafeteria() {
  const res = await axios.get(RESTAURANT_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    responseType: 'arraybuffer',
    timeout: 15000,
  });

  const html = Buffer.from(res.data).toString('utf-8');
  const htmlClean = html.replace(/<!--[\s\S]*?-->/g, '');
  const $ = cheerio.load(htmlClean);

  const days = [];
  $('#tab1 .weekday-title').each((i, el) => {
    days.push($(el).text().trim());
  });

  const result = {
    crawled_at: new Date().toISOString(),
    days,
    restaurants: {},
  };

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
      if (name.includes('미운영') || name.includes('휴무') || name.includes('판매중단')) return;

      const sides = [];
      $(menuBody).find('.side').each((_, side) => {
        const text = $(side).text().trim();
        if (text) sides.push(text);
      });

      const bodyText = $(menuBody).find('.card-body').text();
      const priceMatches = [...bodyText.matchAll(/[￥￦]\s*([\d,]+)/g)];
      const price = priceMatches.length > 0 ? `${priceMatches[0][1]}원` : '';
      const memberPrice = priceMatches.length > 1 ? `${priceMatches[1][1]}원(조합원)` : '';

      items.push({ name, sides, price, memberPrice });
    });

    result.restaurants[restName][mealName].days[dayIdx] = items;
  });

  const { error } = await supabase
    .from('cafeteria_cache')
    .upsert({ id: 1, data: result, crawled_at: result.crawled_at });

  if (error) throw new Error('Supabase 저장 실패: ' + error.message);

  console.log(`[학식크롤러] 완료 - ${days[0] || '?'} 주간 메뉴 저장`);
  return result;
}

async function loadCafeteriaMenu() {
  const { data, error } = await supabase
    .from('cafeteria_cache')
    .select('data, crawled_at')
    .eq('id', 1)
    .single();

  if (error || !data) return null;
  return data.data;
}

function isStale(crawledAt) {
  const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(crawledAt).getTime() > SIX_DAYS_MS;
}

module.exports = { crawlCafeteria, loadCafeteriaMenu, isStale };
