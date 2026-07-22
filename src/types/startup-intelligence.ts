export type RiskLevel = "green" | "yellow" | "red";

export type StartupIntelligenceScores = {
  marketPotential: number;
  competitionLevel: number;
  executionDifficulty: number;
  revenuePotential: number;
  scalability: number;
  riskLevel: number;
  santraScore: number;
};

export type StartupIntelligenceGtm = {
  customerPersona: string;
  idealCustomerProfile: string;
  acquisitionChannels: string[];
  launchPlan: string[];
  pricingSuggestions: string[];
  positioningStatement: string;
  growthLoops: string[];
  marketingStrategy: string[];
};

export type StartupIntelligenceActionPlan = {
  next7Days: string[];
  next30Days: string[];
  next90Days: string[];
  next180Days: string[];
};

export type CompetitorIntelligence = {
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  pricingModel: string;
  positioningStrategy: string;
  competitiveAdvantageSuggestions: string[];
  marketGaps: string[];
  differentiationOpportunities: string[];
  howToBeat: string[];
};

export type InvestorReadiness = {
  investorAttractivenessScore: number;
  fundingReadinessScore: number;
  keyWeaknesses: string[];
  investorQuestions: string[];
  suggestedImprovements: string[];
  wouldInvestorsFundThis: string;
};

export type StartupRiskIntelligence = {
  technicalRisks: Array<{ item: string; level: RiskLevel }>;
  marketRisks: Array<{ item: string; level: RiskLevel }>;
  legalRisks: Array<{ item: string; level: RiskLevel }>;
  operationalRisks: Array<{ item: string; level: RiskLevel }>;
  financialRisks: Array<{ item: string; level: RiskLevel }>;
};

export type CompetitorBattleCard = {
  competitorName: string;
  featureComparison: string[];
  pricingComparison: string[];
  marketPositionComparison: string[];
  differentiation: string[];
  recommendedAttackStrategy: string;
};

export type StartupValidationEngine = {
  isProblemWorthSolving: string;
  existingSolutions: string[];
  customerPainPoints: string[];
  validationScore: number;
};

export type ExecutiveBriefing = {
  startupOverview: string;
  marketOpportunity: string;
  competition: string;
  gtmStrategy: string;
  risks: string;
  fundingReadiness: string;
  actionPlan: string;
};

export type PitchDeckGenerator = {
  problem: string;
  solution: string;
  market: string;
  businessModel: string;
  competition: string;
  gtm: string;
  financials: string;
  ask: string;
};

export type FirstCustomerPlaybook = {
  first10Customers: string[];
  first50Customers: string[];
  first100Customers: string[];
};

export type StartupDnaScore = {
  innovation: number;
  scalability: number;
  defensibility: number;
  revenuePotential: number;
  marketTiming: number;
  overall: number;
};

export type StartupIntelligenceReport = {
  executiveSummary: string;
  marketOpportunities: string[];
  competitorAnalysis: string[];
  risks: string[];
  growthPotential: string;
  marketSizeEstimate: string;
  suggestedBusinessModel: string;
  gtm: StartupIntelligenceGtm;
  scores: StartupIntelligenceScores;
  actionPlan: StartupIntelligenceActionPlan;
  competitorIntelligence: CompetitorIntelligence;
  investorReadiness: InvestorReadiness;
  startupRiskIntelligence: StartupRiskIntelligence;
  competitorBattleCard: CompetitorBattleCard;
  startupValidationEngine: StartupValidationEngine;
  executiveBriefing: ExecutiveBriefing;
  pitchDeckGenerator: PitchDeckGenerator;
  firstCustomerPlaybook: FirstCustomerPlaybook;
  startupDnaScore: StartupDnaScore;
  sriLankaModeInsights: string[];
};

export type StartupIntelligenceRequest = {
  startupIdea: string;
  industry: string;
  country: string;
  targetAudience: string;
  competitorName?: string;
  sriLankaMode?: boolean;
};
