/* Technical drawings in the blueprint style. All colors come from theme tokens. */

const VALS = [42, 31, 27, 18, 25, 11, 9];
const POS = [
  [320, 70], [190, 150], [450, 150], [125, 230], [255, 230], [385, 230], [515, 230],
];

export function HeapBlueprint() {
  const cellX = (i: number) => 124 + i * 56;
  return (
    <svg className="blueprint" viewBox="0 0 640 420" role="img" aria-labelledby="bp-title bp-desc" style={{ width: '100%', height: 'auto' }}>
      <title id="bp-title">A max-heap drawn two ways</title>
      <desc id="bp-desc">The same seven keys, 42, 31, 27, 18, 25, 11 and 9, shown as a binary tree and as the array that stores it. Dashed lines connect each tree node to its array slot.</desc>
      <defs>
        <pattern id="bp-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="var(--blue-line)" strokeWidth=".6" opacity=".7" />
        </pattern>
      </defs>
      <rect width="640" height="420" fill="url(#bp-grid)" />
      {VALS.map((_, i) => {
        const c = [2 * i + 1, 2 * i + 2].filter((k) => k < VALS.length);
        return c.map((k) => <line key={`${i}-${k}`} x1={POS[i][0]} y1={POS[i][1]} x2={POS[k][0]} y2={POS[k][1]} stroke="var(--blue)" strokeWidth="1.4" />);
      })}
      {VALS.map((v, i) => (
        <line key={`l${i}`} x1={POS[i][0]} y1={POS[i][1] + 19} x2={cellX(i) + 26} y2={318} stroke="var(--blue)" strokeWidth=".9" strokeDasharray="3 4" opacity=".55" />
      ))}
      {VALS.map((v, i) => (
        <g key={`n${i}`} transform={`translate(${POS[i][0]},${POS[i][1]})`}>
          <circle r="19" fill={i === 0 ? 'var(--blue)' : 'var(--card)'} stroke="var(--blue)" strokeWidth="1.6" />
          <text textAnchor="middle" dy="4.5" fontSize="13" fontWeight="600" fill={i === 0 ? 'var(--on-blue)' : 'var(--ink)'}>{v}</text>
        </g>
      ))}
      {VALS.map((v, i) => (
        <g key={`c${i}`}>
          <rect x={cellX(i)} y={318} width="52" height="40" rx="3" fill={i === 0 ? 'var(--blue-soft)' : 'var(--card)'} stroke="var(--blue)" strokeWidth="1.3" />
          <text x={cellX(i) + 26} y={343} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">{v}</text>
          <text x={cellX(i) + 26} y={374} textAnchor="middle" fontSize="10" fill="var(--blue)">{i + 1}</text>
        </g>
      ))}
      {/* callouts */}
      <g fontSize="10" fill="var(--blue)" letterSpacing=".06em">
        <line x1="296" y1="62" x2="210" y2="40" stroke="var(--blue)" strokeWidth=".9" />
        <text x="90" y="38">ROOT HOLDS THE MAXIMUM</text>
        <line x1="471" y1="146" x2="560" y2="110" stroke="var(--blue)" strokeWidth=".9" />
        <text x="520" y="102">RIGHT(i) = 2i + 1</text>
        <line x1="170" y1="146" x2="70" y2="118" stroke="var(--blue)" strokeWidth=".9" />
        <text x="22" y="110">LEFT(i) = 2i</text>
        <line x1="222" y1="190" x2="40" y2="190" stroke="var(--blue)" strokeWidth=".9" strokeDasharray="1 3" />
        <text x="22" y="182">PARENT ≥ CHILD</text>
        <line x1="124" y1="398" x2="516" y2="398" stroke="var(--blue)" strokeWidth=".9" />
        <line x1="124" y1="392" x2="124" y2="404" stroke="var(--blue)" strokeWidth=".9" />
        <line x1="516" y1="392" x2="516" y2="404" stroke="var(--blue)" strokeWidth=".9" />
        <text x="320" y="415" textAnchor="middle">A[1..7]: THE SAME HEAP, AS STORED IN MEMORY</text>
      </g>
    </svg>
  );
}

export function MiniRead() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <rect x="28" y="30" width="34" height="34" fill="var(--ink)" />
      <text x="45" y="56" textAnchor="middle" fontSize="26" fill="var(--paper)" fontFamily="var(--f-read)">I</text>
      {[30, 44, 58].map((y) => <rect key={y} x="72" y={y} width={220 - (y - 30) * 2} height="6" rx="3" fill="var(--rule-2)" />)}
      {[78, 92, 106].map((y, i) => <rect key={y} x="28" y={y} width={[264, 240, 200][i]} height="6" rx="3" fill="var(--rule-2)" />)}
      <line x1="28" y1="128" x2="292" y2="128" stroke="var(--blue)" strokeDasharray="3 4" />
      <text x="160" y="152" textAnchor="middle" fontSize="16" fill="var(--blue)" fontFamily="var(--f-read)" fontStyle="italic">T(n) = 2T(n/2) + Θ(n)</text>
      <line x1="28" y1="166" x2="292" y2="166" stroke="var(--blue)" strokeDasharray="3 4" />
    </svg>
  );
}

export function MiniWatch() {
  const hs = [70, 110, 40, 130, 90, 60, 120];
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      {hs.map((h, i) => (
        <rect key={i} x={40 + i * 36} y={170 - h} width="28" height={h} rx="3" fill={i === 2 ? 'var(--blue)' : i === 3 ? 'var(--blue-soft)' : 'var(--paper-2)'} stroke={i === 2 || i === 3 ? 'var(--blue)' : 'var(--rule-2)'} strokeWidth="1.3" />
      ))}
      <path d="M122 30 C 122 14, 162 14, 162 30" fill="none" stroke="var(--blue)" strokeWidth="1.4" />
      <path d="M158 25l4 6 4-6" fill="none" stroke="var(--blue)" strokeWidth="1.4" />
      <text x="140" y="190" textAnchor="middle" fontSize="10" fill="var(--blue)" fontFamily="var(--f-mono)">j</text>
    </svg>
  );
}

export function MiniPredict() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true">
      <line x1="160" y1="44" x2="100" y2="104" stroke="var(--blue)" strokeWidth="1.4" />
      <line x1="160" y1="44" x2="220" y2="104" stroke="var(--blue)" strokeWidth="1.4" />
      <line x1="220" y1="104" x2="250" y2="160" stroke="var(--blue)" strokeWidth="1.4" strokeDasharray="4 4" />
      <circle cx="160" cy="44" r="16" fill="var(--ink)" />
      <circle cx="100" cy="104" r="16" fill="var(--card)" stroke="var(--blue)" strokeWidth="1.6" />
      <circle cx="220" cy="104" r="16" fill="var(--blue)" />
      <circle cx="250" cy="160" r="16" fill="var(--blue-soft)" stroke="var(--blue)" strokeWidth="1.6" strokeDasharray="4 3" />
      <text x="250" y="165" textAnchor="middle" fontSize="15" fill="var(--blue)" fontFamily="var(--f-mono)">?</text>
      <path d="M266 170l14 22 4-9 9-2z" fill="var(--ink)" />
    </svg>
  );
}
