/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** GradeSummaryTable Molecule: Displays assignment breakdown and weightage. */
import React from "react";
import { Typography } from "@/components/theme";

interface GradeRow {
  type: string;
  weight: string;
  grade: string;
  weightedGrade: string;
}

const DUMMY_GRADES: GradeRow[] = [
  { type: "Lab", weight: "0%", grade: "0%", weightedGrade: "0%" },
  { type: "Graded Test", weight: "90%", grade: "0%", weightedGrade: "0%" },
  { type: "Exercise", weight: "10%", grade: "0%", weightedGrade: "0%" },
  { type: "Exercise", weight: "10%", grade: "0%", weightedGrade: "0%" },
  { type: "Exercise", weight: "10%", grade: "0%", weightedGrade: "0%" },
];

export const GradeSummaryTable: React.FC = () => {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0]/80 p-6 flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <Typography className="text-[18px] font-black text-[#111827]">Grade Summary</Typography>
        <Typography className="text-[14px] font-black text-[#114B5F] underline cursor-pointer hover:text-[#114B5F]/80">
          View all
        </Typography>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E2E8F0]/40">
              <th className="pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Assignment type</th>
              <th className="pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Weight</th>
              <th className="pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Grade</th>
              <th className="pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Weighted-Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]/40">
            {DUMMY_GRADES.map((row, idx) => (
              <tr key={idx} className="group hover:bg-[#F8FAFC]/50 transition-colors">
                <td className="py-4 text-[14px] font-bold text-[#64748B]">{row.type}</td>
                <td className="py-4 text-[14px] font-bold text-[#64748B]">{row.weight}</td>
                <td className="py-4 text-[14px] font-bold text-[#64748B]">{row.grade}</td>
                <td className="py-4 text-[14px] font-bold text-[#64748B]">{row.weightedGrade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeSummaryTable;
/** ################################ /COMPONENT ############################# */
