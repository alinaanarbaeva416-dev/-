import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to get AI Insights for sales
  app.post('/api/insights', async (req, res) => {
    try {
      const { salesData, expenseData, returnsData, productData } = req.body;
      
      const prompt = `Сен заманбап веб-кассанын профессионалдуу бизнес-аналитик жардамчысысың. 
      Төмөнкү маалыматтарды талдап, дүкөн ээсине пайдалуу, конкреттүү жана аракетке багытталган 3-5 кеңеш бер. 
      Кыргыз тилинде жаз. Текст кыска жана так болсун. 
      Эгерде маалымат жетишсиз болсо, жалпы кеңештерди бер.

      Маалыматтар:
      - Сатуулар (Transactions): ${JSON.stringify(salesData?.slice(-20))}
      - Чыгымдар (Expenses): ${JSON.stringify(expenseData)}
      - Кайтаруулар (Returns): ${JSON.stringify(returnsData)}
      - Складдагы товарлар (Products): ${JSON.stringify(productData?.map((p: any) => ({ name: p.name, stock: p.stock })))}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('AI Insight error:', error);
      res.status(500).json({ error: 'AI кызматы убактылуу иштебей жатат.' });
    }
  });

  // Vite integration
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
