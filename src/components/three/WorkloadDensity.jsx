import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useUi } from "../ui";

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

function Bars({ items, isW3c }) {
  const [hovered, setHovered] = useState(null);

  return (
    <group>
      {items.map((b, i) => {
        const h = Math.max(0.15, (b.score ?? 0) / 25);
        const color = scoreToColor(b.score, isW3c);
        const isHovered = hovered === i;
        return (
          <group key={b.id} position={[b.x, 0, 0]}>
            <mesh
              position={[0, h / 2, 0]}
              scale={isHovered ? [1.15, 1.05, 1.15] : [1, 1, 1]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(i);
              }}
              onPointerOut={() => setHovered(null)}
            >
              <boxGeometry args={[0.75, 1, 0.75]} />
              <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
            </mesh>
            {isHovered && (
              <Html position={[0, h + 0.6, 0]} center style={{ pointerEvents: "none" }}>
                <div
                  className={`rounded-md px-3 py-1.5 text-xs font-bold shadow-lg ${
                    isW3c
                      ? "border-2 border-black bg-white text-black"
                      : "border border-white/20 bg-slate-900/95 text-white"
                  }`}
                >
                  {b.name} · {b.score ?? "—"}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function WorkloadDensity({ data }) {
  const { isW3c } = useUi();

  const items = useMemo(
    () =>
      (data.workload ?? []).map((w, i) => ({
        id: w.id,
        x: i - (data.workload.length - 1) / 2,
        name: w.name,
        score: w.risk_score,
        hours: w.teaching_hours,
      })),
    [data.workload]
  );

  return (
    <section
      className="w-full"
      aria-label="3D workload density visualizer"
      role="img"
      aria-description="Bars represent each faculty member. Height and color map to burnout risk score."
    >
      <div
        className={`h-[380px] w-full overflow-hidden rounded-2xl ${
          isW3c ? "border-2 border-black bg-white" : "border border-white/20 bg-indigo-950/40 shadow-xl"
        }`}
      >
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 4.2, 7.5], fov: 45 }}>
          <color attach="background" args={[isW3c ? "#ffffff" : "#1e1b4b"]} />
          <ambientLight intensity={isW3c ? 1.4 : 0.75} />
          <directionalLight position={[4, 8, 5]} intensity={isW3c ? 1.2 : 1.6} />
          <Bars items={items} isW3c={isW3c} />
          <gridHelper
            args={[14, 14, isW3c ? "#000000" : "#818cf8", isW3c ? "#000000" : "#4f46e5"]}
            position={[0, 0, 0]}
          />
          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={16}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
      </div>

      <ul className={`mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3`}>
        {items.map((b) => (
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
    </section>
  );
}