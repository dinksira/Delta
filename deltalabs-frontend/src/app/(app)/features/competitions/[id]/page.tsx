import React from "react";
import { CompetitionDetailPage } from "@/modules/Competition/views/CompetitionDetail/CompetitionDetailPage";

export function generateStaticParams() {
  return [];
}

export const Page: React.FC = () => {
  return <CompetitionDetailPage />;
};

export default Page;
