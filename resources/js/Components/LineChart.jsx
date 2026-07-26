import { useT } from '@/i18n';
import { useMemo, useState } from 'react';

const DEFAULT_GRAINS = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
];

const W = 640;
const H = 260;
const PAD = { top: 20, right: 16, bottom: 28, left: 32 };

export default function LineChart({
    title = 'Task Progress',
    series,
    grains = DEFAULT_GRAINS,
    unit = 'tasks',
    emptyMessage = 'No task activity in this period yet.',
    defaultGrain = 'monthly',
}) {
    const [grain, setGrain] = useState(() =>
        grains.some((g) => g.key === defaultGrain) ? defaultGrain : grains[0]?.key
    );
    const [hover, setHover] = useState(null);
    const t = useT();

    const data = series?.[grain] ?? [];

    const { points, linePath, areaPath, yTicks, maxY } = useMemo(() => {
        const plotW = W - PAD.left - PAD.right;
        const plotH = H - PAD.top - PAD.bottom;
        const maxY = Math.max(1, ...data.map((d) => d.value));
        const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

        const points = data.map((d, i) => ({
            ...d,
            x: PAD.left + i * stepX,
            y: PAD.top + plotH - (d.value / maxY) * plotH,
        }));

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const areaPath = points.length
            ? `${linePath} L${points[points.length - 1].x},${PAD.top + plotH} L${points[0].x},${PAD.top + plotH} Z`
            : '';

        const ticks = 4;
        const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
            const value = Math.round((maxY / ticks) * (ticks - i));
            return { value, y: PAD.top + (plotH / ticks) * i };
        });

        return { points, linePath, areaPath, yTicks, maxY };
    }, [data, grain]);

    const onMove = (e) => {
        if (!points.length) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        let nearest = points[0];
        for (const p of points) {
            if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
        }
        setHover(nearest);
    };

    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{t(title)}</h2>
                <div className="flex rounded-full bg-ink p-1 text-xs">
                    {grains.map((g) => (
                        <button
                            key={g.key}
                            onClick={() => { setGrain(g.key); setHover(null); }}
                            className={`rounded-full px-3 py-1 font-medium transition ${
                                grain === g.key ? 'bg-gold text-ink' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t(g.label)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
                    <defs>
                        <linearGradient id="taskArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f9b233" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#f9b233" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* recessive gridlines + y labels */}
                    {yTicks.map((t, i) => (
                        <g key={i}>
                            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#ffffff" strokeOpacity="0.06" />
                            <text x={PAD.left - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill="#6b7280">{t.value}</text>
                        </g>
                    ))}

                    {/* x labels */}
                    {points.map((p, i) => (
                        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b7280">{p.label}</text>
                    ))}

                    {areaPath && <path d={areaPath} fill="url(#taskArea)" />}
                    {linePath && <path d={linePath} fill="none" stroke="#f9b233" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

                    {/* hover crosshair + marker */}
                    {hover && (
                        <g>
                            <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={H - PAD.bottom} stroke="#f9b233" strokeOpacity="0.3" />
                            <circle cx={hover.x} cy={hover.y} r="5" fill="#f9b233" stroke="#0b0b0d" strokeWidth="2" />
                        </g>
                    )}
                </svg>

                {hover && (
                    <div
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-ink-800 px-3 py-1.5 text-center shadow-lg"
                        style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}
                    >
                        <div className="text-sm font-bold text-gold">{hover.value}</div>
                        <div className="text-[10px] text-gray-400">{hover.label} · {t(unit)}</div>
                    </div>
                )}
            </div>

            {maxY === 1 && data.every((d) => d.value === 0) && (
                <p className="mt-2 text-center text-xs text-gray-500">{t(emptyMessage)}</p>
            )}
        </div>
    );
}
