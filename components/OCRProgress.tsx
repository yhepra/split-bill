"use client";

import React from "react";
import { ScanLine, Cpu } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OCRProgressProps {
  progress: number;
  status: string;
  isVisible: boolean;
}

export function OCRProgress({ progress, status, isVisible }: OCRProgressProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border bg-card p-4 animate-fade-in",
        "shadow-sm"
      )}
      id="ocr-progress-panel"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          {progress < 100 ? (
            <ScanLine className="w-4 h-4 text-white animate-pulse" />
          ) : (
            <Cpu className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{status}</p>
          <p className="text-xs text-muted-foreground">{progress}% selesai</p>
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}
