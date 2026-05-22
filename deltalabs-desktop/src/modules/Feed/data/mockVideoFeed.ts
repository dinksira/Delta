/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export type LandingVideoClip = Readonly<{
  id: string;
  videoSrc: string;
  /** From API: `video` | `audio` | `simulation`. Defaults to video in UI when absent. */
  contentType?: "video" | "audio" | "simulation";
  /** Seconds; from API `durationS`. */
  durationS?: number;
  mediaTone: number;
  caption: string;
  hashtags: readonly string[];
  pdfLabel: string;
  likeCount?: number;
  saveCount?: number;
  commentCount?: number;
  shareCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
}>;

/** Local mock feed videos. Replace with backend feed payload later. */
export const MOCK_VIDEO_FEED: readonly LandingVideoClip[] = [
  {
    id: "c1",
    videoSrc: "/mock-feed-videos/video-01.mp4",
    mediaTone: 0,
    caption: "Analyzing the neural pathways of synthetically grown bio-neural chips.",
    hashtags: ["NeuroTech", "FutureTech", "DeltaLabs"],
    pdfLabel: "Access Full Research Paper (PDF)",
  },
  {
    id: "c2",
    videoSrc: "/mock-feed-videos/video-02.mp4",
    mediaTone: 1,
    caption: "Lab notes: closed-loop stimulation protocols on organoid arrays.",
    hashtags: ["BioEng", "Research", "DeltaLabs"],
    pdfLabel: "View lab summary (PDF)",
    likeCount: 38200,
  },
  {
    id: "c3",
    videoSrc: "/mock-feed-videos/video-03.mp4",
    mediaTone: 2,
    caption: "Dataset walkthrough — multimodal sensing fusion for edge devices.",
    hashtags: ["EdgeAI", "Sensors", "DeltaLabs"],
    pdfLabel: "Download dataset card (PDF)",
    likeCount: 51100,
  },
  {
    id: "c4",
    videoSrc: "/mock-feed-videos/video-04.mp4",
    mediaTone: 3,
    caption: "Simulation run #482: failure modes in redundant actuator meshes.",
    hashtags: ["Simulation", "Robotics", "DeltaLabs"],
    pdfLabel: "Open simulation report (PDF)",
    likeCount: 19400,
  },
  {
    id: "c5",
    videoSrc: "/mock-feed-videos/video-05.mp4",
    mediaTone: 4,
    caption: "Short brief on ethics review for autonomous lab assistants.",
    hashtags: ["Policy", "AI", "DeltaLabs"],
    pdfLabel: "Read ethics brief (PDF)",
    likeCount: 8900,
  },
  {
    id: "c6",
    videoSrc: "/mock-feed-videos/video-06.mp4",
    mediaTone: 5,
    caption: "Field test highlights — low-latency streaming from remote sites.",
    hashtags: ["Streaming", "FieldTest", "DeltaLabs"],
    pdfLabel: "Field test appendix (PDF)",
    likeCount: 27800,
  },
  {
    id: "c7",
    videoSrc: "/mock-feed-videos/video-07.mp4",
    mediaTone: 1,
    caption: "On-site model validation with instrumented mobile rigs.",
    hashtags: ["Validation", "MobileLab", "DeltaLabs"],
    pdfLabel: "Review validation notes (PDF)",
    likeCount: 22100,
  },
  {
    id: "c8",
    videoSrc: "/mock-feed-videos/video-08.mp4",
    mediaTone: 2,
    caption: "Prototype sprint: robust control loops in noisy environments.",
    hashtags: ["Control", "Prototype", "DeltaLabs"],
    pdfLabel: "Open sprint brief (PDF)",
    likeCount: 31300,
  },
  {
    id: "c9",
    videoSrc: "/mock-feed-videos/video-09.mp4",
    mediaTone: 0,
    caption: "Weekly recap from the autonomous systems research floor.",
    hashtags: ["Recap", "Autonomy", "DeltaLabs"],
    pdfLabel: "Read weekly recap (PDF)",
    likeCount: 44600,
  },
  {
    id: "c10",
    videoSrc: "/mock-feed-videos/video-10.mp4",
    mediaTone: 4,
    caption: "High-intensity replay clip captured from field telemetry broadcast.",
    hashtags: ["Replay", "SportsAI", "DeltaLabs"],
    pdfLabel: "Open replay notes (PDF)",
    likeCount: 63400,
  },
  {
    id: "c11",
    videoSrc: "/mock-feed-videos/video-11.mp4",
    mediaTone: 2,
    caption: "Mountain path capture with stabilization benchmark annotations.",
    hashtags: ["Outdoors", "Stabilization", "DeltaLabs"],
    pdfLabel: "View benchmark notes (PDF)",
    likeCount: 18700,
  },
  {
    id: "c12",
    videoSrc: "/mock-feed-videos/video-12.mp4",
    mediaTone: 3,
    caption: "Classic highlight sequence used for motion model evaluation.",
    hashtags: ["Highlights", "Motion", "DeltaLabs"],
    pdfLabel: "Inspect model metrics (PDF)",
    likeCount: 82900,
  },
  {
    id: "c13",
    videoSrc: "/mock-feed-videos/video-13.mp4",
    mediaTone: 1,
    caption: "Creative vertical cut prepared for template quality checks.",
    hashtags: ["Template", "Creative", "DeltaLabs"],
    pdfLabel: "Review template report (PDF)",
    likeCount: 24500,
  },
];

/** ################################ /COMPONENT ############################# */
