const { Client } = require('pg');

async function checkMenus() {
  const client = new Client({
    connectionString: "postgresql://huanpv@localhost:5432/sll_database"
  });
  await client.connect();
  const res = await client.query('SELECT * FROM menus ORDER BY date DESC');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

checkMenus().catch(console.error);
