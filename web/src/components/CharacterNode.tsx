"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export interface CharacterNodeData {
  id: string;
  name: string;
  aliases?: string[];
  knownCount: number;
  isSelected?: boolean;
}

export const CharacterNode = memo(function CharacterNode({
  data,
}: {
  data: CharacterNodeData;
}) {
  const initials = data.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xl ${
        data.isSelected
          ? "bg-zinc-900 border-indigo-400 ring-2 ring-indigo-500/50 shadow-indigo-500/20"
          : "bg-zinc-900/90 border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-800"
      }`}
      style={{ minWidth: "180px" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 bg-indigo-500 border-2 border-zinc-900 rounded-full"
      />

      <div className="flex items-center space-x-3">
        {/* Avatar circle */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
          {initials}
        </div>

        {/* Details */}
        <div className="overflow-hidden">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">
            {data.name}
          </h3>
          {data.aliases && data.aliases.length > 0 && (
            <p className="text-[11px] text-zinc-400 truncate">
              {data.aliases.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Facts known pill */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
        <span className="text-zinc-400">Knowledge:</span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            data.knownCount > 0
              ? "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {data.knownCount} {data.knownCount === 1 ? "fact" : "facts"}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 bg-violet-500 border-2 border-zinc-900 rounded-full"
      />
    </div>
  );
});
