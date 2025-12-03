import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';

// LiveConsolePage.jsx
// Single-file React component (default export) implementing a live-console page.
// Uses TailwindCSS for styling. It supports either a real WebSocket stream (set REACT_APP_WS_URL)
// or a built-in mock stream if no WS URL is provided.
// Additional features added: severity filters, text search, acknowledge alerts, connect/disconnect.
// Dependencies: react-window, framer-motion, tailwindcss

const SEVERITY = {
  INFO: 'info',
  OK: 'ok',
  WARN: 'warn',
  CRIT: 'crit',
};

function randomSeverity() {
  const r = Math.random();
  if (r < 0.6) return SEVERITY.OK;
  if (r < 0.8) return SEVERITY.WARN;
  if (r < 0.95) return SEVERITY.INFO;
  return SEVERITY.CRIT;
}

function colorForSeverity(s) {
  switch (s) {
    case SEVERITY.OK:
      return 'border-l-4 border-green-500 bg-green-50';
    case SEVERITY.WARN:
      return 'border-l-4 border-amber-400 bg-amber-50';
    case SEVERITY.CRIT:
      return 'border-l-4 border-red-500 bg-red-50 animate-pulse/70';
    default:
      return 'border-l-4 border-slate-300 bg-slate-50';
  }
}

function timeNow() {
  return new Date().toLocaleTimeString();
}

// helper to parse incoming raw message into canonical item
function normalizeRaw(raw) {
  // Accept both stringified JSON or an object
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      id: obj.id ?? Math.floor(Math.random() * 1e9),
      ts: obj.ts ?? timeNow(),
      text: obj.text ?? obj.message ?? `Prediction ${Math.floor(Math.random() * 9999)}`,
      confidence: obj.confidence ?? (Math.random() * (1 - 0.2) + 0.2).toFixed(2),
      severity: obj.severity ?? randomSeverity(),
      ack: false,
    };
  } catch (e) {
    // fallback
    return {
      id: Math.floor(Math.random() * 1e9),
      ts: timeNow(),
      text: String(raw),
      confidence: (Math.random() * (1 - 0.2) + 0.2).toFixed(2),
      severity: randomSeverity(),
      ack: false,
    };
  }
}

