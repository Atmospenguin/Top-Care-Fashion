// Quick PG connectivity test for Supabase
// Usage: node test-pg-connection.js
const { Client } = require('pg');

async function test(name, connectionString) {
	const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
	const start = Date.now();
	try {
		await client.connect();
		const res = await client.query('select 1 as ok');
		const ms = Date.now() - start;
		console.log(`[${name}] connected in ${ms}ms ->`, res.rows[0]);
	} catch (err) {
		console.error(`[${name}] FAILED:`, err.message);
	} finally {
		try { await client.end(); } catch {}
	}
}

async function main() {
	const { DATABASE_URL, DIRECT_URL } = process.env;
	if (!DATABASE_URL) console.warn('DATABASE_URL not set');
	if (!DIRECT_URL) console.warn('DIRECT_URL not set');
	await test('DATABASE_URL', DATABASE_URL);
	await test('DIRECT_URL', DIRECT_URL);
}

main().catch((e) => {
	console.error('Unexpected error:', e);
	process.exit(1);
});
