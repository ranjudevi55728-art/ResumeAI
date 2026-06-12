import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, resumeData, jobTitle, companyName, jobDescription, bulletText } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is missing on the server." },
        { status: 500 }
      );
    }

    if (action === "optimizeATS") {
      const prompt = `Analyze this resume and the optional target job description. Re-evaluate the resume to optimize it for ATS (Applicant Tracking Systems).
Determine an ATS compatibility score from 0 to 100.
Formulate targeted suggestions for keywords, structure, section improvements.
Generate an improved, highly polished professional summary for this resume.

Resume Details:
${JSON.stringify(resumeData, null, 2)}

Target Job Description (if any):
${jobDescription || "N/A"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              atsScore: {
                type: Type.INTEGER,
                description: "ATS Compatibility Score (0 - 100)",
              },
              atsSuggestions: {
                type: Type.STRING,
                description: "Formatted Markdown bullet list of optimizations and keyword additions",
              },
              improvedSummary: {
                type: Type.STRING,
                description: "A highly crafted, professional summary optimized for the target job",
              },
            },
            required: ["atsScore", "atsSuggestions", "improvedSummary"],
          },
        },
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);
      return NextResponse.json(parsed);
    }

    if (action === "improveBullet") {
      const prompt = `You are an expert resume writer. Improve the following resume bullet point to be more impact-driven, professional, and action-oriented (using strong active verbs and quantitative results where possible). Keep it concise (1-2 sentences max).

Bullet Point:
"${bulletText}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return NextResponse.json({ improvedText: response.text?.trim() });
    }

    if (action === "generateCoverLetter") {
      const prompt = `Write a professional, outstanding cover letter matching the candidate's profile for the specified target position. Use elegant, persuasive language. Do not output placeholders; make it complete based on the provided details.

Candidate Name: ${resumeData.personalInfo?.fullName || "A Professional"}
Candidate Details:
- Contact Email: ${resumeData.personalInfo?.email || ""}
- Contact Phone: ${resumeData.personalInfo?.phone || ""}
- Work Experience Summary: ${resumeData.experience?.map((exp: any) => `${exp.position} at ${exp.company}`).join(", ") || ""}
- Key Skills: ${resumeData.skills?.join(", ") || ""}

Target Job:
- Position: ${jobTitle}
- Company: ${companyName}
- Target Job Description: ${jobDescription || "N/A"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return NextResponse.json({ coverLetter: response.text?.trim() });
    }

    if (action === "suggestSkillsAndSummary") {
      const prompt = `Based on the work experience specified, auto-generate a professional summary and suggest 8 relevant technical and soft skills. Return a JSON structure.

Work Experience:
${JSON.stringify(resumeData.experience, null, 2)}

Education:
${JSON.stringify(resumeData.education, null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedSummary: {
                type: Type.STRING,
                description: "Cohesive 3-4 sentence professional summary",
              },
              suggestedSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 8 highly relevant skills",
              },
            },
            required: ["suggestedSummary", "suggestedSkills"],
          },
        },
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Gemini API server-side route exception:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
