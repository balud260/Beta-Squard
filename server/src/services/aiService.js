const geminiService = require('./geminiService');

module.exports = {
  analyzeProblem: geminiService.analyzeProblemAI,
  matchUniversities: geminiService.matchUniversitiesAI,
  analyzeDisaster: geminiService.analyzeDisasterAI,
  analyzeDisasterIncident: geminiService.analyzeDisasterAI,
  evaluateRelocationSites: geminiService.evaluateRelocationSitesAI,
  analyzeTeamSkillGap: geminiService.analyzeTeamSkillGapAI,
  compareProposals: geminiService.compareProposalsAI,
  analyzeImpactMetrics: geminiService.analyzeImpactMetricsAI,
  disasterAssistantQuery: geminiService.handleRoleAwareChatAI,
  handleRoleAwareChat: geminiService.handleRoleAwareChatAI
};
