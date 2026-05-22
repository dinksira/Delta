/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** SupplementView: Main view for the course supplements module. */
import React from "react";
import { SupplementLayout } from "../components/supplement/templates/SupplementLayout";
import { ResourceLobby } from "../components/supplement/organisms/ResourceLobby";
import { Typography } from "@/components/theme";

export const SupplementView: React.FC = () => {
  return (
    <SupplementLayout>
      <div className="flex flex-col gap-6">
        <ResourceLobby />
      </div>
    </SupplementLayout>
  );
};

export default SupplementView;
/** ################################ /COMPONENT ############################# */
