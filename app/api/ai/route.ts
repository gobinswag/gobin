import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

async function uploadToGemini(filePath: string, mimeType: string) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

async function saveUploadedFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = path.join(process.cwd(), "tmp/uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, file.name);
  await fs.writeFile(filePath, buffer);
  
  return filePath;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const filePath = await saveUploadedFile(file);
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    const uploadedFile = await uploadToGemini(filePath, mimeType);

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: uploadedFile.mimeType,
                fileUri: uploadedFile.uri,
              },
            },
            { text: "You are a vision model that analyzes images of potentially recyclable objects. You must identify the object in the image, assess how recyclable it is, and return statistics about its recyclability.\n\nYour response must be ONLY valid JSON. Do not include any explanatory text, markdown, or comments.\n\nThe JSON response must always follow this format, regardless of whether the object is recyclable or even recognizable:\n\n```json\n{\n  \"detected_object\": \"<name of the object or 'unrecognized'>\",\n  \"recyclability_score\": <percentage from 0 to 100>,\n  \"recyclable\": <true or false>,\n  \"material\": \"<main material type or 'unknown'>\",\n  \"recycling_statistics\": {\n    \"global_recycling_rate\": \"<integer percentage or 'unknown'>\",\n    \"common_issues\": [\"<issue1>\", \"<issue2>\", \"...\"],\n    \"processing_notes\": \"<short explanation or 'Not applicable'>\"\n  },\n  \"recommendation\": \"<short actionable advice or 'Object not recyclable or not recognized'>\"\n}\n```\nIf the object cannot be identified, set \"detected_object\" to \"unrecognized\".\n\nIf the object is not recyclable or not identifiable, set \"recyclability_score\" to 0, \"recyclable\" to false, and populate other fields with \"unknown\" or a reasonable placeholder.\n\nOnly output valid JSON in this exact structure." },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage("Analyze this image for recyclability");
    
    await fs.unlink(filePath);

    const responseText = result.response.text();
    console.log(responseText);
    
    // Try to match both json code blocks and standalone JSON objects
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
    console.log(jsonMatch);

    if (!jsonMatch || !jsonMatch[0]) {
      throw new Error("JSON block not found in response");
    }

    // Use the first matched group if available, otherwise use the entire match
    const jsonContent = jsonMatch[1] || jsonMatch[0];
    const parsedJson = JSON.parse(jsonContent);

    return NextResponse.json(parsedJson);
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}