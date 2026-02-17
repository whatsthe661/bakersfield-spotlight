/**
 * API Route: POST /api/nominate
 * 
 * This route accepts nomination submissions from the landing page.
 * - Posts them into Slack via SLACK_WEBHOOK_URL
 * - Calls OpenAI with OPENAI_API_KEY to enrich each nomination with 
 *   showrunner insights (logline, angle, questions, b-roll, etc.)
 * - Writes them to CloudKit (public database) for the iOS Prospects app
 * - Slack and CloudKit run in parallel; Slack is required, CloudKit is best-effort
 * - All secrets live in .env.local and are not committed to Git
 * - Fails gracefully if AI or CloudKit is unavailable
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createSign, createHash } from 'crypto';

// Types
interface NominationPayload {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone?: string;
  businessName: string;
  businessWebsite?: string;
  businessWebsiteOrInstagram?: string;
  reason: string;
  notifyBusiness?: boolean;
  businessContact?: string;
}

interface NominationAiInsights {
  logline: string;
  episodeAngle: string;
  emotionalTone: string;
  priorityScore: number;
  keyThemes: string[];
  suggestedQuestions: string[];
  brollIdeas: string[];
  researchIdeas: string[];
  notesForShowrunner: string;
}

// Validation helpers
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(value: string | undefined): string {
  if (!value) return '';
  return value.trim().slice(0, 5000);
}

// AI Insights Generator
async function generateNominationInsights(
  openai: OpenAI,
  data: NominationPayload
): Promise<NominationAiInsights | null> {
  const systemPrompt = `You are a senior showrunner and story producer for a cinematic docuseries called "What's the 661" about Bakersfield, California. Given a nomination for a local business or person, your job is to:

- Understand the potential story.
- Suggest an emotional and thematic angle for an episode.
- Propose a one-sentence logline.
- Generate strong interview questions.
- Propose specific b-roll / visual ideas.
- Tag the nomination with themes.
- Suggest a priority score from 1–10 based on story potential.

If you recognize the type of business, you may use general knowledge (e.g. what a yoga studio or coffee shop usually represents) but do not pretend you have actually looked this specific business up online. Make reasonable guesses, but do not fabricate specific facts about the business.

Return ONLY valid JSON with this exact shape (no markdown, no code blocks, just raw JSON):
{
  "logline": "string - one sentence episode logline",
  "episodeAngle": "string - the story angle to pursue",
  "emotionalTone": "string - the emotional tone (e.g., hopeful, gritty, redemptive)",
  "priorityScore": number 1-10,
  "keyThemes": ["array", "of", "theme", "strings"],
  "suggestedQuestions": ["interview", "questions", "as", "strings"],
  "brollIdeas": ["visual", "shot", "ideas"],
  "researchIdeas": ["things", "to", "research", "further"],
  "notesForShowrunner": "string - additional thoughts, red flags, or potential"
}`;

  const userPrompt = `Here's a new nomination:

Business Name: ${data.businessName}
${data.businessWebsiteOrInstagram ? `Website/Instagram: ${data.businessWebsiteOrInstagram}` : ''}

Nominated by: ${data.nominatorName} (${data.nominatorEmail})
${data.nominatorPhone ? `Phone: ${data.nominatorPhone}` : ''}

Reason for nomination:
${data.reason}

${data.notifyBusiness ? `The nominator wants the business notified.` : ''}
${data.businessContact ? `Business contact: ${data.businessContact}` : ''}

Generate showrunner insights for this nomination.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('OpenAI returned empty content');
      return null;
    }

    // Clean the response - remove any markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const insights = JSON.parse(cleanedContent) as NominationAiInsights;
    return insights;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
  }
}

// Build Slack message blocks
function buildSlackMessage(data: NominationPayload, insights: NominationAiInsights | null) {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎬 New What's the 661 Nomination",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: 
          `*Business:* ${data.businessName}${data.businessWebsiteOrInstagram ? ` (${data.businessWebsiteOrInstagram})` : ''}\n` +
          `*Nominator:* ${data.nominatorName} (${data.nominatorEmail}${data.nominatorPhone ? `, ${data.nominatorPhone}` : ''})\n` +
          `*Notify business?:* ${data.notifyBusiness ? 'Yes' : 'No'}${data.businessContact ? ` — Contact: ${data.businessContact}` : ''}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Reason for nomination:*\n${data.reason}`
      }
    },
    { type: "divider" }
  ];

  if (insights) {
    // AI Insights Header
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🤖 *AI Showrunner Insights*\n\n` +
          `*Logline:* ${insights.logline}\n\n` +
          `*Episode Angle:* ${insights.episodeAngle}\n\n` +
          `*Emotional Tone:* ${insights.emotionalTone}\n\n` +
          `*Priority Score:* ${insights.priorityScore}/10\n\n` +
          `*Key Themes:* ${insights.keyThemes.join(', ')}`
      }
    });

    // Interview Questions
    if (insights.suggestedQuestions.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📝 Suggested Interview Questions:*\n${insights.suggestedQuestions.map(q => `• ${q}`).join('\n')}`
        }
      });
    }

    // B-Roll Ideas
    if (insights.brollIdeas.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🎥 B-Roll Ideas:*\n${insights.brollIdeas.map(b => `• ${b}`).join('\n')}`
        }
      });
    }

    // Research Ideas
    if (insights.researchIdeas.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔍 Research Ideas:*\n${insights.researchIdeas.map(r => `• ${r}`).join('\n')}`
        }
      });
    }

    // Notes for Showrunner
    if (insights.notesForShowrunner) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📋 Notes for Showrunner:*\n${insights.notesForShowrunner}`
        }
      });
    }
  } else {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "_AI insights unavailable for this nomination._"
        }
      ]
    });
  }

  return {
    text: `New nomination: ${data.businessName}`,
    blocks
  };
}

// CloudKit Web Services — write nomination to public database
async function sendToCloudKit(
  data: NominationPayload,
  insights: NominationAiInsights | null
): Promise<void> {
  const CLOUDKIT_CONTAINER = process.env.CLOUDKIT_CONTAINER_ID;
  const CLOUDKIT_KEY_ID = process.env.CLOUDKIT_KEY_ID;
  const CLOUDKIT_PRIVATE_KEY = process.env.CLOUDKIT_PRIVATE_KEY;
  const CLOUDKIT_ENVIRONMENT = process.env.CLOUDKIT_ENVIRONMENT || 'development';

  if (!CLOUDKIT_CONTAINER || !CLOUDKIT_KEY_ID || !CLOUDKIT_PRIVATE_KEY) {
    console.warn('CloudKit not configured; skipping. Container:', !!CLOUDKIT_CONTAINER, 'KeyID:', !!CLOUDKIT_KEY_ID, 'PrivKey:', !!CLOUDKIT_PRIVATE_KEY);
    return;
  }

  // Handle Private Key: it might be raw PEM or have escaped newlines from env vars
  // Vercel may store the key with literal \n or with real newlines depending on how it was pasted
  let privateKey = CLOUDKIT_PRIVATE_KEY.replace(/\\n/g, '\n');

  // If the key doesn't contain real newlines after the header, it's a single-line base64 that needs wrapping
  if (!privateKey.includes('\nMH') && privateKey.includes('MH')) {
    // The key was stored without any newlines — reconstruct it
    const b64 = privateKey.replace('-----BEGIN EC PRIVATE KEY-----', '').replace('-----END EC PRIVATE KEY-----', '').replace(/\s/g, '');
    privateKey = `-----BEGIN EC PRIVATE KEY-----\n${b64}\n-----END EC PRIVATE KEY-----`;
  }

  console.log('CloudKit config: container=' + CLOUDKIT_CONTAINER + ' env=' + CLOUDKIT_ENVIRONMENT + ' keyID=' + CLOUDKIT_KEY_ID.substring(0, 8) + '... keyLen=' + privateKey.length);

  // Build CloudKit record fields
  const fields: Record<string, { value: unknown; type: string }> = {
    businessName: { value: data.businessName, type: 'STRING' },
    nominatorName: { value: data.nominatorName, type: 'STRING' },
    nominatorEmail: { value: data.nominatorEmail, type: 'STRING' },
    reason: { value: data.reason, type: 'STRING' },
    status: { value: 'new', type: 'STRING' },
    submittedAt: { value: Date.now(), type: 'TIMESTAMP' },
    notifyBusiness: { value: data.notifyBusiness ? 1 : 0, type: 'INT64' },
  };

  if (data.nominatorPhone) {
    fields.nominatorPhone = { value: data.nominatorPhone, type: 'STRING' };
  }
  if (data.businessWebsiteOrInstagram) {
    fields.businessWebsiteOrInstagram = { value: data.businessWebsiteOrInstagram, type: 'STRING' };
  }
  if (data.businessContact) {
    fields.businessContact = { value: data.businessContact, type: 'STRING' };
  }

  // Include AI insights so the iOS app has them immediately
  if (insights) {
    fields.aiLogline = { value: insights.logline, type: 'STRING' };
    fields.aiEpisodeAngle = { value: insights.episodeAngle, type: 'STRING' };
    fields.aiEmotionalTone = { value: insights.emotionalTone, type: 'STRING' };
    fields.aiPriorityScore = { value: insights.priorityScore, type: 'INT64' };
    fields.aiKeyThemes = { value: insights.keyThemes, type: 'STRING_LIST' };
    fields.aiSuggestedQuestions = { value: insights.suggestedQuestions, type: 'STRING_LIST' };
    fields.aiBrollIdeas = { value: insights.brollIdeas, type: 'STRING_LIST' };
    fields.aiResearchIdeas = { value: insights.researchIdeas, type: 'STRING_LIST' };
    fields.aiNotesForShowrunner = { value: insights.notesForShowrunner, type: 'STRING' };
  }

  const requestBody = JSON.stringify({
    operations: [{
      operationType: 'create',
      record: {
        recordType: 'Nomination',
        fields,
      }
    }]
  });

  // CloudKit server-to-server signed request
  const subpath = `/database/1/${CLOUDKIT_CONTAINER}/${CLOUDKIT_ENVIRONMENT}/public/records/modify`;
  const url = `https://api.apple-cloudkit.com${subpath}`;
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const bodyHash = createHash('sha256').update(requestBody, 'utf8').digest('base64');
  const message = `${date}:${bodyHash}:${subpath}`;
  const signer = createSign('SHA256');
  signer.update(message);
  const signature = signer.sign(privateKey, 'base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Apple-CloudKit-Request-KeyID': CLOUDKIT_KEY_ID,
      'X-Apple-CloudKit-Request-ISO8601Date': date,
      'X-Apple-CloudKit-Request-SignatureV1': signature,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CloudKit error ${response.status}: ${errorText}`);
  }

  console.log('Nomination written to CloudKit successfully');
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET = diagnostic check (no secrets exposed)
  if (req.method === 'GET') {
    const hasSlack = !!process.env.SLACK_WEBHOOK_URL;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasContainer = !!process.env.CLOUDKIT_CONTAINER_ID;
    const hasKeyID = !!process.env.CLOUDKIT_KEY_ID;
    const hasPrivKey = !!process.env.CLOUDKIT_PRIVATE_KEY;
    const ckEnv = process.env.CLOUDKIT_ENVIRONMENT || 'development';

    // Test CloudKit write if all keys present
    let cloudkitTest = 'not configured';
    if (hasContainer && hasKeyID && hasPrivKey) {
      try {
        let pk = process.env.CLOUDKIT_PRIVATE_KEY!.replace(/\\n/g, '\n');
        if (!pk.includes('\nMH') && pk.includes('MH')) {
          const b64 = pk.replace('-----BEGIN EC PRIVATE KEY-----', '').replace('-----END EC PRIVATE KEY-----', '').replace(/\s/g, '');
          pk = `-----BEGIN EC PRIVATE KEY-----\n${b64}\n-----END EC PRIVATE KEY-----`;
        }

        const subpath = `/database/1/${process.env.CLOUDKIT_CONTAINER_ID}/${ckEnv}/public/records/modify`;
        const testBody = JSON.stringify({
          operations: [{
            operationType: 'create',
            record: {
              recordType: 'Nomination',
              fields: {
                businessName: { value: 'Vercel Diagnostic Test', type: 'STRING' },
                status: { value: 'test', type: 'STRING' },
                submittedAt: { value: Date.now(), type: 'TIMESTAMP' },
                nominatorName: { value: 'Diagnostic', type: 'STRING' },
                reason: { value: 'Auto-test from GET /api/nominate', type: 'STRING' },
                notifyBusiness: { value: 0, type: 'INT64' },
              }
            }
          }]
        });
        const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
        const bodyHash = createHash('sha256').update(testBody, 'utf8').digest('base64');
        const message = `${date}:${bodyHash}:${subpath}`;
        const signer = createSign('SHA256');
        signer.update(message);
        const signature = signer.sign(pk, 'base64');

        const resp = await fetch(`https://api.apple-cloudkit.com${subpath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Apple-CloudKit-Request-KeyID': process.env.CLOUDKIT_KEY_ID!,
            'X-Apple-CloudKit-Request-ISO8601Date': date,
            'X-Apple-CloudKit-Request-SignatureV1': signature,
          },
          body: testBody,
        });

        if (resp.ok) {
          cloudkitTest = 'SUCCESS - wrote test record';
        } else {
          const errBody = await resp.text();
          cloudkitTest = `FAILED (${resp.status}): ${errBody.substring(0, 200)}`;
        }
      } catch (err: any) {
        cloudkitTest = `ERROR: ${err.message}`;
      }
    }

    return res.status(200).json({
      status: 'ok',
      env: {
        SLACK_WEBHOOK_URL: hasSlack,
        OPENAI_API_KEY: hasOpenAI,
        CLOUDKIT_CONTAINER_ID: hasContainer ? process.env.CLOUDKIT_CONTAINER_ID : false,
        CLOUDKIT_KEY_ID: hasKeyID ? process.env.CLOUDKIT_KEY_ID!.substring(0, 8) + '...' : false,
        CLOUDKIT_PRIVATE_KEY: hasPrivKey ? `set (${process.env.CLOUDKIT_PRIVATE_KEY!.length} chars)` : false,
        CLOUDKIT_ENVIRONMENT: ckEnv,
      },
      cloudkitTest,
    });
  }

  // Only allow POST for submissions
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check environment variables
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL is not configured');
    return res.status(500).json({ 
      success: false, 
      error: 'Slack not configured' 
    });
  }

  // Parse and validate body
  const body = req.body;
  
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  // Validate required fields
  const errors: string[] = [];
  
  if (!body.nominatorName || !String(body.nominatorName).trim()) {
    errors.push('Name is required');
  }
  if (!body.nominatorEmail || !String(body.nominatorEmail).trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(String(body.nominatorEmail))) {
    errors.push('Please enter a valid email address');
  }
  if (!body.businessName || !String(body.businessName).trim()) {
    errors.push('Business name is required');
  }
  if (!body.reason || !String(body.reason).trim()) {
    errors.push('Reason is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  // Sanitize data
  const data: NominationPayload = {
    nominatorName: sanitize(body.nominatorName),
    nominatorEmail: sanitize(body.nominatorEmail).toLowerCase(),
    nominatorPhone: sanitize(body.nominatorPhone),
    businessName: sanitize(body.businessName),
    businessWebsiteOrInstagram: sanitize(body.businessWebsite || body.businessWebsiteOrInstagram),
    reason: sanitize(body.reason),
    notifyBusiness: Boolean(body.notifyBusiness),
    businessContact: sanitize(body.businessContact),
  };

  // Generate AI insights if OpenAI is configured
  let aiInsights: NominationAiInsights | null = null;
  
  if (OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      aiInsights = await generateNominationInsights(openai, data);
    } catch (error) {
      console.warn('Failed to generate AI insights:', error);
      // Continue without AI insights
    }
  } else {
    console.warn('OPENAI_API_KEY is not set; skipping AI enrichment.');
  }

  // Fan out: send to Slack and CloudKit in parallel
  // Slack is required (failure = error to user), CloudKit is best-effort
  const slackMessage = buildSlackMessage(data, aiInsights);

  const [slackResult, cloudKitResult] = await Promise.allSettled([
    fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    }),
    sendToCloudKit(data, aiInsights),
  ]);

  // Check Slack result — this is the critical path
  if (slackResult.status === 'rejected') {
    console.error('Slack webhook error:', slackResult.reason);
    return res.status(500).json({
      success: false,
      error: 'Failed to send nomination. Please try again later.'
    });
  }

  const slackResponse = slackResult.value;
  if (!slackResponse.ok) {
    const errorText = await slackResponse.text();
    console.error('Slack webhook error:', slackResponse.status, errorText);
    return res.status(500).json({
      success: false,
      error: 'Failed to send nomination. Please try again later.'
    });
  }

  // CloudKit is non-critical — log failures but don't block the user
  if (cloudKitResult.status === 'rejected') {
    console.warn('CloudKit write failed (non-fatal):', cloudKitResult.reason);
  }

  return res.status(200).json({ success: true });
}
