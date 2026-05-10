import { useQuery } from "@tanstack/react-query";
import { resolveThumbnail } from "../../services/thumbnails";
import type { Act } from "../../types";

interface ActBlockProps {
  act: Act;
  selected: boolean;
  conflicted: boolean;
  stageColor: string;
  topPct: number;
  heightPct: number;
  heightPx: number;
  onClick: () => void;
}

export function ActBlock({
  act,
  selected,
  conflicted,
  stageColor,
  topPct,
  heightPct,
  heightPx,
  onClick,
}: ActBlockProps) {
  const { data: thumbnail } = useQuery({
    queryKey: ["thumbnail", act.id],
    queryFn: () => resolveThumbnail(act.id, act.name, act.thumbnailUrl),
    staleTime: Infinity,
  });

  const isSmall = heightPx < 48;
  const hasImage = heightPx >= 80;

  let ring = "ring-transparent";
  if (conflicted) ring = "ring-2 ring-yellow-400";
  else if (selected) ring = `ring-2 ring-white/60`;

  const opacity = selected ? "opacity-100" : "opacity-50 hover:opacity-75";

  return (
    <button
      onClick={onClick}
      title={`${act.name} — click to toggle`}
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        backgroundColor: selected ? stageColor : undefined,
      }}
      className={`absolute inset-x-1 rounded overflow-hidden text-left transition-opacity cursor-pointer z-10
        ${selected ? "" : "bg-neutral-800 dark:bg-neutral-700"}
        ${opacity} ${ring}`}
    >
      <span className="block px-1 py-0.5 text-xs font-semibold text-white truncate leading-tight">
        {act.name}
      </span>
      {!isSmall && (
        <span className="block px-1 text-[10px] text-white/70 truncate">
          {act.startTime.slice(11, 16)} – {act.endTime.slice(11, 16)}
        </span>
      )}
      {hasImage && thumbnail && (
        <img
          src={thumbnail}
          alt={act.name}
          className="w-full h-10 object-cover object-top opacity-60 mt-0.5"
          loading="lazy"
        />
      )}
    </button>
  );
}
