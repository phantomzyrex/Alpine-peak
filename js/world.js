/**
 * Alpine Peak v2 — Grand Ski Resort & Bustling Alpine Town Tycoon (`js/world.js`)
 * ===============================================================================
 * Owns `window.SanctuaryWorld`:
 *   - Default `28x28` grid (`24, 28, 32` supported) with Tall Isometric Geometry
 *     (`128x224` tiles, `Y_OFFSET = 96`, `TOP_PAD_Y = 160`, `ANCHOR_Y = 192`,
 *     `ELEV_STEP_Z = 4.0`, `ELEV_STEP_PX = 16`, 5 elevations `Lv 0..4`).
 *   - Continuous `(size + 1) x (size + 1)` integer corner-height grid `cornerZ[r][c] in {0..4}`
 *     with 8-neighbor Chebyshev BFS slope propagation (`maxCorner - minCorner <= 1`, zero seam gaps)
 *     plus Multi-Tile Sculpt Brushes (`sculptBrush`: `1x1`, `3x3` massif/cirque/plateau, `smooth`, `corridor`).
 *   - All `15` Terrain Surfaces (`untouched_powder`, `groomed_piste`, `mogul_chute`, `glacier_ice`,
 *     `wind_hardpack`, `spring_slush`, `tubing_chute`, `nordic_track`, `alpine_cobble`, `red_brick`,
 *     `packed_snow_path`, `timber_deck`, `slate_flagstone`, `alpine_scree`, `asphalt_road`) with
 *     12-way scalloped snow/piste fringes (`n,e,s,w,in_*,out_*`).
 *   - All `4` Hydrology / Crevasse Types (`frozen_lake` + `frozen_icefall_{sw,se}`, `thermal_spring`,
 *     `meltwater_brook` + `cascading_waterfall_{sw,se}`, and `glacier_crevasse`) with 12-code
 *     `ice_bank_*`, `spring_bank_*`, and `brook_bank_*` decals.
 *   - All `10` Uphill Lift Systems (`magic_carpet`, `rope_tow`, `tbar_lift`, `classic_2chair`,
 *     `chairlift`, `bubble_6chair`, `egg_gondola`, `gondola`, `tramway_3s`, `cliff_funicular`)
 *     with exact 3D cable & cross-arm sheave locks (`0.0px` carrier grip drift).
 *   - All `3` `2x2` Composite Landmarks (`grand_hotel_2x2`, `thermal_spa_2x2`, `base_lodge_2x2`),
 *     looped Swiss mountain rack-railway (`train_track_curve_*`, `stone_viaduct_*`, `rail_crossing_gate_*`),
 *     `150+` placeable structures/amenities/flora, `10` drifting volumetric `cloud_puff_v{0..2}` clouds
 *     (`getFloatingClouds()`, `updateClouds(dt)`), and `5` ultra-dense `28x28` reference-grade presets.
 */
