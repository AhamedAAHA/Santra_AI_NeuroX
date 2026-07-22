import { createChatCompletionWithFallback, isLlmAuthError } from "@/lib/llm/inference";
import { isLlmConfigured } from "@/lib/llm/client";
import type {
  CompetitorBattleCard,
  CompetitorIntelligence,
  ExecutiveBriefing,
  FirstCustomerPlaybook,
  InvestorReadiness,
  PitchDeckGenerator,
  StartupDnaScore,
  StartupIntelligenceActionPlan,
  StartupIntelligenceGtm,
  StartupIntelligenceReport,
  StartupIntelligenceRequest,
  StartupIntelligenceScores,
  StartupRiskIntelligence,
  StartupValidationEngine,
} from "@/types/startup-intelligence";

const DEMO_REPORT: StartupIntelligenceReport = {
  executiveSummary:
    "A viable B2B GTM opportunity with clear RevOps buyer pain, measurable competitive pressure, and a path to paid pilots with revenue teams.",
  marketOpportunities: [
    "RevOps and competitive intel teams need continuous rival monitoring without headcount growth",
    "Pricing and positioning shifts create immediate win-rate risk for B2B SaaS sellers",
    "HITL automation into CRM/webhooks fits existing enterprise stacks better than black-box agents",
  ],
  competitorAnalysis: [
    "Legacy CI platforms are broad and expensive, leaving gaps for outcome-focused GTM agents",
    "Generic chat assistants lack monitor loops, evidence trails, and approval workflows",
    "Manual analyst workflows remain common — strong signal for automation ROI",
  ],
  risks: [
    "Enterprise sales cycles can slow early ARR without a sharp beachhead ICP",
    "Adoption stalls if approval UX and webhook reliability are weak",
    "Data quality and tool credit limits can force fallbacks during demos",
  ],
  growthPotential:
    "High when the product owns a narrow competitive-intel workflow, proves HITL trust, then expands to multi-monitor correlation.",
  marketSizeEstimate:
    "TAM: global B2B SaaS competitive intelligence and RevOps tooling; SAM: mid-market GTM teams with active rivals; SOM: first ICP clusters in one region with partner-led pilots.",
  suggestedBusinessModel:
    "B2B SaaS subscription with seat/monitor tiers, usage for live evidence collection, and optional professional services for CRM mapping.",
  gtm: {
    customerPersona:
      "RevOps leads and competitive intel analysts who need faster briefs and approved outbound actions.",
    idealCustomerProfile:
      "20-500 employee B2B SaaS companies with active competitors, CRM/webhook stack, and weekly GTM decision cadence.",
    acquisitionChannels: [
      "LinkedIn outbound to RevOps / CI titles",
      "Partner and marketplace co-sell",
      "Content on competitive battlecards and pricing shifts",
      "Pilot programs with sales enablement teams",
    ],
    launchPlan: [
      "Validate ICP pain with 10-15 RevOps interviews",
      "Ship monitor → evidence → HITL approval MVP",
      "Run 5 paid pilots with one monitor type",
      "Expand to multi-monitor and CRM field templates",
    ],
    pricingSuggestions: [
      "Pilot plan with capped monitors and evidence credits",
      "Team plan for RevOps with collaboration and exports",
      "Enterprise plan with SSO, audit logs, and webhook SLAs",
    ],
    positioningStatement:
      "SANTRA AI is an autonomous B2B GTM intelligence agent — monitors rivals, grounds briefs in live evidence, and only executes after human approval.",
    growthLoops: [
      "Shared executive briefs drive internal expansion",
      "Monitor alerts increase weekly reactivation",
      "Approved webhook actions prove ROI in CRM",
    ],
    marketingStrategy: [
      "Publish competitor-shift teardown content weekly",
      "Run problem-solution demos for RevOps buyers",
      "Partner with sales-enablement communities for distribution",
    ],
  },
  scores: {
    marketPotential: 82,
    competitionLevel: 61,
    executionDifficulty: 57,
    revenuePotential: 78,
    scalability: 81,
    riskLevel: 54,
    santraScore: 79,
  },
  actionPlan: {
    next7Days: [
      "Interview target users and collect repeated pain points",
      "Define value proposition and positioning statement",
      "Build a one-page validation landing page",
    ],
    next30Days: [
      "Ship MVP for one use case",
      "Onboard first pilot users",
      "Track activation and retention metrics",
    ],
    next90Days: [
      "Refine product-market fit in one segment",
      "Build repeatable acquisition channel",
      "Document customer proof and testimonials",
    ],
    next180Days: [
      "Expand to adjacent segment",
      "Introduce team plan and upsell features",
      "Prepare data room and investor narrative",
    ],
  },
  competitorIntelligence: {
    competitorName: "Typical incumbents in this category",
    strengths: ["Brand trust", "Wider feature set", "Established sales channels"],
    weaknesses: ["High pricing", "Complex onboarding", "Slow adaptation for local markets"],
    pricingModel: "Tiered subscription with premium enterprise upsells.",
    positioningStrategy: "Positioned as broad all-in-one platforms for multiple segments.",
    competitiveAdvantageSuggestions: [
      "Own a narrow high-urgency use case",
      "Offer faster time-to-value onboarding",
      "Localize messaging and support",
    ],
    marketGaps: [
      "Affordable mid-market CI with HITL automation",
      "Monitor-native briefs with evidence trails",
      "CRM/webhook execution after human approval",
    ],
    differentiationOpportunities: [
      "Autonomous monitor → brief → approval loop",
      "Live web evidence with tool routing transparency",
      "RevOps-ready webhook actions instead of chat-only insights",
    ],
    howToBeat: [
      "Win speed and trust over feature breadth",
      "Package GTM outcomes, not only dashboards",
      "Beachhead one monitor type before expanding",
    ],
  },
  investorReadiness: {
    investorAttractivenessScore: 74,
    fundingReadinessScore: 68,
    keyWeaknesses: ["Limited traction proof", "Early retention data", "Go-to-market assumptions need validation"],
    investorQuestions: [
      "What is your repeatable customer acquisition model?",
      "How defensible is your moat over 24 months?",
      "What leading indicators prove product-market fit?",
    ],
    suggestedImprovements: [
      "Track activation-to-retention funnel weekly",
      "Strengthen differentiation narrative with evidence",
      "Show bottom-up revenue model by segment",
    ],
    wouldInvestorsFundThis:
      "Potentially yes at pre-seed, if you show early traction and a disciplined execution plan.",
  },
  startupRiskIntelligence: {
    technicalRisks: [
      { item: "Platform reliability during growth", level: "yellow" },
      { item: "Security controls for customer data", level: "yellow" },
    ],
    marketRisks: [
      { item: "Competitive response from incumbents", level: "red" },
      { item: "Shifting buyer priorities", level: "yellow" },
    ],
    legalRisks: [
      { item: "Local compliance requirements", level: "yellow" },
      { item: "Contract clarity for B2B sales", level: "green" },
    ],
    operationalRisks: [
      { item: "RevOps bandwidth for pilot setup", level: "yellow" },
      { item: "Dependence on few power users", level: "yellow" },
    ],
    financialRisks: [
      { item: "Runway pressure before paid pilots convert", level: "red" },
      { item: "Paid channel CAC volatility", level: "yellow" },
    ],
  },
  competitorBattleCard: {
    competitorName: "Category incumbent",
    featureComparison: [
      "You: monitor → HITL agent loop; Competitor: broader feature catalog",
      "You: evidence-grounded briefs + approvals; Competitor: generic dashboards",
    ],
    pricingComparison: [
      "You: mid-market monitor/seat packaging",
      "Competitor: higher base plans and enterprise-first packaging",
    ],
    marketPositionComparison: [
      "You: autonomous B2B GTM intelligence agent",
      "Competitor: general competitive intelligence platform",
    ],
    differentiation: [
      "Sri Lanka mode and local launch guidance",
      "Built-in validation and investor readiness outputs",
    ],
    recommendedAttackStrategy:
      "Own a niche segment with clear ROI case studies, then expand with adjacent workflows once retention is stable.",
  },
  startupValidationEngine: {
    isProblemWorthSolving:
      "Yes, if the product removes recurring competitive-research bottlenecks and improves GTM response time for revenue teams.",
    existingSolutions: ["Manual analyst research", "Legacy CI platforms", "Generic chat assistants without HITL"],
    customerPainPoints: [
      "Competitor changes discovered too late",
      "Briefs lack live evidence trails",
      "No safe path from insight to approved CRM action",
    ],
    validationScore: 77,
  },
  executiveBriefing: {
    startupOverview: "A B2B GTM intelligence agent for competitive monitoring and human-approved automation.",
    marketOpportunity: "Strong demand among mid-market RevOps and CI teams that outgrow spreadsheets.",
    competition: "Incumbents are broad and expensive; generic AI lacks monitor + HITL loops.",
    gtmStrategy: "Beachhead with one monitor type for RevOps buyers, then expand via webhook/CRM depth.",
    risks: "Greatest risks are enterprise cycle length, tool credit limits, and trust in automated actions.",
    fundingReadiness: "Fundable with pilot ARR, clear ICP, and differentiated HITL execution story.",
    actionPlan: "Prove monitor→HITL ROI, lock ICP, then scale monitors and CRM templates.",
  },
  pitchDeckGenerator: {
    problem: "B2B revenue teams miss competitor pricing and positioning shifts until deals are already at risk.",
    solution: "SANTRA AI monitors rivals, grounds briefs in live evidence, and executes only after human approval.",
    market: "Growing spend on competitive intelligence, RevOps tooling, and GTM automation.",
    businessModel: "B2B SaaS with monitor/seat tiers and evidence usage credits.",
    competition: "Competes with legacy CI and generic AI by owning the monitor→HITL agent loop.",
    gtm: "LinkedIn outbound to RevOps/CI, content-led demos, and enablement partnerships.",
    financials: "Lean early burn with recurring revenue from retained GTM team seats.",
    ask: "Seed capital to deepen CRM mapping, multi-monitor correlation, and enterprise readiness.",
  },
  firstCustomerPlaybook: {
    first10Customers: [
      "Recruit RevOps and CI leads from warm B2B SaaS networks",
      "Offer hands-on onboarding to capture rapid feedback",
      "Document measurable outcomes as proof",
    ],
    first50Customers: [
      "Standardize onboarding playbook",
      "Run repeatable outbound and webinar funnel",
      "Launch referral incentives for early users",
    ],
    first100Customers: [
      "Double down on best-converting channel",
      "Add partner-led acquisition with accelerators",
      "Publish case studies by niche segment",
    ],
  },
  startupDnaScore: {
    innovation: 78,
    scalability: 82,
    defensibility: 70,
    revenuePotential: 80,
    marketTiming: 84,
    overall: 79,
  },
  sriLankaModeInsights: [
    "Target SMEs using WhatsApp and Facebook-first communication",
    "University entrepreneurship programs can be an early acquisition channel",
    "Bundle onboarding support and local payment clarity for faster conversion",
  ],
};

function clampScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[], limit = 12) {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim())
    .slice(0, limit);
}

function normalizeRiskArray(
  value: unknown,
  fallback: StartupRiskIntelligence["technicalRisks"],
): StartupRiskIntelligence["technicalRisks"] {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const parsed = item as { item?: unknown; level?: unknown };
      const label = typeof parsed.item === "string" ? parsed.item.trim() : "";
      const level = parsed.level === "green" || parsed.level === "yellow" || parsed.level === "red" ? parsed.level : "yellow";
      if (!label) return null;
      return { item: label, level };
    })
    .filter((item): item is { item: string; level: "green" | "yellow" | "red" } => Boolean(item))
    .slice(0, 8);

  return normalized.length ? normalized : fallback;
}

function normalizeReport(parsed: Partial<StartupIntelligenceReport>, input: StartupIntelligenceRequest): StartupIntelligenceReport {
  const gtm = (parsed.gtm ?? {}) as Partial<StartupIntelligenceGtm>;
  const scores = (parsed.scores ?? {}) as Partial<StartupIntelligenceScores>;
  const actionPlan = (parsed.actionPlan ?? {}) as Partial<StartupIntelligenceActionPlan>;
  const competitorIntelligence = (parsed.competitorIntelligence ?? {}) as Partial<CompetitorIntelligence>;
  const investorReadiness = (parsed.investorReadiness ?? {}) as Partial<InvestorReadiness>;
  const riskIntel = (parsed.startupRiskIntelligence ?? {}) as Partial<StartupRiskIntelligence>;
  const battleCard = (parsed.competitorBattleCard ?? {}) as Partial<CompetitorBattleCard>;
  const validation = (parsed.startupValidationEngine ?? {}) as Partial<StartupValidationEngine>;
  const briefing = (parsed.executiveBriefing ?? {}) as Partial<ExecutiveBriefing>;
  const pitchDeck = (parsed.pitchDeckGenerator ?? {}) as Partial<PitchDeckGenerator>;
  const playbook = (parsed.firstCustomerPlaybook ?? {}) as Partial<FirstCustomerPlaybook>;
  const dna = (parsed.startupDnaScore ?? {}) as Partial<StartupDnaScore>;

  return {
    executiveSummary: normalizeString(
      parsed.executiveSummary,
      `Startup intelligence briefing for "${input.startupIdea}" in ${input.industry} (${input.country}).`,
    ),
    marketOpportunities: normalizeStringArray(parsed.marketOpportunities, DEMO_REPORT.marketOpportunities),
    competitorAnalysis: normalizeStringArray(parsed.competitorAnalysis, DEMO_REPORT.competitorAnalysis),
    risks: normalizeStringArray(parsed.risks, DEMO_REPORT.risks),
    growthPotential: normalizeString(parsed.growthPotential, DEMO_REPORT.growthPotential),
    marketSizeEstimate: normalizeString(parsed.marketSizeEstimate, DEMO_REPORT.marketSizeEstimate),
    suggestedBusinessModel: normalizeString(parsed.suggestedBusinessModel, DEMO_REPORT.suggestedBusinessModel),
    gtm: {
      customerPersona: normalizeString(gtm.customerPersona, DEMO_REPORT.gtm.customerPersona),
      idealCustomerProfile: normalizeString(gtm.idealCustomerProfile, DEMO_REPORT.gtm.idealCustomerProfile),
      acquisitionChannels: normalizeStringArray(gtm.acquisitionChannels, DEMO_REPORT.gtm.acquisitionChannels),
      launchPlan: normalizeStringArray(gtm.launchPlan, DEMO_REPORT.gtm.launchPlan),
      pricingSuggestions: normalizeStringArray(gtm.pricingSuggestions, DEMO_REPORT.gtm.pricingSuggestions),
      positioningStatement: normalizeString(gtm.positioningStatement, DEMO_REPORT.gtm.positioningStatement),
      growthLoops: normalizeStringArray(gtm.growthLoops, DEMO_REPORT.gtm.growthLoops),
      marketingStrategy: normalizeStringArray(gtm.marketingStrategy, DEMO_REPORT.gtm.marketingStrategy),
    },
    scores: {
      marketPotential: clampScore(scores.marketPotential, DEMO_REPORT.scores.marketPotential),
      competitionLevel: clampScore(scores.competitionLevel, DEMO_REPORT.scores.competitionLevel),
      executionDifficulty: clampScore(scores.executionDifficulty, DEMO_REPORT.scores.executionDifficulty),
      revenuePotential: clampScore(scores.revenuePotential, DEMO_REPORT.scores.revenuePotential),
      scalability: clampScore(scores.scalability, DEMO_REPORT.scores.scalability),
      riskLevel: clampScore(scores.riskLevel, DEMO_REPORT.scores.riskLevel),
      santraScore: clampScore(scores.santraScore, DEMO_REPORT.scores.santraScore),
    },
    actionPlan: {
      next7Days: normalizeStringArray(actionPlan.next7Days, DEMO_REPORT.actionPlan.next7Days),
      next30Days: normalizeStringArray(actionPlan.next30Days, DEMO_REPORT.actionPlan.next30Days),
      next90Days: normalizeStringArray(actionPlan.next90Days, DEMO_REPORT.actionPlan.next90Days),
      next180Days: normalizeStringArray(actionPlan.next180Days, DEMO_REPORT.actionPlan.next180Days),
    },
    competitorIntelligence: {
      competitorName: normalizeString(
        competitorIntelligence.competitorName,
        input.competitorName?.trim() || DEMO_REPORT.competitorIntelligence.competitorName,
      ),
      strengths: normalizeStringArray(competitorIntelligence.strengths, DEMO_REPORT.competitorIntelligence.strengths),
      weaknesses: normalizeStringArray(competitorIntelligence.weaknesses, DEMO_REPORT.competitorIntelligence.weaknesses),
      pricingModel: normalizeString(competitorIntelligence.pricingModel, DEMO_REPORT.competitorIntelligence.pricingModel),
      positioningStrategy: normalizeString(
        competitorIntelligence.positioningStrategy,
        DEMO_REPORT.competitorIntelligence.positioningStrategy,
      ),
      competitiveAdvantageSuggestions: normalizeStringArray(
        competitorIntelligence.competitiveAdvantageSuggestions,
        DEMO_REPORT.competitorIntelligence.competitiveAdvantageSuggestions,
      ),
      marketGaps: normalizeStringArray(competitorIntelligence.marketGaps, DEMO_REPORT.competitorIntelligence.marketGaps),
      differentiationOpportunities: normalizeStringArray(
        competitorIntelligence.differentiationOpportunities,
        DEMO_REPORT.competitorIntelligence.differentiationOpportunities,
      ),
      howToBeat: normalizeStringArray(competitorIntelligence.howToBeat, DEMO_REPORT.competitorIntelligence.howToBeat),
    },
    investorReadiness: {
      investorAttractivenessScore: clampScore(
        investorReadiness.investorAttractivenessScore,
        DEMO_REPORT.investorReadiness.investorAttractivenessScore,
      ),
      fundingReadinessScore: clampScore(
        investorReadiness.fundingReadinessScore,
        DEMO_REPORT.investorReadiness.fundingReadinessScore,
      ),
      keyWeaknesses: normalizeStringArray(investorReadiness.keyWeaknesses, DEMO_REPORT.investorReadiness.keyWeaknesses),
      investorQuestions: normalizeStringArray(
        investorReadiness.investorQuestions,
        DEMO_REPORT.investorReadiness.investorQuestions,
      ),
      suggestedImprovements: normalizeStringArray(
        investorReadiness.suggestedImprovements,
        DEMO_REPORT.investorReadiness.suggestedImprovements,
      ),
      wouldInvestorsFundThis: normalizeString(
        investorReadiness.wouldInvestorsFundThis,
        DEMO_REPORT.investorReadiness.wouldInvestorsFundThis,
      ),
    },
    startupRiskIntelligence: {
      technicalRisks: normalizeRiskArray(riskIntel.technicalRisks, DEMO_REPORT.startupRiskIntelligence.technicalRisks),
      marketRisks: normalizeRiskArray(riskIntel.marketRisks, DEMO_REPORT.startupRiskIntelligence.marketRisks),
      legalRisks: normalizeRiskArray(riskIntel.legalRisks, DEMO_REPORT.startupRiskIntelligence.legalRisks),
      operationalRisks: normalizeRiskArray(riskIntel.operationalRisks, DEMO_REPORT.startupRiskIntelligence.operationalRisks),
      financialRisks: normalizeRiskArray(riskIntel.financialRisks, DEMO_REPORT.startupRiskIntelligence.financialRisks),
    },
    competitorBattleCard: {
      competitorName: normalizeString(
        battleCard.competitorName,
        input.competitorName?.trim() || DEMO_REPORT.competitorBattleCard.competitorName,
      ),
      featureComparison: normalizeStringArray(battleCard.featureComparison, DEMO_REPORT.competitorBattleCard.featureComparison),
      pricingComparison: normalizeStringArray(battleCard.pricingComparison, DEMO_REPORT.competitorBattleCard.pricingComparison),
      marketPositionComparison: normalizeStringArray(
        battleCard.marketPositionComparison,
        DEMO_REPORT.competitorBattleCard.marketPositionComparison,
      ),
      differentiation: normalizeStringArray(battleCard.differentiation, DEMO_REPORT.competitorBattleCard.differentiation),
      recommendedAttackStrategy: normalizeString(
        battleCard.recommendedAttackStrategy,
        DEMO_REPORT.competitorBattleCard.recommendedAttackStrategy,
      ),
    },
    startupValidationEngine: {
      isProblemWorthSolving: normalizeString(
        validation.isProblemWorthSolving,
        DEMO_REPORT.startupValidationEngine.isProblemWorthSolving,
      ),
      existingSolutions: normalizeStringArray(validation.existingSolutions, DEMO_REPORT.startupValidationEngine.existingSolutions),
      customerPainPoints: normalizeStringArray(validation.customerPainPoints, DEMO_REPORT.startupValidationEngine.customerPainPoints),
      validationScore: clampScore(validation.validationScore, DEMO_REPORT.startupValidationEngine.validationScore),
    },
    executiveBriefing: {
      startupOverview: normalizeString(briefing.startupOverview, DEMO_REPORT.executiveBriefing.startupOverview),
      marketOpportunity: normalizeString(briefing.marketOpportunity, DEMO_REPORT.executiveBriefing.marketOpportunity),
      competition: normalizeString(briefing.competition, DEMO_REPORT.executiveBriefing.competition),
      gtmStrategy: normalizeString(briefing.gtmStrategy, DEMO_REPORT.executiveBriefing.gtmStrategy),
      risks: normalizeString(briefing.risks, DEMO_REPORT.executiveBriefing.risks),
      fundingReadiness: normalizeString(briefing.fundingReadiness, DEMO_REPORT.executiveBriefing.fundingReadiness),
      actionPlan: normalizeString(briefing.actionPlan, DEMO_REPORT.executiveBriefing.actionPlan),
    },
    pitchDeckGenerator: {
      problem: normalizeString(pitchDeck.problem, DEMO_REPORT.pitchDeckGenerator.problem),
      solution: normalizeString(pitchDeck.solution, DEMO_REPORT.pitchDeckGenerator.solution),
      market: normalizeString(pitchDeck.market, DEMO_REPORT.pitchDeckGenerator.market),
      businessModel: normalizeString(pitchDeck.businessModel, DEMO_REPORT.pitchDeckGenerator.businessModel),
      competition: normalizeString(pitchDeck.competition, DEMO_REPORT.pitchDeckGenerator.competition),
      gtm: normalizeString(pitchDeck.gtm, DEMO_REPORT.pitchDeckGenerator.gtm),
      financials: normalizeString(pitchDeck.financials, DEMO_REPORT.pitchDeckGenerator.financials),
      ask: normalizeString(pitchDeck.ask, DEMO_REPORT.pitchDeckGenerator.ask),
    },
    firstCustomerPlaybook: {
      first10Customers: normalizeStringArray(playbook.first10Customers, DEMO_REPORT.firstCustomerPlaybook.first10Customers),
      first50Customers: normalizeStringArray(playbook.first50Customers, DEMO_REPORT.firstCustomerPlaybook.first50Customers),
      first100Customers: normalizeStringArray(playbook.first100Customers, DEMO_REPORT.firstCustomerPlaybook.first100Customers),
    },
    startupDnaScore: {
      innovation: clampScore(dna.innovation, DEMO_REPORT.startupDnaScore.innovation),
      scalability: clampScore(dna.scalability, DEMO_REPORT.startupDnaScore.scalability),
      defensibility: clampScore(dna.defensibility, DEMO_REPORT.startupDnaScore.defensibility),
      revenuePotential: clampScore(dna.revenuePotential, DEMO_REPORT.startupDnaScore.revenuePotential),
      marketTiming: clampScore(dna.marketTiming, DEMO_REPORT.startupDnaScore.marketTiming),
      overall: clampScore(dna.overall, DEMO_REPORT.startupDnaScore.overall),
    },
    sriLankaModeInsights: normalizeStringArray(parsed.sriLankaModeInsights, DEMO_REPORT.sriLankaModeInsights),
  };
}

