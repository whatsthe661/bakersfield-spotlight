/**
 * API Route: POST /api/nominate
 * 
 * This route accepts nomination submissions from the landing page.
 * - Posts them into Slack via SLACK_WEBHOOK_URL
 * - Calls OpenAI with OPENAI_API_KEY to enrich each nomination with 
 *   showrunner insights (logline, angle, questions, b-roll, etc.)
 * - All secrets live in .env.local and are not committed to Git
 * - Fails gracefully if AI is unavailable, but Slack notifications still work
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

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

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
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

  // Build and send Slack message
  const slackMessage = buildSlackMessage(data, aiInsights);

  try {
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error('Slack webhook error:', slackResponse.status, errorText);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send nomination. Please try again later.' 
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error sending to Slack:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send nomination. Please try again later.' 
    });
  }
}
