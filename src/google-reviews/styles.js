const styles = `
  /* ── Base ── */
  .sf-gr-wrap {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    background: #fff;
    border-radius: 16px;
    padding: 28px 32px 24px;
    box-sizing: border-box;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }
  .sf-gr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .sf-gr-header-left { display: flex; flex-direction: column; gap: 5px; }
  .sf-gr-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 17px; color: #222; }
  .sf-gr-rating-row { display: flex; align-items: center; gap: 8px; }
  .sf-gr-score { font-weight: 800; font-size: 24px; color: #111; line-height: 1; }
  .sf-gr-stars { color: #FBBC04; font-size: 17px; letter-spacing: 1px; }
  .sf-gr-count { color: #999; font-size: 13px; }
  .sf-gr-btn {
    background: #4285F4;
    color: #fff;
    border: none;
    border-radius: 24px;
    padding: 10px 22px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
    display: inline-block;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .sf-gr-btn:hover { background: #2b6fc9; box-shadow: 0 4px 12px rgba(66,133,244,0.35); }

  /* ── Carousel ── */
  .sf-gr-carousel { position: relative; overflow: hidden; padding: 0 48px; }
  .sf-gr-track {
    display: flex;
    align-items: stretch;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Cards ── */
  .sf-gr-card {
    margin: 0 6px;
    box-sizing: border-box;
    padding: 20px;
    background: #fafafa;
    border-radius: 12px;
    border: 1px solid #efefef;
    transition: box-shadow 0.2s;
  }
  .sf-gr-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
  .sf-gr-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .sf-gr-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
  }
  .sf-gr-avatar-initials {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, #4285F4 0%, #34A853 100%);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 15px; flex-shrink: 0;
  }
  .sf-gr-reviewer { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .sf-gr-name { font-weight: 700; font-size: 14px; color: #111; display: flex; align-items: center; gap: 4px; }
  .sf-gr-check { color: #4285F4; font-size: 11px; }
  .sf-gr-time { color: #bbb; font-size: 12px; }
  .sf-gr-card-stars { color: #FBBC04; font-size: 15px; letter-spacing: 1px; margin-bottom: 10px; }
  .sf-gr-text { font-size: 13px; color: #555; line-height: 1.65; }
  .sf-gr-readmore { color: #4285F4; cursor: pointer; font-size: 13px; font-weight: 500; margin-left: 2px; }

  /* ── Arrows ── */
  .sf-gr-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.95);
    border: 1px solid #e8e8e8;
    border-radius: 50%;
    width: 36px; height: 36px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; z-index: 10;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    color: #444;
    transition: all 0.2s;
    padding: 0; line-height: 1;
    backdrop-filter: blur(4px);
  }
  .sf-gr-arrow:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transform: translateY(-50%) scale(1.05); }
  .sf-gr-prev { left: 4px; }
  .sf-gr-next { right: 4px; }

  /* ── Dots ── */
  .sf-gr-dots { display: flex; justify-content: center; gap: 7px; margin-top: 20px; }
  .sf-gr-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ddd; cursor: pointer; border: none; padding: 0;
    transition: all 0.25s;
  }
  .sf-gr-dot.active { background: #4285F4; width: 22px; border-radius: 4px; }
  .sf-gr-loading { text-align: center; padding: 48px; color: #aaa; font-size: 14px; }

  /* ── View All button ── */
  .sf-gr-viewall {
    display: block;
    text-align: center;
    margin: 18px auto 0;
    padding: 10px 28px;
    font-size: 14px;
    font-weight: 600;
    color: #4285F4;
    background: transparent;
    border: 1.5px solid #4285F4;
    border-radius: 24px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    width: fit-content;
  }
  .sf-gr-viewall:hover { background: #4285F4; color: #fff; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .sf-gr-wrap { padding: 20px 16px; }
  }

  /* ══════════════════════════════════
     DARK THEME
  ══════════════════════════════════ */
  .sf-gr-dark.sf-gr-wrap {
    background: #0f1117;
    box-shadow: 0 4px 32px rgba(0,0,0,0.5);
  }
  .sf-gr-dark .sf-gr-logo { color: #f0f4ff; }
  .sf-gr-dark .sf-gr-score { color: #f0f4ff; }
  .sf-gr-dark .sf-gr-count { color: #5a6580; }
  .sf-gr-dark .sf-gr-card {
    background: #1a1f2e;
    border-color: #252d42;
  }
  .sf-gr-dark .sf-gr-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
  .sf-gr-dark .sf-gr-name { color: #e8edff; }
  .sf-gr-dark .sf-gr-time { color: #404a66; }
  .sf-gr-dark .sf-gr-text { color: #8891aa; }
  .sf-gr-dark .sf-gr-arrow { background: rgba(26,31,46,0.95); border-color: #252d42; color: #8891aa; box-shadow: 0 2px 10px rgba(0,0,0,0.4); }
  .sf-gr-dark .sf-gr-arrow:hover { background: #252d42; transform: translateY(-50%) scale(1.05); }
  .sf-gr-dark .sf-gr-dot { background: #252d42; }
  .sf-gr-dark .sf-gr-dot.active { background: #4f8ef7; width: 22px; }
  .sf-gr-dark .sf-gr-btn { background: #3d5afe; box-shadow: 0 4px 14px rgba(61,90,254,0.3); }
  .sf-gr-dark .sf-gr-btn:hover { background: #2a46e0; }
  .sf-gr-dark .sf-gr-check { color: #4f8ef7; }
  .sf-gr-dark .sf-gr-readmore { color: #4f8ef7; }
  .sf-gr-dark .sf-gr-viewall { color: #4f8ef7; border-color: #4f8ef7; }
  .sf-gr-dark .sf-gr-viewall:hover { background: #4f8ef7; color: #fff; }

  /* ══════════════════════════════════
     SLATE / GRAY THEME
  ══════════════════════════════════ */
  .sf-gr-gray.sf-gr-wrap {
    background: #f1f5f9;
    box-shadow: none;
    border: 1px solid #e2e8f0;
  }
  .sf-gr-gray .sf-gr-logo { color: #1e293b; }
  .sf-gr-gray .sf-gr-score { color: #1e293b; }
  .sf-gr-gray .sf-gr-count { color: #94a3b8; }
  .sf-gr-gray .sf-gr-card {
    background: #fff;
    border-color: #e2e8f0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .sf-gr-gray .sf-gr-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
  .sf-gr-gray .sf-gr-name { color: #1e293b; }
  .sf-gr-gray .sf-gr-time { color: #cbd5e1; }
  .sf-gr-gray .sf-gr-text { color: #64748b; }
  .sf-gr-gray .sf-gr-arrow { background: #fff; border-color: #e2e8f0; color: #64748b; }
  .sf-gr-gray .sf-gr-arrow:hover { background: #f8fafc; }
  .sf-gr-gray .sf-gr-dot { background: #cbd5e1; }
  .sf-gr-gray .sf-gr-dot.active { background: #475569; width: 22px; }
  .sf-gr-gray .sf-gr-btn { background: #475569; }
  .sf-gr-gray .sf-gr-btn:hover { background: #334155; box-shadow: 0 4px 12px rgba(71,85,105,0.3); }
  .sf-gr-gray .sf-gr-avatar-initials { background: linear-gradient(135deg, #475569, #64748b); }
  .sf-gr-gray .sf-gr-check { color: #475569; }
  .sf-gr-gray .sf-gr-readmore { color: #475569; }
  .sf-gr-gray .sf-gr-viewall { color: #475569; border-color: #475569; }
  .sf-gr-gray .sf-gr-viewall:hover { background: #475569; color: #fff; }

  /* ══════════════════════════════════
     COLORFUL / VIBRANT THEME
  ══════════════════════════════════ */
  .sf-gr-colorful.sf-gr-wrap {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 8px 32px rgba(102,126,234,0.45);
  }
  .sf-gr-colorful .sf-gr-logo { color: #fff; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 4px 10px; backdrop-filter: blur(4px); }
  .sf-gr-colorful .sf-gr-score { color: #fff; }
  .sf-gr-colorful .sf-gr-count { color: rgba(255,255,255,0.65); }
  .sf-gr-colorful .sf-gr-card {
    background: rgba(255,255,255,0.96);
    border: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .sf-gr-colorful .sf-gr-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.22); }
  .sf-gr-colorful .sf-gr-name { color: #1a1a2e; }
  .sf-gr-colorful .sf-gr-text { color: #555; }
  .sf-gr-colorful .sf-gr-arrow { background: rgba(255,255,255,0.9); border-color: transparent; color: #764ba2; }
  .sf-gr-colorful .sf-gr-arrow:hover { background: #fff; }
  .sf-gr-colorful .sf-gr-dot { background: rgba(255,255,255,0.35); }
  .sf-gr-colorful .sf-gr-dot.active { background: #fff; width: 22px; }
  .sf-gr-colorful .sf-gr-btn {
    background: rgba(255,255,255,0.2);
    border: 1.5px solid rgba(255,255,255,0.5);
    color: #fff;
  }
  .sf-gr-colorful .sf-gr-btn:hover { background: rgba(255,255,255,0.3); box-shadow: none; }
  .sf-gr-colorful .sf-gr-check { color: #764ba2; }
  .sf-gr-colorful .sf-gr-readmore { color: #667eea; }
  .sf-gr-colorful .sf-gr-avatar-initials { background: linear-gradient(135deg, #667eea, #764ba2); }
  .sf-gr-colorful .sf-gr-viewall { color: #fff; border-color: rgba(255,255,255,0.5); }
  .sf-gr-colorful .sf-gr-viewall:hover { background: rgba(255,255,255,0.2); color: #fff; }
`;

module.exports = { styles };
