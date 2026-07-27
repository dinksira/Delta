"use client";

import React, { useState } from "react";
import { CartView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";
import type { ResourceSidebarTabId } from "@/components/organisms/ResourceSidebar";

const CartPage: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<ResourceSidebarTabId>('cart');

  return (
    <CourseProvider>
      <CartView
        activeSidebarTab={activeSidebarTab}
        onSidebarTabChange={setActiveSidebarTab}
      />
    </CourseProvider>
  );
};

export default CartPage;
