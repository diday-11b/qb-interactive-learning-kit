// Only public Supabase configuration may enter the static output.
export function validateConfig(config) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '') || /YOUR_|REPLACE|EXAMPLE/i.test(config.url)) {
    throw new Error('SUPABASE_URL must be your HTTPS Supabase project URL.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey || '') || /REPLACE|YOUR_|EXAMPLE/i.test(config.publishableKey)) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY must be a browser publishable key, never a secret/service-role key.');
  }
  return { url: config.url, publishableKey: config.publishableKey };
}
export function browserConfig(env, localSource = '') {
  const url = env.SUPABASE_URL?.trim(), key = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (url || key) return validateConfig({ url, publishableKey: key });
  if (env.VERCEL === '1') throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.');
  if (localSource) {
    const localUrl = localSource.match(/\burl\s*:\s*["']([^"']+)["']/)?.[1];
    const localKey = localSource.match(/\bpublishableKey\s*:\s*["']([^"']+)["']/)?.[1];
    return validateConfig({ url: localUrl, publishableKey: localKey });
  }
  return null;
}
