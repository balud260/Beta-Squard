const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-3.6-flash';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Safely parse JSON from AI responses (handles markdown ```json wrappers)
 */
function cleanAndParseJSON(text, fallback) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('AI JSON Parse warning, using fallback:', err.message);
    return fallback;
  }
}

/**
 * 1. AI Problem Analysis
 */
async function analyzeProblem(problem) {
  const fallback = {
    category: problem.category || 'COMMUNITY_DEVELOPMENT',
    subcategory: problem.subcategory || 'General Innovation',
    requiredSkills: ['Project Management', 'Data Analysis', 'Software Architecture', 'Domain Research'],
    requiredTechnologies: ['React', 'Node.js', 'GIS / Maps', 'IoT Sensors'],
    requiredDepartments: ['Computer Science & AI', 'Civil & Environmental Engineering'],
    difficulty: 'MODERATE',
    urgency: problem.urgency || 'HIGH',
    socialImpact: 'HIGH',
    estimatedResources: 'Requires 4-6 student researchers, cloud hosting, domain mentors.',
    possibleSolutionAreas: [
      'Automated data gathering & real-time monitoring dashboard',
      'Mobile app for field coordination & citizen updates',
      'AI predictive scheduling & resource allocation'
    ],
    recommendation: 'Recommend multi-disciplinary team pairing CSE students with Civil & Environmental faculty.'
  };

  const genAI = getGenAI();
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are SolveLink AI, an expert engineering & societal problem classification engine.
Analyze the following problem and return ONLY a valid JSON object matching this structure:
{
  "category": "string",
  "subcategory": "string",
  "requiredSkills": ["array of strings"],
  "requiredTechnologies": ["array of strings"],
  "requiredDepartments": ["array of strings"],
  "difficulty": "LOW" | "MODERATE" | "HIGH" | "COMPLEX",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "socialImpact": "MODERATE" | "HIGH" | "CRITICAL",
  "estimatedResources": "string description",
  "possibleSolutionAreas": ["array of strings"],
  "recommendation": "string"
}

Problem Title: ${problem.title}
Description: ${problem.description}
Category: ${problem.category}
Location: ${problem.location}
Urgency: ${problem.urgency}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return cleanAndParseJSON(responseText, fallback);
  } catch (error) {
    console.error(`Gemini analyzeProblem error (Model: ${GEMINI_MODEL}):`, error.message);
    return fallback;
  }
}

/**
 * 2. AI University Matching
 */
async function matchUniversities(problem, universities) {
  const fallbackMatches = universities.map((univ, index) => {
    const baseScore = 95 - index * 6;
    return {
      universityId: univ.id,
      universityName: univ.name,
      matchScore: Math.max(60, baseScore),
      reasons: [
        `✓ Strong research alignment in ${univ.research_focus || 'Technology'}`,
        `✓ ${univ.nss_capacity || 200}+ NSS/NCC volunteers available`,
        `✓ Equipment: ${univ.equipment_summary || 'Standard Labs'}`,
        `✓ Geographically situated near ${problem.location || 'target zone'}`
      ]
    };
  });

  const genAI = getGenAI();
  if (!genAI) return fallbackMatches;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are SolveLink AI matching engine. Match this societal challenge with candidate universities based ONLY on the provided capability profiles.

Problem Requirements:
Title: ${problem.title}
Description: ${problem.description}

Candidate Universities:
${JSON.stringify(universities, null, 2)}

Return ONLY a JSON array of objects:
[
  {
    "universityId": number,
    "universityName": "string",
    "matchScore": number (0-100),
    "reasons": ["array of bullet points explaining score"]
  }
]`;

    const result = await model.generateContent(prompt);
    return cleanAndParseJSON(result.response.text(), fallbackMatches);
  } catch (error) {
    console.error(`Gemini matchUniversities error (Model: ${GEMINI_MODEL}):`, error.message);
    return fallbackMatches;
  }
}

/**
 * 3. AI Disaster Analysis
 */
async function analyzeDisaster(disaster, hospitals, relocationSites) {
  const fallback = {
    affectedAreaKm2: 18.5,
    severityAssessment: `${disaster.type} emergency categorized as ${disaster.severity}. River inundation level elevated.`,
    populationAtRisk: disaster.affected_population || 45000,
    vulnerablePopulation: disaster.vulnerable_population || 8500,
    hospitalDemandEstimate: 'Estimated patient influx: 110-140 emergency admissions in next 12 hours.',
    requiredVolunteerRoles: [
      { role: 'Medical Support', count: 20, priority: 'CRITICAL' },
      { role: 'Relief Operations', count: 50, priority: 'HIGH' },
      { role: 'Technical / GIS', count: 10, priority: 'MEDIUM' },
      { role: 'Drone Operations', count: 2, priority: 'HIGH' }
    ],
    recommendedImmediateActions: [
      'Issue immediate evacuation advisory for low-lying sector 3-5.',
      'Deploy 2 drone teams to monitor rising water levels at arterial bridges.',
      'Dispatch medical student teams from Apex Medical University to Relocation Site Alpha.',
      'Notify District General Hospital of incoming 40 patient transfers.'
    ]
  };

  const genAI = getGenAI();
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are SolveLink AI Emergency Incident Decision Engine. Analyze the following verified disaster incident:

Disaster Incident:
Title: ${disaster.title}
Type: ${disaster.type}
Severity: ${disaster.severity}
Location: ${disaster.location}
Affected Population: ${disaster.affected_population}
Vulnerable Population: ${disaster.vulnerable_population}
Hazard Details: ${disaster.hazard_info}

Available Hospitals:
${JSON.stringify(hospitals)}

Available Relocation Sites:
${JSON.stringify(relocationSites)}

Return ONLY a JSON object:
{
  "affectedAreaKm2": number,
  "severityAssessment": "string",
  "populationAtRisk": number,
  "vulnerablePopulation": number,
  "hospitalDemandEstimate": "string",
  "requiredVolunteerRoles": [
    { "role": "string", "count": number, "priority": "CRITICAL" | "HIGH" | "MEDIUM" }
  ],
  "recommendedImmediateActions": ["array of strategic action strings"]
}`;

    const result = await model.generateContent(prompt);
    return cleanAndParseJSON(result.response.text(), fallback);
  } catch (error) {
    console.error(`Gemini analyzeDisaster error (Model: ${GEMINI_MODEL}):`, error.message);
    return fallback;
  }
}

