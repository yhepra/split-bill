"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedItem {
  name: string;
  price: number;
  quantity: number;
}

const PROMPT = `You are a receipt parser. Analyze this receipt image and extract ALL purchased items.

Return ONLY a valid JSON array with this exact format, no markdown, no explanation:
[{"name":"Item Name","price":7273,"quantity":3},{"name":"Another Item","price":25000,"quantity":1}]

Rules:
- Extract ONLY individual purchased items (food/beverage/product lines)
- SKIP: Total, Subtotal, Tax/Pajak/PB1, Service Charge, Discount, Rounding, Payment method lines, ITEMS count lines
- "price" must be the UNIT price per single item (= line total ÷ quantity). Example: if receipt shows qty 3, line total 21,819 → price = 7273
- "quantity" is the number of units ordered (default 1 if not shown)
- name should be clean Title Case, combine multi-line item names into one
- If an item has sub-items (like a bundle), list parent item only`;

function extractJSON(text: string): string {
  // Try to extract JSON array from the response
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];
  return text.trim();
}

export async function parseReceiptWithGemini(
  base64Image: string,
  mimeType: string
): Promise<ParsedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak ditemukan. Tambahkan di .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-flash-latest: confirmed working with this API key
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        data: base64Image,
        mimeType: (mimeType || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp",
      },
    },
  ]);

  const text = result.response.text().trim();
  const jsonStr = extractJSON(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON. Raw: ${text.substring(0, 200)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini did not return a JSON array");
  }

  return (parsed as ParsedItem[]).map((item) => ({
    name: String(item.name || "Item").trim(),
    price: Math.round(Math.abs(Number(item.price) || 0)),
    quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
  })).filter((item) => item.price > 0 && item.name.length > 0);
}

