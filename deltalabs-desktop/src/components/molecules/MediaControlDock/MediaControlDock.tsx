/**
 * MediaControlDock — floating rounded control dock over the live stage.
 * Composes three IconButtons: microphone toggle, camera toggle, and the red
 * leave action, separated from the toggles by a divider.
 *
 * @example
 * ```tsx
 * <MediaControlDock
 *   isMicMuted={false}
 *   isCameraOff={false}
 *   onToggleMic={toggleMic}
 *   onToggleCamera={toggleCamera}
 *   onLeave={leave}
 * />
 * ```
 */

import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { cn } from "@/lib/utils";

export interface MediaControlDockProps {
  isMicMuted: boolean;
  isCameraOff: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onLeave?: () => void;
  className?: string;
}

export function MediaControlDock({
  isMicMuted,
  isCameraOff,
  onToggleMic,
  onToggleCamera,
  onLeave,
  className,
}: Readonly<MediaControlDockProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full bg-primary-900/70 px-5 py-3 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <IconButton
        icon={isMicMuted ? <MicOff /> : <Mic />}
        label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
        isActive={!isMicMuted}
        onClick={onToggleMic}
      />
      <IconButton
        icon={isCameraOff ? <VideoOff /> : <Video />}
        label={isCameraOff ? "Turn camera on" : "Turn camera off"}
        isActive={!isCameraOff}
        onClick={onToggleCamera}
      />
      <span className="h-6 w-px bg-white/20" aria-hidden />
      <IconButton icon={<PhoneOff />} label="Leave battle" tone="danger" onClick={onLeave} />
    </div>
  );
}

export default MediaControlDock;