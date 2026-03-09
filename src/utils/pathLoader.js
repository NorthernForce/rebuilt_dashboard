let autoMapCache = null;

export async function loadAutoMap() {
  if (autoMapCache) return autoMapCache;
  try {
    const res = await fetch('/paths/automap.json');
    autoMapCache = await res.json();
    return autoMapCache;
  } catch {
    return {};
  }
}

export async function loadPath(name) {
  try {
    const res = await fetch(`/paths/${name}.path`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadAutoPaths(autoName) {
  const autoMap = await loadAutoMap();
  const pathNames = autoMap[autoName];
  if (!pathNames || pathNames.length === 0) return [];

  const paths = await Promise.all(pathNames.map(loadPath));
  return paths.filter(Boolean);
}

export function computeBezierPoints(waypoints, numSegments = 50) {
  if (!waypoints || waypoints.length < 2) return [];

  const points = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p0 = waypoints[i].anchor;
    const p1 = waypoints[i].nextControl;
    const p2 = waypoints[i + 1].prevControl;
    const p3 = waypoints[i + 1].anchor;

    if (!p0 || !p3) continue;

    // If control points are missing, use linear interpolation
    const cp1 = p1 || p0;
    const cp2 = p2 || p3;

    for (let t = 0; t <= 1; t += 1 / numSegments) {
      const mt = 1 - t;
      const x = mt * mt * mt * p0.x
        + 3 * mt * mt * t * cp1.x
        + 3 * mt * t * t * cp2.x
        + t * t * t * p3.x;
      const y = mt * mt * mt * p0.y
        + 3 * mt * mt * t * cp1.y
        + 3 * mt * t * t * cp2.y
        + t * t * t * p3.y;
      points.push({ x, y });
    }
  }

  return points;
}
