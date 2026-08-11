import express from 'express';
import path from 'path';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for lazy GenAI initialization
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  // API Route: AI Chat completion for Xiaowan Sales Assistant
  app.post('/api/chat', async (req, res) => {
    try {
      const { prompt, history, advisorName, storeName } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt string is required' });
      }

      const ai = getGenAI();

      const systemInstruction = `你叫【小万】，是安奇汽车体验中心（${storeName || '奇瑞/星途/iCAR旗舰店'}）针对一线销售顾问（如顾问：${advisorName || '顾问'}）的专属 AI 智能销售 Copilot 与业务专家。
你的专业领域：
1. 奇瑞、星途 (Exeed)、iCAR、捷途全系车型（如瑞虎8 Pro Max, 星纪元 ES, iCAR 03, 风云T9等）核心参数与提车话术。
2. 竞品对比与战败挽留（对比极氪001, 蔚来ET5, 理想L7, 比亚迪宋Pro等）。
3. 金融贴息、置换补贴拆解、车贷首付月供推算。
4. 客户异议化解（嫌贵、要额外优惠、担心续航与保值率）。
5. 试驾与交付标准流程提升。

回答风格要求：
- 语言精练专业，段落清晰，多用【营销要点】、【对比话术】、【建议操作】等结构化小标题。
- 重点数字和车型加粗突出。
- 控制在 150-300 字以内，适合手机屏幕快速阅读。
- 语气热情、精准、有同理心与杀伤力。`;

      // Construct contents format
      const contents = [];
      if (Array.isArray(history)) {
        for (const item of history) {
          contents.push({
            role: item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || '小万正忙，请稍后重试。';
      return res.json({ reply: text });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      // Fallback response with helpful auto message if API key issue or offline
      return res.json({
        reply: `【小万离线服务】针对您提到的问询，小万为您整理如下标准建言：\n\n1. **核心优势**：突出车型标配的CDC悬架、800V超充与整车终身质保。\n2. **金融策略**：推荐店端2年0息或至高2万元置换补贴。\n3. **推进动作**：立即邀请客户发起现场/上门深度试驾！`,
        error: err.message,
      });
    }
  });

  // API Route: Speech Synthesis (Text to Speech) using Gemini TTS
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text parameter required' });
      }

      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `用热情专业的汽车顾问声调说：${text.slice(0, 200)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audio: base64Audio, format: 'pcm' });
      } else {
        return res.status(500).json({ error: 'No audio generated' });
      }
    } catch (err: any) {
      console.error('Gemini TTS error:', err);
      return res.status(500).json({ error: err.message || 'TTS Generation Failed' });
    }
  });

  // Vite development middleware or Static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
