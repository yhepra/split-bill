"use client";

import React, { useCallback, useReducer } from "react";
import { BillState, BillItem, Participant, Assignment, TaxConfig } from "@/types/bill";
import { parseReceiptWithGemini } from "@/app/actions/ocr";
import { UploadZone } from "@/components/UploadZone";
import { OCRProgress } from "@/components/OCRProgress";
import { BillEditor } from "@/components/BillEditor";
import { ParticipantPanel } from "@/components/ParticipantPanel";
import { SummaryPanel } from "@/components/SummaryPanel";
import { generateId } from "@/lib/utils";
import { Receipt, Sparkles } from "lucide-react";

// ─── State ────────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_ITEMS"; payload: BillItem[] }
  | { type: "SET_PARTICIPANTS"; payload: Participant[] }
  | { type: "SET_ASSIGNMENTS"; payload: Assignment[] }
  | { type: "SET_TAX"; payload: TaxConfig }
  | { type: "SET_IMAGE"; payload: string | null }
  | { type: "SET_OCR_PROCESSING"; payload: boolean }
  | { type: "SET_OCR_PROGRESS"; payload: { progress: number; status: string } }
  | { type: "RESET" };

const initialState: BillState = {
  items: [],
  participants: [],
  assignments: [],
  taxConfig: { taxRate: 0, serviceRate: 0 },
  imagePreviewUrl: null,
  isProcessingOCR: false,
  ocrProgress: 0,
  ocrStatus: "",
};

function reducer(state: BillState, action: Action): BillState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "SET_PARTICIPANTS":
      return { ...state, participants: action.payload };
    case "SET_ASSIGNMENTS":
      return { ...state, assignments: action.payload };
    case "SET_TAX":
      return { ...state, taxConfig: action.payload };
    case "SET_IMAGE":
      return { ...state, imagePreviewUrl: action.payload };
    case "SET_OCR_PROCESSING":
      return { ...state, isProcessingOCR: action.payload };
    case "SET_OCR_PROGRESS":
      return { ...state, ocrProgress: action.payload.progress, ocrStatus: action.payload.status };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SplitBillApp() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleFileSelected = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    dispatch({ type: "SET_IMAGE", payload: url });
    dispatch({ type: "SET_OCR_PROCESSING", payload: true });
    dispatch({ type: "SET_OCR_PROGRESS", payload: { progress: 10, status: "Membaca gambar..." } });

    try {
      // Convert file to base64 for Gemini
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data:image/...;base64, prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      dispatch({ type: "SET_OCR_PROGRESS", payload: { progress: 40, status: "AI sedang menganalisis struk..." } });

      const parsed = await parseReceiptWithGemini(base64, file.type || "image/jpeg");

      dispatch({ type: "SET_OCR_PROGRESS", payload: { progress: 90, status: "Memproses hasil..." } });

      const items: BillItem[] = parsed.map((p) => ({
        id: generateId(),
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      }));

      dispatch({ type: "SET_ITEMS", payload: items });
      dispatch({ type: "SET_OCR_PROGRESS", payload: { progress: 100, status: `✅ ${items.length} item berhasil dibaca!` } });
    } catch (err) {
      console.error("Gemini OCR Error:", err);
      dispatch({
        type: "SET_OCR_PROGRESS",
        payload: { progress: 0, status: "❌ Gagal membaca struk. Coba tambah item manual." },
      });
    } finally {
      dispatch({ type: "SET_OCR_PROCESSING", payload: false });
      setTimeout(() => {
        dispatch({ type: "SET_OCR_PROGRESS", payload: { progress: 0, status: "" } });
      }, 5000);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
    dispatch({ type: "RESET" });
  }, [state.imagePreviewUrl]);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg gradient-text">SplitBill</span>
              <Sparkles className="w-3.5 h-3.5 text-primary opacity-70" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Powered by Gemini 1.5 Flash AI ✨
          </span>
        </div>
      </header>

      {/* ─── Main: 12-column grid ─── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
        {/*
          Grid layout:
          Mobile   : single column (all stacked)
          Desktop  : 12 cols
            col 1–4  : Left  – image upload (sticky)
            col 5–8  : Middle – BillEditor + ParticipantPanel
            col 9–12 : Right  – SummaryPanel (sticky sidebar)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ── COL 1–4: Upload Zone ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-[4.5rem] flex flex-col gap-3">
            <UploadZone
              onFileSelected={handleFileSelected}
              imagePreviewUrl={state.imagePreviewUrl}
              isProcessing={state.isProcessingOCR}
              onReset={handleReset}
            />

            <OCRProgress
              progress={state.ocrProgress}
              status={state.ocrStatus}
              isVisible={state.isProcessingOCR || (state.ocrProgress === 100 && !!state.ocrStatus)}
            />

            {!state.imagePreviewUrl && (
              <p className="text-xs text-muted-foreground text-center">
                📸 Foto struk dibaca otomatis oleh Google Gemini AI
              </p>
            )}
          </div>

          {/* ── COL 5–8: BillEditor + ParticipantPanel ── */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <BillEditor
              items={state.items}
              onItemsChange={(items) => dispatch({ type: "SET_ITEMS", payload: items })}
            />

            <ParticipantPanel
              participants={state.participants}
              assignments={state.assignments}
              items={state.items}
              onParticipantsChange={(participants) =>
                dispatch({ type: "SET_PARTICIPANTS", payload: participants })
              }
              onAssignmentsChange={(assignments) =>
                dispatch({ type: "SET_ASSIGNMENTS", payload: assignments })
              }
            />
          </div>

          {/* ── COL 9–12: Summary Sidebar ── */}
          <div className="lg:col-span-3 lg:sticky lg:top-[4.5rem]">
            <SummaryPanel
              items={state.items}
              participants={state.participants}
              assignments={state.assignments}
              taxConfig={state.taxConfig}
              onTaxConfigChange={(taxConfig) =>
                dispatch({ type: "SET_TAX", payload: taxConfig })
              }
            />

            {state.participants.length === 0 && (
              <div className="hidden lg:flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border text-center">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Ringkasan otomatis</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tambahkan peserta untuk melihat kalkulasi tagihan
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-12 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          SplitBill · Didukung oleh Google Gemini 1.5 Flash AI ✨
        </p>
      </footer>
    </div>
  );
}
