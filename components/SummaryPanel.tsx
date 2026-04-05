"use client";

import React, { useState } from "react";
import {
  Calculator,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
} from "lucide-react";
import { BillItem, Participant, Assignment, TaxConfig, ParticipantSummary } from "@/types/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Bank Config ─────────────────────────────────────────────────────────────

interface BankOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
}

const BANK_OPTIONS: BankOption[] = [
  { value: "bca", label: "BCA", icon: <Building2 className="w-3.5 h-3.5" />, color: "#005BAC" },
  { value: "bni", label: "BNI", icon: <Building2 className="w-3.5 h-3.5" />, color: "#F7821B" },
  { value: "bri", label: "BRI", icon: <Building2 className="w-3.5 h-3.5" />, color: "#00529B" },
  { value: "mandiri", label: "Mandiri", icon: <Building2 className="w-3.5 h-3.5" />, color: "#003D6B" },
  { value: "jago", label: "Bank Jago", icon: <Smartphone className="w-3.5 h-3.5" />, color: "#00B04F" },
  { value: "dana", label: "Dana", icon: <Wallet className="w-3.5 h-3.5" />, color: "#118EEA" },
  { value: "ovo", label: "OVO", icon: <Wallet className="w-3.5 h-3.5" />, color: "#4C3494" },
  { value: "gopay", label: "GoPay", icon: <Wallet className="w-3.5 h-3.5" />, color: "#00AA13" },
  { value: "shopeepay", label: "ShopeePay", icon: <Wallet className="w-3.5 h-3.5" />, color: "#EE4D2D" },
  { value: "qris", label: "QRIS", icon: <CreditCard className="w-3.5 h-3.5" />, color: "#E31E26" },
  { value: "other", label: "Lainnya", icon: <CreditCard className="w-3.5 h-3.5" />, color: "#6B7280" },
];

// ─── Calculation ──────────────────────────────────────────────────────────────

function computeSummaries(
  items: BillItem[],
  participants: Participant[],
  assignments: Assignment[],
  taxConfig: TaxConfig
): ParticipantSummary[] {
  return participants.map((participant) => {
    const participantItems: ParticipantSummary["items"] = [];
    let subtotal = 0;

    for (const item of items) {
      const assignment = assignments.find((a) => a.itemId === item.id);
      const assignedCount = assignment?.participantIds.length ?? 0;
      if (assignedCount > 0 && assignment?.participantIds.includes(participant.id)) {
        const share = 1 / assignedCount;
        const cost = item.price * item.quantity * share;
        participantItems.push({ item, share, cost });
        subtotal += cost;
      }
    }

    const tax = subtotal * (taxConfig.taxRate / 100);
    const service = subtotal * (taxConfig.serviceRate / 100);
    const total = subtotal + tax + service;

    return { participant, items: participantItems, subtotal, tax, service, total };
  });
}

// ─── WA Text Formatter ────────────────────────────────────────────────────────

