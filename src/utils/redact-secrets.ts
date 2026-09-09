/** Redact credentials before data leaves the server or reaches logs. */
export function redactSecrets<T>(value: T, secrets: string[] = []): T {
  if (typeof value === 'string') {
    let text: string = value;
    for (const secret of secrets.filter(Boolean)) {
      text = text.split(secret).join('[REDACTED]');
      text = text.split(encodeURIComponent(secret)).join('[REDACTED]');
    }
    text = text.replace(/([?&](?:access_token|client_secret|refresh_token)=)[^&\s"']+/gi, '$1[REDACTED]');
    return text as T;
  }
  if (Array.isArray(value)) return value.map(item => redactSecrets(item, secrets)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /^(?:access_?token|meta_?access_?token|refresh_?token|client_?secret|app_?secret|authorization)$/i.test(key)
        ? '[REDACTED]'
        : redactSecrets(item, secrets),
    ])) as T;
  }
  return value;
}