(function () {
  "use strict";

  const TILE_W = 128;
  const TILE_H = 224;
  const SCALE = 4;
  const Y_OFFSET = 96;
  const TOP_PAD_Y = 160;
  const ANCHOR_Y = 192;
  const MAX_ELEV = 4;
  const ELEV_STEP_Z = 4.0;
  const ELEV_STEP_PX = 16;

  // All 17 Terrain Surfaces (`15` v2 + `2` v3 festive/ice plaza surfaces locked in #125)
  const SURFACES = [
    "untouched_powder",
    "groomed_piste",
    "mogul_chute",
    "glacier_ice",
    "wind_hardpack",
    "spring_slush",
    "tubing_chute",
    "nordic_track",
    "alpine_cobble",
    "red_brick",
    "packed_snow_path",
    "timber_deck",
    "slate_flagstone",
    "alpine_scree",
    "asphalt_road",
    "festive_mosaic_cobble",
    "crystal_ice_promenade",
  ];
  const SURFACE_SET = new Set(SURFACES);

  // Mountain skiable snow/ice surfaces vs walkable village paving surfaces
  const MOUNTAIN_SNOW_SURFACES = new Set([
    "untouched_powder",
    "groomed_piste",
    "mogul_chute",
    "glacier_ice",
    "wind_hardpack",
    "spring_slush",
    "tubing_chute",
    "nordic_track",
  ]);

  const GROOMABLE_SURFACES = new Set([
    "groomed_piste",
    "mogul_chute",
    "tubing_chute",
    "nordic_track",
    "wind_hardpack",
    "spring_slush",
  ]);

  const VILLAGE_WALK_SURFACES = new Set([
    "alpine_cobble",
    "red_brick",
    "packed_snow_path",
    "timber_deck",
    "slate_flagstone",
    "asphalt_road",
    "festive_mosaic_cobble",
    "crystal_ice_promenade",
  ]);

  // Higher rank casts scalloped snow/piste/brick/mosaic/ice fringe onto lower-rank flat dry neighbor
  const SURFACE_PRIORITY = {
    untouched_powder: 5,
    groomed_piste: 4,
    glacier_ice: 3,
    wind_hardpack: 3,
    spring_slush: 3,
    mogul_chute: 3,
    tubing_chute: 3,
    nordic_track: 3,
    packed_snow_path: 2,
    crystal_ice_promenade: 1.7,
    festive_mosaic_cobble: 1.6,
    red_brick: 1.5,
    alpine_cobble: 1,
    timber_deck: 1,
    slate_flagstone: 1,
    asphalt_road: 1,
    alpine_scree: 1,
  };

  // Exact flat variant counts (`v0..v3` for core 4 + 2 v3 festive surfaces, `v0..v1` for 11 v2 surfaces)
  const SURFACE_VARIANTS = {
    untouched_powder: 4,
    groomed_piste: 4,
    mogul_chute: 4,
    alpine_cobble: 4,
    glacier_ice: 2,
    wind_hardpack: 2,
    spring_slush: 2,
    tubing_chute: 2,
    nordic_track: 2,
    red_brick: 2,
    packed_snow_path: 2,
    timber_deck: 2,
    slate_flagstone: 2,
    alpine_scree: 2,
    asphalt_road: 2,
    festive_mosaic_cobble: 4,
    crystal_ice_promenade: 4,
  };

  const SURFACE_COSTS = {
    untouched_powder: 10,
    groomed_piste: 20,
    mogul_chute: 25,
    glacier_ice: 28,
    wind_hardpack: 18,
    spring_slush: 16,
    tubing_chute: 30,
    nordic_track: 22,
    alpine_cobble: 30,
    red_brick: 32,
    packed_snow_path: 18,
    timber_deck: 34,
    slate_flagstone: 32,
    alpine_scree: 15,
    asphalt_road: 28,
    festive_mosaic_cobble: 38,
    crystal_ice_promenade: 42,
  };

  const WATER_TYPES = [
    "frozen_lake",
    "thermal_spring",
    "meltwater_brook",
    "glacier_crevasse",
  ];
  const WATER_SET = new Set(WATER_TYPES);

  const WATER_COSTS = {
    frozen_lake: 35,
    thermal_spring: 55,
    meltwater_brook: 40,
    glacier_crevasse: 45,
  };

  const COMPOSITE_2X2_IDS = new Set([
    "grand_hotel_2x2",
    "thermal_spa_2x2",
    "base_lodge_2x2",
    "festival_ferris_wheel_2x2",
    "sphinx_observatory_2x2",
  ]);

  const COMPOSITE_2X2_LIGHTS = {
    grand_hotel_2x2: { liftZ: 2.9, radius: 4.8, color: "#ffd080", intensity: 0.98, kind: "warm", flicker: false, emissiveKind: "hotel_2x2" },
    thermal_spa_2x2: { liftZ: 2.6, radius: 4.6, color: "#8ff0ff", intensity: 0.94, kind: "spring", flicker: true, emissiveKind: "spa_2x2" },
    base_lodge_2x2: { liftZ: 2.8, radius: 4.7, color: "#ffc674", intensity: 0.96, kind: "warm", flicker: false, emissiveKind: "lodge_2x2" },
    festival_ferris_wheel_2x2: { liftZ: 3.6, radius: 5.2, color: "#ffd884", intensity: 1.0, kind: "warm", flicker: true, emissiveKind: "ferris_wheel_2x2" },
    sphinx_observatory_2x2: { liftZ: 3.4, radius: 4.8, color: "#9ee8ff", intensity: 0.96, kind: "cyan", flicker: false, emissiveKind: "observatory_2x2" },
  };

  const EDGE_NEIGHBORS = [
    { code: "n", edge: "N", opp: "S", dr: -1, dc: 0 },
    { code: "e", edge: "E", opp: "W", dr: 0, dc: 1 },
    { code: "s", edge: "S", opp: "N", dr: 1, dc: 0 },
    { code: "w", edge: "W", opp: "E", dr: 0, dc: -1 },
  ];

  const INNER_CORNERS = [
    { code: "in_nw", short: "nw", d1: "n", d2: "w" },
    { code: "in_ne", short: "ne", d1: "n", d2: "e" },
    { code: "in_se", short: "se", d1: "s", d2: "e" },
    { code: "in_sw", short: "sw", d1: "s", d2: "w" },
  ];

  const OUTER_CORNERS = [
    { code: "out_nw", short: "nw", d1: "n", d2: "w", dr: -1, dc: -1 },
    { code: "out_ne", short: "ne", d1: "n", d2: "e", dr: -1, dc: 1 },
    { code: "out_se", short: "se", d1: "s", d2: "e", dr: 1, dc: 1 },
    { code: "out_sw", short: "sw", d1: "s", d2: "w", dr: 1, dc: -1 },
  ];

  const WALKWAY_EDGE_MAP = {
    NS: "town_walkway_ns",
    EW: "town_walkway_ew",
    NE: "town_walkway_ne",
    NW: "town_walkway_nw",
    ES: "town_walkway_se",
    SW: "town_walkway_sw",
    ENW: "town_walkway_t_n",
    ENS: "town_walkway_t_e",
    ESW: "town_walkway_t_s",
    NSW: "town_walkway_t_w",
    ENSW: "town_walkway_cross",
  };

  const STAIRS_SPECS = {
    snow_stairs_n: { slopeMask: "1100", lowEdge: "S", highEdge: "N" },
    snow_stairs_e: { slopeMask: "0110", lowEdge: "W", highEdge: "E" },
    snow_stairs_s: { slopeMask: "0011", lowEdge: "N", highEdge: "S" },
    snow_stairs_w: { slopeMask: "1001", lowEdge: "E", highEdge: "W" },
    covered_escalator_n: { slopeMask: "1100", lowEdge: "S", highEdge: "N" },
    covered_escalator_e: { slopeMask: "0110", lowEdge: "W", highEdge: "E" },
    covered_escalator_s: { slopeMask: "0011", lowEdge: "N", highEdge: "S" },
    covered_escalator_w: { slopeMask: "1001", lowEdge: "E", highEdge: "W" },
  };

  const SLOPE_TO_STAIRS = {
    "1100": "snow_stairs_n",
    "0110": "snow_stairs_e",
    "0011": "snow_stairs_s",
    "1001": "snow_stairs_w",
  };

  const SLOPE_TO_ESCALATOR = {
    "1100": "covered_escalator_n",
    "0110": "covered_escalator_e",
    "0011": "covered_escalator_s",
    "1001": "covered_escalator_w",
  };

  // All 10 Uphill Lift Systems locked in #68
  const LIFT_SPECS = {
    magic_carpet: {
      type: "magic_carpet",
      name: "Covered Magic Carpet Conveyor",
      zCable: 1.5,
      cableLiftPx: 6,
      halfSepPx: 0,
      minLen: 2,
      maxLen: 10,
      pylonInterval: 0,
      midEveryCell: true,
      isSurface: true,
      hasOverheadCable: false,
      noAxisSuffix: false,
      basePrefix: "magic_carpet_base",
      topPrefix: "magic_carpet_top",
      midPrefix: "magic_carpet_mid",
      pylonPrefix: null,
      carrierSprite: "ski_school_kid",
      emptyCarrierSprite: "skier_beginner",
      baseCost: 280,
      perCellCost: 40,
    },
    rope_tow: {
      type: "rope_tow",
      name: "Beginner Surface Rope Tow",
      zCable: 3.0,
      cableLiftPx: 12,
      halfSepPx: 5,
      minLen: 3,
      maxLen: 14,
      pylonInterval: 0,
      midEveryCell: false,
      isSurface: true,
      hasOverheadCable: true,
      noAxisSuffix: true,
      basePrefix: "rope_tow_base",
      topPrefix: "rope_tow_top",
      midPrefix: null,
      pylonPrefix: null,
      carrierSprite: "skier_beginner",
      emptyCarrierSprite: null,
      baseCost: 360,
      perCellCost: 45,
    },
    tbar_lift: {
      type: "tbar_lift",
      name: "Glacier Bowl Surface T-Bar",
      zCable: 7.5,
      cableLiftPx: 30,
      halfSepPx: 7,
      minLen: 3,
      maxLen: 18,
      pylonInterval: 3,
      midEveryCell: false,
      isSurface: true,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "tbar_base",
      topPrefix: "tbar_top",
      midPrefix: null,
      pylonPrefix: "tbar_pylon",
      carrierSprite: "tbar_skier_pair",
      emptyCarrierSprite: null,
      baseCost: 520,
      perCellCost: 65,
    },
    classic_2chair: {
      type: "classic_2chair",
      name: "Heritage Fixed-Grip Double Chair",
      zCable: 11.0,
      cableLiftPx: 44,
      halfSepPx: 10,
      minLen: 3,
      maxLen: 22,
      pylonInterval: 3,
      midEveryCell: false,
      isSurface: false,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "classic_2chair_base",
      topPrefix: "classic_2chair_top",
      midPrefix: null,
      pylonPrefix: "lift_pylon",
      carrierSprite: "chairlift_rider",
      emptyCarrierSprite: "chairlift_empty",
      baseCost: 620,
      perCellCost: 75,
    },
    chairlift: {
      type: "chairlift",
      name: "Alpine Detachable Quad Chairlift",
      zCable: 11.0,
      cableLiftPx: 44,
      halfSepPx: 10,
      minLen: 3,
      maxLen: 24,
      pylonInterval: 3,
      midEveryCell: false,
      isSurface: false,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "chairlift_base",
      topPrefix: "chairlift_top",
      midPrefix: null,
      pylonPrefix: "lift_pylon",
      carrierSprite: "chairlift_rider",
      emptyCarrierSprite: "chairlift_empty",
      baseCost: 720,
      perCellCost: 85,
    },
    bubble_6chair: {
      type: "bubble_6chair",
      name: "Express 6-Pack Orange Bubble Chair",
      zCable: 11.0,
      cableLiftPx: 44,
      halfSepPx: 10,
      minLen: 3,
      maxLen: 24,
      pylonInterval: 3,
      midEveryCell: false,
      isSurface: false,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "bubble_6chair_base",
      topPrefix: "bubble_6chair_top",
      midPrefix: null,
      pylonPrefix: "lift_pylon",
      carrierSprite: "bubble_chair_orange",
      emptyCarrierSprite: "bubble_chair_orange",
      baseCost: 920,
      perCellCost: 105,
    },
    egg_gondola: {
      type: "egg_gondola",
      name: "Retro Alpine 4-Person Egg Gondola",
      zCable: 14.0,
      cableLiftPx: 56,
      halfSepPx: 12,
      minLen: 4,
      maxLen: 24,
      pylonInterval: 3,
      midEveryCell: false,
      isSurface: false,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "egg_gondola_base",
      topPrefix: "egg_gondola_top",
      midPrefix: null,
      pylonPrefix: "gondola_pylon",
      carrierSprite: "egg_gondola_cabin",
      emptyCarrierSprite: "egg_gondola_cabin",
      baseCost: 1020,
      perCellCost: 115,
    },
    gondola: {
      type: "gondola",
      name: "Red Summit Express Gondola",
      zCable: 14.0,
      cableLiftPx: 56,
      halfSepPx: 12,
      minLen: 4,
      maxLen: 26,
      pylonInterval: 3,
      midEveryCell: false,
      isSurface: false,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "gondola_base",
      topPrefix: "gondola_top",
      midPrefix: null,
      pylonPrefix: "gondola_pylon",
      carrierSprite: "gondola_cabin",
      emptyCarrierSprite: "gondola_cabin",
      baseCost: 1150,
      perCellCost: 125,
    },
    tramway_3s: {
      type: "tramway_3s",
      name: "Swiss 3S Panoramic Peak Tramway",
      zCable: 16.0,
      cableLiftPx: 64,
      halfSepPx: 13,
      minLen: 4,
      maxLen: 26,
      pylonInterval: 5,
      midEveryCell: false,
      isSurface: false,
      hasOverheadCable: true,
      noAxisSuffix: false,
      basePrefix: "tramway_3s_base",
      topPrefix: "tramway_3s_top",
      midPrefix: null,
      pylonPrefix: "tramway_pylon",
      carrierSprite: "tram_cabin_3s",
      emptyCarrierSprite: "tram_cabin_3s",
      baseCost: 1550,
      perCellCost: 155,
    },
    cliff_funicular: {
      type: "cliff_funicular",
      name: "Stepped Cliff Inclined Cog Funicular",
      zCable: 1.5,
      cableLiftPx: 6,
      halfSepPx: 0,
      minLen: 3,
      maxLen: 16,
      pylonInterval: 0,
      midEveryCell: true,
      isSurface: true,
      hasOverheadCable: false,
      noAxisSuffix: false,
      basePrefix: "funicular_base",
      topPrefix: "funicular_top",
      midPrefix: "funicular_track",
      pylonPrefix: null,
      carrierSprite: "funicular_car",
      emptyCarrierSprite: "funicular_car",
      baseCost: 840,
      perCellCost: 95,
    },
  };

  // All `assets/flora/` keys locked in #68 & #69
  const FLORA_DEFS = {
    // Multi-Scale Alpine Forests, Crags, Ice Caves & Wildlife Props
    spruce_tall_v0: { id: "spruce_tall_v0", baseId: "spruce_tall", name: "Towering Norway Spruce I", category: "nature", cost: 25, frames: 1, tall: true, allowSlope: true },
    spruce_tall_v1: { id: "spruce_tall_v1", baseId: "spruce_tall", name: "Towering Norway Spruce II", category: "nature", cost: 25, frames: 1, tall: true, allowSlope: true },
    spruce_med_v0: { id: "spruce_med_v0", baseId: "spruce_med", name: "Snow-Laden Alpine Spruce I", category: "nature", cost: 20, frames: 1, tall: true, allowSlope: true },
    spruce_med_v1: { id: "spruce_med_v1", baseId: "spruce_med", name: "Snow-Laden Alpine Spruce II", category: "nature", cost: 20, frames: 1, tall: true, allowSlope: true },
    golden_larch_v0: { id: "golden_larch_v0", baseId: "golden_larch", name: "Golden Winter Larch I", category: "nature", cost: 26, frames: 1, tall: true, allowSlope: true },
    golden_larch_v1: { id: "golden_larch_v1", baseId: "golden_larch", name: "Golden Winter Larch II", category: "nature", cost: 26, frames: 1, tall: true, allowSlope: true },
    weeping_hemlock_v0: { id: "weeping_hemlock_v0", baseId: "weeping_hemlock", name: "Weeping Mountain Hemlock I", category: "nature", cost: 24, frames: 1, tall: true, allowSlope: true },
    weeping_hemlock_v1: { id: "weeping_hemlock_v1", baseId: "weeping_hemlock", name: "Weeping Mountain Hemlock II", category: "nature", cost: 24, frames: 1, tall: true, allowSlope: true },
    dwarf_krummholz_v0: { id: "dwarf_krummholz_v0", baseId: "dwarf_krummholz", name: "Timberline Dwarf Krummholz I", category: "nature", cost: 16, frames: 1, tall: false, allowSlope: true },
    dwarf_krummholz_v1: { id: "dwarf_krummholz_v1", baseId: "dwarf_krummholz", name: "Timberline Dwarf Krummholz II", category: "nature", cost: 16, frames: 1, tall: false, allowSlope: true },
    frosted_birch_v0: { id: "frosted_birch_v0", baseId: "frosted_birch", name: "Frosted Silver Birch I", category: "nature", cost: 22, frames: 1, tall: true, allowSlope: true },
    frosted_birch_v1: { id: "frosted_birch_v1", baseId: "frosted_birch", name: "Frosted Silver Birch II", category: "nature", cost: 22, frames: 1, tall: true, allowSlope: true },
    alpine_shrub_cluster: { id: "alpine_shrub_cluster", baseId: "alpine_shrub_cluster", name: "Winter Heather & Snowberry Shrubs", category: "nature", cost: 14, frames: 1, tall: false, allowSlope: true },
    fallen_snow_log: { id: "fallen_snow_log", baseId: "fallen_snow_log", name: "Snow-Dusted Fallen Pine Log", category: "nature", cost: 15, frames: 1, tall: false, allowSlope: true },
    summit_crag_v0: { id: "summit_crag_v0", baseId: "summit_crag", name: "Matterhorn Granite Crag I", category: "nature", cost: 35, frames: 1, tall: true, allowSlope: true, blocksSki: true },
    summit_crag_v1: { id: "summit_crag_v1", baseId: "summit_crag", name: "Matterhorn Granite Crag II", category: "nature", cost: 35, frames: 1, tall: true, allowSlope: true, blocksSki: true },
    snow_boulder_v0: { id: "snow_boulder_v0", baseId: "snow_boulder", name: "Glacial Snow Boulder I", category: "nature", cost: 18, frames: 1, tall: false, allowSlope: true },
    snow_boulder_v1: { id: "snow_boulder_v1", baseId: "snow_boulder", name: "Glacial Snow Boulder II", category: "nature", cost: 18, frames: 1, tall: false, allowSlope: true },
    glacier_ice_cave: {
      id: "glacier_ice_cave",
      baseId: "glacier_ice_cave",
      name: "Glowing Blue Glacier Ice Cave",
      category: "nature",
      cost: 95,
      frames: 1,
      tall: true,
      allowSlope: true,
      light: { radius: 2.8, color: "#6ef0ff", intensity: 0.82, liftZ: 1.4, kind: "cyan" },
    },
    wildlife_feeding_rack: { id: "wildlife_feeding_rack", baseId: "wildlife_feeding_rack", name: "Timber Alpine Deer Hay Crib", category: "nature", cost: 45, frames: 1, tall: false, allowSlope: true },
    eagle_eyrie_crag: { id: "eagle_eyrie_crag", baseId: "eagle_eyrie_crag", name: "Golden Eagle Eyrie Spire", category: "nature", cost: 85, frames: 1, tall: true, allowSlope: true, blocksSki: true },

    // Trail Rating Gates, World-Cup Racing & Safety Props
    gate_green_circle: { id: "gate_green_circle", baseId: "gate_green_circle", name: "Green Circle Beginner Gate", category: "piste_mark", cost: 40, frames: 1, tall: false, allowSlope: true, runRating: "green" },
    gate_blue_square: { id: "gate_blue_square", baseId: "gate_blue_square", name: "Blue Square Cruiser Gate", category: "piste_mark", cost: 45, frames: 1, tall: false, allowSlope: true, runRating: "blue" },
    gate_black_diamond: { id: "gate_black_diamond", baseId: "gate_black_diamond", name: "Black Diamond Expert Gate", category: "piste_mark", cost: 55, frames: 1, tall: false, allowSlope: true, runRating: "black" },
    gate_double_black: { id: "gate_double_black", baseId: "gate_double_black", name: "Double Black Extreme Couloir Sign", category: "piste_mark", cost: 65, frames: 1, tall: false, allowSlope: true, runRating: "black" },
    kids_forest_arch: { id: "kids_forest_arch", baseId: "kids_forest_arch", name: "Carved Bear Ski-School Forest Arch", category: "piste_mark", cost: 75, frames: 1, tall: true, allowSlope: true, runRating: "green" },
    nordic_signpost: { id: "nordic_signpost", baseId: "nordic_signpost", name: "Nordic Cross-Country Trail Sign", category: "piste_mark", cost: 35, frames: 1, tall: false, allowSlope: true },
    cliff_warning_rope_ns: { id: "cliff_warning_rope_ns", baseId: "cliff_warning_rope", name: "Cliff Warning Bamboo Rope (N-S)", category: "piste_mark", cost: 30, frames: 1, tall: false, allowSlope: true },
    cliff_warning_rope_ew: { id: "cliff_warning_rope_ew", baseId: "cliff_warning_rope", name: "Cliff Warning Bamboo Rope (E-W)", category: "piste_mark", cost: 30, frames: 1, tall: false, allowSlope: true },
    race_start_house: { id: "race_start_house", baseId: "race_start_house", name: "World-Cup Alpine Race Start Hut", category: "piste_mark", cost: 140, frames: 1, tall: true, allowSlope: true, runRating: "black" },
    slalom_poles_red_blue: { id: "slalom_poles_red_blue", baseId: "slalom_poles_red_blue", name: "Red & Blue Slalom Race Gates", category: "piste_mark", cost: 50, frames: 1, tall: false, allowSlope: true },
    gs_panel_gates: { id: "gs_panel_gates", baseId: "gs_panel_gates", name: "Giant Slalom Fabric Panel Gates", category: "piste_mark", cost: 60, frames: 1, tall: false, allowSlope: true },
    finish_timing_arch_ns: {
      id: "finish_timing_arch_ns",
      baseId: "finish_timing_arch",
      name: "Swiss LED Race Finish Arch (N-S)",
      category: "piste_mark",
      cost: 165,
      frames: 1,
      tall: true,
      allowSlope: true,
      light: { radius: 2.8, color: "#ffe08a", intensity: 0.85, liftZ: 2.0, kind: "warm" },
    },
    finish_timing_arch_ew: {
      id: "finish_timing_arch_ew",
      baseId: "finish_timing_arch",
      name: "Swiss LED Race Finish Arch (E-W)",
      category: "piste_mark",
      cost: 165,
      frames: 1,
      tall: true,
      allowSlope: true,
      light: { radius: 2.8, color: "#ffe08a", intensity: 0.85, liftZ: 2.0, kind: "warm" },
    },
    champions_podium: { id: "champions_podium", baseId: "champions_podium", name: "1-2-3 Medal Champions Podium", category: "piste_mark", cost: 110, frames: 1, tall: false, allowSlope: false },
    safety_net_ns: { id: "safety_net_ns", baseId: "safety_net", name: "Alpine Orange B-Net Fence (N-S)", category: "piste_mark", cost: 35, frames: 1, tall: false, allowSlope: true },
    safety_net_ew: { id: "safety_net_ew", baseId: "safety_net", name: "Alpine Orange B-Net Fence (E-W)", category: "piste_mark", cost: 35, frames: 1, tall: false, allowSlope: true },
    tower_crash_pad: { id: "tower_crash_pad", baseId: "tower_crash_pad", name: "Yellow Pylon Safety Crash Mattress", category: "piste_mark", cost: 32, frames: 1, tall: false, allowSlope: true },
    wind_drift_fence_ns: { id: "wind_drift_fence_ns", baseId: "wind_drift_fence", name: "Slatted Timber Snow-Drift Fence (N-S)", category: "piste_mark", cost: 34, frames: 1, tall: false, allowSlope: true },
    wind_drift_fence_ew: { id: "wind_drift_fence_ew", baseId: "wind_drift_fence", name: "Slatted Timber Snow-Drift Fence (E-W)", category: "piste_mark", cost: 34, frames: 1, tall: false, allowSlope: true },

    // Pro Freestyle Terrain Park & Tubing Props
    park_kicker_sw: { id: "park_kicker_sw", baseId: "park_kicker", name: "Freestyle Medium Kicker (SW)", category: "park", cost: 110, frames: 1, tall: false, allowSlope: true, isJump: true, trickBonus: 18 },
    park_kicker_se: { id: "park_kicker_se", baseId: "park_kicker", name: "Freestyle Medium Kicker (SE)", category: "park", cost: 110, frames: 1, tall: false, allowSlope: true, isJump: true, trickBonus: 18 },
    big_air_kicker_sw: { id: "big_air_kicker_sw", baseId: "big_air_kicker", name: "Pro X-Games Big-Air Kicker (SW)", category: "park", cost: 175, frames: 1, tall: true, allowSlope: true, isJump: true, trickBonus: 28 },
    big_air_kicker_se: { id: "big_air_kicker_se", baseId: "big_air_kicker", name: "Pro X-Games Big-Air Kicker (SE)", category: "park", cost: 175, frames: 1, tall: true, allowSlope: true, isJump: true, trickBonus: 28 },
    stunt_airbag_sw: { id: "stunt_airbag_sw", baseId: "stunt_airbag", name: "Pro Inflatable Stunt Landing Airbag (SW)", category: "park", cost: 160, frames: 1, tall: false, allowSlope: true, isJump: true, trickBonus: 24 },
    stunt_airbag_se: { id: "stunt_airbag_se", baseId: "stunt_airbag", name: "Pro Inflatable Stunt Landing Airbag (SE)", category: "park", cost: 160, frames: 1, tall: false, allowSlope: true, isJump: true, trickBonus: 24 },
    park_rail_ns: { id: "park_rail_ns", baseId: "park_rail", name: "Steel Jib Grind Box & Rail (N-S)", category: "park", cost: 85, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 14 },
    park_rail_ew: { id: "park_rail_ew", baseId: "park_rail", name: "Steel Jib Grind Box & Rail (E-W)", category: "park", cost: 85, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 14 },
    rainbow_cbox_ns: { id: "rainbow_cbox_ns", baseId: "rainbow_cbox", name: "Arched Rainbow Jib C-Box (N-S)", category: "park", cost: 115, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 22 },
    rainbow_cbox_ew: { id: "rainbow_cbox_ew", baseId: "rainbow_cbox", name: "Arched Rainbow Jib C-Box (E-W)", category: "park", cost: 115, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 22 },
    kinked_stair_rail_ns: { id: "kinked_stair_rail_ns", baseId: "kinked_stair_rail", name: "Down-Flat-Down Stair Rail (N-S)", category: "park", cost: 105, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 20 },
    kinked_stair_rail_ew: { id: "kinked_stair_rail_ew", baseId: "kinked_stair_rail", name: "Down-Flat-Down Stair Rail (E-W)", category: "park", cost: 105, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 20 },
    timber_wallride_sw: { id: "timber_wallride_sw", baseId: "timber_wallride", name: "Angled Timber Wallride (SW)", category: "park", cost: 125, frames: 1, tall: true, allowSlope: true, isRail: true, trickBonus: 22 },
    timber_wallride_se: { id: "timber_wallride_se", baseId: "timber_wallride", name: "Angled Timber Wallride (SE)", category: "park", cost: 125, frames: 1, tall: true, allowSlope: true, isRail: true, trickBonus: 22 },
    halfpipe_wall_ns: { id: "halfpipe_wall_ns", baseId: "halfpipe_wall", name: "Sculpted Superpipe Wall (N-S)", category: "park", cost: 130, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 24 },
    halfpipe_wall_ew: { id: "halfpipe_wall_ew", baseId: "halfpipe_wall", name: "Sculpted Superpipe Wall (E-W)", category: "park", cost: 130, frames: 1, tall: false, allowSlope: true, isRail: true, trickBonus: 24 },
    boardercross_berm_sw: { id: "boardercross_berm_sw", baseId: "boardercross_berm", name: "Banked Boardercross Berm (SW)", category: "park", cost: 95, frames: 1, tall: false, allowSlope: true, trickBonus: 16 },
    boardercross_berm_se: { id: "boardercross_berm_se", baseId: "boardercross_berm", name: "Banked Boardercross Berm (SE)", category: "park", cost: 95, frames: 1, tall: false, allowSlope: true, trickBonus: 16 },
    tubing_bale_corral: { id: "tubing_bale_corral", baseId: "tubing_bale_corral", name: "Snow-Tubing Hay Bale Catch Corral", category: "park", cost: 70, frames: 1, tall: false, allowSlope: true },

    // Snowmaking, Night-Skiing, Avalanche Ops & Summit Prayer Flags
    snow_cannon_sw: { id: "snow_cannon_sw", baseId: "snow_cannon", name: "Fan Snowmaking Cannon (SW)", category: "tech", cost: 145, frames: 4, tall: false, allowSlope: true, boostsSnow: true },
    snow_cannon_se: { id: "snow_cannon_se", baseId: "snow_cannon", name: "Fan Snowmaking Cannon (SE)", category: "tech", cost: 145, frames: 4, tall: false, allowSlope: true, boostsSnow: true },
    giraffe_snow_lance: { id: "giraffe_snow_lance", baseId: "giraffe_snow_lance", name: "Tall Aluminum Snowmaking Lance", category: "tech", cost: 130, frames: 4, tall: true, allowSlope: true, boostsSnow: true },
    slope_floodlight: {
      id: "slope_floodlight",
      baseId: "slope_floodlight",
      name: "Night-Skiing Lattice Floodlight",
      category: "tech",
      cost: 135,
      frames: 4,
      tall: true,
      allowSlope: true,
      light: { radius: 4.4, color: "#dceeff", intensity: 1.0, liftZ: 3.4, kind: "floodlight" },
    },
    neon_park_light: {
      id: "neon_park_light",
      baseId: "neon_park_light",
      name: "Cyan & Magenta Freestyle Park LED Mast",
      category: "tech",
      cost: 150,
      frames: 4,
      tall: true,
      allowSlope: true,
      light: { radius: 4.2, color: "#df68ff", intensity: 0.98, liftZ: 3.2, kind: "neon", flicker: true },
    },
    gazex_blaster: { id: "gazex_blaster", baseId: "gazex_blaster", name: "Summit Gazex Avalanche Blaster", category: "tech", cost: 160, frames: 1, tall: true, allowSlope: true },
    weather_wind_mast: { id: "weather_wind_mast", baseId: "weather_wind_mast", name: "Alpine Anemometer & Windsock Mast", category: "tech", cost: 90, frames: 4, tall: true, allowSlope: true },
    prayer_flags_ns: { id: "prayer_flags_ns", baseId: "prayer_flags", name: "Himalayan/Alpine Ridge Prayer Flags (N-S)", category: "piste_mark", cost: 40, frames: 1, tall: false, allowSlope: true },
    prayer_flags_ew: { id: "prayer_flags_ew", baseId: "prayer_flags", name: "Himalayan/Alpine Ridge Prayer Flags (E-W)", category: "piste_mark", cost: 40, frames: 1, tall: false, allowSlope: true },
  };

  // All `assets/structures/` & `assets/amenities/` keys locked in #68, #70, #74
  const STRUCTURE_DEFS = {
    // 11-way Heated Town Walkways
    town_walkway_ns: { id: "town_walkway_ns", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "S"] },
    town_walkway_ew: { id: "town_walkway_ew", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["E", "W"] },
    town_walkway_ne: { id: "town_walkway_ne", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "E"] },
    town_walkway_nw: { id: "town_walkway_nw", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "W"] },
    town_walkway_se: { id: "town_walkway_se", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["S", "E"] },
    town_walkway_sw: { id: "town_walkway_sw", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["S", "W"] },
    town_walkway_t_n: { id: "town_walkway_t_n", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "E", "W"] },
    town_walkway_t_e: { id: "town_walkway_t_e", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "S", "E"] },
    town_walkway_t_s: { id: "town_walkway_t_s", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["S", "E", "W"] },
    town_walkway_t_w: { id: "town_walkway_t_w", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "S", "W"] },
    town_walkway_cross: { id: "town_walkway_cross", baseId: "town_walkway", name: "Heated Stone Promenade", category: "walkway", cost: 25, frames: 1, surface: "land_flat", walkable: true, deckZ: 0.15, edges: ["N", "E", "S", "W"] },

    // Sloped Snow Stairs & Glass Covered Escalators (`1100/0110/0011/1001`)
    snow_stairs_n: { id: "snow_stairs_n", baseId: "snow_stairs", name: "Timber & Stone Snow Stairs (N)", category: "stairs", cost: 45, frames: 1, surface: "land_slope", slopeMask: "1100", walkable: true, deckZ: 0.25, lowEdge: "S", highEdge: "N", edges: ["N", "S"] },
    snow_stairs_e: { id: "snow_stairs_e", baseId: "snow_stairs", name: "Timber & Stone Snow Stairs (E)", category: "stairs", cost: 45, frames: 1, surface: "land_slope", slopeMask: "0110", walkable: true, deckZ: 0.25, lowEdge: "W", highEdge: "E", edges: ["E", "W"] },
    snow_stairs_s: { id: "snow_stairs_s", baseId: "snow_stairs", name: "Timber & Stone Snow Stairs (S)", category: "stairs", cost: 45, frames: 1, surface: "land_slope", slopeMask: "0011", walkable: true, deckZ: 0.25, lowEdge: "N", highEdge: "S", edges: ["N", "S"] },
    snow_stairs_w: { id: "snow_stairs_w", baseId: "snow_stairs", name: "Timber & Stone Snow Stairs (W)", category: "stairs", cost: 45, frames: 1, surface: "land_slope", slopeMask: "1001", walkable: true, deckZ: 0.25, lowEdge: "E", highEdge: "W", edges: ["E", "W"] },

    covered_escalator_n: { id: "covered_escalator_n", baseId: "covered_escalator", name: "Glass Village Terrace Escalator (N)", category: "stairs", cost: 115, frames: 1, surface: "land_slope", slopeMask: "1100", walkable: true, tall: true, deckZ: 0.3, lowEdge: "S", highEdge: "N", edges: ["N", "S"], light: { radius: 2.4, color: "#ffd88a", intensity: 0.8, liftZ: 1.5 } },
    covered_escalator_e: { id: "covered_escalator_e", baseId: "covered_escalator", name: "Glass Village Terrace Escalator (E)", category: "stairs", cost: 115, frames: 1, surface: "land_slope", slopeMask: "0110", walkable: true, tall: true, deckZ: 0.3, lowEdge: "W", highEdge: "E", edges: ["E", "W"], light: { radius: 2.4, color: "#ffd88a", intensity: 0.8, liftZ: 1.5 } },
    covered_escalator_s: { id: "covered_escalator_s", baseId: "covered_escalator", name: "Glass Village Terrace Escalator (S)", category: "stairs", cost: 115, frames: 1, surface: "land_slope", slopeMask: "0011", walkable: true, tall: true, deckZ: 0.3, lowEdge: "N", highEdge: "S", edges: ["N", "S"], light: { radius: 2.4, color: "#ffd88a", intensity: 0.8, liftZ: 1.5 } },
    covered_escalator_w: { id: "covered_escalator_w", baseId: "covered_escalator", name: "Glass Village Terrace Escalator (W)", category: "stairs", cost: 115, frames: 1, surface: "land_slope", slopeMask: "1001", walkable: true, tall: true, deckZ: 0.3, lowEdge: "E", highEdge: "W", edges: ["E", "W"], light: { radius: 2.4, color: "#ffd88a", intensity: 0.8, liftZ: 1.5 } },

    // Bridges & Terraced Stone Retaining Walls
    timber_bridge_ns: { id: "timber_bridge_ns", baseId: "timber_bridge", name: "Alpine Timber Bridge (N-S)", category: "bridge", cost: 95, frames: 1, surface: "water_flat", walkable: true, skiThrough: true, deckZ: 0.45, edges: ["N", "S"] },
    timber_bridge_ew: { id: "timber_bridge_ew", baseId: "timber_bridge", name: "Alpine Timber Bridge (E-W)", category: "bridge", cost: 95, frames: 1, surface: "water_flat", walkable: true, skiThrough: true, deckZ: 0.45, edges: ["E", "W"] },
    stone_arch_bridge_ns: { id: "stone_arch_bridge_ns", baseId: "stone_arch_bridge", name: "Granite Arch Creek Bridge (N-S)", category: "bridge", cost: 135, frames: 1, surface: "water_flat", walkable: true, skiThrough: true, deckZ: 0.55, edges: ["N", "S"], light: { radius: 2.2, color: "#ffd082", intensity: 0.72, liftZ: 1.2 } },
    stone_arch_bridge_ew: { id: "stone_arch_bridge_ew", baseId: "stone_arch_bridge", name: "Granite Arch Creek Bridge (E-W)", category: "bridge", cost: 135, frames: 1, surface: "water_flat", walkable: true, skiThrough: true, deckZ: 0.55, edges: ["E", "W"], light: { radius: 2.2, color: "#ffd082", intensity: 0.72, liftZ: 1.2 } },
    retaining_wall_ns: { id: "retaining_wall_ns", baseId: "retaining_wall", name: "Masonry Terrace Retaining Wall (N-S)", category: "amenity", cost: 40, frames: 1, surface: "land_any", walkable: true, tall: false, edges: ["N", "S"] },
    retaining_wall_ew: { id: "retaining_wall_ew", baseId: "retaining_wall", name: "Masonry Terrace Retaining Wall (E-W)", category: "amenity", cost: 40, frames: 1, surface: "land_any", walkable: true, tall: false, edges: ["E", "W"] },

    // All 10 Uphill Lift Terminals, Mid-Tracks, Pylons & Transfer Station
    magic_carpet_base_ns: { id: "magic_carpet_base_ns", baseId: "magic_carpet", name: "Magic Carpet Conveyor Entry (N-S)", category: "lift_station", liftType: "magic_carpet", stationRole: "base", axis: "ns", cost: 280, frames: 4, surface: "land_any", tall: false, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 2.2, color: "#9ee8ff", intensity: 0.76, liftZ: 1.0 } },
    magic_carpet_base_ew: { id: "magic_carpet_base_ew", baseId: "magic_carpet", name: "Magic Carpet Conveyor Entry (E-W)", category: "lift_station", liftType: "magic_carpet", stationRole: "base", axis: "ew", cost: 280, frames: 4, surface: "land_any", tall: false, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 2.2, color: "#9ee8ff", intensity: 0.76, liftZ: 1.0 } },
    magic_carpet_mid_ns: { id: "magic_carpet_mid_ns", baseId: "magic_carpet_mid", name: "Plexiglass Magic Carpet Gallery (N-S)", category: "lift_track", liftType: "magic_carpet", axis: "ns", cost: 0, frames: 1, surface: "land_any", tall: false, skiThrough: true },
    magic_carpet_mid_ew: { id: "magic_carpet_mid_ew", baseId: "magic_carpet_mid", name: "Plexiglass Magic Carpet Gallery (E-W)", category: "lift_track", liftType: "magic_carpet", axis: "ew", cost: 0, frames: 1, surface: "land_any", tall: false, skiThrough: true },
    magic_carpet_top_ns: { id: "magic_carpet_top_ns", baseId: "magic_carpet", name: "Magic Carpet Conveyor Exit (N-S)", category: "lift_station", liftType: "magic_carpet", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_any", tall: false, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"] },
    magic_carpet_top_ew: { id: "magic_carpet_top_ew", baseId: "magic_carpet", name: "Magic Carpet Conveyor Exit (E-W)", category: "lift_station", liftType: "magic_carpet", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_any", tall: false, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"] },

    rope_tow_base: { id: "rope_tow_base", baseId: "rope_tow", name: "Beginner Rope Tow Base", category: "lift_station", liftType: "rope_tow", stationRole: "base", cost: 360, frames: 4, surface: "land_any", tall: false, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 2.2, color: "#ffca7a", intensity: 0.78, liftZ: 1.0 } },
    rope_tow_top: { id: "rope_tow_top", baseId: "rope_tow", name: "Beginner Rope Tow Top", category: "lift_station", liftType: "rope_tow", stationRole: "top", cost: 0, frames: 4, surface: "land_any", tall: false, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"] },

    tbar_base_ns: { id: "tbar_base_ns", baseId: "tbar_lift", name: "Glacier T-Bar Base Terminal", category: "lift_station", liftType: "tbar_lift", stationRole: "base", axis: "ns", cost: 520, frames: 4, surface: "land_any", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffd084", intensity: 0.82, liftZ: 1.6 } },
    tbar_base_ew: { id: "tbar_base_ew", baseId: "tbar_lift", name: "Glacier T-Bar Base Terminal", category: "lift_station", liftType: "tbar_lift", stationRole: "base", axis: "ew", cost: 520, frames: 4, surface: "land_any", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffd084", intensity: 0.82, liftZ: 1.6 } },
    tbar_top_ns: { id: "tbar_top_ns", baseId: "tbar_lift", name: "Glacier T-Bar Summit Return", category: "lift_station", liftType: "tbar_lift", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_any", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"] },
    tbar_top_ew: { id: "tbar_top_ew", baseId: "tbar_lift", name: "Glacier T-Bar Summit Return", category: "lift_station", liftType: "tbar_lift", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_any", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"] },
    tbar_pylon_ns: { id: "tbar_pylon_ns", baseId: "tbar_pylon", name: "Surface T-Bar Portal Tower (N-S)", category: "lift_pylon", liftType: "tbar_lift", axis: "ns", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },
    tbar_pylon_ew: { id: "tbar_pylon_ew", baseId: "tbar_pylon", name: "Surface T-Bar Portal Tower (E-W)", category: "lift_pylon", liftType: "tbar_lift", axis: "ew", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },

    classic_2chair_base_ns: { id: "classic_2chair_base_ns", baseId: "classic_2chair", name: "Heritage Double Chair Base", category: "lift_station", liftType: "classic_2chair", stationRole: "base", axis: "ns", cost: 620, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffd28a", intensity: 0.86, liftZ: 2.1 } },
    classic_2chair_base_ew: { id: "classic_2chair_base_ew", baseId: "classic_2chair", name: "Heritage Double Chair Base", category: "lift_station", liftType: "classic_2chair", stationRole: "base", axis: "ew", cost: 620, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffd28a", intensity: 0.86, liftZ: 2.1 } },
    classic_2chair_top_ns: { id: "classic_2chair_top_ns", baseId: "classic_2chair", name: "Heritage Double Chair Summit", category: "lift_station", liftType: "classic_2chair", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffd28a", intensity: 0.8, liftZ: 2.1 } },
    classic_2chair_top_ew: { id: "classic_2chair_top_ew", baseId: "classic_2chair", name: "Heritage Double Chair Summit", category: "lift_station", liftType: "classic_2chair", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffd28a", intensity: 0.8, liftZ: 2.1 } },

    chairlift_base_ns: { id: "chairlift_base_ns", baseId: "chairlift", name: "Quad Chairlift Base Terminal", category: "lift_station", liftType: "chairlift", stationRole: "base", axis: "ns", cost: 720, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffd28a", intensity: 0.88, liftZ: 2.2 } },
    chairlift_base_ew: { id: "chairlift_base_ew", baseId: "chairlift", name: "Quad Chairlift Base Terminal", category: "lift_station", liftType: "chairlift", stationRole: "base", axis: "ew", cost: 720, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffd28a", intensity: 0.88, liftZ: 2.2 } },
    chairlift_top_ns: { id: "chairlift_top_ns", baseId: "chairlift", name: "Quad Chairlift Summit Terminal", category: "lift_station", liftType: "chairlift", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#ffd28a", intensity: 0.82, liftZ: 2.2 } },
    chairlift_top_ew: { id: "chairlift_top_ew", baseId: "chairlift", name: "Quad Chairlift Summit Terminal", category: "lift_station", liftType: "chairlift", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#ffd28a", intensity: 0.82, liftZ: 2.2 } },
    lift_pylon_ns: { id: "lift_pylon_ns", baseId: "lift_pylon", name: "Chairlift Steel Pylon (N-S)", category: "lift_pylon", liftType: "chairlift", axis: "ns", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },
    lift_pylon_ew: { id: "lift_pylon_ew", baseId: "lift_pylon", name: "Chairlift Steel Pylon (E-W)", category: "lift_pylon", liftType: "chairlift", axis: "ew", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },

    bubble_6chair_base_ns: { id: "bubble_6chair_base_ns", baseId: "bubble_6chair", name: "6-Pack Bubble Express Base", category: "lift_station", liftType: "bubble_6chair", stationRole: "base", axis: "ns", cost: 920, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffbe68", intensity: 0.92, liftZ: 2.3 } },
    bubble_6chair_base_ew: { id: "bubble_6chair_base_ew", baseId: "bubble_6chair", name: "6-Pack Bubble Express Base", category: "lift_station", liftType: "bubble_6chair", stationRole: "base", axis: "ew", cost: 920, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffbe68", intensity: 0.92, liftZ: 2.3 } },
    bubble_6chair_top_ns: { id: "bubble_6chair_top_ns", baseId: "bubble_6chair", name: "6-Pack Bubble Express Top", category: "lift_station", liftType: "bubble_6chair", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffbe68", intensity: 0.88, liftZ: 2.3 } },
    bubble_6chair_top_ew: { id: "bubble_6chair_top_ew", baseId: "bubble_6chair", name: "6-Pack Bubble Express Top", category: "lift_station", liftType: "bubble_6chair", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffbe68", intensity: 0.88, liftZ: 2.3 } },

    egg_gondola_base_ns: { id: "egg_gondola_base_ns", baseId: "egg_gondola", name: "Retro Egg Gondola Chalet Base", category: "lift_station", liftType: "egg_gondola", stationRole: "base", axis: "ns", cost: 1020, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffd07c", intensity: 0.92, liftZ: 2.6 } },
    egg_gondola_base_ew: { id: "egg_gondola_base_ew", baseId: "egg_gondola", name: "Retro Egg Gondola Chalet Base", category: "lift_station", liftType: "egg_gondola", stationRole: "base", axis: "ew", cost: 1020, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffd07c", intensity: 0.92, liftZ: 2.6 } },
    egg_gondola_top_ns: { id: "egg_gondola_top_ns", baseId: "egg_gondola", name: "Retro Egg Gondola Summit", category: "lift_station", liftType: "egg_gondola", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffd07c", intensity: 0.88, liftZ: 2.6 } },
    egg_gondola_top_ew: { id: "egg_gondola_top_ew", baseId: "egg_gondola", name: "Retro Egg Gondola Summit", category: "lift_station", liftType: "egg_gondola", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffd07c", intensity: 0.88, liftZ: 2.6 } },

    gondola_base_ns: { id: "gondola_base_ns", baseId: "gondola", name: "Summit Express Gondola Base", category: "lift_station", liftType: "gondola", stationRole: "base", axis: "ns", cost: 1150, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.6, color: "#ffca78", intensity: 0.95, liftZ: 2.8 } },
    gondola_base_ew: { id: "gondola_base_ew", baseId: "gondola", name: "Summit Express Gondola Base", category: "lift_station", liftType: "gondola", stationRole: "base", axis: "ew", cost: 1150, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.6, color: "#ffca78", intensity: 0.95, liftZ: 2.8 } },
    gondola_top_ns: { id: "gondola_top_ns", baseId: "gondola", name: "Summit Express Gondola Top", category: "lift_station", liftType: "gondola", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffca78", intensity: 0.92, liftZ: 2.8 } },
    gondola_top_ew: { id: "gondola_top_ew", baseId: "gondola", name: "Summit Express Gondola Top", category: "lift_station", liftType: "gondola", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffca78", intensity: 0.92, liftZ: 2.8 } },
    gondola_pylon_ns: { id: "gondola_pylon_ns", baseId: "gondola_pylon", name: "Gondola Lattice Tower (N-S)", category: "lift_pylon", liftType: "gondola", axis: "ns", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },
    gondola_pylon_ew: { id: "gondola_pylon_ew", baseId: "gondola_pylon", name: "Gondola Lattice Tower (E-W)", category: "lift_pylon", liftType: "gondola", axis: "ew", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },

    tramway_3s_base_ns: { id: "tramway_3s_base_ns", baseId: "tramway_3s", name: "3S Aerial Tramway Valley Station", category: "lift_station", liftType: "tramway_3s", stationRole: "base", axis: "ns", cost: 1550, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 4.0, color: "#ffd282", intensity: 0.98, liftZ: 3.1 } },
    tramway_3s_base_ew: { id: "tramway_3s_base_ew", baseId: "tramway_3s", name: "3S Aerial Tramway Valley Station", category: "lift_station", liftType: "tramway_3s", stationRole: "base", axis: "ew", cost: 1550, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 4.0, color: "#ffd282", intensity: 0.98, liftZ: 3.1 } },
    tramway_3s_top_ns: { id: "tramway_3s_top_ns", baseId: "tramway_3s", name: "3S Aerial Tramway Peak Terminal", category: "lift_station", liftType: "tramway_3s", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.8, color: "#ffd282", intensity: 0.95, liftZ: 3.1 } },
    tramway_3s_top_ew: { id: "tramway_3s_top_ew", baseId: "tramway_3s", name: "3S Aerial Tramway Peak Terminal", category: "lift_station", liftType: "tramway_3s", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.8, color: "#ffd282", intensity: 0.95, liftZ: 3.1 } },
    tramway_pylon_ns: { id: "tramway_pylon_ns", baseId: "tramway_pylon", name: "3S Tramway Heavy A-Frame Pylon (N-S)", category: "lift_pylon", liftType: "tramway_3s", axis: "ns", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },
    tramway_pylon_ew: { id: "tramway_pylon_ew", baseId: "tramway_pylon", name: "3S Tramway Heavy A-Frame Pylon (E-W)", category: "lift_pylon", liftType: "tramway_3s", axis: "ew", cost: 0, frames: 1, surface: "land_any", tall: true, skiThrough: true },

    funicular_base_ns: { id: "funicular_base_ns", baseId: "cliff_funicular", name: "Cliff Funicular Lower Station", category: "lift_station", liftType: "cliff_funicular", stationRole: "base", axis: "ns", cost: 840, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffca78", intensity: 0.9, liftZ: 2.1 } },
    funicular_base_ew: { id: "funicular_base_ew", baseId: "cliff_funicular", name: "Cliff Funicular Lower Station", category: "lift_station", liftType: "cliff_funicular", stationRole: "base", axis: "ew", cost: 840, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffca78", intensity: 0.9, liftZ: 2.1 } },
    funicular_track_ns: { id: "funicular_track_ns", baseId: "funicular_track", name: "Stepped Cog-Rail Funicular Track (N-S)", category: "lift_track", liftType: "cliff_funicular", axis: "ns", cost: 0, frames: 1, surface: "land_any", tall: false },
    funicular_track_ew: { id: "funicular_track_ew", baseId: "funicular_track", name: "Stepped Cog-Rail Funicular Track (E-W)", category: "lift_track", liftType: "cliff_funicular", axis: "ew", cost: 0, frames: 1, surface: "land_any", tall: false },
    funicular_top_ns: { id: "funicular_top_ns", baseId: "cliff_funicular", name: "Cliff Funicular Upper Terrace Station", category: "lift_station", liftType: "cliff_funicular", stationRole: "top", axis: "ns", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#ffca78", intensity: 0.88, liftZ: 2.1 } },
    funicular_top_ew: { id: "funicular_top_ew", baseId: "cliff_funicular", name: "Cliff Funicular Upper Terrace Station", category: "lift_station", liftType: "cliff_funicular", stationRole: "top", axis: "ew", cost: 0, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#ffca78", intensity: 0.88, liftZ: 2.1 } },

    mid_transfer_station_ns: { id: "mid_transfer_station_ns", baseId: "mid_transfer_station", name: "Mid-Mountain Lift Transfer Hub (N-S)", category: "building", role: "lift_hub", axis: "ns", cost: 480, frames: 4, surface: "land_flat", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffd082", intensity: 0.9, liftZ: 2.3 } },
    mid_transfer_station_ew: { id: "mid_transfer_station_ew", baseId: "mid_transfer_station", name: "Mid-Mountain Lift Transfer Hub (E-W)", category: "building", role: "lift_hub", axis: "ew", cost: 480, frames: 4, surface: "land_flat", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffd082", intensity: 0.9, liftZ: 2.3 } },

    // Expanded Swiss Mountain Railway (`train_track`, `curve`, `stone_viaduct`, `tunnel`, `crossing`)
    valley_train_station: { id: "valley_train_station", baseId: "valley_train_station", name: "Swiss Valley Train Depot", category: "building", role: "train_station", cost: 520, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.8, color: "#ffc978", intensity: 0.95, liftZ: 2.4 } },
    train_track_ns: { id: "train_track_ns", baseId: "train_track", name: "Cogwheel Railway Track (N-S)", category: "rail", axis: "ns", cost: 40, frames: 1, surface: "land_flat", tall: false, isTrack: true, trackPorts: ["N", "S"] },
    train_track_ew: { id: "train_track_ew", baseId: "train_track", name: "Cogwheel Railway Track (E-W)", category: "rail", axis: "ew", cost: 40, frames: 1, surface: "land_flat", tall: false, isTrack: true, trackPorts: ["E", "W"] },
    train_track_curve_ne: { id: "train_track_curve_ne", baseId: "train_track_curve", name: "Curved Cogwheel Track (N-E)", category: "rail", cost: 45, frames: 1, surface: "land_flat", tall: false, isTrack: true, trackPorts: ["N", "E"] },
    train_track_curve_nw: { id: "train_track_curve_nw", baseId: "train_track_curve", name: "Curved Cogwheel Track (N-W)", category: "rail", cost: 45, frames: 1, surface: "land_flat", tall: false, isTrack: true, trackPorts: ["N", "W"] },
    train_track_curve_se: { id: "train_track_curve_se", baseId: "train_track_curve", name: "Curved Cogwheel Track (S-E)", category: "rail", cost: 45, frames: 1, surface: "land_flat", tall: false, isTrack: true, trackPorts: ["S", "E"] },
    train_track_curve_sw: { id: "train_track_curve_sw", baseId: "train_track_curve", name: "Curved Cogwheel Track (S-W)", category: "rail", cost: 45, frames: 1, surface: "land_flat", tall: false, isTrack: true, trackPorts: ["S", "W"] },
    stone_viaduct_ns: { id: "stone_viaduct_ns", baseId: "stone_viaduct", name: "Landwasser Stone Rail Viaduct (N-S)", category: "rail", axis: "ns", cost: 145, frames: 1, surface: "land_or_water_flat", tall: true, isTrack: true, trackPorts: ["N", "S"], deckZ: 0.45 },
    stone_viaduct_ew: { id: "stone_viaduct_ew", baseId: "stone_viaduct", name: "Landwasser Stone Rail Viaduct (E-W)", category: "rail", axis: "ew", cost: 145, frames: 1, surface: "land_or_water_flat", tall: true, isTrack: true, trackPorts: ["E", "W"], deckZ: 0.45 },
    rail_tunnel_portal_sw: { id: "rail_tunnel_portal_sw", baseId: "rail_tunnel_portal", name: "Granite Mountain Rail Tunnel (SW)", category: "rail", axis: "ns", cost: 160, frames: 1, surface: "land_any", tall: true, isTrack: true, trackPorts: ["N", "S"], light: { radius: 2.3, color: "#ffbe68", intensity: 0.8, liftZ: 1.4 } },
    rail_tunnel_portal_se: { id: "rail_tunnel_portal_se", baseId: "rail_tunnel_portal", name: "Granite Mountain Rail Tunnel (SE)", category: "rail", axis: "ew", cost: 160, frames: 1, surface: "land_any", tall: true, isTrack: true, trackPorts: ["E", "W"], light: { radius: 2.3, color: "#ffbe68", intensity: 0.8, liftZ: 1.4 } },
    train_platform_ns: { id: "train_platform_ns", baseId: "train_platform", name: "Alpine Station Platform (N-S)", category: "rail_platform", axis: "ns", cost: 85, frames: 1, surface: "land_flat", tall: false, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.4, color: "#ffd284", intensity: 0.75, liftZ: 1.2 } },
    train_platform_ew: { id: "train_platform_ew", baseId: "train_platform", name: "Alpine Station Platform (E-W)", category: "rail_platform", axis: "ew", cost: 85, frames: 1, surface: "land_flat", tall: false, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.4, color: "#ffd284", intensity: 0.75, liftZ: 1.2 } },
    rail_crossing_gate_ns: { id: "rail_crossing_gate_ns", baseId: "rail_crossing_gate", name: "Swiss Railway Crossing Gate (N-S)", category: "rail", axis: "ns", cost: 75, frames: 1, surface: "land_flat", tall: false, isTrack: true, walkable: true, trackPorts: ["N", "S"], edges: ["N", "E", "S", "W"], light: { radius: 2.0, color: "#ff6b6b", intensity: 0.7, liftZ: 1.1 } },
    rail_crossing_gate_ew: { id: "rail_crossing_gate_ew", baseId: "rail_crossing_gate", name: "Swiss Railway Crossing Gate (E-W)", category: "rail", axis: "ew", cost: 75, frames: 1, surface: "land_flat", tall: false, isTrack: true, walkable: true, trackPorts: ["E", "W"], edges: ["N", "E", "S", "W"], light: { radius: 2.0, color: "#ff6b6b", intensity: 0.7, liftZ: 1.1 } },

    // Resort Fleet, Sleigh, Bus & Helipad Pads
    groomer_garage: { id: "groomer_garage", baseId: "groomer_garage", name: "PistenBully Snowcat Groomer Barn", category: "building", role: "groomer", cost: 420, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffd07c", intensity: 0.88, liftZ: 2.0 } },
    winch_cat_bay: { id: "winch_cat_bay", baseId: "winch_cat_bay", name: "Steep-Chute Winch-Cat Garage", category: "building", role: "groomer", cost: 460, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffd470", intensity: 0.88, liftZ: 2.0 } },
    snowmobile_pad: { id: "snowmobile_pad", baseId: "snowmobile_pad", name: "Patrol Snowmobile Dispatch Pad", category: "building", role: "patrol", cost: 280, frames: 4, surface: "land_flat", tall: false, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffca78", intensity: 0.82, liftZ: 1.3 } },
    horse_sleigh_stand: { id: "horse_sleigh_stand", baseId: "horse_sleigh_stand", name: "Carved Velvet Horse-Sleigh Stand", category: "building", role: "transit", cost: 310, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffc46b", intensity: 0.88, liftZ: 1.6, flicker: true } },
    shuttle_bus_stop: { id: "shuttle_bus_stop", baseId: "shuttle_bus_stop", name: "Heated Electric Ski-Shuttle Shelter", category: "building", role: "transit", cost: 260, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#ffd88c", intensity: 0.86, liftZ: 1.6 } },
    summit_helipad: { id: "summit_helipad", baseId: "summit_helipad", name: "VIP & Rescue Summit Helipad", category: "building", role: "helipad", cost: 680, frames: 4, surface: "land_flat", tall: false, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.6, color: "#7ce8ff", intensity: 0.92, liftZ: 0.8, kind: "cyan" } },

    // 3 Flagship `2x2` Composite Landmarks (`grand_hotel_2x2`, `thermal_spa_2x2`, `base_lodge_2x2`)
    grand_hotel_2x2: { id: "grand_hotel_2x2", baseId: "grand_hotel_2x2", name: "Grand Edelweiss Palace Hotel (2x2)", category: "building", role: "hotel", footprint: [2, 2], cost: 1100, frames: 4, surface: "land_flat_2x2", tall: true, edges: ["N", "E", "S", "W"] },
    grand_hotel_2x2_nw: { id: "grand_hotel_2x2_nw", baseId: "grand_hotel_2x2", name: "Grand Edelweiss Hotel", category: "building_cell", role: "hotel", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "W"] },
    grand_hotel_2x2_ne: { id: "grand_hotel_2x2_ne", baseId: "grand_hotel_2x2", name: "Grand Edelweiss Hotel", category: "building_cell", role: "hotel", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E"] },
    grand_hotel_2x2_sw: { id: "grand_hotel_2x2_sw", baseId: "grand_hotel_2x2", name: "Grand Edelweiss Hotel", category: "building_cell", role: "hotel", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "W"] },
    grand_hotel_2x2_se: { id: "grand_hotel_2x2_se", baseId: "grand_hotel_2x2", name: "Grand Edelweiss Hotel", category: "building_cell", role: "hotel", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "E"] },

    thermal_spa_2x2: { id: "thermal_spa_2x2", baseId: "thermal_spa_2x2", name: "Copper-Dome Alpine Thermal Spa (2x2)", category: "building", role: "spa", footprint: [2, 2], cost: 1180, frames: 4, surface: "land_flat_2x2", tall: true, edges: ["N", "E", "S", "W"] },
    thermal_spa_2x2_nw: { id: "thermal_spa_2x2_nw", baseId: "thermal_spa_2x2", name: "Alpine Thermal Spa", category: "building_cell", role: "spa", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "W"] },
    thermal_spa_2x2_ne: { id: "thermal_spa_2x2_ne", baseId: "thermal_spa_2x2", name: "Alpine Thermal Spa", category: "building_cell", role: "spa", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E"] },
    thermal_spa_2x2_sw: { id: "thermal_spa_2x2_sw", baseId: "thermal_spa_2x2", name: "Alpine Thermal Spa", category: "building_cell", role: "spa", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "W"] },
    thermal_spa_2x2_se: { id: "thermal_spa_2x2_se", baseId: "thermal_spa_2x2", name: "Alpine Thermal Spa", category: "building_cell", role: "spa", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "E"] },

    base_lodge_2x2: { id: "base_lodge_2x2", baseId: "base_lodge_2x2", name: "Terracotta Clock-Tower Base Lodge (2x2)", category: "building", role: "lodge", footprint: [2, 2], cost: 1050, frames: 4, surface: "land_flat_2x2", tall: true, edges: ["N", "E", "S", "W"] },
    base_lodge_2x2_nw: { id: "base_lodge_2x2_nw", baseId: "base_lodge_2x2", name: "Terracotta Base Lodge", category: "building_cell", role: "lodge", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "W"] },
    base_lodge_2x2_ne: { id: "base_lodge_2x2_ne", baseId: "base_lodge_2x2", name: "Terracotta Base Lodge", category: "building_cell", role: "lodge", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E"] },
    base_lodge_2x2_sw: { id: "base_lodge_2x2_sw", baseId: "base_lodge_2x2", name: "Terracotta Base Lodge", category: "building_cell", role: "lodge", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "W"] },
    base_lodge_2x2_se: { id: "base_lodge_2x2_se", baseId: "base_lodge_2x2", name: "Terracotta Base Lodge", category: "building_cell", role: "lodge", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "E"] },

    festival_ferris_wheel_2x2: { id: "festival_ferris_wheel_2x2", baseId: "festival_ferris_wheel_2x2", name: "Grand Winter Festival Ferris Wheel (2x2)", category: "building", role: "ride", footprint: [2, 2], cost: 1280, frames: 4, surface: "land_flat_2x2", tall: true, edges: ["N", "E", "S", "W"] },
    festival_ferris_wheel_2x2_nw: { id: "festival_ferris_wheel_2x2_nw", baseId: "festival_ferris_wheel_2x2", name: "Festival Ferris Wheel", category: "building_cell", role: "ride", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "W"] },
    festival_ferris_wheel_2x2_ne: { id: "festival_ferris_wheel_2x2_ne", baseId: "festival_ferris_wheel_2x2", name: "Festival Ferris Wheel", category: "building_cell", role: "ride", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E"] },
    festival_ferris_wheel_2x2_sw: { id: "festival_ferris_wheel_2x2_sw", baseId: "festival_ferris_wheel_2x2", name: "Festival Ferris Wheel", category: "building_cell", role: "ride", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "W"] },
    festival_ferris_wheel_2x2_se: { id: "festival_ferris_wheel_2x2_se", baseId: "festival_ferris_wheel_2x2", name: "Festival Ferris Wheel", category: "building_cell", role: "ride", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "E"] },

    sphinx_observatory_2x2: { id: "sphinx_observatory_2x2", baseId: "sphinx_observatory_2x2", name: "Sphinx Summit Astronomical Observatory (2x2)", category: "building", role: "viewpoint", footprint: [2, 2], cost: 1350, frames: 4, surface: "land_flat_2x2", tall: true, edges: ["N", "E", "S", "W"] },
    sphinx_observatory_2x2_nw: { id: "sphinx_observatory_2x2_nw", baseId: "sphinx_observatory_2x2", name: "Sphinx Observatory", category: "building_cell", role: "viewpoint", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "W"] },
    sphinx_observatory_2x2_ne: { id: "sphinx_observatory_2x2_ne", baseId: "sphinx_observatory_2x2", name: "Sphinx Observatory", category: "building_cell", role: "viewpoint", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E"] },
    sphinx_observatory_2x2_sw: { id: "sphinx_observatory_2x2_sw", baseId: "sphinx_observatory_2x2", name: "Sphinx Observatory", category: "building_cell", role: "viewpoint", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "W"] },
    sphinx_observatory_2x2_se: { id: "sphinx_observatory_2x2_se", baseId: "sphinx_observatory_2x2", name: "Sphinx Observatory", category: "building_cell", role: "viewpoint", cost: 0, frames: 4, surface: "land_flat", tall: true, edges: ["S", "E"] },

    // 26 Multi-Palette `1x1` Town, Niseko & Mountain Buildings (`f0..f3` animated)
    chalet_bnb: { id: "chalet_bnb", baseId: "chalet_bnb", name: "Frescoed Balcony Chalet B&B", category: "building", role: "hotel", cost: 420, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffca78", intensity: 0.88, liftZ: 2.0 } },
    aframe_cabin: { id: "aframe_cabin", baseId: "aframe_cabin", name: "Slate-Gable Pine A-Frame Cabin", category: "building", role: "hotel", cost: 360, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffc870", intensity: 0.86, liftZ: 1.8 } },
    stargaze_igloo: { id: "stargaze_igloo", baseId: "stargaze_igloo", name: "Geodesic Glass Stargazing Igloo", category: "building", role: "hotel", cost: 390, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffd896", intensity: 0.92, liftZ: 1.5 } },
    ice_hotel_suite: { id: "ice_hotel_suite", baseId: "ice_hotel_suite", name: "Sculpted Glacier-Cyan Ice Hotel Suite", category: "building", role: "hotel", cost: 450, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#6bf0ff", intensity: 0.94, liftZ: 1.7, kind: "cyan" } },
    ski_rental_shop: { id: "ski_rental_shop", baseId: "ski_rental_shop", name: "Alpine Ski & Board Rental Shop", category: "building", role: "rental", cost: 340, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffca7a", intensity: 0.88, liftZ: 1.9 } },
    lift_ticket_booth: { id: "lift_ticket_booth", baseId: "lift_ticket_booth", name: "Lift Pass & Trail Ticket Booth", category: "building", role: "ticket", cost: 260, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#ffd488", intensity: 0.86, liftZ: 1.6 } },
    ski_school_lodge: { id: "ski_school_lodge", baseId: "ski_school_lodge", name: "Kids Ski-School Duckling Chalet", category: "building", role: "school", cost: 370, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffd67c", intensity: 0.88, liftZ: 1.9 } },
    wax_tuning_shop: { id: "wax_tuning_shop", baseId: "wax_tuning_shop", name: "Hot-Wax & Edge Tuning Workshop", category: "building", role: "shop", cost: 300, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffca78", intensity: 0.86, liftZ: 1.8 } },
    gear_boutique: { id: "gear_boutique", baseId: "gear_boutique", name: "Goggles & Parka Gear Boutique", category: "building", role: "shop", cost: 380, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#ffd48c", intensity: 0.88, liftZ: 1.9 } },
    swiss_watchmaker: { id: "swiss_watchmaker", baseId: "swiss_watchmaker", name: "Swiss Horology & Clockmaker Atelier", category: "building", role: "shop", cost: 490, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffe09a", intensity: 0.9, liftZ: 2.0 } },
    chocolatier_shop: { id: "chocolatier_shop", baseId: "chocolatier_shop", name: "Artisan Swiss Praline Chocolatier", category: "building", role: "shop", cost: 360, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#ffca7e", intensity: 0.88, liftZ: 1.9 } },
    cheese_raclette_cellar: { id: "cheese_raclette_cellar", baseId: "cheese_raclette_cellar", name: "Aged Gruyère & Raclette Vault", category: "building", role: "food", cost: 390, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.1, color: "#ffc26c", intensity: 0.89, liftZ: 1.8, flicker: true } },
    cowbell_souvenirs: { id: "cowbell_souvenirs", baseId: "cowbell_souvenirs", name: "Brass Cowbell & Cuckoo Gift Shop", category: "building", role: "shop", cost: 290, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#ffd080", intensity: 0.86, liftZ: 1.8 } },
    bookshop_roastery: { id: "bookshop_roastery", baseId: "bookshop_roastery", name: "Fireside Alpine Bookshop & Roastery", category: "building", role: "shop", cost: 330, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#ffc976", intensity: 0.88, liftZ: 1.9 } },
    alpine_bakery: { id: "alpine_bakery", baseId: "alpine_bakery", name: "Pretzel & Warm Strudel Bakery", category: "building", role: "shop", cost: 310, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#ffc978", intensity: 0.88, liftZ: 1.8 } },
    apres_tavern: { id: "apres_tavern", baseId: "apres_tavern", name: "Fondue & Wood-Fired Après Tavern", category: "building", role: "food", cost: 460, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.6, color: "#ffbe6b", intensity: 0.95, liftZ: 2.1, flicker: true } },
    craft_brewhouse: { id: "craft_brewhouse", baseId: "craft_brewhouse", name: "Copper-Kettle Alpine Craft Brewhouse", category: "building", role: "food", cost: 440, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#ffc26e", intensity: 0.92, liftZ: 2.1 } },
    niseko_ramen_bar: { id: "niseko_ramen_bar", baseId: "niseko_ramen_bar", name: "Niseko Red-Lantern Miso Ramen Bar", category: "building", role: "food", cost: 410, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.3, color: "#ff8c5a", intensity: 0.94, liftZ: 1.9, flicker: true } },
    waffle_hut: { id: "waffle_hut", baseId: "waffle_hut", name: "Mid-Mountain Glühwein & Waffle Hut", category: "building", role: "food", cost: 350, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffc270", intensity: 0.9, liftZ: 1.8, flicker: true } },
    summit_restaurant: { id: "summit_restaurant", baseId: "summit_restaurant", name: "Panoramic Summit Glass Restaurant", category: "building", role: "food", cost: 640, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 4.0, color: "#ffda92", intensity: 0.96, liftZ: 2.5 } },
    eagles_nest_skywalk: { id: "eagles_nest_skywalk", baseId: "eagles_nest_skywalk", name: "Cantilevered Glass Summit Skywalk", category: "building", role: "viewpoint", cost: 580, frames: 4, surface: "land_any", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#9ee8ff", intensity: 0.88, liftZ: 2.2 } },
    stone_chapel: { id: "stone_chapel", baseId: "stone_chapel", name: "Copper-Spire Stained-Glass Chapel", category: "building", role: "civic", cost: 430, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.3, color: "#ffd890", intensity: 0.9, liftZ: 2.4 } },
    town_rathaus: { id: "town_rathaus", baseId: "town_rathaus", name: "Frescoed Swiss Town Hall (Rathaus)", category: "building", role: "civic", cost: 510, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.5, color: "#ffd284", intensity: 0.92, liftZ: 2.4 } },
    watermill_lodge: { id: "watermill_lodge", baseId: "watermill_lodge", name: "Creekside Turning-Wheel Mill Lodge", category: "building", role: "food", cost: 470, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.3, color: "#ffc674", intensity: 0.9, liftZ: 2.0, flicker: true } },
    ski_patrol_hut: { id: "ski_patrol_hut", baseId: "ski_patrol_hut", name: "Alpine Ski Patrol Rescue Cabin", category: "building", role: "patrol", cost: 320, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffca7c", intensity: 0.85, liftZ: 1.8 } },
    rescue_clinic: { id: "rescue_clinic", baseId: "rescue_clinic", name: "Swiss Red-Cross Mountain Clinic", category: "building", role: "patrol", cost: 430, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffdf9c", intensity: 0.9, liftZ: 2.0 } },

    // Village Après-Ski, Christmas Market, Ice Rink & Cozy Amenities
    schirmbar_umbrella: { id: "schirmbar_umbrella", baseId: "schirmbar_umbrella", name: "Glass-Walled Après Schirmbar Umbrella", category: "amenity", role: "food", cost: 260, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.5, color: "#ffb85c", intensity: 0.96, liftZ: 1.9, flicker: true } },
    cocoa_kiosk: { id: "cocoa_kiosk", baseId: "cocoa_kiosk", name: "Steaming Hot Cocoa Kiosk", category: "amenity", role: "food", cost: 160, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffc672", intensity: 0.86, liftZ: 1.4, flicker: true } },
    christmas_market_stall: { id: "christmas_market_stall", baseId: "christmas_market_stall", name: "Festive Garland Christmas Market Stall", category: "amenity", role: "food", cost: 175, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.9, color: "#ffc968", intensity: 0.92, liftZ: 1.5, flicker: true } },
    chestnut_cart: { id: "chestnut_cart", baseId: "chestnut_cart", name: "Glowing Brazier Roasted-Chestnut Cart", category: "amenity", role: "food", cost: 135, frames: 4, surface: "land_flat", tall: false, edges: ["N", "E", "S", "W"], light: { radius: 2.4, color: "#ff9d4c", intensity: 0.88, liftZ: 1.1, flicker: true } },
    cedar_hottub: { id: "cedar_hottub", baseId: "cedar_hottub", name: "Steaming Cedar Barrel Hot Tub", category: "amenity", role: "warmth", cost: 210, frames: 4, surface: "land_flat", tall: false, edges: ["N", "E", "S", "W"], light: { radius: 2.5, color: "#9ee8ff", intensity: 0.78, liftZ: 0.9 } },
    barrel_sauna: { id: "barrel_sauna", baseId: "barrel_sauna", name: "Nordic Cedar Barrel Steam Sauna", category: "amenity", role: "warmth", cost: 230, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 2.5, color: "#ffc470", intensity: 0.82, liftZ: 1.3 } },
    firepit_lounge: { id: "firepit_lounge", baseId: "firepit_lounge", name: "Crackling Stone Firepit Lounge", category: "amenity", role: "warmth", cost: 150, frames: 4, surface: "land_flat", tall: false, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.3, color: "#ff9648", intensity: 1.0, liftZ: 0.9, flicker: true } },
    heated_patio_tables: { id: "heated_patio_tables", baseId: "heated_patio_tables", name: "Fondue Patio Tables & Heat Lamps", category: "amenity", role: "food", cost: 165, frames: 4, surface: "land_flat", tall: false, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#ffae58", intensity: 0.9, liftZ: 1.3, flicker: true } },
    ice_rink_pad: { id: "ice_rink_pad", baseId: "ice_rink_pad", name: "Village Skating Ice Rink Pad", category: "amenity", role: "rink", cost: 190, frames: 4, surface: "land_or_ice_flat", tall: false, walkable: true, skatable: true, deckZ: 0.1, edges: ["N", "E", "S", "W"], light: { radius: 2.8, color: "#d8f0ff", intensity: 0.76, liftZ: 1.0 } },
    ice_curling_lane: { id: "ice_curling_lane", baseId: "ice_curling_lane", name: "Bavarian Bullseye Ice Curling Sheet", category: "amenity", role: "curling", cost: 205, frames: 4, surface: "land_or_ice_flat", tall: false, walkable: true, skatable: true, deckZ: 0.1, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#d8f0ff", intensity: 0.74, liftZ: 1.0 } },
    pond_hockey_goal_ns: { id: "pond_hockey_goal_ns", baseId: "pond_hockey_goal", name: "Red-Frame Pond Hockey Goal (N-S)", category: "amenity", role: "hockey", axis: "ns", cost: 95, frames: 1, surface: "land_or_ice_flat", tall: false, walkable: true, skatable: true, edges: ["N", "E", "S", "W"] },
    pond_hockey_goal_ew: { id: "pond_hockey_goal_ew", baseId: "pond_hockey_goal", name: "Red-Frame Pond Hockey Goal (E-W)", category: "amenity", role: "hockey", axis: "ew", cost: 95, frames: 1, surface: "land_or_ice_flat", tall: false, walkable: true, skatable: true, edges: ["N", "E", "S", "W"] },
    alphorn_band_stage: { id: "alphorn_band_stage", baseId: "alphorn_band_stage", name: "Festive Swiss Alphorn Trio Stage", category: "amenity", role: "stage", cost: 245, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffd078", intensity: 0.92, liftZ: 1.7, flicker: true } },
    ski_lockers: { id: "ski_lockers", baseId: "ski_lockers", name: "Heated Base-Area Ski Lockers", category: "amenity", role: "bench", cost: 85, frames: 1, surface: "land_flat", tall: false, edges: ["N", "E", "S", "W"] },
    holiday_tree: { id: "holiday_tree", baseId: "holiday_tree", name: "Festive Twinkling Holiday Spruce", category: "amenity", role: "scenery", cost: 140, frames: 4, surface: "land_flat", tall: true, edges: [], light: { radius: 3.4, color: "#ffd87c", intensity: 0.96, liftZ: 2.4, flicker: true } },
    street_light_garland_ns: { id: "street_light_garland_ns", baseId: "street_light_garland", name: "Overhead Edison-Bulb Garland Arch (N-S)", category: "amenity", role: "lamp", axis: "ns", cost: 65, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffc868", intensity: 0.94, liftZ: 2.1, flicker: true } },
    street_light_garland_ew: { id: "street_light_garland_ew", baseId: "street_light_garland", name: "Overhead Edison-Bulb Garland Arch (E-W)", category: "amenity", role: "lamp", axis: "ew", cost: 65, frames: 4, surface: "land_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ffc868", intensity: 0.94, liftZ: 2.1, flicker: true } },
    alpine_lamp: { id: "alpine_lamp", baseId: "alpine_lamp", name: "Wrought-Iron Village Lantern", category: "amenity", role: "lamp", cost: 45, frames: 4, surface: "land_flat", tall: false, edges: [], light: { radius: 2.8, color: "#ffbe5e", intensity: 0.95, liftZ: 1.7, flicker: true } },
    frozen_fountain: { id: "frozen_fountain", baseId: "frozen_fountain", name: "Icicle-Draped Stone Village Fountain", category: "amenity", role: "scenery", cost: 155, frames: 4, surface: "land_flat", tall: true, edges: [], light: { radius: 2.7, color: "#9ee8ff", intensity: 0.82, liftZ: 1.4 } },
    crystal_ice_sculpture: { id: "crystal_ice_sculpture", baseId: "crystal_ice_sculpture", name: "Chiselled Ice Alpine Stag Sculpture", category: "amenity", role: "scenery", cost: 130, frames: 1, surface: "land_flat", tall: true, edges: [], light: { radius: 2.6, color: "#7ceeff", intensity: 0.84, liftZ: 1.5, kind: "cyan" } },
    trail_map_board: { id: "trail_map_board", baseId: "trail_map_board", name: "Painted Mountain Trail Map Board", category: "amenity", role: "scenery", cost: 55, frames: 1, surface: "land_flat", tall: false, edges: ["S", "E"] },
    ski_rack_bench_sw: { id: "ski_rack_bench_sw", baseId: "ski_rack_bench", name: "Cedar Ski-Rack & Boot Bench (SW)", category: "amenity", role: "bench", cost: 40, frames: 1, surface: "land_flat", tall: false, edges: [] },
    ski_rack_bench_se: { id: "ski_rack_bench_se", baseId: "ski_rack_bench", name: "Cedar Ski-Rack & Boot Bench (SE)", category: "amenity", role: "bench", cost: 40, frames: 1, surface: "land_flat", tall: false, edges: [] },
    snowman_trio: { id: "snowman_trio", baseId: "snowman_trio", name: "Cheerful Alpine Snowman Trio", category: "amenity", role: "scenery", cost: 35, frames: 1, surface: "land_flat", tall: false, edges: [] },

    // v3 Expansion — Mountain Coaster, Gorge Skybridge, Town Heritage & Grand Winter Festival Kit (15 Base Items)
    mountain_coaster_ns: { id: "mountain_coaster_ns", baseId: "mountain_coaster", name: "Alpine Mountain Coaster Track (N-S)", category: "ride", role: "coaster", axis: "ns", cost: 55, frames: 4, surface: "land_any", tall: false, isCoaster: true, coasterPorts: ["N", "S"], deckZ: 0.42 },
    mountain_coaster_ew: { id: "mountain_coaster_ew", baseId: "mountain_coaster", name: "Alpine Mountain Coaster Track (E-W)", category: "ride", role: "coaster", axis: "ew", cost: 55, frames: 4, surface: "land_any", tall: false, isCoaster: true, coasterPorts: ["E", "W"], deckZ: 0.42 },
    mountain_coaster_curve_ne: { id: "mountain_coaster_curve_ne", baseId: "mountain_coaster_curve", name: "Banked Mountain Coaster Turn (N-E)", category: "ride", role: "coaster", cost: 60, frames: 4, surface: "land_any", tall: false, isCoaster: true, coasterPorts: ["N", "E"], deckZ: 0.42 },
    mountain_coaster_curve_nw: { id: "mountain_coaster_curve_nw", baseId: "mountain_coaster_curve", name: "Banked Mountain Coaster Turn (N-W)", category: "ride", role: "coaster", cost: 60, frames: 4, surface: "land_any", tall: false, isCoaster: true, coasterPorts: ["N", "W"], deckZ: 0.42 },
    mountain_coaster_curve_se: { id: "mountain_coaster_curve_se", baseId: "mountain_coaster_curve", name: "Banked Mountain Coaster Turn (S-E)", category: "ride", role: "coaster", cost: 60, frames: 4, surface: "land_any", tall: false, isCoaster: true, coasterPorts: ["S", "E"], deckZ: 0.42 },
    mountain_coaster_curve_sw: { id: "mountain_coaster_curve_sw", baseId: "mountain_coaster_curve", name: "Banked Mountain Coaster Turn (S-W)", category: "ride", role: "coaster", cost: 60, frames: 4, surface: "land_any", tall: false, isCoaster: true, coasterPorts: ["S", "W"], deckZ: 0.42 },

    suspension_skybridge_ns: { id: "suspension_skybridge_ns", baseId: "suspension_skybridge", name: "Peak-to-Peak Gorge Skybridge (N-S)", category: "bridge", role: "viewpoint", axis: "ns", cost: 165, frames: 4, surface: "land_or_water_any", tall: false, walkable: true, skiThrough: true, deckZ: 0.62, edges: ["N", "S"], light: { radius: 2.6, color: "#ffd88c", intensity: 0.84, liftZ: 1.4, emissiveKind: "bridge_lanterns" } },
    suspension_skybridge_ew: { id: "suspension_skybridge_ew", baseId: "suspension_skybridge", name: "Peak-to-Peak Gorge Skybridge (E-W)", category: "bridge", role: "viewpoint", axis: "ew", cost: 165, frames: 4, surface: "land_or_water_any", tall: false, walkable: true, skiThrough: true, deckZ: 0.62, edges: ["E", "W"], light: { radius: 2.6, color: "#ffd88c", intensity: 0.84, liftZ: 1.4, emissiveKind: "bridge_lanterns" } },

    glockenspiel_tower: { id: "glockenspiel_tower", baseId: "glockenspiel_tower", name: "Astronomical Glockenspiel Clock Tower", category: "building", role: "civic", cost: 540, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.6, color: "#ffe08a", intensity: 0.95, liftZ: 2.8, emissiveKind: "glockenspiel" } },
    kapellbrucke_bridge_ns: { id: "kapellbrucke_bridge_ns", baseId: "kapellbrucke_bridge", name: "Kapellbrücke Covered Timber Bridge (N-S)", category: "bridge", axis: "ns", cost: 175, frames: 4, surface: "land_or_water_flat", tall: true, walkable: true, skiThrough: true, deckZ: 0.52, edges: ["N", "S"], light: { radius: 3.0, color: "#ffd07a", intensity: 0.9, liftZ: 1.6, flicker: true, emissiveKind: "bridge_lanterns" } },
    kapellbrucke_bridge_ew: { id: "kapellbrucke_bridge_ew", baseId: "kapellbrucke_bridge", name: "Kapellbrücke Covered Timber Bridge (E-W)", category: "bridge", axis: "ew", cost: 175, frames: 4, surface: "land_or_water_flat", tall: true, walkable: true, skiThrough: true, deckZ: 0.52, edges: ["E", "W"], light: { radius: 3.0, color: "#ffd07a", intensity: 0.9, liftZ: 1.6, flicker: true, emissiveKind: "bridge_lanterns" } },
    raclette_hearth_stall: { id: "raclette_hearth_stall", baseId: "raclette_hearth_stall", name: "Open-Fire Raclette & Fondue Hearth", category: "amenity", role: "food", cost: 215, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.2, color: "#ff9e4a", intensity: 0.96, liftZ: 1.5, flicker: true, emissiveKind: "raclette_fire" } },

    winter_carousel: { id: "winter_carousel", baseId: "winter_carousel", name: "Gilded Pavilion Winter Carousel", category: "amenity", role: "ride", cost: 520, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.8, color: "#ffd878", intensity: 0.98, liftZ: 2.2, flicker: true, emissiveKind: "carousel" } },
    gluhwein_pyramid: { id: "gluhwein_pyramid", baseId: "gluhwein_pyramid", name: "3-Tier Spinning Glühwein Pyramid", category: "amenity", role: "food", cost: 340, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.5, color: "#ffc868", intensity: 0.96, liftZ: 2.4, flicker: true, emissiveKind: "pyramid" } },
    ice_palace_arch: { id: "ice_palace_arch", baseId: "ice_palace_arch", name: "Translucent Crystalline Ice Palace", category: "building", role: "viewpoint", cost: 480, frames: 4, surface: "land_or_ice_flat", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 3.8, color: "#76efff", intensity: 0.96, liftZ: 2.3, kind: "cyan", emissiveKind: "ice_palace" } },
    giant_snow_sculpture: { id: "giant_snow_sculpture", baseId: "giant_snow_sculpture", name: "Festival Ice Dragon & Castle Sculpture", category: "amenity", role: "scenery", cost: 260, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.0, color: "#9eeeff", intensity: 0.86, liftZ: 1.8, kind: "cyan", emissiveKind: "ice_sculpture" } },
    fireworks_mortar: { id: "fireworks_mortar", baseId: "fireworks_mortar", name: "Brass Pyrotechnic Fireworks Battery", category: "amenity", role: "stage", cost: 220, frames: 4, surface: "land_flat", tall: false, edges: ["N", "E", "S", "W"], light: { radius: 2.6, color: "#ffb85c", intensity: 0.88, liftZ: 1.1, flicker: true, emissiveKind: "fireworks_mortar" } },
    festival_bunting_arch_ns: { id: "festival_bunting_arch_ns", baseId: "festival_bunting_arch", name: "Festive Pennant & Lantern Arch (N-S)", category: "amenity", role: "lamp", axis: "ns", cost: 75, frames: 4, surface: "land_flat", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 3.3, color: "#ffd272", intensity: 0.95, liftZ: 2.2, flicker: true, emissiveKind: "bunting" } },
    festival_bunting_arch_ew: { id: "festival_bunting_arch_ew", baseId: "festival_bunting_arch", name: "Festive Pennant & Lantern Arch (E-W)", category: "amenity", role: "lamp", axis: "ew", cost: 75, frames: 4, surface: "land_flat", tall: true, walkable: true, skiThrough: true, edges: ["N", "E", "S", "W"], light: { radius: 3.3, color: "#ffd272", intensity: 0.95, liftZ: 2.2, flicker: true, emissiveKind: "bunting" } },
    gondola_dj_booth: { id: "gondola_dj_booth", baseId: "gondola_dj_booth", name: "Retro Gondola Après-Ski DJ Booth", category: "amenity", role: "stage", cost: 295, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.4, color: "#58f0ff", intensity: 0.96, liftZ: 1.8, flicker: true, kind: "neon", emissiveKind: "dj_booth" } },
    snow_cinema_screen: { id: "snow_cinema_screen", baseId: "snow_cinema_screen", name: "Outdoor Alpine Snow Cinema Screen", category: "amenity", role: "stage", cost: 330, frames: 4, surface: "land_flat", tall: true, edges: ["N", "E", "S", "W"], light: { radius: 3.6, color: "#a8e6ff", intensity: 0.94, liftZ: 2.1, emissiveKind: "cinema_screen" } },
    alpine_photo_frame: { id: "alpine_photo_frame", baseId: "alpine_photo_frame", name: "Summit Panorama Selfie Frame & Swing", category: "amenity", role: "viewpoint", cost: 145, frames: 4, surface: "land_any", tall: true, walkable: true, edges: ["N", "E", "S", "W"], light: { radius: 2.5, color: "#ffd888", intensity: 0.82, liftZ: 1.6, emissiveKind: "photo_frame" } },
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function mulberry32(seed) {
    let a = (Number(seed) || 2026) >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2D(ix, iy, seed) {
    let n = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function valueNoise2D(x, y, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const v00 = hash2D(x0, y0, seed);
    const v10 = hash2D(x0 + 1, y0, seed);
    const v01 = hash2D(x0, y0 + 1, seed);
    const v11 = hash2D(x0 + 1, y0 + 1, seed);
    const a = v00 + (v10 - v00) * ux;
    const b = v01 + (v11 - v01) * ux;
    return a + (b - a) * uy;
  }

  function fbm2D(x, y, seed, octaves) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1.0;
    let norm = 0;
    for (let i = 0; i < (octaves || 3); i++) {
      sum += amp * valueNoise2D(x * freq, y * freq, seed + i * 97);
      norm += amp;
      amp *= 0.5;
      freq *= 2.0;
    }
    return sum / (norm || 1);
  }

  function normalizeRotation(rotation) {
    if (typeof rotation === "number" && Number.isFinite(rotation)) {
      return Math.abs(rotation | 0);
    }
    if (typeof rotation === "string") {
      const r = rotation.trim().toLowerCase();
      if (r === "se" || r === "ew" || r === "e" || r === "1") return 1;
      if (r === "s" || r === "sw_rot" || r === "2") return 2;
      if (r === "w" || r === "nw" || r === "3") return 3;
    }
    return 0;
  }

  function makeNeighborEntry(r, c, dir) {
    return {
      r,
      c,
      row: r,
      col: c,
      dir,
      0: r,
      1: c,
      [Symbol.iterator]: function* () {
        yield r;
        yield c;
      },
    };
  }

  // Base cost lookup for rotatable base IDs not directly keyed as exact `_ns/_sw/_v0` variants
  const BASE_ITEM_COSTS = {
    town_walkway: 25,
    snow_stairs: 45,
    covered_escalator: 115,
    timber_bridge: 95,
    stone_arch_bridge: 135,
    retaining_wall: 40,
    mid_transfer_station: 480,
    train_track: 40,
    train_track_curve: 45,
    stone_viaduct: 145,
    rail_tunnel_portal: 160,
    train_platform: 85,
    rail_crossing_gate: 75,
    pond_hockey_goal: 95,
    street_light_garland: 65,
    ski_rack_bench: 40,
    cliff_warning_rope: 30,
    finish_timing_arch: 165,
    safety_net: 35,
    wind_drift_fence: 34,
    park_kicker: 110,
    big_air_kicker: 175,
    stunt_airbag: 160,
    park_rail: 85,
    rainbow_cbox: 115,
    kinked_stair_rail: 105,
    timber_wallride: 125,
    halfpipe_wall: 130,
    boardercross_berm: 95,
    snow_cannon: 145,
    prayer_flags: 40,
    spruce_tall: 25,
    spruce_med: 20,
    golden_larch: 26,
    weeping_hemlock: 24,
    dwarf_krummholz: 16,
    frosted_birch: 22,
    summit_crag: 35,
    snow_boulder: 18,
    mountain_coaster: 55,
    mountain_coaster_curve: 60,
    suspension_skybridge: 165,
    kapellbrucke_bridge: 175,
    festival_bunting_arch: 75,
    sculpt_matterhorn_peak: 95,
    matterhorn_peak: 95,
    sculpt_glacial_bowl: 110,
    glacial_bowl: 110,
    sculpt_cliff_balcony: 75,
    cliff_balcony: 75,
  };

  class SanctuaryWorld {
    constructor(sizeOrOpts = 28, initialPreset = "zermatt_grand", seed = 2026) {
      let size = 28;
      let preset = initialPreset;
      let s = seed;
      if (sizeOrOpts && typeof sizeOrOpts === "object") {
        size = sizeOrOpts.size || 28;
        preset = sizeOrOpts.preset || "zermatt_grand";
        s = sizeOrOpts.seed !== undefined ? sizeOrOpts.seed : 2026;
      } else if (typeof sizeOrOpts === "number") {
        size = sizeOrOpts;
      }

      this.undoLimit = 30;
      this.undoStack = [];
      this.redoStack = [];
      this._batchDepth = 0;
      this._batchSnapshot = null;
      this._batchDirty = false;
      this._suppressHistory = false;
      this._buildingPreset = false;
      this._listeners = [];
      this.version = 1;
      this.generationId = 1;

      this.lifts = [];
      this._nextLiftSeq = 1;
      this._skiRuns = [];
      this._runCounts = { green: 0, blue: 0, black: 0 };
      this._skiRunsDirty = false;
      this.skiTracks = [];
      this._skiTrackPool = [];
      this._skiTrackHead = 0;
      this.maxSkiTracks = 720;

      const initN = clamp(Math.round(size || 28), 16, 36);
      this._editHistory = [];
      this.lastEditBounds = {
        r0: 0,
        c0: 0,
        r1: initN - 1,
        c1: initN - 1,
        prevVersion: -1,
        version: this.version,
        full: true,
      };
      this._editHistory.push(this.lastEditBounds);

      this.floatingClouds = [];
      this._cloudTime = 0;
      this._lastCloudStepAt = -1;
      this._nightLightsCacheVer = -1;
      this._nightLightsCache = null;

      this.presetName = preset || "zermatt_grand";
      this.seed = Number.isFinite(Number(s)) ? Number(s) : 2026;
      this._initEmptyGrid(size, "untouched_powder");

      if (preset) {
        this.loadPreset(this.presetName, this.seed, false);
      }
    }

    get rows() {
      return this.size;
    }
    get cols() {
      return this.size;
    }
    get gridSize() {
      return this.size;
    }

    get skiRuns() {
      if (this._skiRunsDirty) {
        this._analyzeSkiRuns();
      }
      return this._skiRuns;
    }
    set skiRuns(val) {
      this._skiRuns = Array.isArray(val) ? val : [];
    }

    get runCounts() {
      if (this._skiRunsDirty) {
        this._analyzeSkiRuns();
      }
      return this._runCounts;
    }
    set runCounts(val) {
      this._runCounts = val || { green: 0, blue: 0, black: 0 };
    }

    onChange(fn) {
      if (typeof fn === "function") {
        this._listeners.push(fn);
      }
      return () => {
        const idx = this._listeners.indexOf(fn);
        if (idx >= 0) this._listeners.splice(idx, 1);
      };
    }

    _recordDirtyRegion(r0, c0, r1, c1, isFull = false, prevVersion = -1) {
      const n = this.size || 28;
      if (isFull) {
        const entry = {
          r0: 0,
          c0: 0,
          r1: n - 1,
          c1: n - 1,
          prevVersion: -1,
          version: this.version,
          full: true,
        };
        this.lastEditBounds = entry;
        this._editHistory.length = 0;
        this._editHistory.push(entry);
        return entry;
      }

      const pr0 = clamp(Math.min(r0, r1) - 1, 0, n - 1);
      const pc0 = clamp(Math.min(c0, c1) - 1, 0, n - 1);
      const pr1 = clamp(Math.max(r0, r1) + 1, 0, n - 1);
      const pc1 = clamp(Math.max(c0, c1) + 1, 0, n - 1);
      const entry = {
        r0: pr0,
        c0: pc0,
        r1: pr1,
        c1: pc1,
        prevVersion,
        version: this.version,
        full: false,
      };
      this.lastEditBounds = entry;
      this._editHistory.push(entry);
      if (this._editHistory.length > 32) {
        this._editHistory.shift();
      }
      return entry;
    }

    getDirtyBoundsSince(sinceVersion) {
      const n = this.size || 28;
      const curVer = this.version;
      if (sinceVersion === curVer) {
        return {
          r0: 0,
          c0: 0,
          r1: -1,
          c1: -1,
          prevVersion: curVer,
          version: curVer,
          full: false,
          empty: true,
        };
      }
      if (
        typeof sinceVersion !== "number" ||
        !Number.isFinite(sinceVersion) ||
        sinceVersion < 0 ||
        sinceVersion > curVer
      ) {
        return {
          r0: 0,
          c0: 0,
          r1: n - 1,
          c1: n - 1,
          prevVersion: -1,
          version: curVer,
          full: true,
        };
      }
      if (
        this.lastEditBounds &&
        !this.lastEditBounds.full &&
        this.lastEditBounds.prevVersion === sinceVersion &&
        this.lastEditBounds.version === curVer
      ) {
        return this.lastEditBounds;
      }

      const hist = this._editHistory;
      const stepsNeeded = curVer - sinceVersion;
      if (stepsNeeded > 32 || hist.length === 0) {
        return {
          r0: 0,
          c0: 0,
          r1: n - 1,
          c1: n - 1,
          prevVersion: -1,
          version: curVer,
          full: true,
        };
      }

      let expectedPrev = sinceVersion;
      let r0 = n;
      let c0 = n;
      let r1 = -1;
      let c1 = -1;
      for (let i = 0; i < hist.length; i++) {
        const e = hist[i];
        if (e.version <= sinceVersion) continue;
        if (e.full || e.prevVersion !== expectedPrev) {
          return {
            r0: 0,
            c0: 0,
            r1: n - 1,
            c1: n - 1,
            prevVersion: -1,
            version: curVer,
            full: true,
          };
        }
        if (e.r0 < r0) r0 = e.r0;
        if (e.c0 < c0) c0 = e.c0;
        if (e.r1 > r1) r1 = e.r1;
        if (e.c1 > c1) c1 = e.c1;
        expectedPrev = e.version;
      }

      if (expectedPrev !== curVer || r1 < r0) {
        return {
          r0: 0,
          c0: 0,
          r1: n - 1,
          c1: n - 1,
          prevVersion: -1,
          version: curVer,
          full: true,
        };
      }

      return {
        r0,
        c0,
        r1,
        c1,
        prevVersion: sinceVersion,
        version: curVer,
        full: false,
      };
    }

    consumeDirtyBounds(sinceVersion) {
      return this.getDirtyBoundsSince(sinceVersion);
    }

    _notifyChange(reason, dirtyBounds = null) {
      if (this._buildingPreset) return;
      const prevVer = this.version;
      this.version++;
      const isFull =
        !dirtyBounds ||
        Boolean(dirtyBounds.full) ||
        reason === "preset" ||
        reason === "restore";
      if (isFull) {
        this._recordDirtyRegion(0, 0, this.size - 1, this.size - 1, true, -1);
      } else {
        this._recordDirtyRegion(
          dirtyBounds.r0,
          dirtyBounds.c0,
          dirtyBounds.r1,
          dirtyBounds.c1,
          false,
          prevVer
        );
      }
      for (let i = 0; i < this._listeners.length; i++) {
        try {
          this._listeners[i](this, reason);
        } catch (err) {
          console.error("SanctuaryWorld listener error:", err);
        }
      }
    }

    _initEmptyGrid(size, fillSurface = "untouched_powder") {
      const n = clamp(Math.round(size || 28), 16, 36);
      this.size = n;
      this.cornerZ = [];
      for (let cr = 0; cr <= n; cr++) {
        this.cornerZ.push(new Array(n + 1).fill(0));
      }

      this.cells = [];
      for (let r = 0; r < n; r++) {
        const row = [];
        for (let c = 0; c < n; c++) {
          const fringes = [];
          row.push({
            r,
            c,
            surface: fillSurface,
            biome: fillSurface,
            water: null,
            flora: null,
            structure: null,
            pisteQuality: 100,
            corners: [0, 0, 0, 0],
            minLevel: 0,
            maxLevel: 0,
            level: 0,
            isFlat: true,
            slopeMask: "0000",
            variant: 0,
            baseTile: `${fillSurface}_lv0_v0`,
            hydroKey: null,
            surfaceFringes: fringes,
            biomeDecals: fringes,
            waterDecals: null,
            structureId: null,
            baseStructureId: null,
            liftId: null,
          });
        }
        this.cells.push(row);
      }
      this.lifts = [];
      this._skiRuns = [];
      this._runCounts = { green: 0, blue: 0, black: 0 };
      this._skiRunsDirty = false;
      this.skiTracks = [];
      this._skiTrackHead = 0;
      this._nightLightsCacheVer = -1;
      this._nightLightsCache = null;
      this._initFloatingClouds(this.seed);
      this._rebuildAllDerived();
    }

    setGridSize(newSize, presetName = null) {
      const n = clamp(Math.round(Number(newSize) || 28), 16, 36);
      this.size = n;
      return this.loadPreset(presetName || this.presetName || "zermatt_grand", this.seed, false);
    }

    resizeGrid(newSize, presetName = null) {
      return this.setGridSize(newSize, presetName);
    }

    inBounds(r, c) {
      return r >= 0 && c >= 0 && r < this.size && c < this.size;
    }

    inCornerBounds(cr, cc) {
      return cr >= 0 && cc >= 0 && cr <= this.size && cc <= this.size;
    }

    getCell(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c] : null;
    }

    getCellCorners(r, c) {
      if (!this.inBounds(r, c)) return [0, 0, 0, 0];
      return [
        this.cornerZ[r][c],
        this.cornerZ[r][c + 1],
        this.cornerZ[r + 1][c + 1],
        this.cornerZ[r + 1][c],
      ];
    }

    getSurface(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].surface : "untouched_powder";
    }

    getBiome(r, c) {
      return this.getSurface(r, c);
    }

    getWater(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].water : null;
    }

    getFlora(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].flora : null;
    }

    getStructure(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].structure : null;
    }

    getCellLevel(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].minLevel : 0;
    }

    getCellBaseLevel(r, c) {
      return this.getCellLevel(r, c);
    }

    getSlopeMask(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].slopeMask : "0000";
    }

    worldToScreen(r, c, u = 4.0, v = 4.0, extraZ = 0.0) {
      const baseZ = this.getSurfaceZ(r, c, u, v, true);
      const totalZ = baseZ + (Number(extraZ) || 0);
      return {
        x: (c - r) * 64 + (v - u) * 8,
        y: (r + c) * 32 + (u + v) * 4 - totalZ * 4,
        z: totalZ,
      };
    }

    static getStructureCatalog() {
      return STRUCTURE_DEFS;
    }

    static getFloraCatalog() {
      return FLORA_DEFS;
    }

    static getLiftSpecs() {
      return LIFT_SPECS;
    }

    static getSurfaces() {
      return SURFACES.slice();
    }

    getItemCatalog() {
      return {
        structures: STRUCTURE_DEFS,
        flora: FLORA_DEFS,
        surfaces: SURFACES,
        water: WATER_TYPES,
        lifts: LIFT_SPECS,
      };
    }

    getItemCost(itemId, spanCells = 5) {
      if (!itemId) return 0;
      if (LIFT_SPECS[itemId]) {
        const sp = LIFT_SPECS[itemId];
        return sp.baseCost + Math.max(sp.minLen, spanCells | 0) * sp.perCellCost;
      }
      if (SURFACE_COSTS[itemId] !== undefined) return SURFACE_COSTS[itemId];
      if (WATER_COSTS[itemId] !== undefined) return WATER_COSTS[itemId];
      if (BASE_ITEM_COSTS[itemId] !== undefined) return BASE_ITEM_COSTS[itemId];
      if (STRUCTURE_DEFS[itemId]) return STRUCTURE_DEFS[itemId].cost || 0;
      if (FLORA_DEFS[itemId]) return FLORA_DEFS[itemId].cost || 0;
      return 0;
    }

    // =========================================================================
    // Volumetric High-Altitude Floating Pixel Clouds (`getFloatingClouds()`)
    // =========================================================================

    _initFloatingClouds(seed = 2026) {
      const n = this.size || 28;
      const rng = mulberry32((Number(seed) || 2026) + 7717);
      const count = 10;
      const clouds = [];

      for (let i = 0; i < count; i++) {
        // Distribute across summit, mid-mountain, and flanking ridges like the reference dioramas
        const band = i % 3;
        const baseR =
          band === 0
            ? 1.2 + (i / count) * (n * 0.34)
            : band === 1
            ? n * 0.24 + rng() * (n * 0.38)
            : n * 0.48 + rng() * (n * 0.36);
        const baseC = ((i * (n / count) + rng() * 2.6) % n);
        const variant = i % 3;
        const z = 21.6 + (i % 4) * 0.55;
        const speedC = 0.16 + (i % 5) * 0.035;
        const speedR = (i % 2 === 0 ? 1 : -1) * (0.018 + (i % 3) * 0.008);

        const cObj = {
          id: `cloud_${i + 1}`,
          spriteKey: `cloud_puff_v${variant}`,
          variant,
          exactR: clamp(baseR, 0.4, n - 1.4),
          exactC: clamp(baseC, 0.4, n - 1.4),
          r: 0,
          c: 0,
          u: 4.0,
          v: 4.0,
          z,
          extraZ: z,
          wx: 0,
          wy: 0,
          alpha: 0.9,
          shadowAlpha: 0.12,
          speedC,
          speedR,
          bobPhase: i * 1.15,
        };
        this._syncCloudDerived(cObj);
        clouds.push(cObj);
      }

      this.floatingClouds = clouds;
      this._cloudTime = 0;
    }

    _syncCloudDerived(cl) {
      const n = this.size || 28;
      const cr = clamp(Math.floor(cl.exactR), 0, n - 1);
      const cc = clamp(Math.floor(cl.exactC), 0, n - 1);
      const u = clamp((cl.exactR - cr) * 8.0, 0, 8);
      const v = clamp((cl.exactC - cc) * 8.0, 0, 8);
      const bobZ = Math.sin(this._cloudTime * 0.55 + cl.bobPhase) * 0.35;
      const effZ = cl.z + bobZ;
      cl.r = cr;
      cl.c = cc;
      cl.u = u;
      cl.v = v;
      cl.extraZ = effZ;
      cl.wx = (cl.exactC - cl.exactR) * 64;
      cl.wy = (cl.exactR + cl.exactC) * 32 - effZ * 4;
    }

    updateClouds(dt) {
      const step = clamp(Number(dt) || 0, 0, 0.12);
      if (step <= 0) return this.floatingClouds;
      if (!Array.isArray(this.floatingClouds) || this.floatingClouds.length === 0) {
        this._initFloatingClouds(this.seed);
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (this._lastCloudStepAt > 0 && now - this._lastCloudStepAt < 6) {
        return this.floatingClouds;
      }
      this._lastCloudStepAt = now;
      this._cloudTime += step;

      const n = this.size || 28;
      const span = n + 3.0;
      for (let i = 0; i < this.floatingClouds.length; i++) {
        const cl = this.floatingClouds[i];
        cl.exactC += cl.speedC * step;
        cl.exactR += cl.speedR * step + Math.sin(this._cloudTime * 0.25 + cl.bobPhase) * 0.008 * step;
        if (cl.exactC > n + 1.5) cl.exactC -= span;
        if (cl.exactC < -1.5) cl.exactC += span;
        if (cl.exactR > n - 1.2) cl.speedR = -Math.abs(cl.speedR);
        if (cl.exactR < 0.6) cl.speedR = Math.abs(cl.speedR);
        this._syncCloudDerived(cl);
      }
      return this.floatingClouds;
    }

    getFloatingClouds() {
      if (!Array.isArray(this.floatingClouds) || this.floatingClouds.length === 0) {
        this._initFloatingClouds(this.seed);
      }
      return this.floatingClouds;
    }

    // =========================================================================
    // Undo / Redo (30-Step Snapshot Stack) & Serialization
    // =========================================================================

    _captureSnapshot() {
      const n = this.size;
      const cornerCopy = new Array(n + 1);
      for (let cr = 0; cr <= n; cr++) {
        cornerCopy[cr] = this.cornerZ[cr].slice();
      }
      const cellCopy = new Array(n);
      for (let r = 0; r < n; r++) {
        const row = new Array(n);
        for (let c = 0; c < n; c++) {
          const cell = this.cells[r][c];
          row[c] = {
            surface: cell.surface,
            water: cell.water,
            flora: cell.flora,
            pisteQuality: cell.pisteQuality,
            liftId: cell.liftId || null,
            structure: cell.structure ? Object.assign({}, cell.structure) : null,
          };
        }
        cellCopy[r] = row;
      }
      const liftsCopy = this.lifts.map((L) => ({
        id: L.id,
        type: L.type,
        axis: L.axis,
        baseR: L.baseR,
        baseC: L.baseC,
        topR: L.topR,
        topC: L.topC,
      }));
      return {
        size: n,
        presetName: this.presetName,
        seed: this.seed,
        nextLiftSeq: this._nextLiftSeq,
        cornerZ: cornerCopy,
        cells: cellCopy,
        lifts: liftsCopy,
      };
    }

    _restoreSnapshot(snap, notify = true) {
      if (!snap) return false;
      const n = snap.size;
      this.size = n;
      this.presetName = snap.presetName || this.presetName;
      this.seed = snap.seed !== undefined ? snap.seed : this.seed;
      this._nextLiftSeq = snap.nextLiftSeq || this._nextLiftSeq || 1;

      this.cornerZ = new Array(n + 1);
      for (let cr = 0; cr <= n; cr++) {
        this.cornerZ[cr] = snap.cornerZ[cr].slice();
      }

      this.cells = new Array(n);
      for (let r = 0; r < n; r++) {
        const row = new Array(n);
        for (let c = 0; c < n; c++) {
          const src = snap.cells[r][c];
          const surf = SURFACE_SET.has(src.surface)
            ? src.surface
            : SURFACE_SET.has(src.biome)
            ? src.biome
            : "untouched_powder";
          row[c] = {
            r,
            c,
            surface: surf,
            biome: surf,
            water: WATER_SET.has(src.water) ? src.water : null,
            flora: src.flora || null,
            pisteQuality: src.pisteQuality !== undefined ? src.pisteQuality : 100,
            liftId: src.liftId || null,
            structure: src.structure ? Object.assign({}, src.structure) : null,
            corners: [0, 0, 0, 0],
            minLevel: 0,
            maxLevel: 0,
            level: 0,
            isFlat: true,
            slopeMask: "0000",
            hydroKey: null,
            surfaceFringes: [],
            biomeDecals: [],
            waterDecals: null,
            structureId: null,
            baseStructureId: null,
          };
        }
        this.cells[r] = row;
      }

      this.lifts = Array.isArray(snap.lifts)
        ? snap.lifts.map((L) => Object.assign({}, L))
        : [];
      if (!this.floatingClouds || this.floatingClouds.length === 0) {
        this._initFloatingClouds(this.seed);
      }
      this._nightLightsCacheVer = -1;
      this._nightLightsCache = null;
      this._rebuildAllDerived();
      if (notify) {
        this._notifyChange("restore", { full: true });
      }
      return true;
    }

    _recordUndoBeforeChange() {
      if (this._suppressHistory) return;
      if (this._batchDepth > 0) {
        if (!this._batchDirty) {
          this._batchDirty = true;
        }
        return;
      }
      this.undoStack.push(this._captureSnapshot());
      if (this.undoStack.length > this.undoLimit) {
        this.undoStack.shift();
      }
      this.redoStack.length = 0;
    }

    beginBatch() {
      if (this._batchDepth === 0 && !this._suppressHistory) {
        this._batchSnapshot = this._captureSnapshot();
        this._batchDirty = false;
      }
      this._batchDepth++;
    }

    endBatch() {
      if (this._batchDepth <= 0) return;
      this._batchDepth--;
      if (this._batchDepth === 0) {
        if (this._batchDirty && this._batchSnapshot && !this._suppressHistory) {
          this.undoStack.push(this._batchSnapshot);
          if (this.undoStack.length > this.undoLimit) {
            this.undoStack.shift();
          }
          this.redoStack.length = 0;
        }
        this._batchSnapshot = null;
        this._batchDirty = false;
        if (this._skiRunsDirty && !this._buildingPreset) {
          this._analyzeSkiRuns();
        }
      }
    }

    canUndo() {
      return this.undoStack.length > 0;
    }

    canRedo() {
      return this.redoStack.length > 0;
    }

    undo() {
      if (this.undoStack.length === 0) return false;
      const current = this._captureSnapshot();
      const prev = this.undoStack.pop();
      this.redoStack.push(current);
      if (this.redoStack.length > this.undoLimit) {
        this.redoStack.shift();
      }
      return this._restoreSnapshot(prev);
    }

    redo() {
      if (this.redoStack.length === 0) return false;
      const current = this._captureSnapshot();
      const next = this.redoStack.pop();
      this.undoStack.push(current);
      if (this.undoStack.length > this.undoLimit) {
        this.undoStack.shift();
      }
      return this._restoreSnapshot(next);
    }

    serialize() {
      const snap = this._captureSnapshot();
      return {
        version: 4,
        size: snap.size,
        presetName: snap.presetName,
        seed: snap.seed,
        nextLiftSeq: snap.nextLiftSeq,
        cornerZ: snap.cornerZ,
        cells: snap.cells,
        lifts: snap.lifts,
      };
    }

    toJSON() {
      return this.serialize();
    }

    deserialize(payload) {
      let obj = payload;
      if (typeof payload === "string") {
        obj = JSON.parse(payload);
      }
      if (!obj || typeof obj !== "object" || !Array.isArray(obj.cornerZ) || !Array.isArray(obj.cells)) {
        return false;
      }
      this.undoStack.length = 0;
      this.redoStack.length = 0;
      return this._restoreSnapshot(obj);
    }

    // =========================================================================
    // Chebyshev 8-Neighbor Corner-Height Constraint Solver (`Lv 0..4`)
    // =========================================================================

    _propagateCornerConstraints(pinnedCorners) {
      const n = this.size;
      const stride = n + 1;
      const pinnedMap = new Map();
      for (let i = 0; i < pinnedCorners.length; i++) {
        const [cr, cc, val] = pinnedCorners[i];
        if (cr >= 0 && cc >= 0 && cr <= n && cc <= n) {
          pinnedMap.set(cr * stride + cc, [cr, cc, clamp(val | 0, 0, MAX_ELEV)]);
        }
      }

      const uniquePinned = Array.from(pinnedMap.values());
      // Fast Lipschitz-1 check (`|z_i - z_j| <= max(|r_i - r_j|, |c_i - c_j|)`):
      // True for every uniform `1x1` sculpt, `3x3` plateau/raise/lower, `2x2` landmark pad & water pad!
      let isPairwiseValid = uniquePinned.length <= 36;
      if (isPairwiseValid) {
        for (let i = 0; i < uniquePinned.length && isPairwiseValid; i++) {
          const [r1, c1, z1] = uniquePinned[i];
          for (let j = i + 1; j < uniquePinned.length; j++) {
            const [r2, c2, z2] = uniquePinned[j];
            if (Math.abs(z1 - z2) > Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2))) {
              isPairwiseValid = false;
              break;
            }
          }
        }
      }

      let minCr = stride;
      let maxCr = -1;
      let minCc = stride;
      let maxCc = -1;
      const queue = [];

      for (let i = 0; i < uniquePinned.length; i++) {
        const [cr, cc, zVal] = uniquePinned[i];
        if (this.cornerZ[cr][cc] !== zVal) {
          this.cornerZ[cr][cc] = zVal;
          if (cr < minCr) minCr = cr;
          if (cr > maxCr) maxCr = cr;
          if (cc < minCc) minCc = cc;
          if (cc > maxCc) maxCc = cc;
        }
        queue.push(cr, cc);
      }

      let head = 0;
      while (head < queue.length) {
        const cr = queue[head++];
        const cc = queue[head++];
        const cur = this.cornerZ[cr][cc];
        for (let dr = -1; dr <= 1; dr++) {
          const nr = cr + dr;
          if (nr < 0 || nr > n) continue;
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nc = cc + dc;
            if (nc < 0 || nc > n) continue;
            if (pinnedMap.has(nr * stride + nc)) continue;

            const nbVal = this.cornerZ[nr][nc];
            let nextVal = nbVal;
            if (nbVal < cur - 1) {
              nextVal = cur - 1;
            } else if (nbVal > cur + 1) {
              nextVal = cur + 1;
            }
            if (nextVal !== nbVal) {
              this.cornerZ[nr][nc] = nextVal;
              if (nr < minCr) minCr = nr;
              if (nr > maxCr) maxCr = nr;
              if (nc < minCc) minCc = nc;
              if (nc > maxCc) maxCc = nc;
              queue.push(nr, nc);
            }
          }
        }
      }

      // Only run global gradient pass when pinnedCorners themselves violated `|dz| <= chebyshevDist` (e.g. `smooth`)
      if (!isPairwiseValid) {
        const glob = this._enforceGlobalCornerGradient();
        if (glob && glob.changed) {
          if (glob.minCr < minCr) minCr = glob.minCr;
          if (glob.maxCr > maxCr) maxCr = glob.maxCr;
          if (glob.minCc < minCc) minCc = glob.minCc;
          if (glob.maxCc > maxCc) maxCc = glob.maxCc;
        }
      }

      if (maxCr < minCr) {
        return { changed: false, cellR0: 0, cellC0: 0, cellR1: -1, cellC1: -1 };
      }
      return {
        changed: true,
        cellR0: clamp(minCr - 1, 0, n - 1),
        cellC0: clamp(minCc - 1, 0, n - 1),
        cellR1: clamp(maxCr, 0, n - 1),
        cellC1: clamp(maxCc, 0, n - 1),
      };
    }

    _enforceGlobalCornerGradient() {
      const n = this.size;
      // O(N) 5-level bucket queue (`Lv 4 -> 0`) — zero `Array.sort` & zero pair allocations!
      const b4 = [];
      const b3 = [];
      const b2 = [];
      const b1 = [];
      const b0 = [];
      for (let cr = 0; cr <= n; cr++) {
        const row = this.cornerZ[cr];
        for (let cc = 0; cc <= n; cc++) {
          const z = clamp(row[cc] | 0, 0, MAX_ELEV);
          row[cc] = z;
          if (z === 4) b4.push(cr, cc);
          else if (z === 3) b3.push(cr, cc);
          else if (z === 2) b2.push(cr, cc);
          else if (z === 1) b1.push(cr, cc);
          else b0.push(cr, cc);
        }
      }

      const queue = [];
      for (let i = 0; i < b4.length; i++) queue.push(b4[i]);
      for (let i = 0; i < b3.length; i++) queue.push(b3[i]);
      for (let i = 0; i < b2.length; i++) queue.push(b2[i]);
      for (let i = 0; i < b1.length; i++) queue.push(b1[i]);
      for (let i = 0; i < b0.length; i++) queue.push(b0[i]);

      let minCr = n + 1;
      let maxCr = -1;
      let minCc = n + 1;
      let maxCc = -1;

      let head = 0;
      while (head < queue.length) {
        const cr = queue[head++];
        const cc = queue[head++];
        const cur = this.cornerZ[cr][cc];
        if (cur <= 1) continue;
        const minAllowed = cur - 1;
        for (let dr = -1; dr <= 1; dr++) {
          const nr = cr + dr;
          if (nr < 0 || nr > n) continue;
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nc = cc + dc;
            if (nc < 0 || nc > n) continue;
            if (this.cornerZ[nr][nc] < minAllowed) {
              this.cornerZ[nr][nc] = minAllowed;
              if (nr < minCr) minCr = nr;
              if (nr > maxCr) maxCr = nr;
              if (nc < minCc) minCc = nc;
              if (nc > maxCc) maxCc = nc;
              queue.push(nr, nc);
            }
          }
        }
      }

      return {
        changed: maxCr >= minCr,
        minCr,
        maxCr,
        minCc,
        maxCc,
      };
    }

    _remove2x2StructureGroup(parentR, parentC, baseId = null) {
      for (let dr = 0; dr <= 1; dr++) {
        for (let dc = 0; dc <= 1; dc++) {
          const r = parentR + dr;
          const c = parentC + dc;
          if (!this.inBounds(r, c)) continue;
          const s = this.cells[r][c].structure;
          if (
            s &&
            COMPOSITE_2X2_IDS.has(s.baseId) &&
            (!baseId || s.baseId === baseId) &&
            s.parentR === parentR &&
            s.parentC === parentC
          ) {
            this.cells[r][c].structure = null;
            this.cells[r][c].structureId = null;
            this.cells[r][c].baseStructureId = null;
          }
        }
      }
    }

    _removeLiftRecord(liftId) {
      if (!liftId) return null;
      const idx = this.lifts.findIndex((L) => L.id === liftId);
      let bR0 = this.size;
      let bC0 = this.size;
      let bR1 = -1;
      let bC1 = -1;
      if (idx >= 0) {
        const L = this.lifts[idx];
        bR0 = Math.min(L.baseR, L.topR);
        bC0 = Math.min(L.baseC, L.topC);
        bR1 = Math.max(L.baseR, L.topR);
        bC1 = Math.max(L.baseC, L.topC);
        this.lifts.splice(idx, 1);
      }
      const n = this.size;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cell = this.cells[r][c];
          let touched = false;
          if (cell.liftId === liftId) {
            cell.liftId = null;
            touched = true;
          }
          if (cell.structure && cell.structure.liftId === liftId) {
            cell.structure = null;
            cell.structureId = null;
            cell.baseStructureId = null;
            touched = true;
          }
          if (touched) {
            if (r < bR0) bR0 = r;
            if (c < bC0) bC0 = c;
            if (r > bR1) bR1 = r;
            if (c > bC1) bC1 = c;
          }
        }
      }
      return bR1 >= bR0 ? { r0: bR0, c0: bC0, r1: bR1, c1: bC1 } : null;
    }

    _reconcileRegionCellsOnly(r0, c0, r1, c1) {
      const n = this.size;
      const ra = clamp(Math.min(r0, r1), 0, n - 1);
      const rb = clamp(Math.max(r0, r1), 0, n - 1);
      const ca = clamp(Math.min(c0, c1), 0, n - 1);
      const cb = clamp(Math.max(c0, c1), 0, n - 1);

      let bR0 = ra;
      let bC0 = ca;
      let bR1 = rb;
      let bC1 = cb;

      // 1. Recompute cell corner geometry & validate water/creek/crevasse types in `[ra..rb, ca..cb]`
      for (let r = ra; r <= rb; r++) {
        for (let c = ca; c <= cb; c++) {
          const cell = this.cells[r][c];
          const zN = this.cornerZ[r][c];
          const zE = this.cornerZ[r][c + 1];
          const zS = this.cornerZ[r + 1][c + 1];
          const zW = this.cornerZ[r + 1][c];
          const lo = Math.min(zN, zE, zS, zW);
          const hi = Math.max(zN, zE, zS, zW);
          const cArr = cell.corners;
          cArr[0] = zN;
          cArr[1] = zE;
          cArr[2] = zS;
          cArr[3] = zW;
          cell.minLevel = lo;
          cell.maxLevel = hi;
          cell.level = lo;
          const isFlat = lo === hi;
          cell.isFlat = isFlat;
          const mask = isFlat ? "0000" : `${zN - lo}${zE - lo}${zS - lo}${zW - lo}`;
          cell.slopeMask = mask;

          const varCount = SURFACE_VARIANTS[cell.surface] || 2;
          const vIdx = (((r * 73856093) ^ (c * 19349663)) >>> 0) % varCount;
          cell.variant = vIdx;
          cell.baseTile = isFlat
            ? `${cell.surface}_lv${clamp(lo, 0, MAX_ELEV)}_v${vIdx}`
            : `${cell.surface}_slope_${mask}_lv${clamp(lo, 0, MAX_ELEV - 1)}`;

          if (cell.water === "thermal_spring") {
            if (!isFlat || lo > 2) cell.water = null;
          } else if (cell.water === "frozen_lake") {
            const validIcefall = !isFlat && lo <= 2 && (mask === "1100" || mask === "1001");
            if ((!isFlat || lo > 2) && !validIcefall) cell.water = null;
          } else if (cell.water === "meltwater_brook") {
            const validWaterfall = !isFlat && lo <= 3 && (mask === "1100" || mask === "1001");
            if ((!isFlat || lo > 3) && !validWaterfall) cell.water = null;
          } else if (cell.water === "glacier_crevasse") {
            if (!isFlat || lo > 4) cell.water = null;
          }
        }
      }

      // 2. Validate flora, `2x2` landmarks, buildings, rail, walkways & lifts in `[ra..rb, ca..cb]`
      let brokenLiftIds = null;
      for (let r = ra; r <= rb; r++) {
        for (let c = ca; c <= cb; c++) {
          const cell = this.cells[r][c];

          if (cell.flora) {
            const fDef = FLORA_DEFS[cell.flora];
            if (!fDef || cell.water !== null || (!cell.isFlat && !fDef.allowSlope)) {
              cell.flora = null;
            }
          }

          const s = cell.structure;
          if (!s) continue;

          if (COMPOSITE_2X2_IDS.has(s.baseId)) {
            const pr = s.parentR;
            const pc = s.parentC;
            let valid2x2 = this.inBounds(pr, pc) && this.inBounds(pr + 1, pc + 1);
            const refLv = valid2x2 ? this.cells[pr][pc].minLevel : 0;
            if (valid2x2) {
              for (let dr = 0; dr <= 1; dr++) {
                for (let dc = 0; dc <= 1; dc++) {
                  const sub = this.cells[pr + dr][pc + dc];
                  if (!sub.isFlat || sub.minLevel !== refLv || sub.water !== null) {
                    valid2x2 = false;
                  }
                }
              }
            }
            if (!valid2x2) {
              this._remove2x2StructureGroup(pr, pc, s.baseId);
              if (pr < bR0) bR0 = clamp(pr, 0, n - 1);
              if (pc < bC0) bC0 = clamp(pc, 0, n - 1);
              if (pr + 1 > bR1) bR1 = clamp(pr + 1, 0, n - 1);
              if (pc + 1 > bC1) bC1 = clamp(pc + 1, 0, n - 1);
            } else {
              s.level = refLv;
            }
            continue;
          }

          const def = STRUCTURE_DEFS[s.id];
          if (!def) {
            cell.structure = null;
            continue;
          }

          if (def.surface === "land_or_water_any") {
            s.level = cell.minLevel;
          } else if (def.surface === "land_any") {
            if (cell.water !== null) {
              if (s.liftId) {
                if (!brokenLiftIds) brokenLiftIds = new Set();
                brokenLiftIds.add(s.liftId);
              }
              cell.structure = null;
            } else {
              s.level = cell.minLevel;
            }
          } else if (def.surface === "land_or_water_flat") {
            if (!cell.isFlat) {
              cell.structure = null;
            } else {
              s.level = cell.minLevel;
            }
          } else if (def.surface === "land_or_ice_flat") {
            if (!cell.isFlat || (cell.water !== null && cell.water !== "frozen_lake")) {
              cell.structure = null;
            } else {
              s.level = cell.minLevel;
            }
          } else if (def.surface === "land_slope") {
            if (cell.water !== null || cell.isFlat || cell.slopeMask !== def.slopeMask) {
              if (cell.water === null && !cell.isFlat && s.baseId === "covered_escalator" && SLOPE_TO_ESCALATOR[cell.slopeMask]) {
                const escId = SLOPE_TO_ESCALATOR[cell.slopeMask];
                cell.structure.id = escId;
                cell.structure.level = cell.minLevel;
              } else if (cell.water === null && !cell.isFlat && s.baseId === "snow_stairs" && SLOPE_TO_STAIRS[cell.slopeMask]) {
                const stId = SLOPE_TO_STAIRS[cell.slopeMask];
                cell.structure.id = stId;
                cell.structure.level = cell.minLevel;
              } else if (cell.water === null && cell.isFlat) {
                cell.structure = {
                  id: "town_walkway_ns",
                  baseId: "town_walkway",
                  category: "walkway",
                  level: cell.minLevel,
                  rotation: 0,
                };
              } else {
                cell.structure = null;
              }
            } else {
              s.level = cell.minLevel;
            }
          } else if (def.surface === "water_flat") {
            if (!cell.isFlat || !WATER_SET.has(cell.water)) {
              cell.structure = null;
            } else {
              s.level = cell.minLevel;
            }
          } else {
            // land_flat
            if (!cell.isFlat || cell.water !== null) {
              if (s.category === "walkway" && cell.water === null && !cell.isFlat && SLOPE_TO_STAIRS[cell.slopeMask]) {
                const stId = SLOPE_TO_STAIRS[cell.slopeMask];
                cell.structure = {
                  id: stId,
                  baseId: "snow_stairs",
                  category: "stairs",
                  level: cell.minLevel,
                  rotation: 0,
                };
              } else {
                if (s.liftId) {
                  if (!brokenLiftIds) brokenLiftIds = new Set();
                  brokenLiftIds.add(s.liftId);
                }
                cell.structure = null;
              }
            } else {
              s.level = cell.minLevel;
            }
          }
        }
      }

      let liftsRemoved = false;
      if (brokenLiftIds) {
        brokenLiftIds.forEach((lid) => {
          const lb = this._removeLiftRecord(lid);
          liftsRemoved = true;
          if (lb) {
            if (lb.r0 < bR0) bR0 = lb.r0;
            if (lb.c0 < bC0) bC0 = lb.c0;
            if (lb.r1 > bR1) bR1 = lb.r1;
            if (lb.c1 > bC1) bC1 = lb.c1;
          }
        });
      }

      return { r0: bR0, c0: bC0, r1: bR1, c1: bC1, liftsRemoved };
    }

    _reconcileRegionAfterEdit(r0, c0, r1, c1, opts = {}) {
      const rec = this._reconcileRegionCellsOnly(r0, c0, r1, c1);
      let liftsChanged = Boolean(opts.liftsChanged || rec.liftsRemoved);
      if (!liftsChanged && opts.cornersChanged && this.lifts.length > 0) {
        for (let i = 0; i < this.lifts.length; i++) {
          const L = this.lifts[i];
          const lr0 = Math.min(L.baseR, L.topR);
          const lr1 = Math.max(L.baseR, L.topR);
          const lc0 = Math.min(L.baseC, L.topC);
          const lc1 = Math.max(L.baseC, L.topC);
          if (lr1 >= rec.r0 && lr0 <= rec.r1 && lc1 >= rec.c0 && lc0 <= rec.c1) {
            liftsChanged = true;
            break;
          }
        }
      }
      this._rebuildRegionDerived(rec.r0, rec.c0, rec.r1, rec.c1, {
        cornersChanged: Boolean(opts.cornersChanged),
        liftsChanged,
      });
      return { r0: rec.r0, c0: rec.c0, r1: rec.r1, c1: rec.c1 };
    }

    _reconcileCellsAfterTerrainEdit() {
      const n = this.size;
      this._reconcileRegionCellsOnly(0, 0, n - 1, n - 1);
      this._rebuildAllDerived();
    }

    _updateCellPass1(r, c) {
      const cell = this.cells[r][c];
      cell.biome = cell.surface;
      const zN = this.cornerZ[r][c];
      const zE = this.cornerZ[r][c + 1];
      const zS = this.cornerZ[r + 1][c + 1];
      const zW = this.cornerZ[r + 1][c];
      const lo = Math.min(zN, zE, zS, zW);
      const hi = Math.max(zN, zE, zS, zW);
      const cArr = cell.corners;
      cArr[0] = zN;
      cArr[1] = zE;
      cArr[2] = zS;
      cArr[3] = zW;
      cell.minLevel = lo;
      cell.maxLevel = hi;
      cell.level = lo;
      const isFlat = lo === hi;
      cell.isFlat = isFlat;
      const mask = isFlat ? "0000" : `${zN - lo}${zE - lo}${zS - lo}${zW - lo}`;
      cell.slopeMask = mask;

      const varCount = SURFACE_VARIANTS[cell.surface] || 2;
      const vIdx = (((r * 73856093) ^ (c * 19349663)) >>> 0) % varCount;
      cell.variant = vIdx;
      cell.baseTile = isFlat
        ? `${cell.surface}_lv${clamp(lo, 0, MAX_ELEV)}_v${vIdx}`
        : `${cell.surface}_slope_${mask}_lv${clamp(lo, 0, MAX_ELEV - 1)}`;

      const w = cell.water;
      if (w === "thermal_spring") {
        cell.hydroKey = `thermal_spring_lv${clamp(lo, 0, 2)}`;
      } else if (w === "frozen_lake") {
        if (!isFlat && mask === "1100") cell.hydroKey = "frozen_icefall_sw";
        else if (!isFlat && mask === "1001") cell.hydroKey = "frozen_icefall_se";
        else cell.hydroKey = `frozen_lake_lv${clamp(lo, 0, 2)}`;
      } else if (w === "meltwater_brook") {
        if (!isFlat && mask === "1100") cell.hydroKey = "cascading_waterfall_sw";
        else if (!isFlat && mask === "1001") cell.hydroKey = "cascading_waterfall_se";
        else cell.hydroKey = `meltwater_brook_lv${clamp(lo, 0, 3)}`;
      } else if (w === "glacier_crevasse") {
        cell.hydroKey = `glacier_crevasse_lv${clamp(lo, 0, 4)}`;
      } else {
        cell.hydroKey = null;
      }

      if (cell.structure) {
        cell.structure.level = lo;
        cell.structureId = cell.structure.id;
        cell.baseStructureId = cell.structure.baseId;
      } else {
        cell.structureId = null;
        cell.baseStructureId = null;
      }
    }

    _appendSurfaceFringeLayer(r, c, lo, myRank, fringeSurface, outArr) {
      const targetRank = SURFACE_PRIORITY[fringeSurface] || 0;
      if (targetRank <= myRank) return;
      const n = this.size;

      let hasN = false;
      let hasE = false;
      let hasS = false;
      let hasW = false;

      if (r > 0) {
        const nb = this.cells[r - 1][c];
        if (nb.water === null && nb.minLevel === lo && nb.surface === fringeSurface) {
          hasN = true;
          outArr.push(`${fringeSurface}_fringe_n`);
        }
      }
      if (c + 1 < n) {
        const nb = this.cells[r][c + 1];
        if (nb.water === null && nb.minLevel === lo && nb.surface === fringeSurface) {
          hasE = true;
          outArr.push(`${fringeSurface}_fringe_e`);
        }
      }
      if (r + 1 < n) {
        const nb = this.cells[r + 1][c];
        if (nb.water === null && nb.minLevel === lo && nb.surface === fringeSurface) {
          hasS = true;
          outArr.push(`${fringeSurface}_fringe_s`);
        }
      }
      if (c > 0) {
        const nb = this.cells[r][c - 1];
        if (nb.water === null && nb.minLevel === lo && nb.surface === fringeSurface) {
          hasW = true;
          outArr.push(`${fringeSurface}_fringe_w`);
        }
      }

      if (hasN && hasW) outArr.push(`${fringeSurface}_fringe_in_nw`);
      if (hasN && hasE) outArr.push(`${fringeSurface}_fringe_in_ne`);
      if (hasS && hasE) outArr.push(`${fringeSurface}_fringe_in_se`);
      if (hasS && hasW) outArr.push(`${fringeSurface}_fringe_in_sw`);

      if (!hasN && !hasW && r > 0 && c > 0) {
        const nb = this.cells[r - 1][c - 1];
        if (nb.water === null && nb.isFlat && nb.minLevel === lo && nb.surface === fringeSurface) {
          outArr.push(`${fringeSurface}_fringe_out_nw`);
        }
      }
      if (!hasN && !hasE && r > 0 && c + 1 < n) {
        const nb = this.cells[r - 1][c + 1];
        if (nb.water === null && nb.isFlat && nb.minLevel === lo && nb.surface === fringeSurface) {
          outArr.push(`${fringeSurface}_fringe_out_ne`);
        }
      }
      if (!hasS && !hasE && r + 1 < n && c + 1 < n) {
        const nb = this.cells[r + 1][c + 1];
        if (nb.water === null && nb.isFlat && nb.minLevel === lo && nb.surface === fringeSurface) {
          outArr.push(`${fringeSurface}_fringe_out_se`);
        }
      }
      if (!hasS && !hasW && r + 1 < n && c > 0) {
        const nb = this.cells[r + 1][c - 1];
        if (nb.water === null && nb.isFlat && nb.minLevel === lo && nb.surface === fringeSurface) {
          outArr.push(`${fringeSurface}_fringe_out_sw`);
        }
      }
    }

    _updateCellFringesAndBanks(r, c) {
      const n = this.size;
      const cell = this.cells[r][c];
      const fringes = cell.surfaceFringes;
      fringes.length = 0;
      cell.biomeDecals = fringes;
      cell.waterDecals = null;

      if (cell.isFlat && cell.water === null) {
        const myRank = SURFACE_PRIORITY[cell.surface] || 1;
        const lo = cell.minLevel;
        this._appendSurfaceFringeLayer(r, c, lo, myRank, "red_brick", fringes);
        this._appendSurfaceFringeLayer(r, c, lo, myRank, "festive_mosaic_cobble", fringes);
        this._appendSurfaceFringeLayer(r, c, lo, myRank, "crystal_ice_promenade", fringes);
        this._appendSurfaceFringeLayer(r, c, lo, myRank, "groomed_piste", fringes);
        this._appendSurfaceFringeLayer(r, c, lo, myRank, "untouched_powder", fringes);
        return;
      }

      if (
        cell.isFlat &&
        (cell.water === "frozen_lake" || cell.water === "thermal_spring" || cell.water === "meltwater_brook")
      ) {
        const prefix =
          cell.water === "thermal_spring"
            ? "spring_bank"
            : cell.water === "meltwater_brook"
            ? "brook_bank"
            : "ice_bank";
        const lo = cell.minLevel;
        const banks = [];

        let hasN = false;
        let hasE = false;
        let hasS = false;
        let hasW = false;

        if (r > 0 && this.cells[r - 1][c].water === null) {
          hasN = true;
          banks.push(`${prefix}_n`);
        }
        if (c + 1 < n && this.cells[r][c + 1].water === null) {
          hasE = true;
          banks.push(`${prefix}_e`);
        }
        if (r + 1 < n && this.cells[r + 1][c].water === null) {
          hasS = true;
          banks.push(`${prefix}_s`);
        }
        if (c > 0 && this.cells[r][c - 1].water === null) {
          hasW = true;
          banks.push(`${prefix}_w`);
        }

        if (hasN && hasW) banks.push(`${prefix}_in_nw`);
        if (hasN && hasE) banks.push(`${prefix}_in_ne`);
        if (hasS && hasE) banks.push(`${prefix}_in_se`);
        if (hasS && hasW) banks.push(`${prefix}_in_sw`);

        if (!hasN && !hasW && r > 0 && c > 0) {
          const nb = this.cells[r - 1][c - 1];
          if (nb.water === null && nb.isFlat && nb.minLevel === lo) banks.push(`${prefix}_out_nw`);
        }
        if (!hasN && !hasE && r > 0 && c + 1 < n) {
          const nb = this.cells[r - 1][c + 1];
          if (nb.water === null && nb.isFlat && nb.minLevel === lo) banks.push(`${prefix}_out_ne`);
        }
        if (!hasS && !hasE && r + 1 < n && c + 1 < n) {
          const nb = this.cells[r + 1][c + 1];
          if (nb.water === null && nb.isFlat && nb.minLevel === lo) banks.push(`${prefix}_out_se`);
        }
        if (!hasS && !hasW && r + 1 < n && c > 0) {
          const nb = this.cells[r + 1][c - 1];
          if (nb.water === null && nb.isFlat && nb.minLevel === lo) banks.push(`${prefix}_out_sw`);
        }

        if (banks.length > 0) {
          cell.waterDecals = banks;
        }
      }
    }

    _rebuildRegionDerived(r0, c0, r1, c1, opts = {}) {
      const n = this.size;
      const pr0 = clamp(Math.min(r0, r1) - 1, 0, n - 1);
      const pc0 = clamp(Math.min(c0, c1) - 1, 0, n - 1);
      const pr1 = clamp(Math.max(r0, r1) + 1, 0, n - 1);
      const pc1 = clamp(Math.max(c0, c1) + 1, 0, n - 1);

      // Pass 1: Corner geometry, baseTile, hydroKey & structureId on `[pr0..pr1, pc0..pc1]`
      for (let r = pr0; r <= pr1; r++) {
        for (let c = pc0; c <= pc1; c++) {
          this._updateCellPass1(r, c);
        }
      }

      // Pass 2: Refresh 11-way `town_walkway_*` junctions in `[pr0..pr1, pc0..pc1]`
      this._refreshWalkwaysInRegion(pr0, pc0, pr1, pc1);

      // Pass 3: Scalloped surface fringes & water banks in `[pr0..pr1, pc0..pc1]`
      for (let r = pr0; r <= pr1; r++) {
        for (let c = pc0; c <= pc1; c++) {
          this._updateCellFringesAndBanks(r, c);
        }
      }

      // Pass 4: Only rebuild 3D lift cable/pylon geometry when a lift or intersecting terrain corner changed!
      if (opts.liftsChanged) {
        this._rebuildLiftGeometry();
      }

      // Pass 5: Defer ski-run pathfinding during active strokes / lazy until queried!
      this._skiRunsDirty = true;
      if (!this._buildingPreset && this._batchDepth === 0 && opts.immediateSkiRuns) {
        this._analyzeSkiRuns();
      }
    }

    _rebuildAllDerived() {
      const n = this.size;

      // Pass 1: Corner geometry & base hydroKey across all 4 water/creek/crevasse types
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          this._updateCellPass1(r, c);
        }
      }

      // Pass 2: Refresh 11-way town_walkway_* junctions
      this._refreshAllWalkways();

      // Pass 3: Precompute 12-code scalloped surface fringes & 12-code water bank decals
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          this._updateCellFringesAndBanks(r, c);
        }
      }

      // Pass 4: Rebuild exact 3D LiftLine tower & cable strand coordinates
      this._rebuildLiftGeometry();

      // Pass 5: Auto-analyze Ski Runs (Green / Blue / Black) & piste quality
      if (this._buildingPreset || this._batchDepth > 0) {
        this._skiRunsDirty = true;
      } else {
        this._analyzeSkiRuns();
      }
    }

    _cellConnectsWalkwayTowards(r, c, edgeDir, expectedLevel) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (
        cell.water === null &&
        cell.isFlat &&
        VILLAGE_WALK_SURFACES.has(cell.surface) &&
        cell.minLevel === expectedLevel &&
        !cell.structure
      ) {
        return true;
      }
      const s = cell.structure;
      if (!s) return false;
      if (s.category === "walkway") {
        return cell.minLevel === expectedLevel;
      }
      if (s.category === "stairs") {
        const spec = STAIRS_SPECS[s.id];
        if (!spec) return false;
        if (edgeDir === spec.lowEdge && cell.minLevel === expectedLevel) return true;
        if (edgeDir === spec.highEdge && cell.minLevel + 1 === expectedLevel) return true;
        return false;
      }
      const def = STRUCTURE_DEFS[s.id];
      if (!def || !def.edges || def.edges.length === 0) return false;
      return cell.minLevel === expectedLevel && def.edges.includes(edgeDir);
    }

    computeWalkwayIdForCell(r, c, rotation = 0) {
      if (!this.inBounds(r, c)) return "town_walkway_ns";
      const cell = this.cells[r][c];
      const lv = cell.minLevel;
      const connected = [];
      const rot = normalizeRotation(rotation);

      for (let i = 0; i < EDGE_NEIGHBORS.length; i++) {
        const e = EDGE_NEIGHBORS[i];
        if (this._cellConnectsWalkwayTowards(r + e.dr, c + e.dc, e.opp, lv)) {
          connected.push(e.edge);
        }
      }

      if (connected.length === 0) {
        return rot % 2 === 1 ? "town_walkway_ew" : "town_walkway_ns";
      }
      if (connected.length === 1) {
        const only = connected[0];
        return only === "E" || only === "W" ? "town_walkway_ew" : "town_walkway_ns";
      }
      const sortedKey = connected.slice().sort().join("");
      return WALKWAY_EDGE_MAP[sortedKey] || "town_walkway_cross";
    }

    _refreshWalkwaysInRegion(r0, c0, r1, c1) {
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const cell = this.cells[r][c];
          if (cell.structure && cell.structure.category === "walkway") {
            const rot = cell.structure.rotation || 0;
            const wkId = this.computeWalkwayIdForCell(r, c, rot);
            cell.structure.id = wkId;
            cell.structureId = wkId;
          }
        }
      }
    }

    _refreshAllWalkways() {
      const n = this.size;
      this._refreshWalkwaysInRegion(0, 0, n - 1, n - 1);
    }

    // =========================================================================
    // All 10 Uphill Lift Systems: 3D Cable/Track Geometry, Preview & Builder
    // =========================================================================

    _liftStationSpriteKey(spec, role, axis) {
      if (role === "base") {
        return spec.noAxisSuffix ? spec.basePrefix : `${spec.basePrefix}_${axis}`;
      }
      if (role === "top") {
        return spec.noAxisSuffix ? spec.topPrefix : `${spec.topPrefix}_${axis}`;
      }
      if (role === "mid" && spec.midPrefix) {
        return `${spec.midPrefix}_${axis}`;
      }
      if (role === "pylon" && spec.pylonPrefix) {
        return `${spec.pylonPrefix}_${axis}`;
      }
      return null;
    }

    _computeLiftObject(raw) {
      const spec = LIFT_SPECS[raw.type] || LIFT_SPECS.chairlift;
      const axis = raw.axis || (raw.baseC === raw.topC ? "ns" : "ew");
      const dr = Math.sign(raw.topR - raw.baseR);
      const dc = Math.sign(raw.topC - raw.baseC);
      const steps = Math.max(Math.abs(raw.topR - raw.baseR), Math.abs(raw.topC - raw.baseC));

      // Isometric entity heading (`sw, se, ne, nw`)
      let upDir = "ne";
      let downDir = "sw";
      if (axis === "ns") {
        upDir = dr < 0 ? "ne" : "sw";
        downDir = dr < 0 ? "sw" : "ne";
      } else {
        upDir = dc > 0 ? "se" : "nw";
        downDir = dc > 0 ? "nw" : "se";
      }

      // Pure horizontal cross-arm sheave offset (`cx ± hs, y_cab`) locked to #68
      const hs = spec.halfSepPx;
      const upOffX = hs;
      const upOffY = 0;
      const downOffX = -hs;
      const downOffY = 0;

      const cells = [];
      const towers = [];
      const pylons = [];

      for (let i = 0; i <= steps; i++) {
        const r = raw.baseR + dr * i;
        const c = raw.baseC + dc * i;
        if (!this.inBounds(r, c)) continue;
        const cell = this.cells[r][c];
        const lv = cell.minLevel;
        const terrainCenterZ = this.getTerrainZ(r, c, 4, 4);
        const groundZ = spec.midEveryCell ? terrainCenterZ : lv * ELEV_STEP_Z;
        const worldZ = groundZ + spec.zCable;

        const centerWx = (c - r) * 64;
        const centerWy =
          (r + c) * 32 +
          32 -
          Math.round((spec.midEveryCell ? terrainCenterZ * 4 : lv * ELEV_STEP_PX)) -
          spec.cableLiftPx;

        const isBase = i === 0;
        const isTop = i === steps;
        const isPylon =
          !isBase &&
          !isTop &&
          spec.pylonInterval > 0 &&
          i % spec.pylonInterval === 0 &&
          steps - i >= 2;
        const isMidNode = !isBase && !isTop && spec.midEveryCell;

        cells.push({ r, c, stepIndex: i });

        if (isBase || isTop || isPylon || isMidNode) {
          const role = isBase ? "base" : isTop ? "top" : isPylon ? "pylon" : "track";
          const tower = {
            r,
            c,
            row: r,
            col: c,
            role,
            t: steps > 0 ? i / steps : 0,
            level: lv,
            groundZ,
            cableZ: spec.zCable,
            worldZ,
            wx: centerWx,
            wy: centerWy,
            upWx: centerWx + upOffX,
            upWy: centerWy + upOffY,
            downWx: centerWx + downOffX,
            downWy: centerWy + downOffY,
          };
          towers.push(tower);
          if (isPylon) {
            pylons.push({ r, c, row: r, col: c });
          }
        }
      }

      const upStrand = towers.map((tw) => ({
        r: tw.r,
        c: tw.c,
        t: tw.t,
        wx: tw.upWx,
        wy: tw.upWy,
        worldZ: tw.worldZ,
      }));
      const downStrand = towers
        .slice()
        .reverse()
        .map((tw, idx, arr) => ({
          r: tw.r,
          c: tw.c,
          t: arr.length > 1 ? 1 - tw.t : 0,
          wx: tw.downWx,
          wy: tw.downWy,
          worldZ: tw.worldZ,
        }));

      const baseLv = this.inBounds(raw.baseR, raw.baseC) ? this.cells[raw.baseR][raw.baseC].minLevel : 0;
      const topLv = this.inBounds(raw.topR, raw.topC) ? this.cells[raw.topR][raw.topC].minLevel : 0;

      return {
        id: raw.id,
        type: spec.type,
        liftType: spec.type,
        name: spec.name,
        axis,
        orientation: axis,
        baseR: raw.baseR,
        baseC: raw.baseC,
        topR: raw.topR,
        topC: raw.topC,
        r1: raw.baseR,
        c1: raw.baseC,
        r2: raw.topR,
        c2: raw.topC,
        baseLevel: baseLv,
        topLevel: topLv,
        verticalRise: Math.max(0, topLv - baseLv),
        lengthCells: steps,
        upDir,
        downDir,
        zCable: spec.zCable,
        cableZ: spec.zCable,
        cableLiftPx: spec.cableLiftPx,
        halfSepPx: spec.halfSepPx,
        strandSepPx: spec.halfSepPx,
        lateralOffsetPx: spec.halfSepPx,
        carrierSprite: spec.carrierSprite,
        emptyCarrierSprite: spec.emptyCarrierSprite,
        isSurface: Boolean(spec.isSurface),
        hasOverheadCable: Boolean(spec.hasOverheadCable),
        upOffset: { x: upOffX, y: upOffY },
        downOffset: { x: downOffX, y: downOffY },
        towers,
        pylons,
        cells,
        upStrand,
        downStrand,
      };
    }

    _rebuildLiftGeometry() {
      const rebuilt = [];
      for (let i = 0; i < this.lifts.length; i++) {
        const raw = this.lifts[i];
        if (!this.inBounds(raw.baseR, raw.baseC) || !this.inBounds(raw.topR, raw.topC)) continue;
        const baseCell = this.cells[raw.baseR][raw.baseC];
        const topCell = this.cells[raw.topR][raw.topC];
        if (!baseCell.structure || baseCell.structure.liftId !== raw.id) continue;
        if (!topCell.structure || topCell.structure.liftId !== raw.id) continue;
        rebuilt.push(this._computeLiftObject(raw));
      }
      this.lifts = rebuilt;
    }

    sampleLiftStrand(liftOrId, progressT, direction = "up") {
      const lift = typeof liftOrId === "string"
        ? this.lifts.find((L) => L.id === liftOrId)
        : liftOrId;
      if (!lift || !lift.towers || lift.towers.length < 2) return null;

      const isUp = direction !== "down" && direction !== "return";
      const s = clamp(Number(progressT) || 0, 0, 1);
      const baseToTopFrac = isUp ? s : 1.0 - s;

      const tws = lift.towers;
      let segIdx = 0;
      for (let i = 0; i < tws.length - 1; i++) {
        if (baseToTopFrac >= tws[i].t && baseToTopFrac <= tws[i + 1].t) {
          segIdx = i;
          break;
        }
      }
      const A = tws[segIdx];
      const B = tws[Math.min(tws.length - 1, segIdx + 1)];
      const denom = Math.max(1e-6, B.t - A.t);
      const local = clamp((baseToTopFrac - A.t) / denom, 0, 1);

      const exactR = A.r + (B.r - A.r) * local;
      const exactC = A.c + (B.c - A.c) * local;
      const cellR = clamp(Math.round(exactR), 0, this.size - 1);
      const cellC = clamp(Math.round(exactC), 0, this.size - 1);
      const u = clamp(4.0 + (exactR - cellR) * 8.0, 0, 8);
      const v = clamp(4.0 + (exactC - cellC) * 8.0, 0, 8);

      const sagAmp = lift.hasOverheadCable === false ? 0.0 : lift.type === "rope_tow" ? 0.6 : 1.5;
      const sagPx = Math.sin(local * Math.PI) * sagAmp;
      const cableScreenX = isUp
        ? A.upWx + (B.upWx - A.upWx) * local
        : A.downWx + (B.downWx - A.downWx) * local;
      const cableScreenY =
        (isUp
          ? A.upWy + (B.upWy - A.upWy) * local
          : A.downWy + (B.downWy - A.downWy) * local) + sagPx;
      const worldZ = A.worldZ + (B.worldZ - A.worldZ) * local;

      return {
        liftId: lift.id,
        r: cellR,
        c: cellC,
        u,
        v,
        exactR,
        exactC,
        worldZ,
        cableScreenX,
        cableScreenY,
        dir: isUp ? lift.upDir : lift.downDir,
        strand: isUp ? "up" : "down",
        baseToTopFrac,
      };
    }

    previewLiftLine(r1, c1, r2, c2, liftType = "chairlift") {
      const normType = LIFT_SPECS[liftType] ? liftType : "chairlift";
      const spec = LIFT_SPECS[normType];
      if (!this.inBounds(r1, c1)) {
        return { valid: false, reason: "Out of bounds", type: normType, cost: 0, cells: [], towers: [] };
      }
      const tr2 = clamp(Math.round(r2), 0, this.size - 1);
      const tc2 = clamp(Math.round(c2), 0, this.size - 1);

      const dRow = tr2 - r1;
      const dCol = tc2 - c1;
      const axis = Math.abs(dRow) >= Math.abs(dCol) ? "ns" : "ew";
      const snapR2 = axis === "ns" ? tr2 : r1;
      const snapC2 = axis === "ew" ? tc2 : c1;
      const len = Math.max(Math.abs(snapR2 - r1), Math.abs(snapC2 - c1));

      // Auto-orient lower elevation cell as Base and higher elevation cell as Top!
      const z1 = this.getTerrainZ(r1, c1, 4, 4);
      const z2 = this.getTerrainZ(snapR2, snapC2, 4, 4);
      let baseR = r1, baseC = c1, topR = snapR2, topC = snapC2;
      if (z1 > z2) {
        baseR = snapR2;
        baseC = snapC2;
        topR = r1;
        topC = c1;
      }

      const cost = spec.baseCost + Math.max(len, spec.minLen) * spec.perCellCost;
      let valid = len >= spec.minLen && len <= spec.maxLen;
      let reason = valid ? "Ready to build" : `Span must be ${spec.minLen}–${spec.maxLen} tiles`;

      const dr = Math.sign(topR - baseR);
      const dc = Math.sign(topC - baseC);
      const ghostSprites = [];

      if (len === 0) {
        valid = false;
        reason = "Drag along mountain to place Summit Station";
        const baseSprite = this._liftStationSpriteKey(spec, "base", axis);
        ghostSprites.push({ r: r1, c: c1, spriteKey: baseSprite, level: this.cells[r1][c1].minLevel, role: "base" });
      } else {
        for (let i = 0; i <= len; i++) {
          const r = baseR + dr * i;
          const c = baseC + dc * i;
          const cell = this.cells[r][c];
          const isBase = i === 0;
          const isTop = i === len;
          const isEndpoint = isBase || isTop;
          const isPylon =
            !isEndpoint &&
            spec.pylonInterval > 0 &&
            i % spec.pylonInterval === 0 &&
            len - i >= 2;
          const isMidTrack = !isEndpoint && spec.midEveryCell;
          const touchesGround = isEndpoint || isPylon || isMidTrack || spec.isSurface;

          if (touchesGround && cell.water !== null) {
            valid = false;
            reason = "Cannot place lift foundation on water/ice";
          }
          if ((isEndpoint || isPylon || isMidTrack) && cell.structure && cell.structure.category !== "walkway") {
            valid = false;
            reason = "Blocked by existing structure";
          }
          if (cell.liftId || (cell.structure && cell.structure.liftId)) {
            valid = false;
            reason = "Overlaps existing lift line";
          }

          if (isBase) {
            ghostSprites.push({
              r,
              c,
              spriteKey: this._liftStationSpriteKey(spec, "base", axis),
              level: cell.minLevel,
              role: "base",
            });
          } else if (isTop) {
            ghostSprites.push({
              r,
              c,
              spriteKey: this._liftStationSpriteKey(spec, "top", axis),
              level: cell.minLevel,
              role: "top",
            });
          } else if (isMidTrack) {
            ghostSprites.push({
              r,
              c,
              spriteKey: this._liftStationSpriteKey(spec, "mid", axis),
              level: cell.minLevel,
              role: "mid",
            });
          } else if (isPylon) {
            ghostSprites.push({
              r,
              c,
              spriteKey: this._liftStationSpriteKey(spec, "pylon", axis),
              level: cell.minLevel,
              role: "pylon",
            });
          }
        }
      }

      const geom = len >= 1
        ? this._computeLiftObject({ id: "preview_lift", type: normType, axis, baseR, baseC, topR, topC })
        : null;

      return {
        isLiftPreview: true,
        valid,
        reason,
        type: normType,
        liftType: normType,
        axis,
        baseR,
        baseC,
        topR,
        topC,
        r1: baseR,
        c1: baseC,
        r2: topR,
        c2: topC,
        lengthCells: len,
        cableZ: spec.zCable,
        strandSepPx: spec.halfSepPx,
        isSurface: Boolean(spec.isSurface),
        hasOverheadCable: Boolean(spec.hasOverheadCable),
        cost,
        ghostSprites,
        cells: geom ? geom.cells : [{ r: r1, c: c1 }],
        towers: geom ? geom.towers : [],
        upStrand: geom ? geom.upStrand : [],
        downStrand: geom ? geom.downStrand : [],
      };
    }

    buildLiftLine(r1, c1, r2, c2, liftType = "chairlift") {
      const preview = this.previewLiftLine(r1, c1, r2, c2, liftType);
      if (!preview.valid) return null;

      this._recordUndoBeforeChange();
      const { type, axis, baseR, baseC, topR, topC, lengthCells } = preview;
      const spec = LIFT_SPECS[type];

      // Auto-flatten station endpoints for flat-station lifts (`!isSurface` or `cliff_funicular`)
      const baseKeyCheck = this._liftStationSpriteKey(spec, "base", axis);
      const needsFlatPad = STRUCTURE_DEFS[baseKeyCheck] && STRUCTURE_DEFS[baseKeyCheck].surface === "land_flat";
      let prop = null;
      if (needsFlatPad) {
        const bCell = this.cells[baseR][baseC];
        const tCell = this.cells[topR][topC];
        const pinned = [];
        if (!bCell.isFlat) {
          const bLv = bCell.minLevel;
          pinned.push([baseR, baseC, bLv], [baseR, baseC + 1, bLv], [baseR + 1, baseC + 1, bLv], [baseR + 1, baseC, bLv]);
        }
        if (!tCell.isFlat) {
          const tLv = tCell.maxLevel;
          pinned.push([topR, topC, tLv], [topR, topC + 1, tLv], [topR + 1, topC + 1, tLv], [topR + 1, topC, tLv]);
        }
        if (pinned.length > 0) {
          prop = this._propagateCornerConstraints(pinned);
        }
      }

      const liftId = `lift_${this._nextLiftSeq++}`;
      const dr = Math.sign(topR - baseR);
      const dc = Math.sign(topC - baseC);

      for (let i = 0; i <= lengthCells; i++) {
        const r = baseR + dr * i;
        const c = baseC + dc * i;
        const cell = this.cells[r][c];

        const isBase = i === 0;
        const isTop = i === lengthCells;
        const isPylon =
          !isBase &&
          !isTop &&
          spec.pylonInterval > 0 &&
          i % spec.pylonInterval === 0 &&
          lengthCells - i >= 2;
        const isMidTrack = !isBase && !isTop && spec.midEveryCell;

        let sId = null;
        if (isBase) {
          sId = this._liftStationSpriteKey(spec, "base", axis);
        } else if (isTop) {
          sId = this._liftStationSpriteKey(spec, "top", axis);
        } else if (isMidTrack) {
          sId = this._liftStationSpriteKey(spec, "mid", axis);
        } else if (isPylon) {
          sId = this._liftStationSpriteKey(spec, "pylon", axis);
        }

        // Clear tall trees directly under cable/track corridor; preserve creeks/tracks under aerial spans
        if (cell.water === null) {
          cell.flora = null;
        }
        if (sId || (!cell.structure && cell.water === null)) {
          cell.liftId = liftId;
        }

        if (sId && STRUCTURE_DEFS[sId]) {
          const def = STRUCTURE_DEFS[sId];
          cell.structure = {
            id: sId,
            baseId: def.baseId,
            category: def.category,
            level: cell.minLevel,
            rotation: axis === "ew" ? 1 : 0,
            liftId,
          };
        }
      }

      this.lifts.push({ id: liftId, type, axis, baseR, baseC, topR, topC });

      let bR0 = Math.min(baseR, topR);
      let bC0 = Math.min(baseC, topC);
      let bR1 = Math.max(baseR, topR);
      let bC1 = Math.max(baseC, topC);
      const cornersChanged = Boolean(prop && prop.changed);
      if (cornersChanged) {
        if (prop.cellR0 < bR0) bR0 = prop.cellR0;
        if (prop.cellC0 < bC0) bC0 = prop.cellC0;
        if (prop.cellR1 > bR1) bR1 = prop.cellR1;
        if (prop.cellC1 > bC1) bC1 = prop.cellC1;
      }
      const bounds = this._reconcileRegionAfterEdit(bR0, bC0, bR1, bC1, {
        cornersChanged,
        liftsChanged: true,
      });
      this._notifyChange("lift", bounds);
      return this.lifts.find((L) => L.id === liftId) || null;
    }

    getLifts() {
      return this.lifts;
    }

    removeLift(liftId) {
      if (!liftId || !this.lifts.some((L) => L.id === liftId)) return false;
      this._recordUndoBeforeChange();
      const lb = this._removeLiftRecord(liftId);
      if (lb) {
        this._rebuildRegionDerived(lb.r0, lb.c0, lb.r1, lb.c1, {
          cornersChanged: false,
          liftsChanged: true,
        });
        this._notifyChange("bulldoze", lb);
      } else {
        this._rebuildAllDerived();
        this._notifyChange("bulldoze", { full: true });
      }
      return true;
    }

    // =========================================================================
    // Auto-Analyzed Ski Runs (`getSkiRuns`) & Persistent Fading Ski Tracks
    // =========================================================================

    _analyzeSkiRuns() {
      this._skiRunsDirty = false;
      const n = this.size;
      const runs = [];
      const counts = { green: 0, blue: 0, black: 0 };

      const seeds = [];
      for (let i = 0; i < this.lifts.length; i++) {
        const L = this.lifts[i];
        seeds.push({ r: L.topR, c: L.topC, liftId: L.id, forcedRating: null });
      }
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const fl = this.cells[r][c].flora;
          if (fl && FLORA_DEFS[fl] && FLORA_DEFS[fl].runRating) {
            seeds.push({ r, c, liftId: null, forcedRating: FLORA_DEFS[fl].runRating });
          }
        }
      }

      const usedPathSignature = new Set();

      for (let sIdx = 0; sIdx < seeds.length; sIdx++) {
        const seed = seeds[sIdx];
        let curR = seed.r;
        let curC = seed.c;
        const path = [];
        const visited = new Set();
        let maxLv = 0;
        let minLv = MAX_ELEV;
        let mogulCells = 0;
        let pisteCells = 0;
        let qualSum = 0;
        let gateRating = seed.forcedRating;

        for (let step = 0; step < n * 2; step++) {
          const key = curR * n + curC;
          if (visited.has(key)) break;
          visited.add(key);

          const cell = this.cells[curR][curC];
          path.push({ r: curR, c: curC });
          if (cell.maxLevel > maxLv) maxLv = cell.maxLevel;
          if (cell.minLevel < minLv) minLv = cell.minLevel;
          if (cell.surface === "mogul_chute") mogulCells++;
          if (GROOMABLE_SURFACES.has(cell.surface)) pisteCells++;
          qualSum += cell.pisteQuality !== undefined ? cell.pisteQuality : 100;

          if (!gateRating && cell.flora && FLORA_DEFS[cell.flora] && FLORA_DEFS[cell.flora].runRating) {
            gateRating = FLORA_DEFS[cell.flora].runRating;
          }

          const curZ = this.getTerrainZ(curR, curC, 4, 4);
          let bestNr = -1;
          let bestNc = -1;
          let bestScore = -1e9;

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = curR + dr;
              const nc = curC + dc;
              if (!this.inBounds(nr, nc) || visited.has(nr * n + nc)) continue;
              if (!this.isSkiable(nr, nc)) continue;

              const nb = this.cells[nr][nc];
              const nbZ = this.getTerrainZ(nr, nc, 4, 4);
              const drop = curZ - nbZ;
              if (drop < -0.25) continue;
              if (drop === 0 && !GROOMABLE_SURFACES.has(nb.surface)) continue;

              let score = drop * 12.0;
              if (nb.surface === "groomed_piste") score += 16.0;
              else if (nb.surface === "mogul_chute" || nb.surface === "tubing_chute") score += 14.0;
              else if (nb.surface === "wind_hardpack" || nb.surface === "glacier_ice" || nb.surface === "spring_slush") score += 11.0;
              if (dr !== 0 && dc !== 0) score -= 2.0;
              if (nb.flora && FLORA_DEFS[nb.flora] && FLORA_DEFS[nb.flora].tall) score -= 20.0;

              if (score > bestScore) {
                bestScore = score;
                bestNr = nr;
                bestNc = nc;
              }
            }
          }

          if (bestNr < 0 || bestScore <= 0.1) break;
          curR = bestNr;
          curC = bestNc;
        }

        if (path.length < 4 || (maxLv <= minLv && pisteCells < 3)) continue;
        const endCell = path[path.length - 1];
        const sig = `${path[0].r},${path[0].c}->${endCell.r},${endCell.c}`;
        if (usedPathSignature.has(sig)) continue;
        usedPathSignature.add(sig);

        let rating = gateRating;
        if (!rating) {
          if (mogulCells >= 2 || maxLv >= 4 || maxLv - minLv >= 3) {
            rating = "black";
          } else if (maxLv >= 2 || maxLv - minLv >= 2) {
            rating = "blue";
          } else {
            rating = "green";
          }
        }
        counts[rating] = (counts[rating] || 0) + 1;
        const avgQual = Math.round(qualSum / path.length);

        runs.push({
          id: `run_${runs.length + 1}`,
          rating,
          difficulty: rating,
          liftId: seed.liftId,
          startR: path[0].r,
          startC: path[0].c,
          endR: endCell.r,
          endC: endCell.c,
          topLevel: maxLv,
          baseLevel: minLv,
          lengthCells: path.length,
          quality: avgQual,
          cells: path,
        });
      }

      this._skiRuns = runs;
      this._runCounts = counts;
    }

    getSkiRuns() {
      return this.skiRuns;
    }

    getRunCounts() {
      return Object.assign({}, this.runCounts);
    }

    wearPiste(r, c, amount = 1.6) {
      if (!this.inBounds(r, c)) return 100;
      const cell = this.cells[r][c];
      if (!GROOMABLE_SURFACES.has(cell.surface)) return cell.pisteQuality;
      let factor = 1.0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (this.inBounds(r + dr, c + dc)) {
            const fl = this.cells[r + dr][c + dc].flora;
            if (fl && FLORA_DEFS[fl] && FLORA_DEFS[fl].boostsSnow) {
              factor = 0.42;
              break;
            }
          }
        }
      }
      cell.pisteQuality = clamp(cell.pisteQuality - amount * factor, 28, 100);
      return cell.pisteQuality;
    }

    groomPiste(r, c) {
      if (!this.inBounds(r, c)) return 100;
      const cell = this.cells[r][c];
      cell.pisteQuality = 100;
      return 100;
    }

    getPisteQuality(r, c) {
      return this.inBounds(r, c) ? this.cells[r][c].pisteQuality : 100;
    }

    getAveragePisteQuality() {
      const n = this.size;
      let sum = 0;
      let count = 0;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cell = this.cells[r][c];
          if (GROOMABLE_SURFACES.has(cell.surface)) {
            sum += cell.pisteQuality;
            count++;
          }
        }
      }
      return count > 0 ? Math.round(sum / count) : 100;
    }

    addSkiTrack(r, c, u = 4.0, v = 4.0, heading = 0, kind = "ski") {
      if (!this.inBounds(r, c)) return null;
      const cell = this.cells[r][c];
      if (cell.water !== null || !MOUNTAIN_SNOW_SURFACES.has(cell.surface)) return null;
      const z = this.getTerrainZ(r, c, u, v);
      const wx = (c - r) * 64 + (v - u) * 8;
      const wy = (r + c) * 32 + (u + v) * 4 - z * 4;

      let angleRad = 0.8;
      if (typeof heading === "number" && Number.isFinite(heading)) {
        angleRad = heading;
      } else if (typeof heading === "string") {
        const h = heading.toLowerCase();
        if (h === "sw") angleRad = 2.68;
        else if (h === "se") angleRad = 0.46;
        else if (h === "ne") angleRad = -0.46;
        else if (h === "nw") angleRad = -2.68;
      }

      const kindStr = String(kind || "ski");
      const maxAge = kind === "groomer" ? 26.0 : 18.0;
      const tracks = this.skiTracks;

      if (tracks.length < this.maxSkiTracks) {
        const tr = this._skiTrackPool.length > 0 ? this._skiTrackPool.pop() : {};
        tr.r = r;
        tr.c = c;
        tr.u = u;
        tr.v = v;
        tr.z = z;
        tr.wx = wx;
        tr.wy = wy;
        tr.angle = angleRad;
        tr.kind = kindStr;
        tr.age = 0;
        tr.maxAge = maxAge;
        tracks.push(tr);
        return tr;
      }

      // At capacity (`maxSkiTracks`): overwrite oldest ring slot in place (zero `splice` shift!)
      const idx = this._skiTrackHead % this.maxSkiTracks;
      this._skiTrackHead = (idx + 1) % this.maxSkiTracks;
      const tr = tracks[idx];
      tr.r = r;
      tr.c = c;
      tr.u = u;
      tr.v = v;
      tr.z = z;
      tr.wx = wx;
      tr.wy = wy;
      tr.angle = angleRad;
      tr.kind = kindStr;
      tr.age = 0;
      tr.maxAge = maxAge;
      return tr;
    }

    getSkiTracks() {
      return this.skiTracks;
    }

    updateSkiTracks(dt) {
      if (dt && dt > 0) {
        this.updateClouds(dt);
      }
      const tracks = this.skiTracks;
      if (!dt || dt <= 0 || tracks.length === 0) return;

      // Single O(K) forward write-index compaction pass (zero `Array.splice` shifts!)
      const pool = this._skiTrackPool;
      const maxPool = this.maxSkiTracks;
      let write = 0;
      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        const nextAge = tr.age + dt;
        if (nextAge < tr.maxAge) {
          tr.age = nextAge;
          tracks[write++] = tr;
        } else if (pool.length < maxPool) {
          pool.push(tr);
        }
      }
      tracks.length = write;
      if (write < maxPool) {
        this._skiTrackHead = 0;
      }
    }

    // =========================================================================
    // Interactive Editing Tools: Multi-Tile Sculpt Brushes, Surfaces, Water,
    // 10 Lift Systems, 3 `2x2` Landmarks, Swiss Rail & 150+ Placeables
    // =========================================================================

    sculptBrush(r, c, mode = "raise_3x3", radius = 1, targetLv = null) {
      if (!this.inBounds(r, c)) return false;
      const rawMode = String(mode || "raise").toLowerCase().replace(/^sculpt_/, "");

      // 1x1 delegation
      if (rawMode === "raise" || rawMode === "lower" || rawMode === "level") {
        if (!radius || radius <= 0) {
          return this.sculptCell(r, c, rawMode, targetLv);
        }
      }

      // `matterhorn_peak` (`sculpt_matterhorn_peak`): `3x3` pyramidal horn stamp!
      // Raises center `+2` clamped `<= 4`, surrounding `3x3` ring `+1`, paints steep flanks `alpine_scree` & summit `untouched_powder`.
      if (rawMode === "matterhorn_peak" || rawMode === "horn_peak") {
        const n = this.size;
        const r0 = clamp(r - 1, 0, n - 1);
        const r1 = clamp(r + 1, 0, n - 1);
        const c0 = clamp(c - 1, 0, n - 1);
        const c1 = clamp(c + 1, 0, n - 1);

        const centerLo = this.cells[r][c].minLevel;
        const peakLv = clamp(centerLo + 2, 1, MAX_ELEV);
        const ringLv = clamp(Math.max(centerLo + 1, peakLv - 1), 0, MAX_ELEV);

        const pinned = [];
        let cornerDiff = false;
        for (let cr = r0; cr <= r1 + 1; cr++) {
          for (let cc = c0; cc <= c1 + 1; cc++) {
            const isSummitCorner = cr >= r && cr <= r + 1 && cc >= c && cc <= c + 1;
            const targetZ = isSummitCorner
              ? clamp(Math.max(this.cornerZ[cr][cc], peakLv), 0, MAX_ELEV)
              : clamp(Math.max(this.cornerZ[cr][cc], ringLv), 0, MAX_ELEV);
            if (targetZ !== this.cornerZ[cr][cc]) cornerDiff = true;
            pinned.push([cr, cc, targetZ]);
          }
        }

        let surfDiff = false;
        for (let nr = r0; nr <= r1; nr++) {
          for (let nc = c0; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            const wantSurf = nr === r && nc === c ? "untouched_powder" : "alpine_scree";
            if (sub.water !== null || sub.surface !== wantSurf) {
              surfDiff = true;
            }
          }
        }
        if (!cornerDiff && !surfDiff) return false;

        this._recordUndoBeforeChange();
        const prop = cornerDiff ? this._propagateCornerConstraints(pinned) : { changed: false };
        let bR0 = r0;
        let bC0 = c0;
        let bR1 = r1;
        let bC1 = c1;
        if (prop.changed) {
          if (prop.cellR0 < bR0) bR0 = prop.cellR0;
          if (prop.cellC0 < bC0) bC0 = prop.cellC0;
          if (prop.cellR1 > bR1) bR1 = prop.cellR1;
          if (prop.cellC1 > bC1) bC1 = prop.cellC1;
        }

        for (let nr = r0; nr <= r1; nr++) {
          for (let nc = c0; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            sub.water = null;
            if (sub.flora && FLORA_DEFS[sub.flora] && FLORA_DEFS[sub.flora].category === "nature") {
              sub.flora = null;
            }
            const zCorners = this.getCellCorners(nr, nc);
            const isFlatNow = Math.min(...zCorners) === Math.max(...zCorners);
            const nextSurf = nr === r && nc === c
              ? "untouched_powder"
              : !isFlatNow
              ? "alpine_scree"
              : sub.surface === "alpine_scree"
              ? "alpine_scree"
              : "untouched_powder";
            sub.surface = nextSurf;
            sub.biome = nextSurf;
            sub.pisteQuality = 100;
          }
        }

        const bounds = this._reconcileRegionAfterEdit(bR0, bC0, bR1, bC1, {
          cornersChanged: Boolean(prop.changed),
        });
        this._notifyChange("sculpt", bounds);
        return true;
      }

      // `glacial_bowl` (`sculpt_glacial_bowl`): `5x5` U-shaped concave ski cirque!
      // Carves inner `3x3` `-1` clamped `>= 0` (`groomed_piste`), raises N/E/W rim `+1` (`untouched_powder`), leaves S open!
      if (rawMode === "glacial_bowl" || rawMode === "cirque_bowl") {
        const n = this.size;
        const r0 = clamp(r - 2, 0, n - 1);
        const r1 = clamp(r + 2, 0, n - 1);
        const c0 = clamp(c - 2, 0, n - 1);
        const c1 = clamp(c + 2, 0, n - 1);

        const centerHi = this.cells[r][c].maxLevel;
        const bowlLv = clamp(centerHi > 0 ? centerHi - 1 : 0, 0, MAX_ELEV - 1);
        const midWallLv = clamp(bowlLv + 1, 0, MAX_ELEV);
        const rimLv = clamp(bowlLv + 2, 1, MAX_ELEV);

        const pinned = [];
        let cornerDiff = false;
        for (let cr = r0; cr <= r1 + 1; cr++) {
          for (let cc = c0; cc <= c1 + 1; cc++) {
            const curZ = this.cornerZ[cr][cc];
            let nextZ = curZ;
            const inCoreFloor = cr >= r && cr <= r + 2 && cc >= c && cc <= c + 1;
            const inSouthExit = cr === r + 3 && cc >= c && cc <= c + 1;
            const onOuterRim =
              (cr === r0 || cc === c0 || cc === c1 + 1) && cr <= r + 2;

            if (inCoreFloor) {
              nextZ = bowlLv;
            } else if (inSouthExit) {
              nextZ = Math.min(curZ, bowlLv);
            } else if (onOuterRim) {
              nextZ = clamp(Math.min(Math.max(curZ + 1, midWallLv), rimLv), 0, MAX_ELEV);
            } else {
              nextZ = clamp(curZ, bowlLv, midWallLv);
            }
            if (nextZ !== curZ) cornerDiff = true;
            pinned.push([cr, cc, nextZ]);
          }
        }

        let surfDiff = false;
        for (let nr = r0; nr <= r1; nr++) {
          for (let nc = c0; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            const isInner = Math.abs(nr - r) <= 1 && Math.abs(nc - c) <= 1;
            const want = isInner ? "groomed_piste" : "untouched_powder";
            if (sub.water !== null || sub.surface !== want) surfDiff = true;
          }
        }
        if (!cornerDiff && !surfDiff) return false;

        this._recordUndoBeforeChange();
        const prop = cornerDiff ? this._propagateCornerConstraints(pinned) : { changed: false };
        let bR0 = r0;
        let bC0 = c0;
        let bR1 = r1;
        let bC1 = c1;
        if (prop.changed) {
          if (prop.cellR0 < bR0) bR0 = prop.cellR0;
          if (prop.cellC0 < bC0) bC0 = prop.cellC0;
          if (prop.cellR1 > bR1) bR1 = prop.cellR1;
          if (prop.cellC1 > bC1) bC1 = prop.cellC1;
        }

        for (let nr = r0; nr <= r1; nr++) {
          for (let nc = c0; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            const isInner = (nr >= r - 1 && nr <= r + 2 && Math.abs(nc - c) <= 1);
            if (isInner) {
              sub.water = null;
              if (sub.flora && FLORA_DEFS[sub.flora] && FLORA_DEFS[sub.flora].category === "nature") {
                sub.flora = null;
              }
              sub.surface = "groomed_piste";
              sub.biome = "groomed_piste";
              sub.pisteQuality = 100;
            } else if (sub.water === null) {
              sub.surface = "untouched_powder";
              sub.biome = "untouched_powder";
            }
          }
        }

        const bounds = this._reconcileRegionAfterEdit(bR0, bC0, bR1, bC1, {
          cornersChanged: Boolean(prop.changed),
        });
        this._notifyChange("sculpt", bounds);
        return true;
      }

      // `cliff_balcony` (`sculpt_cliff_balcony`): `2x2` leveled cliff overlook terrace!
      // Levels `2x2` to target height, paints `festive_mosaic_cobble`, and places `retaining_wall_ns`/`ew` on downhill drop cells if empty!
      if (rawMode === "cliff_balcony" || rawMode === "cliff_terrace") {
        const n = this.size;
        const r0 = clamp(r, 0, Math.max(0, n - 2));
        const c0 = clamp(c, 0, Math.max(0, n - 2));
        const r1 = Math.min(n - 1, r0 + 1);
        const c1 = Math.min(n - 1, c0 + 1);

        const baseCell = this.cells[r0][c0];
        const terraceLv =
          targetLv !== null && targetLv !== undefined
            ? clamp(Math.round(targetLv), 0, MAX_ELEV)
            : baseCell.maxLevel > 0
            ? clamp(baseCell.maxLevel, 1, MAX_ELEV)
            : 1;

        const pinned = [];
        let cornerDiff = false;
        for (let cr = r0; cr <= r1 + 1; cr++) {
          for (let cc = c0; cc <= c1 + 1; cc++) {
            if (this.cornerZ[cr][cc] !== terraceLv) cornerDiff = true;
            pinned.push([cr, cc, terraceLv]);
          }
        }

        let surfDiff = false;
        for (let nr = r0; nr <= r1; nr++) {
          for (let nc = c0; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            if (sub.water !== null || sub.surface !== "festive_mosaic_cobble") {
              surfDiff = true;
            }
          }
        }
        if (!cornerDiff && !surfDiff) return false;

        this._recordUndoBeforeChange();
        const prop = cornerDiff ? this._propagateCornerConstraints(pinned) : { changed: false };
        let bR0 = r0;
        let bC0 = c0;
        let bR1 = r1;
        let bC1 = c1;
        if (prop.changed) {
          if (prop.cellR0 < bR0) bR0 = prop.cellR0;
          if (prop.cellC0 < bC0) bC0 = prop.cellC0;
          if (prop.cellR1 > bR1) bR1 = prop.cellR1;
          if (prop.cellC1 > bC1) bC1 = prop.cellC1;
        }

        for (let nr = r0; nr <= r1; nr++) {
          for (let nc = c0; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            sub.water = null;
            if (sub.flora && FLORA_DEFS[sub.flora] && FLORA_DEFS[sub.flora].category === "nature") {
              sub.flora = null;
            }
            sub.surface = "festive_mosaic_cobble";
            sub.biome = "festive_mosaic_cobble";
            sub.pisteQuality = 100;
          }
        }

        // First reconcile corner/slope masks so downhill apron cells have accurate `minLevel`
        const rec = this._reconcileRegionCellsOnly(bR0, bC0, bR1, bC1);
        bR0 = rec.r0;
        bC0 = rec.c0;
        bR1 = rec.r1;
        bC1 = rec.c1;

        const tryPlaceRetainingWall = (wr, wc, wallId, rot) => {
          if (!this.inBounds(wr, wc)) return;
          const wCell = this.cells[wr][wc];
          if (wCell.water !== null || wCell.structure !== null || wCell.liftId) return;
          if (wCell.minLevel >= terraceLv) return;
          const wDef = STRUCTURE_DEFS[wallId];
          if (!wDef) return;
          wCell.flora = null;
          wCell.structure = {
            id: wallId,
            baseId: wDef.baseId,
            category: wDef.category,
            level: wCell.minLevel,
            rotation: rot,
          };
          if (wr < bR0) bR0 = wr;
          if (wc < bC0) bC0 = wc;
          if (wr > bR1) bR1 = wr;
          if (wc > bC1) bC1 = wc;
        };

        for (let nc = c0; nc <= c1; nc++) {
          tryPlaceRetainingWall(r1 + 1, nc, "retaining_wall_ew", 1);
          tryPlaceRetainingWall(r0 - 1, nc, "retaining_wall_ew", 1);
        }
        for (let nr = r0; nr <= r1; nr++) {
          tryPlaceRetainingWall(nr, c1 + 1, "retaining_wall_ns", 0);
          tryPlaceRetainingWall(nr, c0 - 1, "retaining_wall_ns", 0);
        }

        const bounds = this._reconcileRegionAfterEdit(bR0, bC0, bR1, bC1, {
          cornersChanged: Boolean(prop.changed),
          liftsChanged: Boolean(rec.liftsRemoved),
        });
        this._notifyChange("sculpt", bounds);
        return true;
      }

      // `corridor`: clears nature flora/rocks in a `2x2` swatch and paints `groomed_piste`!
      if (rawMode === "corridor" || rawMode === "trail_cut") {
        let changed = false;
        let waterCleared = false;
        const r1 = Math.min(this.size - 1, r + 1);
        const c1 = Math.min(this.size - 1, c + 1);
        for (let nr = r; nr <= r1; nr++) {
          for (let nc = c; nc <= c1; nc++) {
            const sub = this.cells[nr][nc];
            const willClearWater = sub.water !== null;
            const willClearFlora = Boolean(
              sub.flora && FLORA_DEFS[sub.flora] && FLORA_DEFS[sub.flora].category === "nature"
            );
            const willPaintPiste = sub.surface !== "groomed_piste" || sub.pisteQuality < 98;
            if (!willClearWater && !willClearFlora && !willPaintPiste) continue;

            if (!changed) {
              this._recordUndoBeforeChange();
              changed = true;
            }
            if (willClearWater) {
              sub.water = null;
              waterCleared = true;
            }
            if (willClearFlora) {
              sub.flora = null;
            }
            if (willPaintPiste) {
              sub.surface = "groomed_piste";
              sub.biome = "groomed_piste";
              sub.pisteQuality = 100;
            }
          }
        }
        if (!changed) return false;
        let bounds;
        if (waterCleared) {
          bounds = this._reconcileRegionAfterEdit(r, c, r1, c1, { cornersChanged: false });
        } else {
          this._rebuildRegionDerived(r, c, r1, c1, { cornersChanged: false });
          bounds = { r0: r, c0: c, r1, c1 };
        }
        this._notifyChange("sculpt", bounds);
        return true;
      }

      // `smooth`: averages corners in `(r - rad .. r + rad + 1, c - rad .. c + rad + 1)` toward neighbor mean
      if (rawMode === "smooth") {
        const rad = clamp(Math.round(Number(radius) || 1), 1, 3);
        const n = this.size;
        const pinned = [];
        let anyDiff = false;

        for (let cr = Math.max(0, r - rad); cr <= Math.min(n, r + rad + 1); cr++) {
          for (let cc = Math.max(0, c - rad); cc <= Math.min(n, c + rad + 1); cc++) {
            let sum = 0;
            let cnt = 0;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = cr + dr;
                const nc = cc + dc;
                if (nr >= 0 && nc >= 0 && nr <= n && nc <= n) {
                  const weight = dr === 0 && dc === 0 ? 2 : 1;
                  sum += this.cornerZ[nr][nc] * weight;
                  cnt += weight;
                }
              }
            }
            const cur = this.cornerZ[cr][cc];
            const mean = sum / Math.max(1, cnt);
            let nextVal = Math.round(mean);
            if (nextVal === cur && Math.abs(mean - cur) >= 0.34) {
              nextVal = clamp(cur + (mean > cur ? 1 : -1), 0, MAX_ELEV);
            }
            if (nextVal !== cur) anyDiff = true;
            pinned.push([cr, cc, clamp(nextVal, 0, MAX_ELEV)]);
          }
        }

        if (!anyDiff) return false;
        this._recordUndoBeforeChange();
        const prop = this._propagateCornerConstraints(pinned);
        const bounds = prop.changed
          ? this._reconcileRegionAfterEdit(prop.cellR0, prop.cellC0, prop.cellR1, prop.cellC1, {
              cornersChanged: true,
            })
          : { r0: r, c0: c, r1: r, c1: c };
        this._notifyChange("sculpt", bounds);
        return true;
      }

      // `3x3` (or `radius`) Massif Raise / Cirque Lower / Plateau Level
      const rad = clamp(Math.round(Number(radius) || 1), 1, 3);
      const centerCorners = this.getCellCorners(r, c);
      const centerLo = Math.min(...centerCorners);
      const centerHi = Math.max(...centerCorners);

      let desiredLv = centerLo;
      if (rawMode.startsWith("raise")) {
        if (centerLo >= MAX_ELEV) return false;
        desiredLv = Math.min(MAX_ELEV, centerLo + 1);
      } else if (rawMode.startsWith("lower")) {
        if (centerHi <= 0) return false;
        desiredLv = Math.max(0, centerHi - 1);
      } else if (rawMode.startsWith("level")) {
        desiredLv =
          targetLv !== null && targetLv !== undefined
            ? clamp(Math.round(targetLv), 0, MAX_ELEV)
            : clamp(
                Math.round((centerCorners[0] + centerCorners[1] + centerCorners[2] + centerCorners[3]) * 0.25),
                0,
                MAX_ELEV
              );
      } else {
        return false;
      }

      const r0 = clamp(r - rad, 0, this.size - 1);
      const r1 = clamp(r + rad, 0, this.size - 1);
      const c0 = clamp(c - rad, 0, this.size - 1);
      const c1 = clamp(c + rad, 0, this.size - 1);

      const pinned = [];
      let changed = false;
      for (let cr = r0; cr <= r1 + 1; cr++) {
        for (let cc = c0; cc <= c1 + 1; cc++) {
          let nextZ = this.cornerZ[cr][cc];
          if (rawMode.startsWith("raise")) {
            nextZ = Math.max(nextZ, desiredLv);
          } else if (rawMode.startsWith("lower")) {
            nextZ = Math.min(nextZ, desiredLv);
          } else {
            nextZ = desiredLv;
          }
          nextZ = clamp(nextZ, 0, MAX_ELEV);
          if (nextZ !== this.cornerZ[cr][cc]) changed = true;
          pinned.push([cr, cc, nextZ]);
        }
      }

      if (!changed) return false;
      this._recordUndoBeforeChange();
      const prop = this._propagateCornerConstraints(pinned);
      const bounds = prop.changed
        ? this._reconcileRegionAfterEdit(prop.cellR0, prop.cellC0, prop.cellR1, prop.cellC1, {
            cornersChanged: true,
          })
        : { r0, c0, r1, c1 };
      this._notifyChange("sculpt", bounds);
      return true;
    }

    sculptCell(r, c, mode = "raise", targetLv = null) {
      if (!this.inBounds(r, c)) return false;
      const m = String(mode || "raise").toLowerCase().replace(/^sculpt_/, "");

      // Route multi-tile brushes automatically when passed to `sculpt` or `sculptCell`
      if (
        m === "raise_3x3" ||
        m === "lower_3x3" ||
        m === "level_3x3" ||
        m === "smooth" ||
        m === "corridor" ||
        m === "trail_cut" ||
        m === "matterhorn_peak" ||
        m === "horn_peak" ||
        m === "glacial_bowl" ||
        m === "cirque_bowl" ||
        m === "cliff_balcony" ||
        m === "cliff_terrace"
      ) {
        return this.sculptBrush(r, c, m, 1, targetLv);
      }

      const [zN, zE, zS, zW] = this.getCellCorners(r, c);
      const lo = Math.min(zN, zE, zS, zW);
      const hi = Math.max(zN, zE, zS, zW);

      let desiredLv = lo;
      if (m === "raise" || m === "up" || m === "+1") {
        if (lo >= MAX_ELEV) return false;
        desiredLv = Math.min(MAX_ELEV, lo + 1);
      } else if (m === "lower" || m === "down" || m === "-1") {
        if (hi <= 0) return false;
        desiredLv = Math.max(0, hi - 1);
      } else if (m === "level" || m === "terrace" || m === "flatten") {
        desiredLv =
          targetLv !== null && targetLv !== undefined
            ? clamp(Math.round(targetLv), 0, MAX_ELEV)
            : clamp(Math.round((zN + zE + zS + zW) * 0.25), 0, MAX_ELEV);
        if (zN === desiredLv && zE === desiredLv && zS === desiredLv && zW === desiredLv) {
          return false;
        }
      } else {
        return false;
      }

      this._recordUndoBeforeChange();
      const prop = this._propagateCornerConstraints([
        [r, c, desiredLv],
        [r, c + 1, desiredLv],
        [r + 1, c + 1, desiredLv],
        [r + 1, c, desiredLv],
      ]);
      const bounds = prop.changed
        ? this._reconcileRegionAfterEdit(prop.cellR0, prop.cellC0, prop.cellR1, prop.cellC1, {
            cornersChanged: true,
          })
        : { r0: r, c0: c, r1: r, c1: c };
      this._notifyChange("sculpt", bounds);
      return true;
    }

    sculpt(r, c, mode = "raise", targetLv = null) {
      return this.sculptCell(r, c, mode, targetLv);
    }

    raiseTerrain(r, c) {
      return this.sculptCell(r, c, "raise");
    }

    lowerTerrain(r, c) {
      return this.sculptCell(r, c, "lower");
    }

    levelTerrain(r, c, targetLv = null) {
      return this.sculptCell(r, c, "level", targetLv);
    }

    paintSurface(r, c, surfaceId) {
      if (!this.inBounds(r, c) || !SURFACE_SET.has(surfaceId)) return false;
      const cell = this.cells[r][c];
      if (cell.surface === surfaceId && cell.water === null) {
        if (GROOMABLE_SURFACES.has(surfaceId) && cell.pisteQuality < 98) {
          cell.pisteQuality = 100;
          this._skiRunsDirty = true;
          this._notifyChange("groom", { r0: r, c0: c, r1: r, c1: c });
          return true;
        }
        return false;
      }
      const hadWater = cell.water !== null;
      this._recordUndoBeforeChange();
      cell.surface = surfaceId;
      cell.biome = surfaceId;
      cell.pisteQuality = 100;
      if (hadWater) {
        cell.water = null;
      }
      // Clear nature trees/rocks automatically when grooming runs or paving town plazas/roads!
      if (
        (GROOMABLE_SURFACES.has(surfaceId) || VILLAGE_WALK_SURFACES.has(surfaceId)) &&
        surfaceId !== "untouched_powder" &&
        cell.flora
      ) {
        const fDef = FLORA_DEFS[cell.flora];
        if (fDef && fDef.category === "nature") {
          cell.flora = null;
        }
      }
      let bounds;
      if (hadWater) {
        bounds = this._reconcileRegionAfterEdit(r, c, r, c, { cornersChanged: false });
      } else {
        this._rebuildRegionDerived(r, c, r, c, { cornersChanged: false });
        bounds = { r0: r, c0: c, r1: r, c1: c };
      }
      this._notifyChange("surface", bounds);
      return true;
    }

    setSurface(r, c, surfaceId) {
      return this.paintSurface(r, c, surfaceId);
    }

    paintBiome(r, c, surfaceId) {
      return this.paintSurface(r, c, surfaceId);
    }

    setBiome(r, c, surfaceId) {
      return this.paintSurface(r, c, surfaceId);
    }

    paintWater(r, c, waterType) {
      if (!this.inBounds(r, c)) return false;
      let norm = waterType;
      const sNorm = norm !== null && norm !== undefined ? String(norm).toLowerCase() : "";
      if (
        norm === null ||
        norm === undefined ||
        sNorm === "" ||
        sNorm === "none" ||
        sNorm === "land" ||
        sNorm === "snow" ||
        sNorm === "water_land" ||
        sNorm === "restore_land"
      ) {
        norm = null;
      } else if (sNorm.startsWith("frozen_lake") || sNorm.startsWith("frozen_icefall") || sNorm === "ice") {
        norm = "frozen_lake";
      } else if (sNorm.startsWith("thermal_spring") || sNorm === "spring" || sNorm === "hot_spring") {
        norm = "thermal_spring";
      } else if (
        sNorm.startsWith("meltwater_brook") ||
        sNorm.startsWith("cascading_waterfall") ||
        sNorm === "brook" ||
        sNorm === "creek" ||
        sNorm === "waterfall"
      ) {
        norm = "meltwater_brook";
      } else if (sNorm.startsWith("glacier_crevasse") || sNorm === "crevasse") {
        norm = "glacier_crevasse";
      } else {
        return false;
      }

      const cell = this.cells[r][c];
      if (norm === null) {
        if (cell.water === null) return false;
        this._recordUndoBeforeChange();
        cell.water = null;
        const bounds = this._reconcileRegionAfterEdit(r, c, r, c, { cornersChanged: false });
        this._notifyChange("water", bounds);
        return true;
      }

      const [zN, zE, zS, zW] = this.getCellCorners(r, c);
      const rawLo = Math.min(zN, zE, zS, zW);
      const hi = Math.max(zN, zE, zS, zW);
      const mask = rawLo === hi ? "0000" : `${zN - rawLo}${zE - rawLo}${zS - rawLo}${zW - rawLo}`;

      const finishWaterEdit = (prop) => {
        let bR0 = r;
        let bC0 = c;
        let bR1 = r;
        let bC1 = c;
        const cornersChanged = Boolean(prop && prop.changed);
        if (cornersChanged) {
          if (prop.cellR0 < bR0) bR0 = prop.cellR0;
          if (prop.cellC0 < bC0) bC0 = prop.cellC0;
          if (prop.cellR1 > bR1) bR1 = prop.cellR1;
          if (prop.cellC1 > bC1) bC1 = prop.cellC1;
        }
        const bounds = this._reconcileRegionAfterEdit(bR0, bC0, bR1, bC1, { cornersChanged });
        this._notifyChange("water", bounds);
        return true;
      };

      if (norm === "thermal_spring") {
        const lo = clamp(rawLo, 0, 2);
        if (cell.water === "thermal_spring" && cell.isFlat && cell.minLevel === lo) return false;
        this._recordUndoBeforeChange();
        let prop = null;
        if (!cell.isFlat || cell.minLevel > 2) {
          prop = this._propagateCornerConstraints([
            [r, c, lo],
            [r, c + 1, lo],
            [r + 1, c + 1, lo],
            [r + 1, c, lo],
          ]);
        }
        cell.water = "thermal_spring";
        cell.flora = null;
        return finishWaterEdit(prop);
      }

      if (norm === "glacier_crevasse") {
        const lo = clamp(rawLo, 0, 4);
        if (cell.water === "glacier_crevasse" && cell.isFlat && cell.minLevel === lo) return false;
        this._recordUndoBeforeChange();
        let prop = null;
        if (!cell.isFlat) {
          prop = this._propagateCornerConstraints([
            [r, c, lo],
            [r, c + 1, lo],
            [r + 1, c + 1, lo],
            [r + 1, c, lo],
          ]);
        }
        cell.water = "glacier_crevasse";
        cell.flora = null;
        return finishWaterEdit(prop);
      }

      // `meltwater_brook` (flat Lv 0..3 OR `1100`/`1001` `cascading_waterfall` at Lv 0..3)
      // `frozen_lake` (flat Lv 0..2 OR `1100`/`1001` `frozen_icefall` at Lv 0..2)
      const maxWaterLv = norm === "meltwater_brook" ? 3 : 2;
      const lo = clamp(rawLo, 0, maxWaterLv);
      const validCascade = rawLo !== hi && rawLo <= maxWaterLv && (mask === "1100" || mask === "1001");

      if (cell.water === norm && ((rawLo === hi && rawLo <= maxWaterLv) || validCascade)) {
        return false;
      }

      this._recordUndoBeforeChange();
      let prop = null;
      if (!validCascade && (rawLo !== hi || cell.minLevel > maxWaterLv)) {
        const nbN = this.inBounds(r - 1, c) ? this.cells[r - 1][c].minLevel : -1;
        const nbW = this.inBounds(r, c - 1) ? this.cells[r][c - 1].minLevel : -1;
        if (lo <= maxWaterLv && nbN === lo + 1 && (!this.inBounds(r + 1, c) || this.cells[r + 1][c].maxLevel <= lo + 1)) {
          prop = this._propagateCornerConstraints([
            [r, c, lo + 1],
            [r, c + 1, lo + 1],
            [r + 1, c + 1, lo],
            [r + 1, c, lo],
          ]);
        } else if (lo <= maxWaterLv && nbW === lo + 1 && (!this.inBounds(r, c + 1) || this.cells[r][c + 1].maxLevel <= lo + 1)) {
          prop = this._propagateCornerConstraints([
            [r, c, lo + 1],
            [r, c + 1, lo],
            [r + 1, c + 1, lo],
            [r + 1, c, lo + 1],
          ]);
        } else {
          prop = this._propagateCornerConstraints([
            [r, c, lo],
            [r, c + 1, lo],
            [r + 1, c + 1, lo],
            [r + 1, c, lo],
          ]);
        }
      }
      cell.water = norm;
      cell.flora = null;
      return finishWaterEdit(prop);
    }

    setWater(r, c, waterType) {
      return this.paintWater(r, c, waterType);
    }

    _scoreAxisByNeighbors(r, c, matchFn, rotation = 0) {
      const ns =
        (this.inBounds(r - 1, c) && matchFn(this.cells[r - 1][c], "N") ? 2 : 0) +
        (this.inBounds(r + 1, c) && matchFn(this.cells[r + 1][c], "S") ? 2 : 0);
      const ew =
        (this.inBounds(r, c - 1) && matchFn(this.cells[r][c - 1], "W") ? 2 : 0) +
        (this.inBounds(r, c + 1) && matchFn(this.cells[r][c + 1], "E") ? 2 : 0);
      if (ns > ew) return "ns";
      if (ew > ns) return "ew";
      return rotation % 2 === 1 ? "ew" : "ns";
    }

    _hasTrackNeighbor(r, c) {
      if (!this.inBounds(r, c)) return false;
      const s = this.cells[r][c].structure;
      if (!s) return false;
      const def = STRUCTURE_DEFS[s.id];
      return Boolean((def && def.isTrack) || s.id === "valley_train_station");
    }

    _hasCoasterNeighbor(r, c) {
      if (!this.inBounds(r, c)) return false;
      const s = this.cells[r][c].structure;
      if (!s) return false;
      const def = STRUCTURE_DEFS[s.id];
      return Boolean(def && def.isCoaster);
    }

    resolveStructureId(r, c, itemId, rotation = 0) {
      if (!itemId) return null;
      const rot = normalizeRotation(rotation);
      if (!this.inBounds(r, c)) return itemId;
      const cell = this.cells[r][c];

      // Smart Walkway / Stairs / Timber or Stone-Arch Bridge auto-resolver
      if (itemId === "town_walkway" || itemId === "walkway" || itemId === "boardwalk" || itemId === "path") {
        if (WATER_SET.has(cell.water)) {
          if (!cell.isFlat) return null;
          const ax = this._scoreAxisByNeighbors(
            r,
            c,
            (nb) => nb.water === null || Boolean(nb.structure && nb.structure.category === "bridge"),
            rot
          );
          return cell.water === "meltwater_brook"
            ? ax === "ew"
              ? "stone_arch_bridge_ew"
              : "stone_arch_bridge_ns"
            : ax === "ew"
            ? "timber_bridge_ew"
            : "timber_bridge_ns";
        }
        if (cell.isFlat) {
          return this.computeWalkwayIdForCell(r, c, rot);
        }
        return SLOPE_TO_STAIRS[cell.slopeMask] || null;
      }

      if (itemId === "snow_stairs" || itemId === "stairs" || itemId === "ramp") {
        return SLOPE_TO_STAIRS[cell.slopeMask] || (rot % 2 === 1 ? "snow_stairs_w" : "snow_stairs_n");
      }

      if (itemId === "covered_escalator" || itemId === "escalator") {
        return SLOPE_TO_ESCALATOR[cell.slopeMask] || (rot % 2 === 1 ? "covered_escalator_w" : "covered_escalator_n");
      }

      if (itemId === "timber_bridge" || itemId === "bridge") {
        const ax = this._scoreAxisByNeighbors(
          r,
          c,
          (nb) => nb.water === null || Boolean(nb.structure && nb.structure.category === "bridge"),
          rot
        );
        return ax === "ew" ? "timber_bridge_ew" : "timber_bridge_ns";
      }

      if (itemId === "stone_arch_bridge") {
        const ax = this._scoreAxisByNeighbors(
          r,
          c,
          (nb) => nb.water === null || Boolean(nb.structure && nb.structure.category === "bridge"),
          rot
        );
        return ax === "ew" ? "stone_arch_bridge_ew" : "stone_arch_bridge_ns";
      }

      if (itemId === "kapellbrucke_bridge") {
        const ax = this._scoreAxisByNeighbors(
          r,
          c,
          (nb) => nb.water === null || Boolean(nb.structure && nb.structure.category === "bridge"),
          rot
        );
        return ax === "ew" ? "kapellbrucke_bridge_ew" : "kapellbrucke_bridge_ns";
      }

      if (itemId === "suspension_skybridge") {
        const ax = this._scoreAxisByNeighbors(
          r,
          c,
          (nb) =>
            (nb.water === null && cell.water !== null) ||
            Boolean(nb.structure && nb.structure.baseId === "suspension_skybridge"),
          rot
        );
        return ax === "ew" ? "suspension_skybridge_ew" : "suspension_skybridge_ns";
      }

      if (itemId === "festival_bunting_arch") {
        const ax = this._scoreAxisByNeighbors(
          r,
          c,
          (nb) =>
            Boolean(
              nb.structure &&
                (nb.structure.baseId === "festival_bunting_arch" || nb.structure.category === "walkway")
            ),
          rot
        );
        return ax === "ew" ? "festival_bunting_arch_ew" : "festival_bunting_arch_ns";
      }

      if (itemId === "mountain_coaster") {
        const nC = this._hasCoasterNeighbor(r - 1, c);
        const sC = this._hasCoasterNeighbor(r + 1, c);
        const eC = this._hasCoasterNeighbor(r, c + 1);
        const wC = this._hasCoasterNeighbor(r, c - 1);
        if (nC && eC && !sC && !wC) return "mountain_coaster_curve_ne";
        if (nC && wC && !sC && !eC) return "mountain_coaster_curve_nw";
        if (sC && eC && !nC && !wC) return "mountain_coaster_curve_se";
        if (sC && wC && !nC && !eC) return "mountain_coaster_curve_sw";
        if ((eC || wC) && !nC && !sC) return "mountain_coaster_ew";
        if ((nC || sC) && !eC && !wC) return "mountain_coaster_ns";
        return rot % 2 === 1 ? "mountain_coaster_ew" : "mountain_coaster_ns";
      }

      if (itemId === "mountain_coaster_curve") {
        const nC = this._hasCoasterNeighbor(r - 1, c);
        const sC = this._hasCoasterNeighbor(r + 1, c);
        const eC = this._hasCoasterNeighbor(r, c + 1);
        const wC = this._hasCoasterNeighbor(r, c - 1);
        if (rot === 0) {
          if (nC && eC) return "mountain_coaster_curve_ne";
          if (nC && wC) return "mountain_coaster_curve_nw";
          if (sC && eC) return "mountain_coaster_curve_se";
          if (sC && wC) return "mountain_coaster_curve_sw";
        }
        const coasterCurves = [
          "mountain_coaster_curve_ne",
          "mountain_coaster_curve_se",
          "mountain_coaster_curve_sw",
          "mountain_coaster_curve_nw",
        ];
        return coasterCurves[rot % 4];
      }

      if (itemId === "retaining_wall") {
        return rot % 2 === 1 ? "retaining_wall_ew" : "retaining_wall_ns";
      }

      if (itemId === "mid_transfer_station") {
        return rot % 2 === 1 ? "mid_transfer_station_ew" : "mid_transfer_station_ns";
      }

      // Swiss Railway Straight, 4-Way Curve, Viaduct, Tunnel & Crossing Resolvers
      if (itemId === "train_track") {
        const nT = this._hasTrackNeighbor(r - 1, c);
        const sT = this._hasTrackNeighbor(r + 1, c);
        const eT = this._hasTrackNeighbor(r, c + 1);
        const wT = this._hasTrackNeighbor(r, c - 1);
        if (nT && eT && !sT && !wT) return "train_track_curve_ne";
        if (nT && wT && !sT && !eT) return "train_track_curve_nw";
        if (sT && eT && !nT && !wT) return "train_track_curve_se";
        if (sT && wT && !nT && !eT) return "train_track_curve_sw";
        if ((eT || wT) && !nT && !sT) return "train_track_ew";
        if ((nT || sT) && !eT && !wT) return "train_track_ns";
        return rot % 2 === 1 ? "train_track_ew" : "train_track_ns";
      }

      if (itemId === "train_track_curve") {
        const nT = this._hasTrackNeighbor(r - 1, c);
        const sT = this._hasTrackNeighbor(r + 1, c);
        const eT = this._hasTrackNeighbor(r, c + 1);
        const wT = this._hasTrackNeighbor(r, c - 1);
        if (rot === 0) {
          if (nT && eT) return "train_track_curve_ne";
          if (nT && wT) return "train_track_curve_nw";
          if (sT && eT) return "train_track_curve_se";
          if (sT && wT) return "train_track_curve_sw";
        }
        const curveOrder = [
          "train_track_curve_ne",
          "train_track_curve_se",
          "train_track_curve_sw",
          "train_track_curve_nw",
        ];
        return curveOrder[rot % 4];
      }

      if (itemId === "stone_viaduct") {
        const ax = this._scoreAxisByNeighbors(r, c, (nb) => Boolean(nb.structure && STRUCTURE_DEFS[nb.structure.id] && STRUCTURE_DEFS[nb.structure.id].isTrack), rot);
        return ax === "ew" ? "stone_viaduct_ew" : "stone_viaduct_ns";
      }

      if (itemId === "rail_tunnel_portal") {
        return rot % 2 === 1 ? "rail_tunnel_portal_se" : "rail_tunnel_portal_sw";
      }

      if (itemId === "rail_crossing_gate") {
        const ax = this._scoreAxisByNeighbors(r, c, (nb) => Boolean(nb.structure && STRUCTURE_DEFS[nb.structure.id] && STRUCTURE_DEFS[nb.structure.id].isTrack), rot);
        return ax === "ew" ? "rail_crossing_gate_ew" : "rail_crossing_gate_ns";
      }

      if (itemId === "train_platform") {
        const nTrack = this.inBounds(r - 1, c) && this.cells[r - 1][c].structureId && this.cells[r - 1][c].structureId.endsWith("_ew");
        const sTrack = this.inBounds(r + 1, c) && this.cells[r + 1][c].structureId && this.cells[r + 1][c].structureId.endsWith("_ew");
        const wTrack = this.inBounds(r, c - 1) && this.cells[r][c - 1].structureId && this.cells[r][c - 1].structureId.endsWith("_ns");
        const eTrack = this.inBounds(r, c + 1) && this.cells[r][c + 1].structureId && this.cells[r][c + 1].structureId.endsWith("_ns");
        if (nTrack || sTrack) return "train_platform_ew";
        if (wTrack || eTrack) return "train_platform_ns";
        return rot % 2 === 1 ? "train_platform_ew" : "train_platform_ns";
      }

      // Rotatable Amenities
      if (itemId === "pond_hockey_goal") return rot % 2 === 1 ? "pond_hockey_goal_ew" : "pond_hockey_goal_ns";
      if (itemId === "street_light_garland") return rot % 2 === 1 ? "street_light_garland_ew" : "street_light_garland_ns";
      if (itemId === "ski_rack_bench" || itemId === "bench") return rot % 2 === 1 ? "ski_rack_bench_se" : "ski_rack_bench_sw";

      // Rotatable Flora / Race / Park / Tech / Multi-Variant Trees
      if (itemId === "cliff_warning_rope") return rot % 2 === 1 ? "cliff_warning_rope_ew" : "cliff_warning_rope_ns";
      if (itemId === "finish_timing_arch") return rot % 2 === 1 ? "finish_timing_arch_ew" : "finish_timing_arch_ns";
      if (itemId === "safety_net") return rot % 2 === 1 ? "safety_net_ew" : "safety_net_ns";
      if (itemId === "wind_drift_fence") return rot % 2 === 1 ? "wind_drift_fence_ew" : "wind_drift_fence_ns";
      if (itemId === "park_kicker") return rot % 2 === 1 ? "park_kicker_se" : "park_kicker_sw";
      if (itemId === "big_air_kicker") return rot % 2 === 1 ? "big_air_kicker_se" : "big_air_kicker_sw";
      if (itemId === "stunt_airbag") return rot % 2 === 1 ? "stunt_airbag_se" : "stunt_airbag_sw";
      if (itemId === "park_rail") return rot % 2 === 1 ? "park_rail_ew" : "park_rail_ns";
      if (itemId === "rainbow_cbox") return rot % 2 === 1 ? "rainbow_cbox_ew" : "rainbow_cbox_ns";
      if (itemId === "kinked_stair_rail") return rot % 2 === 1 ? "kinked_stair_rail_ew" : "kinked_stair_rail_ns";
      if (itemId === "timber_wallride") return rot % 2 === 1 ? "timber_wallride_se" : "timber_wallride_sw";
      if (itemId === "halfpipe_wall") return rot % 2 === 1 ? "halfpipe_wall_ew" : "halfpipe_wall_ns";
      if (itemId === "boardercross_berm") return rot % 2 === 1 ? "boardercross_berm_se" : "boardercross_berm_sw";
      if (itemId === "snow_cannon") return rot % 2 === 1 ? "snow_cannon_se" : "snow_cannon_sw";
      if (itemId === "prayer_flags") return rot % 2 === 1 ? "prayer_flags_ew" : "prayer_flags_ns";

      if (itemId === "spruce_tall") return (r + c + rot) % 2 === 1 ? "spruce_tall_v1" : "spruce_tall_v0";
      if (itemId === "spruce_med") return (r + c + rot) % 2 === 1 ? "spruce_med_v1" : "spruce_med_v0";
      if (itemId === "golden_larch") return (r + c + rot) % 2 === 1 ? "golden_larch_v1" : "golden_larch_v0";
      if (itemId === "weeping_hemlock") return (r + c + rot) % 2 === 1 ? "weeping_hemlock_v1" : "weeping_hemlock_v0";
      if (itemId === "dwarf_krummholz") return (r + c + rot) % 2 === 1 ? "dwarf_krummholz_v1" : "dwarf_krummholz_v0";
      if (itemId === "frosted_birch") return (r + c + rot) % 2 === 1 ? "frosted_birch_v1" : "frosted_birch_v0";
      if (itemId === "summit_crag") return (r + c + rot) % 2 === 1 ? "summit_crag_v1" : "summit_crag_v0";
      if (itemId === "snow_boulder") return (r + c + rot) % 2 === 1 ? "snow_boulder_v1" : "snow_boulder_v0";

      return itemId;
    }

    resolveItemId(r, c, itemId, rotation = 0) {
      return this.resolveStructureId(r, c, itemId, rotation);
    }

    canPlaceWalkway(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (
        cell.structure &&
        (COMPOSITE_2X2_IDS.has(cell.structure.baseId) ||
          cell.structure.liftId ||
          cell.structure.category === "building")
      ) {
        return false;
      }
      if (cell.water === null) {
        return cell.isFlat || Boolean(SLOPE_TO_STAIRS[cell.slopeMask]);
      }
      return cell.isFlat && WATER_SET.has(cell.water);
    }

    canPlaceBoardwalk(r, c) {
      return this.canPlaceWalkway(r, c);
    }

    placeWalkway(r, c, rotation = 0) {
      if (!this.canPlaceWalkway(r, c)) return false;
      const cell = this.cells[r][c];
      const resolvedId = this.resolveStructureId(r, c, "town_walkway", rotation);
      if (!resolvedId) return false;
      if (cell.structure && cell.structure.id === resolvedId) return false;
      const def = STRUCTURE_DEFS[resolvedId];
      if (!def) return false;

      this._recordUndoBeforeChange();
      cell.flora = null;
      cell.structure = {
        id: resolvedId,
        baseId: def.baseId,
        category: def.category,
        level: cell.minLevel,
        rotation: normalizeRotation(rotation),
      };
      this._rebuildRegionDerived(r, c, r, c, { cornersChanged: false });
      this._notifyChange("walkway", { r0: r, c0: c, r1: r, c1: c });
      return true;
    }

    placeBoardwalk(r, c, rotation = 0) {
      return this.placeWalkway(r, c, rotation);
    }

    canPlaceFlora(r, c, floraId, rotation = 0) {
      if (!this.inBounds(r, c) || !floraId) return false;
      const resolved = this.resolveStructureId(r, c, floraId, rotation);
      const fDef = FLORA_DEFS[resolved];
      if (!fDef) {
        if (STRUCTURE_DEFS[resolved]) return this.canPlaceStructure(r, c, resolved, rotation);
        return false;
      }
      const cell = this.cells[r][c];
      if (cell.water !== null) return false;
      if (cell.structure !== null) return false;
      if (!cell.isFlat && !fDef.allowSlope) return false;
      if (cell.flora === resolved) return false;
      return true;
    }

    placeFlora(r, c, floraId, rotation = 0) {
      const resolved = this.resolveStructureId(r, c, floraId, rotation);
      if (resolved && !FLORA_DEFS[resolved] && STRUCTURE_DEFS[resolved]) {
        return this.placeStructure(r, c, resolved, rotation);
      }
      if (!this.canPlaceFlora(r, c, floraId, rotation)) return false;
      this._recordUndoBeforeChange();
      this.cells[r][c].flora = resolved;
      this._rebuildRegionDerived(r, c, r, c, { cornersChanged: false });
      this._notifyChange("flora", { r0: r, c0: c, r1: r, c1: c });
      return true;
    }

    canPlaceStructure(r, c, itemId, rotation = 0) {
      if (!this.inBounds(r, c) || !itemId) return false;
      if (itemId === "town_walkway" || itemId === "walkway" || itemId === "boardwalk" || itemId === "path") {
        return this.canPlaceWalkway(r, c);
      }

      const resolvedId = this.resolveStructureId(r, c, itemId, rotation);
      if (FLORA_DEFS[resolvedId]) {
        return this.canPlaceFlora(r, c, itemId, rotation);
      }

      const compId = COMPOSITE_2X2_IDS.has(itemId)
        ? itemId
        : COMPOSITE_2X2_IDS.has(resolvedId)
        ? resolvedId
        : null;
      if (compId) {
        if (!this.inBounds(r + 1, c + 1)) return false;
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            const sub = this.cells[r + dr][c + dc];
            if (sub.water !== null || sub.liftId) return false;
            if (sub.structure && sub.structure.category !== "walkway") return false;
          }
        }
        return true;
      }

      const def = STRUCTURE_DEFS[resolvedId];
      if (!def) return false;

      const cell = this.cells[r][c];
      if (cell.structure && (COMPOSITE_2X2_IDS.has(cell.structure.baseId) || cell.structure.liftId)) return false;
      if (cell.structure && cell.structure.id === resolvedId) return false;

      if (def.surface === "land_or_water_any") {
        return true;
      }
      if (def.surface === "land_any") {
        return cell.water === null;
      }
      if (def.surface === "land_flat") {
        return cell.isFlat && cell.water === null;
      }
      if (def.surface === "land_or_water_flat") {
        return cell.isFlat;
      }
      if (def.surface === "land_or_ice_flat") {
        return cell.isFlat && (cell.water === null || cell.water === "frozen_lake");
      }
      if (def.surface === "land_slope") {
        return !cell.isFlat && cell.water === null && cell.slopeMask === def.slopeMask;
      }
      if (def.surface === "water_flat") {
        return cell.isFlat && WATER_SET.has(cell.water);
      }
      return false;
    }

    placeStructure(r, c, itemId, rotation = 0) {
      if (!this.canPlaceStructure(r, c, itemId, rotation)) return false;
      if (itemId === "town_walkway" || itemId === "walkway" || itemId === "boardwalk" || itemId === "path") {
        return this.placeWalkway(r, c, rotation);
      }

      const resolvedId = this.resolveStructureId(r, c, itemId, rotation);
      if (FLORA_DEFS[resolvedId]) {
        return this.placeFlora(r, c, itemId, rotation);
      }

      const compId = COMPOSITE_2X2_IDS.has(itemId)
        ? itemId
        : COMPOSITE_2X2_IDS.has(resolvedId)
        ? resolvedId
        : null;
      if (compId) {
        this._recordUndoBeforeChange();
        const targetLv = this.cells[r][c].minLevel;
        let needFlatten = false;
        const pinned = [];
        for (let dr = 0; dr <= 2; dr++) {
          for (let dc = 0; dc <= 2; dc++) {
            if (this.cornerZ[r + dr][c + dc] !== targetLv) {
              needFlatten = true;
            }
            pinned.push([r + dr, c + dc, targetLv]);
          }
        }
        const prop = needFlatten ? this._propagateCornerConstraints(pinned) : null;

        const slices = [
          [0, 0, `${compId}_nw`, "nw"],
          [0, 1, `${compId}_ne`, "ne"],
          [1, 0, `${compId}_sw`, "sw"],
          [1, 1, `${compId}_se`, "se"],
        ];
        for (let i = 0; i < slices.length; i++) {
          const [dr, dc, sliceId, sliceCode] = slices[i];
          const sub = this.cells[r + dr][c + dc];
          sub.flora = null;
          sub.structure = {
            id: sliceId,
            baseId: compId,
            category: "building",
            level: targetLv,
            rotation: 0,
            parentR: r,
            parentC: c,
            slice: sliceCode,
          };
        }

        let bounds;
        if (prop && prop.changed) {
          const bR0 = Math.min(r, prop.cellR0);
          const bC0 = Math.min(c, prop.cellC0);
          const bR1 = Math.max(r + 1, prop.cellR1);
          const bC1 = Math.max(c + 1, prop.cellC1);
          bounds = this._reconcileRegionAfterEdit(bR0, bC0, bR1, bC1, { cornersChanged: true });
        } else {
          this._rebuildRegionDerived(r, c, r + 1, c + 1, { cornersChanged: false });
          bounds = { r0: r, c0: c, r1: r + 1, c1: c + 1 };
        }
        this._notifyChange("structure", bounds);
        return true;
      }

      const def = STRUCTURE_DEFS[resolvedId];
      if (!def) return false;

      const cell = this.cells[r][c];
      const rotNum = normalizeRotation(rotation);
      this._recordUndoBeforeChange();
      cell.flora = null;
      cell.structure = {
        id: resolvedId,
        baseId: def.baseId,
        category: def.category,
        level: cell.minLevel,
        rotation: rotNum,
      };
      let bR0 = r;
      let bC0 = c;
      let bR1 = r;
      let bC1 = c;
      // Auto-orient neighboring straight train tracks or mountain-coaster rails when placing interactively
      if (def.isTrack) {
        for (let i = 0; i < EDGE_NEIGHBORS.length; i++) {
          const nr = r + EDGE_NEIGHBORS[i].dr;
          const nc = c + EDGE_NEIGHBORS[i].dc;
          if (
            this.inBounds(nr, nc) &&
            this.cells[nr][nc].structure &&
            this.cells[nr][nc].structure.baseId === "train_track"
          ) {
            const nbTrack = this.resolveStructureId(nr, nc, "train_track", this.cells[nr][nc].structure.rotation || 0);
            if (nbTrack && STRUCTURE_DEFS[nbTrack]) {
              this.cells[nr][nc].structure.id = nbTrack;
              this.cells[nr][nc].structure.baseId = STRUCTURE_DEFS[nbTrack].baseId;
              if (nr < bR0) bR0 = nr;
              if (nc < bC0) bC0 = nc;
              if (nr > bR1) bR1 = nr;
              if (nc > bC1) bC1 = nc;
            }
          }
        }
      }
      if (def.isCoaster) {
        for (let i = 0; i < EDGE_NEIGHBORS.length; i++) {
          const nr = r + EDGE_NEIGHBORS[i].dr;
          const nc = c + EDGE_NEIGHBORS[i].dc;
          if (
            this.inBounds(nr, nc) &&
            this.cells[nr][nc].structure &&
            this.cells[nr][nc].structure.baseId === "mountain_coaster"
          ) {
            const nbCoaster = this.resolveStructureId(
              nr,
              nc,
              "mountain_coaster",
              this.cells[nr][nc].structure.rotation || 0
            );
            if (nbCoaster && STRUCTURE_DEFS[nbCoaster]) {
              this.cells[nr][nc].structure.id = nbCoaster;
              this.cells[nr][nc].structure.baseId = STRUCTURE_DEFS[nbCoaster].baseId;
              if (nr < bR0) bR0 = nr;
              if (nc < bC0) bC0 = nc;
              if (nr > bR1) bR1 = nr;
              if (nc > bC1) bC1 = nc;
            }
          }
        }
      }
      this._rebuildRegionDerived(bR0, bC0, bR1, bC1, { cornersChanged: false });
      this._notifyChange("structure", { r0: bR0, c0: bC0, r1: bR1, c1: bC1 });
      return true;
    }

    canPlaceAmenity(r, c, itemId, rotation = 0) {
      return this.canPlaceStructure(r, c, itemId, rotation);
    }

    placeAmenity(r, c, itemId, rotation = 0) {
      return this.placeStructure(r, c, itemId, rotation);
    }

    canBulldoze(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      return Boolean(cell.structure || cell.flora || cell.liftId);
    }

    bulldoze(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (!cell.structure && !cell.flora && !cell.liftId) {
        return false;
      }

      this._recordUndoBeforeChange();
      let removedId = null;
      let baseCost = 0;
      let bounds = { r0: r, c0: c, r1: r, c1: c };

      if (cell.liftId || (cell.structure && cell.structure.liftId)) {
        const lid = cell.liftId || cell.structure.liftId;
        const liftObj = this.lifts.find((L) => L.id === lid);
        if (liftObj) {
          const sp = LIFT_SPECS[liftObj.type] || LIFT_SPECS.chairlift;
          removedId = liftObj.type;
          baseCost = sp.baseCost + (liftObj.lengthCells || 4) * sp.perCellCost;
        }
        const lb = this._removeLiftRecord(lid);
        if (lb) {
          this._rebuildRegionDerived(lb.r0, lb.c0, lb.r1, lb.c1, {
            cornersChanged: false,
            liftsChanged: true,
          });
          bounds = lb;
        } else {
          this._rebuildAllDerived();
          bounds = { full: true };
        }
      } else if (cell.structure) {
        if (COMPOSITE_2X2_IDS.has(cell.structure.baseId)) {
          const pr = cell.structure.parentR;
          const pc = cell.structure.parentC;
          removedId = cell.structure.baseId;
          baseCost = STRUCTURE_DEFS[removedId] ? STRUCTURE_DEFS[removedId].cost : 1100;
          this._remove2x2StructureGroup(pr, pc, removedId);
          this._rebuildRegionDerived(pr, pc, pr + 1, pc + 1, { cornersChanged: false });
          bounds = { r0: pr, c0: pc, r1: pr + 1, c1: pc + 1 };
        } else {
          removedId = cell.structure.id;
          baseCost = STRUCTURE_DEFS[removedId] ? STRUCTURE_DEFS[removedId].cost : 25;
          cell.structure = null;
          this._rebuildRegionDerived(r, c, r, c, { cornersChanged: false });
        }
      } else if (cell.flora) {
        removedId = cell.flora;
        baseCost = FLORA_DEFS[removedId] ? FLORA_DEFS[removedId].cost : 15;
        cell.flora = null;
        this._rebuildRegionDerived(r, c, r, c, { cornersChanged: false });
      }

      this._notifyChange("bulldoze", bounds);
      return {
        removed: true,
        itemId: removedId,
        refund: Math.round(baseCost * 0.5),
      };
    }

    eraseAt(r, c) {
      return this.bulldoze(r, c);
    }

    // =========================================================================
    // Elevation, Fall-Line Gradient, Ski/Walk/Rail/Road/Rink & Light Queries
    // =========================================================================

    getTerrainZ(r, c, u = 4.0, v = 4.0) {
      if (!this.inBounds(r, c)) return 0.0;
      const un = clamp(u / 8.0, 0.0, 1.0);
      const vn = clamp(v / 8.0, 0.0, 1.0);
      const zN = this.cornerZ[r][c] * ELEV_STEP_Z;
      const zE = this.cornerZ[r][c + 1] * ELEV_STEP_Z;
      const zS = this.cornerZ[r + 1][c + 1] * ELEV_STEP_Z;
      const zW = this.cornerZ[r + 1][c] * ELEV_STEP_Z;
      return (
        (1.0 - un) * (1.0 - vn) * zN +
        (1.0 - un) * vn * zE +
        un * vn * zS +
        un * (1.0 - vn) * zW
      );
    }

    getSurfaceZ(r, c, u = 4.0, v = 4.0, includeDeck = true) {
      if (!this.inBounds(r, c)) return 0.0;
      const cell = this.cells[r][c];
      let z = this.getTerrainZ(r, c, u, v);
      if (!includeDeck || !cell.structure) return z;

      const s = cell.structure;
      const def = STRUCTURE_DEFS[s.id];
      if (!def) return z;

      if (s.category === "bridge" || s.baseId === "stone_viaduct") {
        const un = clamp(u / 8.0, 0.0, 1.0);
        const vn = clamp(v / 8.0, 0.0, 1.0);
        const t = s.id.endsWith("_ns") ? un : vn;
        const arch = s.category === "bridge" ? Math.sin(t * Math.PI) * 0.45 : 0.0;
        return cell.minLevel * ELEV_STEP_Z + (def.deckZ || 0.45) + arch;
      }
      if (def.deckZ) {
        return z + def.deckZ;
      }
      return z;
    }

    getCellElevationZ(r, c, u = 4.0, v = 4.0, includeDeck = true) {
      return this.getSurfaceZ(r, c, u, v, includeDeck);
    }

    getSlopeGradient(r, c, u = 4.0, v = 4.0) {
      if (!this.inBounds(r, c)) return { dzdu: 0, dzdv: 0, downU: 0, downV: 0, steepness: 0 };
      const un = clamp(u / 8.0, 0.0, 1.0);
      const vn = clamp(v / 8.0, 0.0, 1.0);
      const zN = this.cornerZ[r][c] * ELEV_STEP_Z;
      const zE = this.cornerZ[r][c + 1] * ELEV_STEP_Z;
      const zS = this.cornerZ[r + 1][c + 1] * ELEV_STEP_Z;
      const zW = this.cornerZ[r + 1][c] * ELEV_STEP_Z;

      const dzdun = (1.0 - vn) * (zW - zN) + vn * (zS - zE);
      const dzdvn = (1.0 - un) * (zE - zN) + un * (zS - zW);
      const dzdu = dzdun / 8.0;
      const dzdv = dzdvn / 8.0;
      const downU = -dzdu;
      const downV = -dzdv;
      const steepness = Math.hypot(downU, downV);
      return { dzdu, dzdv, downU, downV, steepness };
    }

    getDownhillVector(r, c, u = 4.0, v = 4.0) {
      const g = this.getSlopeGradient(r, c, u, v);
      if (g.steepness > 0.01) {
        return { du: g.downU / g.steepness, dv: g.downV / g.steepness, steepness: g.steepness };
      }
      const curZ = this.getTerrainZ(r, c, 4, 4);
      let bestDu = 0;
      let bestDv = 0;
      let bestDrop = 0;
      for (let i = 0; i < EDGE_NEIGHBORS.length; i++) {
        const e = EDGE_NEIGHBORS[i];
        const nr = r + e.dr;
        const nc = c + e.dc;
        if (!this.inBounds(nr, nc) || !this.isSkiable(nr, nc)) continue;
        const drop = curZ - this.getTerrainZ(nr, nc, 4, 4);
        if (drop > bestDrop) {
          bestDrop = drop;
          bestDu = e.dr;
          bestDv = e.dc;
        }
      }
      return { du: bestDu, dv: bestDv, steepness: bestDrop * 0.25 };
    }

    isSkiable(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (cell.water !== null) {
        return Boolean(cell.structure && cell.structure.category === "bridge");
      }
      if (cell.flora && FLORA_DEFS[cell.flora] && FLORA_DEFS[cell.flora].blocksSki) {
        return false;
      }
      if (cell.structure) {
        const def = STRUCTURE_DEFS[cell.structure.id];
        if (!def) return false;
        return Boolean(
          def.skiThrough ||
            def.category === "lift_station" ||
            def.category === "walkway" ||
            def.category === "stairs"
        );
      }
      return MOUNTAIN_SNOW_SURFACES.has(cell.surface) || !cell.isFlat;
    }

    isSkatingSurface(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (cell.structure) {
        const def = STRUCTURE_DEFS[cell.structure.id];
        return Boolean(def && def.skatable);
      }
      return cell.isFlat && cell.water === "frozen_lake";
    }

    isRoadSurface(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (cell.water !== null) return Boolean(cell.structure && cell.structure.category === "bridge");
      if (cell.structure) {
        const sId = cell.structure.id;
        return (
          sId === "shuttle_bus_stop" ||
          sId === "horse_sleigh_stand" ||
          sId.startsWith("rail_crossing_gate") ||
          cell.structure.category === "walkway"
        );
      }
      return cell.isFlat && (cell.surface === "asphalt_road" || cell.surface === "alpine_cobble");
    }

    isTrainTrack(r, c) {
      if (!this.inBounds(r, c)) return false;
      const s = this.cells[r][c].structure;
      if (!s) return false;
      const def = STRUCTURE_DEFS[s.id];
      return Boolean(def && def.isTrack);
    }

    getTrainTrackNeighbors(r, c) {
      const out = [];
      if (!this.isTrainTrack(r, c)) return out;
      const s = this.cells[r][c].structure;
      const def = STRUCTURE_DEFS[s.id];
      const ports = (def && def.trackPorts) || (s.id.endsWith("_ew") ? ["E", "W"] : ["N", "S"]);

      const portMap = {
        N: { dr: -1, dc: 0, opp: "S", heading: "ne" },
        S: { dr: 1, dc: 0, opp: "N", heading: "sw" },
        E: { dr: 0, dc: 1, opp: "W", heading: "se" },
        W: { dr: 0, dc: -1, opp: "E", heading: "nw" },
      };

      for (let i = 0; i < ports.length; i++) {
        const p = portMap[ports[i]];
        if (!p) continue;
        const nr = r + p.dr;
        const nc = c + p.dc;
        if (!this.isTrainTrack(nr, nc)) continue;
        const nbDef = STRUCTURE_DEFS[this.cells[nr][nc].structure.id];
        const nbPorts = (nbDef && nbDef.trackPorts) || ["N", "E", "S", "W"];
        if (nbPorts.includes(p.opp)) {
          out.push(makeNeighborEntry(nr, nc, p.heading));
        }
      }
      return out;
    }

    isMountainCoaster(r, c) {
      if (!this.inBounds(r, c)) return false;
      const s = this.cells[r][c].structure;
      if (!s) return false;
      const def = STRUCTURE_DEFS[s.id];
      return Boolean(def && def.isCoaster);
    }

    getMountainCoasterNeighbors(r, c) {
      const out = [];
      if (!this.isMountainCoaster(r, c)) return out;
      const s = this.cells[r][c].structure;
      const def = STRUCTURE_DEFS[s.id];
      const ports = (def && def.coasterPorts) || (s.id.endsWith("_ew") ? ["E", "W"] : ["N", "S"]);

      const portMap = {
        N: { dr: -1, dc: 0, opp: "S", heading: "ne" },
        S: { dr: 1, dc: 0, opp: "N", heading: "sw" },
        E: { dr: 0, dc: 1, opp: "W", heading: "se" },
        W: { dr: 0, dc: -1, opp: "E", heading: "nw" },
      };

      for (let i = 0; i < ports.length; i++) {
        const p = portMap[ports[i]];
        if (!p) continue;
        const nr = r + p.dr;
        const nc = c + p.dc;
        if (!this.isMountainCoaster(nr, nc)) continue;
        const nbDef = STRUCTURE_DEFS[this.cells[nr][nc].structure.id];
        const nbPorts = (nbDef && nbDef.coasterPorts) || ["N", "E", "S", "W"];
        if (nbPorts.includes(p.opp)) {
          out.push(makeNeighborEntry(nr, nc, p.heading));
        }
      }
      return out;
    }

    isWalkableForGuest(r, c) {
      if (!this.inBounds(r, c)) return false;
      const cell = this.cells[r][c];
      if (cell.structure) {
        const def = STRUCTURE_DEFS[cell.structure.id];
        return Boolean(def && def.walkable);
      }
      return (
        cell.water === null &&
        cell.isFlat &&
        VILLAGE_WALK_SURFACES.has(cell.surface) &&
        !cell.flora
      );
    }

    _walkableExitElevAtEdge(r, c, edgeDir) {
      if (!this.inBounds(r, c)) return null;
      const cell = this.cells[r][c];
      const s = cell.structure;
      if (!s) {
        if (
          cell.water === null &&
          cell.isFlat &&
          VILLAGE_WALK_SURFACES.has(cell.surface) &&
          !cell.flora
        ) {
          return cell.minLevel;
        }
        return null;
      }
      const def = STRUCTURE_DEFS[s.id];
      if (!def || !def.walkable) return null;

      if (
        s.category === "walkway" ||
        def.skatable ||
        s.category === "rail_platform" ||
        s.category === "lift_station"
      ) {
        return cell.minLevel;
      }
      if (s.category === "stairs") {
        const spec = STAIRS_SPECS[s.id];
        if (!spec) return null;
        if (edgeDir === spec.lowEdge) return cell.minLevel;
        if (edgeDir === spec.highEdge) return cell.minLevel + 1;
        return null;
      }
      if (def.edges && def.edges.includes(edgeDir)) {
        return cell.minLevel;
      }
      return null;
    }

    getConnectedWalkNeighbors(r, c) {
      const out = [];
      if (!this.isWalkableForGuest(r, c)) return out;

      for (let i = 0; i < EDGE_NEIGHBORS.length; i++) {
        const e = EDGE_NEIGHBORS[i];
        const nr = r + e.dr;
        const nc = c + e.dc;
        if (!this.inBounds(nr, nc) || !this.isWalkableForGuest(nr, nc)) continue;

        const myExitLv = this._walkableExitElevAtEdge(r, c, e.edge);
        const nbExitLv = this._walkableExitElevAtEdge(nr, nc, e.opp);
        if (myExitLv !== null && nbExitLv !== null && myExitLv === nbExitLv) {
          out.push(makeNeighborEntry(nr, nc, e.code));
        }
      }
      return out;
    }

    isNavigableWater(r, c) {
      return this.isSkatingSurface(r, c);
    }

    _computeFloodlightDownslope(r, c) {
      const z0 = this.getTerrainZ(r, c, 4, 4);
      const grad = this.getSlopeGradient(r, c, 4, 4);
      let sumDr = grad.downU * 2.2;
      let sumDc = grad.downV * 2.2;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (!this.inBounds(nr, nc)) continue;
          const nb = this.cells[nr][nc];
          const dist = Math.hypot(dr, dc);
          const drop = (z0 - this.getTerrainZ(nr, nc, 4, 4)) / dist;
          if (drop < -0.25) continue;

          let w = Math.max(0, drop) * 1.35;
          if (nb.water === null && GROOMABLE_SURFACES.has(nb.surface)) {
            w += 2.4 + Math.max(0, drop) * 0.9;
            // Also peek 1 step south (`+1, 0`) on flat piste shoulders so cones angle down-valley along the run
            if (drop === 0 && this.inBounds(nr + 1, nc)) {
              const dropSouth = z0 - this.getTerrainZ(nr + 1, nc, 4, 4);
              if (dropSouth >= 0) {
                sumDr += 0.95;
              }
            }
          }
          if (w > 0) {
            sumDr += (dr / dist) * w;
            sumDc += (dc / dist) * w;
          }
        }
      }

      const mag = Math.hypot(sumDr, sumDc);
      const downDr = mag > 1e-4 ? sumDr / mag : 0.70710678;
      const downDc = mag > 1e-4 ? sumDc / mag : 0.70710678;

      const rawSx = (downDc - downDr) * 64.0;
      const rawSy = (downDr + downDc) * 32.0;
      const sMag = Math.hypot(rawSx, rawSy) || 1.0;
      const downSx = rawSx / sMag;
      const downSy = rawSy / sMag;

      return {
        downDr,
        downDc,
        downSx,
        downSy,
        coneAngleRad: Math.atan2(downSy, downSx),
      };
    }

    _classifyStructureEmissiveKind(id, baseId, def) {
      if (def && def.light && def.light.emissiveKind) {
        return def.light.emissiveKind;
      }
      if (baseId === "niseko_ramen_bar") return "ramen_bar";
      if (baseId === "stone_chapel") return "chapel";
      if (baseId === "town_rathaus") return "rathaus";
      if (baseId === "glockenspiel_tower") return "glockenspiel";
      if (baseId === "street_light_garland") return "garland";
      if (baseId === "festival_bunting_arch") return "bunting";
      if (
        baseId === "kapellbrucke_bridge" ||
        baseId === "suspension_skybridge" ||
        baseId === "stone_arch_bridge"
      ) {
        return "bridge_lanterns";
      }
      if (baseId === "raclette_hearth_stall") return "raclette_fire";
      if (baseId === "winter_carousel") return "carousel";
      if (baseId === "gluhwein_pyramid") return "pyramid";
      if (baseId === "ice_palace_arch") return "ice_palace";
      if (
        baseId === "giant_snow_sculpture" ||
        baseId === "crystal_ice_sculpture" ||
        baseId === "frozen_fountain"
      ) {
        return "ice_sculpture";
      }
      if (baseId === "gondola_dj_booth") return "dj_booth";
      if (baseId === "snow_cinema_screen") return "cinema_screen";
      if (baseId === "firepit_lounge" || baseId === "chestnut_cart") return "firepit";
      if (baseId === "fireworks_mortar") return "fireworks_mortar";
      if (baseId === "holiday_tree") return "holiday_tree";
      if (baseId === "alpine_lamp") return "lamp";
      if (baseId === "alpine_photo_frame") return "photo_frame";
      if (baseId === "ice_hotel_suite") return "ice_hotel";
      if (baseId === "stargaze_igloo") return "igloo";
      if (
        baseId === "schirmbar_umbrella" ||
        baseId === "heated_patio_tables" ||
        baseId === "christmas_market_stall" ||
        baseId === "cocoa_kiosk" ||
        baseId === "alphorn_band_stage"
      ) {
        return "market_stall";
      }
      if (def && def.category === "lift_station") return "lift_station";
      return "chalet";
    }

    /**
     * Night Mode 2.0 Directional & Emissive Light Descriptors (`cached` by `world.version` -> 0 allocs/frame!).
     * Provides local downhill piste vectors `(downDr, downDc)` for `slope_floodlight` & `neon_park_light`
     * plus rich `emissiveKind` tags for `1:1` crisp pixel window & lantern rendering.
     */
    getNightLightDescriptors() {
      if (this._nightLightsCache && this._nightLightsCacheVer === this.version) {
        return this._nightLightsCache;
      }

      const lights = [];
      const n = this.size;
      const seen2x2 = new Set();

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cell = this.cells[r][c];
          const baseZ = cell.minLevel * ELEV_STEP_Z;

          if (cell.flora && FLORA_DEFS[cell.flora] && FLORA_DEFS[cell.flora].light) {
            const fl = FLORA_DEFS[cell.flora];
            const L = fl.light;
            const isNeon = cell.flora === "neon_park_light";
            const isDirectional = cell.flora === "slope_floodlight" || isNeon;
            const dirVec = isDirectional
              ? this._computeFloodlightDownslope(r, c)
              : {
                  downDr: 0.70710678,
                  downDc: 0.70710678,
                  downSx: 0.0,
                  downSy: 1.0,
                  coneAngleRad: Math.PI * 0.5,
                };
            const emissiveKind = isNeon
              ? "neon_park_cone"
              : cell.flora === "slope_floodlight"
              ? "floodlight_cone"
              : L.kind || "floodlight";

            lights.push({
              r,
              c,
              u: 4.0,
              v: 4.0,
              level: cell.minLevel,
              baseZ,
              mastZ: baseZ + 3.1,
              z: baseZ + (L.liftZ || 2.5),
              radius: L.radius,
              color: L.color,
              intensity: L.intensity || 1.0,
              flicker: Boolean(L.flicker),
              kind: L.kind || "floodlight",
              emissiveKind,
              emissivePreset: emissiveKind,
              directional: isDirectional,
              directionalLight: isDirectional,
              downDr: dirVec.downDr,
              downDc: dirVec.downDc,
              downSx: dirVec.downSx,
              downSy: dirVec.downSy,
              coneAngleRad: dirVec.coneAngleRad,
              targetR: r + dirVec.downDr * 1.25,
              targetC: c + dirVec.downDc * 1.25,
              id: cell.flora,
              baseId: cell.flora,
            });
          }

          if (cell.water === "thermal_spring" || cell.water === "glacier_crevasse") {
            const eKind = cell.water === "thermal_spring" ? "spring" : "crevasse";
            lights.push({
              r,
              c,
              u: 4.0,
              v: 4.0,
              level: cell.minLevel,
              baseZ,
              z: baseZ + 0.5,
              radius: cell.water === "thermal_spring" ? 2.4 : 2.0,
              color: cell.water === "thermal_spring" ? "#7ee8fa" : "#56dcff",
              intensity: cell.water === "thermal_spring" ? 0.68 : 0.58,
              flicker: cell.water === "thermal_spring",
              kind: "spring",
              emissiveKind: eKind,
              emissivePreset: eKind,
              directional: false,
              downDr: 0.70710678,
              downDc: 0.70710678,
              id: cell.water,
              baseId: cell.water,
            });
          }

          const s = cell.structure;
          if (!s) continue;

          if (COMPOSITE_2X2_IDS.has(s.baseId)) {
            const gKey = `${s.baseId}:${s.parentR},${s.parentC}`;
            if (seen2x2.has(gKey)) continue;
            seen2x2.add(gKey);
            const specL = COMPOSITE_2X2_LIGHTS[s.baseId] || COMPOSITE_2X2_LIGHTS.grand_hotel_2x2;
            const eKind = specL.emissiveKind || "hotel_2x2";
            lights.push({
              r: s.parentR + 0.5,
              c: s.parentC + 0.5,
              parentR: s.parentR,
              parentC: s.parentC,
              footprint: 2,
              u: 4.0,
              v: 4.0,
              level: cell.minLevel,
              baseZ,
              z: baseZ + specL.liftZ,
              radius: specL.radius,
              color: specL.color,
              intensity: specL.intensity,
              flicker: Boolean(specL.flicker),
              kind: specL.kind,
              emissiveKind: eKind,
              emissivePreset: eKind,
              directional: false,
              downDr: 0.70710678,
              downDc: 0.70710678,
              id: s.baseId,
              baseId: s.baseId,
            });
            continue;
          }

          const def = STRUCTURE_DEFS[s.id];
          if (def && def.light) {
            const eKind = this._classifyStructureEmissiveKind(s.id, s.baseId, def);
            lights.push({
              r,
              c,
              footprint: 1,
              u: 4.0,
              v: 4.0,
              level: cell.minLevel,
              baseZ,
              z: baseZ + (def.light.liftZ || 1.6),
              radius: def.light.radius,
              color: def.light.color,
              intensity: def.light.intensity || 0.85,
              flicker: Boolean(def.light.flicker),
              kind: def.light.kind || "warm",
              emissiveKind: eKind,
              emissivePreset: eKind,
              directional: false,
              downDr: 0.70710678,
              downDc: 0.70710678,
              axis: def.axis || (s.id.endsWith("_ew") ? "ew" : s.id.endsWith("_ns") ? "ns" : null),
              id: s.id,
              baseId: s.baseId,
            });
          }
        }
      }

      this._nightLightsCache = lights;
      this._nightLightsCacheVer = this.version;
      return lights;
    }

    getLightSources() {
      return this.getNightLightDescriptors();
    }

    computeResortStats() {
      const n = this.size;
      const total = n * n;
      let pisteCells = 0;
      let cobbleCells = 0;
      let builtCells = 0;
      let treeCells = 0;
      let floodlightCount = 0;
      let snowCannonCount = 0;
      let hotelCount = 0;
      let shopCount = 0;
      let parkFeatureCount = 0;
      const surfaceCounts = {};
      for (let i = 0; i < SURFACES.length; i++) {
        surfaceCounts[SURFACES[i]] = 0;
      }

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cell = this.cells[r][c];
          surfaceCounts[cell.surface] = (surfaceCounts[cell.surface] || 0) + 1;
          if (GROOMABLE_SURFACES.has(cell.surface)) pisteCells++;
          if (VILLAGE_WALK_SURFACES.has(cell.surface)) cobbleCells++;
          if (cell.structure) {
            builtCells++;
            if (cell.structure.slice === "nw" || cell.structure.role === "hotel") {
              if (!cell.structure.slice || cell.structure.slice === "nw") hotelCount++;
            }
            if (cell.structure.category === "building" || cell.structure.category === "amenity") shopCount++;
          }
          if (cell.flora) {
            const fDef = FLORA_DEFS[cell.flora];
            if (cell.flora === "slope_floodlight" || cell.flora === "neon_park_light") floodlightCount++;
            else if (fDef && fDef.boostsSnow) snowCannonCount++;
            else if (fDef && fDef.category === "park") parkFeatureCount++;
            else if (fDef && fDef.category === "nature") treeCells++;
          }
        }
      }

      const avgPisteQuality = this.getAveragePisteQuality();
      const natureRatio = (total - builtCells) / total;

      return {
        totalCells: total,
        pisteCells,
        cobbleCells,
        builtCells,
        treeCells,
        floodlightCount,
        snowCannonCount,
        parkFeatureCount,
        hotelCount,
        shopCount,
        liftCount: this.lifts.length,
        runCounts: Object.assign({}, this.runCounts),
        avgPisteQuality,
        naturePercent: Math.round(natureRatio * 100),
        builtPercent: Math.round((builtCells / total) * 100),
        harmonyScore: clamp(Math.round(72 + this.lifts.length * 4 + Math.min(24, shopCount)), 45, 100),
        status: "Grand Alpine Resort",
        surfaceCounts,
        biomeCounts: surfaceCounts,
      };
    }

    computeHarmonyStats() {
      return this.computeResortStats();
    }

    // =========================================================================
    // 5 Reference-Grade `28x28` Showcase Presets (`loadPreset(id, seed)`)
    // =========================================================================

    loadPreset(presetName = "zermatt_grand", seed = null, recordUndo = false) {
      const rawName = String(presetName || "zermatt_grand").toLowerCase().trim();
      const aliases = {
        default: "zermatt_grand",
        zermatt: "zermatt_grand",
        emerald_cascade: "zermatt_grand",
        twins: "twin_summits",
        twin_peaks: "twin_summits",
        park: "night_park",
        freestyle: "night_park",
        random: "random_mountain",
        random_island: "random_mountain",
        procedural: "random_mountain",
        blank: "fresh_powder",
        blank_meadow: "fresh_powder",
        powder: "fresh_powder",
      };
      const pName = aliases[rawName] || rawName;
      if (seed !== null && seed !== undefined && Number.isFinite(Number(seed))) {
        this.seed = Number(seed);
      }
      if (recordUndo) {
        this._recordUndoBeforeChange();
      } else {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
      }

      this.presetName = pName;
      this.generationId = (this.generationId || 0) + 1;
      this._nextLiftSeq = 1;
      const prevSuppress = this._suppressHistory;
      const prevBuilding = this._buildingPreset;
      this._suppressHistory = true;
      this._buildingPreset = true;

      try {
        this._initEmptyGrid(this.size || 28, "untouched_powder");
        if (pName === "twin_summits") {
          this._buildTwinSummits();
        } else if (pName === "night_park") {
          this._buildNightPark();
        } else if (pName === "random_mountain") {
          this._buildRandomMountain(this.seed);
        } else if (pName === "fresh_powder") {
          this._buildFreshPowder();
        } else {
          this.presetName = "zermatt_grand";
          this._buildZermattGrand();
        }
        this._reconcileCellsAfterTerrainEdit();
        this._analyzeSkiRuns();
        this._seedInitialPisteTracks();
      } finally {
        this._suppressHistory = prevSuppress;
        this._buildingPreset = prevBuilding;
      }

      this._notifyChange("preset", { full: true });
      return true;
    }

    generatePreset(presetName = "zermatt_grand", seed = null, recordUndo = false) {
      return this.loadPreset(presetName, seed, recordUndo);
    }

    generateMountain(seed = null, recordUndo = true) {
      return this.loadPreset("random_mountain", seed, recordUndo);
    }

    _sc(val28) {
      return clamp(Math.round((val28 * this.size) / 28), 0, this.size - 1);
    }

    _fillRectSurface(r0, c0, r1, c1, surfaceId) {
      const ra = clamp(Math.min(r0, r1), 0, this.size - 1);
      const rb = clamp(Math.max(r0, r1), 0, this.size - 1);
      const ca = clamp(Math.min(c0, c1), 0, this.size - 1);
      const cb = clamp(Math.max(c0, c1), 0, this.size - 1);
      for (let r = ra; r <= rb; r++) {
        for (let c = ca; c <= cb; c++) {
          if (this.cells[r][c].water === null) {
            this.cells[r][c].surface = surfaceId;
            this.cells[r][c].biome = surfaceId;
          }
        }
      }
    }

    _seedInitialPisteTracks() {
      this.skiTracks = [];
      this._skiTrackHead = 0;
      const runs = this.skiRuns;
      for (let i = 0; i < runs.length; i++) {
        const run = runs[i];
        for (let j = 0; j < run.cells.length; j++) {
          const pt = run.cells[j];
          const phase = j * 0.9 + i * 1.4;
          const u = 4.0 + Math.cos(phase) * 1.7;
          const v = 4.0 + Math.sin(phase) * 1.9;
          const ang = 2.4 + Math.sin(phase) * 0.45;
          const tr = this.addSkiTrack(pt.r, pt.c, clamp(u, 1, 7), clamp(v, 1, 7), ang, "ski");
          if (tr) {
            tr.age = (j % 5) * 1.8;
          }
        }
      }
    }

    /**
     * Multi-Scale Natural Forest, Crag, Scree & Shrub Clumping Pass:
     * Frames ski pistes, creeks, and village terraces with elevation-zoned groves
     * (`spruce_tall`, `spruce_med`, `golden_larch`, `weeping_hemlock`, `dwarf_krummholz`,
     * `frosted_birch`, `alpine_shrub_cluster`, `fallen_snow_log`, `summit_crag`, `snow_boulder`)
     * and guarantees ZERO bare `3x3` white `untouched_powder` patches anywhere!
     */
    _populateNaturalMountainDetail(seed = 2026, density = 0.68) {
      const n = this.size;
      this._reconcileCellsAfterTerrainEdit();

      const hasAdjacentBuildingOrLift = (r, c) => {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!this.inBounds(r + dr, c + dc)) continue;
            const nb = this.cells[r + dr][c + dc];
            if (nb.liftId) return true;
            if (nb.structure && (nb.structure.category === "building" || nb.structure.category === "lift_station")) {
              // Keep immediate south/east doorway sightline open on flat village tiles
              if (dr === -1 && dc === 0) return true;
            }
          }
        }
        return false;
      };

      const pickElevationSpecies = (r, c, lv, isFlat, nVal, hVal) => {
        if (lv >= 4) {
          if (hVal < 0.24) return hVal < 0.12 ? "summit_crag_v0" : "summit_crag_v1";
          if (hVal < 0.56) return hVal < 0.4 ? "snow_boulder_v0" : "snow_boulder_v1";
          return hVal < 0.78 ? "dwarf_krummholz_v0" : "dwarf_krummholz_v1";
        }
        if (lv === 3) {
          if (hVal < 0.14) return "summit_crag_v1";
          if (hVal < 0.34) return hVal < 0.24 ? "snow_boulder_v0" : "snow_boulder_v1";
          if (hVal < 0.58) return hVal < 0.46 ? "dwarf_krummholz_v0" : "dwarf_krummholz_v1";
          if (hVal < 0.8) return hVal < 0.69 ? "spruce_med_v0" : "spruce_med_v1";
          return hVal < 0.9 ? "weeping_hemlock_v0" : "golden_larch_v0";
        }
        if (lv === 2) {
          if (nVal > 0.6) {
            if (hVal < 0.32) return hVal < 0.16 ? "spruce_tall_v0" : "spruce_tall_v1";
            if (hVal < 0.58) return hVal < 0.45 ? "golden_larch_v0" : "golden_larch_v1";
            if (hVal < 0.8) return hVal < 0.69 ? "weeping_hemlock_v0" : "weeping_hemlock_v1";
            return hVal < 0.9 ? "fallen_snow_log" : "alpine_shrub_cluster";
          }
          if (hVal < 0.38) return hVal < 0.19 ? "spruce_med_v0" : "spruce_med_v1";
          if (hVal < 0.64) return hVal < 0.51 ? "golden_larch_v0" : "golden_larch_v1";
          if (hVal < 0.82) return "snow_boulder_v0";
          return isFlat && hVal > 0.93 ? "wildlife_feeding_rack" : "alpine_shrub_cluster";
        }
        // Lv 0..1 lower slopes & valley glades
        if (hVal < 0.28) return hVal < 0.14 ? "spruce_tall_v0" : "spruce_tall_v1";
        if (hVal < 0.5) return hVal < 0.39 ? "spruce_med_v0" : "spruce_med_v1";
        if (hVal < 0.68) return hVal < 0.59 ? "frosted_birch_v0" : "frosted_birch_v1";
        if (hVal < 0.82) return hVal < 0.75 ? "golden_larch_v0" : "weeping_hemlock_v1";
        if (hVal < 0.91) return "alpine_shrub_cluster";
        return "fallen_snow_log";
      };

      // Pass A: Natural multi-octave surface & grove clumping on unbuilt powder/scree cells
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cell = this.cells[r][c];
          if (cell.water !== null || cell.structure !== null || cell.flora !== null || cell.liftId) continue;
          if (cell.surface !== "untouched_powder" && cell.surface !== "alpine_scree") continue;

          const lv = cell.minLevel;
          const groveN = fbm2D(r * 0.28, c * 0.28, seed + 313, 3);
          const hVal = hash2D(r, c, seed + 991);

          // Add subtle alpine surface variety on exposed ridges & sunny aprons
          if (cell.surface === "untouched_powder") {
            if (lv >= 4 && groveN < 0.42) {
              cell.surface = hVal < 0.55 ? "glacier_ice" : "alpine_scree";
              cell.biome = cell.surface;
            } else if (lv === 3 && !cell.isFlat && groveN < 0.36) {
              cell.surface = hVal < 0.5 ? "wind_hardpack" : "alpine_scree";
              cell.biome = cell.surface;
            } else if (lv === 0 && groveN < 0.32 && hVal < 0.35) {
              cell.surface = "spring_slush";
              cell.biome = cell.surface;
            }
          }

          if (hasAdjacentBuildingOrLift(r, c) && hVal > 0.42) continue;

          const threshold = 1.0 - density;
          if (groveN + hVal * 0.28 > threshold) {
            const sp = pickElevationSpecies(r, c, lv, cell.isFlat, groveN, hVal);
            if (sp && FLORA_DEFS[sp] && (cell.isFlat || FLORA_DEFS[sp].allowSlope)) {
              cell.flora = sp;
            }
          }
        }
      }

      // Pass B: Strict Zero-Bare-Patch Guarantee!
      // Any `3x3` window anywhere (or `2x2` window on mid-mountain slopes `r < 20`) of bare unbuilt snow
      // receives an elevation-authentic natural tree, larch, krummholz, or granite boulder!
      const isBareWhite = (rr, cc) => {
        const sub = this.cells[rr][cc];
        return (
          sub.water === null &&
          sub.structure === null &&
          sub.flora === null &&
          (sub.surface === "untouched_powder" || sub.surface === "wind_hardpack" || sub.surface === "spring_slush")
        );
      };

      const plantNaturalFill = (rr, cc) => {
        if (this.cells[rr][cc].liftId) return;
        const cell = this.cells[rr][cc];
        const hVal = hash2D(rr, cc, seed + 4242);
        const sp =
          cell.minLevel >= 4
            ? hVal < 0.45
              ? "summit_crag_v0"
              : "snow_boulder_v0"
            : cell.minLevel === 3
            ? hVal < 0.42
              ? "dwarf_krummholz_v0"
              : hVal < 0.75
              ? "spruce_med_v0"
              : "snow_boulder_v1"
            : hVal < 0.36
            ? "spruce_tall_v0"
            : hVal < 0.66
            ? "spruce_med_v1"
            : hVal < 0.86
            ? "golden_larch_v0"
            : "weeping_hemlock_v0";
        if (FLORA_DEFS[sp] && (cell.isFlat || FLORA_DEFS[sp].allowSlope)) {
          cell.flora = sp;
        }
      };

      const midLimit = Math.round((20 * n) / 28);
      for (let r = 0; r < Math.min(n - 1, midLimit); r++) {
        for (let c = 0; c < n - 1; c++) {
          if (
            isBareWhite(r, c) &&
            isBareWhite(r, c + 1) &&
            isBareWhite(r + 1, c) &&
            isBareWhite(r + 1, c + 1)
          ) {
            plantNaturalFill(r, c);
          }
        }
      }

      for (let r = 1; r < n - 1; r++) {
        for (let c = 1; c < n - 1; c++) {
          let allBare = true;
          for (let dr = -1; dr <= 1 && allBare; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (!isBareWhite(r + dr, c + dc)) {
                allBare = false;
                break;
              }
            }
          }
          if (allBare) {
            plantNaturalFill(r, c);
          }
        }
      }
    }

    /**
     * PRESET 1 (DEFAULT): `zermatt_grand` (`28x28`)
     * Curved U-Shaped Matterhorn Glacial Amphitheater & Grand Winter Festival Valley:
     *   - Central `Lv 4` Matterhorn Pyramid Horn (`r = 0..5, c = 10..18`) crowned with `sphinx_observatory_2x2`,
     *     `summit_restaurant`, `eagles_nest_skywalk`, `alpine_photo_frame`, & Red Gondola Summit Station.
     *   - Flanking West (`c = 0..5`) & East (`c = 22..27`) `Lv 3-4` granite `alpine_scree` & evergreen shoulders curving forward.
     *   - Cascading Waterfall Gorge (`c = 12`) spanned by high `suspension_skybridge_ew`, mid-mountain `timber_bridge_ew`
     *     beside `watermill_lodge`, rack-railway `stone_viaduct_ew`, and dual `kapellbrucke_bridge_ew` spans feeding the
     *     `Lv 0` Frozen Skating & 3v3 Pond-Hockey Lagoon.
     *   - Hero Central `Lv 1-2` Mid-Mountain Sun-Terrace & Grand Winter Festival Square (`r = 11..19, c = 8..20`) right in
     *     the boot viewport (`festive_mosaic_cobble` & `crystal_ice_promenade`, `festival_ferris_wheel_2x2`, `winter_carousel`,
     *     `gluhwein_pyramid`, `ice_palace_arch`, `giant_snow_sculpture`, `3` `fireworks_mortar`s, `raclette_hearth_stall`,
     *     `festival_bunting_arch`, `gondola_dj_booth`, `snow_cinema_screen`, `glockenspiel_tower`, `town_rathaus`,
     *     `stone_chapel`, `grand_hotel_2x2`, and closed-loop Swiss mountain rack-railway).
     *   - Connected `10`-tile S-curving `mountain_coaster` (`Lv 3 -> Lv 1`), `6` Simultaneous Lifts, Floodlit Night Ski Ribbons,
     *     and dense multi-species spruce/larch/hemlock forest islands (`0` bare mid-slope dead zones!).
     */
    _buildZermattGrand() {
      const n = this.size;
      const H = this.cornerZ;
      const s = (v) => this._sc(v);

      // 1. Curved U-Shaped Glacial Amphitheater Bowl + Central Matterhorn Pyramid Horn (`Lv 4 -> Lv 0`)
      for (let cr = 0; cr <= n; cr++) {
        const u = (cr * 28) / n;
        for (let cc = 0; cc <= n; cc++) {
          const v = (cc * 28) / n;
          let z = 0;

          if (u <= 4.1) {
            // North Crown: Central Matterhorn Horn (`v = 11..18`), NW Peak (`v = 0..5`), NE Glacier Crown (`v = 22..28`), flanked by Lv 3 cols
            if ((v >= 11 && v <= 18) || v <= 5 || v >= 22) {
              z = 4;
            } else {
              z = 3;
            }
          } else if (u <= 5.1 && v >= 22) {
            // NE Glacier Ice Crown extends 1 row further south
            z = 4;
          } else if (u <= 9.1) {
            // Upper Glacial Bowl (`Lv 3`)
            z = 3;
          } else if (u <= 11.1 && (v <= 3.1 || v >= 24.9)) {
            // Flanking West & East `Lv 3` evergreen/granite shoulders curving forward!
            z = 3;
          } else if (u <= 13.1) {
            // Mid-Mountain Sun-Terrace Overlook & Coaster Bench (`Lv 2`)
            z = 2;
          } else if (u <= 15.1 && (v <= 2.1 || v >= 25.9)) {
            // Outer West & East `Lv 2` amphitheater arms curving forward around the central terrace!
            z = 2;
          } else if (u <= 20.1) {
            // Hero Central `Lv 1` Grand Winter Festival Square & Ski Base (`r = 14..19`)
            z = 1;
          } else {
            // Lower Valley Lagoon, Historic Quarter & Thermal Spa (`Lv 0`, `r = 21..27`)
            z = 0;
          }
          H[cr][cc] = z;
        }
      }
      this._enforceGlobalCornerGradient();
      this._reconcileCellsAfterTerrainEdit();

      // 2. Sculpted Scree Flanks, Glacier Ice Crown & Connected Ski Runs (`Lv 4 -> Lv 1`)
      // Steep granite scree flanks framing the Matterhorn Horn & East/West Amphitheater Shoulders
      this._fillRectSurface(s(0), s(9), s(4), s(10), "alpine_scree");
      this._fillRectSurface(s(0), s(18), s(4), s(19), "alpine_scree");
      this._fillRectSurface(s(5), s(0), s(11), s(1), "alpine_scree");
      this._fillRectSurface(s(6), s(26), s(12), s(27), "alpine_scree");

      // High NE Glacier Ice Bowl (`Lv 3..4`)
      this._fillRectSurface(s(0), s(22), s(7), s(27), "glacier_ice");
      this._fillRectSurface(s(5), s(20), s(8), s(24), "wind_hardpack");

      // World-Cup Race Course (`c = 3..4, r = 2..14`)
      this._fillRectSurface(s(2), s(1), s(4), s(4), "groomed_piste");
      this._fillRectSurface(s(4), s(3), s(14), s(4), "groomed_piste");

      // Beginner Ski-School Bunny Slope (`c = 5..6, r = 10..14`)
      this._fillRectSurface(s(10), s(5), s(14), s(6), "groomed_piste");

      // Sun-Bowl Blue Cruiser Run (`c = 8..10, r = 5..14`)
      this._fillRectSurface(s(5), s(8), s(14), s(10), "groomed_piste");

      // Main Matterhorn Panorama & Torchlight Parade Run (`c = 14..15, r = 3..14`)
      this._fillRectSurface(s(3), s(14), s(14), s(15), "groomed_piste");

      // Matterhorn Black-Diamond Mogul Chute (`c = 17..18, r = 4..14`)
      this._fillRectSurface(s(4), s(17), s(11), s(18), "mogul_chute");
      this._fillRectSurface(s(12), s(17), s(14), s(18), "groomed_piste");

      // Neon Night Freestyle Terrain Park (`c = 19..20, r = 7..14`)
      this._fillRectSurface(s(7), s(19), s(14), s(20), "groomed_piste");

      // Family Davos Toboggan & Snow-Tubing Chute (`c = 23..24, r = 9..16`)
      this._fillRectSurface(s(9), s(23), s(16), s(24), "tubing_chute");

      // Husky Dogsled & Nordic Cross-Country Forest Trail (`c = 25, r = 10..20`)
      this._fillRectSurface(s(10), s(25), s(20), s(25), "nordic_track");

      // 3. Hero Central `Lv 1-2` Mid-Mountain Sun-Terrace & Grand Winter Festival Square (`r = 11..19, c = 6..20`)
      // `Lv 2` Sun-Terrace Overlook (`r = 11..12, c = 9..16`)
      this._fillRectSurface(s(11), s(9), s(12), s(11), "timber_deck");
      this._fillRectSurface(s(11), s(13), s(12), s(16), "festive_mosaic_cobble");

      // `Lv 1` Grand Winter Festival Square (`r = 14..19, c = 6..20`)
      this._fillRectSurface(s(14), s(6), s(19), s(20), "alpine_cobble");
      this._fillRectSurface(s(16), s(8), s(18), s(11), "festive_mosaic_cobble");
      this._fillRectSurface(s(16), s(13), s(18), s(15), "crystal_ice_promenade");
      this._fillRectSurface(s(16), s(16), s(18), s(18), "festive_mosaic_cobble");
      this._fillRectSurface(s(16), s(19), s(18), s(19), "timber_deck");

      // `Lv 0` Valley Lagoon Promenade, Christmas Market, Historic Quarter & Transit Avenue (`r = 21..27`)
      this._fillRectSurface(s(21), s(1), s(26), s(10), "alpine_cobble");
      this._fillRectSurface(s(21), s(15), s(26), s(22), "alpine_cobble");
      this._fillRectSurface(s(21), s(6), s(23), s(9), "red_brick");
      this._fillRectSurface(s(21), s(16), s(23), s(18), "slate_flagstone");
      this._fillRectSurface(s(23), s(21), s(24), s(24), "timber_deck");
      this._fillRectSurface(s(26), s(2), s(26), s(24), "asphalt_road");
      this._fillRectSurface(s(25), s(10), s(25), s(21), "packed_snow_path");
      this._fillRectSurface(s(27), s(3), s(27), s(23), "packed_snow_path");

      // 4. Cascading Waterfall Gorge (`c = 12`, `Lv 4 -> 3 -> 2 -> 1 -> 0`) + Skating Lagoon + Thermal Spring + Crevasse!
      const cCreek = s(12);
      for (let r = s(4); r <= s(21); r++) {
        this.cells[r][cCreek].water = "meltwater_brook";
      }
      if (this.cells[s(5)][cCreek + 1] && this.cells[s(5)][cCreek + 1].isFlat) {
        this.cells[s(5)][cCreek + 1].water = "meltwater_brook";
      }

      // `Lv 0` Frozen Skating & 3v3 Pond-Hockey Lagoon (`r = 22..25, c = 11..14`)
      for (let r = s(22); r <= s(25); r++) {
        for (let c = s(11); c <= s(14); c++) {
          if (this.cells[r][c].isFlat && this.cells[r][c].minLevel <= 2) {
            this.cells[r][c].water = "frozen_lake";
          }
        }
      }

      // Steaming Turquoise Thermal Spring (`r = 21..22, c = 24..25`)
      for (let r = s(21); r <= s(22); r++) {
        for (let c = s(24); c <= s(25); c++) {
          if (this.cells[r][c].isFlat && this.cells[r][c].minLevel <= 2) {
            this.cells[r][c].water = "thermal_spring";
          }
        }
      }

      // High-Summit Glowing Glacier Crevasse (`r = 2, c = 24..25`)
      for (let c = s(24); c <= s(25); c++) {
        if (this.inBounds(s(2), c) && this.cells[s(2)][c].isFlat) {
          this.cells[s(2)][c].water = "glacier_crevasse";
        }
      }

      this._reconcileCellsAfterTerrainEdit();

      // 5. Gorge Bridges (`suspension_skybridge_ew`, `timber_bridge_ew`, `kapellbrucke_bridge_ew`), Stairs & Retaining Walls!
      this.placeStructure(s(6), cCreek, "suspension_skybridge_ew");
      this.placeStructure(s(11), cCreek, "timber_bridge_ew");
      this.placeStructure(s(17), cCreek, "kapellbrucke_bridge_ew");
      this.placeStructure(s(21), cCreek, "kapellbrucke_bridge_ew");

      // `Lv 2 -> Lv 1` Sun-Terrace Cliff (`r = 13`)
      this.placeStructure(s(13), s(9), "snow_stairs_n");
      this.placeStructure(s(13), s(16), "covered_escalator_n");
      this.placeStructure(s(13), s(10), "retaining_wall_ew");
      this.placeStructure(s(13), s(11), "retaining_wall_ew");
      this.placeStructure(s(13), s(13), "retaining_wall_ew");

      // `Lv 1 -> Lv 0` Festival Terrace Cliff (`r = 20`)
      this.placeStructure(s(20), s(9), "snow_stairs_n");
      this.placeStructure(s(20), s(16), "covered_escalator_n");
      this.placeStructure(s(20), s(8), "retaining_wall_ew");
      this.placeStructure(s(20), s(10), "retaining_wall_ew");
      this.placeStructure(s(20), s(11), "retaining_wall_ew");
      this.placeStructure(s(20), s(13), "retaining_wall_ew");
      this.placeStructure(s(20), s(14), "retaining_wall_ew");
      this.placeStructure(s(20), s(15), "retaining_wall_ew");
      this.placeStructure(s(20), s(17), "retaining_wall_ew");
      this.placeStructure(s(20), s(18), "retaining_wall_ew");

      // 6. Mid-Mountain Closed-Loop Swiss Rack-Railway (`r = 15..19, c = 7..20`) Framing the Festival Square!
      const rT0 = s(15);
      const rT1 = s(19);
      const cT0 = s(7);
      const cT1 = s(20);
      this.placeStructure(rT0, cT0, "train_track_curve_se");
      this.placeStructure(rT0, cT1, "train_track_curve_sw");
      this.placeStructure(rT1, cT1, "train_track_curve_nw");
      this.placeStructure(rT1, cT0, "train_track_curve_ne");

      for (let c = cT0 + 1; c < cT1; c++) {
        if (c === cCreek) {
          this.placeStructure(rT0, c, "stone_viaduct_ew");
          this.placeStructure(rT1, c, "stone_viaduct_ew");
        } else if (c === s(9) || c === s(16)) {
          this.placeStructure(rT0, c, "rail_crossing_gate_ew");
          this.placeStructure(rT1, c, "rail_crossing_gate_ew");
        } else {
          this.placeStructure(rT0, c, "train_track_ew");
          this.placeStructure(rT1, c, "train_track_ew");
        }
      }

      for (let r = rT0 + 1; r < rT1; r++) {
        this.placeStructure(r, cT0, r === s(17) ? "rail_crossing_gate_ns" : "train_track_ns");
        this.placeStructure(r, cT1, r === s(17) ? "rail_crossing_gate_ns" : "train_track_ns");
      }

      this.placeStructure(s(16), s(6), "valley_train_station");
      this.placeStructure(s(17), s(6), "train_platform_ns");
      this.placeStructure(s(18), s(6), "town_walkway");
      this.placeStructure(s(15), s(27), "rail_tunnel_portal_sw");

      // 7. Connected 10-Tile S-Curving Alpine Mountain Coaster (`Lv 3 -> Lv 2 -> Lv 1` on East Amphitheater Flank!)
      this.placeStructure(s(7), s(22), "mountain_coaster_ns");
      this.placeStructure(s(8), s(22), "mountain_coaster_ns");
      this.placeStructure(s(9), s(22), "mountain_coaster_ns");
      this.placeStructure(s(10), s(22), "mountain_coaster_curve_nw");
      this.placeStructure(s(10), s(21), "mountain_coaster_curve_se");
      this.placeStructure(s(11), s(21), "mountain_coaster_ns");
      this.placeStructure(s(12), s(21), "mountain_coaster_curve_ne");
      this.placeStructure(s(12), s(22), "mountain_coaster_curve_sw");
      this.placeStructure(s(13), s(22), "mountain_coaster_ns");
      this.placeStructure(s(14), s(22), "mountain_coaster_ns");

      // 8. All 6 Diverse Simultaneous Uphill Lift Systems!
      // (1) 3S Panoramic Aerial Tramway: Valley West `(21, 1)` -> NW Summit `(2, 1)`
      this.buildLiftLine(s(21), s(1), s(2), s(1), "tramway_3s");
      // (2) Stepped Cliff Cog Funicular: Valley Promenade `(21, 2)` -> West Ski Terrace `(16, 2)`
      this.buildLiftLine(s(21), s(2), s(16), s(2), "cliff_funicular");
      // (3) Covered Magic Carpet Conveyor: Bunny Slope `(14, 5)` -> `(11, 5)`
      this.buildLiftLine(s(14), s(5), s(11), s(5), "magic_carpet");
      // (4) Express 6-Pack Orange Bubble Chair: Festival Ski Base `(14, 7)` -> Upper Sun-Bowl `(6, 7)`
      this.buildLiftLine(s(14), s(7), s(6), s(7), "bubble_6chair");
      // (5) Red Summit Express Gondola: Festival Ski Base `(14, 16)` -> Matterhorn Crown `(2, 16)`
      this.buildLiftLine(s(14), s(16), s(2), s(16), "gondola");
      // (6) Glacier Bowl Surface T-Bar: Upper Glacier `(8, 23)` -> Glacier Crown `(2, 23)`
      this.buildLiftLine(s(8), s(23), s(2), s(23), "tbar_lift");

      // 9. Matterhorn Crown (`Lv 4`), Sun-Terrace Overlook (`Lv 2`), Grand Winter Festival Square (`Lv 1`) & Valley (`Lv 0`)!
      // Matterhorn Central Horn (`Lv 4`) & NW Summit
      this.placeStructure(s(1), s(13), "sphinx_observatory_2x2");
      this.placeStructure(s(2), s(11), "summit_restaurant");
      this.placeStructure(s(3), s(13), "eagles_nest_skywalk");
      this.placeStructure(s(3), s(17), "alpine_photo_frame");
      this.placeStructure(s(1), s(3), "summit_helipad");

      // `Lv 2` Mid-Mountain Sun-Terrace Overlook (`r = 11..12`)
      this.placeStructure(s(11), s(11), "watermill_lodge");
      this.placeStructure(s(11), s(13), "waffle_hut");
      this.placeStructure(s(11), s(7), "ski_patrol_hut");
      this.placeStructure(s(6), s(21), "winch_cat_bay");
      this.placeStructure(s(12), s(26), "ice_hotel_suite");

      // `Lv 1` Hero Grand Winter Festival Square (`r = 16..18, c = 8..19` + Ski Base `r = 14`)
      this.placeStructure(s(14), s(6), "ski_school_lodge");
      this.placeStructure(s(14), s(11), "lift_ticket_booth");
      this.placeStructure(s(14), s(13), "ski_rental_shop");
      this.placeStructure(s(16), s(8), "festival_ferris_wheel_2x2");
      this.placeStructure(s(16), s(10), "winter_carousel");
      this.placeStructure(s(16), s(11), "gluhwein_pyramid");
      this.placeStructure(s(17), s(10), "festival_bunting_arch_ew");
      this.placeStructure(s(17), s(11), "raclette_hearth_stall");
      this.placeStructure(s(18), s(8), "fireworks_mortar");
      this.placeStructure(s(18), s(9), "festival_bunting_arch_ns");
      this.placeStructure(s(18), s(10), "gondola_dj_booth");
      this.placeStructure(s(18), s(11), "fireworks_mortar");

      this.placeStructure(s(16), s(13), "ice_palace_arch");
      this.placeStructure(s(16), s(14), "giant_snow_sculpture");
      this.placeStructure(s(16), s(15), "fireworks_mortar");
      this.placeStructure(s(16), s(17), "grand_hotel_2x2");
      this.placeStructure(s(16), s(19), "snow_cinema_screen");
      this.placeStructure(s(17), s(13), "festival_bunting_arch_ew");
      this.placeStructure(s(17), s(14), "glockenspiel_tower");
      this.placeStructure(s(17), s(15), "town_rathaus");
      this.placeStructure(s(17), s(16), "town_walkway");
      this.placeStructure(s(17), s(19), "schirmbar_umbrella");
      this.placeStructure(s(18), s(13), "stone_chapel");
      this.placeStructure(s(18), s(14), "niseko_ramen_bar");
      this.placeStructure(s(18), s(15), "apres_tavern");
      this.placeStructure(s(18), s(16), "town_walkway");
      this.placeStructure(s(18), s(17), "chocolatier_shop");
      this.placeStructure(s(18), s(18), "swiss_watchmaker");
      this.placeStructure(s(18), s(19), "heated_patio_tables");
      this.placeStructure(s(17), s(21), "stargaze_igloo");

      // `Lv 0` Lower Valley — Christmas Market (`c = 2..10`), Skating Lagoon (`c = 11..15`), Base Lodge & Thermal Spa (`c = 16..26`)
      this.placeStructure(s(22), s(3), "chalet_bnb");
      this.placeStructure(s(24), s(3), "aframe_cabin");
      this.placeStructure(s(21), s(6), "christmas_market_stall");
      this.placeStructure(s(21), s(7), "holiday_tree");
      this.placeStructure(s(21), s(9), "christmas_market_stall");
      this.placeStructure(s(22), s(6), "alphorn_band_stage");
      this.placeStructure(s(22), s(7), "frozen_fountain");
      this.placeStructure(s(22), s(9), "chestnut_cart");
      this.placeStructure(s(23), s(6), "alpine_bakery");
      this.placeStructure(s(23), s(7), "bookshop_roastery");
      this.placeStructure(s(23), s(9), "cowbell_souvenirs");
      this.placeStructure(s(24), s(9), "cocoa_kiosk");
      this.placeStructure(s(22), s(8), "street_light_garland_ns");

      // Skating & 3v3 Pond-Hockey Lagoon (`r = 22..25, c = 11..15`)
      this.placeStructure(s(22), s(12), "pond_hockey_goal_ns");
      this.placeStructure(s(25), s(12), "pond_hockey_goal_ns");
      this.placeStructure(s(22), s(15), "ice_rink_pad");
      this.placeStructure(s(23), s(15), "ice_curling_lane");
      this.placeStructure(s(21), s(15), "crystal_ice_sculpture");
      this.placeStructure(s(24), s(15), "snowman_trio");

      // Lower East Lodge, Artisans, Thermal Spa & Fleet Row (`c = 16..25, r = 21..25`)
      this.placeStructure(s(21), s(17), "base_lodge_2x2");
      this.placeStructure(s(23), s(17), "cheese_raclette_cellar");
      this.placeStructure(s(23), s(18), "craft_brewhouse");
      this.placeStructure(s(23), s(19), "gear_boutique");
      this.placeStructure(s(24), s(16), "street_light_garland_ns");
      this.placeStructure(s(24), s(18), "ski_lockers");

      this.placeStructure(s(21), s(22), "thermal_spa_2x2");
      this.placeStructure(s(23), s(22), "cedar_hottub");
      this.placeStructure(s(23), s(23), "barrel_sauna");
      this.placeStructure(s(23), s(24), "firepit_lounge");
      this.placeStructure(s(24), s(21), "wax_tuning_shop");
      this.placeStructure(s(24), s(24), "rescue_clinic");
      this.placeStructure(s(25), s(22), "groomer_garage");
      this.placeStructure(s(25), s(24), "snowmobile_pad");

      // Asphalt Transit Avenue (`r = 26`): Shuttle Bus, Horse Sleigh & Village Lamps
      this.placeStructure(s(26), s(5), "shuttle_bus_stop");
      this.placeStructure(s(26), s(13), "horse_sleigh_stand");
      this.placeStructure(s(26), s(19), "shuttle_bus_stop");
      this.placeStructure(s(25), s(4), "alpine_lamp");
      this.placeStructure(s(26), s(11), "trail_map_board");
      this.placeStructure(s(26), s(15), "ski_rack_bench_sw");
      this.placeStructure(s(25), s(20), "alpine_lamp");

      // 10. Summit Crags, Eyrie, Prayer Flags, World-Cup Race Course, Pro Park & Connected Night Floodlight Ribbons!
      const summitCragCols = [0, 2, 6, 10, 12, 15, 18, 21, 25, 27];
      for (let i = 0; i < summitCragCols.length; i++) {
        const cc = s(summitCragCols[i]);
        if (!this.cells[0][cc].structure) {
          this.placeFlora(0, cc, i % 2 === 0 ? "summit_crag_v0" : "summit_crag_v1");
        }
      }
      this.placeFlora(0, s(13), "eagle_eyrie_crag");
      this.placeFlora(s(1), s(4), "gazex_blaster");
      this.placeFlora(s(1), s(20), "weather_wind_mast");
      this.placeFlora(s(1), s(11), "prayer_flags_ew");
      this.placeFlora(s(1), s(12), "prayer_flags_ew");
      this.placeFlora(s(1), s(17), "prayer_flags_ew");
      this.placeFlora(s(2), s(26), "glacier_ice_cave");
      this.placeFlora(s(3), s(24), "cliff_warning_rope_ew");
      this.placeFlora(s(3), s(25), "cliff_warning_rope_ew");

      // World-Cup Race Course (`c = 3..4`)
      this.placeFlora(s(4), s(4), "race_start_house");
      this.placeFlora(s(6), s(3), "gs_panel_gates");
      this.placeFlora(s(9), s(4), "slalom_poles_red_blue");
      this.placeFlora(s(11), s(3), "gs_panel_gates");
      this.placeFlora(s(13), s(4), "finish_timing_arch_ns");
      this.placeFlora(s(14), s(3), "champions_podium");
      this.placeFlora(s(7), s(2), "safety_net_ns");
      this.placeFlora(s(10), s(2), "safety_net_ns");

      // Trail Difficulty Gates, Crash Pads & Nordic Signpost
      this.placeFlora(s(10), s(6), "gate_green_circle");
      this.placeFlora(s(12), s(6), "kids_forest_arch");
      this.placeFlora(s(5), s(9), "gate_blue_square");
      this.placeFlora(s(3), s(14), "gate_black_diamond");
      this.placeFlora(s(4), s(17), "gate_double_black");
      this.placeFlora(s(10), s(25), "nordic_signpost");
      this.placeFlora(s(10), s(7), "tower_crash_pad");
      this.placeFlora(s(5), s(18), "wind_drift_fence_ew");

      // Pro Freestyle Park & Tubing Chute (`c = 19..24`)
      this.placeFlora(s(8), s(19), "big_air_kicker_sw");
      this.placeFlora(s(9), s(19), "stunt_airbag_sw");
      this.placeFlora(s(10), s(20), "rainbow_cbox_ns");
      this.placeFlora(s(11), s(19), "timber_wallride_sw");
      this.placeFlora(s(12), s(20), "park_kicker_sw");
      this.placeFlora(s(13), s(19), "kinked_stair_rail_ns");
      this.placeFlora(s(13), s(20), "halfpipe_wall_ns");
      this.placeFlora(s(14), s(19), "boardercross_berm_sw");
      this.placeFlora(s(16), s(23), "tubing_bale_corral");
      this.placeFlora(s(16), s(24), "tubing_bale_corral");

      // Connected Night Mode 2.0 Floodlight & Neon Park Ribbons from Summit to Festival Square!
      const mainRibbonLights = [
        [5, 13], [7, 15], [9, 13], [11, 15], [13, 14], // Matterhorn Torchlight Piste Ribbon
        [6, 11], [8, 8], [10, 11], [12, 8],            // Sun-Bowl Blue Cruiser Ribbon
        [6, 5], [9, 5], [12, 2],                       // World-Cup Race Ribbon
      ];
      for (let i = 0; i < mainRibbonLights.length; i++) {
        const [lr, lc] = mainRibbonLights[i];
        this.placeFlora(s(lr), s(lc), "slope_floodlight");
      }
      const neonParkRibbon = [
        [7, 18], [9, 20], [11, 18], [13, 18],
      ];
      for (let i = 0; i < neonParkRibbon.length; i++) {
        const [lr, lc] = neonParkRibbon[i];
        this.placeFlora(s(lr), s(lc), "neon_park_light");
      }

      // Snowmaking Cannons & Giraffe Lances
      this.placeFlora(s(6), s(16), "snow_cannon_sw");
      this.placeFlora(s(10), s(16), "giraffe_snow_lance");
      this.placeFlora(s(7), s(10), "snow_cannon_se");
      this.placeFlora(s(13), s(7), "giraffe_snow_lance");

      // 11. Multi-Species Spruce, Golden Larch, Weeping Hemlock & Granite Boulder Forest Islands (0 Bare Patches!)
      this._populateNaturalMountainDetail(this.seed + 101, 0.78);
    }

    /**
     * PRESET 2: `twin_summits` (`28x28`)
     * West & East `Lv 4` Peaks flanking a dramatic Glacier Canyon & Cascading Meltwater Brook,
     * crowned with `sphinx_observatory_2x2`, canyon `suspension_skybridge_ew`, mountain coaster & festival square!
     */
    _buildTwinSummits() {
      const n = this.size;
      const H = this.cornerZ;
      const s = (v) => this._sc(v);

      for (let cr = 0; cr <= n; cr++) {
        for (let cc = 0; cc <= n; cc++) {
          const dWest = Math.hypot((cr - 3) / 3.4, (cc - 5) / 4.5);
          const dEast = Math.hypot((cr - 3) / 3.4, (cc - (n - 5)) / 4.5);
          const dMin = Math.min(dWest, dEast);
          let z = clamp(Math.round(4.4 - dMin * 1.05), 0, 4);
          if (cr >= Math.round((20 * n) / 28)) z = 0;
          H[cr][cc] = z;
        }
      }
      this._enforceGlobalCornerGradient();
      this._reconcileCellsAfterTerrainEdit();

      this._fillRectSurface(s(4), s(3), s(18), s(6), "groomed_piste");
      this._fillRectSurface(s(4), s(21), s(18), s(24), "groomed_piste");
      this._fillRectSurface(s(6), s(8), s(16), s(10), "mogul_chute");
      this._fillRectSurface(s(8), s(17), s(17), s(19), "groomed_piste");
      this._fillRectSurface(s(1), s(18), s(6), s(26), "glacier_ice");
      this._fillRectSurface(s(20), s(3), s(26), s(24), "alpine_cobble");
      this._fillRectSurface(s(21), s(8), s(24), s(11), "festive_mosaic_cobble");
      this._fillRectSurface(s(21), s(16), s(24), s(19), "crystal_ice_promenade");
      this._fillRectSurface(s(26), s(2), s(26), s(25), "asphalt_road");

      // Central canyon meltwater brook -> valley skating lake & hot spring
      const midC = s(13);
      for (let r = s(5); r <= s(20); r++) {
        this.cells[r][midC].water = "meltwater_brook";
      }
      for (let r = s(21); r <= s(24); r++) {
        for (let c = s(12); c <= s(15); c++) {
          if (this.cells[r][c].isFlat) this.cells[r][c].water = "frozen_lake";
        }
      }
      this.cells[s(22)][s(22)].water = "thermal_spring";
      this.cells[s(22)][s(23)].water = "thermal_spring";
      this._reconcileCellsAfterTerrainEdit();

      this.placeStructure(s(8), midC, "suspension_skybridge_ew");
      this.placeStructure(s(14), midC, "kapellbrucke_bridge_ew");
      this.placeStructure(s(20), midC, "stone_viaduct_ew");
      for (let c = s(3); c <= s(24); c++) {
        if (c !== midC) this.placeStructure(s(20), c, c === s(9) ? "rail_crossing_gate_ew" : "train_track_ew");
      }
      this.placeStructure(s(20), s(2), "rail_tunnel_portal_se");
      this.placeStructure(s(20), s(25), "rail_tunnel_portal_se");
      this.placeStructure(s(21), s(6), "valley_train_station");
      this.placeStructure(s(21), s(7), "train_platform_ew");

      // East Ridge Mountain Coaster (`r = 8..14, c = 25`)
      for (let r = s(8); r <= s(14); r++) {
        this.placeStructure(r, s(25), "mountain_coaster_ns");
      }

      this.buildLiftLine(s(18), s(4), s(3), s(4), "egg_gondola");
      this.buildLiftLine(s(18), s(22), s(3), s(22), "gondola");
      this.buildLiftLine(s(18), s(18), s(8), s(18), "bubble_6chair");
      this.buildLiftLine(s(18), s(10), s(12), s(10), "tbar_lift");

      this.placeStructure(s(2), s(23), "sphinx_observatory_2x2");
      this.placeStructure(s(22), s(8), "grand_hotel_2x2");
      this.placeStructure(s(21), s(10), "festival_ferris_wheel_2x2");
      this.placeStructure(s(22), s(17), "base_lodge_2x2");
      this.placeStructure(s(22), s(20), "thermal_spa_2x2");
      this.placeStructure(s(3), s(6), "eagles_nest_skywalk");
      this.placeStructure(s(4), s(7), "alpine_photo_frame");
      this.placeStructure(s(13), midC - 1, "watermill_lodge");
      this.placeStructure(s(21), s(13), "pond_hockey_goal_ns");
      this.placeStructure(s(24), s(13), "pond_hockey_goal_ns");
      this.placeStructure(s(23), s(10), "winter_carousel");
      this.placeStructure(s(23), s(11), "fireworks_mortar");
      this.placeStructure(s(24), s(10), "glockenspiel_tower");
      this.placeStructure(s(24), s(11), "holiday_tree");
      this.placeStructure(s(24), s(16), "apres_tavern");
      this.placeStructure(s(25), s(5), "groomer_garage");

      this.placeFlora(0, s(4), "eagle_eyrie_crag");
      this.placeFlora(s(5), s(5), "gate_black_diamond");
      this.placeFlora(s(8), s(19), "gate_blue_square");
      this.placeFlora(s(12), s(18), "big_air_kicker_sw");
      this.placeFlora(s(13), s(18), "stunt_airbag_sw");
      this.placeFlora(s(8), s(6), "slope_floodlight");
      this.placeFlora(s(12), s(6), "slope_floodlight");
      this.placeFlora(s(9), s(21), "slope_floodlight");
      this.placeFlora(s(13), s(21), "slope_floodlight");

      this._populateNaturalMountainDetail(this.seed + 202, 0.74);
    }

    /**
     * PRESET 3: `night_park` (`28x28`)
     * Illuminated X-Games Freestyle Superpark, Neon Jib Plaza, Mountain Coaster & Winter Festival Night Arena!
     */
    _buildNightPark() {
      const n = this.size;
      const H = this.cornerZ;
      const s = (v) => this._sc(v);

      for (let cr = 0; cr <= n; cr++) {
        for (let cc = 0; cc <= n; cc++) {
          let z = 0;
          if (cr < Math.round((5 * n) / 28)) z = 3;
          else if (cr < Math.round((12 * n) / 28)) z = 2;
          else if (cr < Math.round((19 * n) / 28)) z = 1;
          else z = 0;
          H[cr][cc] = z;
        }
      }
      this._enforceGlobalCornerGradient();
      this._reconcileCellsAfterTerrainEdit();

      this._fillRectSurface(s(3), s(4), s(18), s(21), "groomed_piste");
      this._fillRectSurface(s(6), s(22), s(18), s(24), "tubing_chute");
      this._fillRectSurface(s(20), s(3), s(26), s(24), "alpine_cobble");
      this._fillRectSurface(s(21), s(8), s(24), s(12), "festive_mosaic_cobble");
      this._fillRectSurface(s(21), s(17), s(24), s(20), "crystal_ice_promenade");

      for (let r = s(21); r <= s(24); r++) {
        for (let c = s(13); c <= s(16); c++) {
          this.cells[r][c].water = "frozen_lake";
        }
      }
      this.cells[s(22)][s(22)].water = "thermal_spring";
      this._reconcileCellsAfterTerrainEdit();

      this.buildLiftLine(s(18), s(5), s(3), s(5), "bubble_6chair");
      this.buildLiftLine(s(18), s(14), s(3), s(14), "gondola");
      this.buildLiftLine(s(18), s(20), s(11), s(20), "magic_carpet");
      this.buildLiftLine(s(18), s(25), s(8), s(25), "tbar_lift");

      // Night Coaster Line (`c = 3, r = 6..13`)
      for (let r = s(6); r <= s(13); r++) {
        this.placeStructure(r, s(3), "mountain_coaster_ns");
      }

      // Superpark Jump, Airbag, Halfpipe & Jib Lines + Dense Floodlights & Neon Park Masts
      this.placeFlora(s(6), s(8), "big_air_kicker_sw");
      this.placeFlora(s(7), s(8), "stunt_airbag_sw");
      this.placeFlora(s(10), s(8), "park_kicker_sw");
      this.placeFlora(s(13), s(8), "rainbow_cbox_ns");
      this.placeFlora(s(7), s(11), "halfpipe_wall_ns");
      this.placeFlora(s(9), s(11), "halfpipe_wall_ns");
      this.placeFlora(s(11), s(11), "timber_wallride_sw");
      this.placeFlora(s(8), s(17), "kinked_stair_rail_ns");
      this.placeFlora(s(11), s(17), "park_rail_ns");
      this.placeFlora(s(14), s(17), "boardercross_berm_sw");
      this.placeFlora(s(18), s(23), "tubing_bale_corral");

      const lightPts = [
        [5, 7, "neon_park_light"], [9, 7, "slope_floodlight"], [13, 7, "neon_park_light"], [16, 7, "slope_floodlight"],
        [6, 12, "slope_floodlight"], [10, 12, "neon_park_light"], [14, 12, "slope_floodlight"], [17, 12, "neon_park_light"],
        [7, 16, "neon_park_light"], [11, 16, "slope_floodlight"], [15, 16, "neon_park_light"],
        [8, 19, "snow_cannon_sw"], [13, 19, "giraffe_snow_lance"],
      ];
      for (let i = 0; i < lightPts.length; i++) {
        const [lr, lc, lKey] = lightPts[i];
        this.placeFlora(s(lr), s(lc), lKey);
      }

      this.placeStructure(s(21), s(5), "base_lodge_2x2");
      this.placeStructure(s(21), s(8), "festival_ferris_wheel_2x2");
      this.placeStructure(s(21), s(18), "grand_hotel_2x2");
      this.placeStructure(s(21), s(10), "gondola_dj_booth");
      this.placeStructure(s(21), s(11), "snow_cinema_screen");
      this.placeStructure(s(22), s(10), "festival_bunting_arch_ew");
      this.placeStructure(s(22), s(11), "raclette_hearth_stall");
      this.placeStructure(s(22), s(12), "fireworks_mortar");
      this.placeStructure(s(23), s(9), "apres_tavern");
      this.placeStructure(s(23), s(11), "niseko_ramen_bar");
      this.placeStructure(s(23), s(17), "ice_palace_arch");
      this.placeStructure(s(24), s(17), "fireworks_mortar");
      this.placeStructure(s(21), s(14), "pond_hockey_goal_ns");
      this.placeStructure(s(24), s(14), "pond_hockey_goal_ns");
      this.placeStructure(s(23), s(22), "cedar_hottub");
      this.placeStructure(s(24), s(22), "firepit_lounge");
      this.placeStructure(s(24), s(4), "groomer_garage");

      this._populateNaturalMountainDetail(this.seed + 303, 0.74);
    }

    /**
     * PRESET 4: `random_mountain` (`28x28`)
     * Seeded procedural Alpine Massif + auto-carved meltwater creek, 3 lifts, pistes & village!
     */
    _buildRandomMountain(seed = 2026) {
      const n = this.size;
      const H = this.cornerZ;
      const rng = mulberry32(seed);
      const s = (v) => this._sc(v);

      for (let cr = 0; cr <= n; cr++) {
        for (let cc = 0; cc <= n; cc++) {
          const northBias = clamp(1.0 - cr / (n * 0.82), 0, 1);
          const ridge = fbm2D(cr * 0.13, cc * 0.13, seed + 17, 3);
          const raw = northBias * 3.8 + (ridge - 0.35) * 2.1;
          H[cr][cc] = cr >= Math.round(n * 0.74) ? 0 : clamp(Math.round(raw), 0, 4);
        }
      }
      this._enforceGlobalCornerGradient();
      this._reconcileCellsAfterTerrainEdit();

      const cLift1 = clamp(Math.floor(5 + rng() * 4), 4, n - 14);
      const cLift2 = clamp(cLift1 + Math.floor(8 + rng() * 5), 12, n - 5);
      const cBrook = clamp(Math.round((cLift1 + cLift2) * 0.5), 7, n - 8);
      const rValley = Math.round(n * 0.75);

      this._fillRectSurface(3, cLift1 + 1, rValley - 1, cLift1 + 3, "groomed_piste");
      this._fillRectSurface(3, cLift2 - 3, rValley - 1, cLift2 - 1, "groomed_piste");
      this._fillRectSurface(rValley, 3, n - 2, n - 4, "alpine_cobble");
      this._fillRectSurface(rValley + 1, 6, rValley + 3, 9, "red_brick");

      for (let r = 5; r <= rValley; r++) {
        const cell = this.cells[r][cBrook];
        if (cell.isFlat || cell.slopeMask === "1100" || cell.slopeMask === "1001") {
          cell.water = "meltwater_brook";
        }
      }
      for (let r = rValley + 1; r <= Math.min(n - 3, rValley + 3); r++) {
        for (let c = cBrook - 1; c <= cBrook + 1; c++) {
          if (this.inBounds(r, c) && this.cells[r][c].isFlat) {
            this.cells[r][c].water = "frozen_lake";
          }
        }
      }
      this._reconcileCellsAfterTerrainEdit();

      this.buildLiftLine(rValley - 2, cLift1, 3, cLift1, "bubble_6chair");
      this.buildLiftLine(rValley - 2, cLift2, 3, cLift2, "gondola");
      this.buildLiftLine(rValley - 2, clamp(cLift2 + 3, 2, n - 3), rValley - 6, clamp(cLift2 + 3, 2, n - 3), "magic_carpet");

      this.placeStructure(rValley + 1, s(6), "grand_hotel_2x2");
      this.placeStructure(rValley + 1, clamp(cLift2 - 1, 4, n - 4), "base_lodge_2x2");
      this.placeStructure(rValley + 3, s(9), "apres_tavern");
      this.placeStructure(rValley + 3, s(11), "ski_rental_shop");
      this.placeStructure(rValley + 3, s(15), "holiday_tree");
      this.placeStructure(rValley + 4, s(5), "groomer_garage");

      this.placeFlora(4, cLift1 + 2, "gate_blue_square");
      this.placeFlora(4, cLift2 - 2, "gate_black_diamond");
      this.placeFlora(9, cLift1 + 2, "slope_floodlight");
      this.placeFlora(10, cLift2 - 2, "snow_cannon_sw");

      this._populateNaturalMountainDetail(seed + 404, 0.68);
    }

    /**
     * PRESET 5: `fresh_powder` (`28x28`)
     * Untouched Scenic Alpine Peak with cascading meltwater creek, welcoming base depot,
     * and rich multi-species timberline groves framing wide buildable powder bowls!
     */
    _buildFreshPowder() {
      const n = this.size;
      const H = this.cornerZ;
      const s = (v) => this._sc(v);

      for (let cr = 0; cr <= n; cr++) {
        for (let cc = 0; cc <= n; cc++) {
          let z = 0;
          if (cr < Math.round((4 * n) / 28)) z = 3;
          else if (cr < Math.round((10 * n) / 28)) z = 2;
          else if (cr < Math.round((17 * n) / 28)) z = 1;
          else z = 0;
          H[cr][cc] = z;
        }
      }
      this._enforceGlobalCornerGradient();
      this._reconcileCellsAfterTerrainEdit();

      // Natural creek & frozen tarn + cozy starter base plaza
      const cCreek = s(18);
      for (let r = s(4); r <= s(19); r++) {
        this.cells[r][cCreek].water = "meltwater_brook";
      }
      for (let r = s(20); r <= s(22); r++) {
        for (let c = s(17); c <= s(19); c++) {
          this.cells[r][c].water = "frozen_lake";
        }
      }
      this._fillRectSurface(s(4), s(9), s(20), s(13), "groomed_piste");
      this._fillRectSurface(s(1), s(19), s(6), s(25), "glacier_ice");
      this._fillRectSurface(s(21), s(8), s(24), s(14), "alpine_cobble");
      this._reconcileCellsAfterTerrainEdit();

      this.buildLiftLine(s(20), s(8), s(12), s(8), "rope_tow");
      this.placeStructure(s(18), cCreek, "timber_bridge_ew");
      this.placeStructure(s(22), s(9), "chalet_bnb");
      this.placeStructure(s(22), s(11), "lift_ticket_booth");
      this.placeStructure(s(22), s(13), "cocoa_kiosk");
      this.placeStructure(s(23), s(11), "holiday_tree");
      this.placeFlora(s(12), s(10), "gate_green_circle");

      this._populateNaturalMountainDetail(this.seed + 505, 0.42);
    }
  }

  SanctuaryWorld.SURFACES = SURFACES;
  SanctuaryWorld.SURFACE_VARIANTS = SURFACE_VARIANTS;
  SanctuaryWorld.WATER_TYPES = WATER_TYPES;
  SanctuaryWorld.LIFT_SPECS = LIFT_SPECS;
  SanctuaryWorld.FLORA_DEFS = FLORA_DEFS;
  SanctuaryWorld.STRUCTURE_DEFS = STRUCTURE_DEFS;
  SanctuaryWorld.COMPOSITE_2X2_IDS = Array.from(COMPOSITE_2X2_IDS);

  window.SanctuaryWorld = SanctuaryWorld;
})();