/**
 * 4. AI Relocation Site Evaluation
 */
async function evaluateRelocationSites(disaster, sites) {
  const fallback = sites.map((site, idx) => {
    let score = 92 - idx * 7;
    let rationale = `Site has capacity for ${site.capacity} evacuees, ${site.hospital_distance_km}km from emergency care with ${site.road_status} road access.`;
    return {
      siteId: site.id,
      siteName: site.name,
      score: score,
      recommendationStatus: idx === 0 ? 'RECOMMENDED' : 'VIABLE_ALTERNATIVE',
      safetyRating: site.risk_level === 'LOW' ? 'HIGH_SAFETY' : 'MODERATE_SAFETY',
      rationale: rationale
    };
  });

  const genAI = getGenAI();
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `Evaluate candidate relocation sites for disaster incident: ${disaster.title} (${disaster.type}).
Candidate Sites:
${JSON.stringify(sites)}

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

    const result = await model.generateContent(prompt);
    return cleanAndParseJSON(result.response.text(), fallback);
  } catch (error) {
    console.error(`Gemini evaluateRelocationSites error (Model: ${GEMINI_MODEL}):`, error.message);
    return fallback;
  }
}

/**
 * 5. Command Center Conversational AI Assistant
 */
async function disasterAssistantQuery(userQuery, platformContext) {
  const genAI = getGenAI();
  if (!genAI) {
    console.warn('[Gemini AI] GEMINI_API_KEY is missing or uninitialized.');
    return { answer: 'AI Assistant is temporarily offline due to missing server API key.', groundedDataUsed: true };
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are SolveLink AI Command Center Assistant.
Respond concisely, professionally, and accurately using ONLY the provided verified platform state data below.
Do NOT invent fake numbers or external facts.

Verified Platform State Data:
${JSON.stringify(platformContext, null, 2)}

User Question: "${userQuery}"

Provide a clear, direct 2-4 sentence answer.`;

    const result = await model.generateContent(prompt);
    return { answer: result.response.text().trim(), groundedDataUsed: true };
  } catch (error) {
    console.error(`Gemini disasterAssistantQuery error (Model: ${GEMINI_MODEL}):`, error.message);
    throw error;
  }
}

/**
 * 6. Role-Aware Conversational AI Assistant Query Engine
 */
async function handleRoleAwareChat(userQuery, userRole, contextData, userName = '') {
  const genAI = getGenAI();
  if (!genAI) {
    console.warn('[Gemini AI] GEMINI_API_KEY is missing or uninitialized.');
    throw new Error('GEMINI_API_KEY not configured on server.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are SolveLink AI Assistant serving an authenticated user named "${userName}" with role: ${userRole}.
Respond concisely, professionally, and accurately using ONLY the provided verified database context below.
Do NOT invent fake numbers or external facts.

If the user says a simple greeting like "hi", "hello", "who are you", or "what can you help me with", respond warmly and address them by name (e.g. "Hello ${userName || userRole}! How can I help with your ${userRole} operations today?").

Authorized Database Context:
${JSON.stringify(contextData, null, 2)}

User Question: "${userQuery}"

Provide a clear, helpful 2-4 sentence response tailored to the ${userRole} role.`;

    const result = await model.generateContent(prompt);
    return { answer: result.response.text().trim(), groundedDataUsed: true };
  } catch (error) {
    console.error(`Gemini handleRoleAwareChat error (Model: ${GEMINI_MODEL}):`, error.message);
    throw error;
  }
}

module.exports = {
  analyzeProblem,
  matchUniversities,
  analyzeDisaster,
  evaluateRelocationSites,
  disasterAssistantQuery,
  handleRoleAwareChat
};
