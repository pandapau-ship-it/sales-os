/**
 * aiChat.ts — AI interpretation layer for the Sales OS chat.
 *
 * Single responsibility: interpret a user message and return a structured
 * JSON command. Never builds UI. Never writes to the database.
 *
 * Returns one of three response types:
 *   Typ 1 — Text only: render: null, chat_message: "..."
 *   Typ 2 — Show component: render: "cold_leads", filters: { min_days: 14 }
 *   Typ 3 — Workflow: render: "mail_drafts", filters: { contact_ids: [...] }
 */

import Anthropic from '@anthropic-ai/sdk';
import { getRegistryPromptBlock, type RenderKey } from './componentRegistry';

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface AIChatResponse {
  /** Render key from COMPONENT_REGISTRY — null means text-only answer */
  render: RenderKey | null;
  /** Optional filter object passed to the component + Supabase query */
  filters: Record<string, unknown> | null;
  /** Human-readable reply shown in the chat panel — always present */
  chat_message: string;
}

// ---------------------------------------------------------------------------
// System prompt — auto-synced with componentRegistry via getRegistryPromptBlock()
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `Du bist der Sales OS AI-Assistent von Sherloq. Deine einzige Aufgabe ist es,
Nutzeranfragen zu interpretieren und einen JSON-Befehl zurückzugeben.

Du baust KEINE UI. Du generierst KEINEN HTML-Code. Du entscheidest NUR was angezeigt wird.

Antworte IMMER mit einem JSON-Objekt in diesem Format:
{
  "render": "<render_key oder null>",
  "filters": { <optionale Filter-Parameter> },
  "chat_message": "<kurze, freundliche Antwort auf Deutsch>"
}

Verfügbare render_keys (nur diese verwenden):
${getRegistryPromptBlock()}

Regeln:
- render = null → nur Text-Antwort (Typ 1: Erklärungen, Definitionen, allgemeine Fragen)
- render = ein key aus der Liste oben → Komponente anzeigen + Supabase-Query (Typ 2/3)
- filters enthält nur strukturierte Daten: Zahlen, Strings, Arrays, Booleans — kein SQL
- chat_message ist immer kurz (1-2 Sätze) und auf Deutsch
- Bei Bulk-Aktionen (>10 Kontakte): Bestätigung in chat_message anfordern
- Destruktive Aktionen (Löschen, Massenupdates): render = null, Bestätigung im chat_message

Beispiele:
- "Was ist Churn Rate?" → { render: null, filters: null, chat_message: "Churn Rate beschreibt..." }
- "Zeig kalte Leads" → { render: "cold_leads", filters: { min_days: 14 }, chat_message: "Hier sind deine kalten Leads..." }
- "Wer stagniert seit 10 Tagen?" → { render: "stagnating", filters: { min_days: 10 }, chat_message: "..." }
- "Zeig mir Maximilian Krause" → { render: "contact_detail", filters: { name: "Maximilian Krause" }, chat_message: "..." }
- "Zeig Churn-Risiken" → { render: "churn_risks", filters: null, chat_message: "..." }`;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

const client = new Anthropic();

/**
 * Interprets a user message and returns a structured render command.
 *
 * @param userMessage - Raw message from the chat input
 * @param conversationHistory - Optional previous messages for context
 * @returns Structured response with render key, filters, and chat message
 */
export async function interpretQuery(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<AIChatResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,        // JSON response is always short
    system: buildSystemPrompt(),
    messages,
  });

  // Extract text content from response
  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return parseAIResponse(rawText, userMessage);
}

// ---------------------------------------------------------------------------
// Response parser — graceful fallback if AI doesn't return valid JSON
// ---------------------------------------------------------------------------

function parseAIResponse(rawText: string, originalMessage: string): AIChatResponse {
  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<AIChatResponse>;

    return {
      render: parsed.render ?? null,
      filters: parsed.filters ?? null,
      chat_message:
        parsed.chat_message ??
        'Ich habe deine Anfrage verarbeitet.',
    };
  } catch {
    // AI returned non-JSON — treat as plain text answer
    console.warn('[aiChat] Could not parse AI response as JSON:', rawText);
    return {
      render: null,
      filters: null,
      chat_message: rawText || `Ich konnte "${originalMessage}" nicht verarbeiten. Bitte formuliere es anders.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Typ 3 helper — generate personalized content per contact
// ---------------------------------------------------------------------------

/**
 * Generates individualized content (e.g. mail draft) for a single contact.
 * Called once per contact in a Typ 3 workflow — never in bulk without user confirmation.
 *
 * @param contactContext - Kurzakte, last touchpoints, personality type from Supabase
 * @param taskInstruction - What to generate ("personalisierte LinkedIn-Nachricht", "Follow-up Mail", etc.)
 * @returns Generated text for user review — never sent automatically
 */
export async function generateContactContent(
  contactContext: {
    name: string;
    company: string;
    kurzakte: string;
    lastTouchpoint: string;
    personalityType?: string;
  },
  taskInstruction: string,
): Promise<string> {
  const prompt = `Kontakt: ${contactContext.name} (${contactContext.company})
Kurzakte: ${contactContext.kurzakte}
Letzter Kontaktpunkt: ${contactContext.lastTouchpoint}
Persönlichkeitstyp: ${contactContext.personalityType ?? 'unbekannt'}

Aufgabe: ${taskInstruction}

Schreibe einen kurzen, personalisierten Text. Maximal 3 Sätze. Auf Deutsch.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
