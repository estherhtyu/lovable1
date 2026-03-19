let featuresCache = null;

async function loadFeatures() {
  if (featuresCache) return featuresCache;
  try {
    const resp = await fetch('/config.json');
    const config = await resp.json();
    featuresCache = config?.public?.default?.features || {};
  } catch {
    featuresCache = {};
  }
  return featuresCache;
}

export async function isFeatureEnabled(name) {
  const features = await loadFeatures();
  const value = features[name];
  return value === true || value === 'true';
}

export function getFeatureFlag(name) {
  if (!featuresCache) return true;
  const value = featuresCache[name];
  return value === true || value === 'true';
}
