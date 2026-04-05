"use client";

import { BillItem } from "@/types/bill";
import { parseOCRText } from "@/lib/parseOCRText";

export interface OCRProgressEvent {
  status: string;
  progress: number; // 0-100
}

export interface OCRResult {
  text: string;
  items: BillItem[];
  confidence: number;
}

type ProgressCallback = (event: OCRProgressEvent) => void;

// Whitelist: alphanumeric + common receipt characters
// Keeps letters (for item names), digits + punctuation (for prices)
const RECEIPT_CHAR_WHITELIST =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/:- @";

/**
 * OCRService: client-side receipt text extraction using Tesseract.js
 * Supports Indonesian (ind) + English (eng) languages.
 */
export class OCRService {
  private static workerInstance: import("tesseract.js").Worker | null = null;
  private static isInitializing = false;

  private static async getWorker(
    onProgress: ProgressCallback
  ): Promise<import("tesseract.js").Worker> {
    if (this.workerInstance) {
      return this.workerInstance;
    }

    if (this.isInitializing) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (!this.isInitializing) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
      return this.workerInstance!;
    }

    this.isInitializing = true;

    try {
      const { createWorker } = await import("tesseract.js");

      onProgress({ status: "Memuat mesin OCR...", progress: 5 });

      const worker = await createWorker("ind+eng", 1, {
        logger: (m) => {
          if (m.status === "loading tesseract core") {
            onProgress({ status: "Memuat Tesseract...", progress: 10 });
          } else if (m.status === "initializing tesseract") {
            onProgress({ status: "Inisialisasi Tesseract...", progress: 20 });
          } else if (m.status === "loading language traineddata") {
            onProgress({ status: "Memuat data bahasa (ind+eng)...", progress: 30 });
          } else if (m.status === "initializing api") {
            onProgress({ status: "Menyiapkan API...", progress: 50 });
          } else if (m.status === "recognizing text") {
            const pct = Math.round((m.progress || 0) * 40) + 55;
            onProgress({
              status: "Membaca teks struk...",
              progress: Math.min(pct, 95),
            });
          }
        },
      });

      // Apply character whitelist to improve price reading accuracy
      await worker.setParameters({
        tessedit_char_whitelist: RECEIPT_CHAR_WHITELIST,
      });

      this.workerInstance = worker;
      this.isInitializing = false;
      return worker;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  static async extractFromFile(
    file: File,
    onProgress: ProgressCallback
  ): Promise<OCRResult> {
    onProgress({ status: "Menyiapkan gambar...", progress: 2 });

    try {
      const worker = await this.getWorker(onProgress);

      onProgress({ status: "Menganalisis struk...", progress: 55 });

      const {
        data: { text, confidence },
      } = await worker.recognize(file);

      onProgress({ status: "Memproses hasil...", progress: 98 });

      const items = parseOCRText(text);

      onProgress({ status: "Selesai!", progress: 100 });

      return { text, items, confidence };
    } catch (error) {
      throw new Error(
        `OCR gagal: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  static async terminate(): Promise<void> {
    if (this.workerInstance) {
      await this.workerInstance.terminate();
      this.workerInstance = null;
    }
  }
}
