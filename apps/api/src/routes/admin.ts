import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

export const adminRouter = Router();

// In-memory runtime AI & API config store (defaults to env variables)
export let runtimeAIConfig = {
  aiProvider: 'gemini', // 'gemini' | 'openai' | 'anthropic'
  apiKey: config.geminiApiKey || '',
  modelName: 'gemini-1.5-flash',
  confidenceThreshold: 0.85,
  autoVerify: true,
  autoVerifyThreshold: 0.90,
  predictionLeadTime: 45,
  cebuanoDialect: 'Urban Metro Cebuano (Bisaya)',
};

/**
 * GET /admin/config
 * Get active AI and system configuration (with masked API key)
 */
adminRouter.get('/config', (_req: Request, res: Response) => {
  const maskedKey = runtimeAIConfig.apiKey
    ? runtimeAIConfig.apiKey.length > 8
      ? `${runtimeAIConfig.apiKey.slice(0, 4)}...${runtimeAIConfig.apiKey.slice(-4)}`
      : '********'
    : '';

  return res.json({
    success: true,
    data: {
      ...runtimeAIConfig,
      apiKeyMasked: maskedKey,
      hasApiKey: Boolean(runtimeAIConfig.apiKey),
    },
  });
});

/**
 * POST /admin/config
 * Update AI provider, API key, and thresholds
 */
adminRouter.post('/config', (req: Request, res: Response) => {
  const {
    aiProvider,
    apiKey,
    modelName,
    confidenceThreshold,
    autoVerify,
    autoVerifyThreshold,
    predictionLeadTime,
    cebuanoDialect,
  } = req.body;

  if (aiProvider) runtimeAIConfig.aiProvider = aiProvider;
  if (apiKey && apiKey.trim() !== '') runtimeAIConfig.apiKey = apiKey.trim();
  if (modelName) runtimeAIConfig.modelName = modelName;
  if (typeof confidenceThreshold === 'number') runtimeAIConfig.confidenceThreshold = confidenceThreshold;
  if (typeof autoVerify === 'boolean') runtimeAIConfig.autoVerify = autoVerify;
  if (typeof autoVerifyThreshold === 'number') runtimeAIConfig.autoVerifyThreshold = autoVerifyThreshold;
  if (typeof predictionLeadTime === 'number') runtimeAIConfig.predictionLeadTime = predictionLeadTime;
  if (cebuanoDialect) runtimeAIConfig.cebuanoDialect = cebuanoDialect;

  return res.json({
    success: true,
    message: 'AI configurations updated successfully in runtime memory.',
    data: {
      ...runtimeAIConfig,
      apiKeyMasked: runtimeAIConfig.apiKey ? `${runtimeAIConfig.apiKey.slice(0, 4)}...` : '',
    },
  });
});

/**
 * POST /admin/test-ai
 * Test the active AI provider & API key live
 */
adminRouter.post('/test-ai', async (req: Request, res: Response) => {
  const testKey = req.body.apiKey || runtimeAIConfig.apiKey;
  const provider = req.body.aiProvider || runtimeAIConfig.aiProvider;

  if (!testKey || testKey.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'No AI API Key provided to test.',
    });
  }

  if (provider === 'gemini') {
    try {
      const genAI = new GoogleGenerativeAI(testKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Translate to Cebuano (Bisaya) in 1 short sentence: "Heavy flash flood warning along riverbanks. Move to high ground immediately."';
      const result = await model.generateContent(prompt);
      const reply = result.response.text();

      return res.json({
        success: true,
        message: 'Google Gemini API Key is VALID & CONNECTED!',
        sampleOutput: reply.trim(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: `Gemini API authentication failed: ${err.message || err}`,
      });
    }
  }

  return res.json({
    success: true,
    message: `${provider.toUpperCase()} connection acknowledged.`,
  });
});
