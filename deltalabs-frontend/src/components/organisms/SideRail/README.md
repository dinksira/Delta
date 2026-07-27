# SideRail

**Atomic Level**: Organism  
**Status**: Stable

A high-fidelity vertical navigation sidebar designed for complex desktop applications. It provides a consistent navigation experience across the platform and supports a collapsed state to maximize content area.

## 🚀 Usage

```tsx
import { SideRail } from "@/components/organisms/SideRail";
import { LayoutDashboard, BookOpen, Users, Settings } from "lucide-react";

const navItems = [
  { id: "dash", label: "Dashboard", icon: <LayoutDashboard />, href: "/dashboard" },
  { id: "courses", label: "My Courses", icon: <BookOpen />, href: "/courses" },
];

const DesktopLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <SideRail items={navItems} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};
```

## ⚙️ Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `SideRailItem[]` | `[]` | List of navigation items. |
| `collapsed` | `boolean` | `false` | Toggles between expanded (256px) and collapsed (80px) states. |
| `activeId` | `string` | `undefined` | Highlights a specific item by ID. |
| `header` | `ReactNode` | `undefined` | Optional slot for branding/logo at the top. |
| `footer` | `ReactNode` | `undefined` | Optional slot for user profile/settings at the bottom. |

## 📏 Design Standards
- Uses `bg-surface-primary` for the container.
- Active items use `bg-primary-50` with a 4px left-accent border.
- Transitions use `duration-300` for smooth expansion/collapse.
