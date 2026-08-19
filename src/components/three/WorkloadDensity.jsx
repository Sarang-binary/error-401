import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, Points, PointMaterial, RoundedBox } from "@react-three/drei";
import { useUi, scoreStatus } from "../ui";

const DEPT_COLORS = ["#818cf8", "#34d399", "#f472b6", "#fbbf24", "#38bdf8", "#a78bfa", "#fb923c"];
const BAR_GAP = 2.0;
const GROUP_GAP = 3.2;

function scoreToColor(score, isW3c) {
  if (isW3c) {
    if (score == null) return "#d4d4d4";
    if (score >= 50) return "#000000";
    if (score >= 30) return "#525252";
    return "#a3a3a3";
  }
  if (score == null) return "#475569";
  if (score >= 70) return "#dc2626";
  if (score >= 50) return "#f97316";
  if (score >= 30) return "#f59e0b";
  return "#22c55e";
}

function heightOf(v) {
  return Math.max(0.15, (v ?? 0) / 25);
}

function hash01(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (h % 1000) / 1000;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shortName(name) {
  const parts = name.split(" ").filter((p) => !/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)$/.test(p));
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function Bar({ b, hovered, onEnter, onLeave, isW3c }) {
  const group = useRef(null);
  const body = useRef(null);
  const phase = useMemo(() => hash01(b.id) * Math.PI * 2, [b.id]);

  const h = heightOf(b.score);
  const hh = heightOf(b.hours);
  const color = scoreToColor(b.score, isW3c);
  const status = scoreStatus(b.score);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current || !body.current) return;
    const breathe = 1 + Math.sin(t * 1.3 + phase) * (isW3c ? 0.008 : 0.025);
    body.current.scale.y = breathe;
    const targetY = hovered ? 0.28 : 0;
    group.current.position.y += (targetY - group.current.position.y) * 0.12;
    group.current.rotation.z = Math.sin(t * 0.7 + phase) * 0.012;
  });

  return (
    <group
      ref={group}
      position={[b.x, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onEnter(b.id);
      }}
      onPointerOut={() => onLeave()}
    >
      <RoundedBox
        ref={body}
        args={[0.75, 1, 0.75]}
        radius={0.09}
        smoothness={4}
        position={[0, h / 2, 0]}
        scale={[1, h, 1]}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.05}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : isW3c ? 0 : 0.12}
        />
      </RoundedBox>

      <RoundedBox args={[0.24, 1, 0.24]} radius={0.05} position={[0.58, hh / 2, 0]} scale={[1, hh, 1]}>
        <meshStandardMaterial
          color={isW3c ? "#a3a3a3" : "#e2e8f0"}
          transparent
          opacity={isW3c ? 0.9 : 0.45}
          roughness={0.6}
        />
      </RoundedBox>

      <Html position={[0, 0.02, 0.9]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div
          className={`whitespace-nowrap text-[9px] font-medium tracking-wide ${
            isW3c ? "text-black" : "text-white/70"
          }`}
        >
          {shortName(b.name)}
        </div>
      </Html>

      {hovered && (
        <Html position={[0, h + 0.65, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div
            className={`rounded-xl px-3 py-2 text-left shadow-lg ${
              isW3c ? "border-2 border-black bg-white text-black" : "border border-white/20 bg-slate-900/95 text-white"
            }`}
          >
            <p className="text-xs font-bold">{b.name}</p>
            <p className="mt-0.5 text-[11px]">
              {status.level} risk · {b.score ?? "—"} pts
            </p>
            <p className="text-[11px] opacity-80">{b.hours ?? 0} teaching hours</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function DeptGroup({ name, x, width, color, isW3c, bars, hovered, onEnter, onLeave }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.02, 0]}>
        <planeGeometry args={[width, 5.4]} />
        <meshStandardMaterial
          color={isW3c ? "#f5f5f5" : color}
          transparent
          opacity={isW3c ? 1 : 0.14}
          roughness={1}
        />
      </mesh>
      <Html position={[x, 0.18, 1.95]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div
          className={`text-[10px] font-bold uppercase tracking-widest ${
            isW3c ? "text-black" : "text-white/60"
          }`}
        >
          {name}
        </div>
      </Html>
      {bars.map((b) => (
        <Bar key={b.id} b={b} hovered={hovered === b.id} onEnter={onEnter} onLeave={onLeave} isW3c={isW3c} />
      ))}
    </>
  );
}

function Fireflies({ isW3c }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const rand = mulberry32(20260819);
    const pts = new Float32Array(75 * 3);
    for (let i = 0; i < 75; i++) {
      pts[i * 3] = (rand() - 0.5) * 15;
      pts[i * 3 + 1] = rand() * 6 + 0.4;
      pts[i * 3 + 2] = (rand() - 0.5) * 9;
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  if (isW3c) return null;
  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#c7d2fe"
        size={0.045}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

function Bars({ items, avgScore, isW3c }) {
  const [hovered, setHovered] = useState(null);
  const avgH = heightOf(avgScore);
  const spanHalf = items.span / 2 + 0.9;

  return (
    <group>
      {items.groups.map((g) => (
        <DeptGroup
          key={g.name}
          name={g.name}
          x={g.x}
          width={g.width}
          color={g.deptColor}
          isW3c={isW3c}
          bars={items.bars.filter((b) => b.department === g.name)}
          hovered={hovered}
          onEnter={setHovered}
          onLeave={() => setHovered(null)}
        />
      ))}

      {avgScore != null && (
        <group>
          <Line
            points={[
              [-spanHalf, avgH, 0],
              [spanHalf, avgH, 0],
            ]}
            color={isW3c ? "#000000" : "#fca5a5"}
            lineWidth={1.5}
            dashed
            dashSize={0.18}
            gapSize={0.12}
            transparent
            opacity={isW3c ? 1 : 0.7}
          />
          <Html position={[spanHalf, avgH, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
            <div className={`whitespace-nowrap text-[10px] font-bold ${isW3c ? "text-black" : "text-red-200/90"}`}>
              team avg · {avgScore} pts
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function firstGivenName(name) {
  const parts = name.split(" ").filter((p) => !/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)$/.test(p));
  return parts[0] || name;
}

export default function WorkloadDensity({ data }) {
  const { isW3c } = useUi();

  const items = useMemo(() => {
    const rows = data.workload ?? [];
    const deptMap = new Map();
    for (const w of rows) {
      if (!deptMap.has(w.department)) deptMap.set(w.department, []);
      deptMap.get(w.department).push(w);
    }

    const depts = [...deptMap.keys()].sort();
    const bars = [];
    const groups = [];
    let cursor = 0;

    depts.forEach((dept, gi) => {
      const color = DEPT_COLORS[gi % DEPT_COLORS.length];
      const members = deptMap
        .get(dept)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      const startX = cursor;
      members.forEach((m, i) => {
        bars.push({
          id: m.id,
          x: startX + i * BAR_GAP,
          name: m.name,
          department: m.department,
          score: m.risk_score,
          hours: m.teaching_hours,
          deptColor: color,
        });
      });
      const width = Math.max(2.4, (members.length - 1) * BAR_GAP + 2.4);
      groups.push({
        name: dept,
        x: startX + (members.length - 1) * BAR_GAP / 2,
        width,
        deptColor: color,
      });
      cursor = startX + width + GROUP_GAP;
    });

    const span = cursor - GROUP_GAP;
    const shift = -span / 2;
    bars.forEach((b) => {
      b.x += shift;
    });
    groups.forEach((g) => {
      g.x += shift;
    });

    const scored = bars.filter((b) => b.score != null);
    const avgScore = scored.length ? Math.round((scored.reduce((a, b) => a + b.score, 0) / scored.length) * 10) / 10 : null;

    return { bars, groups, span, avgScore };
  }, [data.workload]);

  const heaviest = items.bars.slice().sort((a, b) => (b.hours ?? 0) - (a.hours ?? 0))[0];
  const hottest = items.bars.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];

  const caption =
    !heaviest || !hottest
      ? null
      : heaviest.id === hottest.id
        ? `${firstGivenName(heaviest.name)} is carrying the heaviest load right now (${heaviest.hours}h / week) and also leads in risk (${heaviest.score} pts). Might be worth a friendly check-in.`
        : `${firstGivenName(heaviest.name)} has the heaviest schedule (${heaviest.hours}h / week), while ${firstGivenName(hottest.name)} shows the highest risk (${hottest.score} pts). A little support goes a long way.`;

  return (
    <section
      className="w-full"
      aria-label="3D workload density visualizer"
      role="img"
      aria-description="Colored bars show burnout risk, slim bars show weekly teaching hours, grouped by department with a team-average line. Hover a bar for details."
    >
      <div
        className={`h-[400px] w-full overflow-hidden rounded-2xl ${
          isW3c ? "border-2 border-black bg-white" : "border border-white/20 bg-indigo-950/40 shadow-xl"
        }`}
      >
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 4.8, 8.5], fov: 42 }}>
          <color attach="background" args={[isW3c ? "#ffffff" : "#1e1b4b"]} />
          <fog attach="fog" args={[isW3c ? "#ffffff" : "#1e1b4b", 14, 24]} />
          <ambientLight intensity={isW3c ? 1.4 : 0.65} />
          <directionalLight position={[4, 8, 5]} intensity={isW3c ? 1.2 : 1.5} />
          <pointLight position={[-5, 3, -4]} intensity={isW3c ? 0 : 0.7} color="#ffb27a" />
          <Bars items={items} avgScore={items.avgScore} isW3c={isW3c} />
          <gridHelper
            args={[14, 14, isW3c ? "#000000" : "#818cf8", isW3c ? "#000000" : "#4f46e5"]}
            position={[0, 0, 0]}
          />
          <Fireflies isW3c={isW3c} />
          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={18}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.15}
          />
        </Canvas>
      </div>

      <div
        className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium ${
          isW3c ? "text-black" : "text-white/60"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: "#dc2626" }} />
          Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: "#f97316" }} />
          High
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: "#f59e0b" }} />
          Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: "#22c55e" }} />
          Low
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-sm"
            style={{ background: isW3c ? "#a3a3a3" : "#e2e8f0", opacity: 0.8 }}
          />
          slim bar = teaching hours
        </span>
      </div>

      {caption && (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            isW3c ? "border-2 border-black bg-white text-black" : "border border-white/15 bg-white/5 text-white/85"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${isW3c ? "bg-black" : "bg-indigo-400"}`}
          />
          {caption}
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {items.groups.map((g) => (
          <li key={g.name}>
            <p
              className={`text-[11px] font-bold uppercase tracking-widest ${isW3c ? "text-black" : "text-white/50"}`}
            >
              {g.name}
            </p>
            <ul className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {items.bars
                .filter((b) => b.department === g.name)
                .map((b) => (
                  <li
                    key={b.id}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs ${
                      isW3c ? "border-2 border-black bg-white" : "border border-white/15 bg-white/5"
                    }`}
                  >
                    <span className={`flex min-w-0 items-center gap-2 ${isW3c ? "text-black" : "text-white/80"}`}>
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ background: scoreToColor(b.score, isW3c) }}
                      />
                      <span className="truncate">{b.name}</span>
                    </span>
                    <span className={`shrink-0 font-bold ${isW3c ? "text-black" : "text-white"}`}>
                      {b.score ?? "—"} · {b.hours}h
                    </span>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}