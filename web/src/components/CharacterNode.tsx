"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export interface CharacterNodeData {
  id: string;
  name: string;
  aliases?: string[];
  knownCount?: number;
  isSelected?: boolean;
}

export const CharacterNode = memo(function CharacterNode({
  data,
}: {
  data: CharacterNodeData;
}) {
  const name = data?.name?.trim() || "Unknown Character";
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "C";

  const knownCount = typeof data?.knownCount === "number" ? data.knownCount : 0;
  const isSelected = Boolean(data?.isSelected);
  const aliases = Array.isArray(data?.aliases) ? data.aliases : [];

  return (
    <div
      className={`relative px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? "bg-[#1E1E4E] border-[#7C5CFF] shadow-[0_0_24px_rgba(108,71,255,0.4)] ring-2 ring-[#6C47FF]/60"
          : "bg-[#151538]/95 border-white/[0.08] hover:border-[#6C47FF]/40 hover:bg-[#1A1A44] shadow-lg shadow-black/40"
      }`}
      style={{ minWidth: "190px", maxWidth: "250px" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-[#6C47FF] !border-2 !border-[#0B0B1E] rounded-full"
      />

      <div className="flex items-center space-x-3">
        {/* Glowing Avatar circle */}
        <div
          className={`w-11 h-11 rounded-2xl p-[1.5px] shrink-0 transition-transform ${
            isSelected
              ? "bg-gradient-to-tr from-[#6C47FF] to-[#9B7DFF] shadow-md shadow-[#6C47FF]/50 scale-105"
              : "bg-gradient-to-tr from-white/10 to-white/5"
          }`}
        >
          <div className="w-full h-full bg-[#151538] rounded-[14px] flex items-center justify-center font-bold text-xs text-white">
            {initials}
          </div>
        </div>

        {/* Character Name & Aliases */}
        <div className="overflow-hidden flex-1">
          <h3 className="text-sm font-bold text-white truncate" title={name}>
            {name}
          </h3>
          {aliases.length > 0 ? (
            <p className="text-[11px] text-[#A9A9C9] truncate" title={aliases.join(", ")}>
              {aliases.join(", ")}
            </p>
          ) : (
            <span className="text-[10px] text-[#6F6F94] block">Protagonist</span>
          )}
        </div>
      </div>

      {/* Facts known badge */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
        <span className="text-[#6F6F94] text-[10px] uppercase font-mono">Facts Known</span>
        <span
          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
            knownCount > 0
              ? "bg-[#6C47FF]/20 text-indigo-300 border border-[#6C47FF]/40"
              : "bg-white/[0.04] text-[#6F6F94]"
          }`}
        >
          {knownCount} {knownCount === 1 ? "fact" : "facts"}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-[#7C5CFF] !border-2 !border-[#0B0B1E] rounded-full"
      />
    </div>
  );
});
