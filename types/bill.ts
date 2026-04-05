export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface Assignment {
  itemId: string;
  participantIds: string[];
}

export interface TaxConfig {
  taxRate: number; // percentage, e.g. 10 for 10%
  serviceRate: number; // percentage, e.g. 5 for 5%
}

export interface BillState {
  items: BillItem[];
  participants: Participant[];
  assignments: Assignment[];
  taxConfig: TaxConfig;
  imagePreviewUrl: string | null;
  isProcessingOCR: boolean;
  ocrProgress: number;
  ocrStatus: string;
}

export interface ParticipantSummary {
  participant: Participant;
  items: { item: BillItem; share: number; cost: number }[];
  subtotal: number;
  tax: number;
  service: number;
  total: number;
}

export const PARTICIPANT_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#14b8a6", // teal
];
