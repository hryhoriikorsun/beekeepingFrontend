'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  open: boolean;
  /// Exactly what has to be typed to unlock the delete button.
  expected: string;
  title: string;
  description?: string;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * A deliberately slow confirmation: the name has to be typed out by hand.
 * Deleting a product is one keystroke away from deleting the wrong one, and
 * unlike hiding it, it does not come back.
 *
 * Built on the native <dialog>: focus trapping, Esc and the inert background
 * are the browser's job, not ours.
 */
export function ConfirmDeleteDialog({
  open,
  expected,
  title,
  description,
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

  const matches = typed.trim() === expected.trim();

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
      {description && <p className="mt-2 text-sm text-neutral-700">{description}</p>}

      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (matches && !pending) onConfirm();
        }}
      >
        <label htmlFor={inputId} className="field-label mt-4 block text-sm">
          Щоб підтвердити, введіть назву товару: <b>{expected}</b>
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

        {error && <p className="alert alert-danger mt-4">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Відмінити
          </button>
          <button type="submit" className="btn btn-danger" disabled={!matches || pending}>
            {pending ? 'Видаляємо…' : 'Видалити'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
