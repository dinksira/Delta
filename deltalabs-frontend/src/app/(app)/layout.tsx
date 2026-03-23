import type { ReactNode } from "react";

export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex min-h-full flex-col">{children}</div>;
}
