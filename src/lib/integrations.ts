import {
  getAnalysisModel,
  getChatModel,
  getIntentModel,
  getLlmProviderLabel,
  getSearchModel,
  getTranscribeModel,
  getVisionModel,
  getWorldModel,
  isAimlConfigured,
  isLlmConfigured,
} from "@/lib/llm/client";
import {
  getFeatherlessChatModel,
  getFeatherlessVisionModel,
  isFeatherlessConfigured,
} from "@/lib/llm/featherless";
import { isSpeechmaticsConfigured } from "@/services/speechmatics-tts";
import { isSpeechmaticsSttConfigured } from "@/services/speechmatics-stt";
import { allowDemoLlmFallback } from "@/lib/demo/runtime";
import { isMongoConfigured } from "@/lib/mongo/config";
import { isExaConfigured } from "@/services/exa-search";
import { getBandAgentProfile, isBandConfigured } from "@/services/band-agent";

export function getIntegrationStatus() {
  const llmReady = isLlmConfigured();

  return {
    secretsSource: "env" as const,
    mongodb: isMongoConfigured(),
    aiml: isAimlConfigured(),
    openai: isLlmConfigured(),
    llm: {
      ready: llmReady,
      provider: getLlmProviderLabel(),
      models: llmReady
        ? {
            analysis: getAnalysisModel(),
            chat: getChatModel(),
            search: getSearchModel(),
            intent: getIntentModel(),
            world: getWorldModel(),
            vision: getVisionModel(),
            transcribe: getTranscribeModel(),
          }
        : null,
    },
    aimlVoice: isSpeechmaticsConfigured(),
    speechmaticsVoice: isSpeechmaticsConfigured(),
    speechmaticsStt: isSpeechmaticsSttConfigured(),
    featherless: isFeatherlessConfigured(),
    featherlessModels: isFeatherlessConfigured()
      ? {
          chat: getFeatherlessChatModel(),
          vision: getFeatherlessVisionModel(),
        }
      : null,
    exa: isExaConfigured(),
    band: isBandConfigured(),
    deployment: {
      track: "B2B GTM Intelligence Agent" as const,
      production: process.env.NODE_ENV === "production",
      demoFallbackAllowed: allowDemoLlmFallback(),
    },
  };
}

export async function getIntegrationStatusWithDiscovery() {
  const status = getIntegrationStatus();
  const bandProfile = status.band ? await getBandAgentProfile() : null;
  return { ...status, bandProfile };
}
