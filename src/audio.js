// Audio intentionally disabled — the game runs silent.
// The class keeps the full sound-effect interface as no-ops so gameplay code
// can stay clean; a real implementation can be dropped in here later.
export class AudioEngine {
  start() {}
  engine() {}
  shoot() {}
  missile() {}
  explosion() {}
  hit() {}
  scrape() {}
  pickup() {}
  boost() {}
  countdown() {}
  lap() {}
}
