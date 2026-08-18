/**
 * UI HTML/CSS/JS Template for the Graph Utility Workbench Embed.
 * Renders a 3-pane responsive data analytics studio powered by Chart.js.
 * @param {Object} data - Context data containing note tables, metadata, and saved state.
 * @returns {string} Fully self-contained HTML document.
 */
export function buildChartHtml({
  cleanedContent = '',
  transposeContent = '',
  structuredTables = [],
  noteName = 'Graph Utility',
  noteTags = [],
  noteUUID = '',
  savedState = {}
}) {
  const safeName = escapeHTML(noteName || 'Graph Utility');
  const safeUUID = escapeHTML(noteUUID || '');
  const payloadObj = {
    noteUUID: safeUUID,
    noteName: safeName,
    noteTags: noteTags || [],
    cleanedContent: cleanedContent || '',
    transposeContent: transposeContent || '',
    structuredTables: structuredTables || [],
    savedState: savedState || {}
  };
  const encodedPayload = JSON.stringify(payloadObj).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeName} — Graph Utility</title>
  
  <!-- Premium Font: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- High-Compatibility 32x32 PNG Favicon (Native file:/// & Tab rendering on Chrome/Edge/Firefox) -->
  <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB/klEQVR4nM3XyUoDQRQFUPdunI0ZHKMxCwccMAZjcEAjDp/gRvA//Ac3btz4E7rwj9wICu6U11Wv+95+3SGETmPBhcqt4vUhZJEeGvrP6+7+8zeL9P3QkcJaJukZEzx0Zn2gSUXIwWhxI5ckIhxgM5ekAsZKW5nno/MURjsDcA/fpjy+vJqun+hygKgnhHwYL+9QBBDv+snI20MY7C2gsksJALEOg19t2h1ZBIAzA5io7FEEEO8wuLqdIwDPLWC2QQkAsU4j66t9GyZAJNwxADg3gMm5fYoA4p0mCSALz/UzAnBGAqBJcYCmiS4EYB893N1nQDTHAKbmDygCiHe6ZI+A+LnekSAAZyUAWhQHcHv5pfPwVgzg7n0/D4fRjgHRfAOYXjikCED3CNAOAdohQDsE4HwLWGxTAoDfN95/wmhHAN8RwHcEgPkJgCOKA7g9A1zHANcxwHUMiOYbQGHpmCIA3SNAOwRohwDtEIDzLaB6QgkAfk8A3xHAdwTwHQFgvgHMVE8pAtA9ArRDgHYI0A4BON8Cls8oAcDvCeA7AviOAL4jAMw3gOLyOUUAukeAdgjQDgHaIQDnW8BKhxIA/J4AviOA7wjgOwLA/MR/RaXaRRgBZB2dnfqfsFS7zCWpgPLqVS7p+m5Qrl8PND29HWkq9ZtMksl7Ym4vp3mvP1cbfZc4+/PAAAAAAElFTkSuQmCC">
  <link rel="shortcut icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB/klEQVR4nM3XyUoDQRQFUPdunI0ZHKMxCwccMAZjcEAjDp/gRvA//Ac3btz4E7rwj9wICu6U11Wv+95+3SGETmPBhcqt4vUhZJEeGvrP6+7+8zeL9P3QkcJaJukZEzx0Zn2gSUXIwWhxI5ckIhxgM5ekAsZKW5nno/MURjsDcA/fpjy+vJqun+hygKgnhHwYL+9QBBDv+snI20MY7C2gsksJALEOg19t2h1ZBIAzA5io7FEEEO8wuLqdIwDPLWC2QQkAsU4j66t9GyZAJNwxADg3gMm5fYoA4p0mCSALz/UzAnBGAqBJcYCmiS4EYB893N1nQDTHAKbmDygCiHe6ZI+A+LnekSAAZyUAWhQHcHv5pfPwVgzg7n0/D4fRjgHRfAOYXjikCED3CNAOAdohQDsE4HwLWGxTAoDfN95/wmhHAN8RwHcEgPkJgCOKA7g9A1zHANcxwHUMiOYbQGHpmCIA3SNAOwRohwDtEIDzLaB6QgkAfk8A3xHAdwTwHQFgvgHMVE8pAtA9ArRDgHYI0A4BON8Cls8oAcDvCeA7AviOAL4jAMw3gOLyOUUAukeAdgjQDgHaIQDnW8BKhxIA/J4AviOA7wjgOwLA/MR/RaXaRRgBZB2dnfqfsFS7zCWpgPLqVS7p+m5Qrl8PND29HWkq9ZtMksl7Ym4vp3mvP1cbfZc4+/PAAAAAAElFTkSuQmCC">
  <link rel="apple-touch-icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB/klEQVR4nM3XyUoDQRQFUPdunI0ZHKMxCwccMAZjcEAjDp/gRvA//Ac3btz4E7rwj9wICu6U11Wv+95+3SGETmPBhcqt4vUhZJEeGvrP6+7+8zeL9P3QkcJaJukZEzx0Zn2gSUXIwWhxI5ckIhxgM5ekAsZKW5nno/MURjsDcA/fpjy+vJqun+hygKgnhHwYL+9QBBDv+snI20MY7C2gsksJALEOg19t2h1ZBIAzA5io7FEEEO8wuLqdIwDPLWC2QQkAsU4j66t9GyZAJNwxADg3gMm5fYoA4p0mCSALz/UzAnBGAqBJcYCmiS4EYB893N1nQDTHAKbmDygCiHe6ZI+A+LnekSAAZyUAWhQHcHv5pfPwVgzg7n0/D4fRjgHRfAOYXjikCED3CNAOAdohQDsE4HwLWGxTAoDfN95/wmhHAN8RwHcEgPkJgCOKA7g9A1zHANcxwHUMiOYbQGHpmCIA3SNAOwRohwDtEIDzLaB6QgkAfk8A3xHAdwTwHQFgvgHMVE8pAtA9ArRDgHYI0A4BON8Cls8oAcDvCeA7AviOAL4jAMw3gOLyOUUAukeAdgjQDgHaIQDnW8BKhxIA/J4AviOA7wjgOwLA/MR/RaXaRRgBZB2dnfqfsFS7zCWpgPLqVS7p+m5Qrl8PND29HWkq9ZtMksl7Ym4vp3mvP1cbfZc4+/PAAAAAAElFTkSuQmCC">
  
  <!-- Chart.js CDN & Pro Plugins (Strict Sequential Loading with State Tracking) -->
  <script>
    (function() {
      var _tempModule = window.module;
      var _tempExports = window.exports;
      var _tempDefine = window.define;
      window.module = undefined;
      window.exports = undefined;
      window.define = undefined;
      window._chartScriptsState = "loading";

      function cleanupLoaderGlobals() {
        window.module = _tempModule;
        window.exports = _tempExports;
        window.define = _tempDefine;
      }

      var urls = [
        "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-zoom/2.0.1/chartjs-plugin-zoom.min.js"
      ];
      var loadedCount = 0;
      var totalScripts = urls.length;
      function loadNext() {
        if (loadedCount >= totalScripts) {
          cleanupLoaderGlobals();
          window._chartScriptsLoaded = true;
          window._chartScriptsState = "ready";
          window.dispatchEvent(new Event('chartsReady'));
          return;
        }
        if (urls.length === 0) return;
        var script = document.createElement('script');
        script.src = urls.shift();
        script.onload = function() {
          loadedCount++;
          loadNext();
        };
        script.onerror = function() {
          console.error("Failed to load: " + script.src);
          cleanupLoaderGlobals();
          window._chartScriptsState = "failed";
          window.dispatchEvent(new CustomEvent('chartsError', { detail: { failedSrc: script.src } }));
        };
        document.head.appendChild(script);
      }
      loadNext();
    })();
  </script>

  <style>
    /* ═════════════════════════════════════════════════════════════════
       1. MODERN DESIGN SYSTEM & THEME TOKENS
       ═════════════════════════════════════════════════════════════════ */
    :root, body.theme-dark {
      --bg-body: #0d1117;
      --bg-surface: #161b22;
      --bg-surface-elevated: #21262d;
      --bg-surface-glass: rgba(22, 27, 34, 0.85);
      --border-color: #30363d;
      --border-hover: #484f58;
      --text-primary: #f0f6fc;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --accent-primary: #6366f1;
      --accent-hover: #4f46e5;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --accent-badge: rgba(99, 102, 241, 0.15);
      --chart-grid: rgba(255, 255, 255, 0.06);
      --chart-text: #8b949e;
      --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.35);
      --shadow-md: 0 6px 18px rgba(0, 0, 0, 0.45);
      --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.6);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
    }

    body.theme-light {
      --bg-body: #f6f8fa;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f1f3f5;
      --bg-surface-glass: rgba(255, 255, 255, 0.88);
      --border-color: #d0d7de;
      --border-hover: #afb8c1;
      --text-primary: #1f2328;
      --text-secondary: #57606a;
      --text-muted: #8c959f;
      --accent-primary: #4f46e5;
      --accent-hover: #4338ca;
      --accent-glow: rgba(79, 70, 229, 0.25);
      --accent-badge: rgba(79, 70, 229, 0.1);
      --chart-grid: rgba(0, 0, 0, 0.06);
      --chart-text: #57606a;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
      --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);
    }

    body.theme-midnight {
      --bg-body: #050b14;
      --bg-surface: #0a1424;
      --bg-surface-elevated: #11223b;
      --bg-surface-glass: rgba(10, 20, 36, 0.88);
      --border-color: #1a3254;
      --border-hover: #264a7a;
      --text-primary: #e6f1ff;
      --text-secondary: #88a4c8;
      --text-muted: #537196;
      --accent-primary: #00d2ff;
      --accent-hover: #00b4db;
      --accent-glow: rgba(0, 210, 255, 0.4);
      --accent-badge: rgba(0, 210, 255, 0.15);
      --chart-grid: rgba(0, 210, 255, 0.08);
      --chart-text: #88a4c8;
      --shadow-sm: 0 2px 8px rgba(0, 10, 25, 0.5);
      --shadow-md: 0 6px 20px rgba(0, 15, 35, 0.6);
      --shadow-lg: 0 12px 36px rgba(0, 20, 50, 0.7);
    }

    body.theme-forest {
      --bg-body: #08140e;
      --bg-surface: #0e2219;
      --bg-surface-elevated: #173829;
      --bg-surface-glass: rgba(14, 34, 25, 0.88);
      --border-color: #1f4a36;
      --border-hover: #2c684d;
      --text-primary: #ecfdf5;
      --text-secondary: #a7f3d0;
      --text-muted: #6ee7b7;
      --accent-primary: #10b981;
      --accent-hover: #059669;
      --accent-glow: rgba(16, 185, 129, 0.4);
      --accent-badge: rgba(16, 185, 129, 0.2);
      --chart-grid: rgba(16, 185, 129, 0.08);
      --chart-text: #a7f3d0;
      --shadow-sm: 0 2px 8px rgba(0, 20, 10, 0.5);
      --shadow-md: 0 6px 20px rgba(0, 25, 15, 0.6);
      --shadow-lg: 0 12px 36px rgba(0, 30, 20, 0.7);
    }

    body.theme-cyberpunk {
      --bg-body: #0f051d;
      --bg-surface: #1b0c33;
      --bg-surface-elevated: #29144d;
      --bg-surface-glass: rgba(27, 12, 51, 0.88);
      --border-color: #4a217a;
      --border-hover: #6a30b0;
      --text-primary: #fdf4ff;
      --text-secondary: #f0abfc;
      --text-muted: #c084fc;
      --accent-primary: #f43f5e;
      --accent-hover: #fb7185;
      --accent-glow: rgba(244, 63, 94, 0.45);
      --accent-badge: rgba(244, 63, 94, 0.25);
      --chart-grid: rgba(244, 63, 94, 0.1);
      --chart-text: #f0abfc;
      --shadow-sm: 0 2px 8px rgba(20, 0, 40, 0.5);
      --shadow-md: 0 6px 20px rgba(25, 0, 50, 0.6);
      --shadow-lg: 0 12px 36px rgba(35, 0, 70, 0.7);
    }

    body.theme-dracula {
      --bg-body: #1e1f29;
      --bg-surface: #282a36;
      --bg-surface-elevated: #343746;
      --bg-surface-glass: rgba(40, 42, 54, 0.88);
      --border-color: #44475a;
      --border-hover: #6272a4;
      --text-primary: #f8f8f2;
      --text-secondary: #bd93f9;
      --text-muted: #6272a4;
      --accent-primary: #ff79c6;
      --accent-hover: #ff92d0;
      --accent-glow: rgba(255, 121, 198, 0.4);
      --accent-badge: rgba(255, 121, 198, 0.15);
      --chart-grid: rgba(189, 147, 249, 0.1);
      --chart-text: #f8f8f2;
      --shadow-sm: 0 2px 8px rgba(10, 10, 20, 0.5);
      --shadow-md: 0 6px 20px rgba(10, 10, 20, 0.6);
      --shadow-lg: 0 12px 36px rgba(10, 10, 20, 0.7);
    }

    body.theme-nord {
      --bg-body: #242933;
      --bg-surface: #2e3440;
      --bg-surface-elevated: #3b4252;
      --bg-surface-glass: rgba(46, 52, 64, 0.88);
      --border-color: #434c5e;
      --border-hover: #4c566a;
      --text-primary: #eceff4;
      --text-secondary: #d8dee9;
      --text-muted: #88c0d0;
      --accent-primary: #88c0d0;
      --accent-hover: #81a1c1;
      --accent-glow: rgba(136, 192, 208, 0.4);
      --accent-badge: rgba(136, 192, 208, 0.15);
      --chart-grid: rgba(136, 192, 208, 0.1);
      --chart-text: #d8dee9;
      --shadow-sm: 0 2px 8px rgba(15, 20, 30, 0.5);
      --shadow-md: 0 6px 20px rgba(15, 20, 30, 0.6);
      --shadow-lg: 0 12px 36px rgba(15, 20, 30, 0.7);
    }

    body.theme-tokyo-night {
      --bg-body: #16161e;
      --bg-surface: #1a1b26;
      --bg-surface-elevated: #24283b;
      --bg-surface-glass: rgba(26, 27, 38, 0.88);
      --border-color: #2f3549;
      --border-hover: #414868;
      --text-primary: #c0caf5;
      --text-secondary: #9aa5ce;
      --text-muted: #565f89;
      --accent-primary: #7aa2f7;
      --accent-hover: #bb9af7;
      --accent-glow: rgba(122, 162, 247, 0.4);
      --accent-badge: rgba(122, 162, 247, 0.15);
      --chart-grid: rgba(122, 162, 247, 0.1);
      --chart-text: #9aa5ce;
      --shadow-sm: 0 2px 8px rgba(10, 10, 15, 0.5);
      --shadow-md: 0 6px 20px rgba(10, 10, 15, 0.6);
      --shadow-lg: 0 12px 36px rgba(10, 10, 15, 0.7);
    }

    body.theme-solarized-light {
      --bg-body: #fdf6e3;
      --bg-surface: #eee8d5;
      --bg-surface-elevated: #e0d8c3;
      --bg-surface-glass: rgba(238, 232, 213, 0.88);
      --border-color: #d3cbb7;
      --border-hover: #b58900;
      --text-primary: #073642;
      --text-secondary: #586e75;
      --text-muted: #839496;
      --accent-primary: #cb4b16;
      --accent-hover: #dc322f;
      --accent-glow: rgba(203, 75, 22, 0.3);
      --accent-badge: rgba(203, 75, 22, 0.12);
      --chart-grid: rgba(7, 54, 66, 0.08);
      --chart-text: #586e75;
      --shadow-sm: 0 1px 4px rgba(7, 54, 66, 0.08);
      --shadow-md: 0 4px 14px rgba(7, 54, 66, 0.12);
      --shadow-lg: 0 8px 24px rgba(7, 54, 66, 0.16);
    }

    body.theme-monokai {
      --bg-body: #1e1f1c;
      --bg-surface: #272822;
      --bg-surface-elevated: #3e3d32;
      --bg-surface-glass: rgba(39, 40, 34, 0.88);
      --border-color: #49483e;
      --border-hover: #75715e;
      --text-primary: #f8f8f2;
      --text-secondary: #a6e22e;
      --text-muted: #75715e;
      --accent-primary: #f92672;
      --accent-hover: #e6db74;
      --accent-glow: rgba(249, 38, 114, 0.4);
      --accent-badge: rgba(249, 38, 114, 0.18);
      --chart-grid: rgba(248, 248, 242, 0.08);
      --chart-text: #a6e22e;
      --shadow-sm: 0 2px 8px rgba(10, 10, 10, 0.5);
      --shadow-md: 0 6px 20px rgba(10, 10, 10, 0.6);
      --shadow-lg: 0 12px 36px rgba(10, 10, 10, 0.7);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      height: 100%;
      width: 100%;
      background-color: var(--bg-body) !important;
      color: var(--text-primary) !important;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ═════════════════════════════════════════════════════════════════
       2. WORKBENCH SHELL & RESPONSIVE PANELS
       ═════════════════════════════════════════════════════════════════ */
    .app-shell {
      display: flex;
      flex: 1;
      height: 100vh;
      width: 100vw;
      position: relative;
      overflow: hidden;
      background-color: var(--bg-body);
    }

    .panel {
      background-color: var(--bg-surface);
      border-color: var(--border-color);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s ease;
      z-index: 20;
      position: relative;
      flex-shrink: 0;
      backdrop-filter: blur(12px);
    }

    .panel-left {
      width: 320px;
      border-right: 1px solid var(--border-color);
    }

    .panel-right {
      width: 320px;
      border-left: 1px solid var(--border-color);
    }

    .panel.collapsed {
      width: 0 !important;
      padding: 0 !important;
      border: none !important;
      overflow: hidden;
    }

    .panel-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background-color: var(--bg-surface);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .panel-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ═════════════════════════════════════════════════════════════════
       3. VIEWPORT & CHART STUDIO CANVAS
       ═════════════════════════════════════════════════════════════════ */
    .viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: radial-gradient(circle at 50% 30%, var(--bg-surface-elevated) 0%, var(--bg-body) 85%);
      position: relative;
    }

    .toolbar {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-surface-glass);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 15;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-stats {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }

    .stat-chip strong {
      color: var(--text-primary);
    }

    .chart-container {
      flex: 1;
      padding: 24px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .canvas-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      background-color: var(--bg-surface-glass);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(14px);
    }

    .canvas-toolbar {
      position: absolute;
      top: 14px;
      right: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10;
    }

    .canvas-toolbar-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }

    .canvas-toolbar-btn:hover {
      color: var(--text-primary);
      border-color: var(--accent-primary);
      background: var(--accent-badge);
    }

    /* ═════════════════════════════════════════════════════════════════
       4. FORMS, BUTTONS, DROPDOWNS & CONTROLS
       ═════════════════════════════════════════════════════════════════ */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .select, .input {
      width: 100%;
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: var(--radius-md);
      font-size: 12px;
      outline: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }

    .select:hover, .input:hover {
      border-color: var(--border-hover);
    }

    .select:focus, .input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border-color);
      background-color: var(--bg-surface-elevated);
      color: var(--text-primary);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      text-decoration: none;
    }

    .btn:hover {
      background-color: var(--border-color);
      border-color: var(--border-hover);
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      background-color: var(--accent-primary);
      border-color: var(--accent-primary);
      color: #ffffff !important;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    .btn-primary:hover {
      background-color: var(--accent-hover);
      border-color: var(--accent-hover);
      box-shadow: 0 4px 14px var(--accent-glow);
    }

    .btn-icon {
      padding: 6px 8px;
    }

    /* Toggle Switch */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 38px;
      height: 20px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      transition: .2s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: var(--text-secondary);
      transition: .2s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--accent-primary);
      border-color: var(--accent-primary);
    }

    input:checked + .slider:before {
      transform: translateX(18px);
      background-color: #ffffff;
    }

    /* Series Checkbox List */
    .series-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .series-list::-webkit-scrollbar {
      width: 4px;
    }
    .series-list::-webkit-scrollbar-track {
      background: transparent;
    }
    .series-list::-webkit-scrollbar-thumb {
      background-color: var(--border-hover);
      border-radius: 4px;
    }
    .series-list::-webkit-scrollbar-thumb:hover {
      background-color: var(--accent-primary);
    }

    .series-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .series-item:hover {
      border-color: var(--accent-primary);
    }

    .series-item input[type="checkbox"] {
      accent-color: var(--accent-primary);
      cursor: pointer;
    }

    .series-color-swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    /* ═════════════════════════════════════════════════════════════════
       5. COMPREHENSIVE EXPORT DROPDOWN MENU
       ═════════════════════════════════════════════════════════════════ */
    .dropdown-container {
      position: relative;
      display: inline-block;
    }

    .export-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 340px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 10px;
      display: none;
      flex-direction: column;
      gap: 6px;
      z-index: 100;
      backdrop-filter: blur(16px);
      animation: menuFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes menuFadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .export-menu.show {
      display: flex;
    }

    .export-dropdown-header {
      padding: 6px 8px 4px 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-secondary);
    }

    .export-menu-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-primary);
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 12px;
      width: 100%;
    }

    .export-menu-item:hover {
      background-color: var(--bg-surface-elevated);
      border-color: var(--border-color);
    }

    .export-menu-item.featured {
      background-color: var(--accent-badge);
      border-color: var(--accent-primary);
    }

    .export-menu-item.featured:hover {
      background-color: var(--accent-glow);
    }

    .export-item-icon {
      font-size: 16px;
      line-height: 1.2;
      flex-shrink: 0;
    }

    .export-item-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .export-item-title {
      font-weight: 600;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .badge-rec {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      background-color: var(--accent-primary);
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .export-item-desc {
      font-size: 10.5px;
      color: var(--text-secondary);
      line-height: 1.35;
    }

    .export-dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 4px 0;
    }

    /* Note Info Card */
    .note-info-box {
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .note-title-text {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .note-tag-chip {
      font-size: 10.5px;
      font-weight: 600;
      background-color: var(--accent-badge);
      color: var(--accent-primary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--accent-primary);
      color: var(--text-primary);
      box-shadow: var(--shadow-lg);
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Mobile / Tablet Responsiveness */
    @media (max-width: 900px) {
      .panel-left, .panel-right {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 50;
        box-shadow: var(--shadow-lg);
      }
      .panel-left { left: 0; }
      .panel-right { right: 0; }
    }
  </style>
</head>
<body class="theme-dark">
  <div class="app-shell">
    
    <!-- ═══════════════════════════════════════════════════════════════
         LEFT SIDEBAR: Source Note, Table Picker & Chart Type Selector
         ═══════════════════════════════════════════════════════════════ -->
    <aside id="leftPanel" class="panel panel-left">
      <div class="panel-header">
        <div class="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Data & Chart
        </div>
        <button id="closeLeftPanelBtn" class="btn btn-icon" title="Collapse Panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- Note Context Box -->
        <div class="note-info-box">
          <div class="note-title-text" id="noteNameDisplay">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${safeName}</span>
          </div>
          <div id="noteTagsContainer" style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${(noteTags || []).map(t => `<span class="note-tag-chip">#${escapeHTML(t)}</span>`).join('')}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button id="switchNoteBtn" class="btn btn-primary btn-icon" style="flex: 1;" title="Change source note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Switch Note
            </button>
            <button id="openNoteBtn" class="btn btn-icon" title="Open Note in Amplenote">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button id="refreshDataBtn" class="btn btn-icon" title="Refresh Table Data">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>

        <!-- Table Selector -->
        <div class="form-group">
          <label class="form-label" for="tableSelector">Select Table</label>
          <select id="tableSelector" class="select"></select>
        </div>

        <!-- Chart Type Dropdown (Simple + Advanced) -->
        <div class="form-group">
          <label class="form-label" for="chartTypeSelect">Chart Type</label>
          <select id="chartTypeSelect" class="select">
            <optgroup label="Simple Charts">
              <option value="line">📈 Line Chart</option>
              <option value="area">🌊 Area Chart</option>
              <option value="bar">📊 Bar Chart</option>
              <option value="histogram">📶 Histogram</option>
              <option value="pie">🥧 Pie Chart</option>
              <option value="doughnut">🍩 Doughnut Chart</option>
              <option value="polarArea">❄️ Polar Area Chart</option>
              <option value="waterfall">🔽 Waterfall Chart</option>
            </optgroup>
            <optgroup label="Advanced Charts">
              <option value="mixed">🔀 Mixed Chart (Bar + Line)</option>
              <option value="pareto">📉 Pareto Chart (80/20)</option>
              <option value="scatter">✨ Scatter Plot</option>
              <option value="bubble">🔵 Bubble Chart</option>
              <option value="radar">🕸️ Radar Chart</option>
            </optgroup>
          </select>
        </div>

        <!-- Transpose Switch -->
        <label class="toggle-row">
          <span>Transpose (Rows ⇄ Cols)</span>
          <div class="switch">
            <input type="checkbox" id="transposeToggle">
            <span class="slider"></span>
          </div>
        </label>

        <!-- Summary & Stats -->
        <div class="form-group">
          <span class="form-label">Table Summary</span>
          <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.6;" id="tableSummaryInfo">
            Select a table to plot.
          </div>
        </div>
      </div>
    </aside>

    <!-- ═══════════════════════════════════════════════════════════════
         CENTER VIEWPORT: Top Toolbar + Glass Canvas Studio
         ═══════════════════════════════════════════════════════════════ -->
    <main class="viewport">
      
      <!-- Top Toolbar -->
      <header class="toolbar">
        <div class="toolbar-left">
          <button id="toggleLeftPanelBtn" class="btn btn-icon" title="Toggle Data Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          
          <div class="toolbar-stats">
            <div class="stat-chip" id="chipRows"><strong>0</strong> Rows</div>
            <div class="stat-chip" id="chipCols"><strong>0</strong> Cols</div>
            <div class="stat-chip" id="chipSeries"><strong>0</strong> Series</div>
          </div>
        </div>

        <div class="toolbar-right">
          <!-- Theme Cycle Button -->
          <button id="themeToggleBtn" class="btn" title="Cycle Theme (Dark, Light, Midnight, Forest, Cyberpunk)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <span id="themeNameLabel">Dark</span>
          </button>

          <!-- Export Dropdown -->
          <div class="dropdown-container">
            <button id="exportDropdownBtn" class="btn btn-primary" title="Export Options">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <div id="exportMenu" class="export-menu">
              <div class="export-dropdown-header">
                Select the format that you want to download / copy in!
              </div>

              <!-- Main Formats -->
              <button id="downloadInteractiveHtmlBtn" class="export-menu-item featured">
                <span class="export-item-icon">✨</span>
                <div class="export-item-text">
                  <div class="export-item-title">
                    Download - Interactive Charts
                    <span class="badge-rec">Recommended</span>
                  </div>
                  <div class="export-item-desc">Self-contained offline studio with Chart.js & data</div>
                </div>
              </button>

              <button id="downloadAllTablesMDBtn" class="export-menu-item">
                <span class="export-item-icon">📝</span>
                <div class="export-item-text">
                  <div class="export-item-title">Download all Tables - MD</div>
                  <div class="export-item-desc">Clean markdown tables document (.md)</div>
                </div>
              </button>

              <button id="downloadAllTablesCSVBtn" class="export-menu-item">
                <span class="export-item-icon">📊</span>
                <div class="export-item-text">
                  <div class="export-item-title">Download all Tables - CSV</div>
                  <div class="export-item-desc">Structured comma-separated data table (.csv)</div>
                </div>
              </button>

              <button id="copyAllTablesToNewNoteBtn" class="export-menu-item">
                <span class="export-item-icon">📋</span>
                <div class="export-item-text">
                  <div class="export-item-title">Copy all Tables to a new Note</div>
                  <div class="export-item-desc">Creates a new note with all tables in Amplenote</div>
                </div>
              </button>

              <div class="export-dropdown-divider"></div>

              <!-- Image & Note Actions -->
              <button id="saveImageToNoteBtn" class="export-menu-item">
                <span class="export-item-icon">📌</span>
                <div class="export-item-text">
                  <div class="export-item-title">Save Image Above Table in Note</div>
                  <div class="export-item-desc">Embeds high-res snapshot into source note</div>
                </div>
              </button>

              <button id="copyImageClipboardBtn" class="export-menu-item">
                <span class="export-item-icon">📎</span>
                <div class="export-item-text">
                  <div class="export-item-title">Copy Chart Image to Clipboard</div>
                </div>
              </button>

              <button id="downloadPngBtn" class="export-menu-item">
                <span class="export-item-icon">🖼️</span>
                <div class="export-item-text">
                  <div class="export-item-title">Download Chart as PNG</div>
                </div>
              </button>
            </div>
          </div>

          <button id="toggleRightPanelBtn" class="btn btn-icon" title="Toggle Configuration Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </header>

      <!-- Center Chart Canvas -->
      <div class="chart-container">
        <div class="canvas-wrapper">
          <div class="canvas-toolbar">
            <button id="replayAnimationBtn" class="canvas-toolbar-btn" title="Replay Animation">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Replay
            </button>
          </div>
          <canvas id="mainChart"></canvas>
        </div>
      </div>
    </main>

    <!-- ═══════════════════════════════════════════════════════════════
         RIGHT SIDEBAR: Axes Mapping, Easing, Palette & Visual Options
         ═══════════════════════════════════════════════════════════════ -->
    <aside id="rightPanel" class="panel panel-right">
      <div class="panel-header">
        <div class="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Series & Mapping
        </div>
        <button id="closeRightPanelBtn" class="btn btn-icon" title="Collapse Panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- X-Axis (Labels) -->
        <div class="form-group">
          <div class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <label for="xAxisSelect">X-Axis (Labels)</label>
            <button id="clearXAxisBtn" class="btn btn-icon" style="font-size: 10px; padding: 2px 6px;" title="Remove column from X (use Auto Row Index)">
              Remove from X
            </button>
          </div>
          <select id="xAxisSelect" class="select"></select>
        </div>

        <!-- Y-Axes Multi-Series Selection -->
        <div class="form-group">
          <div class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Y-Axis Series</span>
            <button id="selectAllSeriesBtn" class="btn btn-icon" style="font-size: 10px; padding: 2px 6px;">
              Select All
            </button>
          </div>
          <div id="ySeriesContainer" class="series-list"></div>
        </div>

        <!-- Color Palette Preset -->
        <div class="form-group">
          <label class="form-label" for="paletteSelect">Color Palette</label>
          <select id="paletteSelect" class="select">
            <option value="modern">Vibrant & Modern</option>
            <option value="oceanic">Oceanic Blues & Teals</option>
            <option value="aurora">Cosmic Aurora Glow</option>
            <option value="neon">Cyberpunk Neon</option>
            <option value="emerald">Emerald Nature</option>
            <option value="sunset">Sunset Gradient</option>
            <option value="autumn">Autumn Amber & Copper</option>
            <option value="vintage">Retro 80s Vintage</option>
            <option value="candy">Candy Berry Pop</option>
            <option value="pastel">Soft Pastel</option>
            <option value="monochrome">Monochrome Slate</option>
          </select>
        </div>

        <!-- Animation Easing Selector -->
        <div class="form-group">
          <label class="form-label" for="easingSelect">Animation Easing</label>
          <select id="easingSelect" class="select">
            <option value="easeInOutQuart">Smooth Quartic (Default)</option>
            <option value="easeOutBounce">Playful Bounce</option>
            <option value="easeOutElastic">Spring Elastic</option>
            <option value="easeInOutCubic">Dynamic Cubic</option>
            <option value="easeOutBack">Snappy Overshoot</option>
            <option value="linear">Linear Uniform</option>
            <option value="easeInOutSine">Gentle Sine Wave</option>
          </select>
        </div>

        <!-- Legend Position Selector -->
        <div class="form-group" style="margin-top: 15px;">
          <label class="form-label" for="legendPosSelect">Legend Position</label>
          <select id="legendPosSelect" class="select">
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        <!-- Visual Display Options -->
        <div class="form-group" style="margin-top: 20px;">
          <span class="form-label">Display Options</span>
          <label class="toggle-row">
            <span>Show Data Labels</span>
            <div class="switch">
              <input type="checkbox" id="showDataLabelsToggle">
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Smooth Curves</span>
            <div class="switch">
              <input type="checkbox" id="smoothCurvesToggle" checked>
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Fill Area</span>
            <div class="switch">
              <input type="checkbox" id="fillAreaToggle">
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Show Grid Lines</span>
            <div class="switch">
              <input type="checkbox" id="showGridToggle" checked>
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Show Legend</span>
            <div class="switch">
              <input type="checkbox" id="showLegendToggle" checked>
              <span class="slider"></span>
            </div>
          </label>
        </div>
        
        <div class="form-group" style="margin-top: 20px; font-size: 11px; color: var(--text-muted); text-align: center; font-style: italic;">
          💡 Tip: Use mouse wheel to zoom. Drag to pan.
        </div>
      </div>
    </aside>
  </div>

  <!-- Global Toast Notification -->
  <div id="toast" class="toast">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    <span id="toastMessage">Action completed!</span>
  </div>

  <!-- CRASH-PROOF CLIENT SCRIPT -->
  <script type="application/json" id="plugin-payload">
    ${encodedPayload}
  </script>
  <script>
    (function() {
      // Safely deserialize injected payload
      let PAYLOAD = {};
      try {
        PAYLOAD = JSON.parse(document.getElementById('plugin-payload').textContent);
      } catch (err) {
        console.error("[GraphUtility] Payload decode error:", err);
      }

      let currentNoteUUID = PAYLOAD.noteUUID || "";
      let currentNoteName = PAYLOAD.noteName || "Graph Utility";
      let cleanedMarkdown = PAYLOAD.cleanedContent || "";
      let transposedMarkdown = PAYLOAD.transposeContent || "";
      let initialTables = PAYLOAD.structuredTables || [];
      let initialSavedState = PAYLOAD.savedState || {};

      // Theme Cycle List (10 Distinct Themes)
      const THEMES = [
        'dark',
        'light',
        'midnight',
        'forest',
        'cyberpunk',
        'dracula',
        'nord',
        'tokyo-night',
        'solarized-light',
        'monokai'
      ];
      let currentThemeIndex = 0;

      // Curated Color Palettes (11 Rich Presets)
      const PALETTES = {
        modern: ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'],
        oceanic: ['#0077b6', '#00b4d8', '#90e0ef', '#03045e', '#0096c7', '#48cae4', '#ade8f4', '#caf0f8'],
        aurora: ['#7928ca', '#ff0080', '#00dfd8', '#79ffe1', '#f81ce5', '#50e3c2', '#ff4081', '#7c4dff'],
        neon: ['#f43f5e', '#00f5d4', '#fee440', '#7b2cbf', '#ff007f', '#00bbfa', '#f72585', '#4cc9f0'],
        emerald: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#047857', '#065f46', '#a7f3d0', '#022c22'],
        sunset: ['#f97316', '#ef4444', '#e11d48', '#be123c', '#fb923c', '#f87171', '#fda4af', '#f43f5e'],
        autumn: ['#d97706', '#b45309', '#ea580c', '#c2410c', '#f59e0b', '#dc2626', '#eab308', '#9a3412'],
        vintage: ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#f3722c', '#577590', '#43aa8b'],
        candy: ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b', '#06d6a0', '#118ab2', '#e63946'],
        pastel: ['#93c5fd', '#a7f3d0', '#fde68a', '#fbcfe8', '#c4b5fd', '#bae6fd', '#fed7aa', '#ddd6fe'],
        monochrome: ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#e2e8f0']
      };

      // App Workbench State (Restored & Persisted)
      let state = {
        noteUUID: currentNoteUUID,
        noteName: currentNoteName,
        activeTableIndex: 0,
        isTransposed: false,
        chartType: 'line',
        selectedXIndex: 0,
        selectedYIndices: [],
        theme: 'dark',
        palette: 'modern',
        easing: 'easeInOutQuart',
        smoothCurves: true,
        fillArea: false,
        showGrid: true,
        showLegend: true,
        showDataLabels: false,
        legendPos: 'top',
        leftPanelCollapsed: false,
        rightPanelCollapsed: false
      };

      let chartInstance = null;
      let parsedTables = [];
      let saveTimeout = null;

      let _pluginsRegistered = false;
      // Register Chart.js Plugins globally if available
      function registerPlugins() {
        if (typeof Chart === 'undefined' || _pluginsRegistered) return;
        try {
          if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
          else if (typeof window.ChartDataLabels !== 'undefined') Chart.register(window.ChartDataLabels);
        } catch(e){}
        try {
          if (typeof zoomPlugin !== 'undefined') Chart.register(zoomPlugin);
          else if (typeof window.zoomPlugin !== 'undefined') Chart.register(window.zoomPlugin);
          else if (typeof window.ChartZoom !== 'undefined') Chart.register(window.ChartZoom);
        } catch(e){}
        _pluginsRegistered = true;
      }

      // Toast notification helper
      function showToast(message) {
        const toast = document.getElementById('toast');
        const text = document.getElementById('toastMessage');
        if (!toast || !text) return;
        text.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
      }

      // Dual-Layer State Persistence: LocalStorage + Amplenote Settings Bridge (Per-Note Scoped)
      function persistState() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          try {
            const snapshot = JSON.parse(JSON.stringify(state));
            let localStore = {};
            try {
              const raw = localStorage.getItem('amplenote_graph_utility_state_v2');
              if (raw) localStore = JSON.parse(raw);
            } catch {}

            if (currentNoteUUID) {
              localStore[currentNoteUUID] = snapshot;
            }
            localStore.activeNoteUUID = currentNoteUUID;
            localStorage.setItem('amplenote_graph_utility_state_v2', JSON.stringify(localStore));

            if (window.callAmplenotePlugin) {
              window.callAmplenotePlugin('saveState', snapshot).catch((err) => {
                console.warn('[GraphUtility] saveState warning:', err);
              });
            }
          } catch (e) {
            console.error('[GraphUtility] Failed to persist state:', e);
          }
        }, 300);
      }

      // Hydrate state from saved options
      function loadPersistedState() {
        try {
          let source = null;
          if (initialSavedState && Object.keys(initialSavedState).length > 0) {
            source = initialSavedState;
          } else {
            const raw = localStorage.getItem('amplenote_graph_utility_state_v2') || localStorage.getItem('amplenote_graph_utility_state');
            if (raw) {
              const store = JSON.parse(raw);
              if (store && currentNoteUUID && store[currentNoteUUID]) {
                source = store[currentNoteUUID];
              } else if (store && store.notes && currentNoteUUID && store.notes[currentNoteUUID]) {
                source = store.notes[currentNoteUUID];
              } else {
                source = store;
              }
            }
          }

          if (source) {
            if (source.theme && THEMES.includes(source.theme)) state.theme = source.theme;
            if (source.chartType) state.chartType = source.chartType;
            if (typeof source.isTransposed === 'boolean') state.isTransposed = source.isTransposed;
            if (source.palette && PALETTES[source.palette]) state.palette = source.palette;
            if (source.easing) state.easing = source.easing;
            if (typeof source.smoothCurves === 'boolean') state.smoothCurves = source.smoothCurves;
            if (typeof source.fillArea === 'boolean') state.fillArea = source.fillArea;
            if (typeof source.showGrid === 'boolean') state.showGrid = source.showGrid;
            if (typeof source.showLegend === 'boolean') state.showLegend = source.showLegend;
            if (typeof source.showDataLabels === 'boolean') state.showDataLabels = source.showDataLabels;
            if (source.legendPos) state.legendPos = source.legendPos;
            if (typeof source.activeTableIndex === 'number') state.activeTableIndex = source.activeTableIndex;
            if (typeof source.selectedXIndex === 'number') state.selectedXIndex = source.selectedXIndex;
            if (Array.isArray(source.selectedYIndices)) state.selectedYIndices = source.selectedYIndices;
            if (typeof source.leftPanelCollapsed === 'boolean') state.leftPanelCollapsed = source.leftPanelCollapsed;
            if (typeof source.rightPanelCollapsed === 'boolean') state.rightPanelCollapsed = source.rightPanelCollapsed;
          }
        } catch (e) {
          console.warn('[GraphUtility] Error hydrating state:', e);
        }
      }

      // Apply active Theme
      function applyTheme(themeName) {
        state.theme = themeName || 'dark';
        document.body.className = 'theme-' + state.theme;
        document.documentElement.setAttribute('data-theme', state.theme);
        const label = document.getElementById('themeNameLabel');
        if (label) {
          label.textContent = state.theme.charAt(0).toUpperCase() + state.theme.slice(1);
        }
        currentThemeIndex = THEMES.indexOf(state.theme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;
        if (chartInstance) renderChart();
        persistState();
      }

      function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        applyTheme(THEMES[currentThemeIndex]);
        showToast('Theme: ' + THEMES[currentThemeIndex].toUpperCase());
      }

      // Parse and extract table data from active content
      // Pure structured table transpose helper
      function transposeTableObj(tbl) {
        if (!tbl || !tbl.headers) return tbl;
        const originalMatrix = [
          tbl.headers,
          ...(tbl.dataRows || [])
        ];
        const maxCols = Math.max(...originalMatrix.map(r => (Array.isArray(r) ? r.length : 0)));
        if (maxCols === 0) return tbl;

        const result = [];
        for (let col = 0; col < maxCols; col++) {
          const newRow = [];
          for (let row = 0; row < originalMatrix.length; row++) {
            const cell = (originalMatrix[row] && originalMatrix[row][col] !== undefined) ? originalMatrix[row][col] : '';
            newRow.push(cell);
          }
          result.push(newRow);
        }

        const cleanH = (raw, idx) => {
          const cleaned = (raw || '').replace(/<!--[\\s\\S]*?-->/g, '').trim();
          return (!cleaned || /^[\\s:-]+$/.test(cleaned)) ? ('Column ' + (idx + 1)) : cleaned;
        };

        const rawNewHeaders = result[0];
        const newHeaders = rawNewHeaders.map(cleanH);
        const newDataRows = result.slice(1);
        const baseName = tbl.baseName || tbl.heading || ('Table ' + (tbl.index || 1));
        const displayName = baseName + ' (Transposed: ' + newHeaders.length + ' cols × ' + newDataRows.length + ' rows)';

        const colCount = newHeaders.length;
        const headerLine = '| ' + newHeaders.join(' | ') + ' |';
        const delimLine = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
        const dataLines = newDataRows.map(row => '| ' + row.map(c => (c !== undefined && c !== null ? c : '')).join(' | ') + ' |');
        const rawTableMarkdown = [headerLine, delimLine, ...dataLines].join(String.fromCharCode(10));

        return {
          id: (tbl.id || 'table') + '-transposed',
          index: tbl.index || 1,
          heading: tbl.heading ? (tbl.heading + ' (Transposed)') : 'Transposed Table',
          noteName: tbl.noteName || '',
          baseName: baseName + ' (Transposed)',
          displayName: displayName,
          headers: newHeaders,
          dataRows: newDataRows,
          rowCount: newDataRows.length,
          columnCount: newHeaders.length,
          rawTableMarkdown: rawTableMarkdown,
          isTransposed: true
        };
      }

      // Parse and extract table data from active content
      function parseTables() {
        const raw = state.isTransposed ? (transposedMarkdown || cleanedMarkdown) : cleanedMarkdown;
        let baseTables = [];
        if (initialTables && initialTables.length > 0) {
          baseTables = initialTables;
        } else {
          baseTables = parseMarkdownTablesLocally(cleanedMarkdown || raw);
        }

        if (state.isTransposed) {
          parsedTables = baseTables.map(transposeTableObj);
        } else {
          parsedTables = baseTables;
        }

        const selector = document.getElementById('tableSelector');
        if (!selector) return;
        selector.innerHTML = '';

        if (parsedTables.length === 0) {
          selector.innerHTML = '<option value="-1">No tables found</option>';
          document.getElementById('tableSummaryInfo').textContent = 'No markdown tables found.';
          if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
          return;
        }

        parsedTables.forEach((tbl, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = tbl.displayName || tbl.baseName || ('Table ' + (idx + 1));
          if (idx === state.activeTableIndex) opt.selected = true;
          selector.appendChild(opt);
        });

        if (state.activeTableIndex >= parsedTables.length) {
          state.activeTableIndex = 0;
        }

        updateTableMappingControls();
      }

      // Robust client-side markdown table parser fallback
      function parseMarkdownTablesLocally(content) {
        if (!content) return [];
        // Split strictly on standalone '---' lines (not table rows |---|)
        const sections = (content || '').split(/(?:^|\\n)\\s*---+\\s*(?:\\n|$)/);
        const list = [];
        let count = 0;

        sections.forEach(sec => {
          const lines = sec.trim().split(String.fromCharCode(10)).map(l => (l.endsWith(String.fromCharCode(13)) ? l.slice(0, -1) : l));
          let heading = '';
          const tableRows = [];

          lines.forEach(l => {
            const tr = l.trim();
            if (tr.startsWith('#')) {
              heading = tr.replace(/^#+\s*/, '');
            } else if (tr.startsWith('|')) {
              tableRows.push(tr);
            }
          });

          if (tableRows.length > 0) {
            count++;
            const parseRow = r => {
              const trimmed = r.trim().replace(/^\|/, '').replace(/\|$/, '');
              const cells = [];
              let current = '';
              let escaped = false;
              for (let i = 0; i < trimmed.length; i++) {
                const char = trimmed[i];
                if (escaped) {
                  current += char;
                  escaped = false;
                } else if (char === String.fromCharCode(92)) {
                  escaped = true;
                } else if (char === '|') {
                  cells.push(current.replace(/<!--[\s\S]*?-->/g, '').trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              cells.push(current.replace(/<!--[\s\S]*?-->/g, '').trim());
              return cells;
            };

            const parsedRows = tableRows.map(parseRow).filter(row => row.some(c => c !== ''));
            if (parsedRows.length === 0) return;

            // Skip delimiter / placeholder rows
            const isDelim = r => r.every(c => !c || /^[\s:-]*$/.test(c));
            let headerIdx = 0;
            while (headerIdx < parsedRows.length && isDelim(parsedRows[headerIdx])) {
              headerIdx++;
            }
            if (headerIdx >= parsedRows.length) return;

            const rawHeaders = parsedRows[headerIdx];
            const cleanH = (raw, idx) => {
              const cleaned = (raw || '').trim().replace(/<!--[\s\S]*?-->/g, '').replace(/[*_~=]/g, '').replaceAll(String.fromCharCode(96), '');
              return (!cleaned || /^[\s:-]+$/.test(cleaned)) ? ('Column ' + (idx + 1)) : cleaned;
            };
            const headers = rawHeaders.map(cleanH);

            let dataStart = headerIdx + 1;
            if (dataStart < parsedRows.length && isDelim(parsedRows[dataStart])) {
              dataStart++;
            }

            const dataRows = [];
            for (let i = dataStart; i < parsedRows.length; i++) {
              const row = parsedRows[i];
              if (!isDelim(row) && row.some(c => c !== '')) {
                dataRows.push(headers.map((_, colIdx) => (row[colIdx] !== undefined ? row[colIdx] : '')));
              }
            }

            const baseName = heading ? heading : ('Table ' + count);
            list.push({
              id: 'table-' + count,
              index: count,
              heading: heading,
              displayName: baseName + ' (' + headers.length + ' cols × ' + dataRows.length + ' rows)',
              headers: headers,
              dataRows: dataRows,
              rowCount: dataRows.length,
              columnCount: headers.length,
              rawTableMarkdown: tableRows.join(String.fromCharCode(10))
            });
          }
        });
        return list;
      }

      // Update axes selectors and multi-series checkboxes
      function updateTableMappingControls() {
        const currentTable = parsedTables[state.activeTableIndex];
        const xSelect = document.getElementById('xAxisSelect');
        const yContainer = document.getElementById('ySeriesContainer');
        const summary = document.getElementById('tableSummaryInfo');

        if (!currentTable) {
          if (xSelect) xSelect.innerHTML = '<option value="-1">None</option>';
          if (yContainer) yContainer.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">No data</span>';
          return;
        }

        if (summary) {
          summary.innerHTML = '<strong>' + currentTable.columnCount + '</strong> Cols &nbsp;•&nbsp; <strong>' + currentTable.rowCount + '</strong> Rows';
        }

        document.getElementById('chipRows').innerHTML = '<strong>' + currentTable.rowCount + '</strong> Rows';
        document.getElementById('chipCols').innerHTML = '<strong>' + currentTable.columnCount + '</strong> Cols';

        // Bounds check X-Axis and Y-Axes
        if (state.selectedXIndex !== -1 && state.selectedXIndex >= currentTable.headers.length) {
          state.selectedXIndex = 0;
        }
        if (state.selectedYIndices && state.selectedYIndices.length > 0) {
          state.selectedYIndices = state.selectedYIndices.filter(idx => idx < currentTable.headers.length);
        }

        // Update Remove from X button state
        const clearXBtn = document.getElementById('clearXAxisBtn');
        if (clearXBtn) {
          if (state.selectedXIndex === -1) {
            clearXBtn.textContent = 'Auto Index (No X)';
            clearXBtn.style.opacity = '0.6';
          } else {
            clearXBtn.textContent = 'Remove from X';
            clearXBtn.style.opacity = '1';
          }
        }

        // X-Axis dropdown (Supports Auto / None for pure numerical datasets)
        if (xSelect) {
          xSelect.innerHTML = '';
          const autoOpt = document.createElement('option');
          autoOpt.value = -1;
          autoOpt.textContent = 'Auto / Row Index (1, 2, 3...)';
          if (state.selectedXIndex === -1) autoOpt.selected = true;
          xSelect.appendChild(autoOpt);

          currentTable.headers.forEach((h, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = (h || ('Col ' + (idx + 1)));
            if (idx === state.selectedXIndex) opt.selected = true;
            xSelect.appendChild(opt);
          });
        }

        // Y-Axes series checkbox list
        if (yContainer) {
          yContainer.innerHTML = '';
          const palette = PALETTES[state.palette] || PALETTES.modern;

          const availableIndices = currentTable.headers
            .map((_, idx) => idx)
            .filter(idx => idx !== state.selectedXIndex);

          // Find columns that have numeric data
          const numericIndices = availableIndices.filter(colIdx => {
            return currentTable.dataRows.some(row => parseNumericCell(row[colIdx]) !== null);
          });

          if (!state.selectedYIndices || state.selectedYIndices.length === 0) {
            state.selectedYIndices = numericIndices.length > 0 ? numericIndices : (availableIndices.length > 0 ? availableIndices : [0]);
          }

          // Update Select All / Select #1 button text
          const selectAllBtn = document.getElementById('selectAllSeriesBtn');
          if (selectAllBtn) {
            const isAll = availableIndices.length > 0 &&
              availableIndices.every(idx => state.selectedYIndices.includes(idx));
            selectAllBtn.textContent = (isAll && availableIndices.length > 1) ? 'Select #1' : 'Select All';
          }

          currentTable.headers.forEach((h, idx) => {
            if (idx === state.selectedXIndex && state.selectedXIndex !== -1) return;

            const item = document.createElement('label');
            item.className = 'series-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = idx;
            checkbox.checked = state.selectedYIndices.includes(idx);

            const swatch = document.createElement('span');
            swatch.className = 'series-color-swatch';
            const color = palette[idx % palette.length];
            swatch.style.backgroundColor = color;

            const text = document.createElement('span');
            text.textContent = h || ('Series ' + (idx + 1));

            checkbox.addEventListener('change', () => {
              const selected = [];
              yContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                selected.push(parseInt(cb.value, 10));
              });
              state.selectedYIndices = selected;
              if (selectAllBtn) {
                const isAll = availableIndices.length > 0 &&
                  availableIndices.every(idx => state.selectedYIndices.includes(idx));
                selectAllBtn.textContent = (isAll && availableIndices.length > 1) ? 'Select #1' : 'Select All';
              }
              renderChart();
              persistState();
            });

            item.appendChild(checkbox);
            item.appendChild(swatch);
            item.appendChild(text);
            yContainer.appendChild(item);
          });
        }

        renderChart();
      }

      /**
       * Comprehensive numeric cell parser.
       * Handles accounting negatives (1,234.50) -> -1234.50, currencies, metric multipliers (k, M, B),
       * percentages, markdown styling (*bold*, _italic_), HTML tags, and European/US decimal formats.
       * Preserves null for dates, strings, and non-numeric cells to avoid false zeros.
       * @param {any} val
       * @returns {number|null}
       */
      function parseNumericCell(val) {
        if (val === null || val === undefined) return null;
        let s = String(val).trim();
        if (!s || s === '-' || s === '—' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null' || s.toLowerCase() === 'none') return null;

        // 1. Strip HTML tags
        s = s.replace(/<[^>]*>/g, '');

        // 2. Strip Markdown link markup: [100](url) -> 100
        s = s.replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1');

        // 3. Strip Markdown formatting (*, _, ~, ==, backtick)
        s = s.replace(/[*_~=]/g, '').replaceAll(String.fromCharCode(96), '').trim();
        if (!s) return null;

        // 4. Do not parse ISO/full dates (e.g. 2026-01-15) as numbers
        if (/^\\d{4}[-.\\/]\\d{2}[-.\\/]\\d{2}/.test(s) || /^\\d{2}[-.\\/]\\d{2}[-.\\/]\\d{4}/.test(s)) {
          return null;
        }

        // 5. Accounting parentheses or explicit leading minus
        let isNegative = false;
        if (/^\\(.*\\)$/.test(s)) {
          isNegative = true;
          s = s.slice(1, -1).trim();
        } else if (/^-\\s*/.test(s)) {
          isNegative = true;
          s = s.replace(/^-\\s*/, '').trim();
        }

        // 6. Check for metric multiplier suffix (k/K, m/M, b/B, t/T)
        let multiplier = 1;
        const suffixMatch = s.match(/([kmbtKMBT])\\s*$/);
        if (suffixMatch) {
          const suf = suffixMatch[1].toUpperCase();
          if (suf === 'K') multiplier = 1e3;
          else if (suf === 'M') multiplier = 1e6;
          else if (suf === 'B') multiplier = 1e9;
          else if (suf === 'T') multiplier = 1e12;
          s = s.replace(/([kmbtKMBT])\\s*$/, '').trim();
        }

        // 7. Strip currency symbols, +, % and non-breaking spaces
        s = s.replace(/[$€£₹¥%+\\u00A0]/g, '').trim();

        // 8. Handle European vs US thousands/decimal formatting
        if (s.includes('.') && s.includes(',')) {
          if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            // European: 1.234,56 -> 1234.56
            s = s.replace(/\\./g, '').replace(/,/g, '.');
          } else {
            // US: 1,234.56 -> 1234.56
            s = s.replace(/,/g, '');
          }
        } else if (s.includes(',')) {
          if (/,\\d{1,2}$/.test(s)) {
            // European decimal: 123,5 -> 123.5
            s = s.replace(/,/g, '.');
          } else {
            // US thousands: 1,234 -> 1234
            s = s.replace(/,/g, '');
          }
        }

        // Strip remaining inner whitespace
        s = s.replace(/\\s+/g, '');

        if (!/^-?\\d*(\\.\\d+)?(e[+-]?\\d+)?$/i.test(s) || s === '' || s === '.') return null;

        const num = parseFloat(s);
        if (isNaN(num) || !isFinite(num)) return null;
        return (isNegative ? -Math.abs(num) : num) * multiplier;
      }

      let chartRetries = 0;
      // Render Chart.js with full chart types & easing
      function renderChart() {
        if (typeof Chart === 'undefined' || !window._chartScriptsLoaded) {
          if (window._chartScriptsState === 'failed') {
            console.warn('[GraphUtility] Chart library failed to load from CDN.');
            showToast('Chart library unavailable. Please check connection or reload.');
            return;
          }
          if (chartRetries < 25) {
            chartRetries++;
            setTimeout(renderChart, 150);
          } else {
            console.warn('[GraphUtility] Chart library failed to load after retries.');
            showToast('Chart library unavailable. Please check connection or reload.');
          }
          return;
        }
        chartRetries = 0;
        
        registerPlugins();

        const canvas = document.getElementById('mainChart');
        if (!canvas) return;

        const currentTable = parsedTables[state.activeTableIndex];
        if (!currentTable || currentTable.dataRows.length === 0) {
          if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
          }
          return;
        }

        let labels = state.selectedXIndex === -1
          ? currentTable.dataRows.map((_, rIdx) => 'Row ' + (rIdx + 1))
          : currentTable.dataRows.map(row => row[state.selectedXIndex] || ('Row ' + (currentTable.dataRows.indexOf(row) + 1)));

        const palette = PALETTES[state.palette] || PALETTES.modern;
        const isDark = !['light', 'solarized-light'].includes(state.theme);

        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        const textColor = isDark ? '#a6b0c9' : '#334155';

        const isPieOrDonut = ['pie', 'doughnut', 'polarArea'].includes(state.chartType);
        const isMixed = state.chartType === 'mixed';
        const isPareto = state.chartType === 'pareto';
        const isWaterfall = state.chartType === 'waterfall';
        const isHistogram = state.chartType === 'histogram';
        const isScatter = state.chartType === 'scatter';
        const isBubble = state.chartType === 'bubble';
        const isRadar = state.chartType === 'radar';

        const xValues = state.selectedXIndex >= 0
          ? currentTable.dataRows.map(r => parseNumericCell(r[state.selectedXIndex]))
          : null;

        let datasets = [];

        // 1. Dedicated Pareto Chart (80/20 Rule: Sorted Bars + Cumulative Percentage Line)
        if (isPareto) {
          const targetColIdx = (state.selectedYIndices && state.selectedYIndices.length > 0) ? state.selectedYIndices[0] : 0;
          const seriesName = currentTable.headers[targetColIdx] || ('Series ' + (targetColIdx + 1));
          const color = palette[targetColIdx % palette.length];

          const paired = currentTable.dataRows.map((row, rIdx) => {
            const rawLabel = state.selectedXIndex === -1 ? ('Item ' + (rIdx + 1)) : (row[state.selectedXIndex] || ('Item ' + (rIdx + 1)));
            const num = parseNumericCell(row[targetColIdx]);
            return { label: rawLabel, value: num !== null ? Math.max(0, num) : 0 };
          }).sort((a, b) => b.value - a.value);

          const totalSum = paired.reduce((acc, cur) => acc + cur.value, 0);
          let runningSum = 0;
          labels = paired.map(p => p.label);
          const barValues = paired.map(p => p.value);
          const cumulativePercentages = paired.map(p => {
            runningSum += p.value;
            return totalSum > 0 ? Number(((runningSum / totalSum) * 100).toFixed(1)) : 0;
          });

          datasets = [
            {
              type: 'bar',
              label: seriesName + ' (Value)',
              data: barValues,
              backgroundColor: color + 'cc',
              borderColor: color,
              borderWidth: 1.5,
              yAxisID: 'y',
              order: 2
            },
            {
              type: 'line',
              label: 'Cumulative %',
              data: cumulativePercentages,
              borderColor: '#f59e0b',
              backgroundColor: '#f59e0b',
              borderWidth: 2.5,
              tension: 0.1,
              pointRadius: 4,
              pointHoverRadius: 6,
              yAxisID: 'y1',
              order: 1
            }
          ];
        } 
        // 2. Dedicated Histogram (Continuous Frequency Binning)
        else if (isHistogram) {
          const targetColIdx = (state.selectedYIndices && state.selectedYIndices.length > 0) ? state.selectedYIndices[0] : 0;
          const seriesName = currentTable.headers[targetColIdx] || ('Series ' + (targetColIdx + 1));
          const color = palette[targetColIdx % palette.length];

          const nums = currentTable.dataRows
            .map(row => parseNumericCell(row[targetColIdx]))
            .filter(n => n !== null);

          if (nums.length === 0) {
            labels = ['No numeric data'];
            datasets = [{ label: seriesName, data: [0], backgroundColor: color }];
          } else {
            const minVal = Math.min(...nums);
            const maxVal = Math.max(...nums);
            const binCount = Math.min(10, Math.max(nums.length <= 2 ? nums.length : 3, Math.ceil(Math.log2(nums.length) + 1)));
            const range = (maxVal - minVal) || 1;
            const binWidth = range / binCount;

            const bins = Array.from({ length: binCount }, () => 0);
            const binLabels = [];

            for (let b = 0; b < binCount; b++) {
              const start = minVal + (b * binWidth);
              const end = start + binWidth;
              binLabels.push(start.toFixed(1) + ' – ' + end.toFixed(1));
            }

            nums.forEach(val => {
              let bIdx = Math.floor((val - minVal) / binWidth);
              if (bIdx >= binCount) bIdx = binCount - 1;
              bins[bIdx]++;
            });

            labels = binLabels;
            datasets = [{
              type: 'bar',
              label: seriesName + ' (Frequency)',
              data: bins,
              backgroundColor: color + 'cc',
              borderColor: color,
              borderWidth: 1.5,
              categoryPercentage: 1.0,
              barPercentage: 0.96
            }];
          }
        }
        // 3. Dedicated Waterfall Chart (Floating Step Dimenions)
        else if (isWaterfall) {
          const targetColIdx = (state.selectedYIndices && state.selectedYIndices.length > 0) ? state.selectedYIndices[0] : 0;
          const seriesName = currentTable.headers[targetColIdx] || ('Series ' + (targetColIdx + 1));
          
          let running = 0;
          const floatingBars = [];
          const barColors = [];
          const borderColors = [];

          currentTable.dataRows.forEach((row, rIdx) => {
            const num = parseNumericCell(row[targetColIdx]);
            if (num === null) return;
            const prev = running;
            running += num;

            if (floatingBars.length === 0) {
              floatingBars.push([0, num]);
              barColors.push('#6366f1cc');
              borderColors.push('#6366f1');
            } else if (num >= 0) {
              floatingBars.push([prev, running]);
              barColors.push('#10b981cc'); // Positive change: Green
              borderColors.push('#10b981');
            } else {
              floatingBars.push([prev, running]);
              barColors.push('#ef4444cc'); // Negative change: Red
              borderColors.push('#ef4444');
            }
          });

          datasets = [{
            type: 'bar',
            label: seriesName + ' (Waterfall Steps)',
            data: floatingBars,
            backgroundColor: barColors,
            borderColor: borderColors,
            borderWidth: 1.5
          }];
        }
        // 4. Standard and Multi-Series Datasets
        else {
          datasets = (state.selectedYIndices || []).map((colIdx, sIdx) => {
            const seriesName = currentTable.headers[colIdx] || ('Series ' + (colIdx + 1));
            const color = palette[colIdx % palette.length];
            const rawValues = currentTable.dataRows.map((row) => parseNumericCell(row[colIdx]));

            if (isScatter) {
              return {
                type: 'scatter',
                label: seriesName,
                data: rawValues.map((v, i) => ({
                  x: (xValues && xValues[i] !== null) ? xValues[i] : (i + 1),
                  y: v !== null ? v : 0
                })),
                backgroundColor: color,
                borderColor: color,
                pointRadius: 6
              };
            }

            if (isBubble) {
              return {
                type: 'bubble',
                label: seriesName,
                data: rawValues.map((v, i) => ({
                  x: (xValues && xValues[i] !== null) ? xValues[i] : (i + 1),
                  y: v !== null ? v : 0,
                  r: Math.min(25, Math.max(5, Math.abs(v !== null ? v : 10) / 4))
                })),
                backgroundColor: color + '88',
                borderColor: color
              };
            }

            if (isMixed) {
              const type = (sIdx % 2 === 0) ? 'bar' : 'line';
              return {
                type: type,
                label: seriesName + ' (' + type.toUpperCase() + ')',
                data: rawValues,
                backgroundColor: type === 'bar' ? color + 'bb' : color,
                borderColor: color,
                borderWidth: 2.5,
                fill: false,
                tension: state.smoothCurves ? 0.35 : 0,
                spanGaps: true
              };
            }

            return {
              label: seriesName,
              data: rawValues,
              backgroundColor: isPieOrDonut
                ? labels.map((_, i) => palette[i % palette.length])
                : (state.fillArea ? color + '33' : color),
              borderColor: isPieOrDonut
                ? (isDark ? '#0d1117' : '#ffffff')
                : color,
              borderWidth: isPieOrDonut ? 1.5 : 2.5,
              fill: state.fillArea || state.chartType === 'area',
              tension: state.smoothCurves ? 0.35 : 0,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: color,
              spanGaps: true
            };
          });
        }

        document.getElementById('chipSeries').innerHTML = '<strong>' + datasets.length + '</strong> Series';

        if (chartInstance) {
          chartInstance.destroy();
        }

        let chartJsType = state.chartType;
        if (['area'].includes(state.chartType)) chartJsType = 'line';
        if (['histogram', 'waterfall', 'pareto'].includes(state.chartType)) chartJsType = 'bar';
        if (['mixed'].includes(state.chartType)) chartJsType = 'bar';
        if (['scatter'].includes(state.chartType)) chartJsType = 'scatter';
        if (['bubble'].includes(state.chartType)) chartJsType = 'bubble';
        if (['radar'].includes(state.chartType)) chartJsType = 'radar';

        const config = {
          type: chartJsType,
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 750,
              easing: state.easing || 'easeInOutQuart'
            },
            plugins: {
              legend: {
                display: state.showLegend,
                position: state.legendPos || 'top',
                labels: {
                  color: textColor,
                  font: { size: 11, weight: '600', family: '"Inter", -apple-system, sans-serif' },
                  boxWidth: 12,
                  boxHeight: 12,
                  usePointStyle: true
                }
              },
              datalabels: {
                display: state.showDataLabels,
                color: isDark ? '#ffffff' : '#1e293b',
                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                borderRadius: 4,
                font: { size: 10, weight: 'bold', family: '"Inter", sans-serif' },
                padding: 4,
                formatter: (value) => {
                  if (value === null || value === undefined) return '';
                  let v = value;
                  if (typeof value === 'object') {
                    if (Array.isArray(value)) v = value[1] - value[0];
                    else if (value.y !== undefined) v = value.y;
                    else if (value.r !== undefined) v = value.r;
                  }
                  if (typeof v === 'number') {
                    if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + 'B';
                    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
                    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
                    return Number.isInteger(v) ? v.toString() : Number(v.toFixed(2)).toString();
                  }
                  return String(v || '');
                }
              },
              zoom: {
                zoom: {
                  wheel: { enabled: true, speed: 0.1 },
                  pinch: { enabled: true },
                  mode: 'xy',
                },
                pan: {
                  enabled: true,
                  mode: 'xy',
                }
              },
              tooltip: {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: isDark ? '#f8fafc' : '#0f172a',
                bodyColor: isDark ? '#cbd5e1' : '#334155',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    let val = context.parsed.y !== undefined ? context.parsed.y : (context.parsed !== undefined ? context.parsed : context.raw);
                    if (typeof val === 'number') {
                      label += Number.isInteger(val) ? val.toLocaleString() : Number(val.toFixed(4)).toLocaleString();
                    } else if (val !== null && val !== undefined) {
                      label += val;
                    }
                    return label;
                  }
                }
              }
            },
            scales: isPieOrDonut || isRadar ? {} : {
              x: {
                grid: { display: state.showGrid, color: gridColor },
                ticks: { color: textColor, font: { size: 11 } }
              },
              y: {
                grid: { display: state.showGrid, color: gridColor },
                ticks: { color: textColor, font: { size: 11 } }
              },
              ...(isPareto ? {
                y1: {
                  position: 'right',
                  min: 0,
                  max: 100,
                  grid: { drawOnChartArea: false },
                  ticks: {
                    color: '#f59e0b',
                    font: { size: 11 },
                    callback: (v) => v + '%'
                  }
                }
              } : {})
            }
          },
          plugins: [{
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart) => {
              const {ctx} = chart;
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              const bgMap = {
                dark: '#0d1117',
                light: '#ffffff',
                midnight: '#050b14',
                forest: '#08140e',
                cyberpunk: '#0f051d',
                dracula: '#1e1f29',
                nord: '#242933',
                'tokyo-night': '#16161e',
                'solarized-light': '#fdf6e3',
                monokai: '#1e1f1c'
              };
              ctx.fillStyle = bgMap[state.theme] || (isDark ? '#0d1117' : '#ffffff');
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
          }]
        };

        try {
          chartInstance = new Chart(canvas.getContext('2d'), config);
        } catch (chartErr) {
          console.error('[GraphUtility] Error creating chart instance:', chartErr);
          showToast('Chart render error: ' + chartErr.message);
        }
      }

      // Event Listeners setup
      function setupEventListeners() {
        window.addEventListener('chartsReady', () => {
          renderChart();
        });

        document.getElementById('themeToggleBtn')?.addEventListener('click', cycleTheme);

        const leftPanel = document.getElementById('leftPanel');
        const rightPanel = document.getElementById('rightPanel');

        document.getElementById('toggleLeftPanelBtn')?.addEventListener('click', () => {
          leftPanel.classList.toggle('collapsed');
          state.leftPanelCollapsed = leftPanel.classList.contains('collapsed');
          persistState();
        });

        document.getElementById('closeLeftPanelBtn')?.addEventListener('click', () => {
          leftPanel.classList.add('collapsed');
          state.leftPanelCollapsed = true;
          persistState();
        });

        document.getElementById('toggleRightPanelBtn')?.addEventListener('click', () => {
          rightPanel.classList.toggle('collapsed');
          state.rightPanelCollapsed = rightPanel.classList.contains('collapsed');
          persistState();
        });

        document.getElementById('closeRightPanelBtn')?.addEventListener('click', () => {
          rightPanel.classList.add('collapsed');
          state.rightPanelCollapsed = true;
          persistState();
        });

        // Chart Type Selector
        const chartSelect = document.getElementById('chartTypeSelect');
        if (chartSelect) {
          chartSelect.value = state.chartType;
          chartSelect.addEventListener('change', (e) => {
            state.chartType = e.target.value;
            if (state.chartType === 'area') state.fillArea = true;
            renderChart();
            persistState();
            showToast('Chart: ' + chartSelect.options[chartSelect.selectedIndex].text);
          });
        }

        // Table Selection
        document.getElementById('tableSelector')?.addEventListener('change', (e) => {
          state.activeTableIndex = parseInt(e.target.value, 10) || 0;
          state.selectedXIndex = 0; // Reset X-Axis to first column on new table
          state.selectedYIndices = []; // Reset Y series selection
          updateTableMappingControls();
          persistState();
        });

        // Transpose Switch
        const transposeToggle = document.getElementById('transposeToggle');
        if (transposeToggle) {
          transposeToggle.checked = state.isTransposed;
          transposeToggle.addEventListener('change', (e) => {
            state.isTransposed = e.target.checked;
            state.selectedXIndex = 0; // Reset X-Axis on structure change
            state.selectedYIndices = []; // Reset Y series
            parseTables();
            persistState();
            showToast(state.isTransposed ? 'Table Transposed (Rows ⇄ Cols)' : 'Original Table Restored');
          });
        }

        // Clear / Remove from X button
        document.getElementById('clearXAxisBtn')?.addEventListener('click', () => {
          if (state.selectedXIndex === -1) {
            state.selectedXIndex = 0;
            showToast('Set X-Axis to Column 1');
          } else {
            state.selectedXIndex = -1;
            showToast('Removed column from X (Auto Row Index)');
          }
          updateTableMappingControls();
          persistState();
        });

        // X-Axis Selector
        document.getElementById('xAxisSelect')?.addEventListener('change', (e) => {
          const val = parseInt(e.target.value, 10);
          state.selectedXIndex = isNaN(val) ? 0 : val;
          updateTableMappingControls();
          persistState();
        });

        // Select All / Select #1 Y Series Toggle
        document.getElementById('selectAllSeriesBtn')?.addEventListener('click', () => {
          const currentTable = parsedTables[state.activeTableIndex];
          if (!currentTable) return;
          const availableIndices = currentTable.headers
            .map((_, idx) => idx)
            .filter(idx => idx !== state.selectedXIndex);

          const isAllSelected = availableIndices.length > 0 &&
            availableIndices.every(idx => state.selectedYIndices.includes(idx));

          if (isAllSelected && availableIndices.length > 1) {
            state.selectedYIndices = [availableIndices[0]];
            showToast('Selected series #1');
          } else {
            state.selectedYIndices = availableIndices;
            showToast('Selected all ' + availableIndices.length + ' series');
          }
          updateTableMappingControls();
          persistState();
        });

        // Color Palette Selector
        const paletteSelect = document.getElementById('paletteSelect');
        if (paletteSelect) {
          paletteSelect.value = state.palette;
          paletteSelect.addEventListener('change', (e) => {
            state.palette = e.target.value;
            updateTableMappingControls();
            persistState();
          });
        }

        // Animation Easing Selector
        const easingSelect = document.getElementById('easingSelect');
        if (easingSelect) {
          easingSelect.value = state.easing || 'easeInOutQuart';
          easingSelect.addEventListener('change', (e) => {
            state.easing = e.target.value;
            renderChart();
            persistState();
            showToast('Easing: ' + state.easing);
          });
        }

        // Visual Display Options
        const smoothToggle = document.getElementById('smoothCurvesToggle');
        if (smoothToggle) {
          smoothToggle.checked = state.smoothCurves;
          smoothToggle.addEventListener('change', (e) => {
            state.smoothCurves = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const fillToggle = document.getElementById('fillAreaToggle');
        if (fillToggle) {
          fillToggle.checked = state.fillArea;
          fillToggle.addEventListener('change', (e) => {
            state.fillArea = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const gridToggle = document.getElementById('showGridToggle');
        if (gridToggle) {
          gridToggle.checked = state.showGrid;
          gridToggle.addEventListener('change', (e) => {
            state.showGrid = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const legendToggle = document.getElementById('showLegendToggle');
        if (legendToggle) {
          legendToggle.checked = state.showLegend;
          legendToggle.addEventListener('change', (e) => {
            state.showLegend = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const dataLabelsToggle = document.getElementById('showDataLabelsToggle');
        if (dataLabelsToggle) {
          dataLabelsToggle.checked = state.showDataLabels;
          dataLabelsToggle.addEventListener('change', (e) => {
            state.showDataLabels = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const legendPosSelect = document.getElementById('legendPosSelect');
        if (legendPosSelect) {
          legendPosSelect.value = state.legendPos || 'top';
          legendPosSelect.addEventListener('change', (e) => {
            state.legendPos = e.target.value;
            renderChart();
            persistState();
          });
        }

        // Replay Animation Button
        document.getElementById('replayAnimationBtn')?.addEventListener('click', () => {
          if (chartInstance) {
            chartInstance.reset();
            chartInstance.update();
            showToast('Animation replayed');
          }
        });

        // Export Dropdown Trigger
        const exportBtn = document.getElementById('exportDropdownBtn');
        const exportMenu = document.getElementById('exportMenu');
        exportBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          exportMenu?.classList.toggle('show');
        });
        document.addEventListener('click', () => exportMenu?.classList.remove('show'));

        // Host Bridge: Switch Note
        const triggerSwitchNote = async () => {
          if (!window.callAmplenotePlugin) {
            showToast('Note switching available inside Amplenote');
            return;
          }
          showToast('Opening Note Selector...');
          try {
            const res = await window.callAmplenotePlugin('pickNote');
            if (res && res.success) {
              currentNoteUUID = res.noteUUID;
              currentNoteName = res.noteName;
              cleanedMarkdown = res.cleanedContent;
              transposedMarkdown = res.transposeContent;
              initialTables = res.tables || [];
              state.noteUUID = currentNoteUUID;
              state.noteName = currentNoteName;
              state.activeTableIndex = 0;

              const titleEl = document.querySelector('#noteNameDisplay span');
              if (titleEl) titleEl.textContent = currentNoteName;
              parseTables();
              persistState();
              showToast('Switched to: ' + currentNoteName);
            }
          } catch (err) {
            showToast('Error switching note: ' + err.message);
          }
        };

        document.getElementById('switchNoteBtn')?.addEventListener('click', triggerSwitchNote);

        // Host Bridge: Open Note
        document.getElementById('openNoteBtn')?.addEventListener('click', () => {
          if (window.callAmplenotePlugin) {
            window.callAmplenotePlugin('openNote', { noteUUID: currentNoteUUID });
          } else {
            window.open('https://www.amplenote.com/notes/' + currentNoteUUID, '_blank');
          }
        });

        // Host Bridge: Refresh Data
        document.getElementById('refreshDataBtn')?.addEventListener('click', async () => {
          if (!window.callAmplenotePlugin) {
            showToast('Refreshed local view');
            parseTables();
            return;
          }
          showToast('Refreshing note tables...');
          try {
            const res = await window.callAmplenotePlugin('refreshData', { noteUUID: currentNoteUUID });
            if (res && res.success) {
              cleanedMarkdown = res.cleanedContent;
              transposedMarkdown = res.transposeContent;
              initialTables = res.tables || [];
              parseTables();
              showToast('Table data refreshed!');
            }
          } catch (err) {
            showToast('Failed to refresh: ' + err.message);
          }
        });

        // Host Bridge: Save Image Directly to Note
        document.getElementById('saveImageToNoteBtn')?.addEventListener('click', async () => {
          const canvas = document.getElementById('mainChart');
          if (!canvas) return;
          const dataUrl = canvas.toDataURL('image/png');
          const currentTable = parsedTables[state.activeTableIndex];

          if (window.callAmplenotePlugin) {
            showToast('Saving image above table in note...');
            try {
              const res = await window.callAmplenotePlugin('saveImageToNote', {
                noteUUID: currentNoteUUID,
                dataUrl: dataUrl,
                tableIndex: state.activeTableIndex,
                rawTableMarkdown: currentTable ? currentTable.rawTableMarkdown : ''
              });
              if (res && res.success) {
                showToast(res.message || 'Image saved to note!');
              } else {
                showToast(res?.error || 'Failed to save image.');
              }
            } catch (err) {
              showToast('Error: ' + err.message);
            }
          } else {
            showToast('Direct note saving available inside Amplenote');
          }
        });

        // Copy Image to Clipboard
        document.getElementById('copyImageClipboardBtn')?.addEventListener('click', async () => {
          const canvas = document.getElementById('mainChart');
          if (!canvas) return;
          if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') {
            showToast('Clipboard image copying not supported in this browser');
            return;
          }
          try {
            canvas.toBlob(async (blob) => {
              if (!blob) {
                showToast('Failed to generate image blob');
                return;
              }
              try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('Chart image copied to clipboard!');
              } catch (clipErr) {
                showToast('Clipboard write failed: ' + clipErr.message);
              }
            }, 'image/png');
          } catch (err) {
            showToast('Failed to copy image: ' + err.message);
          }
        });

        // Download PNG
        document.getElementById('downloadPngBtn')?.addEventListener('click', () => {
          const canvas = document.getElementById('mainChart');
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = (currentNoteName || 'Chart').replace(/[^a-z0-9]/gi, '_') + '_Chart.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('PNG downloaded');
        });

        // 1. Download - Interactive Charts (Recommended)
        document.getElementById('downloadInteractiveHtmlBtn')?.addEventListener('click', () => {
          let htmlContent = '<!DOCTYPE html>' + document.documentElement.outerHTML;
          
          // Update the embedded payload to reflect current edits and active theme
          const updatedPayload = {
            noteUUID: currentNoteUUID,
            noteName: currentNoteName,
            noteTags: PAYLOAD.noteTags || [],
            cleanedContent: cleanedMarkdown,
            transposeContent: transposedMarkdown,
            structuredTables: initialTables,
            savedState: state
          };
          
          const updatedJson = JSON.stringify(updatedPayload).replace(/</g, '\\u003c');
          const payloadRegex = new RegExp('(<script type="application/json" id="plugin-payload">)[\\\\s\\\\S]*?(<\\\\/script>)');
          htmlContent = htmlContent.replace(
            payloadRegex,
            '$1' + String.fromCharCode(10) + '    ' + updatedJson + String.fromCharCode(10) + '  $2'
          );
          
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const link = document.createElement('a');
          link.download = (currentNoteName || 'GraphUtility').replace(/[^a-z0-9]/gi, '_') + '_Interactive_Dashboard.html';
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('Interactive Charts HTML downloaded');
        });

        // 2. Download all Tables - MD
        document.getElementById('downloadAllTablesMDBtn')?.addEventListener('click', () => {
          const content = state.isTransposed ? transposedMarkdown : cleanedMarkdown;
          const blob = new Blob([content || '# No Tables Found'], { type: 'text/markdown;charset=utf-8' });
          const link = document.createElement('a');
          link.download = (currentNoteName || 'Note').replace(/[^a-z0-9]/gi, '_') + '_Tables.md';
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('Markdown Tables downloaded (.md)');
        });

        // 3. Download all Tables - CSV
        document.getElementById('downloadAllTablesCSVBtn')?.addEventListener('click', () => {
          if (parsedTables.length === 0) {
            showToast('No tables available to export.');
            return;
          }
          const csvChunks = [];
          parsedTables.forEach((tbl) => {
            csvChunks.push('# ' + (tbl.displayName || tbl.baseName || 'Table'));
            const headerLine = tbl.headers.map(h => '"' + (h || '').replace(/"/g, '""') + '"').join(',');
            const rowLines = tbl.dataRows.map(row => row.map(cell => '"' + (cell || '').replace(/"/g, '""') + '"').join(','));
            csvChunks.push([headerLine, ...rowLines].join(String.fromCharCode(10)));
            csvChunks.push('');
          });
          const fullCsv = csvChunks.join(String.fromCharCode(10));
          const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8' });
          const link = document.createElement('a');
          link.download = (currentNoteName || 'Note').replace(/[^a-z0-9]/gi, '_') + '_All_Tables.csv';
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('All Tables CSV downloaded (.csv)');
        });

        // 4. Copy all Tables from this Note to a new Note (Host Bridge)
        document.getElementById('copyAllTablesToNewNoteBtn')?.addEventListener('click', async () => {
          if (!window.callAmplenotePlugin) {
            showToast('Creating note available inside Amplenote');
            return;
          }
          showToast('Creating new note with tables...');
          try {
            const res = await window.callAmplenotePlugin('copyTablesToNewNote', {
              noteUUID: currentNoteUUID,
              noteName: currentNoteName,
              markdownContent: state.isTransposed ? transposedMarkdown : cleanedMarkdown
            });
            if (res && res.success) {
              showToast(res.message || 'Created new note with all tables!');
            } else {
              showToast(res?.error || 'Could not create new note.');
            }
          } catch (err) {
            showToast('Error: ' + err.message);
          }
        });
      }

      // Dynamic Favicon Enforcer
      function ensureFavicon() {
        const iconData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB/klEQVR4nM3XyUoDQRQFUPdunI0ZHKMxCwccMAZjcEAjDp/gRvA//Ac3btz4E7rwj9wICu6U11Wv+95+3SGETmPBhcqt4vUhZJEeGvrP6+7+8zeL9P3QkcJaJukZEzx0Zn2gSUXIwWhxI5ckIhxgM5ekAsZKW5nno/MURjsDcA/fpjy+vJqun+hygKgnhHwYL+9QBBDv+snI20MY7C2gsksJALEOg19t2h1ZBIAzA5io7FEEEO8wuLqdIwDPLWC2QQkAsU4j66t9GyZAJNwxADg3gMm5fYoA4p0mCSALz/UzAnBGAqBJcYCmiS4EYB893N1nQDTHAKbmDygCiHe6ZI+A+LnekSAAZyUAWhQHcHv5pfPwVgzg7n0/D4fRjgHRfAOYXjikCED3CNAOAdohQDsE4HwLWGxTAoDfN95/wmhHAN8RwHcEgPkJgCOKA7g9A1zHANcxwHUMiOYbQGHpmCIA3SNAOwRohwDtEIDzLaB6QgkAfk8A3xHAdwTwHQFgvgHMVE8pAtA9ArRDgHYI0A4BON8Cls8oAcDvCeA7AviOAL4jAMw3gOLyOUUAukeAdgjQDgHaIQDnW8BKhxIA/J4AviOA7wjgOwLA/MR/RaXaRRgBZB2dnfqfsFS7zCWpgPLqVS7p+m5Qrl8PND29HWkq9ZtMksl7Ym4vp3mvP1cbfZc4+/PAAAAAAElFTkSuQmCC";
        try {
          ['icon', 'shortcut icon', 'apple-touch-icon'].forEach(function(rel) {
            var el = document.querySelector('link[rel="' + rel + '"]');
            if (!el) {
              el = document.createElement('link');
              el.rel = rel;
              document.head.appendChild(el);
            }
            el.type = 'image/png';
            el.href = iconData;
          });
        } catch (e) {
          // ignore
        }
      }

      // Initialize on Load
      function init() {
        ensureFavicon();
        loadPersistedState();
        applyTheme(state.theme);

        if (state.leftPanelCollapsed) document.getElementById('leftPanel')?.classList.add('collapsed');
        if (state.rightPanelCollapsed) document.getElementById('rightPanel')?.classList.add('collapsed');

        setupEventListeners();
        parseTables();
      }

      window.addEventListener('DOMContentLoaded', init);
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
      }
    })();
  </script>
</body>
</html>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
