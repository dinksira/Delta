/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Mock thread rows until comments API exists; same shape expected from backend. */

export type FeedCommentPreview = Readonly<{
  id: string;
  initials: string;
  name: string;
  text: string;
  time: string;
  likes: string;
}>;

const MOCK_COMMENTS: readonly FeedCommentPreview[] = [
  {
    id: "m1",
    initials: "AK",
    name: "Alex Kim",
    text: "This breakdown is exactly what I needed for our lab session.",
    time: "2h",
    likes: "24",
  },
  {
    id: "m2",
    initials: "JR",
    name: "Jordan Rivera",
    text: "Could you share the dataset version you used here?",
    time: "5h",
    likes: "12",
  },
  {
    id: "m3",
    initials: "SL",
    name: "Sam Lee",
    text: "Following for the next update — great work.",
    time: "1d",
    likes: "8",
  },
];

/** Replace with `apiClient.get('/clips/:id/comments')` when wired. */
export async function fetchMockCommentsForClip(clipId: string): Promise<readonly FeedCommentPreview[]> {
  void clipId;
  return MOCK_COMMENTS;
}

export function getMockCommentCount(): number {
  return MOCK_COMMENTS.length;
}
/** ################################ /COMPONENT ############################# */
