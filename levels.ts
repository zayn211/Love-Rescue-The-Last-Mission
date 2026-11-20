import {
  BossConfig,
  BossId,
  CheckpointDef,
  CollectibleDef,
  CollectibleKind,
  EnemySpawnDef,
  EnemyType,
  HazardDef,
  LevelConfig,
  PlatformDef,
  SceneryZone,
  WorldId,
} from '../types/game';
import { getWorldName } from './villains';

const LEVEL_TITLES: string[] = [
  // World 1: Green Jungle (1-10)
  'Sunlit Canopy Trail',
  'Emerald River Crossing',
  'Hollow Cavern Descent',
  'Ancient Canopy Bridges',
  'Whispering Waterfall Shrine',
  'Mossy Totem Ruins',
  'Sunken Jaguar Grotto',
  'Thunder Vine Canyon',
  'Forbidden Temple Overlook',
  'Canopy Throne: Goliath Kong',
  // World 2: Desert Kingdom (11-20)
  'Golden Dune Gate',
  'Sunspire Pyramid Steps',
  'Sunken Oasis Basin',
  'Scorpion Ridge Pass',
  'Crimson Obelisk Courtyard',
  'Pharaoh’s Mirror Hall',
  'Cactus Gorge Railway',
  'Dune Storm Ramparts',
  'Mirage Citadel Gates',
  'Pyramid Sanctum: Scarab Titan',
  // World 3: Snow Mountain (21-30)
  'Frostbite Ridge',
  'Frozen Mirror Lake',
  'Shivering Crystal Caverns',
  'Blizzard Suspension Pass',
  'Aurora Peak Bridge',
  'Glacial Gorge Drop',
  'Icicle Spire Tunnel',
  'Wolves of the Whiteout',
  'Summit Storm Steps',
  'Frozen Altar: Glacier Behemoth',
  // World 4: Dark Castle (31-40)
  'Haunted Drawbridge',
  'Whispering Deadwood Trail',
  'Crimson Lava Crypt',
  'Pendulum Blade Corridor',
  'Gargoyle Bell Tower',
  'Sunken Catacombs',
  'Molten Drawbridge',
  'Phantom Courtyard',
  'Obsidian Spire Ramparts',
  'Dragon Keep: Obsidian Dragon',
  // World 5: Villain's Secret Island (41-50)
  'Secret Beachhead Helipad',
  'Alpha Radar Station',
  'Laser Security Bunker',
  'Underground Robotics Lab',
  'Heavy Mech Assembly Bay',
  'Helipad Skybridge',
  'Reactor Core Shaft',
  'Command Hangar Ascent',
  'Sovereign Perimeter Gate',
  'Vex’s Sky Fortress: Final Battle',
];

const LEVEL_BRIEFS: string[] = [
  'Follow Maya’s rose ribbon trail across the jungle bridges to the cliff clearing.',
  'Cross the rushing emerald rapids using drifting log rafts and wooden spans.',
  'Descend into the glowing underground cave and watch for leaping vine slimes.',
  'Traverse high canopy platforms and bouncy jungle vines above the chasm.',
  'Climb past the misty waterfall shrine and uncover the hidden grotto chest.',
  'Dodge venom-spitting totems guarding the mossy stone ruins.',
  'Navigate dark subterranean caverns filled with charging wild boars.',
  'Leap across narrow canyon pillars while giant hornets swoop overhead.',
  'Storm the outer temple ruins where Commander Rook’s henchmen lie in wait.',
  'Defeat Goliath Vine-Kong on the Canopy Throne to break out of the jungle!',
  'Enter the scorching Desert Kingdom and avoid sinking into bubbling quicksand.',
  'Scale the golden sandstone steps of the Sunspire Pyramid.',
  'Cross the sunken oasis pools guarded by armored dune scorpions.',
  'Brave sharp cactus ridges and darting canyon vultures.',
  'Battle sand raiders across the crimson obelisk courtyard.',
  'Explore the cool underground pyramid chambers beneath the mirror hall.',
  'Ride fast moving stone skiffs above Cactus Gorge.',
  'Push forward through howling sandstorms and desert mummies.',
  'Breach the Mirage Citadel walls on the trail of Maya’s chopper.',
  'Conquer the Pharaoh Scarab-Titan inside the Pyramid Sanctum!',
  'Keep your balance on slippery frozen ledges along Frostbite Ridge.',
  'Cross the cracking frozen mirror lake while blizzard owls dive from above.',
  'Venture into glittering ice caverns with trembling overhead icicles.',
  'Use double jumps to cross wide blizzard suspension gaps.',
  'Climb beneath the northern aurora across high mountain bridges.',
  'Navigate steep glacial drops and prowling arctic wolves.',
  'Sprint through the icicle spire tunnel before frost shards trap you.',
  'Hold your ground against relentless snow golems in the whiteout.',
  'Ascend the steep summit storm steps toward the final alpine peak.',
  'Shatter the Glacier Behemoth atop the Frozen Summit Altar!',
  'Cross the haunted castle drawbridge surrounded by dark deadwood trees.',
  'Outrun swooping gargoyle bats along the cursed forest path.',
  'Leap carefully over glowing lava pits inside the crimson crypt.',
  'Time your dashes across moving iron platforms and skeleton guards.',
  'Climb the gargoyle bell tower while phantom wraiths phase through walls.',
  'Search the sunken catacombs for hidden royal diamonds and shields.',
  'Sprint across the molten drawbridge defended by dark armor knights.',
  'Fight through the misty phantom courtyard toward the inner keep.',
  'Scale the obsidian spire ramparts where Dragonmaster Vane awaits.',
  'Slay the Obsidian Dread-Dragon on the Castle Keep Roof!',
  'Infiltrate the secret military island beachhead and dodge patrol drones.',
  'Disable the alpha radar station guarded by armed syndicate troopers.',
  'Time your movement past pulsing security laser gates in the bunker.',
  'Fight through the underground robotics lab swarming with assault mechs.',
  'Navigate high-speed factory conveyors inside the heavy mech assembly bay.',
  'Cross the stormy helipad skybridge high above the island cliffs.',
  'Climb the glowing reactor core shaft while dodging auto-turret fire.',
  'Storm the command hangar ascent against elite syndicate commandos.',
  'Break through the final sovereign perimeter gate before General Vex flees.',
  'Face General Vex’s Mk.IX Fortress Mech and rescue Maya once and for all!',
];

