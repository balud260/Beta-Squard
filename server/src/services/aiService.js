const aiRouter = require('./ai/aiRouter');

module.exports = {
  analyzeProblem: aiRouter.analyzeProblemAI,
  matchUniversities: aiRouter.matchUniversitiesAI,
  analyzeDisaster: aiRouter.analyzeDisasterAI,
  analyzeDisasterIncident: aiRouter.analyzeDisasterAI,
  evaluateRelocationSites: aiRouter.evaluateRelocationSitesAI,
  analyzeTeamSkillGap: aiRouter.analyzeTeamSkillGapAI,
  compareProposals: aiRouter.compareProposalsAI,
  analyzeImpactMetrics: aiRouter.analyzeImpactMetricsAI,
  disasterAssistantQuery: aiRouter.handleRoleAwareChatAI,
  handleRoleAwareChat: aiRouter.handleRoleAwareChatAI,
  handleDeterministicFactualQuery: aiRouter.handleDeterministicFactualQuery
};
