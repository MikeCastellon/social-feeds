(()=>{var x=(r,o)=>()=>(o||r((o={exports:{}}).exports,o),o.exports);var F=x((sr,S)=>{var G=`
  /* \u2500\u2500 Base \u2500\u2500 */
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

  /* \u2500\u2500 Carousel \u2500\u2500 */
  .sf-gr-carousel { position: relative; overflow: hidden; padding: 0 48px; }
  .sf-gr-track {
    display: flex;
    align-items: stretch;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* \u2500\u2500 Cards \u2500\u2500 */
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

  /* \u2500\u2500 Arrows \u2500\u2500 */
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

  /* \u2500\u2500 Dots \u2500\u2500 */
  .sf-gr-dots { display: flex; justify-content: center; gap: 7px; margin-top: 20px; }
  .sf-gr-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ddd; cursor: pointer; border: none; padding: 0;
    transition: all 0.25s;
  }
  .sf-gr-dot.active { background: #4285F4; width: 22px; border-radius: 4px; }
  .sf-gr-loading { text-align: center; padding: 48px; color: #aaa; font-size: 14px; }

  /* \u2500\u2500 View All button \u2500\u2500 */
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

  /* \u2500\u2500 Responsive \u2500\u2500 */
  @media (max-width: 768px) {
    .sf-gr-wrap { padding: 20px 16px; }
  }

  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     DARK THEME
  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SLATE / GRAY THEME
  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     COLORFUL / VIBRANT THEME
  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     MINIMAL THEME
  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
  .sf-gr-minimal.sf-gr-wrap { background: transparent; box-shadow: none; border: none; padding: 0; }
  .sf-gr-minimal .sf-gr-card { background: transparent; border: none; box-shadow: none; border-bottom: 1px solid #e5e7eb; border-radius: 0; padding: 24px 0; }
  .sf-gr-minimal .sf-gr-card:hover { box-shadow: none; transform: none; }
  .sf-gr-minimal .sf-gr-arrow { display: none; }
  .sf-gr-minimal .sf-gr-dots { display: none; }
  .sf-gr-minimal .sf-gr-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 8px; }
  .sf-gr-minimal .sf-gr-btn { background: transparent; color: #1a1a1a; border: 1px solid #d1d5db; box-shadow: none; font-weight: 600; }
  .sf-gr-minimal .sf-gr-btn:hover { background: #f3f4f6; }
  .sf-gr-minimal .sf-gr-viewall { border: none; text-decoration: underline; }

  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     WARM THEME
  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
  .sf-gr-warm.sf-gr-wrap { background: #fffbeb; border: 1px solid #fde68a; }
  .sf-gr-warm .sf-gr-logo { color: #92400e; }
  .sf-gr-warm .sf-gr-score { color: #92400e; }
  .sf-gr-warm .sf-gr-count { color: #b45309; }
  .sf-gr-warm .sf-gr-card { background: #fff; border-color: #fde68a; }
  .sf-gr-warm .sf-gr-card:hover { box-shadow: 0 6px 24px rgba(180,120,0,0.1); }
  .sf-gr-warm .sf-gr-name { color: #78350f; }
  .sf-gr-warm .sf-gr-time { color: #b45309; }
  .sf-gr-warm .sf-gr-text { color: #92400e; }
  .sf-gr-warm .sf-gr-arrow { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  .sf-gr-warm .sf-gr-dot { background: #fde68a; }
  .sf-gr-warm .sf-gr-dot.active { background: #f59e0b; }
  .sf-gr-warm .sf-gr-btn { background: #f59e0b; color: #fff; box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
  .sf-gr-warm .sf-gr-btn:hover { background: #d97706; }
  .sf-gr-warm .sf-gr-check { color: #f59e0b; }
  .sf-gr-warm .sf-gr-readmore { color: #b45309; }
  .sf-gr-warm .sf-gr-viewall { color: #b45309; border-color: #b45309; }
  .sf-gr-warm .sf-gr-viewall:hover { background: #b45309; color: #fff; }
`;S.exports={styles:G}});var A=x((tr,q)=>{var{styles:V}=F();function c(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var U=`<svg width="80" height="26" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
  <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
  <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
  <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
  <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
  <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
  <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
</svg>`;function C(r){var o=Math.min(5,Math.max(0,Math.round(Number(r)||0)));return"\u2605".repeat(o)+"\u2606".repeat(5-o)}function D(r){return r&&r.split(" ").filter(Boolean).map(function(o){return o[0]}).join("").slice(0,2).toUpperCase()||"?"}function K(r){let e=r.text.length>120,s=e?r.text.slice(0,120)+"...":r.text,a=r.profile_photo_url?`<img class="sf-gr-avatar" src="${c(r.profile_photo_url)}" alt="${c(r.author_name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",d=`<div class="sf-gr-avatar-initials" ${r.profile_photo_url?'style="display:none"':""}>${D(c(r.author_name))}</div>`;return`<div class="sf-gr-card">
    <div class="sf-gr-card-header">
      ${a}${d}
      <div class="sf-gr-reviewer">
        <div class="sf-gr-name">${c(r.author_name)} <span class="sf-gr-check">&#10003;</span></div>
        <div class="sf-gr-time">${c(r.relative_time_description)}</div>
      </div>
    </div>
    <div class="sf-gr-card-stars">${C(r.rating)}</div>
    <div class="sf-gr-text">
      <span class="sf-gr-review-body">${c(s)}</span>
      ${e?'<span class="sf-gr-readmore"> Read more</span>':""}
    </div>
  </div>`}function N(r){let o=r.dataset.widgetKey,e=r.dataset.theme||"";if(!o){r.textContent="Missing data-widget-key";return}if(!document.getElementById("sf-gr-styles")){let a=document.createElement("style");a.id="sf-gr-styles",a.textContent=V,document.head.appendChild(a)}let s=e?" sf-gr-"+e:"";r.innerHTML='<div class="sf-gr-wrap'+s+'"><div class="sf-gr-loading">Loading reviews...</div></div>',fetch("https://social-feeds-app.netlify.app/.netlify/functions/google-reviews?widget_key="+encodeURIComponent(o)).then(function(a){return a.json()}).then(function(a){P(r,a)}).catch(function(){var a=r.querySelector(".sf-gr-wrap");a&&(a.innerHTML="Could not load reviews.")})}function P(r,o){for(var e=o.rating,s=o.user_ratings_total,a=o.url,d=typeof a=="string"&&a.startsWith("https://")?a:"#",i=o.reviews,n=r.querySelector(".sf-gr-wrap"),m=typeof window<"u"&&window.innerWidth<=768?1:4,p=0,b=Math.ceil(i.length/m),k="",h=0;h<b;h++)k+='<button class="sf-gr-dot'+(h===0?" active":"")+'" data-idx="'+h+'"></button>';n.innerHTML='<div class="sf-gr-header"><div class="sf-gr-header-left"><div class="sf-gr-logo">'+U+' Reviews</div><div class="sf-gr-rating-row"><span class="sf-gr-score">'+e.toFixed(1)+'</span><span class="sf-gr-stars">'+C(e)+'</span><span class="sf-gr-count">('+s+')</span></div></div><a class="sf-gr-btn" href="'+d+'" target="_blank" rel="noopener">Review us on Google</a></div><div class="sf-gr-carousel"><button class="sf-gr-arrow sf-gr-prev">&#10094;</button><div class="sf-gr-track">'+i.map(K).join("")+'</div><button class="sf-gr-arrow sf-gr-next">&#10095;</button></div><div class="sf-gr-dots">'+k+'</div><a class="sf-gr-viewall" href="'+d+'" target="_blank" rel="noopener">View All Reviews on Google</a>';var y=n.querySelector(".sf-gr-carousel"),z=n.querySelector(".sf-gr-track"),E=n.querySelectorAll(".sf-gr-dot"),u=0;function M(){var t=y.getBoundingClientRect(),g=window.getComputedStyle(y),f=t.width-parseFloat(g.paddingLeft)-parseFloat(g.paddingRight);if(f<=0)return 0;var l=Math.floor(f/m)-12;return n.querySelectorAll(".sf-gr-card").forEach(function(v){v.style.flex="0 0 "+l+"px",v.style.maxWidth=l+"px"}),z.style.width=f*b+"px",f}function _(){z.style.transform="translateX(-"+p*u+"px)"}var O=n.querySelectorAll(".sf-gr-readmore");O.forEach(function(t){t.addEventListener("click",function(){var g=t.previousElementSibling,f=t.closest(".sf-gr-card"),l=n.querySelectorAll(".sf-gr-card"),v=Array.prototype.indexOf.call(l,f);g.textContent=i[v].text,t.remove()})});function w(t){p=(t%b+b)%b;var g=M();g>0&&(u=g),_(),E.forEach(function(f,l){f.classList.toggle("active",l===p)})}n.querySelector(".sf-gr-prev").addEventListener("click",function(){w(p-1)}),n.querySelector(".sf-gr-next").addEventListener("click",function(){w(p+1)}),E.forEach(function(t){t.addEventListener("click",function(){w(parseInt(t.dataset.idx,10))})});function L(){var t=M();t>0&&(u=t,_())}if(typeof ResizeObserver<"u"){var W=new ResizeObserver(function(){L()});W.observe(r)}else(function t(){u>0||(L(),u||requestAnimationFrame(t))})()}q.exports={mountGoogleReviews:N}});var T=x((nr,R)=>{var Y=`
  .sf-ig-wrap {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    box-sizing: border-box;
  }
  .sf-ig-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #dbdbdb;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .sf-ig-avatar-ring {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
    padding: 2px; flex-shrink: 0;
  }
  .sf-ig-avatar-ring img {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; border: 2px solid #fff;
  }
  .sf-ig-meta { flex: 1; }
  .sf-ig-handle { font-weight: 600; font-size: 15px; }
  .sf-ig-counts { display: flex; gap: 20px; margin-top: 4px; font-size: 13px; color: #444; }
  .sf-ig-count-item strong { font-weight: 600; }
  .sf-ig-follow-btn {
    background: #0095f6; color: #fff; border: none;
    border-radius: 8px; padding: 8px 20px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    text-decoration: none; display: inline-block;
  }
  .sf-ig-follow-btn:hover { background: #0074cc; }
  .sf-ig-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .sf-ig-post {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    background: #efefef;
    display: block;
  }
  .sf-ig-post img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s;
  }
  .sf-ig-post:hover img { transform: scale(1.04); }
  .sf-ig-video-icon {
    position: absolute; top: 8px; right: 8px;
    color: #fff; font-size: 18px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    pointer-events: none;
  }
  @media (max-width: 600px) {
    .sf-ig-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;R.exports={styles:Y}});var B=x((ir,I)=>{var{styles:X}=T();function J(r){var o=r.dataset.widgetKey;if(!o){r.textContent="data-widget-key is required";return}if(!document.getElementById("sf-ig-styles")){var e=document.createElement("style");e.id="sf-ig-styles",e.textContent=X,document.head.appendChild(e)}r.innerHTML='<div class="sf-ig-wrap"><div class="sf-ig-loading">Loading feed...</div></div>',fetch("https://social-feeds-app.netlify.app/.netlify/functions/instagram-feed?widget_key="+encodeURIComponent(o)).then(function(s){return s.json()}).then(function(s){Q(r,s)}).catch(function(){var s=r.querySelector(".sf-ig-wrap");s&&(s.innerHTML="Could not load Instagram feed.")})}function Q(r,o){var e=o.profile,s=o.posts,a=r.querySelector(".sf-ig-wrap"),d=s.map(function(i){var n=i.media_type==="VIDEO"?i.thumbnail_url||i.media_url||"":i.media_url||"",m=i.media_type==="VIDEO";return'<a class="sf-ig-post" href="'+i.permalink+'" target="_blank" rel="noopener"><img src="'+n+'" alt="Instagram post" loading="lazy">'+(m?'<span class="sf-ig-video-icon">&#9654;</span>':"")+"</a>"}).join("");a.innerHTML='<div class="sf-ig-header"><div class="sf-ig-avatar-ring"><img src="'+e.profile_picture_url+'" alt="'+e.username+`" onerror="this.onerror=null;this.src=''"></div><div class="sf-ig-meta"><div class="sf-ig-handle">@`+e.username+'</div><div class="sf-ig-counts"><span class="sf-ig-count-item"><strong>'+e.media_count+'</strong> Posts</span><span class="sf-ig-count-item"><strong>'+e.followers_count+'</strong> Followers</span><span class="sf-ig-count-item"><strong>'+e.follows_count+'</strong> Following</span></div></div><a class="sf-ig-follow-btn" href="https://instagram.com/'+e.username+'" target="_blank" rel="noopener">Follow</a></div><div class="sf-ig-grid">'+d+"</div>"}I.exports={mountInstagramFeed:J}});var $=x((fr,H)=>{var{mountGoogleReviews:Z}=A(),{mountInstagramFeed:rr}=B(),or={"google-reviews":Z,"instagram-feed":rr};function er(){document.querySelectorAll("[data-widget]").forEach(o=>{let e=o.dataset.widget,s=or[e];if(s)try{s(o)}catch(a){console.error(`[SocialFeeds] Widget "${e}" failed to mount:`,a)}else console.warn(`[SocialFeeds] Unknown widget: "${e}"`)})}H.exports={mountWidgets:er}});var{mountWidgets:j}=$();document.readyState==="loading"?document.addEventListener("DOMContentLoaded",j):j();})();
