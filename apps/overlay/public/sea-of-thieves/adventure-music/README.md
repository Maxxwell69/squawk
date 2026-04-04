# Sea of Thieves — adventure music

Drop **audio files here with any filenames you want** (no renaming required). The voyages board scans this folder at runtime and plays them in **sorted order** (A→Z by filename).

**When you start an action automation** (Skeleton ship, Player ship, etc.), the board:

1. Picks a **random track** as the first one.
2. Plays through the **rest of the list** in order until the last file ends.
3. Stops when you tap **Finish** on that automation (or when the playlist ends).

All automations share this single playlist.

**Formats:** `.mp3`, `.m4a`, `.aac`, `.ogg`, `.wav`, `.flac`, `.opus` (MP3 is the safest across browsers).

**Paths:** files are served as `/sea-of-thieves/adventure-music/<your-file-name>`.

After adding or removing files, refresh the **Sea of Thieves** board page (redeploy if hosted).

Music must begin from a **click** (Start automation) so the browser allows audio — same idea as the battle board.
