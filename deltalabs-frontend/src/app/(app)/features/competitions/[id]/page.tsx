import React from "react";
import { CompetitionDetailPage } from "@/modules/Competition/views/CompetitionDetail/CompetitionDetailPage";

export function generateStaticParams() {
  return [
    { id: "comp-1" },
    { id: "comp-2" },
    { id: "comp-3" },
    { id: "comp-4" },
    { id: "comp-5" },
    { id: "comp-6" },
    { id: "comp-7" },
    { id: "comp-8" },
    { id: "comp-9" },
    { id: "comp-10" },
  ];
}

export const Page: React.FC = () => {
  return <CompetitionDetailPage />;
};

export default Page;
