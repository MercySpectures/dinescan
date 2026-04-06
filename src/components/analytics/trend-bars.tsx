interface TrendPoint {
  date: string;
  count: number;
}

interface TrendBarsProps {
  points: TrendPoint[];
}

export default function TrendBars({ points }: TrendBarsProps) {
  const maxCount = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="flex h-44 items-end gap-2">
      {points.map((point) => (
        <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-md bg-green-500/90 transition-all"
            style={{ height: `${Math.max((point.count / maxCount) * 160, 6)}px` }}
            title={`${point.date}: ${point.count} scans`}
          />
          <p className="text-[10px] text-gray-400">{point.date.slice(5)}</p>
        </div>
      ))}
    </div>
  );
}