// Deterministic pseudo-random helper per level so layouts are 100% consistent and uniquely crafted
function createRng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getWorldForLevel(levelId: number): WorldId {
  if (levelId <= 10) return 1;
  if (levelId <= 20) return 2;
  if (levelId <= 30) return 3;
  if (levelId <= 40) return 4;
  return 5;
}

function getBiomeTileForWorld(
  world: WorldId,
  inCave = false
): NonNullable<PlatformDef['biomeTile']> {
  if (inCave) return world === 3 ? 'ice' : 'cave';
  switch (world) {
    case 1:
      return 'grass';
    case 2:
      return 'sand';
    case 3:
      return 'snow';
    case 4:
      return 'stone';
    case 5:
      return 'metal';
  }
}

function getEnemyPoolForWorld(world: WorldId): {
  ground: EnemyType[];
  flying: EnemyType[];
  heavy: EnemyType[];
} {
  switch (world) {
    case 1:
      return {
        ground: ['jungle_slime', 'jungle_boar', 'jungle_totem'],
        flying: ['jungle_hornet'],
        heavy: ['jungle_boar', 'henchman'],
      };
    case 2:
      return {
        ground: ['desert_scorpion', 'desert_raider', 'desert_mummy'],
        flying: ['desert_vulture'],
        heavy: ['desert_mummy', 'henchman'],
      };
    case 3:
      return {
        ground: ['snow_wolf', 'snow_yeti', 'snow_golem'],
        flying: ['snow_owl'],
        heavy: ['snow_yeti', 'henchman'],
      };
    case 4:
      return {
        ground: ['castle_skeleton', 'castle_knight'],
        flying: ['castle_ghost', 'castle_bat'],
        heavy: ['castle_knight', 'henchman'],
      };
    case 5:
      return {
        ground: ['island_guard', 'island_commando', 'island_turret'],
        flying: ['island_drone'],
        heavy: ['island_mech', 'henchman'],
      };
  }
}

function getHazardForWorld(world: WorldId): HazardDef['kind'] {
  switch (world) {
    case 1:
      return 'water';
    case 2:
      return 'quicksand';
    case 3:
      return 'icicle';
    case 4:
      return 'lava';
    case 5:
      return 'laser';
  }
}

interface LevelBossMeta {
  id: BossId;
  name: string;
  title: string;
  accentColor: string;
  scale?: number;
}

