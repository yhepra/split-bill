import { BillItem } from "@/types/bill";
import { generateId } from "@/lib/utils";

/**
 * Parses raw OCR text from a receipt into a list of BillItems.
 * Supports Indonesian receipt formats with dots as thousand separators.
 */
export function parseOCRText(rawText: string): BillItem[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: BillItem[] = [];

  // Patterns for prices: handles formats like 15.000, 15,000, 15000, Rp15.000, 15.000,00
  const pricePattern = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+)/gi;

  // Keywords to skip (headers, totals, etc.)
  const skipKeywords = [
    /^total/i, /^subtotal/i, /^grand/i, /^bayar/i, /^tunai/i,
    /^kembalian/i, /^change/i, /^cash/i, /^payment/i, /^ppn/i,
    /^tax/i, /^pajak/i, /^service/i, /^disc/i, /^diskon/i,
    /^struk/i, /^receipt/i, /^invoice/i, /^nota/i, /^kwitansi/i,
    /^no\./i, /^tanggal/i, /^date/i, /^kasir/i, /^cashier/i,
    /^table/i, /^meja/i, /^\*+/, /^-+/, /^=+/, /^thank/i,
    /^terima/i, /^selamat/i, /^welcome/i, /^\d{4}-\d{2}-\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}/, /^\d{2}:\d{2}/, /^jam/i, /^time/i,
  ];

  for (const line of lines) {
    // Skip lines with skip keywords
    if (skipKeywords.some((pattern) => pattern.test(line))) continue;

    // Skip very short lines
    if (line.length < 3) continue;

    // Find all price-like numbers in the line
    const allNumbers: number[] = [];
    let match;
    const tempPattern = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d{4,})/g;
    while ((match = tempPattern.exec(line)) !== null) {
      const numStr = match[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(numStr);
      if (num > 0) allNumbers.push(num);
    }

    if (allNumbers.length === 0) continue;

    // The price is typically the largest number or the last number on the line
    const price = Math.max(...allNumbers);

    // Skip if price is too small (< 100) or looks like a count/quantity only
    if (price < 100) continue;

    // Extract item name: remove price patterns and quantity prefixes
    let name = line;

    // Remove price patterns
    name = name.replace(/(?:rp\.?\s*)?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?/gi, "").trim();

    // Remove common prefixes like "1x", "2 x", quantity indicators
    name = name.replace(/^\d+\s*[xX]\s*/g, "").trim();
    name = name.replace(/^[xX]\s*/g, "").trim();

    // Remove trailing/leading punctuation
    name = name.replace(/^[\s\-\.\*\|:]+|[\s\-\.\*\|:]+$/g, "").trim();

    // Skip if name is empty or too short after cleaning
    if (!name || name.length < 2) continue;

    // Skip if name is just numbers
    if (/^\d+$/.test(name)) continue;

    // Detect quantity from patterns like "2x", "2 pcs", "qty:2"
    let quantity = 1;
    const qtyMatch = line.match(/^(\d+)\s*[xX]\s*/);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]) || 1;
    }

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

  // Deduplicate items with very similar names (OCR noise)
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
