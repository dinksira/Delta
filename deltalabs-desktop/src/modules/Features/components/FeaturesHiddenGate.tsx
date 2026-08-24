"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useFeaturesLayoutAccess } from "@/modules/Features/hooks/useFeaturesLayoutAccess";
import { featuresPathWithHiddenNotice } from "@/modules/Features/featureHiddenNotice";
import { featureKeyToTabParam } from "@/modules/Features/featureWorkspaceRoutes";

type FeaturesHiddenGateProps = Readonly<{
  /** Catalog feature key to guard (e.g. `school`). */
  featureKey: string;
  children: ReactNode;
}>;

/** Redirects away when the user has hidden this feature from their hub. */
export function FeaturesHiddenGate({ featureKey, children }: FeaturesHiddenGateProps) {
  const router = useRouter();
  const { isFeatureHidden, isLayoutReady } = useFeaturesLayoutAccess();
  const key = featureKeyToTabParam(featureKey);

  useEffect(() => {
    if (!isLayoutReady) return;
    if (isFeatureHidden(key)) {
      router.replace(featuresPathWithHiddenNotice(key));
    }
  }, [isFeatureHidden, isLayoutReady, key, router]);

  if (!isLayoutReady) return children;
  if (isFeatureHidden(key)) return null;
  return children;
}
