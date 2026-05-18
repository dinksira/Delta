/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ProcessBarChart Molecule: Visualizes performance categories. */
import React from "react";
import { Typography } from "@/components/theme";
import { ChevronDown } from "lucide-react";
import { cx } from "@/components/theme/utils";

interface ChartBar {
  label: string;
  value: number;
  max: number;
  color: string;
  gradient: string;
}

const DATA: ChartBar[] = [
  { label: "Multiple choice", value: 300, max: 400, color: "#3B82F6", gradient: "from-[#3B82F6] to-[#60A5FA]" },
  { label: "True/ False", value: 250, max: 400, color: "#84CC16", gradient: "from-[#84CC16] to-[#A3E635]" },
  { label: "Matching", value: 280, max: 400, color: "#F59E0B", gradient: "from-[#F59E0B] to-[#FBBF24]" },
];

export const ProcessBarChart: React.FC = () => {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0]/80 p-6 flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <Typography className="text-[18px] font-black text-[#111827]">Graphical Process Representation</Typography>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
          <Typography className="text-[13px] font-bold text-[#114B5F]">Bar Chart</Typography>
          <ChevronDown size={14} className="text-[#114B5F]" />
        </div>
      </div>

      <div className="flex-1 flex items-end justify-around pt-10 pb-4 relative">
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-10">
          <Typography className="text-[11px] font-bold text-[#94A3B8]">400</Typography>
          <Typography className="text-[11px] font-bold text-[#94A3B8]">300</Typography>
          <Typography className="text-[11px] font-bold text-[#94A3B8]">200</Typography>
          <Typography className="text-[11px] font-bold text-[#94A3B8]">100</Typography>
          <Typography className="text-[11px] font-bold text-[#94A3B8]">0</Typography>
        </div>

        {/* Bars */}
        {DATA.map((bar, idx) => (
          <div key={idx} className="flex flex-col items-center gap-4 flex-1">
            <div className="relative w-12 h-[200px] bg-[#F1F5F9] rounded-full overflow-hidden">
              <div 
                className={cx("absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t", bar.gradient)}
                style={{ height: `${(bar.value / bar.max) * 100}%` }}
              />
            </div>
            <Typography className="text-[13px] font-bold text-[#64748B] text-center">{bar.label}</Typography>
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-col gap-4 pl-8 border-l border-[#E2E8F0]/40">
          <Typography className="text-[14px] font-black text-[#111827]">Legend</Typography>
          <div className="space-y-3">
            {DATA.map((bar, idx) => (
              <div key={idx} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bar.color }} />
                  <Typography className="text-[12px] font-bold text-[#64748B]">{bar.label}</Typography>
                </div>
                <Typography className="text-[12px] font-black text-[#111827]">{bar.value} / {bar.max}</Typography>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessBarChart;
/** ################################ /COMPONENT ############################# */
