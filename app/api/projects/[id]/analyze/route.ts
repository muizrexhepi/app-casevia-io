// app/api/projects/[id]/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { project, caseStudy, socialPost, user } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import { Resend } from "resend";
import CaseStudyReadyEmail from "@/components/emails/case-study-ready";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log("Starting analysis for project:", projectId);

    // 1. Get project with transcript
    const [projectData] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId));

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!projectData.transcript) {
      return NextResponse.json(
        { error: "No transcript available" },
        { status: 400 }
      );
    }

    // 2. Format transcript with speaker labels
    const formattedTranscript = formatTranscriptWithSpeakers(
      projectData.transcript,
      projectData.speakerLabels
    );

    console.log("Calling AI for analysis...");

    // 3. Call AI
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: CASE_STUDY_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this customer interview transcript and generate a comprehensive case study:\n\n${formattedTranscript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const analysisResult = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    console.log("AI analysis complete, saving to database...");

    // 4. Generate SEO-friendly slug
    const slug = generateSlug(analysisResult.title);

    // 5. Create case study record
    const caseStudyId = nanoid();
    await db.insert(caseStudy).values({
      id: caseStudyId,
      projectId: projectData.id,
      organizationId: projectData.organizationId,
      title: analysisResult.title,
      summary: analysisResult.summary,
      clientName: analysisResult.client_name || null,
      clientIndustry: analysisResult.client_industry || null,
      challenge: analysisResult.customer_challenge,
      solution: analysisResult.the_solution,
      results: analysisResult.key_results_text,
      keyQuotes: analysisResult.powerful_quotes || [],
      metrics: analysisResult.key_results || [],
      keyTakeaways: analysisResult.key_takeaways || [],
      publicSlug: slug,
      seoTitle: analysisResult.seo_title || analysisResult.title,
      seoDescription: analysisResult.seo_description || analysisResult.summary,
      published: false,
    });

    // 6. Create social posts
    if (analysisResult.linkedin_post_draft) {
      await db.insert(socialPost).values({
        id: nanoid(),
        caseStudyId,
        platform: "linkedin",
        content: analysisResult.linkedin_post_draft,
        status: "draft",
      });
    }

    if (
      analysisResult.x_thread_draft &&
      Array.isArray(analysisResult.x_thread_draft)
    ) {
      await db.insert(socialPost).values({
        id: nanoid(),
        caseStudyId,
        platform: "x",
        content: JSON.stringify(analysisResult.x_thread_draft),
        status: "draft",
      });
    }

    // 7. Update project status
    await db
      .update(project)
      .set({
        status: "ready",
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    console.log("Case study created, sending email notification...");

    // 8. 📧 SEND EMAIL NOTIFICATION
    try {
      // Get user email
      const [userData] = await db
        .select({
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, projectData.userId));

      if (userData?.email) {
        const { data, error } = await resend.emails.send({
          from: `Casevia <${process.env.RESEND_FROM_EMAIL}>`,
          to: userData.email,
          subject: `🎉 Your case study "${analysisResult.title}" is ready!`,
          react: CaseStudyReadyEmail({
            userName: userData.name || "there",
            caseStudyTitle: analysisResult.title,
            projectId: projectData.id,
            caseStudyId,
          }),
        });

        if (error) {
          console.error("Email error:", error);
        } else {
          console.log("Email sent successfully:", data);
        }
      }
    } catch (emailError) {
      // Don't fail the whole request if email fails
      console.error("Email error:", emailError);
    }

    console.log("Analysis complete!");

    return NextResponse.json({
      success: true,
      caseStudyId,
      message: "Case study generated successfully",
    });
  } catch (error) {
    console.error("Analysis error:", error);

    // Update project status to failed
    await db
      .update(project)
      .set({
        status: "failed",
        errorMessage: "Failed to analyze transcript",
        updatedAt: new Date(),
      })
      .where(eq(project.id, params.id));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function formatTranscriptWithSpeakers(
  transcript: string,
  speakerLabels: any
): string {
  if (!speakerLabels || !Array.isArray(speakerLabels)) {
    return transcript;
  }

  return speakerLabels
    .map((utterance: any) => {
      const speaker = utterance.speaker || "UNKNOWN";
      const text = utterance.text || "";
      return `[${speaker}]: ${text}`;
    })
    .join("\n\n");
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

const CASE_STUDY_SYSTEM_PROMPT = `You are an elite B2B case study writer with 15+ years creating high-converting customer success stories for SaaS, agencies, and professional services.

Your task: Analyze customer interview transcripts and extract key information to create a professional, data-driven case study.

The transcript contains:
- Interviewer (agency/company rep) - usually SPEAKER A
- Customer/client (case study subject) - usually SPEAKER B

Return a JSON object with this EXACT structure:

{
  "title": "Compelling, benefit-driven title using this formula: 'How [Client] Achieved [Specific Result] with [Solution]'. Examples: 'How TechCorp Reduced Support Tickets by 60% with AI Automation', 'How Acme Agency 3X'd Lead Generation in 90 Days'. Keep under 80 characters.",
  
  "summary": "One powerful sentence capturing the transformation. Format: '[Client] achieved [specific outcome] by [key action taken]'. Example: 'Cookie Company reversed declining profits by identifying storage inefficiencies that were driving costs 10% higher than competitors.'",
  
  "client_name": "Extract the client/company name. If not mentioned, use 'The Client' or null.",
  
  "client_industry": "Extract the industry (e.g., 'SaaS', 'E-commerce', 'Manufacturing', 'Professional Services'). Be specific.",
  
  "customer_challenge": "Write 2-3 paragraphs describing the SPECIFIC business problem. Structure:
  
  Paragraph 1: Set the scene - What was happening in their business? What metrics were declining? What was the emotional/business impact?
  
  Paragraph 2: Dig deeper - What were the root causes? What had they tried before? Why were those solutions failing?
  
  Paragraph 3: What were the stakes? What would happen if they didn't solve this?
  
  CRITICAL: Use DIRECT QUOTES from the customer (SPEAKER B) to support the problem. Format quotes like this: 'As [Name/Role] explained, \"[exact quote here].\"' 
  
  Focus on pain, urgency, and business impact. Make it relatable and human.",
  
  "the_solution": "Write 2-3 paragraphs describing HOW they solved it. Structure:
  
  Paragraph 1: The approach - What solution did they choose and why? What was the 'aha moment' that made them commit?
  
  Paragraph 2: Implementation - How did they roll it out? What specific features/strategies did they use? What was the process?
  
  Paragraph 3: The turning point - When did they start seeing results? What surprised them?
  
  CRITICAL: Use DIRECT QUOTES from the customer showing their thought process and discoveries. Avoid generic feature descriptions - focus on the customer's experience and decisions.",
  
  "key_results_text": "Write 1-2 paragraphs summarizing the OVERALL transformation and business impact. Focus on:
  - Quantifiable metrics (if available)
  - Qualitative improvements (efficiency, morale, customer satisfaction)
  - Long-term strategic benefits
  
  Start with the most impressive result. Use customer quotes to validate the impact.",
  
  "key_results": [
    {
      "metric": "ONE specific, measurable result per object. Format examples:
      - '40% increase in productivity'
      - 'Saved 15 hours per week'
      - 'Reduced costs by $50,000 annually'
      - '3x lead generation in 90 days'
      - 'Cut support tickets by 60%'
      
      CRITICAL: Only include metrics explicitly stated in the transcript. If no specific numbers, use qualitative metrics like 'Dramatically improved team efficiency' or 'Eliminated manual data entry'.",
      
      "quote": "The EXACT quote from the CUSTOMER (not interviewer) that validates this metric. Must be a direct quote, word-for-word from the transcript."
    }
  ],
  
  "powerful_quotes": [
    "Select 5-7 of the BEST quotes from the CUSTOMER (SPEAKER B only) that:
    - Show emotion and personality
    - Demonstrate clear value/ROI
    - Describe the 'before' pain or 'after' success
    - Are specific and concrete (not generic praise)
    
    Extract EXACTLY as spoken - do not paraphrase. Each quote should be a complete thought that can stand alone."
  ],
  
  "key_takeaways": [
    "3-5 strategic insights that make this case study valuable. Format as actionable statements:
    - 'Why this approach worked: [specific reason]'
    - 'The key to success was [specific factor]'
    - 'This strategy is especially effective for [specific scenario]'
    
    Avoid generic statements. Focus on WHAT made this successful and WHY."
  ],
  
  "seo_title": "SEO-optimized version for search engines. Formula: '[Result] Case Study: [Client Industry/Name]'. Keep 50-60 characters. Examples:
  - '60% Cost Reduction: Food Manufacturing Case Study'
  - 'SaaS Lead Gen: How Acme 3X'd Pipeline in 90 Days'",
  
  "seo_description": "Compelling meta description for Google. Formula: 'Discover how [Client] achieved [result] using [solution]. Includes [key metric] and lessons learned.' Keep 140-155 characters.",
  
  "linkedin_post_draft": "Write a 3-4 paragraph LinkedIn post from the AGENCY'S perspective announcing this success. Structure:

Paragraph 1: Hook - Lead with the most impressive result or challenge overcome. Use an emoji.

Paragraph 2: Context - Brief story of the challenge and approach. Make it relatable.

Paragraph 3: Results - Highlight 2-3 key outcomes with specific numbers if available.

Paragraph 4: CTA - Invite readers to read the full case study or get in touch.

Tone: Professional but conversational. Use emojis sparingly (2-3 max). Avoid generic marketing speak. Make it shareable.",
  
  "x_thread_draft": [
    "Tweet 1 (Hook): Start with the most shocking/impressive result. Use the format: '[Specific Result] in [Timeframe]. Here's how [Client] did it 🧵' Keep under 280 chars. Make people want to read more.",
    
    "Tweet 2 (Problem): Describe the challenge they faced. Make it relatable and specific. Under 280 chars.",
    
    "Tweet 3 (Solution): Explain the key insight or approach that unlocked success. Under 280 chars.",
    
    "Tweet 4 (Results): Share 2-3 specific outcomes. Use numbers when available. Under 280 chars.",
    
    "Tweet 5 (CTA): Call to action with value proposition. Example: 'Want similar results for your business? Read the full case study → [link placeholder]' Under 280 chars."
  ]
}

CRITICAL RULES:
1. NEVER fabricate metrics, quotes, or data not in the transcript
2. If specific numbers aren't mentioned, focus on qualitative improvements
3. Extract quotes EXACTLY as spoken - word-for-word, no modifications
4. Only quote the CUSTOMER (usually SPEAKER B), never the interviewer
5. Focus on business outcomes and transformation, not just features
6. Keep narratives compelling but 100% truthful to the transcript
7. If critical info is missing, use null or provide general descriptions
8. Maintain professional B2B tone throughout

QUOTE GUIDELINES:
- Only include quotes that are clear, complete thoughts
- Remove filler words like "um", "uh", "like" for readability
- Keep the speaker's authentic voice and emotion
- Quotes should validate claims, show emotion, or demonstrate impact

METRICS GUIDELINES:
- Percentage changes: "40% increase", "60% reduction"
- Time savings: "Saved 10 hours per week", "Cut onboarding time by 50%"
- Cost impact: "Reduced costs by $50K annually", "ROI of 300%"
- Multipliers: "3x lead generation", "5x faster processing"
- If no numbers, use: "Significantly improved", "Dramatically reduced", "Substantially increased"

Return ONLY valid JSON. No markdown, no additional text.`;
