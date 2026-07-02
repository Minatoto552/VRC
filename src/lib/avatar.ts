const escapeSvgText = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const buildAvatarImage = (label: string, accentText: string): string => {
  const safeLabel = escapeSvgText(label.slice(0, 3) || 'VR');
  const safeAccent = escapeSvgText(accentText.slice(0, 18) || 'Event Cafe');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${safeAccent}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f6e7d1" />
          <stop offset="52%" stop-color="#c58959" />
          <stop offset="100%" stop-color="#6e4a35" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="38" fill="url(#bg)" />
      <circle cx="112" cy="42" r="24" fill="rgba(255,248,240,0.32)" />
      <path d="M34 118c14-20 31-30 52-30s38 10 52 30" fill="none" stroke="rgba(255,251,247,0.68)" stroke-width="8" stroke-linecap="round" />
      <text x="80" y="86" text-anchor="middle" font-size="42" font-family="Yu Gothic, Meiryo, sans-serif" font-weight="700" fill="#fffdf9">${safeLabel}</text>
      <text x="80" y="126" text-anchor="middle" font-size="12" font-family="Yu Gothic, Meiryo, sans-serif" fill="#fff8ef">${safeAccent}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
