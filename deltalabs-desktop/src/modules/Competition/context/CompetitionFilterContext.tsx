import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

import type { CompetitionCategory, CompetitionContextValue } from "@/modules/Competition/types";

const CompetitionFilterContext = createContext<CompetitionContextValue | undefined>(undefined);

export interface CompetitionFilterProviderProps {
  children: ReactNode;
  defaultCategory?: CompetitionCategory;
}

export function CompetitionFilterProvider({
  children,
  defaultCategory = "active",
}: Readonly<CompetitionFilterProviderProps>) {
  const [activeCategory, setActiveCategoryState] = useState<CompetitionCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const setActiveCategory = useCallback((category: CompetitionCategory) => {
    setActiveCategoryState(category);
  }, []);

  const contextValue: CompetitionContextValue = {
    activeCategory,
    searchQuery,
    setActiveCategory,
    setSearchQuery,
  };

  return (
    <CompetitionFilterContext.Provider value={contextValue}>
      {children}
    </CompetitionFilterContext.Provider>
  );
}

export function useCompetitionFilter(): CompetitionContextValue {
  const context = useContext(CompetitionFilterContext);
  if (context === undefined) {
    throw new Error("useCompetitionFilter must be used within a CompetitionFilterProvider");
  }
  return context;
}

export default CompetitionFilterContext;
