/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** CommunityRankingList Molecule: Leaderboard for course students. */
import React from "react";
import Image from "next/image";
import { Typography } from "@/components/theme";
import { ExternalLink } from "lucide-react";
import { cx } from "@/components/theme/utils";

interface RankingItem {
  id: string;
  name: string;
  avatar: string;
  ranking: number;
  score: number;
  isCurrentUser?: boolean;
}

const DUMMY_RANKINGS: RankingItem[] = [
  { id: "1", name: "Abebe Kebede", avatar: "https://i.pravatar.cc/150?u=30", ranking: 98, score: 120 },
  { id: "2", name: "Abebe Kebede", avatar: "https://i.pravatar.cc/150?u=31", ranking: 99, score: 120 },
  { id: "3", name: "Abebe Kebede", avatar: "https://i.pravatar.cc/150?u=32", ranking: 100, score: 120, isCurrentUser: true },
  { id: "4", name: "Abebe Kebede", avatar: "https://i.pravatar.cc/150?u=33", ranking: 101, score: 120 },
  { id: "5", name: "Abebe Kebede", avatar: "https://i.pravatar.cc/150?u=34", ranking: 102, score: 120 },
];

export const CommunityRankingList: React.FC = () => {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0]/80 overflow-hidden flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <Typography className="text-[18px] font-black text-[#111827]">Community Ranking</Typography>
        <ExternalLink size={20} className="text-[#64748B] cursor-pointer hover:text-[#114B5F] transition-colors" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="px-6 pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Student</th>
              <th className="px-6 pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Ranking</th>
              <th className="px-6 pb-4 text-[12px] font-black text-[#111827] uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_RANKINGS.map((item) => (
              <tr 
                key={item.id} 
                className={cx(
                  "transition-colors",
                  item.isCurrentUser ? "bg-[#114B5F] text-white" : "hover:bg-[#F8FAFC] text-[#64748B]"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E2E8F0]">
                      <Image src={item.avatar} alt={item.name} width={32} height={32} className="object-cover" />
                    </div>
                    <Typography className={cx("text-[14px] font-bold", item.isCurrentUser ? "text-white" : "text-[#111827]")}>
                      {item.name}
                    </Typography>
                  </div>
                </td>
                <td className="px-6 py-4 text-[14px] font-bold">{item.ranking}</td>
                <td className="px-6 py-4 text-[14px] font-bold">{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommunityRankingList;
/** ################################ /COMPONENT ############################# */