export default function LiveConsolePage() {
  const [items, setItems] = useState([]);
  const [paused, setPaused] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [filters, setFilters] = useState({ ok: true, warn: true, crit: true, info: true });
  const [query, setQuery] = useState('');
  const [wsUrl, setWsUrl] = useState(process.env.REACT_APP_WS_URL ?? '');

  const listRef = useRef(null);
  const atBottomRef = useRef(true);
  const idRef = useRef(1);
  const wsRef = useRef(null);
  const mockIntervalRef = useRef(null);

  // derived visible items (filtered + searched)
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      if (!filters[it.severity]) return false;
      if (q === '') return true;
      return (it.text || '').toLowerCase().includes(q) || String(it.id).includes(q);
    });
  }, [items, filters, query]);

  // connect to real WebSocket if wsUrl provided
  useEffect(() => {
    // cleanup any existing
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
    setConnected(false);

    if (!wsUrl) {
      // start mock stream
      mockIntervalRef.current = setInterval(() => {
        if (paused) return;
        const raw = {
          id: idRef.current++,
          ts: timeNow(),
          text: `Prediction #${Math.floor(Math.random() * 9999)}`,
          confidence: (Math.random() * (1 - 0.2) + 0.2).toFixed(2),
          severity: randomSeverity(),
        };
        const item = normalizeRaw(raw);
        setItems(prev => {
          const next = [...prev, item].slice(-5000);
          return next;
        });
        if (!atBottomRef.current) setUnseenCount(c => c + 1);
      }, 700);

      setConnected(true); // mock = 'connected'
      return () => {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      };
    }

    // real WS connect
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };
      ws.onmessage = (ev) => {
        if (paused) return;
        const item = normalizeRaw(ev.data);
        setItems(prev => {
          const next = [...prev, item].slice(-5000);
          return next;
        });
        if (!atBottomRef.current) setUnseenCount(c => c + 1);
      };
      ws.onclose = () => {
        setConnected(false);
        // try lightweight reconnect
        setTimeout(() => {
          if (wsRef.current === ws) wsRef.current = null; // allow remount
        }, 1000);
      };
      ws.onerror = () => {
        setConnected(false);
      };
    } catch (e) {
      console.error('WS connect failed', e);
      setConnected(false);
    }

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
    };
  }, [wsUrl, paused]);

  // Auto-scroll when new items and user is at bottom
  useEffect(() => {
    if (!listRef.current) return;
    if (atBottomRef.current) {
      try {
        listRef.current.scrollToItem(visibleItems.length - 1, 'end');
        setUnseenCount(0);
      } catch (e) {}
    }
  }, [visibleItems]);

  // handle scroll to determine if user is at bottom
  const onScroll = useCallback(({ scrollOffset }) => {
    const itemSize = 84; // must match itemSize below
    const visibleHeight = 560; // must match height below
    const totalHeight = Math.max(0, visibleItems.length * itemSize);
    const bottomThreshold = 140; // px
    const maxScroll = Math.max(0, totalHeight - visibleHeight);
    const distanceFromBottom = maxScroll - scrollOffset;
    const isAtBottom = distanceFromBottom <= bottomThreshold;
    atBottomRef.current = isAtBottom;
    if (isAtBottom) setUnseenCount(0);
  }, [visibleItems.length]);

  const togglePause = () => setPaused(p => !p);
  const clearConsole = () => {
    setItems([]);
    setUnseenCount(0);
  };

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollToItem(visibleItems.length - 1, 'end');
    atBottomRef.current = true;
    setUnseenCount(0);
  };

  const toggleSeverity = (sev) => {
    setFilters(f => ({ ...f, [sev]: !f[sev] }));
  };

  const acknowledge = (id) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ack: true } : it));
  };

  const manualConnect = () => {
    // re-trigger effect by setting wsUrl to same string
    setWsUrl(s => s + '');
  };

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const item = visibleItems[index];
    if (!item) return null;
    const cls = colorForSeverity(item.severity);

    return (
      <div style={style} className="p-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`rounded-md p-3 shadow-sm ${cls} flex items-start gap-3 ${item.ack ? 'opacity-60 line-through' : ''}`}
          role="article"
          aria-label={`prediction ${item.id} severity ${item.severity}`}>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{item.text}</span>
                <span className="text-xs text-slate-500">• {item.ts}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600">Conf: {item.confidence}</div>
                <div className="text-[11px] text-slate-400">#{item.id}</div>
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-700 flex items-center justify-between">
              <div>Status: <span className="font-semibold">{item.severity}</span></div>
              <div className="flex items-center gap-2">
                {!item.ack && <button onClick={() => acknowledge(item.id)} className="text-xs px-2 py-1 rounded border">Acknowledge</button>}
                <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(item))} className="text-xs px-2 py-1 rounded border">Copy</button>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Live Console</h1>
          <div className="flex items-center gap-3">
            <div className={`text-sm px-2 py-1 rounded ${connected ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{connected ? 'Connected' : 'Disconnected'}</div>
            <button onClick={togglePause} className="px-3 py-1 rounded bg-slate-800 text-white text-sm">{paused ? 'Resume' : 'Pause'}</button>
            <button onClick={clearConsole} className="px-3 py-1 rounded border text-sm">Clear</button>
          </div>
        </header>

        <div className="relative border rounded bg-white shadow-sm">
          {/* Controls bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <input value={wsUrl} onChange={e => setWsUrl(e.target.value)} placeholder="wss://your-ws-endpoint (leave empty for mock)" className="text-sm px-3 py-2 border rounded w-96" />
              <button onClick={manualConnect} className="px-3 py-2 rounded border text-sm">Reconnect</button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">Search</label>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="search text or id" className="text-sm px-2 py-1 border rounded" />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <label className="mr-2">Filters:</label>
                <button onClick={() => toggleSeverity('ok')} className={`px-2 py-1 rounded ${filters.ok ? 'bg-green-100' : 'bg-slate-100'}`}>OK</button>
                <button onClick={() => toggleSeverity('warn')} className={`px-2 py-1 rounded ${filters.warn ? 'bg-amber-100' : 'bg-slate-100'}`}>WARN</button>
                <button onClick={() => toggleSeverity('crit')} className={`px-2 py-1 rounded ${filters.crit ? 'bg-red-100' : 'bg-slate-100'}`}>CRIT</button>
                <button onClick={() => toggleSeverity('info')} className={`px-2 py-1 rounded ${filters.info ? 'bg-slate-100' : 'bg-white'}`}>INFO</button>
              </div>

              <div className="text-xs text-slate-500">Total: {items.length} • Visible: {visibleItems.length}</div>
            </div>
          </div>

          {/* Virtualized list */}
          <div className="h-[560px]">
            <List
              height={560}
              itemCount={visibleItems.length}
              itemSize={84}
              width={'100%'}
              ref={listRef}
              onScroll={onScroll}
            >
              {Row}
            </List>
          </div>

          {/* New messages badge */}
          <AnimatePresence>
            {unseenCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={scrollToBottom}
                className="absolute right-4 bottom-4 bg-sky-600 text-white px-3 py-2 rounded shadow-md text-sm"
              >
                {unseenCount} new
              </motion.button>
            )}
          </AnimatePresence>

        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded"/> OK</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-400 rounded"/> WARN</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded"/> CRIT</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-300 rounded"/> INFO</div>
        </div>

      </div>
    </div>
  );
}