const LEVEL_BOSS_ROSTER: LevelBossMeta[] = [
  // World 1: Jungle (1-10)
  { id: 'giant_trex', name: 'Rex Fang', title: 'Giant Canopy Tyrannosaurus', accentColor: '#ef4444' },
  { id: 'giant_snake', name: 'Venom Boa', title: 'Giant Emerald Viper', accentColor: '#22c55e' },
  { id: 'giant_crocodile', name: 'Snapjaw Rex', title: 'Giant River Crocodile', accentColor: '#10b981' },
  { id: 'giant_gorilla', name: 'Timber Silverback', title: 'Giant Jungle Gorilla', accentColor: '#84cc16' },
  { id: 'giant_trex', name: 'Mossjaw Tyrant', title: 'Armored Waterfall Dinosaur', accentColor: '#f97316' },
  { id: 'giant_snake', name: 'Toxin Basilisk', title: 'Giant Shrine Serpent', accentColor: '#a855f7' },
  { id: 'giant_crocodile', name: 'Grotto Ripper', title: 'Giant Cavern Crocodile', accentColor: '#14b8a6' },
  { id: 'giant_trex', name: 'Thunderclaw Rex', title: 'Canyon Apex Tyrannosaurus', accentColor: '#eab308' },
  { id: 'giant_gorilla', name: 'Ironback Brute', title: 'Temple Gate Gorilla', accentColor: '#ef4444' },
  { id: 'goliath_kong', name: 'Goliath Vine-Kong', title: 'Guardian of the Canopy Throne', accentColor: '#22c55e', scale: 1.38 },

  // World 2: Desert (11-20)
  { id: 'giant_scorpion', name: 'Dune Stinger', title: 'Giant Desert Scorpion', accentColor: '#f59e0b' },
  { id: 'giant_sand_snake', name: 'Crimson Sidewinder', title: 'Giant Sand-Storm Viper', accentColor: '#ea580c' },
  { id: 'giant_sand_colossus', name: 'Oasis Golem', title: 'Ancient Sandstone Monster', accentColor: '#fbbf24' },
  { id: 'giant_scorpion', name: 'Razor Pincer', title: 'Giant Canyon Scorpion', accentColor: '#dc2626' },
  { id: 'giant_sand_snake', name: 'Obelisk Cobra', title: 'Giant Royal Sand-Snake', accentColor: '#eab308' },
  { id: 'giant_sand_colossus', name: 'Mirage Guardian', title: 'Ancient Pyramid Colossus', accentColor: '#38bdf8' },
  { id: 'giant_scorpion', name: 'Venom Tail', title: 'Armored Gorge Scorpion', accentColor: '#a855f7' },
  { id: 'giant_sand_snake', name: 'Haboob Serpent', title: 'Giant Storm-Sand Python', accentColor: '#f97316' },
  { id: 'giant_sand_colossus', name: 'Sunfire Sentinel', title: 'Citadel Gate Colossus', accentColor: '#fb7185' },
  { id: 'scarab_titan', name: 'Pharaoh Scarab-Titan', title: 'Armored Colossus of the Sands', accentColor: '#facc15', scale: 1.42 },

  // World 3: Snow Mountain (21-30)
  { id: 'giant_ice_monster', name: 'Frostbite Yeti', title: 'Giant Ice Mountain Monster', accentColor: '#38bdf8' },
  { id: 'giant_frost_dragon', name: 'Rimewing Wyvern', title: 'Giant Frozen Ice Dragon', accentColor: '#7dd3fc' },
  { id: 'giant_ice_monster', name: 'Crystal Smasher', title: 'Giant Cavern Ice Beast', accentColor: '#22d3ee' },
  { id: 'giant_frost_dragon', name: 'Blizzard Drake', title: 'Giant Storm-Frost Dragon', accentColor: '#60a5fa' },
  { id: 'giant_ice_monster', name: 'Aurora Titan', title: 'Giant Peak Ice Monster', accentColor: '#34d399' },
  { id: 'giant_frost_dragon', name: 'Glacial Wyrm', title: 'Giant Gorge Ice Dragon', accentColor: '#818cf8' },
  { id: 'giant_ice_monster', name: 'Icicle Brute', title: 'Spire Tunnel Ice Monster', accentColor: '#0ea5e9' },
  { id: 'giant_frost_dragon', name: 'Whiteout Terror', title: 'Giant Blizzard Dragon', accentColor: '#bae6fd' },
  { id: 'giant_ice_monster', name: 'Summit Colossus', title: 'Alpine Storm Ice Giant', accentColor: '#a78bfa' },
  { id: 'glacier_behemoth', name: 'Glacier Behemoth', title: 'Frost Giant of Aurora Peak', accentColor: '#38bdf8', scale: 1.44 },

  // World 4: Dark Castle (31-40)
  { id: 'giant_skeleton', name: 'Lord Marrow', title: 'Giant Skeleton Warrior', accentColor: '#e2e8f0' },
  { id: 'giant_fire_demon', name: 'Brimstone Fiend', title: 'Giant Castle Fire Demon', accentColor: '#f97316' },
  { id: 'giant_dragon', name: 'Crimson Wyvern', title: 'Giant Lava-Crypt Dragon', accentColor: '#ef4444' },
  { id: 'giant_skeleton', name: 'Iron Bone-Reaper', title: 'Giant Armored Skeleton Knight', accentColor: '#f87171' },
  { id: 'giant_fire_demon', name: 'Pyre Warlord', title: 'Giant Bell-Tower Fire Demon', accentColor: '#fb923c' },
  { id: 'giant_dragon', name: 'Catacomb Drake', title: 'Giant Winged Shadow Dragon', accentColor: '#c084fc' },
  { id: 'giant_skeleton', name: 'Dread Executioner', title: 'Giant Molten Skeleton Warrior', accentColor: '#facc15' },
  { id: 'giant_fire_demon', name: 'Hellblaze Baron', title: 'Giant Phantom Fire Demon', accentColor: '#dc2626' },
  { id: 'giant_dragon', name: 'Spire Hell-Dragon', title: 'Giant Rampart Fire Dragon', accentColor: '#fb7185' },
  { id: 'obsidian_dragon', name: 'Obsidian Dread-Dragon', title: 'Winged Terror of Dark Castle', accentColor: '#f97316', scale: 1.46 },

  // World 5: Secret Island (41-50)
  { id: 'giant_robot', name: 'Sentinel MK-IV', title: 'Giant Mechanical Patrol Robot', accentColor: '#38bdf8' },
  { id: 'giant_mutant', name: 'Bio-Hulk Alpha', title: 'Giant Lab Mutant Monster', accentColor: '#4ade80' },
  { id: 'giant_robot', name: 'Laser Juggernaut', title: 'Giant Bunker Assault Robot', accentColor: '#ef4444' },
  { id: 'giant_mutant', name: 'Venom Titan X', title: 'Giant Bio-Engineered Mutant', accentColor: '#a855f7' },
  { id: 'giant_robot', name: 'Crusher Automaton', title: 'Giant Heavy Mech Robot', accentColor: '#f59e0b' },
  { id: 'giant_mutant', name: 'Storm Chimera', title: 'Giant Skybridge Mutant Beast', accentColor: '#22d3ee' },
  { id: 'giant_robot', name: 'Core Guardian X9', title: 'Giant Reactor Defense Robot', accentColor: '#34d399' },
  { id: 'giant_mutant', name: 'Omega Ravager', title: 'Giant Syndicate Mutant Colossus', accentColor: '#f43f5e' },
  { id: 'giant_robot', name: 'Sovereign Titan', title: 'Giant Gate Siege Robot', accentColor: '#eab308' },
  { id: 'vex_fortress_mech', name: 'General Vex Mk.IX', title: 'Supreme Syndicate Fortress Mech', accentColor: '#dc2626', scale: 1.52 },
];

