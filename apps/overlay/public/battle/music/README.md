# Battle background music

Add your own tracks here using these **exact filenames** (MP3 or M4A — prefer MP3 for broad browser support):

| File | When it plays |
|------|----------------|
| `phase1.mp3` | First minute of the match |
| `phase2.mp3` | Second minute |
| `phase3.mp3` | Third minute |
| `phase4.mp3` | Fourth minute |
| `phase5.mp3` | Fifth / final minute |
| `victory.mp3` | ~2 minute victory party after you tap **We won** |
| `defeat.mp3` | After you tap **We lost** (lighter mix; volume is lowered in the UI) |

If `phase1.mp3` (etc.) is missing, the app tries alternate filenames bundled in `battle-music-tracks.ts` (Episodes / placeholders). Easiest fix: **rename** your files to `phase1.mp3` … `phase5.mp3`, `victory.mp3`, `defeat.mp3`.

Music **must** start from a click — use **Start match** on this page (same gesture unlocks playback in strict browsers). Use **Battle music** for volume and **Mute music** (saved in this browser).

After adding files, redeploy or refresh the overlay. Paths are `/battle/music/phase1.mp3`, etc.
