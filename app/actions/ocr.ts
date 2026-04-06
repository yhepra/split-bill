"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedItem {
  name: string;
  price: number;
  quantity: number;
}

const PROMPT = `You are a receipt parser. Analyze this receipt image and extract ALL purchased items.

Return ONLY a valid JSON array with this exact format, no markdown, no explanation:
[
  { "name": "Item Name", "price": 12000, "quantity": 1 },
  { "name": "Another Item", "price": 25000, "quantity": 2 }
]

Rules:
- Extract ONLY individual purchased items (food/beverage/product lines)
- SKIP: Total, Subtotal, Tax/Pajak, Service Charge, Discount, Rounding, Payment method lines
- price must be an integer in IDR (e.g. if receipt shows "38,000" return 38000)
- quantity is the number of units ordered (default 1 if not shown)
- name should be clean and readable (Title Case)
- If item spans multiple lines, combine into one name`;

export async function parseReceiptWithGemini(
  base64Image: string,
  mimeType: string
): Promise<ParsedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak ditemukan. Tambahkan di .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
  ]);

  const text = result.response.text().trim();

  // Strip markdown code fences if any
  const jsonStr = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  const parsed = JSON.parse(jsonStr) as ParsedItem[];

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini tidak mengembalikan array JSON yang valid");
  }

  return parsed.map((item) => ({
    name: String(item.name || "Item").trim(),
    price: Math.abs(Number(item.price) || 0),
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));
}
