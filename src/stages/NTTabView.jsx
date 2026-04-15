import { useCallback, useEffect, useRef, useState } from 'react';
import { useNt4 } from '@frc-web-components/react/networktables';
import FieldMap from '../components/FieldMap';

const NFR_ROOT = '/NFRDashboard';
const SYS_ROOT = '/NFRDashboard/systems';

function getTopicKeys(data) {
  if (!data) return [];
  if (data instanceof Map) return Array.from(data.keys());
  if (typeof data === 'object') return Object.keys(data);
  return [];
}

function ensureSystem(systems, sysName) {
  if (!systems.has(sysName)) {
    systems.set(sysName, { name: sysName, commands: new Map(), tunables: new Map(), readValues: new Map() });
  }
  return systems.get(sysName);
}

function buildTabData(topics, values, tabName) {
  const commands    = new Map();
  const tunables    = new Map();
  const readValues  = new Map();
  const cameras     = new Map();
  const systems     = new Map(); // sysName -> { name, commands, tunables, readValues }
  // fieldName -> Map(robotName -> {x, y, rotation})
  const robotsByField = new Map();

  const allKeys = new Set([...getTopicKeys(topics), ...getTopicKeys(values || {})]);

  const getValue = (k) => {
    if (!values) return undefined;
    if (values instanceof Map) return values.get(k);
    return values[k];
  };

  const esc = tabName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const CMD_RE      = new RegExp(`^${NFR_ROOT}/commands/${esc}/([^/]+)/(running|requestId|lastHandledRequestId|tab)$`);
  const TUN_BOOL_RE = new RegExp(`^${NFR_ROOT}/tunableBooleans/${esc}/([^/]+)/(value|changed|tab)$`);
  const TUN_NUM_RE  = new RegExp(`^${NFR_ROOT}/tunableNumbers/${esc}/([^/]+)/(value|changed|tab)$`);
  const TUN_STR_RE  = new RegExp(`^${NFR_ROOT}/tunableStrings/${esc}/([^/]+)/(value|changed|tab)$`);
  const VAL_BOOL_RE = new RegExp(`^${NFR_ROOT}/booleans/${esc}/([^/]+)/value$`);
  const VAL_NUM_RE  = new RegExp(`^${NFR_ROOT}/numbers/${esc}/([^/]+)/value$`);
  const VAL_STR_RE  = new RegExp(`^${NFR_ROOT}/strings/${esc}/([^/]+)/value$`);
  const CAM_RE      = new RegExp(`^${NFR_ROOT}/cameraStreams/${esc}/([^/]+)/(url|tab|name)$`);
  const ROBOT_RE    = new RegExp(`^${NFR_ROOT}/robots/${esc}/([^/]+)/([^/]+)/(x|y|rotation)$`);

  const SYS_CMD_RE   = new RegExp(`^${SYS_ROOT}/([^/]+)/commands/${esc}/([^/]+)/(running|requestId|tab)$`);
  const SYS_TBOOL_RE = new RegExp(`^${SYS_ROOT}/([^/]+)/tunableBooleans/${esc}/([^/]+)/(value|changed|tab)$`);
  const SYS_TNUM_RE  = new RegExp(`^${SYS_ROOT}/([^/]+)/tunableNumbers/${esc}/([^/]+)/(value|changed|tab)$`);
  const SYS_TSTR_RE  = new RegExp(`^${SYS_ROOT}/([^/]+)/tunableStrings/${esc}/([^/]+)/(value|changed|tab)$`);
  const SYS_VBOOL_RE = new RegExp(`^${SYS_ROOT}/([^/]+)/booleans/${esc}/([^/]+)/value$`);
  const SYS_VNUM_RE  = new RegExp(`^${SYS_ROOT}/([^/]+)/numbers/${esc}/([^/]+)/value$`);
  const SYS_VSTR_RE  = new RegExp(`^${SYS_ROOT}/([^/]+)/strings/${esc}/([^/]+)/value$`);

  allKeys.forEach(topic => {
    let m;

    // --- Top-level commands ---
    m = CMD_RE.exec(topic);
    if (m) {
      const [, name, field] = m;
      const cmd = commands.get(name) || {
        id: name, name, running: false,
        requestIdTopic: `${NFR_ROOT}/commands/${tabName}/${name}/requestId`
      };
      if (field === 'running') cmd.running = Boolean(getValue(topic));
      else {
        const v = getValue(`${NFR_ROOT}/commands/${tabName}/${name}/running`);
        if (v != null) cmd.running = Boolean(v);
      }
      commands.set(name, cmd);
      return;
    }

    // --- Top-level tunables ---
    for (const [re, type, section] of [
      [TUN_BOOL_RE, 'boolean', 'tunableBooleans'],
      [TUN_NUM_RE,  'number',  'tunableNumbers'],
      [TUN_STR_RE,  'string',  'tunableStrings'],
    ]) {
      m = re.exec(topic);
      if (m) {
        const [, name, field] = m;
        const id = `${type}:${name}`;
        const base = `${NFR_ROOT}/${section}/${tabName}/${name}`;
        const t = tunables.get(id) || {
          id, name, type,
          valueTopic: `${base}/value`,
          changedTopic: `${base}/changed`,
          value: type === 'boolean' ? false : type === 'number' ? 0 : '',
          changed: false,
        };
        const raw = getValue(topic);
        if (field === 'value') {
          if (type === 'boolean') t.value = Boolean(raw);
          else if (type === 'number') t.value = typeof raw === 'number' ? raw : Number(raw ?? 0);
          else t.value = raw == null ? '' : String(raw);
        }
        if (field === 'changed') t.changed = Boolean(raw);
        tunables.set(id, t);
        return;
      }
    }

    // --- Top-level read-only values ---
    for (const [re, type] of [
      [VAL_BOOL_RE, 'boolean'],
      [VAL_NUM_RE,  'number'],
      [VAL_STR_RE,  'string'],
    ]) {
      m = re.exec(topic);
      if (m) {
        const [, name] = m;
        const raw = getValue(topic);
        const value = type === 'boolean' ? Boolean(raw)
          : type === 'number' ? (typeof raw === 'number' ? raw : Number(raw ?? 0))
          : (raw == null ? '' : String(raw));
        readValues.set(`${type}:${name}`, { id: `${type}:${name}`, name, type, value });
        return;
      }
    }

    // --- Camera streams ---
    m = CAM_RE.exec(topic);
    if (m) {
      const [, name, field] = m;
      const cam = cameras.get(name) || { id: name, name, url: '' };
      if (field === 'url') { const raw = getValue(topic); cam.url = raw == null ? '' : String(raw); }
      cameras.set(name, cam);
      return;
    }

    // --- Robots ---
    m = ROBOT_RE.exec(topic);
    if (m) {
      const [, fieldName, robotName, field] = m;
      const fieldRobots = robotsByField.get(fieldName) || new Map();
      const robot = fieldRobots.get(robotName) || { x: 0, y: 0, rotation: 0 };
      const raw = getValue(topic);
      if (field === 'x') robot.x = typeof raw === 'number' ? raw : 0;
      if (field === 'y') robot.y = typeof raw === 'number' ? raw : 0;
      if (field === 'rotation') robot.rotation = typeof raw === 'number' ? raw : 0;
      fieldRobots.set(robotName, robot);
      robotsByField.set(fieldName, fieldRobots);
      return;
    }

    // --- System commands ---
    m = SYS_CMD_RE.exec(topic);
    if (m) {
      const [, sysName, name, field] = m;
      const sys = ensureSystem(systems, sysName);
      const cmd = sys.commands.get(name) || {
        id: `sys:${sysName}/${name}`, name, running: false,
        requestIdTopic: `${SYS_ROOT}/${sysName}/commands/${tabName}/${name}/requestId`
      };
      if (field === 'running') cmd.running = Boolean(getValue(topic));
      sys.commands.set(name, cmd);
      return;
    }

    // --- System tunables ---
    for (const [re, type, section] of [
      [SYS_TBOOL_RE, 'boolean', 'tunableBooleans'],
      [SYS_TNUM_RE,  'number',  'tunableNumbers'],
      [SYS_TSTR_RE,  'string',  'tunableStrings'],
    ]) {
      m = re.exec(topic);
      if (m) {
        const [, sysName, name, field] = m;
        const sys = ensureSystem(systems, sysName);
        const id = `${type}:sys:${sysName}/${name}`;
        const base = `${SYS_ROOT}/${sysName}/${section}/${tabName}/${name}`;
        const t = sys.tunables.get(id) || {
          id, name, type,
          valueTopic: `${base}/value`,
          changedTopic: `${base}/changed`,
          value: type === 'boolean' ? false : type === 'number' ? 0 : '',
          changed: false,
        };
        const raw = getValue(topic);
        if (field === 'value') {
          if (type === 'boolean') t.value = Boolean(raw);
          else if (type === 'number') t.value = typeof raw === 'number' ? raw : Number(raw ?? 0);
          else t.value = raw == null ? '' : String(raw);
        }
        if (field === 'changed') t.changed = Boolean(raw);
        sys.tunables.set(id, t);
        return;
      }
    }

    // --- System read-only values ---
    for (const [re, type] of [
      [SYS_VBOOL_RE, 'boolean'],
      [SYS_VNUM_RE,  'number'],
      [SYS_VSTR_RE,  'string'],
    ]) {
      m = re.exec(topic);
      if (m) {
        const [, sysName, name] = m;
        const sys = ensureSystem(systems, sysName);
        const raw = getValue(topic);
        const id = `${type}:sys:${sysName}/${name}`;
        const value = type === 'boolean' ? Boolean(raw)
          : type === 'number' ? (typeof raw === 'number' ? raw : Number(raw ?? 0))
          : (raw == null ? '' : String(raw));
        sys.readValues.set(id, { id, name, type, value });
        return;
      }
    }
  });

  const sortByName = (map) =>
    Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

  return {
    commands:   sortByName(commands),
    tunables:   sortByName(tunables),
    readValues: sortByName(readValues),
    cameras:    sortByName(cameras),
    robotsByField,
    systems: Array.from(systems.values())
      .map(s => ({
        name: s.name,
        commands:   sortByName(s.commands),
        tunables:   sortByName(s.tunables),
        readValues: sortByName(s.readValues),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export default function NTTabView({ tabName, layout = 'full' }) {
  const { nt4Provider } = useNt4();
  const [data, setData] = useState({
    commands: [], tunables: [], readValues: [], cameras: [], robotsByField: new Map(), systems: []
  });
  const [tunableDrafts, setTunableDrafts]       = useState({});
  const [submittedTunables, setSubmittedTunables] = useState({});
  const [focusedTunables, setFocusedTunables]   = useState(() => new Set());
  const [expandedSystems, setExpandedSystems]   = useState({});
  const requestIdsRef = useRef(new Map());

  const sync = useCallback(() => {
    if (!nt4Provider) return;
    setData(buildTabData(nt4Provider.topics, nt4Provider.topicValues || {}, tabName));
  }, [nt4Provider, tabName]);

  useEffect(() => {
    if (!nt4Provider) return;
    let subId;
    const client = nt4Provider.client;
    if (client?.subscribeAll) subId = client.subscribeAll([`${NFR_ROOT}/`], true);
    sync();
    const id = setInterval(sync, 50);
    return () => {
      clearInterval(id);
      if (typeof subId === 'number' && client?.unsubscribe) client.unsubscribe(subId);
    };
  }, [nt4Provider, sync]);

  const toggleCommand = (cmd) => {
    if (!nt4Provider?.setValue) return;
    const prev = requestIdsRef.current.get(cmd.id);
    const next = typeof prev === 'number' ? prev + 1 : 0;
    requestIdsRef.current.set(cmd.id, next);
    nt4Provider.setValue(cmd.requestIdTopic, next);
  };

  const updateTunable = (t, value) => {
    if (!nt4Provider?.setValue) return;
    nt4Provider.setValue(t.valueTopic, value);
    nt4Provider.setValue(t.changedTopic, true);
  };

  const getDraft = (t) => {
    if (Object.prototype.hasOwnProperty.call(tunableDrafts, t.id)) return tunableDrafts[t.id];
    if (Object.prototype.hasOwnProperty.call(submittedTunables, t.id)) return String(submittedTunables[t.id]);
    if (t.type === 'number') return String(Number.isFinite(t.value) ? t.value : 0);
    return String(t.value ?? '');
  };

  const commitDraft = (t) => {
    if (t.type === 'number') {
      const trimmed = getDraft(t).trim();
      if (!trimmed) return;
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) return;
      setSubmittedTunables(p => ({ ...p, [t.id]: parsed }));
      updateTunable(t, parsed);
    } else if (t.type === 'string') {
      const draft = getDraft(t);
      setSubmittedTunables(p => ({ ...p, [t.id]: draft }));
      updateTunable(t, draft);
    }
  };

  const toggleSystem = (name) =>
    setExpandedSystems(p => ({ ...p, [name]: !p[name] }));

  // Styles
  const trackStyle = (on) => ({
    display: 'inline-flex', alignItems: 'center',
    width: 46, height: 26, borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: on ? 'linear-gradient(135deg,#34d399,#10b981)' : 'rgba(255,255,255,0.18)',
    position: 'relative', transition: 'all 140ms', cursor: 'pointer',
    boxShadow: on ? '0 0 0 3px rgba(16,185,129,0.18)' : 'none',
    flexShrink: 0,
  });
  const knobStyle = (on) => ({
    position: 'absolute', top: 2, left: on ? 22 : 2,
    width: 20, height: 20, borderRadius: '50%',
    background: '#fff', transition: 'left 140ms',
  });
  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: 'inherit', outline: 'none', fontSize: 13,
  };

  // ---- Reusable renderers ----

  const renderTunable = (t) => (
    <div key={t.id} className="developer-command-btn" style={{ display: 'grid', gap: 8 }}>
      <span className="command-name">{t.name}</span>
      {t.type === 'boolean' ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={Boolean(t.value)}
            onChange={e => {
              const v = e.target.checked;
              setSubmittedTunables(p => ({ ...p, [t.id]: v }));
              updateTunable(t, v);
            }}
            style={{ display: 'none' }}
          />
          <span style={trackStyle(Boolean(t.value))}><span style={knobStyle(Boolean(t.value))} /></span>
          <span className="command-state">
            {Boolean(t.value) ? 'True' : 'False'}{t.changed ? ' (pending)' : ''}
          </span>
        </label>
      ) : (
        <input
          type="text"
          inputMode={t.type === 'number' ? 'decimal' : undefined}
          value={getDraft(t)}
          disabled={t.changed}
          style={{ ...inputStyle, opacity: t.changed ? 0.7 : 1, cursor: t.changed ? 'not-allowed' : 'text' }}
          onFocus={() => setFocusedTunables(p => { const n = new Set(p); n.add(t.id); return n; })}
          onChange={e => setTunableDrafts(p => ({ ...p, [t.id]: e.target.value }))}
          onBlur={() => {
            setFocusedTunables(p => { const n = new Set(p); n.delete(t.id); return n; });
            commitDraft(t);
          }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(t); e.currentTarget.blur(); } }}
        />
      )}
    </div>
  );

  const renderCommand = (cmd) => (
    <button
      key={cmd.id}
      type="button"
      className={`developer-command-btn ${cmd.running ? 'running' : ''}`}
      onClick={() => toggleCommand(cmd)}
      aria-pressed={cmd.running}
    >
      <span className="command-name">{cmd.name}</span>
      <span className="command-state">{cmd.running ? 'Running' : 'Stopped'}</span>
    </button>
  );

  const renderValue = (v) => (
    <div key={v.id} className="developer-command-btn" style={{ display: 'grid', gap: 6 }}>
      <span className="command-name">{v.name}</span>
      <span className="command-state">
        {v.type === 'boolean' ? (v.value ? 'True' : 'False') : String(v.value)}
      </span>
    </div>
  );

  // ---- Field robots (full layout only) ----
  const hasContent =
    data.commands.length > 0 || data.tunables.length > 0 || data.readValues.length > 0 ||
    data.cameras.length > 0 || data.systems.length > 0 || data.robotsByField.size > 0;

  if (!hasContent) {
    if (layout === 'panel') return null;
    return (
      <section className="stage-container developer-dashboard">
        <div className="developer-empty">
          No NT data for tab <strong>{tabName}</strong> yet
        </div>
      </section>
    );
  }

  const body = (
    <>
      {/* Fields — only in full layout, all fields with labeled robots */}
      {layout === 'full' && data.robotsByField.size > 0 && (
        <div style={{ marginBottom: 16 }}>
          {Array.from(data.robotsByField.entries()).map(([fieldName, robotMap]) => {
            const robots = Array.from(robotMap.entries()).map(([name, r]) => ({
              name,
              x: r.x,
              y: r.y,
              heading: r.rotation,
            }));
            return (
              <div key={fieldName} style={{ marginBottom: 12, maxWidth: 520 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                  {fieldName}
                </div>
                <FieldMap robots={robots} paths={[]} width={520} />
              </div>
            );
          })}
        </div>
      )}

      {/* Top-level commands */}
      {data.commands.length > 0 && (
        <>
          <h3 className="stage-title" style={{ marginBottom: 8 }}>Commands</h3>
          <div className="developer-command-grid">
            {data.commands.map(renderCommand)}
          </div>
        </>
      )}

      {/* Top-level tunables */}
      {data.tunables.length > 0 && (
        <>
          <h3 className="stage-title" style={{ marginTop: 12, marginBottom: 8 }}>Tunables</h3>
          <div className="developer-command-grid">
            {data.tunables.map(renderTunable)}
          </div>
        </>
      )}

      {/* Top-level read-only values */}
      {data.readValues.length > 0 && (
        <>
          <h3 className="stage-title" style={{ marginTop: 12, marginBottom: 8 }}>Values</h3>
          <div className="developer-command-grid">
            {data.readValues.map(renderValue)}
          </div>
        </>
      )}

      {/* Systems — each as a collapsible dropdown */}
      {data.systems.length > 0 && (
        <>
          <h3 className="stage-title" style={{ marginTop: 12, marginBottom: 8 }}>Systems</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {data.systems.map(sys => {
              const expanded = Boolean(expandedSystems[sys.name]);
              return (
                <div key={sys.name} className="developer-command-btn" style={{ display: 'grid', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => toggleSystem(sys.name)}
                    style={{ justifySelf: 'start' }}
                  >
                    {expanded ? '▾' : '▸'} {sys.name}
                  </button>

                  {expanded && (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {sys.commands.length > 0 && (
                        <div className="developer-command-grid">
                          {sys.commands.map(renderCommand)}
                        </div>
                      )}
                      {sys.tunables.length > 0 && (
                        <div className="developer-command-grid">
                          {sys.tunables.map(renderTunable)}
                        </div>
                      )}
                      {sys.readValues.length > 0 && (
                        <div className="developer-command-grid">
                          {sys.readValues.map(renderValue)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Camera streams */}
      {data.cameras.length > 0 && (
        <>
          <h3 className="stage-title" style={{ marginTop: 12, marginBottom: 8 }}>Cameras</h3>
          <div className="developer-command-grid">
            {data.cameras.map(cam => (
              <div key={cam.id} className="developer-command-btn" style={{ display: 'grid', gap: 8 }}>
                <span className="command-name">{cam.name}</span>
                <img
                  src={cam.url}
                  alt={`${cam.name} stream`}
                  style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  if (layout === 'panel') {
    return <div style={{ display: 'grid', gap: 8 }}>{body}</div>;
  }

  return (
    <section className="stage-container developer-dashboard" aria-label={`${tabName} tab`}>
      <div className="developer-headline">
        <h2 className="stage-title">{tabName}</h2>
      </div>
      {body}
    </section>
  );
}