export async function generateStartupIntelligence(
  input: StartupIntelligenceRequest,
): Promise<{ report: StartupIntelligenceReport; provider: "openai" | "demo" }> {
  if (!isLlmConfigured()) {
    return {
      report: normalizeReport(
        {
          ...DEMO_REPORT,
          executiveSummary: `${DEMO_REPORT.executiveSummary} (Demo mode - configure OPENAI_API_KEY or AIML_API_KEY for live analysis of "${input.startupIdea}".)`,
        },
        input,
      ),
      provider: "demo",
    };
  }

  const sriLankaContext = input.sriLankaMode
    ? `
Tailor outputs for B2B GTM in Sri Lanka and regional markets.
- Prefer B2B channels: LinkedIn, partner networks, enterprise sales, WhatsApp Business for ops teams.
- Include local procurement, pricing (LKR), and SME/enterprise buyer constraints.
- Keep recommendations useful for revenue, competitive intel, and internal ops teams — not consumer apps.`
    : "";

  try {
    const { response } = await createChatCompletionWithFallback({
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are SANTRA AI, a B2B GTM market-validation advisor for RevOps, competitive intelligence, and go-to-market teams.
Evaluate B2B opportunities (workflows between businesses or internal business operations). Prefer ICP, competitive pressure, demand generation, and revenue impact over consumer or personal-productivity angles.
Return only valid JSON matching the schema requested.${sriLankaContext}`,
        },
        {
          role: "user",
          content: `Analyze this B2B market opportunity:
Opportunity: ${input.startupIdea}
Industry: ${input.industry}
Country/Market: ${input.country}
ICP / Target buyers: ${input.targetAudience}
Primary Competitor (optional): ${input.competitorName || "Not provided"}
Sri Lanka Mode: ${input.sriLankaMode ? "enabled" : "disabled"}

Return JSON with this exact top-level schema:
{
  "executiveSummary": "",
  "marketOpportunities": [],
  "competitorAnalysis": [],
  "risks": [],
  "growthPotential": "",
  "marketSizeEstimate": "",
  "suggestedBusinessModel": "",
  "gtm": {
    "customerPersona": "",
    "idealCustomerProfile": "",
    "acquisitionChannels": [],
    "launchPlan": [],
    "pricingSuggestions": [],
    "positioningStatement": "",
    "growthLoops": [],
    "marketingStrategy": []
  },
  "scores": {
    "marketPotential": 0,
    "competitionLevel": 0,
    "executionDifficulty": 0,
    "revenuePotential": 0,
    "scalability": 0,
    "riskLevel": 0,
    "santraScore": 0
  },
  "actionPlan": {
    "next7Days": [],
    "next30Days": [],
    "next90Days": [],
    "next180Days": []
  },
  "competitorIntelligence": {
    "competitorName": "",
    "strengths": [],
    "weaknesses": [],
    "pricingModel": "",
    "positioningStrategy": "",
    "competitiveAdvantageSuggestions": [],
    "marketGaps": [],
    "differentiationOpportunities": [],
    "howToBeat": []
  },
  "investorReadiness": {
    "investorAttractivenessScore": 0,
    "fundingReadinessScore": 0,
    "keyWeaknesses": [],
    "investorQuestions": [],
    "suggestedImprovements": [],
    "wouldInvestorsFundThis": ""
  },
  "startupRiskIntelligence": {
    "technicalRisks": [{"item": "", "level": "green|yellow|red"}],
    "marketRisks": [{"item": "", "level": "green|yellow|red"}],
    "legalRisks": [{"item": "", "level": "green|yellow|red"}],
    "operationalRisks": [{"item": "", "level": "green|yellow|red"}],
    "financialRisks": [{"item": "", "level": "green|yellow|red"}]
  },
  "competitorBattleCard": {
    "competitorName": "",
    "featureComparison": [],
    "pricingComparison": [],
    "marketPositionComparison": [],
    "differentiation": [],
    "recommendedAttackStrategy": ""
  },
  "startupValidationEngine": {
    "isProblemWorthSolving": "",
    "existingSolutions": [],
    "customerPainPoints": [],
    "validationScore": 0
  },
  "executiveBriefing": {
    "startupOverview": "",
    "marketOpportunity": "",
    "competition": "",
    "gtmStrategy": "",
    "risks": "",
    "fundingReadiness": "",
    "actionPlan": ""
  },
  "pitchDeckGenerator": {
    "problem": "",
    "solution": "",
    "market": "",
    "businessModel": "",
    "competition": "",
    "gtm": "",
    "financials": "",
    "ask": ""
  },
  "firstCustomerPlaybook": {
    "first10Customers": [],
    "first50Customers": [],
    "first100Customers": []
  },
  "startupDnaScore": {
    "innovation": 0,
    "scalability": 0,
    "defensibility": 0,
    "revenuePotential": 0,
    "marketTiming": 0,
    "overall": 0
  },
  "sriLankaModeInsights": []
}

Constraints:
- Scores are 0-100.
- Provide 3-6 items for list fields where relevant.
- If competitor is unknown, infer a plausible competitor profile from the industry.
- Keep outputs concise, practical, and execution-focused.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { report: normalizeReport(DEMO_REPORT, input), provider: "demo" };
    }

    const parsed = JSON.parse(content) as Partial<StartupIntelligenceReport>;
    return { report: normalizeReport(parsed, input), provider: "openai" };
  } catch (error) {
    if (isLlmAuthError(error)) {
      throw new Error(
        "OpenAI API authentication failed. Configure OPENAI_API_KEY or AIML_API_KEY, then restart the dev server.",
      );
    }
    throw error;
  }
}
