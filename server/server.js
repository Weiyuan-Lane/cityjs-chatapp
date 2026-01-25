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

import generateAnswer from './homework.js';
// import generateAnswer from './homeworks/1-prompt-homework.js';

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

// Streaming chat implementation using SSE
app.post('/chat-stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  try {
    let accumulatedText = '';

    for await (const chunk of generateAnswer(req.body.message)) {
      if (chunk.type === 'text') {
        accumulatedText += chunk.content;
        // Send raw text chunk for real-time display
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`);
      } else if (chunk.type === 'grounding') {
        // Send grounding metadata
        res.write(`data: ${JSON.stringify({ type: 'grounding', content: chunk.content })}\n\n`);
      } else if (chunk.type === 'done') {
        // Parse the complete markdown and send final message
        const parsedContent = parse(accumulatedText);
        res.write(`data: ${JSON.stringify({ type: 'done', content: parsedContent })}\n\n`);
      }
    }

    res.end();
  } catch (e) {
    console.error(e);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Internal Server Error' })}\n\n`);
    res.end();
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