'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  /**
   * Exactly what has to be typed before the action unlocks. Left out for
   * actions that are merely irreversible rather than destructive - a wall of
   * typing in front of every click teaches people to stop reading it.
   */
  expected?: string;
  expectedPrompt?: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  tone?: 'danger' | 'primary';
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * One confirmation for the admin section. Built on the native <dialog>, so
 * focus trapping, Esc and the inert background behind it are the browser's
 * job, not ours.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  expected,
  expectedPrompt,
  confirmLabel,
  pendingLabel = 'Зачекайте…',
  tone = 'danger',
  pending = false,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setTyped('');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const unlocked = expected === undefined || typed.trim() === expected.trim();

  return (
    <dialog
      ref={ref}
      className="modal-panel"
      aria-labelledby={`${inputId}-title`}
      // Esc closes the dialog itself; the parent still has to learn about it.
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={`${inputId}-title`} className="text-[19px] font-semibold">
        {title}
      </h2>
      {description && <div className="mt-2 text-sm text-neutral-700">{description}</div>}

      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (unlocked && !pending) onConfirm();
        }}
      >
        {expected !== undefined && (
          <>
            <label htmlFor={inputId} className="field-label mt-4 block text-sm">
              {expectedPrompt ?? (
                <>
                  Щоб підтвердити, введіть назву товару: <b>{expected}</b>
                </>
              )}
            </label>
            <input
              id={inputId}
              className="input mt-1"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              // Autofocus is right here: the dialog exists only for this field.
              autoFocus
            />
          </>
        )}

        {error && <p className="alert alert-danger mt-4">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Відмінити
          </button>
          <button
            type="submit"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            disabled={!unlocked || pending}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
