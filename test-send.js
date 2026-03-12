import axios from 'axios';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const testData = JSON.parse(fs.readFileSync('./test-webhook.json', 'utf8'));
const body = JSON.stringify(testData);

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const EXTERNAL_PORT = process.env.EXTERNAL_PORT || 3000;
const URL = `http://localhost:${EXTERNAL_PORT}/webhook`;

// Считаем подпись так же, как на сервере (HMAC-SHA256 hex от сырого JSON)
const signature = WEBHOOK_SECRET
  ? crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  : '';

console.log(`Отправляю тестовый запрос на ${URL}...`);
console.log('Данные:', body);

try {
  const response = await axios.post(URL, testData, {
    headers: {
      'Content-Type': 'application/json',
      ...(WEBHOOK_SECRET && { 'X-Signature': signature }),
    },
    timeout: 30000,
  });

  console.log('\n✅ Успешно! Ответ сервера:');
  console.log(JSON.stringify(response.data, null, 2));
  console.log('\nСтатус:', response.status);
} catch (error) {
  console.error('\n❌ Ошибка:');
  if (error.response) {
    console.error('Статус:', error.response.status);
    console.error('Данные:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error('Не удалось подключиться к серверу. Убедитесь, что сервер запущен и доступен по адресу', URL);
  } else {
    console.error('Ошибка:', error.message);
  }
  process.exit(1);
}
