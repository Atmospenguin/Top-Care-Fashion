// Maintenance script: clean up inconsistent states for listings vs transactions
// - Unlist any listings that have a transaction
// - Mark listings as sold if their transaction is completed

const mysql = require('mysql2/promise');

(async function main() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'top_care_fashion',
  };

  const conn = await mysql.createConnection(dbConfig);
  try {
    console.log('Cleaning up listings with transactions...');
    const [r1] = await conn.execute(`
      UPDATE listings l
      SET l.listed = 0
      WHERE l.listed = 1 AND EXISTS (
        SELECT 1 FROM transactions t WHERE t.listing_id = l.id
      )
    `);
    console.log(`Unlisted listings due to transactions: ${r1.affectedRows}`);

    console.log('Marking sold listings based on completed transactions...');
    const [r2] = await conn.execute(`
      UPDATE listings l
      JOIN transactions t ON t.listing_id = l.id
      SET l.sold = 1, l.sold_at = COALESCE(l.sold_at, NOW())
      WHERE t.status = 'completed'
    `);
    console.log(`Listings marked as sold: ${r2.affectedRows}`);

    console.log('Cleanup completed.');
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();

