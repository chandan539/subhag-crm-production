const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.yhfzwctpegpucfjixgmb:jrcQEDFmcfZQGWE9@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});
client.connect()
  .then(() => {
    console.log('Connected!');
    client.end();
  })
  .catch(e => console.error('Connection error', e.stack));
