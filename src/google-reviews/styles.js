const styles = `
  .sf-gr-wrap {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    box-sizing: border-box;
  }
  .sf-gr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .sf-gr-header-left { display: flex; flex-direction: column; gap: 4px; }
  .sf-gr-logo { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; }
  .sf-gr-rating-row { display: flex; align-items: center; gap: 8px; font-size: 15px; }
  .sf-gr-score { font-weight: 700; font-size: 18px; }
  .sf-gr-stars { color: #FBBC04; letter-spacing: 2px; }
  .sf-gr-count { color: #666; }
  .sf-gr-btn {
    background: #1a73e8;
    color: #fff;
    border: none;
    border-radius: 24px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }
  .sf-gr-btn:hover { background: #1558b0; }
  .sf-gr-carousel { position: relative; overflow: hidden; }
  .sf-gr-track {
    display: flex;
    gap: 16px;
    transition: transform 0.3s ease;
  }
  .sf-gr-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    min-width: calc(25% - 12px);
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }
  .sf-gr-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .sf-gr-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
  }
  .sf-gr-avatar-initials {
    width: 40px; height: 40px; border-radius: 50%;
    background: #1a73e8; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 14px; flex-shrink: 0;
  }
  .sf-gr-reviewer { display: flex; flex-direction: column; gap: 2px; }
  .sf-gr-name { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 4px; }
  .sf-gr-check { color: #1a73e8; font-size: 12px; }
  .sf-gr-time { color: #888; font-size: 12px; }
  .sf-gr-card-stars { color: #FBBC04; font-size: 14px; margin-bottom: 8px; }
  .sf-gr-text { font-size: 13px; color: #333; line-height: 1.5; }
  .sf-gr-readmore { color: #1a73e8; cursor: pointer; font-size: 13px; }
  .sf-gr-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: #fff; border: 1px solid #ddd; border-radius: 50%;
    width: 36px; height: 36px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; z-index: 2; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }
  .sf-gr-arrow:hover { background: #f5f5f5; }
  .sf-gr-prev { left: -18px; }
  .sf-gr-next { right: -18px; }
  .sf-gr-dots { display: flex; justify-content: center; gap: 6px; margin-top: 16px; }
  .sf-gr-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ccc; cursor: pointer; border: none; padding: 0;
  }
  .sf-gr-dot.active { background: #1a73e8; }
  @media (max-width: 768px) {
    .sf-gr-card { min-width: calc(100% - 0px); }
  }
`;

module.exports = { styles };
