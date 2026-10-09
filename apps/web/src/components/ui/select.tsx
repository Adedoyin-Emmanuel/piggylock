import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * shadcn/ui-style select: a trigger button plus a listbox popover.
 * Accessible (combobox + listbox roles, aria-activedescendant) and keyboard
 * friendly: ↑/↓/Home/End to move, Enter/Space to pick, Esc/Tab to close.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  "aria-label"?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  function show() {
    // Open upward when there isn't room below (e.g. near the bottom of the screen).
    const rect = triggerRef.current?.getBoundingClientRect();
    const listHeight = Math.min(options.length * 44 + 8, 320);
    setOpenUp(!!rect && window.innerHeight - rect.bottom < listHeight + 16 && rect.top > listHeight);
    setActive(selectedIndex);
    setOpen(true);
  }

  function close(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  function pick(index: number) {
    onChange(options[index].value);
    close();
  }

  // Focus the list when it opens; close on outside tap.
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active option in view while navigating with the keyboard.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  }

  function onListKeyDown(e: KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => Math.min(active + 1, last),
      ArrowUp: () => Math.max(active - 1, 0),
      Home: () => 0,
      End: () => last,
    };
    if (moves[e.key]) {
      e.preventDefault();
      setActive(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-base shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
          open && "border-ring ring-[3px] ring-ring/30",
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2 truncate">
          <span className="font-medium">{selected?.label}</span>
          {selected?.hint && (
            <span className="text-sm text-muted-foreground">{selected.hint}</span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKeyDown}
          className={cn(
            "absolute z-20 max-h-80 w-full overflow-y-auto rounded-lg border bg-card p-1 shadow-lg outline-none",
            "animate-popover-in",
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={String(option.value)}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(index)}
                onClick={() => pick(index)}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-base select-none",
                  index === active && "bg-muted",
                  isSelected && "font-semibold",
                )}
              >
                <span className="flex items-baseline gap-2">
                  {option.label}
                  {option.hint && (
                    <span className="text-sm font-normal text-muted-foreground">{option.hint}</span>
                  )}
                </span>
                {isSelected && <Check aria-hidden className="size-4 text-primary" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
