const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-3.6-flash';

/**
 * Retrieves an active GoogleGenerativeAI instance dynamically using process.env.GEMINI_API_KEY
 */
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Safely strips markdown code blocks (```json ... ```) and parses JSON
 */
function cleanAndParseJSON(text, fallback = null) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/i, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[Gemini Service] JSON parse warning:', err.message);
    if (fallback !== null) return fallback;
    throw new Error(`Failed to parse AI JSON response: ${err.message}`);
  }
}

/**
 * Core Centralized Gemini API Caller with Timeout, 429 Rate Limit Handling, Retry, and Detailed Errors
 */
async function callGemini(prompt, options = {}) {
  const genAI = getGenAIClient();
  if (!genAI) {
    console.warn('[Gemini Service Warning] GEMINI_API_KEY environment variable is not configured.');
    throw new Error('GEMINI_API_KEY is not configured on server.');
  }

  const timeoutMs = options.timeoutMs || 25000;
  const maxRetries = options.retries || 2;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      // Timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const generatePromise = model.generateContent(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);

      const responseText = result.response.text();
      return responseText.trim();
    } catch (error) {
      lastError = error;
      const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded');
      
      console.error(`[Gemini Service Error] (Attempt ${attempt + 1}/${maxRetries + 1}, Model: ${GEMINI_MODEL}):`, error.message);
      
      // If unauthorized or model invalid, stop retrying immediately
      if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('404')) {
        break;
      }
      
      if (attempt < maxRetries) {
        const waitMs = isRateLimit ? 2500 : 1000;
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  if (lastError?.status === 429 || lastError?.message?.includes('429')) {
    throw new Error('Gemini API rate limit exceeded (HTTP 429). Please wait a moment and try again.');
  }

  throw lastError || new Error('Gemini API call failed.');
}

/**
 * 1. AI Problem Analysis
 */
