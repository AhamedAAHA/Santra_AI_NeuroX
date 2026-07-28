"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditableHeadlineProps = {
  value: string;
  label?: string;
  placeholder?: string;
  onSave: (next: string) => void;
  onDelete: () => void;
};

export function EditableHeadline({
  value,
  label = "Named signal",
  placeholder = "Add a headline…",
  onSave,
  onDelete,
}: EditableHeadlineProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function beginEdit() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    const next = draft.trim();
    onSave(next);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{label}</p>
        {!editing ? (
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="ghost" size="sm" onClick={beginEdit}>
              <Pencil className="h-3.5 w-3.5" />
              {value.trim() ? "Edit" : "Add"}
            </Button>
            {value.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                aria-label="Delete headline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="ghost" size="sm" onClick={commit} disabled={!draft.trim() && !value.trim()}>
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") cancel();
          }}
          placeholder={placeholder}
          className="mt-2 h-auto min-h-12 py-3 text-lg font-semibold md:text-xl"
          autoFocus
        />
      ) : value.trim() ? (
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-white md:text-3xl">{value}</h2>
      ) : (
        <p className="mt-2 text-sm italic text-white/40">No headline — click Add to write one.</p>
      )}
    </div>
  );
}
