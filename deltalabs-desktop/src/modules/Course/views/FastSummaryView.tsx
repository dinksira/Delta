"use client";

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** FastSummaryView: Orchestrates the Fast Summary module. */
import React, { useState, useEffect } from "react";
import { FastSummaryLayout } from "../components/summary/templates/FastSummaryLayout";
import { SummaryLobby } from "../components/summary/organisms/SummaryLobby";
import { FastNoteWorkspace } from "../components/summary/organisms/FastNoteWorkspace";
import { FastExerciseWorkspace } from "../components/summary/organisms/FastExerciseWorkspace";
import { type SummaryTabId } from "../components/summary/molecules/FastSummarySideNav";

export const FastSummaryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SummaryTabId>("summary");
  
  // Reset scroll when switching sub-tabs
  useEffect(() => {
    const container = document.querySelector('main.overflow-y-auto');
    if (container) {
      container.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <FastSummaryLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "summary" && (
        <SummaryLobby />
      )}

      {activeTab === "note" && (
        <FastNoteWorkspace />
      )}

      {activeTab === "exercise" && (
        <FastExerciseWorkspace />
      )}
    </FastSummaryLayout>
  );
};

export default FastSummaryView;
/** ################################ /COMPONENT ############################# */
