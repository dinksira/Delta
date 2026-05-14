# Public audio for the Audio hub

Files live here: `deltalabs-frontend/public/mock-feed-audio/`  
They are served at URLs like `/mock-feed-audio/<filename>.mp3`.

## Current manifest (keep in sync with the seed script)

Mongo rows `school-debug-audio-01` … `school-debug-audio-12` are defined in:

`deltalabs-backend/scripts/seed_public_feed_audio.py` (`AUDIO_ROWS`).

| # | File on disk |
|---|----------------|
| 01 | `apalonbeats-educational-presentation-tutorial-music-491426.mp3` |
| 02 | `delosound-educational-education-school-music-432203.mp3` |
| 03 | `hitslab-education-school-educational-music-433906.mp3` |
| 04 | `hitslab-learning-study-educational-music-459481.mp3` |
| 05 | `ikoliks_aj-educational-school-education-music-400869.mp3` |
| 06 | `krasnoshchok-educational-educational-learning-study-music-409483.mp3` |
| 07 | `leberch-education-documentary-510725.mp3` |
| 08 | `mondamusic-educational-education-school-music-499164.mp3` |
| 09 | `mondamusic-educational-presentation-tutorial-music-491691.mp3` |
| 10 | `positive_sound-educational-494789.mp3` |
| 11 | `sigmamusicart-background-educational-environment-music-369011.mp3` |
| 12 | `starostin-educational-educational-education-school-music-263145.mp3` |

**Rename or add tracks:** edit `AUDIO_ROWS` in the seed script (paths + captions), run:

```bash
cd deltalabs-backend
python scripts/seed_public_feed_audio.py --replace
```

**Licensing:** Only ship audio you have rights to use.
