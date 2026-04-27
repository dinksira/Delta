# Delta Labs Feed + FYP Executive Summary

## Objective

Build a feed system that works well today with low content volume and scales into a fully personalized FYP as schools and creators upload at high volume.

---

## What Is Already Implemented

### Core feed and engagement

- Public feed read with cursor pagination
- Engagement write APIs (like/save/comment/share)
- Authenticated session support for protected actions
- Idempotency support for write safety

### Personalization signal loop (live)

- Backend ingests user feed events:
  - `view_start`
  - `view_complete`
  - `skip`
  - `hide`
- Ranking uses:
  - recency
  - hashtag affinity
  - engagement history
  - event boosts/penalties
- Cold-start order for logged-in users is deterministic per user/page:
  - seed text: `user_id + cursor_token`
  - SHA-256 based seeded shuffle
  - different users usually start from different first videos
- Hidden and watched items are filtered where possible
- Safe fallback ensures feed still shows videos when inventory is small

### Frontend smoothness and UX

- Event emission wired from player interactions
- Immediate local hide (not interested removes clip instantly)
- Preload strategy around active clip for smoother scroll playback

### Media pipeline foundation

- Upload intent API (org-scoped) created
- Ingest callback API (secure secret) created
- Media metadata model and persistence added
- Ready media can be published into feed automatically
- S3-compatible presigned upload signing integrated
  - Supports AWS S3 and Cloudflare R2 patterns

---

## Why This Matters

1. **Works now**: low-content feed remains stable and usable.
2. **Learns immediately**: user behavior starts training ranking from day one.
3. **Scales structurally**: upload + ingest + feed publication path is in place for school-generated content growth.
4. **Avoids rewatch fatigue**: watched/hidden filtering reduces repetitive feed experience.

---

## Recommended Production Stack

- **Storage**: S3/R2 object storage
- **Delivery**: CDN
- **Playback**: HLS/DASH adaptive streams
- **Database**: metadata only (no raw blobs)
- **Security**: signed upload/playback URLs + ingest callback secret

---

## Current Risk and Mitigation

- **Low inventory can over-filter feed**  
  Mitigation: automatic fallback to available content when exclusion is too strict.

- **No full transcoder worker yet**  
  Mitigation: contract and callback architecture is already prepared; worker integration is next.

- **Ranking still heuristic-based**  
  Mitigation: event pipeline is already collecting training signals for future model-based ranking.

---

## Next Steps (Priority)

1. Integrate transcoder worker (HLS renditions + poster generation)
2. Add media moderation and policy checks
3. Add ranking observability dashboards (CTR, completion, skip, hide rates)
4. Introduce AB testing for ranking weight strategies
5. Evolve into ML-backed ranker when data volume is sufficient

---

## Decision Summary

Delta Labs now has a practical hybrid strategy:

- **MVP-safe behavior for current small feed**
- **Production-ready architecture direction for large-scale FYP**

This is the right balance between immediate product delivery and long-term platform scalability.