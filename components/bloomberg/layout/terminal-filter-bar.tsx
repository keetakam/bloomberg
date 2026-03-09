"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAtom } from "jotai";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  show10DAtom,
  showAvatAtom,
  showCADAtom,
  showFuturesAtom,
  showMoversAtom,
  showRatiosAtom,
  showVolatilityAtom,
  showYTDAtom,
} from "../atoms";
import { activeWatchlistAtom } from "../atoms/terminal-ui";
import { BloombergButton } from "../core/bloomberg-button";
import { bloombergColors } from "../lib/theme-config";
import { type Language, translations } from "../lib/translations";
import type { FilterState } from "../types";

type TerminalFilterBarProps = {
  isDarkMode: boolean;
  language: Language;
  watchlists: Array<{ name: string; indices: string[] }>;
};

export function TerminalFilterBar({ isDarkMode, language, watchlists }: TerminalFilterBarProps) {
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;
  const t = translations[language];

  // Use Jotai atoms directly for state management
  const [showMovers, setShowMovers] = useAtom(showMoversAtom);
  const [showVolatility, setShowVolatility] = useAtom(showVolatilityAtom);
  const [showRatios, setShowRatios] = useAtom(showRatiosAtom);
  const [showFutures, setShowFutures] = useAtom(showFuturesAtom);
  const [showAvat, setShowAvat] = useAtom(showAvatAtom);
  const [show10D, setShow10D] = useAtom(show10DAtom);
  const [showYTD, setShowYTD] = useAtom(showYTDAtom);
  const [showCAD, setShowCAD] = useAtom(showCADAtom);
  const [activeWatchlist, setActiveWatchlist] = useAtom(activeWatchlistAtom);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8" />;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 bg-[${colors.surface}] px-2 py-1 text-[${colors.accent}] text-xs sm:text-sm`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1">
          <span className="font-bold" suppressHydrationWarning>
            {activeWatchlist ? activeWatchlist : "Standard"}
          </span>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-mono text-xs">
          <DropdownMenuItem onClick={() => setActiveWatchlist(null)}>Standard</DropdownMenuItem>
          {watchlists.map((list) => (
            <DropdownMenuItem key={list.name} onClick={() => setActiveWatchlist(list.name)}>
              {list.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1">
        <Checkbox
          id="movers"
          checked={showMovers}
          onCheckedChange={(checked) => setShowMovers(!!checked)}
          className="h-3 w-3 rounded-none border-gray-500 data-[state=checked]:bg-gray-500"
        />
        <label htmlFor="movers">{t.movers}</label>
      </div>

      <div className="flex items-center gap-1">
        <Checkbox
          id="volatility"
          checked={showVolatility}
          onCheckedChange={(checked) => setShowVolatility(!!checked)}
          className="h-3 w-3 rounded-none border-gray-500 data-[state=checked]:bg-gray-500"
        />
        <label htmlFor="volatility">{t.volatility}</label>
      </div>

      <div className="flex items-center gap-1">
        <Checkbox
          id="ratios"
          checked={showRatios}
          onCheckedChange={(checked) => setShowRatios(!!checked)}
          className="h-3 w-3 rounded-none border-gray-500 data-[state=checked]:bg-gray-500"
        />
        <label htmlFor="ratios">{t.ratios}</label>
      </div>

      <div className="flex items-center gap-1">
        <Checkbox
          id="futures"
          checked={showFutures}
          onCheckedChange={(checked) => setShowFutures(!!checked)}
          className="h-3 w-3 rounded-none border-gray-500 data-[state=checked]:bg-gray-500"
        />
        <label htmlFor="futures">{t.futures}</label>
      </div>

      <div className="flex items-center gap-1">
        <Checkbox
          id="avat"
          checked={showAvat}
          onCheckedChange={(checked) => setShowAvat(!!checked)}
          className="h-3 w-3 rounded-none border-gray-500 data-[state=checked]:bg-gray-500"
        />
        <label htmlFor="avat">Δ AVAT</label>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <BloombergButton color={show10D ? "green" : "red"} className="flex items-center gap-1">
            <span>10D</span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </BloombergButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-mono text-xs">
          <DropdownMenuItem onClick={() => setShow10D(false)}>Off</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShow10D(true)}>10D</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <BloombergButton color={showYTD ? "green" : "red"} className="flex items-center gap-1">
            <span>{showYTD ? t.ytd : t.daily}</span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </BloombergButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-mono text-xs">
          <DropdownMenuItem onClick={() => setShowYTD(false)}>{t.daily}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowYTD(true)}>{t.ytd}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <BloombergButton color={showCAD ? "green" : "red"} className="flex items-center gap-1">
            <span>{showCAD ? "CAD" : "USD"}</span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </BloombergButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-mono text-xs">
          <DropdownMenuItem onClick={() => setShowCAD(false)}>USD</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCAD(true)}>CAD</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
