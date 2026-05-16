import notifier from 'node-notifier';

export interface NotifyOptions {
  title: string;
  message: string;
  subtitle?: string;
  sound?: boolean;
}

/**
 * Fire an OS-level notification. Best-effort: errors are logged and
 * swallowed so a notification failure can't take down the watcher.
 */
export function notify(opts: NotifyOptions): void {
  try {
    notifier.notify({
      title: opts.title,
      message: opts.message,
      subtitle: opts.subtitle,
      sound: opts.sound ?? true,
      timeout: 10,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[fleet:notifier] notification failed:', message);
  }
}
