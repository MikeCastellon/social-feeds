const styles = `
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
`;

module.exports = { styles };
