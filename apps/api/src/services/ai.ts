import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { AlertSeverity } from '@cebufloodwatch/shared';

let genAI: GoogleGenerativeAI | null = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
}

export interface GeneratedAlertDraft {
  severity: AlertSeverity;
  title_en: string;
  title_tl: string;
  body_en: string;
  body_tl: string;
}

/**
 * Drafts bilingual (English + Tagalog) emergency alert using Gemini 2.5 Flash
 */
export async function generateBilingualAlert(
  rawNotes: string,
  barangayName?: string,
  severityHint?: AlertSeverity
): Promise<GeneratedAlertDraft> {
  // If no Gemini API key configured, provide structured mock response
  if (!genAI || !config.geminiApiKey) {
    console.warn('⚠️ GEMINI_API_KEY not configured. Using fallback local heuristic template.');
    const sev = severityHint || (rawNotes.toLowerCase().includes('critical') ? 'critical' : 'warning');
    return {
      severity: sev,
      title_en: `Emergency Alert: Flooding in ${barangayName || 'Metro Cebu Area'}`,
      title_tl: `Babala sa Kagipitan: Pagbaha sa ${barangayName || 'Metro Cebu'}`,
      body_en: `${rawNotes}. Please follow local DRRMO safety guidelines and proceed to the nearest open evacuation center if water levels continue rising.`,
      body_tl: `${rawNotes}. Mangyaring sundin ang mga alituntunin sa kaligtasan ng lokal na DRRMO at pumunta sa pinakamalapit na bukas na evacuation center kung patuloy na tataas ang tubig.`,
    };
  }

  const prompt = `You are the AI Disaster Warning Assistant for Cebu Disaster Risk Reduction and Management Office (CDRRMO).
Convert the following operator field notes into a structured, clear, and urgent bilingual (English and Tagalog) disaster alert.

Target Location: ${barangayName || 'Metro Cebu'}
Operator Field Notes: "${rawNotes}"
Severity Hint: ${severityHint || 'auto-detect'}

Respond strictly with valid JSON matching this schema:
{
  "severity": "advisory" | "watch" | "warning" | "critical",
  "title_en": "string (short concise title)",
  "title_tl": "string (Tagalog translation of title)",
  "body_en": "string (actionable clear advice in English)",
  "body_tl": "string (actionable clear advice in Tagalog)"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    if (!text) throw new Error('Empty response received from Gemini model.');
    const parsed = JSON.parse(text) as GeneratedAlertDraft;
    return parsed;
  } catch (err) {
    console.error('Gemini Alert Generation error:', err);
    return {
      severity: severityHint || 'warning',
      title_en: `Flood Warning: ${barangayName || 'Metro Cebu'}`,
      title_tl: `Babala sa Baha: ${barangayName || 'Metro Cebu'}`,
      body_en: rawNotes,
      body_tl: rawNotes,
    };
  }
}