function getBossConfig(
  levelId: number,
  arenaX: number,
  arenaWidth: number
): BossConfig {
  const meta = LEVEL_BOSS_ROSTER[Math.max(0, Math.min(49, levelId - 1))];
  const isMajor = levelId % 10 === 0;
  const world = getWorldForLevel(levelId);
  const levelInWorld = ((levelId - 1) % 10) + 1;
  const baseHp = 115 + (levelId - 1) * 9 + (isMajor ? 45 + world * 15 : 0);
  const scale = meta.scale ?? (1.12 + levelInWorld * 0.018);

  return {
    id: meta.id,
    name: meta.name,
    title: meta.title,
    maxHp: levelId === 50 ? 680 : baseHp,
    arenaX,
    arenaWidth,
    spawnX: arenaX + arenaWidth * 0.72,
    spawnY: 480,
    rewardCoins: isMajor ? 140 + world * 90 : 35 + levelId * 4,
    rewardDiamonds: isMajor ? 2 + world * 2 : levelId % 3 === 0 ? 2 : 1,
    scale,
    accentColor: meta.accentColor,
    isMajorWorldBoss: isMajor,
  };
}

function buildLevel(levelId: number): LevelConfig {
  const world = getWorldForLevel(levelId);
  const worldName = getWorldName(world);
  const levelInWorld = ((levelId - 1) % 10) + 1;
  const isBossLevel = levelInWorld === 10;
  const rng = createRng(levelId * 137 + world * 31);

  const platforms: PlatformDef[] = [];
  const hazards: HazardDef[] = [];
  const collectibles: CollectibleDef[] = [];
  const enemies: EnemySpawnDef[] = [];
  const checkpoints: CheckpointDef[] = [];
  const sceneryZones: SceneryZone[] = [];

  const groundY = 480;
  const height = 600;
  const pool = getEnemyPoolForWorld(world);
  const worldHazard = getHazardForWorld(world);

  // Starting safe ledge
  platforms.push({
    id: `L${levelId}_start`,
    x: 0,
    y: groundY,
    w: 440,
    h: 140,
    kind: 'solid',
    biomeTile: getBiomeTileForWorld(world),
  });

  // Gentle opening coins on Level 1
  for (let i = 0; i < 4; i++) {
    collectibles.push({
      id: `L${levelId}_start_c${i}`,
      x: 200 + i * 44,
      y: groundY - 46,
      kind: 'coin',
    });
  }

  let cursorX = 440;
  const numSegments = isBossLevel ? 7 : 7 + (levelInWorld % 3);
  const caveStartIndex = Math.floor(numSegments * 0.45);
  const caveEndIndex = caveStartIndex + 2;
  const hasCaveFeature =
    levelInWorld === 3 ||
    levelInWorld === 7 ||
    (world === 3 && levelInWorld === 3) ||
    (world === 5 && levelInWorld === 4) ||
    (levelId % 3 === 0 && !isBossLevel);

  for (let seg = 0; seg < numSegments; seg++) {
    const inCave = hasCaveFeature && seg >= caveStartIndex && seg <= caveEndIndex;
    const tile = getBiomeTileForWorld(world, inCave);
    const segStart = cursorX;

    // Pattern variation based on levelId + segment index so every level feels distinct
    const pattern = (seg + levelId * 2 + Math.floor(rng() * 3)) % 6;

    if (seg === Math.floor(numSegments / 2)) {
      // Checkpoint island
      const cpW = 280;
      platforms.push({
        id: `L${levelId}_cp_plat`,
        x: cursorX,
        y: groundY,
        w: cpW,
        h: 140,
        kind: 'solid',
        biomeTile: tile,
      });
      checkpoints.push({
        id: `L${levelId}_cp1`,
        x: cursorX + 120,
        y: groundY,
      });
      collectibles.push({
        id: `L${levelId}_cp_heart`,
        x: cursorX + 190,
        y: groundY - 48,
        kind: seg % 2 === 0 ? 'heart' : 'power_shield',
      });
      cursorX += cpW;
    } else if (pattern === 0) {
      // Gap + elevated stone/bridge platforms + enemy patrol
      const gap = 110 + Math.min(70, levelInWorld * 6);
      hazards.push({
        id: `L${levelId}_haz_${seg}`,
        x: cursorX,
        y: groundY + 26,
        w: gap,
        h: 95,
        kind: world === 1 ? 'water' : world === 2 ? 'quicksand' : world === 4 ? 'lava' : 'spikes',
      });
      cursorX += gap;

      const platW = 320 + Math.floor(rng() * 110);
      const stepY = groundY - (rng() > 0.5 ? 25 : 0);
      platforms.push({
        id: `L${levelId}_g_${seg}`,
        x: cursorX,
        y: stepY,
        w: platW,
        h: 150,
        kind: world === 3 && seg % 2 === 1 ? 'ice' : 'solid',
        biomeTile: tile,
      });

      // Upper bonus bridge
      platforms.push({
        id: `L${levelId}_up_${seg}`,
        x: cursorX + 70,
        y: stepY - 115,
        w: 170,
        h: 22,
        kind: world === 1 ? 'bridge' : 'solid',
        biomeTile: tile,
      });

      for (let c = 0; c < 3; c++) {
        collectibles.push({
          id: `L${levelId}_c_${seg}_${c}`,
          x: cursorX + 95 + c * 42,
          y: stepY - 155,
          kind: c === 1 && seg % 3 === 0 ? 'diamond' : 'coin',
        });
      }

      enemies.push({
        id: `L${levelId}_e_${seg}`,
        type: pool.ground[(seg + levelId) % pool.ground.length],
        x: cursorX + platW * 0.55,
        y: stepY,
        patrolWidth: Math.max(100, platW - 90),
        speedMultiplier: 1 + levelId * 0.01,
      });

      cursorX += platW;
    } else if (pattern === 1) {
      // Moving platform crossing over hazard river/lava/chasm
      const chasmW = 360;
      hazards.push({
        id: `L${levelId}_chasm_${seg}`,
        x: cursorX,
        y: groundY + 34,
        w: chasmW,
        h: 90,
        kind: world === 1 ? 'water' : world === 2 ? 'quicksand' : world === 4 ? 'lava' : 'spikes',
      });

      platforms.push({
        id: `L${levelId}_mov_${seg}`,
        x: cursorX + 45,
        y: groundY - 40,
        w: 115,
        h: 22,
        kind: 'moving',
        moveAxis: 'x',
        moveRange: 145,
        moveSpeed: 1.4 + levelInWorld * 0.08,
        biomeTile: tile,
      });

      collectibles.push({
        id: `L${levelId}_mc_${seg}_1`,
        x: cursorX + 130,
        y: groundY - 98,
        kind: 'coin',
      });
      collectibles.push({
        id: `L${levelId}_mc_${seg}_2`,
        x: cursorX + 205,
        y: groundY - 115,
        kind: seg % 2 === 0 ? 'diamond' : 'coin',
      });

      // Flying enemy swooping over crossing
      enemies.push({
        id: `L${levelId}_fly_${seg}`,
        type: pool.flying[seg % pool.flying.length],
        x: cursorX + 185,
        y: groundY - 165,
        patrolWidth: 180,
      });

      cursorX += chasmW;

      // Landing island
      const landW = 240;
      platforms.push({
        id: `L${levelId}_land_${seg}`,
        x: cursorX,
        y: groundY,
        w: landW,
        h: 140,
        kind: 'solid',
        biomeTile: tile,
      });
      cursorX += landW;
    } else if (pattern === 2) {
      // Tiered vertical climb with secret high chest path!
      const baseW = 460;
      platforms.push({
        id: `L${levelId}_tierBase_${seg}`,
        x: cursorX,
        y: groundY,
        w: baseW,
        h: 140,
        kind: 'solid',
        biomeTile: tile,
      });

      // Bouncy vine/pad or step ledge
      platforms.push({
        id: `L${levelId}_step1_${seg}`,
        x: cursorX + 55,
        y: groundY - 95,
        w: 120,
        h: 22,
        kind: world === 1 ? 'bouncy' : 'solid',
        biomeTile: tile,
      });

      platforms.push({
        id: `L${levelId}_step2_${seg}`,
        x: cursorX + 210,
        y: groundY - 190,
        w: 190,
        h: 24,
        kind: 'solid',
        biomeTile: tile,
      });

      // Secret treasure chest high up
      collectibles.push({
        id: `L${levelId}_chest_${seg}`,
        x: cursorX + 305,
        y: groundY - 222,
        kind: 'chest',
        secret: true,
      });

      // Spikes / Cactus / Laser on lower deck to reward upper path
      hazards.push({
        id: `L${levelId}_lowHaz_${seg}`,
        x: cursorX + 190,
        y: groundY - 22,
        w: 95,
        h: 22,
        kind: world === 5 ? 'laser' : 'spikes',
        cycleMs: world === 5 ? 2400 : undefined,
      });

      enemies.push({
        id: `L${levelId}_te_${seg}`,
        type: pool.ground[(seg + 1) % pool.ground.length],
        x: cursorX + 360,
        y: groundY,
        patrolWidth: 110,
      });

      cursorX += baseW;
    } else if (pattern === 3) {
      // Wooden/stone bridge span with falling icicles or turrets/totems
      const spanW = 390;
      platforms.push({
        id: `L${levelId}_brL_${seg}`,
        x: cursorX,
        y: groundY - 15,
        w: 110,
        h: 155,
        kind: 'solid',
        biomeTile: tile,
      });
      platforms.push({
        id: `L${levelId}_brM_${seg}`,
        x: cursorX + 110,
        y: groundY - 15,
        w: 180,
        h: 22,
        kind: world === 3 ? 'ice' : 'bridge',
        biomeTile: tile,
      });
      platforms.push({
        id: `L${levelId}_brR_${seg}`,
        x: cursorX + 290,
        y: groundY - 15,
        w: 110,
        h: 155,
        kind: 'solid',
        biomeTile: tile,
      });

      if (world === 3) {
        hazards.push({
          id: `L${levelId}_icicle_${seg}`,
          x: cursorX + 175,
          y: 120,
          w: 32,
          h: 46,
          kind: 'icicle',
        });
      }

      if (world === 5) {
        hazards.push({
          id: `L${levelId}_laser_${seg}`,
          x: cursorX + 185,
          y: groundY - 135,
          w: 16,
          h: 120,
          kind: 'laser',
          cycleMs: 2200,
        });
      }

      const powerCycle: CollectibleKind[] = [
        'power_fireball',
        'power_boomerang',
        'power_speed',
        'power_doublejump',
        'power_invincible',
      ];
      collectibles.push({
        id: `L${levelId}_pw_${seg}`,
        x: cursorX + 200,
        y: groundY - 72,
        kind: powerCycle[(levelId + seg) % powerCycle.length],
      });

      enemies.push({
        id: `L${levelId}_bre_${seg}`,
        type: pool.heavy[seg % pool.heavy.length],
        x: cursorX + 330,
        y: groundY - 15,
        patrolWidth: 90,
      });

      cursorX += spanW + 10;
    } else if (pattern === 4) {
      // Vertical lift platform + dual enemies
      const gap1 = 115;
      hazards.push({
        id: `L${levelId}_vhaz_${seg}`,
        x: cursorX,
        y: groundY + 30,
        w: gap1,
        h: 90,
        kind: worldHazard === 'icicle' ? 'spikes' : worldHazard,
      });
      cursorX += gap1;

      platforms.push({
        id: `L${levelId}_vlift_${seg}`,
        x: cursorX,
        y: groundY - 70,
        w: 110,
        h: 22,
        kind: 'moving',
        moveAxis: 'y',
        moveRange: 75,
        moveSpeed: 1.5,
        biomeTile: tile,
      });
      collectibles.push({
        id: `L${levelId}_vlc_${seg}`,
        x: cursorX + 55,
        y: groundY - 175,
        kind: 'diamond',
      });
      cursorX += 140;

      const platW = 310;
      platforms.push({
        id: `L${levelId}_vland_${seg}`,
        x: cursorX,
        y: groundY - 30,
        w: platW,
        h: 170,
        kind: 'solid',
        biomeTile: tile,
      });
      enemies.push({
        id: `L${levelId}_vle1_${seg}`,
        type: pool.ground[seg % pool.ground.length],
        x: cursorX + 120,
        y: groundY - 30,
        patrolWidth: 120,
      });
      enemies.push({
        id: `L${levelId}_vle2_${seg}`,
        type: pool.flying[(seg + 1) % pool.flying.length],
        x: cursorX + 240,
        y: groundY - 180,
        patrolWidth: 140,
      });
      cursorX += platW;
    } else {
      // Scenic run with coin arc & guard encounter
      const runW = 380;
      platforms.push({
        id: `L${levelId}_run_${seg}`,
        x: cursorX,
        y: groundY,
        w: runW,
        h: 140,
        kind: world === 3 ? 'ice' : 'solid',
        biomeTile: tile,
      });

      for (let i = 0; i < 5; i++) {
        collectibles.push({
          id: `L${levelId}_arc_${seg}_${i}`,
          x: cursorX + 70 + i * 52,
          y: groundY - 48 - Math.sin((i / 4) * Math.PI) * 58,
          kind: 'coin',
        });
      }

      enemies.push({
        id: `L${levelId}_re_${seg}`,
        type: pool.ground[(levelId + seg) % pool.ground.length],
        x: cursorX + 250,
        y: groundY,
        patrolWidth: 140,
      });
      cursorX += runW;
    }

    sceneryZones.push({
      xStart: segStart,
      xEnd: cursorX,
      style: inCave
        ? 'cave'
        : world === 1 && seg === 2
        ? 'waterfall'
        : world === 2 && seg % 3 === 1
        ? 'temple'
        : world === 5
        ? 'fortress'
        : 'open',
    });
  }

  // Ensure at least one guaranteed secret treasure chest per level even if pattern 2 didn't trigger
  if (!collectibles.some((c) => c.kind === 'chest')) {
    const chestX = Math.floor(cursorX * 0.62);
    platforms.push({
      id: `L${levelId}_secretLedge`,
      x: chestX - 75,
      y: groundY - 175,
      w: 150,
      h: 22,
      kind: 'solid',
      biomeTile: getBiomeTileForWorld(world),
    });
    collectibles.push({
      id: `L${levelId}_secretChest`,
      x: chestX,
      y: groundY - 208,
      kind: 'chest',
      secret: true,
    });
  }

  // Inject world-specific Sword-Throwing Zombies (additional enemy category; preserves all existing enemies & bosses)
  const zRng = createRng(levelId * 7919 + world * 101);
  const candidatePlatforms = platforms.filter(
    (p) =>
      p.x >= 500 &&
      p.x + p.w <= cursorX - 30 &&
      p.w >= 145 &&
      (p.kind === 'solid' || p.kind === 'ice') &&
      !p.id.includes('_cp_') &&
      !p.id.includes('secretLedge')
  );

  const getZombiePoolForLevel = (): EnemyType[] => {
    if (levelId <= 2) return ['zombie_basic', 'zombie_runner'];
    if (levelId <= 5) return ['zombie_basic', 'zombie_runner', 'zombie_heavy'];
    if (world === 1) return ['zombie_basic', 'zombie_runner', 'zombie_armoured', 'zombie_heavy'];
    if (world === 2) return ['zombie_basic', 'zombie_runner', 'zombie_armoured', 'zombie_heavy', 'zombie_elite'];
    if (world === 3) return ['zombie_basic', 'zombie_runner', 'zombie_armoured', 'zombie_heavy', 'zombie_elite'];
    if (world === 4) return ['zombie_runner', 'zombie_armoured', 'zombie_heavy', 'zombie_elite'];
    return ['zombie_runner', 'zombie_armoured', 'zombie_heavy', 'zombie_elite'];
  };

  const zPool = getZombiePoolForLevel();
  const desiredZombies = Math.min(
    candidatePlatforms.length,
    levelId <= 2 ? 2 : world === 1 ? 3 : world <= 3 ? 4 : 5
  );

  // Deterministically shuffle candidate indices so every level gets unique zombie positions
  const indices = candidatePlatforms.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(zRng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  let placedZombies = 0;
  for (const idx of indices) {
    if (placedZombies >= desiredZombies) break;
    const plat = candidatePlatforms[idx];
    const minOffset = 48;
    const maxOffset = Math.max(minOffset + 10, plat.w - 48);
    const zx = Math.round(plat.x + minOffset + zRng() * (maxOffset - minOffset));
    const zy = plat.y;

    // Avoid spawning directly over spikes/lasers or stacked on an existing enemy
    const overlapsHazard = hazards.some(
      (h) => zx > h.x - 24 && zx < h.x + h.w + 24 && Math.abs(zy - h.y) < 38
    );
    const overlapsEnemy = enemies.some(
      (ex) => Math.abs(ex.x - zx) < 58 && Math.abs(ex.y - zy) < 42
    );
    if (overlapsHazard || overlapsEnemy) continue;

    let zType: EnemyType = zPool[(placedZombies + levelId + Math.floor(zRng() * zPool.length)) % zPool.length];
    // Rare glowing zombie appears periodically as a special high-reward encounter
    if (placedZombies === desiredZombies - 1 && (levelId % 3 === 0 || levelId === 10 || levelId === 50)) {
      zType = 'zombie_rare';
    }

    const mode: 'chase' | 'stand' =
      zType === 'zombie_runner' || zType === 'zombie_armoured'
        ? 'chase'
        : zType === 'zombie_heavy'
        ? zRng() > 0.3
          ? 'stand'
          : 'chase'
        : (placedZombies + levelId) % 2 === 0
        ? 'chase'
        : 'stand';

    enemies.push({
      id: `L${levelId}_zmb_${placedZombies}`,
      type: zType,
      x: zx,
      y: zy,
      patrolWidth: mode === 'stand' ? 40 : Math.max(95, Math.min(220, plat.w - 80)),
      speedMultiplier: 1 + levelId * 0.008,
      zombieMode: mode,
    });
    placedZombies++;
  }

  // Dedicated Giant Boss Arena right before the finish clearing (EVERY level 1-50!)
  const arenaStart = cursorX;
  const arenaW = isBossLevel ? 860 : 780;
  platforms.push({
    id: `L${levelId}_bossArena`,
    x: arenaStart,
    y: groundY,
    w: arenaW,
    h: 140,
    kind: 'solid',
    biomeTile: getBiomeTileForWorld(world),
  });
  // Two tactical elevated platforms in boss arena for dodging ground waves & lightning
  platforms.push({
    id: `L${levelId}_bossPlatL`,
    x: arenaStart + 95,
    y: groundY - 115,
    w: 145,
    h: 22,
    kind: 'solid',
    biomeTile: getBiomeTileForWorld(world),
  });
  platforms.push({
    id: `L${levelId}_bossPlatR`,
    x: arenaStart + arenaW - 245,
    y: groundY - 115,
    w: 145,
    h: 22,
    kind: 'solid',
    biomeTile: getBiomeTileForWorld(world),
  });
  collectibles.push({
    id: `L${levelId}_bossHeart`,
    x: arenaStart + 165,
    y: groundY - 155,
    kind: 'heart',
  });
  collectibles.push({
    id: `L${levelId}_bossPower`,
    x: arenaStart + arenaW - 175,
    y: groundY - 155,
    kind: levelId % 2 === 0 ? 'power_fireball' : 'power_shield',
  });
  sceneryZones.push({
    xStart: arenaStart,
    xEnd: arenaStart + arenaW,
    style: 'storm',
  });
  cursorX += arenaW;

  // Finish clearing where Maya is tied up & helicopter arrives (or final rescue on L50)
  const finishClearingW = 540;
  platforms.push({
    id: `L${levelId}_finish`,
    x: cursorX,
    y: groundY,
    w: finishClearingW,
    h: 140,
    kind: 'solid',
    biomeTile: getBiomeTileForWorld(world),
  });

  const finishX = cursorX + 270;
  const totalWidth = cursorX + finishClearingW;
  const boss = getBossConfig(levelId, arenaStart, arenaW);

  return {
    id: levelId,
    world,
    worldName,
    title: LEVEL_TITLES[levelId - 1] ?? `Sector ${levelId}`,
    subtitle: `World ${world} · Level ${levelId}`,
    missionBrief: LEVEL_BRIEFS[levelId - 1] ?? 'Advance through the enemy territory and rescue Maya.',
    width: totalWidth,
    height,
    spawnX: 110,
    spawnY: groundY - 64,
    finishX,
    finishY: groundY,
    hasUndergroundCave: hasCaveFeature,
    hasWaterfall: world === 1,
    hasSandstorm: world === 2 && levelInWorld >= 4,
    hasSnowfall: world === 3,
    hasLavaGlow: world === 4,
    hasSearchlights: world === 5,
    sceneryZones,
    platforms,
    hazards,
    collectibles,
    enemies,
    checkpoints,
    boss,
    targetTimeSec: isBossLevel ? 150 : 105 + levelInWorld * 4,
  };
}

export const ALL_LEVELS: LevelConfig[] = Array.from({ length: 50 }, (_, idx) =>
  buildLevel(idx + 1)
);

export function getLevelById(levelId: number): LevelConfig {
  return ALL_LEVELS[Math.max(0, Math.min(49, levelId - 1))];
}
