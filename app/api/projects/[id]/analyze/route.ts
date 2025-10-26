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

const CASE_STUDY_SYSTEM_PROMPT = `You are an expert B2B case study writer and marketing analyst with 15+ years of experience creating compelling customer success stories for SaaS companies, agencies, and professional services.

Your task is to analyze customer interview transcripts and extract the key information needed to create a professional, persuasive case study.

The transcript contains a conversation between:
- An interviewer (agency/company representative) - usually labeled SPEAKER A or similar
- A customer/client (the subject of the case study) - usually labeled SPEAKER B or similar

You must return a JSON object with this EXACT structure:

{
  "title": "A compelling, benefit-driven title for the case study (e.g., 'How Acme Corp Increased Leads by 300% in 90 Days')",
  "summary": "A concise 1-2 sentence summary that captures the core transformation",
  "client_name": "The name of the client/company if mentioned, otherwise null",
  "client_industry": "The industry or business type if mentioned, otherwise null",
  "customer_challenge": "A 2-3 paragraph description of the specific business problem or pain point the customer was facing BEFORE. Use direct quotes where possible. Focus on the emotional and business impact.",
  "the_solution": "A 2-3 paragraph description of how the product/service was implemented and used. Include the 'aha moment' and key features utilized. Use direct quotes.",
  "key_results_text": "A 1-2 paragraph summary of the overall outcomes and improvements",
  "key_results": [
    {
      "metric": "A specific, measurable result (e.g., '40% increase in productivity', 'Saved 10 hours per week', 'Reduced costs by $50K')",
      "quote": "The exact quote from the CUSTOMER that supports this metric"
    }
  ],
  "powerful_quotes": [
    "Direct quotes from the CUSTOMER that are emotional, impactful, or demonstrate clear value. Select 5-7 of the best quotes from throughout the interview."
  ],
  "key_takeaways": [
    "3-5 bullet points summarizing why this case study matters and what made it successful"
  ],
  "seo_title": "An SEO-optimized version of the title (50-60 characters)",
  "seo_description": "A meta description for search engines (140-155 characters)",
  "linkedin_post_draft": "A 3-4 paragraph LinkedIn post announcing this case study. Written from the agency's perspective. Include emojis and make it engaging. End with a CTA.",
  "x_thread_draft": [
    "Tweet 1: A hook that grabs attention (under 280 chars)",
    "Tweet 2-4: Tell the story - problem, solution, results (each under 280 chars)",
    "Tweet 5: Call to action with link placeholder (under 280 chars)"
  ]
}

CRITICAL INSTRUCTIONS:
1. NEVER invent metrics, numbers, or quotes that aren't in the transcript
2. If specific metrics aren't mentioned, focus on qualitative improvements
3. Extract quotes EXACTLY as spoken - do not modify or paraphrase quoted text
4. Distinguish between the customer's voice and the interviewer's voice
5. Focus on business outcomes and ROI, not just features
6. Make the narrative compelling but truthful
7. If critical information is missing, use null or provide a general description
8. Keep the tone professional and suitable for B2B marketing

When writing social media posts (LinkedIn or X):
- Use the tone of a B2B marketing agency sharing a success story.
- Mention measurable outcomes only if explicitly in the transcript.
- Keep posts human-sounding, not overly “AI polished”.
- Avoid repeating the case study title exactly.
- For X threads, make the first tweet a high-impact hook that can stand alone.

Return ONLY valid JSON. No additional text.`;
