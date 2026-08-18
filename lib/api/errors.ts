/// Nest sends either a single message or a list of validation messages.
/// The user should see one readable line either way.
export function messageOf(error: unknown, fallback = 'Щось пішло не так'): string {
  if (typeof error === 'string') {
    return error;
  }
  const message = (error as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  return message ?? fallback;
}
