'use client'

import { AI_CLIENTS, type AiClient } from '@/lib/mcp-config'
import { storedChoice } from '@/lib/stored-choice'

/* The reader's AI coding tool, for the install field's client commands:
 * remembered like their package manager (Claude Code until they choose). */
export const useAiClient = storedChoice<AiClient>(
  'youj-ai-client',
  AI_CLIENTS.map((c) => c.value),
)
