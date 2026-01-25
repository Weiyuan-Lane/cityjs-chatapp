import express from 'express';
import path from 'path';
import { parse } from 'marked';
import { fileURLToPath } from 'url';

// Polyfill for __dirname for node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json())
const port = 8080;

//import generateAnswer from './homework.js';
import generateAnswer from './homeworks/3-grounding-homework.js';

// Chat implementation
app.post('/chat', async (req, res) => {
  try {
    const chatResponse = await generateAnswer(req.body.message);
    chatResponse.message = parse(chatResponse.message);
    res.status(200).send(chatResponse);
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Server Error');
  }
});

// HTML Content
app.use(express.static(path.join(__dirname, '../dist/chat-with-gemini/browser')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist/chat-with-gemini/browser/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});