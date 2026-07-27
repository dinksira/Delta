# NativeTitleBar

**Atomic Level**: Atom  
**Status**: Stable (Electron Only)

A custom title bar component designed for the Delta Labs desktop application. It provides a draggable region for the frameless window and standard window controls (Minimize, Maximize, Close).

## 🚀 Usage

```tsx
import { NativeTitleBar } from "@/components/atoms/NativeTitleBar";

const Layout = () => {
  return (
    <div className="flex flex-col h-screen">
      <NativeTitleBar variant="default" title="Delta Labs Workspace" />
      <main className="flex-1">Content</main>
    </div>
  );
};
```

## 🎨 Variants

- **default**: Matches the standard canvas background with a subtle border.
- **translucent**: Uses backdrop-blur for a "glass" effect.
- **solid**: Uses the primary surface color for a bold look.

## ⚙️ Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `TitleBarVariant` | `"default"` | Visual style variant. |
| `title` | `string` | `"Delta Labs"` | Title text displayed in the center/left. |
| `showControls` | `boolean` | `true` | Whether to show window controls. |

## 🔒 Security Note
This component requires the `window.electron` bridge to be exposed via the preload script. It will automatically hide itself if not running in an Electron environment.
