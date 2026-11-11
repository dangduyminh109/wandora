const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isAllowedOrigin(
  origin: string | null,
  appUrl: string,
  requestUrl: string,
  development: boolean,
) {
  const configured = new URL(appUrl);
  if (origin === configured.origin) return true;
  if (!development || !origin || !loopbackHosts.has(configured.hostname)) return false;
  try {
    const source = new URL(origin);
    const destination = new URL(requestUrl);
    // Development only: treat loopback aliases on the same protocol/port as the same local app.
    return (
      origin === source.origin &&
      loopbackHosts.has(source.hostname) &&
      loopbackHosts.has(destination.hostname) &&
      source.protocol === configured.protocol &&
      destination.protocol === configured.protocol &&
      source.port === configured.port &&
      destination.port === configured.port
    );
  } catch {
    return false;
  }
}
