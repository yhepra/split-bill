"use client";

import React, { useState } from "react";
import { Users, Plus, X, LayoutGrid } from "lucide-react";
import { BillItem, Participant, Assignment, PARTICIPANT_COLORS } from "@/types/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AssignSheet } from "@/components/AssignSheet";

interface ParticipantPanelProps {
  participants: Participant[];
  assignments: Assignment[];
  items: BillItem[];
  onParticipantsChange: (participants: Participant[]) => void;
  onAssignmentsChange: (assignments: Assignment[]) => void;
}

export function ParticipantPanel({
  participants,
  assignments,
  items,
  onParticipantsChange,
  onAssignmentsChange,
}: ParticipantPanelProps) {
  const [newName, setNewName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const addParticipant = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const participant: Participant = {
      id: generateId(),
      name: trimmed,
      color: PARTICIPANT_COLORS[participants.length % PARTICIPANT_COLORS.length],
    };
    onParticipantsChange([...participants, participant]);
    setNewName("");
  };

  const removeParticipant = (id: string) => {
    onParticipantsChange(participants.filter((p) => p.id !== id));
    onAssignmentsChange(
      assignments.map((a) => ({
        ...a,
        participantIds: a.participantIds.filter((pid) => pid !== id),
      }))
    );
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

  const isAssigned = (itemId: string, participantId: string): boolean =>
    assignments.find((a) => a.itemId === itemId)?.participantIds.includes(participantId) ?? false;

  const splitAll = () => {
    const allIds = participants.map((p) => p.id);
    onAssignmentsChange(items.map((item) => ({ itemId: item.id, participantIds: allIds })));
  };

  return (
    <>
      <Card id="participant-panel-card" className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <CardTitle>Peserta</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {participants.length > 1 && items.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={splitAll}
                  className="text-xs h-7 px-2 hidden md:flex"
                  id="btn-split-all"
                >
                  Split Semua
                </Button>
              )}
              {/* Mobile: open assign sheet */}
              {participants.length > 0 && items.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSheetOpen(true)}
                  className="text-xs h-7 px-2 md:hidden"
                  id="btn-open-assign-sheet"
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                  Assign
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add participant */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addParticipant();
            }}
            className="flex gap-2"
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama peserta..."
              className="flex-1 h-9"
              maxLength={30}
              id="input-participant-name"
            />
            <Button
              type="submit"
              disabled={!newName.trim()}
              className="h-9 px-3"
              id="btn-add-participant"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {/* Participant chips */}
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white"
                  style={{ backgroundColor: p.color }}
                >
                  <span>{p.name}</span>
                  <button
                    onClick={() => removeParticipant(p.id)}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                    id={`btn-remove-participant-${p.id}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Desktop: assignment matrix */}
          {participants.length > 0 && items.length > 0 && (
            <div className="hidden md:block space-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Assignment Item
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={splitAll}
                  className="text-xs h-6 px-2"
                  id="btn-split-all-matrix"
                >
                  Split Semua
                </Button>
              </div>

              {/* Header: participant initials */}
              <div
                className="grid gap-x-1 text-xs font-medium text-muted-foreground mb-1"
                style={{
                  gridTemplateColumns: `1fr ${participants.map(() => "2.25rem").join(" ")}`,
                }}
              >
                <span className="truncate text-[11px]">Item</span>
                {participants.map((p) => (
                  <div key={p.id} className="flex justify-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Item rows */}
              <div className="space-y-0.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                {items.map((item) => {
                  const assignedCount =
                    assignments.find((a) => a.itemId === item.id)?.participantIds.length ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="grid gap-x-1 items-center rounded-lg hover:bg-secondary/50 px-1 py-1.5 transition-colors"
                      style={{
                        gridTemplateColumns: `1fr ${participants.map(() => "2.25rem").join(" ")}`,
                      }}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs text-foreground truncate">{item.name}</span>
                        {assignedCount > 1 && (
                          <span className="text-[10px] text-primary flex-shrink-0 font-medium">
                            ÷{assignedCount}
                          </span>
                        )}
                      </div>
                      {participants.map((p) => {
                        const checked = isAssigned(item.id, p.id);
                        return (
                          <div key={p.id} className="flex justify-center">
                            <button
                              onClick={() => toggleAssignment(item.id, p.id)}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 border-2",
                                checked
                                  ? "border-transparent"
                                  : "border-border hover:border-primary/40"
                              )}
                              style={
                                checked ? { backgroundColor: p.color + "22", borderColor: p.color } : {}
                              }
                              id={`btn-assign-${item.id}-${p.id}`}
                              title={`${checked ? "Remove" : "Assign"} ${p.name}`}
                            >
                              {checked && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: p.color }}
                                />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile: hint to use sheet */}
          {participants.length > 0 && items.length > 0 && (
            <Button
              variant="outline"
              className="w-full md:hidden border-dashed"
              onClick={() => setSheetOpen(true)}
              id="btn-open-assign-sheet-full"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Buka Assignment Item ({items.length} item)
            </Button>
          )}

          {participants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Tambahkan peserta untuk mulai assign item
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mobile Assign Sheet */}
      <AssignSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        items={items}
        participants={participants}
        assignments={assignments}
        onAssignmentsChange={onAssignmentsChange}
      />
    </>
  );
}
