// Usage: 直接执行 `node scripts/unlist_sold.js`
// 本脚本会自动尝试读取 web/.env.local 或 .env；也可通过环境变量传入
// 脚本会把至少有一笔 completed 交易的商品设置为 sold=1、listed=0，并回填 sold_at

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnvFromFile() {
  const candidates = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break; // 读到一个就够了
  }
}

async function run() {
  loadEnvFromFile();

  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const DB_PORT = Number(process.env.DB_PORT) || 3306;
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error('Missing DB env vars. Please set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('当前读取到的配置 =>', { DB_HOST, DB_USER, DB_NAME, DB_PORT });
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
  });

  try {
    const [preview] = await conn.execute(
      `SELECT l.id
       FROM listings l
       JOIN transactions t ON t.listing_id = l.id AND t.status = 'completed'
       WHERE l.listed = 1 OR l.sold = 0
       GROUP BY l.id`
    );

    console.log(`Listings to update: ${preview.length}`);
    if (preview.length) {
      const [res] = await conn.execute(
        `UPDATE listings l
         JOIN (
           SELECT listing_id, MIN(created_at) AS first_completed
           FROM transactions
           WHERE status = 'completed'
           GROUP BY listing_id
         ) t ON t.listing_id = l.id
         SET l.sold = 1,
             l.listed = 0,
             l.sold_at = COALESCE(l.sold_at, t.first_completed)`
      );
      console.log('Rows affected:', res.affectedRows);
    }
  } catch (err) {
    console.error('Error updating listings:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

run();
