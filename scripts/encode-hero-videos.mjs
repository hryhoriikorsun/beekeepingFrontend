/**
 * Turns the source clips for the home page hero into what ships in
 * public/videos/previews: one web-sized MP4 and a first-frame poster each.
 *
 *   npm run video:hero -- <folder with the source .mp4 files>
 *
 * Needs ffmpeg on PATH, or its location in the FFMPEG variable. The sources
 * stay outside public/: everything there is copied into the runtime image.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: npm run video:hero -- <folder with the source .mp4 files>');
  process.exit(1);
}

const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const target = resolve(import.meta.dirname, '../public/videos/previews');
mkdirSync(target, { recursive: true });

const clips = readdirSync(source).filter((name) => name.toLowerCase().endsWith('.mp4'));
if (clips.length === 0) {
  console.error(`No .mp4 files in ${source}`);
  process.exit(1);
}

const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

for (const clip of clips) {
  const input = join(source, clip);
  const name = basename(clip, '.mp4');

  // CRF 24 measured as visually indistinguishable from the 5-9 Mbit/s
  // originals behind the hero's scrim, at a quarter of the size. The cap
  // keeps busy shots (foliage, flowers) under ~4 Mbit/s so they do not
  // stall on a mobile connection; H.264 because every browser decodes it
  // in hardware, and AV1 came out no smaller for these clips.
  run([
    '-i', input,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryslow',
    '-crf', '24',
    '-maxrate', '4000k',
    '-bufsize', '8000k',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    join(target, `${name}.mp4`),
  ]);

  // Every clip gets a poster, so reordering the clips never leaves the
  // first one without its still.
  run([
    '-i', join(target, `${name}.mp4`),
    '-frames:v', '1',
    '-c:v', 'libwebp',
    '-quality', '80',
    join(target, `${name}.webp`),
  ]);

  console.log(`${clip} -> ${name}.mp4, ${name}.webp`);
}
