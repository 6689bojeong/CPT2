require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function upload() {
  const data = JSON.parse(fs.readFileSync('충피티_정제완료.json', 'utf8'));

  console.log(`총 ${data.length}개 업로드 시작...`);

  // 50개씩 나눠서 업로드 (한 번에 너무 많으면 오류 날 수 있음)
  const chunkSize = 50;
  let successCount = 0;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);

    const { error } = await supabase.from('notices').insert(chunk);

    if (error) {
      console.error(`${i}~${i + chunk.length}번 오류:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`✓ ${successCount}/${data.length}개 완료`);
    }
  }

  console.log(`\n업로드 완료! 성공: ${successCount}개`);
}

upload();
