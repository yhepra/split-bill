"use client";

import React from "react";
import { Check, Users2 } from "lucide-react";
import { BillItem, Participant, Assignment } from "@/types/bill";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AssignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BillItem[];
  participants: Participant[];
  assignments: Assignment[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
}

export function AssignSheet({
  open,
  onOpenChange,
  items,
  participants,
  assignments,
  onAssignmentsChange,
}: AssignSheetProps) {
  const isAssigned = (itemId: string, participantId: string): boolean => {
    return assignments.find((a) => a.itemId === itemId)?.participantIds.includes(participantId) ?? false;
  };

  const toggleAssignment = (itemId: string, participantId: string) => {
    const existing = assignments.find((a) => a.itemId === itemId);
    if (!existing) {
      onAssignmentsChange([...assignments, { itemId, participantIds: [participantId] }]);
      return;
    }
    const has = existing.participantIds.includes(participantId);
    onAssignmentsChange(
      assignments.map((a) =>
        a.itemId !== itemId
          ? a
          : {
              ...a,
              participantIds: has
                ? a.participantIds.filter((id) => id !== participantId)
                : [...a.participantIds, participantId],
            }
      )
    );
  };

  const getAssignedCount = (itemId: string) =>
    assignments.find((a) => a.itemId === itemId)?.participantIds.length ?? 0;

  const splitAll = () => {
    const allIds = participants.map((p) => p.id);
    onAssignmentsChange(items.map((item) => ({ itemId: item.id, participantIds: allIds })));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Users2 className="w-3.5 h-3.5 text-white" />
              </div>
              <SheetTitle>Assign Item ke Peserta</SheetTitle>
            </div>
            <button
              onClick={splitAll}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              id="sheet-btn-split-all"
            >
              Split Semua
            </button>
          </div>
          <SheetDescription className="px-4">
            Centang siapa yang memesan item ini
          </SheetDescription>
        </SheetHeader>

        {/* Participant legend */}
        <div className="flex gap-2 flex-wrap px-4 pb-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 text-white"
              style={{ backgroundColor: p.color }}
            >
              <span>{p.name}</span>
            </div>
          ))}
        </div>

        {/* Items list */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-2 scrollbar-thin">
          {items.map((item) => {
            const assignedCount = getAssignedCount(item.id);
            const costPerPerson = assignedCount > 0 ? (item.price * item.quantity) / assignedCount : 0;

            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                {/* Item header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(item.price * item.quantity)}
                      {assignedCount > 1 && (
                        <span className="ml-1 text-primary">
                          → {formatRupiah(costPerPerson)}/orang
                        </span>
                      )}
                    </p>
                  </div>
                  {assignedCount > 0 && (
                    <span className="text-xs font-medium bg-accent text-accent-foreground rounded-full px-2 py-0.5">
                      {assignedCount} orang
                    </span>
                  )}
                </div>

                {/* Participant toggles */}
                <div className="grid grid-cols-2 gap-2">
                  {participants.map((p) => {
                    const checked = isAssigned(item.id, p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleAssignment(item.id, p.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all border-2",
                          checked
                            ? "border-transparent text-white"
                            : "border-border bg-transparent text-foreground hover:border-primary/40"
                        )}
                        style={checked ? { backgroundColor: p.color, borderColor: p.color } : {}}
                        id={`sheet-assign-${item.id}-${p.id}`}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            checked ? "border-white/60 bg-white/20" : "border-current"
                          )}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada item. Tambahkan item di tabel daftar item terlebih dahulu.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