async function analyzeProblemAI(problem) {
  const prompt = `You are SolveLink AI, an expert engineering & societal problem classification engine.
Analyze the following problem statement and return ONLY a valid JSON object matching this exact structure:
{
  "category": "string (COMMUNITY_DEVELOPMENT | HEALTHCARE | DISASTER_MANAGEMENT | CIVIC_INFRASTRUCTURE | EDUCATION)",
  "subcategory": "string",
  "requiredSkills": ["array of strings"],
  "requiredTechnologies": ["array of strings"],
  "requiredDepartments": ["array of strings"],
  "difficulty": "LOW" | "MODERATE" | "HIGH" | "COMPLEX",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "socialImpact": "MODERATE" | "HIGH" | "CRITICAL",
  "estimatedResources": "string concise description",
  "possibleSolutionAreas": ["array of strategic solution areas"],
  "recommendation": "string guidance for university pairing"
}

Problem Details:
Title: ${problem.title}
Description: ${problem.description}
Category: ${problem.category || 'General'}
Location: ${problem.location || 'Target Region'}
Urgency: ${problem.urgency || 'MEDIUM'}`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 2. AI University Matching
 */
async function matchUniversitiesAI(problem, candidateUniversities) {
  const prompt = `You are SolveLink AI matching engine. Match this societal challenge with candidate universities based ONLY on the provided capability profiles.

Problem Requirements:
Title: ${problem.title}
Description: ${problem.description}

Candidate Universities (Authorized Database Records):
${JSON.stringify(candidateUniversities, null, 2)}

Return ONLY a JSON array of objects:
[
  {
    "universityId": number,
    "universityName": "string",
    "matchScore": number (0-100),
    "reasons": ["array of concise bullet points grounded in provided data"]
  }
]`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 3. AI Disaster Risk & Action Analysis
 */
async function analyzeDisasterAI(disaster, hospitals = [], relocationSites = [], requirements = []) {
  const prompt = `You are SolveLink AI Emergency Incident Decision Engine. Analyze the following verified disaster incident data:

Disaster Incident:
Title: ${disaster.title}
Type: ${disaster.type}
Severity: ${disaster.severity}
Location: ${disaster.location}
Affected Population: ${disaster.affected_population}
Vulnerable Population: ${disaster.vulnerable_population}
Hazard Details: ${disaster.hazard_info}

Available Hospitals:
${JSON.stringify(hospitals, null, 2)}

Candidate Relocation Sites:
${JSON.stringify(relocationSites, null, 2)}

Active Volunteer & Resource Requirements:
${JSON.stringify(requirements, null, 2)}

Return ONLY a valid JSON object matching this structure:
{
  "summary": "concise 2-sentence executive summary",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM",
  "affectedAreaKm2": number,
  "severityAssessment": "string detailed assessment",
  "populationAtRisk": number,
  "vulnerablePopulation": number,
  "hospitalDemandEstimate": "string estimate of patient influx",
  "requiredVolunteerRoles": [
    { "role": "string", "count": number, "priority": "CRITICAL" | "HIGH" | "MEDIUM" }
  ],
  "recommendedImmediateActions": ["array of strategic immediate action strings"],
  "hospitalConsiderations": ["array of hospital operational guidance"],
  "relocationRecommendations": ["array of relocation site guidance"]
}`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 4. AI Relocation Site Evaluation & Ranking
 */
async function evaluateRelocationSitesAI(disaster, sites) {
  const prompt = `Evaluate candidate relocation sites for disaster incident: "${disaster.title}" (${disaster.type}, Location: ${disaster.location}).

Candidate Relocation Sites Data:
${JSON.stringify(sites, null, 2)}

Return ONLY a JSON array of evaluated objects:
[
  {
    "siteId": number,
    "siteName": "string",
    "score": number (0-100),
    "recommendationStatus": "RECOMMENDED" | "VIABLE_ALTERNATIVE" | "NOT_RECOMMENDED",
    "safetyRating": "HIGH_SAFETY" | "MODERATE_SAFETY" | "HIGH_RISK",
    "rationale": "string concise reason"
  }
]`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 5. AI Team Skill Gap Analysis
 */
async function analyzeTeamSkillGapAI(teamMembers, problemRequirements) {
  const prompt = `You are SolveLink AI Team Capability Analyzer.
Analyze the skills of the current student/faculty team against the required problem capabilities.

Problem Requirements:
${JSON.stringify(problemRequirements, null, 2)}

Current Team Roster & Skills:
${JSON.stringify(teamMembers, null, 2)}

Return ONLY a JSON object:
{
  "teamReadinessScore": number (0-100),
  "presentSkills": ["array of covered skills"],
  "missingSkills": ["array of missing critical skills"],
  "departmentGaps": ["array of recommended missing departments"],
  "recruitmentRecommendations": ["array of actionable recommendations"]
}`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 6. AI Proposal Comparison & Analysis
 */
async function compareProposalsAI(problem, proposals) {
  const prompt = `You are SolveLink AI Proposal Evaluation Engine.
Compare the following submitted university proposals for the challenge: "${problem.title}".

Problem Description: ${problem.description}

Submitted Proposals:
${JSON.stringify(proposals, null, 2)}

Return ONLY a JSON object:
{
  "comparativeSummary": "string overview of proposals",
  "proposalEvaluations": [
    {
      "proposalId": number,
      "universityName": "string",
      "technicalFeasibilityScore": number (0-100),
      "costEfficiencyScore": number (0-100),
      "timelineRating": "OPTIMAL" | "FEASIBLE" | "EXTENDED",
      "keyStrengths": ["array of strings"],
      "keyRisks": ["array of strings"],
      "overallScore": number (0-100)
    }
  ],
  "recommendationNote": "string guidance for Problem Owner decision"
}`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 7. AI Impact Analysis
 */
async function analyzeImpactMetricsAI(impactData) {
  const prompt = `You are SolveLink AI Societal Impact Evaluator.
Analyze the stored impact data below:

Impact Data:
${JSON.stringify(impactData, null, 2)}

Return ONLY a JSON object:
{
  "impactSummary": "string concise summary of real societal impact",
  "livesBenefitedEstimate": number,
  "keyAchievements": ["array of strategic bullet points"],
  "sdgAlignments": ["array of UN Sustainable Development Goals"],
  "futureScalabilityNote": "string"
}`;

  const text = await callGemini(prompt);
  return cleanAndParseJSON(text);
}

/**
 * 8. Role-Aware Chat Assistant
 */
async function handleRoleAwareChatAI(userQuery, userRole, contextData, userName = '') {
  const prompt = `You are SolveLink AI Assistant serving an authenticated user named "${userName}" with role: ${userRole}.
Respond concisely, professionally, and accurately using ONLY the provided verified database context below.
Do NOT invent fake numbers or external facts.

If the user says a simple greeting like "hi", "hello", "who are you", or "what can you help me with", respond warmly and address them by name (e.g. "Hello ${userName || userRole}! How can I help with your ${userRole} operations today?").

Authorized Database Context:
${JSON.stringify(contextData, null, 2)}

User Question: "${userQuery}"

Provide a clear, helpful 2-4 sentence response tailored to the ${userRole} role.`;

  const text = await callGemini(prompt);
  return { answer: text.trim(), groundedDataUsed: true };
}

module.exports = {
  callGemini,
  getGenAIClient,
  analyzeProblemAI,
  matchUniversitiesAI,
  analyzeDisasterAI,
  evaluateRelocationSitesAI,
  analyzeTeamSkillGapAI,
  compareProposalsAI,
  analyzeImpactMetricsAI,
  handleRoleAwareChatAI
};
