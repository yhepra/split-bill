"use client";

import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, ShoppingBag } from "lucide-react";
import { BillItem } from "@/types/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, generateId } from "@/lib/utils";

interface BillEditorProps {
  items: BillItem[];
  onItemsChange: (items: BillItem[]) => void;
}

interface EditingState {
  id: string;
  field: "name" | "price" | "quantity";
}

export function BillEditor({ items, onItemsChange }: BillEditorProps) {
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (item: BillItem, field: EditingState["field"]) => {
    setEditingState({ id: item.id, field });
    setEditValue(
      field === "name"
        ? item.name
        : field === "quantity"
        ? item.quantity.toString()
        : item.price.toString()
    );
  };

  const commitEdit = (item: BillItem) => {
    if (!editingState) return;
    const updated = items.map((i) => {
      if (i.id !== item.id) return i;
      if (editingState.field === "name") return { ...i, name: editValue.trim() || i.name };
      if (editingState.field === "quantity")
        return { ...i, quantity: Math.max(1, parseInt(editValue) || 1) };
      if (editingState.field === "price") {
        const cleaned = editValue.replace(/[^0-9]/g, "");
        return { ...i, price: parseFloat(cleaned) || i.price };
      }
      return i;
    });
    onItemsChange(updated);
    setEditingState(null);
  };

  const cancelEdit = () => setEditingState(null);

  const deleteItem = (id: string) => {
    onItemsChange(items.filter((i) => i.id !== id));
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: generateId(),
      name: "Item Baru",
      price: 0,
      quantity: 1,
    };
    onItemsChange([...items, newItem]);
    // Auto-start editing the name
    setTimeout(() => startEdit(newItem, "name"), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: BillItem) => {
    if (e.key === "Enter") commitEdit(item);
    if (e.key === "Escape") cancelEdit();
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Card id="bill-editor-card" className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <CardTitle>Daftar Item</CardTitle>
          </div>
          <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
            {items.length} item
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table header */}
        {items.length > 0 && (
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-4 py-2 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Nama Item</span>
            <span className="text-center w-10">Qty</span>
            <span className="text-right w-28">Harga</span>
            <span className="w-8" />
          </div>
        )}

        {/* Item rows */}
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Belum ada item</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload foto struk atau tambah item manual
                </p>
              </div>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-4 py-2.5 items-center hover:bg-accent/20 transition-colors group animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Name */}
                <div className="min-w-0">
                  {editingState?.id === item.id && editingState.field === "name" ? (
                    <div className="flex items-center gap-1">
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item)}
                        className="h-7 text-sm py-0 px-2"
                        id={`input-name-${item.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-500"
                        onClick={() => commitEdit(item)}
                        id={`btn-confirm-name-${item.id}`}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={cancelEdit}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="text-sm text-left truncate w-full hover:text-primary transition-colors font-medium flex items-center gap-1 group/name"
                      onClick={() => startEdit(item, "name")}
                      id={`btn-edit-name-${item.id}`}
                    >
                      <span className="truncate">{item.name}</span>
                      <Pencil className="w-3 h-3 opacity-0 group-hover/name:opacity-50 transition-opacity flex-shrink-0" />
                    </button>
                  )}
                </div>

                {/* Quantity */}
                <div className="w-10 text-center">
                  {editingState?.id === item.id && editingState.field === "quantity" ? (
                    <Input
                      autoFocus
                      type="number"
                      min="1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, item)}
                      onBlur={() => commitEdit(item)}
                      className="h-7 text-sm py-0 px-1 text-center w-10"
                      id={`input-qty-${item.id}`}
                    />
                  ) : (
                    <button
                      className="text-sm text-muted-foreground hover:text-primary transition-colors w-full"
                      onClick={() => startEdit(item, "quantity")}
                      id={`btn-edit-qty-${item.id}`}
                    >
                      ×{item.quantity}
                    </button>
                  )}
                </div>

                {/* Price */}
                <div className="w-28 text-right">
                  {editingState?.id === item.id && editingState.field === "price" ? (
                    <Input
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
                      onKeyDown={(e) => handleKeyDown(e, item)}
                      onBlur={() => commitEdit(item)}
                      className="h-7 text-sm py-0 px-2 text-right w-28"
                      id={`input-price-${item.id}`}
                    />
                  ) : (
                    <button
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors w-full text-right"
                      onClick={() => startEdit(item, "price")}
                      id={`btn-edit-price-${item.id}`}
                    >
                      {formatRupiah(item.price * item.quantity)}
                    </button>
                  )}
                </div>

                {/* Delete */}
                <div className="w-8 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => deleteItem(item.id)}
                    id={`btn-delete-${item.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: total + add button */}
        <div className="px-4 py-3 border-t border-border bg-secondary/30 rounded-b-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Subtotal</span>
            <span className="text-base font-bold gradient-text">{formatRupiah(total)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={addItem}
            id="btn-add-item"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
