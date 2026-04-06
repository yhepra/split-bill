import { BillItem } from "@/types/bill";
import { generateId } from "@/lib/utils";

/**
 * Parses raw OCR text from a receipt into a list of BillItems.
 * Supports Indonesian receipt formats with dots as thousand separators.
 */
export function parseOCRText(rawText: string): BillItem[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: BillItem[] = [];

  // Keywords to skip (headers, totals, payment methods, noise)
  const skipKeywords = [
    /^(?:total|subtotal|grand|bayar|tunai|kembalian|change|cash|payment|ppn|tax|pajak|service|disc|diskon|discount|promo|voucher)/i,
    /^(?:struk|receipt|invoice|nota|kwitansi|no\.|no :|tanggal|date|kasir|cashier|table|meja|items?|before|rounding|pembulatan)/i,
    /^(?:debit|kredit|credit|qris|ovo|gopay|dana|shopeepay|mandiri|bca|bni|bri)/i,
    /^\*+/, /^-+/, /^=+/, /^thank/i, /^terima/i, /^selamat/i, /^welcome/i,
    /^\d{4}-\d{2}-\d{2}/, /^\d{2}\/\d{2}\/\d{4}/, /^\d{2}:\d{2}/, /^jam/i, /^time/i,
    /^order/i, /^scan/i, /^http/i, /^www/i, /^@/i, /^phone/i, /^telp/i, /^wa /i,
  ];

  for (const line of lines) {
    // Skip lines with skip keywords
    if (skipKeywords.some((pattern) => pattern.test(line))) continue;

    // Skip very short lines
    if (line.length < 3) continue;

    // Find all price-like numbers in the line
    // Matches like "Rp 15.000", "15,000", "51,819", "38.000,00"
    const numbers: { raw: string; value: number }[] = [];
    let match;
    const pricePattern = /(?:\b(?:Rp|IDR)\.?\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,}|\d{1,3})/gi;
    
    while ((match = pricePattern.exec(line)) !== null) {
      const raw = match[0];
      let numStr = match[1];
      
      // If the number ends with ,00 or .00 (cents), strip it off first 
      // (Common in IDR receipts to show cents, e.g. 15.000,00)
      if (/[.,]\d{2}$/.test(numStr)) {
        numStr = numStr.replace(/[.,]\d{2}$/, "");
      }
      
      // Now strip all non-digit characters so "15.000" or "15,000" becomes "15000"
      numStr = numStr.replace(/[^0-9]/g, "");
      
      const num = parseInt(numStr, 10);
      // In IDR, genuine prices are typically >= 500. 
      // This helps ignore quantities like '1' or '2' that might get matched as tiny prices.
      if (num >= 500) {
        numbers.push({ raw, value: num });
      }
    }

    if (numbers.length === 0) continue;

    // The price is usually the absolute largest valid number on the line
    const priceObj = numbers.reduce((max, curr) => (curr.value > max.value ? curr : max), numbers[0]);
    const price = priceObj.value;

    // Extract item name: remove the raw price string from the line
    let name = line;
    const lastIdx = name.lastIndexOf(priceObj.raw);
    if (lastIdx !== -1) {
      name = name.substring(0, lastIdx) + name.substring(lastIdx + priceObj.raw.length);
    } else {
      name = name.replace(priceObj.raw, "");
    }

    // Attempt to extract quantity (e.g. "2x Kopi", "Kopi 2x", or just isolated "2" at boundaries)
    let quantity = 1;
    
    // Check at start: e.g. "2x Kopi" or "2 Kopi"
    const startQtyMatch = name.match(/^(\d+)\s*[xX]?\s+/);
    if (startQtyMatch) {
      quantity = parseInt(startQtyMatch[1], 10) || 1;
      name = name.substring(startQtyMatch[0].length);
    } else {
      // Check at end: e.g. "Kopi x2" or "Kopi 2"
      const endQtyMatch = name.match(/\s+[xX]?\s*(\d+)\s*[xX]?$/);
      if (endQtyMatch) {
        quantity = parseInt(endQtyMatch[1], 10) || 1;
        name = name.substring(0, name.length - endQtyMatch[0].length);
      }
    }

    // Clean up trailing/leading punctuation
    name = name.replace(/^[\s\-\.\*\|:,+]+|[\s\-\.\*\|:,+]+$/g, "").trim();

    // Skip if name is empty or too short
    if (!name || name.length < 2) continue;

    // Skip if name is just numbers
    if (/^\d+$/.test(name)) continue;

    // Capitalize item name properly
    name = name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    items.push({
      id: generateId(),
      name,
      price,
      quantity,
    });
  }

  // Deduplicate items with very similar names and identical prices (OCR noise)
  const deduplicated: BillItem[] = [];
  for (const item of items) {
    const duplicate = deduplicated.find(
      (d) => d.name.toLowerCase() === item.name.toLowerCase() && d.price === item.price
    );
    if (!duplicate) {
      deduplicated.push(item);
    }
  }

  return deduplicated;
}
