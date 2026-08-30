import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { AlertSeverity } from '@cebufloodwatch/shared';
import { runtimeAIConfig } from '../routes/admin.js';

export interface GeneratedAlertDraft {
  severity: AlertSeverity;
  title_en: string;
  title_tl: string;
  body_en: string;
  body_tl: string;
}

/**
 * Drafts bilingual (English + Cebuano/Tagalog) emergency alert using dynamic runtime AI configuration
 */
export async function generateBilingualAlert(
  rawNotes: string,
  barangayName?: string,
  severityHint?: AlertSeverity
): Promise<GeneratedAlertDraft> {
  const activeKey = runtimeAIConfig.apiKey || config.geminiApiKey;

  // Fallback template if no API key is provisioned
  if (!activeKey) {
    const sev = severityHint || (rawNotes.toLowerCase().includes('critical') ? 'critical' : 'warning');
    return {
      severity: sev,
      title_en: `Emergency Flood Advisory: ${barangayName || 'Metro Cebu Area'}`,
      title_tl: `Pahibalo sa Katalagman: Pagbaha sa ${barangayName || 'Metro Cebu'}`,
      body_en: `${rawNotes}. Please adhere to CDRRMO emergency directives and proceed to high ground.`,
      body_tl: `${rawNotes}. Palihug sunda ang mga pahimangno sa CDRRMO ug pabalhin sa pinakaduol nga evacuation center.`,
    };
  }

  const prompt = `You are the AI Disaster Warning Assistant for Cebu Disaster Risk Reduction and Management Office (CDRRMO).
Convert the following operator field notes into a structured, clear, and urgent bilingual (English and Cebuano / Bisaya) disaster alert.

Target Location: ${barangayName || 'Metro Cebu'}
Dialect: ${runtimeAIConfig.cebuanoDialect || 'Urban Metro Cebuano'}
Operator Field Notes: "${rawNotes}"
Severity Hint: ${severityHint || 'auto-detect'}

Respond strictly with valid JSON matching this schema:
{
  "severity": "advisory" | "watch" | "warning" | "critical",
  "title_en": "string (short concise English title)",
  "title_tl": "string (Cebuano Bisaya translation of title)",
  "body_en": "string (actionable clear advice in English)",
  "body_tl": "string (actionable clear advice in Cebuano Bisaya)"
}`;

  try {
    const genAI = new GoogleGenerativeAI(activeKey);
    const model = genAI.getGenerativeModel({
      model: runtimeAIConfig.modelName || 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    if (!text) throw new Error('Empty response received from AI model.');
    const parsed = JSON.parse(text) as GeneratedAlertDraft;
    return parsed;
  } catch (err) {
    console.error('AI Alert Generation error:', err);
    return {
      severity: severityHint || 'warning',
      title_en: `Flood Warning: ${barangayName || 'Metro Cebu'}`,
      title_tl: `Pahibalo sa Baha: ${barangayName || 'Metro Cebu'}`,
      body_en: rawNotes,
      body_tl: rawNotes,
    };
  }
}