function generateWhatsAppText(
  summaries: ParticipantSummary[],
  taxConfig: TaxConfig,
  bankInfo: { bank: string; accountName: string; accountNumber: string }
): string {
  const date = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const grandTotal = summaries.reduce((s, p) => s + p.total, 0);
  const bankOption = BANK_OPTIONS.find((b) => b.value === bankInfo.bank);
  const bankLabel = bankOption?.label ?? bankInfo.bank;

  let text = `🧾 *SPLIT BILL — ${date}*\n`;
  text += `${"━".repeat(28)}\n\n`;

  for (const summary of summaries) {
    text += `👤 *${summary.participant.name}*\n`;

    if (summary.items.length === 0) {
      text += `  _(belum ada item)_\n`;
    } else {
      for (const { item, share, cost } of summary.items) {
        const shareLabel = share < 1 ? ` (${Math.round(share * 100)}%)` : "";
        const qty = item.quantity > 1 ? ` x${item.quantity}` : "";
        text += `  • ${item.name}${qty}${shareLabel}\n`;
        text += `    ${formatRupiah(cost)}\n`;
      }
    }

    if (taxConfig.taxRate > 0 || taxConfig.serviceRate > 0) {
      text += `  ──────────────────\n`;
      text += `  Subtotal  : ${formatRupiah(summary.subtotal)}\n`;
      if (taxConfig.taxRate > 0)
        text += `  Pajak ${taxConfig.taxRate}%  : ${formatRupiah(summary.tax)}\n`;
      if (taxConfig.serviceRate > 0)
        text += `  Servis ${taxConfig.serviceRate}%: ${formatRupiah(summary.service)}\n`;
    }

    text += `  💰 *Total: ${formatRupiah(summary.total)}*\n\n`;
  }

  text += `${"━".repeat(28)}\n`;
  text += `💵 *Grand Total: ${formatRupiah(grandTotal)}*\n\n`;

  // Bank info
  if (bankInfo.accountNumber) {
    text += `📲 *Transfer ke:*\n`;
    text += `  ${bankLabel}`;
    if (bankInfo.accountName) text += ` a/n ${bankInfo.accountName}`;
    text += `\n`;
    text += `  No. Rek: *${bankInfo.accountNumber}*\n\n`;
  }

  text += `_Dibuat dengan SplitBill App_ 🤝`;

  return text;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SummaryPanelProps {
  items: BillItem[];
  participants: Participant[];
  assignments: Assignment[];
  taxConfig: TaxConfig;
  onTaxConfigChange: (config: TaxConfig) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SummaryPanel({
  items,
  participants,
  assignments,
  taxConfig,
  onTaxConfigChange,
}: SummaryPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const summaries = computeSummaries(items, participants, assignments, taxConfig);
  const grandTotal = summaries.reduce((s, p) => s + p.total, 0);

  const copyToClipboard = async () => {
    const text = generateWhatsAppText(summaries, taxConfig, {
      bank: selectedBank,
      accountName,
      accountNumber,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (participants.length === 0) return null;

  const selectedBankOption = BANK_OPTIONS.find((b) => b.value === selectedBank);

  return (
    <Card id="summary-panel-card" className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <CardTitle>Ringkasan Tagihan</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Tax & Service ── */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
            Biaya Tambahan
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Pajak (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxConfig.taxRate || ""}
                onChange={(e) =>
                  onTaxConfigChange({ ...taxConfig, taxRate: parseFloat(e.target.value) || 0 })
                }
                placeholder="cth: 10"
                className="h-9"
                id="input-tax-rate"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Servis (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxConfig.serviceRate || ""}
                onChange={(e) =>
                  onTaxConfigChange({ ...taxConfig, serviceRate: parseFloat(e.target.value) || 0 })
                }
                placeholder="cth: 5"
                className="h-9"
                id="input-service-rate"
              />
            </div>
          </div>
        </div>

        {/* ── Per-person Summary Cards ── */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
            Tagihan Per Orang
          </p>
          <div className="space-y-2">
            {summaries.map((summary) => (
              <div
                key={summary.participant.id}
                className="rounded-xl border border-border overflow-hidden"
              >
                {/* Row header */}
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/40 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === summary.participant.id ? null : summary.participant.id)
                  }
                  id={`btn-expand-${summary.participant.id}`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: summary.participant.color }}
                  >
                    {summary.participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {summary.participant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.items.length} item
                      {(taxConfig.taxRate > 0 || taxConfig.serviceRate > 0) &&
                        summary.subtotal > 0 &&
                        ` + pajak/servis`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-base font-bold" style={{ color: summary.participant.color }}>
                      {formatRupiah(summary.total)}
                    </span>
                    {expandedId === summary.participant.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expandedId === summary.participant.id && (
                  <div className="border-t border-border bg-secondary/20 px-4 py-3 space-y-1.5 animate-fade-in">
                    {summary.items.map(({ item, share, cost }) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0 text-sm">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: summary.participant.color }}
                          />
                          <span className="truncate text-foreground">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                          )}
                          {share < 1 && (
                            <span className="text-xs text-primary font-medium flex-shrink-0">
                              ({Math.round(share * 100)}%)
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground ml-3 flex-shrink-0">
                          {formatRupiah(cost)}
                        </span>
                      </div>
                    ))}

                    {summary.items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        Belum ada item yang di-assign
                      </p>
                    )}

                    {(taxConfig.taxRate > 0 || taxConfig.serviceRate > 0) && summary.subtotal > 0 && (
                      <div className="border-t border-border/50 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatRupiah(summary.subtotal)}</span>
                        </div>
                        {taxConfig.taxRate > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Pajak {taxConfig.taxRate}%</span>
                            <span>+{formatRupiah(summary.tax)}</span>
                          </div>
                        )}
                        {taxConfig.serviceRate > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Servis {taxConfig.serviceRate}%</span>
                            <span>+{formatRupiah(summary.service)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold pt-0.5">
                          <span>Total</span>
                          <span style={{ color: summary.participant.color }}>
                            {formatRupiah(summary.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Grand Total ── */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-accent/30 border border-primary/20">
          <span className="font-semibold text-foreground">Grand Total</span>
          <span className="font-bold text-xl gradient-text">{formatRupiah(grandTotal)}</span>
        </div>

        {/* ── Bank Info ── */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
            Info Rekening / Pembayaran
          </p>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Metode Pembayaran
              </label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger className="h-9" id="select-bank">
                  <SelectValue placeholder="Pilih bank / dompet digital...">
                    {selectedBankOption && (
                      <span className="flex items-center gap-2">
                        {selectedBankOption.icon}
                        {selectedBankOption.label}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BANK_OPTIONS.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      <span className="flex items-center gap-2">
                        {bank.icon}
                        {bank.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Nama Penerima
                </label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Nama rekening..."
                  className="h-9 text-sm"
                  id="input-account-name"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  No. Rekening / HP
                </label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="08123456789"
                  className="h-9 text-sm"
                  inputMode="numeric"
                  id="input-account-number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Copy WA Button ── */}
        <Button
          className="w-full h-12 text-base font-semibold shadow-lg"
          onClick={copyToClipboard}
          id="btn-copy-wa"
          disabled={summaries.every((s) => s.items.length === 0)}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Tersalin! Paste ke WhatsApp 🎉
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 mr-2" />
              Salin Pesan WhatsApp
            </>
          )}
        </Button>

        {copied && (
          <p className="text-xs text-center text-muted-foreground animate-fade-in -mt-2">
            Buka WhatsApp → tempel pesan → kirim ke teman 📱
          </p>
        )}
      </CardContent>
    </Card>
  );
}
