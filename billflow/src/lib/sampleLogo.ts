// A neutral sample logo for showcase previews (landing hero, style strip)
// so every style shows where a logo sits. Never used in the PDF or for a
// user's real invoice — their own upload (if any) always wins.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="48" viewBox="0 0 168 48">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7091e6"/><stop offset="1" stop-color="#3d52a0"/></linearGradient></defs>
<rect x="2" y="2" width="44" height="44" rx="12" fill="url(#g)"/>
<path d="M14 31l8-14 6 10 4-6 6 10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
<text x="56" y="22" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700" fill="#1f2937">Your Studio</text>
<text x="56" y="38" font-family="Inter,Arial,sans-serif" font-size="10" fill="#6b7280">Design &amp; Development</text>
</svg>`

export const SAMPLE_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
