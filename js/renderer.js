/**
 * Alpine Peak v3 — Grand Ski Resort, Winter Festival & Alpine Town (`js/renderer.js`)
 * ====================================================================================
 * Owns `window.SanctuaryRenderer`:
 *   - Tall Isometric `128x224` Pixel-Art Compositor (`Y_OFFSET = 96`, `TOP_PAD_Y = 160`,
 *     `ANCHOR_Y = 192`, `ELEV_STEP_Z = 4.0`, `ELEV_STEP_PX = 16`, 5 elevations `Lv 0..4`).
 *   - Zero-Seam Integer `1:1` Offscreen World Buffer (`_worldBuf`) + Dirty-Rect `_staticTerrainBuf`
 *     scaled onto the main viewport with `imageSmoothingEnabled = false` (`0.0px` seam gaps).
 *   - Supports all `17` terrain surfaces (`6` 4-var + `11` 2-var), `3` multi-cell sculpt brushes
 *     (`3x3` Matterhorn Peak, `5x5` Glacial Bowl, `2x2` Cliff Balcony), `4` water/creek/crevasse
 *     types, `5` `2x2` animated landmarks (`grand_hotel_2x2`, `thermal_spa_2x2`, `base_lodge_2x2`,
 *     `festival_ferris_wheel_2x2`, `sphinx_observatory_2x2`), multi-sheet overflow tiles
 *     (`atlas_tiles_2.png`), and all `10` uphill lift systems locked to `#68` sheave geometry.
 *   - Night Mode 2.0 Overhaul:
 *       * Pre-baked `2:1` downslope directional floodlight & neon-park elliptical snow cones
 *         (`1.25` tiles downslope, silky connected ski-run ribbons, zero `1:1` pole-top circles)
 *       * Deep Prussian Cobalt-Cyan Alpine Moonlight (`rgba(10, 25, 56, 0.56)`) + cerulean peak sheen
 *       * View-cached `1:1` crisp pixel-art emissive window, lantern, stained-glass, fairground bulb,
 *         candle, ice-turret, observatory dome, garland, DJ & cinema-screen pass
 *       * Sweeping twin vehicle headlight cones, lit gondola/tram/train cabin windows, Torchlight
 *         Skier flares + golden piste embers, Hot-Air Balloon burner glow, Aurora Borealis summit
 *         curtains, frozen-lagoon golden shimmer, and crisp pixel-art Fireworks in all 3 modes.
 *   - Smooth `60 fps` Catmull-Rom Showcase Glide Camera (`[C]`) with instant manual-input auto-yield.
 */
(function () {
  "use strict";

  const TILE_W = 128;
  const TILE_H = 224;
  const HALF_W = 64;
  const HALF_H = 32;
  const TOP_PAD_Y = 160;
  const ANCHOR_Y = 192;
  const ELEV_STEP_Z = 4.0;
  const ELEV_STEP_PX = 16;

  // Core 4 surfaces + 2 v3 carnival plaza surfaces have v0..v3 flats; v2 surfaces have v0..v1 flats
  const CORE_4VAR_SURFACES = new Set([
    "untouched_powder",
    "groomed_piste",
    "mogul_chute",
    "alpine_cobble",
    "festive_mosaic_cobble",
    "crystal_ice_promenade",
  ]);

  // All 5 2x2 flagship landmarks (#68 + #125 v3)
  const COMPOSITE_2X2_IDS = new Set([
    "grand_hotel_2x2",
    "thermal_spa_2x2",
    "base_lodge_2x2",
    "festival_ferris_wheel_2x2",
    "sphinx_observatory_2x2",
  ]);

  // Overhead covered spans where guests walk UNDER the roof/bunting rather than on top
  const ROOFED_SPAN_PREFIXES = [
    "kapellbrucke_bridge",
    "festival_bunting_arch",
  ];

  function isRoofedSpanId(cleanId) {
    for (let i = 0; i < ROOFED_SPAN_PREFIXES.length; i++) {
      if (cleanId.startsWith(ROOFED_SPAN_PREFIXES[i])) return true;
    }
    return false;
  }

  // Locked #68 Lift Cable & Track Geometry (z_cable above [64,192], lateral strand half-sep px)
  const NO_CABLE_LIFT_TYPES = new Set([
    "magic_carpet",
    "cliff_funicular",
  ]);

  const LIFT_CABLE_SPECS = {
    magic_carpet:   { zCable: 1.5,  sep: 0,  sag: 0.0, aerial: false, hasCable: false },
    cliff_funicular:{ zCable: 2.0,  sep: 0,  sag: 0.0, aerial: false, hasCable: false },
    rope_tow:       { zCable: 3.0,  sep: 5,  sag: 0.6, aerial: false, hasCable: true },
    tbar_lift:      { zCable: 7.5,  sep: 7,  sag: 0.9, aerial: false, hasCable: true },
    classic_2chair: { zCable: 11.0, sep: 10, sag: 1.5, aerial: true,  hasCable: true, upCarrier: "chairlift_rider",     dnCarrier: "chairlift_empty" },
    chairlift:      { zCable: 11.0, sep: 10, sag: 1.5, aerial: true,  hasCable: true, upCarrier: "chairlift_rider",     dnCarrier: "chairlift_empty" },
    bubble_6chair:  { zCable: 11.0, sep: 10, sag: 1.5, aerial: true,  hasCable: true, upCarrier: "bubble_chair_orange", dnCarrier: "bubble_chair_orange" },
    egg_gondola:    { zCable: 14.0, sep: 12, sag: 1.5, aerial: true,  hasCable: true, upCarrier: "egg_gondola_cabin",   dnCarrier: "egg_gondola_cabin" },
    gondola:        { zCable: 14.0, sep: 12, sag: 1.5, aerial: true,  hasCable: true, upCarrier: "gondola_cabin",       dnCarrier: "gondola_cabin" },
    tramway_3s:     { zCable: 16.0, sep: 13, sag: 1.5, aerial: true,  hasCable: true, is3S: true, upCarrier: "tram_cabin_3s", dnCarrier: "tram_cabin_3s" },
  };

  const ANIMATED_FLORA_PREFIXES = new Set([
    "snow_cannon_sw",
    "snow_cannon_se",
    "giraffe_snow_lance",
    "slope_floodlight",
    "neon_park_light",
    "weather_wind_mast",
  ]);

  const ANIMATED_STRUCTURES = new Set([
    "rope_tow_base",
    "rope_tow_top",
    "magic_carpet_base_ns",
    "magic_carpet_base_ew",
    "magic_carpet_top_ns",
    "magic_carpet_top_ew",
    "tbar_base_ns",
    "tbar_base_ew",
    "tbar_top_ns",
    "tbar_top_ew",
    "classic_2chair_base_ns",
    "classic_2chair_base_ew",
    "classic_2chair_top_ns",
    "classic_2chair_top_ew",
    "chairlift_base_ns",
    "chairlift_base_ew",
    "chairlift_top_ns",
    "chairlift_top_ew",
    "bubble_6chair_base_ns",
    "bubble_6chair_base_ew",
    "bubble_6chair_top_ns",
    "bubble_6chair_top_ew",
    "egg_gondola_base_ns",
    "egg_gondola_base_ew",
    "egg_gondola_top_ns",
    "egg_gondola_top_ew",
    "gondola_base_ns",
    "gondola_base_ew",
    "gondola_top_ns",
    "gondola_top_ew",
    "tramway_3s_base_ns",
    "tramway_3s_base_ew",
    "tramway_3s_top_ns",
    "tramway_3s_top_ew",
    "funicular_base_ns",
    "funicular_base_ew",
    "funicular_top_ns",
    "funicular_top_ew",
    "mid_transfer_station_ns",
    "mid_transfer_station_ew",
    "valley_train_station",
    "groomer_garage",
    "winch_cat_bay",
    "snowmobile_pad",
    "horse_sleigh_stand",
    "shuttle_bus_stop",
    "summit_helipad",
    "grand_hotel_2x2_nw",
    "grand_hotel_2x2_ne",
    "grand_hotel_2x2_sw",
    "grand_hotel_2x2_se",
    "thermal_spa_2x2_nw",
    "thermal_spa_2x2_ne",
    "thermal_spa_2x2_sw",
    "thermal_spa_2x2_se",
    "base_lodge_2x2_nw",
    "base_lodge_2x2_ne",
    "base_lodge_2x2_sw",
    "base_lodge_2x2_se",
    "festival_ferris_wheel_2x2_nw",
    "festival_ferris_wheel_2x2_ne",
    "festival_ferris_wheel_2x2_sw",
    "festival_ferris_wheel_2x2_se",
    "sphinx_observatory_2x2_nw",
    "sphinx_observatory_2x2_ne",
    "sphinx_observatory_2x2_sw",
    "sphinx_observatory_2x2_se",
    "glockenspiel_tower",
    "kapellbrucke_bridge_ns",
    "kapellbrucke_bridge_ew",
    "raclette_hearth_stall",
    "winter_carousel",
    "gluhwein_pyramid",
    "ice_palace_arch",
    "giant_snow_sculpture",
    "fireworks_mortar",
    "festival_bunting_arch_ns",
    "festival_bunting_arch_ew",
    "gondola_dj_booth",
    "snow_cinema_screen",
    "alpine_photo_frame",
    "suspension_skybridge_ns",
    "suspension_skybridge_ew",
    "mountain_coaster_ns",
    "mountain_coaster_ew",
    "mountain_coaster_curve_ne",
    "mountain_coaster_curve_nw",
    "mountain_coaster_curve_se",
    "mountain_coaster_curve_sw",
    "chalet_bnb",
    "aframe_cabin",
    "stargaze_igloo",
    "ice_hotel_suite",
    "ski_rental_shop",
    "lift_ticket_booth",
    "ski_school_lodge",
    "wax_tuning_shop",
    "gear_boutique",
    "swiss_watchmaker",
    "chocolatier_shop",
    "cheese_raclette_cellar",
    "cowbell_souvenirs",
    "bookshop_roastery",
    "alpine_bakery",
    "apres_tavern",
    "craft_brewhouse",
    "niseko_ramen_bar",
    "waffle_hut",
    "summit_restaurant",
    "eagles_nest_skywalk",
    "stone_chapel",
    "town_rathaus",
    "watermill_lodge",
    "ski_patrol_hut",
    "rescue_clinic",
    "schirmbar_umbrella",
    "cocoa_kiosk",
    "christmas_market_stall",
    "chestnut_cart",
    "cedar_hottub",
    "barrel_sauna",
    "firepit_lounge",
    "heated_patio_tables",
    "ice_rink_pad",
    "ice_curling_lane",
    "alphorn_band_stage",
    "holiday_tree",
    "street_light_garland_ns",
    "street_light_garland_ew",
    "alpine_lamp",
    "frozen_fountain",
  ]);

  const FLAT_DECK_IDS = new Set([
    "town_walkway_ns",
    "town_walkway_ew",
    "town_walkway_ne",
    "town_walkway_nw",
    "town_walkway_se",
    "town_walkway_sw",
    "town_walkway_t_n",
    "town_walkway_t_e",
    "town_walkway_t_s",
    "town_walkway_t_w",
    "town_walkway_cross",
    "snow_stairs_n",
    "snow_stairs_e",
    "snow_stairs_s",
    "snow_stairs_w",
    "timber_bridge_ns",
    "timber_bridge_ew",
    "stone_arch_bridge_ns",
    "stone_arch_bridge_ew",
    "suspension_skybridge_ns",
    "suspension_skybridge_ew",
    "retaining_wall_ns",
    "retaining_wall_ew",
    "train_track_ns",
    "train_track_ew",
    "train_track_curve_ne",
    "train_track_curve_nw",
    "train_track_curve_se",
    "train_track_curve_sw",
    "mountain_coaster_ns",
    "mountain_coaster_ew",
    "mountain_coaster_curve_ne",
    "mountain_coaster_curve_nw",
    "mountain_coaster_curve_se",
    "mountain_coaster_curve_sw",
    "stone_viaduct_ns",
    "stone_viaduct_ew",
    "train_platform_ns",
    "train_platform_ew",
    "rail_crossing_gate_ns",
    "rail_crossing_gate_ew",
    "funicular_track_ns",
    "funicular_track_ew",
    "snowmobile_pad",
    "horse_sleigh_stand",
    "shuttle_bus_stop",
    "summit_helipad",
    "ice_rink_pad",
    "ice_curling_lane",
    "pond_hockey_goal_ns",
    "pond_hockey_goal_ew",
    "cedar_hottub",
    "firepit_lounge",
    "heated_patio_tables",
    "alphorn_band_stage",
    "ski_lockers",
    "ski_rack_bench_sw",
    "ski_rack_bench_se",
    "trail_map_board",
    "snowman_trio",
  ]);

  // Ground-flush flat decks eligible for `_staticTerrainBuf` when all 4 frames match.
  // Upright mini-props (`pond_hockey_goal_*`, `snowman_trio`, `rail_crossing_gate_*`, etc.)
  // stay in dynamic `2a` so northern skaters/guests remain cleanly occluded behind them.
  const STATIC_GROUND_DECK_IDS = new Set([
    "town_walkway_ns",
    "town_walkway_ew",
    "town_walkway_ne",
    "town_walkway_nw",
    "town_walkway_se",
    "town_walkway_sw",
    "town_walkway_t_n",
    "town_walkway_t_e",
    "town_walkway_t_s",
    "town_walkway_t_w",
    "town_walkway_cross",
    "snow_stairs_n",
    "snow_stairs_e",
    "snow_stairs_s",
    "snow_stairs_w",
    "timber_bridge_ns",
    "timber_bridge_ew",
    "stone_arch_bridge_ns",
    "stone_arch_bridge_ew",
    "suspension_skybridge_ns",
    "suspension_skybridge_ew",
    "retaining_wall_ns",
    "retaining_wall_ew",
    "train_track_ns",
    "train_track_ew",
    "train_track_curve_ne",
    "train_track_curve_nw",
    "train_track_curve_se",
    "train_track_curve_sw",
    "mountain_coaster_ns",
    "mountain_coaster_ew",
    "mountain_coaster_curve_ne",
    "mountain_coaster_curve_nw",
    "mountain_coaster_curve_se",
    "mountain_coaster_curve_sw",
    "stone_viaduct_ns",
    "stone_viaduct_ew",
    "train_platform_ns",
    "train_platform_ew",
    "funicular_track_ns",
    "funicular_track_ew",
  ]);

  const FIREWORK_PALETTES = {
    golden_willow: { core: "#fffbeb", bright: "#fde047", tail: "#f59e0b", glow: "#fbbf24" },
    crimson_peony: { core: "#fff1f2", bright: "#fb7185", tail: "#e11d48", glow: "#f43f5e" },
    glacier_cyan:  { core: "#f0f9ff", bright: "#38bdf8", tail: "#0284c7", glow: "#22d3ee" },
    royal_emerald: { core: "#ecfdf5", bright: "#34d399", tail: "#059669", glow: "#10b981" },
    alpine_violet: { core: "#f5f3ff", bright: "#c084fc", tail: "#7c3aed", glow: "#a855f7" },
  };
  const FIREWORK_PALETTE_LIST = [
    FIREWORK_PALETTES.golden_willow,
    FIREWORK_PALETTES.crimson_peony,
    FIREWORK_PALETTES.glacier_cyan,
    FIREWORK_PALETTES.royal_emerald,
    FIREWORK_PALETTES.alpine_violet,
  ];

  // Isometric 2:1 heading screen vectors (normalized) & angles
  const ISO_HEADING_VEC = {
    ne: { dx: 0.894427, dy: -0.447214, ang: Math.atan2(-1, 2) },
    nw: { dx: -0.894427, dy: -0.447214, ang: Math.atan2(-1, -2) },
    se: { dx: 0.894427, dy: 0.447214, ang: Math.atan2(1, 2) },
    sw: { dx: -0.894427, dy: 0.447214, ang: Math.atan2(1, -2) },
  };

  function buildRgbaLut(r, g, b, steps = 24) {
    const arr = new Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      arr[i] = `rgba(${r}, ${g}, ${b}, ${(i / steps).toFixed(2)})`;
    }
    return arr;
  }

  function lutPick(lut, alpha) {
    const steps = lut.length - 1;
    const idx = alpha <= 0 ? 0 : alpha >= 1 ? steps : (alpha * steps + 0.5) | 0;
    return lut[idx];
  }

  const LUT_WORN_PISTE = buildRgbaLut(136, 172, 212, 24);
  const LUT_WHITE = buildRgbaLut(255, 255, 255, 24);
  const LUT_BOARD_CARVE = buildRgbaLut(126, 168, 214, 24);
  const LUT_SNOW_LIP = buildRgbaLut(250, 253, 255, 24);
  const LUT_SKI_CARVE = buildRgbaLut(124, 166, 212, 24);
  const LUT_STEAM_ALPENGLOW = buildRgbaLut(255, 234, 224, 24);
  const LUT_STEAM_DAY = buildRgbaLut(232, 246, 255, 24);
  const LUT_SNOW_ALPENGLOW = buildRgbaLut(255, 236, 222, 24);
  const LUT_SNOW_NIGHT = buildRgbaLut(206, 228, 255, 24);
  const LUT_STAR = buildRgbaLut(226, 240, 255, 24);
  const LUT_AURORA_MINT = buildRgbaLut(94, 234, 212, 24);
  const LUT_AURORA_VIOLET = buildRgbaLut(167, 139, 250, 24);
  const LUT_ICE_SHIMMER_GOLD = buildRgbaLut(255, 224, 130, 24);
  const LUT_ICE_SHIMMER_CYAN = buildRgbaLut(125, 211, 252, 24);
  const EMPTY_MAP = new Map();
  const EMPTY_ARR = [];

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") return { r: 255, g: 204, b: 120 };
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    const num = parseInt(clean, 16);
    if (!Number.isFinite(num)) return { r: 255, g: 204, b: 120 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  class SanctuaryRenderer {
    constructor(canvas, world, sim, options = {}) {
      this.canvas =
        typeof canvas === "string" ? document.getElementById(canvas) : canvas;
      this.ctx = this.canvas
        ? this.canvas.getContext("2d", { alpha: false })
        : null;
      this.world = world || null;
      this.sim = sim || null;
      this.atlas = options.atlas || window.SANCTUARY_ATLAS || null;
      this.missingKeys = new Set();

      // Camera State (`panX, panY` in 1:1 world pixel coordinates relative to `(0,0)` N-apex)
      this.zoom = clamp(options.zoom || 1.0, 0.5, 3.0);
      this.minZoom = 0.5;
      this.maxZoom = 3.0;
      this.panX = 0;
      this.panY = 0;
      this._cameraInitialized = false;

      // Viewport CSS pixel dimensions & DPR
      this.dpr = 1;
      this.viewW = 1280;
      this.viewH = 800;

      // Winter Atmosphere: "day" | "alpenglow" | "night"
      this.atmosphere = "day";
      this.time = 0;

      // Tactile Ghost Preview State
      this.ghostPreview = null;
      this.cameraToolActive = false;
      this.cursorScreenX = 0;
      this.cursorScreenY = 0;

      // Ambient Snowfall & Steam Particles (world pixel coordinates)
      this.particles = [];
      this._maxParticles = 96;

      // Reusable per-cell ski track buckets & zero-GC frame scratch pools
      this._trackBuckets = [];
      this._trackBucketSize = 0;
      this._canvasRect = null;
      this._ghostCellMap = new Map();
      this._highAirborne = [];
      this._projByCellMap = new Map();
      this._projLooseArr = [];
      this._projCellPool = [];
      this._projItemPool = [];
      this._carrierDrawList = [];
      this._carrierPool = [];
      this._coveredLiftIds = new Set();
      this._resolvedClouds = [];
      this._cloudPool = [];

      // Offscreen Night Mode 2.0 Cutout, 2:1 Snow Pool Halo & Crisp 1:1 Pixel Emissive Buffers
      this._duskBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._duskCtx = this._duskBuf ? this._duskBuf.getContext("2d") : null;
      this._staticDuskCutoutBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._staticDuskCutoutCtx = this._staticDuskCutoutBuf
        ? this._staticDuskCutoutBuf.getContext("2d")
        : null;
      this._staticNightHaloBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._staticNightHaloCtx = this._staticNightHaloBuf
        ? this._staticNightHaloBuf.getContext("2d")
        : null;
      this._staticNightEmissiveBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._staticNightEmissiveCtx = this._staticNightEmissiveBuf
        ? this._staticNightEmissiveBuf.getContext("2d")
        : null;
      this._nightViewCacheKey = "";
      this._nightLightsVersion = -1;
      this._nightLightsWorld = null;
      this._staticNightLights = [];
      this._staticEmissiveStamps = [];
      this._animEmissiveSites = [];
      this._floodlightCones = [];
      this._iceShimmerCells = [];
      this._dynamicLightsScratch = [];
      this._heliSpotlightsScratch = [];
      this._vehicleHeadlightsScratch = [];
      this._litCabinsScratch = [];
      this._torchFlaresScratch = [];
      this._balloonBurnersScratch = [];
      this._fireworkGlowsScratch = [];
      this._fireworkGlowPool = [];
      this._fireworkGlowUsed = 0;
      this._cutoutSprite = null;
      this._isoCutoutSprite = null;
      this._heliBeamSprite = null;
      this._headlightBeamSprite = null;
      this._auroraCurtainSprite = null;
      this._glowSpriteCache = new Map();
      this._isoGlowSpriteCache = new Map();
      this._floodWedgeCache = new Map();
      this._alpenglowGradCache = null;

      // Smooth 60fps Showcase Glide Camera (`[C]`)
      this._showcaseCamActive = false;
      this._showcaseTime = 0;
      this._showcaseBlendT = 0;
      this._showcaseFromPanX = 0;
      this._showcaseFromPanY = 0;
      this._showcaseFromZoom = 1.0;
      this._showcaseExpectedPanX = 0;
      this._showcaseExpectedPanY = 0;
      this._showcaseExpectedZoom = 1.0;
      this._showcaseWaypoints = [];
      this._showcaseWaypointsWorld = null;
      this._showcaseWaypointsVersion = -1;
      this._internalShowcaseStep = false;
      this.onShowcaseCameraChange = null;

      // Cached Backdrop Buffer (`w x h x atmosphere`) & Pre-Baked Cloud Shadow Sprites
      this._backdropBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._backdropCtx = this._backdropBuf ? this._backdropBuf.getContext("2d") : null;
      this._backdropW = 0;
      this._backdropH = 0;
      this._backdropAtmo = "";
      this._cloudShadowDay = null;
      this._cloudShadowNight = null;

      // Viewport-Sized Offscreen 1:1 Crisp Pixel-Art World Buffer (`0.0px` seam gaps at any zoom!)
      this._worldBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._worldCtx = this._worldBuf ? this._worldBuf.getContext("2d") : null;
      this._bufGridSize = 0;
      this._bufOriginX = 0;
      this._bufOriginY = 0;
      this._cullRect = null; // visible world-buffer region during on-screen renders

      // Cached 1:1 Static Terrain Dirty-Rect Buffer, Single Cliff-Cap Atlas & Cell Cache
      this._staticTerrainBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._staticTerrainCtx = this._staticTerrainBuf
        ? this._staticTerrainBuf.getContext("2d")
        : null;
      this._cliffScratchCanvas =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      if (this._cliffScratchCanvas) {
        this._cliffScratchCanvas.width = 128;
        this._cliffScratchCanvas.height = 288;
      }
      this._cliffScratchCtx = this._cliffScratchCanvas
        ? this._cliffScratchCanvas.getContext("2d")
        : null;
      this._cliffAtlasCanvas =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      if (this._cliffAtlasCanvas) {
        this._cliffAtlasCanvas.width = 1024; // 8 columns of 128px
        this._cliffAtlasCanvas.height = 2304; // 8 rows of 288px (64 reusable cliff-cap slots)
      }
      this._cliffAtlasCtx = this._cliffAtlasCanvas
        ? this._cliffAtlasCanvas.getContext("2d")
        : null;
      this._cliffAtlasEpoch = 1;
      this._cliffAtlasNextSlot = 0;

      this._staticCacheWorld = null;
      this._staticCacheVersion = -1;
      this._staticCacheGridSize = 0;
      this._staticCacheAtlasReady = false;
      this._staticWaterFrame = -1;
      this._cellRenderCache = [];
      this._waterDirtyRects = [];
      this._waterPatchCellList = [];
      this._waterFrameCanvasPool = [];
      this._waterPoolUsed = 0;
      this._dynCliffMarks = new Uint32Array(0);
      this._dynOverlayMarks = new Uint32Array(0);
      this._frameStamp = 1;

      // Lightweight `256x160` Whole-Island Minimap Scene Overview Buffer
      this._minimapSceneBuf =
        typeof document !== "undefined" ? document.createElement("canvas") : null;
      this._minimapSceneCtx = this._minimapSceneBuf
        ? this._minimapSceneBuf.getContext("2d")
        : null;
      this._minimapSceneWorld = null;
      this._minimapSceneVersion = -1;
      this._minimapSceneAtlasReady = false;
      this._minimapFullBounds = null;

      if (typeof globalThis !== "undefined") {
        globalThis.alpineRenderer = this;
      }

      if (this.canvas) {
        this.resize();
        this._boundResize = () => this.resize();
        this._boundInvalidateRect = () => {
          this._canvasRect = null;
        };
        window.addEventListener("resize", this._boundResize);
        window.addEventListener("scroll", this._boundInvalidateRect, { passive: true });
      }
      if (this.world) {
        this.centerOnWorld(true);
        this._seedAmbientParticles();
      }
    }

    invalidateRect() {
      this._canvasRect = null;
    }

    _getCanvasRect() {
      if (!this.canvas) {
        return { left: 0, top: 0, width: this.viewW, height: this.viewH };
      }
      if (!this._canvasRect) {
        this._canvasRect = this.canvas.getBoundingClientRect();
      }
      return this._canvasRect;
    }

    setWorld(world) {
      this.world = world;
      this._staticCacheVersion = -1;
      this._minimapSceneVersion = -1;
      this._nightLightsVersion = -1;
      this._showcaseWaypointsVersion = -1;
      this.centerOnWorld(true);
      this._seedAmbientParticles();
    }

    setSimulation(sim) {
      this.sim = sim;
      if (this.sim && typeof this.sim.setAtmosphereHint === "function") {
        this.sim.setAtmosphereHint(this.atmosphere);
      }
    }

    setAtmosphere(mode) {
      const m = String(mode || "day").toLowerCase().trim();
      if (m === "alpenglow" || m === "golden" || m === "sunset" || m === "golden_hour") {
        this.atmosphere = "alpenglow";
      } else if (m === "night" || m === "dusk" || m === "lantern" || m === "night_ski") {
        this.atmosphere = "night";
      } else {
        this.atmosphere = "day";
      }
      this._nightViewCacheKey = "";
      if (this.sim && typeof this.sim.setAtmosphereHint === "function") {
        this.sim.setAtmosphereHint(this.atmosphere);
      }
      this._seedAmbientParticles();
      return this.atmosphere;
    }

    getAtmosphere() {
      return this.atmosphere;
    }

    setGhostPreview(preview) {
      this.ghostPreview = preview || null;
    }

    clearGhostPreview() {
      this.ghostPreview = null;
    }

    setCameraToolActive(active) {
      this.cameraToolActive = Boolean(active);
    }

    // =========================================================================
    // Smooth 60 fps Showcase Glide Camera (`[C]`)
    // =========================================================================

    isShowcaseCameraActive() {
      return Boolean(this._showcaseCamActive);
    }

    setShowcaseCamera(active) {
      const next = Boolean(active);
      if (this._showcaseCamActive === next) return next;
      this._showcaseCamActive = next;
      if (next) {
        this._showcaseWaypointsVersion = -1;
        this._ensureShowcaseWaypoints();
        this._showcaseTime = 0;
        this._showcaseBlendT = 0;
        this._showcaseFromPanX = this.panX;
        this._showcaseFromPanY = this.panY;
        this._showcaseFromZoom = this.zoom;
        this._showcaseExpectedPanX = this.panX;
        this._showcaseExpectedPanY = this.panY;
        this._showcaseExpectedZoom = this.zoom;
      }
      if (typeof this.onShowcaseCameraChange === "function") {
        try {
          this.onShowcaseCameraChange(next);
        } catch (_err) {
          // Ignore callback error so camera state remains consistent
        }
      }
      return next;
    }

    toggleShowcaseCamera() {
      return this.setShowcaseCamera(!this._showcaseCamActive);
    }

    _ensureShowcaseWaypoints() {
      const world = this.world;
      if (!world) return EMPTY_ARR;
      if (
        this._showcaseWaypointsWorld === world &&
        this._showcaseWaypointsVersion === world.version &&
        this._showcaseWaypoints.length >= 4
      ) {
        return this._showcaseWaypoints;
      }

      const n = world.size || 24;
      let festPt = null;
      let gorgePt = null;
      let coasterPt = null;
      let summitPt = null;
      let highestSummit = -1;

      if (world.cells) {
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const cell = world.cells[r][c];
            const sid = cell.structure && cell.structure.id
              ? cell.structure.id.replace(/_f[0-3]$/, "")
              : "";
            const fl = cell.flora ? cell.flora.replace(/_f[0-3]$/, "") : "";

            if (sid === "festival_ferris_wheel_2x2_nw") {
              festPt = { r: r + 0.6, c: c + 0.6, zoom: 1.18 };
            } else if (!festPt && (sid === "winter_carousel" || sid === "gluhwein_pyramid" || sid === "town_rathaus")) {
              festPt = { r, c, zoom: 1.16 };
            }

            if (sid.startsWith("suspension_skybridge_") || sid.startsWith("kapellbrucke_bridge_")) {
              if (!gorgePt || sid.startsWith("suspension_skybridge_")) {
                gorgePt = { r: r + 0.5, c: c + 0.5, zoom: 1.15 };
              }
            } else if (!gorgePt && (sid.startsWith("stone_viaduct_") || cell.water === "meltwater_brook")) {
              if (!cell.isFlat || sid.startsWith("stone_viaduct_")) {
                gorgePt = { r, c, zoom: 1.14 };
              }
            }

            if (sid.startsWith("mountain_coaster_curve_") || sid === "gondola_dj_booth") {
              coasterPt = { r, c, zoom: 1.16 };
            } else if (!coasterPt && (sid.startsWith("mountain_coaster_") || fl === "neon_park_light")) {
              coasterPt = { r, c, zoom: 1.14 };
            }

            if (sid === "sphinx_observatory_2x2_nw") {
              summitPt = { r: r + 0.6, c: c + 0.6, zoom: 1.06 };
              highestSummit = 999;
            } else if (highestSummit < 900 && cell.maxLevel >= 3) {
              const score = cell.maxLevel * 10 - Math.abs(c - n * 0.5);
              if (score > highestSummit) {
                highestSummit = score;
                summitPt = { r: r + 1.0, c, zoom: 1.04 };
              }
            }
          }
        }
      }

      const toCamWp = (spec, fallbackR, fallbackC, fallbackZoom) => {
        const rr = clamp(spec ? spec.r : fallbackR, 1, n - 2);
        const cc = clamp(spec ? spec.c : fallbackC, 1, n - 2);
        const rInt = Math.floor(rr);
        const cInt = Math.floor(cc);
        const u = (rr - rInt) * 8.0 + 4.0;
        const v = (cc - cInt) * 8.0 + 4.0;
        const wp = this.cellToWorld(
          clamp(rInt, 0, n - 1),
          clamp(cInt, 0, n - 1),
          clamp(u, 0, 8),
          clamp(v, 0, 8),
          0
        );
        return {
          panX: wp.wx,
          panY: wp.wy + 18,
          zoom: clamp(spec ? spec.zoom : fallbackZoom, 0.85, 1.45),
        };
      };

      // 4 Scenic Loop Waypoints:
      //   1. Winter Festival Square -> 2. Waterfall Gorge & Viaduct ->
      //   3. Freestyle Park & Mountain Coaster -> 4. Matterhorn Observatory & Paragliders
      this._showcaseWaypoints = [
        toCamWp(festPt, n * 0.56, n * 0.50, 1.16),
        toCamWp(gorgePt, n * 0.44, n * 0.30, 1.14),
        toCamWp(coasterPt, n * 0.46, n * 0.68, 1.15),
        toCamWp(summitPt, n * 0.18, n * 0.48, 1.04),
      ];
      this._showcaseWaypointsWorld = world;
      this._showcaseWaypointsVersion = world.version;
      return this._showcaseWaypoints;
    }

    _updateShowcaseCamera(dt) {
      if (!this._showcaseCamActive || !this.world) return;

      // Auto-yield immediately if external drag/minimap/keyboard mutated panX/panY/zoom!
      if (
        Math.abs(this.panX - this._showcaseExpectedPanX) > 0.6 ||
        Math.abs(this.panY - this._showcaseExpectedPanY) > 0.6 ||
        Math.abs(this.zoom - this._showcaseExpectedZoom) > 0.006
      ) {
        this.setShowcaseCamera(false);
        return;
      }

      const wps = this._ensureShowcaseWaypoints();
      const count = wps.length;
      if (count < 2) return;

      const legSeconds = 6.8;
      this._showcaseTime += dt;
      this._showcaseBlendT = Math.min(1.0, this._showcaseBlendT + dt / 1.15);

      const legPos = (this._showcaseTime / legSeconds) % count;
      const i1 = Math.floor(legPos) % count;
      const rawT = legPos - Math.floor(legPos);
      // Gentle cosine smoothstep so camera lingers softly over each landmark without stopping abruptly
      const t = 0.5 - 0.5 * Math.cos(rawT * Math.PI);

      const p0 = wps[(i1 + count - 1) % count];
      const p1 = wps[i1];
      const p2 = wps[(i1 + 1) % count];
      const p3 = wps[(i1 + 2) % count];

      const catmull = (v0, v1, v2, v3, s) => {
        const s2 = s * s;
        const s3 = s2 * s;
        return (
          0.5 *
          (2 * v1 +
            (-v0 + v2) * s +
            (2 * v0 - 5 * v1 + 4 * v2 - v3) * s2 +
            (-v0 + 3 * v1 - 3 * v2 + v3) * s3)
        );
      };

      const targetX = catmull(p0.panX, p1.panX, p2.panX, p3.panX, t);
      const targetY = catmull(p0.panY, p1.panY, p2.panY, p3.panY, t);
      const targetZ = clamp(catmull(p0.zoom, p1.zoom, p2.zoom, p3.zoom, t), this.minZoom, this.maxZoom);

      const b = this._showcaseBlendT;
      const easeB = b * b * (3 - 2 * b);

      this._internalShowcaseStep = true;
      this.panX = this._showcaseFromPanX + (targetX - this._showcaseFromPanX) * easeB;
      this.panY = this._showcaseFromPanY + (targetY - this._showcaseFromPanY) * easeB;
      this.zoom = this._showcaseFromZoom + (targetZ - this._showcaseFromZoom) * easeB;
      this._clampCamera();
      this._internalShowcaseStep = false;

      this._showcaseExpectedPanX = this.panX;
      this._showcaseExpectedPanY = this.panY;
      this._showcaseExpectedZoom = this.zoom;
    }

    setCursorScreen(clientX, clientY) {
      if (!this.canvas) return;
      const rect = this._getCanvasRect();
      this.cursorScreenX = clientX - rect.left;
      this.cursorScreenY = clientY - rect.top;
    }

    resize() {
      this._canvasRect = null;
      if (!this.canvas) return;
      const parent = this.canvas.parentElement;
      const cssW = Math.max(
        320,
        (parent && parent.clientWidth) || window.innerWidth || 1280
      );
      const cssH = Math.max(
        240,
        (parent && parent.clientHeight) || window.innerHeight || 800
      );
      // Performance: render the pixel-art stage at 1x and let CSS `image-rendering: pixelated`
      // upscale it on HiDPI screens (4x fewer pixels to fill per frame, same crisp look).
      const dpr = 1;

      this.viewW = cssW;
      this.viewH = cssH;
      this.dpr = dpr;

      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
      if (this.ctx) {
        this.ctx.imageSmoothingEnabled = false;
      }
      if (!this._cameraInitialized && this.world) {
        this.centerOnWorld(true);
      }
    }

    /**
     * Centers camera on the mid-mountain pistes, aerial lifts & cobblestone village.
     */
    centerOnWorld(resetZoom = false) {
      if (!this._internalShowcaseStep && this._showcaseCamActive) {
        this.setShowcaseCamera(false);
      }
      if (!this.world) return;
      const n = this.world.size || 24;
      this.panX = 0;
      this.panY = Math.round(n * 26.5);
      if (resetZoom) {
        const fitW = (this.viewW * 0.9) / (n * 116);
        const fitH = (this.viewH * 0.86) / (n * 58);
        this.zoom = clamp(
          Math.round(Math.min(1.15, Math.max(0.75, Math.min(fitW, fitH))) * 20) / 20,
          0.5,
          2.0
        );
        if (this.viewW >= 1200 && this.viewH >= 760) {
          this.zoom = 1.0;
        }
      }
      this._cameraInitialized = true;
    }

    resetCamera() {
      if (this._showcaseCamActive) {
        this.setShowcaseCamera(false);
      }
      this.centerOnWorld(true);
    }

    centerOnCell(r, c) {
      if (!this._internalShowcaseStep && this._showcaseCamActive) {
        this.setShowcaseCamera(false);
      }
      if (!this.world || !this.world.inBounds(r, c)) return;
      const pt = this.cellToWorld(r, c, 4.0, 4.0, 0);
      this.panX = pt.wx;
      this.panY = pt.wy - 12;
    }

    panBy(screenDx, screenDy) {
      if (!this._internalShowcaseStep && this._showcaseCamActive) {
        this.setShowcaseCamera(false);
      }
      this.panX -= screenDx / this.zoom;
      this.panY -= screenDy / this.zoom;
      this._clampCamera();
    }

    setZoom(nextZoom, clientX = null, clientY = null) {
      if (!this._internalShowcaseStep && this._showcaseCamActive) {
        this.setShowcaseCamera(false);
      }
      const clamped = clamp(nextZoom, this.minZoom, this.maxZoom);
      if (Math.abs(clamped - this.zoom) < 1e-4) return this.zoom;

      let sx = this.viewW * 0.5;
      let sy = this.viewH * 0.5;
      if (clientX !== null && clientY !== null && this.canvas) {
        const rect = this._getCanvasRect();
        sx = clientX - rect.left;
        sy = clientY - rect.top;
      }

      const worldBeforeX = this.panX + (sx - this.viewW * 0.5) / this.zoom;
      const worldBeforeY = this.panY + (sy - this.viewH * 0.5) / this.zoom;

      this.zoom = clamped;
      this.panX = worldBeforeX - (sx - this.viewW * 0.5) / this.zoom;
      this.panY = worldBeforeY - (sy - this.viewH * 0.5) / this.zoom;
      this._clampCamera();
      return this.zoom;
    }

    zoomBy(factor, clientX = null, clientY = null) {
      return this.setZoom(this.zoom * factor, clientX, clientY);
    }

    _clampCamera() {
      if (!this.world) return;
      const n = this.world.size || 24;
      const maxX = n * 68 + 180;
      const minY = -220;
      const maxY = n * 68 + 200;
      this.panX = clamp(this.panX, -maxX, maxX);
      this.panY = clamp(this.panY, minY, maxY);
    }

    // =========================================================================
    // Coordinate Transforms & ElevatedLv 0..4 `screenToCell` Raycast Picking
    // =========================================================================

    worldToScreen(wx, wy) {
      return {
        x: (wx - this.panX) * this.zoom + this.viewW * 0.5,
        y: (wy - this.panY) * this.zoom + this.viewH * 0.5,
      };
    }

    screenToWorld(clientX, clientY) {
      let sx = clientX;
      let sy = clientY;
      if (this.canvas) {
        const rect = this._getCanvasRect();
        sx = clientX - rect.left;
        sy = clientY - rect.top;
      }
      const wx = this.panX + (sx - this.viewW * 0.5) / this.zoom;
      const wy = this.panY + (sy - this.viewH * 0.5) / this.zoom;
      return {
        x: wx,
        y: wy,
        wx,
        wy,
      };
    }

    cellToWorld(r, c, u = 4.0, v = 4.0, extraZ = 0.0) {
      const baseZ = this.world ? this.world.getSurfaceZ(r, c, u, v, true) : 0.0;
      const totalZ = baseZ + (Number(extraZ) || 0);
      const wx = (c - r) * HALF_W + (v - u) * 8.0;
      const wy = (r + c) * HALF_H + (u + v) * 4.0 - totalZ * 4.0;
      return {
        x: wx,
        y: wy,
        wx,
        wy,
        z: totalZ,
      };
    }

    cellToScreen(r, c, u = 4.0, v = 4.0, extraZ = 0.0) {
      const wp = this.cellToWorld(r, c, u, v, extraZ);
      return this.worldToScreen(wp.wx, wp.wy);
    }

    /**
     * Accurate front-to-back elevated isometric picking across `Lv 0..4` (`z in [0..16]`),
     * handling flat summits, bilinear slopes, and exposed Matterhorn granite cliff skirts!
     */
    screenToCell(clientX, clientY) {
      if (!this.world) return null;
      const { wx, wy } = this.screenToWorld(clientX, clientY);
      const n = this.world.size;

      // Traverse front-to-back (`depth = 2*n - 2` down to `0`) so elevated foreground peaks
      // cleanly occlude valley tiles behind them!
      for (let depth = 2 * n - 2; depth >= 0; depth--) {
        const rMin = Math.max(0, depth - (n - 1));
        const rMax = Math.min(n - 1, depth);
        for (let r = rMin; r <= rMax; r++) {
          const c = depth - r;
          const dx = (c - r) * HALF_W;
          const relX = wx - dx;
          if (relX < -HALF_W || relX > HALF_W) continue;

          const baseTopY = (r + c) * HALF_H;
          const cell = this.world.cells[r][c];
          const maxRisePx = cell.maxLevel * ELEV_STEP_PX + 8;
          if (wy < baseTopY - maxRisePx || wy > baseTopY + 64) continue;

          // Solve bilinear elevation fixed-point:
          //   v - u = relX / 8
          //   u + v = (wy - baseTopY + 4 * z(u, v)) / 4
          const diffUV = relX / 8.0;
          let zEst = ((cell.minLevel + cell.maxLevel) * 0.5) * ELEV_STEP_Z;
          let u = 4.0;
          let v = 4.0;
          for (let iter = 0; iter < 4; iter++) {
            const sumUV = (wy - baseTopY + zEst * 4.0) / 4.0;
            u = (sumUV - diffUV) * 0.5;
            v = (sumUV + diffUV) * 0.5;
            zEst = this.world.getTerrainZ(
              r,
              c,
              clamp(u, 0, 8),
              clamp(v, 0, 8)
            );
          }

          if (u >= -0.08 && u <= 8.08 && v >= -0.08 && v <= 8.08) {
            return {
              r,
              c,
              row: r,
              col: c,
              u: clamp(u, 0, 8),
              v: clamp(v, 0, 8),
              level: cell.minLevel,
              z: zEst,
            };
          }

          // Check exposed granite cliff skirt along front SW (`u = 8`) or SE (`v = 8`) face
          if (cell.maxLevel > 0) {
            if (relX <= 0) {
              const vSkirt = 8.0 + relX / 8.0;
              if (vSkirt >= 0 && vSkirt <= 8.0) {
                const zTopEdge = this.world.getTerrainZ(r, c, 8.0, vSkirt);
                const yTop = baseTopY + (8.0 + vSkirt) * 4.0 - zTopEdge * 4.0;
                const yBot = baseTopY + (8.0 + vSkirt) * 4.0;
                if (wy >= yTop && wy <= yBot) {
                  return {
                    r,
                    c,
                    row: r,
                    col: c,
                    u: 7.8,
                    v: clamp(vSkirt, 0, 8),
                    level: cell.minLevel,
                    z: zTopEdge,
                  };
                }
              }
            } else {
              const uSkirt = 8.0 - relX / 8.0;
              if (uSkirt >= 0 && uSkirt <= 8.0) {
                const zTopEdge = this.world.getTerrainZ(r, c, uSkirt, 8.0);
                const yTop = baseTopY + (uSkirt + 8.0) * 4.0 - zTopEdge * 4.0;
                const yBot = baseTopY + (uSkirt + 8.0) * 4.0;
                if (wy >= yTop && wy <= yBot) {
                  return {
                    r,
                    c,
                    row: r,
                    col: c,
                    u: clamp(uSkirt, 0, 8),
                    v: 7.8,
                    level: cell.minLevel,
                    z: zTopEdge,
                  };
                }
              }
            }
          }
        }
      }

      // Flat z=0 fallback near mountain borders
      const diffUV = wx / 8.0;
      const sumUV = wy / 4.0;
      const globalU = (sumUV - diffUV) * 0.5;
      const globalV = (sumUV + diffUV) * 0.5;
      const r0 = Math.floor(globalU / 8.0);
      const c0 = Math.floor(globalV / 8.0);
      if (this.world.inBounds(r0, c0)) {
        return {
          r: r0,
          c: c0,
          row: r0,
          col: c0,
          u: clamp(globalU - r0 * 8.0, 0, 8),
          v: clamp(globalV - c0 * 8.0, 0, 8),
          level: this.world.cells[r0][c0].minLevel,
          z: 0,
        };
      }
      return null;
    }

    // =========================================================================
    // Atlas Key Helpers (Multi-Sheet `tilesImg` + `tiles2Img`) & Particles
    // =========================================================================

    _ensurePromotedAtlasCanvases() {
      if (!this.atlas || !this.atlas._imgs || typeof document === "undefined") return;
      const imgs = this.atlas._imgs;
      const keys = ["tilesImg", "tiles2Img", "entitiesImg", "thumbnailsImg"];
      let promotedTileSheet = false;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const img = imgs[k];
        if (!img || img._promotedCanvas) continue;
        const w = img.naturalWidth || 0;
        const h = img.naturalHeight || 0;
        if (!(w > 0 && h > 0)) continue;
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const cctx = cv.getContext("2d");
        if (!cctx) continue;
        cctx.imageSmoothingEnabled = false;
        cctx.drawImage(img, 0, 0);
        Object.defineProperty(cv, "naturalWidth", { value: w, configurable: true });
        Object.defineProperty(cv, "naturalHeight", { value: h, configurable: true });
        cv.complete = true;
        cv._promotedCanvas = true;
        imgs[k] = cv;
        if (k === "tilesImg" || k === "tiles2Img") {
          promotedTileSheet = true;
        }
      }
      if (promotedTileSheet) {
        this._staticCacheWorld = null;
      }
    }

    _isAtlasReady() {
      if (!this.atlas || !this.atlas.tiles) return false;
      if (!("_imgs" in this.atlas)) return true;
      const imgs = this.atlas._imgs;
      const img = imgs && imgs.tilesImg;
      if (!img) return false;
      if ("naturalWidth" in img && !(img.naturalWidth > 0)) return false;
      const hasTiles2 =
        Boolean(imgs && "tiles2Img" in imgs) ||
        Boolean(this.atlas.sheets && this.atlas.sheets.tiles2) ||
        Boolean(this.atlas.meta && (this.atlas.meta.tiles2Png || this.atlas.meta.tiles2));
      if (hasTiles2) {
        const img2 = imgs && imgs.tiles2Img;
        if (!img2) return false;
        if ("naturalWidth" in img2 && !(img2.naturalWidth > 0)) return false;
      }
      this._ensurePromotedAtlasCanvases();
      return true;
    }

    _getTileSheetImage(rect) {
      if (!this.atlas) return null;
      const imgs = this.atlas._imgs;
      if (
        imgs &&
        rect &&
        (rect[6] === 1 || rect.sheet === 2 || rect.sheetIdx === 1) &&
        imgs.tiles2Img
      ) {
        return imgs.tiles2Img;
      }
      if (typeof this.atlas.getTileSheetImage === "function") {
        return this.atlas.getTileSheetImage(rect);
      }
      return (imgs && imgs.tilesImg) || null;
    }

    _hasTile(key) {
      return Boolean(
        this.atlas &&
          this.atlas.tiles &&
          Object.prototype.hasOwnProperty.call(this.atlas.tiles, key)
      );
    }

    _hasEntity(key) {
      return Boolean(
        this.atlas &&
          this.atlas.entities &&
          Object.prototype.hasOwnProperty.call(this.atlas.entities, key)
      );
    }

    _resolveCanonicalTileKey(key) {
      if (!this.atlas || !key) return null;
      if (this._hasTile(key)) return key;

      const vMatch = key.match(/^(.*)_v([0-3])$/);
      if (vMatch) {
        const vBase = vMatch[1];
        const vParity = `${vBase}_v${Number(vMatch[2]) & 1}`;
        if (this._hasTile(vParity)) return vParity;
        const vZero = `${vBase}_v0`;
        if (this._hasTile(vZero)) return vZero;
      }
      const stripped = key.replace(/_f[0-3]$/, "").replace(/_v[0-3]$/, "");
      if (stripped !== key && this._hasTile(stripped)) return stripped;
      const withF0 = `${stripped}_f0`;
      if (this._hasTile(withF0)) return withF0;
      const withV0 = `${stripped}_v0`;
      if (this._hasTile(withV0)) return withV0;

      if (this._isAtlasReady()) {
        this.missingKeys.add(key);
      }
      return null;
    }

    _drawTileSafe(ctx, key, dx, dy) {
      if (!this.atlas || !key) return false;
      if (this._hasTile(key)) {
        return this.atlas.drawTile(ctx, key, dx, dy, 1);
      }
      const resolved = this._resolveCanonicalTileKey(key);
      if (resolved) {
        return this.atlas.drawTile(ctx, resolved, dx, dy, 1);
      }
      return false;
    }

    _drawEntitySafe(ctx, key, fx, fy) {
      if (!this.atlas || !key) return false;
      if (this._hasEntity(key)) {
        return this.atlas.drawEntity(ctx, key, fx, fy, 1);
      }
      const fallback = key.replace(/_f[0-9]+$/, "_f0");
      if (fallback !== key && this._hasEntity(fallback)) {
        return this.atlas.drawEntity(ctx, fallback, fx, fy, 1);
      }
      if (this.atlas._imgs && this.atlas._imgs.entitiesImg) {
        this.missingKeys.add(key);
      }
      return false;
    }

    _resolveSurfaceFlatKey(surface, lo, r, c) {
      const surf = surface || "untouched_powder";
      const hash = r * 7 + c * 13;
      const vMaxMask = CORE_4VAR_SURFACES.has(surf) ? 3 : 1;
      const cand = `${surf}_lv${lo}_v${hash & vMaxMask}`;
      if (this._hasTile(cand)) return cand;
      const v0 = `${surf}_lv${lo}_v0`;
      if (this._hasTile(v0)) return v0;
      return `untouched_powder_lv${lo}_v${hash & 3}`;
    }

    _resolveHydroDrawKey(cell, waterFrame) {
      const wf = waterFrame & 3;
      const lo = cell.minLevel || 0;
      const wType = cell.water;

      // 1. Cascading waterfalls on 1100 / 1001 meltwater_brook slopes (#68)
      if (wType === "meltwater_brook" && !cell.isFlat) {
        if (cell.slopeMask === "1100" || cell.slopeMask === "1001") {
          const dir = cell.slopeMask === "1100" ? "sw" : "se";
          const wfKey = `cascading_waterfall_${dir}_f${wf}`;
          if (this._hasTile(wfKey) || this._hasTile(`cascading_waterfall_${dir}_f0`)) {
            return wfKey;
          }
          return `frozen_icefall_${dir}_f${wf}`;
        }
      }

      // 2. Explicit world.js hydroKey (with frame suffix normalized)
      if (cell.hydroKey) {
        const cleanHydro = String(cell.hydroKey).replace(/_f[0-3]$/, "");
        const hk = `${cleanHydro}_f${wf}`;
        if (this._hasTile(hk)) return hk;
        if (this._hasTile(cleanHydro)) return cleanHydro;
      }

      // 3. Deterministic v2 water/creek/crevasse/icefall resolution
      if (wType === "meltwater_brook") {
        return `meltwater_brook_lv${clamp(lo, 0, 3)}_f${wf}`;
      }
      if (wType === "glacier_crevasse") {
        return `glacier_crevasse_lv${clamp(lo, 0, 4)}_f${wf}`;
      }
      if (!cell.isFlat && (cell.slopeMask === "1100" || cell.slopeMask === "1001")) {
        const dir = cell.slopeMask === "1100" ? "sw" : "se";
        if (wType === "meltwater_brook") {
          const cwf = `cascading_waterfall_${dir}_f${wf}`;
          if (this._hasTile(cwf)) return cwf;
        }
        return `frozen_icefall_${dir}_f${wf}`;
      }
      if (wType === "thermal_spring") {
        return `thermal_spring_lv${clamp(lo, 0, 2)}_f${wf}`;
      }
      return `frozen_lake_lv${clamp(lo, 0, 2)}_f${wf}`;
    }

    _resolveStructureDrawKey(structId, animFrame) {
      if (!structId) return null;
      const clean = structId.replace(/_f[0-3]$/, "");
      const fKey = `${clean}_f${animFrame & 3}`;
      if (this._hasTile(fKey)) return fKey;
      if (ANIMATED_STRUCTURES.has(clean)) {
        const f0 = `${clean}_f0`;
        if (this._hasTile(f0)) return f0;
      }
      return structId;
    }

    _resolveFloraDrawKey(floraId, animFrame) {
      if (!floraId) return null;
      const clean = floraId.replace(/_f[0-3]$/, "");
      const fKey = `${clean}_f${animFrame & 3}`;
      if (this._hasTile(fKey)) return fKey;
      if (ANIMATED_FLORA_PREFIXES.has(clean)) {
        const f0 = `${clean}_f0`;
        if (this._hasTile(f0)) return f0;
      }
      return floraId;
    }

    _seedAmbientParticles() {
      if (!this.world) return;
      const n = this.world.size || 24;
      const spanX = n * 62;
      const spanY = n * 58;
      this.particles = [];

      for (let i = 0; i < this._maxParticles; i++) {
        const isSteam = i % 9 === 0;
        this.particles.push({
          kind: isSteam ? "steam" : "snow",
          wx: (Math.random() * 2 - 1) * spanX,
          wy: Math.random() * spanY - 80,
          vx: isSteam ? -2 + Math.random() * 4 : 8 + Math.random() * 12,
          vy: isSteam ? -(10 + Math.random() * 8) : 18 + Math.random() * 18,
          phase: Math.random() * Math.PI * 2,
          size: Math.random() < 0.28 ? 2 : 1,
          alpha: 0.45 + Math.random() * 0.45,
        });
      }
    }

    _updateParticles(dt) {
      if (!this.world || dt <= 0) return;
      const n = this.world.size || 24;
      const spanX = n * 66;
      const maxY = n * 64 + 80;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.phase += dt * 2.1;
        if (p.kind === "snow") {
          p.wx += (p.vx + Math.sin(p.phase) * 5.0) * dt;
          p.wy += p.vy * dt;
          if (p.wy > maxY || p.wx > spanX) {
            p.wx = (Math.random() * 2 - 1) * spanX;
            p.wy = -110 + Math.random() * 60;
          }
        } else {
          p.wx += (p.vx + Math.cos(p.phase * 0.8) * 3.0) * dt;
          p.wy += p.vy * dt;
          if (p.wy < -120 || Math.random() < dt * 0.22) {
            p.wx = (Math.random() * 2 - 1) * (spanX * 0.65);
            p.wy = n * 24 + Math.random() * (n * 28);
          }
        }
      }
    }
    // =========================================================================
    // Offscreen 1:1 World Buffer, Ski Track Buckets & 1px Steel Cable Rasterizer
    // =========================================================================

    _getSceneMetrics(n) {
      const fullW = Math.ceil((n * TILE_W + 416) / 2) * 2;
      const fullH = Math.ceil((n * 64 + 544) / 2) * 2;
      const originX = fullW / 2; // Exact integer (`fullW` is even)
      const originY = 304;       // Generous headroom for Lv 4 summits + 3S tram pylons + clouds
      this._bufGridSize = n;
      this._bufOriginX = originX;
      this._bufOriginY = originY;
      return { fullW, fullH, originX, originY };
    }

    _ensureViewportWorldBuffer(sw, sh) {
      if (!this._worldBuf || !this._worldCtx) return null;
      const vw = Math.max(256, Math.ceil(sw / 128) * 128);
      const vh = Math.max(256, Math.ceil(sh / 128) * 128);
      if (this._worldBuf.width < vw || this._worldBuf.height < vh ||
          this._worldBuf.width > vw + 512 || this._worldBuf.height > vh + 512) {
        this._worldBuf.width = vw;
        this._worldBuf.height = vh;
      }
      if (this._worldCtx.imageSmoothingEnabled !== false) {
        this._worldCtx.imageSmoothingEnabled = false;
      }
      return { buf: this._worldBuf, ctx: this._worldCtx };
    }

    _ensureWorldBuffer(n) {
      const m = this._getSceneMetrics(n);
      if (!this._worldBuf || !this._worldCtx) return null;
      return {
        buf: this._worldBuf,
        ctx: this._worldCtx,
        originX: m.originX,
        originY: m.originY,
        fullW: m.fullW,
        fullH: m.fullH,
      };
    }

    _rebuildSkiTrackBuckets(n) {
      const total = n * n;
      if (this._trackBucketSize !== n || this._trackBuckets.length !== total) {
        this._trackBucketSize = n;
        this._trackBuckets = Array.from({ length: total }, () => []);
      } else {
        for (let i = 0; i < total; i++) {
          this._trackBuckets[i].length = 0;
        }
      }
      if (!this.world || typeof this.world.getSkiTracks !== "function") return;
      const tracks = this.world.getSkiTracks();
      if (!Array.isArray(tracks) || tracks.length === 0) return;

      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        if (!tr || tr.r < 0 || tr.r >= n || tr.c < 0 || tr.c >= n) continue;
        this._trackBuckets[tr.r * n + tr.c].push(tr);
      }
    }

    /**
     * Draws a crisp 1px pixel-stepped steel lift cable between `(x0, y0)` and `(x1, y1)`
     * with matching mid-span catenary sag (`Math.sin(t * Math.PI) * sagAmp`) so aerial
     * grips at `(32, 12)` sit on the exact cable pixels with `0.0px` vertical drift!
     * When `is3S === true` (`tramway_3s`), draws crisp twin track + haul cable lines!
     */
    _drawPixelCableSpan(ctx, x0, y0, x1, y1, sagAmp = 1.5, isGhost = false, is3S = false) {
      // Performance: static (non-ghost) cables are rasterized once into a small cached sprite
      // and re-blitted each frame, replacing thousands of 1px fillRect/fillStyle calls.
      if (!isGhost && typeof document !== "undefined") {
        if (!this._cableCache) this._cableCache = new Map();
        const key = `${x0.toFixed(2)},${y0.toFixed(2)},${x1.toFixed(2)},${y1.toFixed(2)},${sagAmp},${is3S ? 1 : 0}`;
        let entry = this._cableCache.get(key);
        if (!entry) {
          const minX = Math.floor(Math.min(x0, x1)) - 2;
          const maxX = Math.ceil(Math.max(x0, x1)) + 2;
          const minY = Math.floor(Math.min(y0, y1) - Math.abs(sagAmp)) - 5;
          const maxY = Math.ceil(Math.max(y0, y1) + Math.abs(sagAmp)) + 3;
          const cw = Math.max(1, maxX - minX + 1);
          const ch = Math.max(1, maxY - minY + 1);
          const cv = document.createElement("canvas");
          cv.width = cw;
          cv.height = ch;
          const cctx = cv.getContext("2d");
          cctx.imageSmoothingEnabled = false;
          cctx.translate(-minX, -minY);
          this._rasterizeCableSpan(cctx, x0, y0, x1, y1, sagAmp, false, is3S);
          entry = { cv, minX, minY };
          if (this._cableCache.size > 384) this._cableCache.clear();
          this._cableCache.set(key, entry);
        }
        ctx.drawImage(entry.cv, entry.minX, entry.minY);
        return;
      }
      this._rasterizeCableSpan(ctx, x0, y0, x1, y1, sagAmp, isGhost, is3S);
    }

    _rasterizeCableSpan(ctx, x0, y0, x1, y1, sagAmp = 1.5, isGhost = false, is3S = false) {
      const steps = Math.max(2, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      let prevPx = -99999;
      let prevPy = -99999;

      for (let s = 0; s <= steps; s++) {
        if (isGhost && (s & 3) >= 2) continue;
        const t = s / steps;
        const sag = Math.sin(t * Math.PI) * sagAmp;
        const px = Math.round(x0 + (x1 - x0) * t);
        const py = Math.round(y0 + (y1 - y0) * t + sag);
        if (px === prevPx && py === prevPy) continue;
        prevPx = px;
        prevPy = py;

        if (isGhost) {
          ctx.fillStyle = this.ghostPreview && this.ghostPreview.valid === false
            ? "rgba(251, 113, 133, 0.85)"
            : "rgba(110, 231, 183, 0.88)";
          ctx.fillRect(px, py, 1, 1);
          if (is3S) {
            ctx.fillRect(px, py - 2, 1, 1);
          }
        } else {
          if (is3S) {
            // Upper stationary 3S track cable (`2px` above primary haul/hanger line)
            ctx.fillStyle = "rgba(196, 218, 242, 0.86)";
            ctx.fillRect(px, py - 3, 1, 1);
            ctx.fillStyle = "#1b2636";
            ctx.fillRect(px, py - 2, 1, 1);
          }
          // Primary haul / carrier-grip cable at exact `py` (`(32,12)` locks here at `0.0px`!)
          ctx.fillStyle = "rgba(168, 194, 222, 0.82)";
          ctx.fillRect(px, py - 1, 1, 1);
          ctx.fillStyle = "#222e40";
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }

    // =========================================================================
    // Cached `1:1` Static Terrain Dirty-Rect Buffer, Cliff Cap & Minimap Cache
    // =========================================================================

    _buildCellCacheEntry(r, c, n, originX, originY) {
      const cell = this.world.cells[r][c];
      const lo = cell.minLevel || 0;
      const maxLv = cell.maxLevel || 0;
      const dx = Math.round(originX + (c - r) * HALF_W - HALF_W);
      const dy = Math.round(originY + (r + c) * HALF_H - TOP_PAD_Y);
      const dyLv = dy - lo * ELEV_STEP_PX;

      const hasWater = cell.water !== null && cell.water !== undefined;
      let baseTerrainKey = null;
      let hydroKeys = null;
      let hydroUnderlayKey = null;
      let hydroDrawDy = dy;

      if (hasWater) {
        const hk0Raw = this._resolveHydroDrawKey(cell, 0);
        const isCascadeOverlay =
          hk0Raw.startsWith("cascading_waterfall_") || hk0Raw.startsWith("frozen_icefall_");
        const lvMatch = !isCascadeOverlay ? hk0Raw.match(/_lv([0-4])_/) : null;
        const bakedLv = lvMatch ? Number(lvMatch[1]) : 0;
        const extraLvShift = isCascadeOverlay ? lo : Math.max(0, lo - bakedLv);
        hydroDrawDy = dy - extraLvShift * ELEV_STEP_PX;

        if (extraLvShift > 0) {
          if (cell.isFlat) {
            hydroUnderlayKey = this._resolveCanonicalTileKey(
              this._resolveSurfaceFlatKey(cell.surface, lo, r, c)
            );
          } else {
            const sKey = `${cell.surface}_slope_${cell.slopeMask}_lv${lo}`;
            hydroUnderlayKey = this._resolveCanonicalTileKey(
              this._hasTile(sKey) ? sKey : `untouched_powder_slope_${cell.slopeMask}_lv${lo}`
            );
          }
        }
        hydroKeys = [
          this._resolveCanonicalTileKey(hk0Raw),
          this._resolveCanonicalTileKey(this._resolveHydroDrawKey(cell, 1)),
          this._resolveCanonicalTileKey(this._resolveHydroDrawKey(cell, 2)),
          this._resolveCanonicalTileKey(this._resolveHydroDrawKey(cell, 3)),
        ];
      } else if (cell.isFlat) {
        baseTerrainKey = this._resolveCanonicalTileKey(
          this._resolveSurfaceFlatKey(cell.surface, lo, r, c)
        );
      } else {
        const sKey = `${cell.surface}_slope_${cell.slopeMask}_lv${lo}`;
        baseTerrainKey = this._resolveCanonicalTileKey(
          this._hasTile(sKey) ? sKey : `untouched_powder_slope_${cell.slopeMask}_lv${lo}`
        );
      }

      let fringeKeys = null;
      if (cell.surfaceFringes && cell.surfaceFringes.length > 0) {
        fringeKeys = [];
        for (let i = 0; i < cell.surfaceFringes.length; i++) {
          const fk = this._resolveCanonicalTileKey(cell.surfaceFringes[i]);
          if (fk) fringeKeys.push(fk);
        }
        if (fringeKeys.length === 0) fringeKeys = null;
      }

      const wd = cell.waterDecals;
      const bankList =
        wd && Array.isArray(wd.bankKeys)
          ? wd.bankKeys
          : Array.isArray(wd)
          ? wd
          : Array.isArray(cell.bankKeys)
          ? cell.bankKeys
          : null;
      let bankKeys = null;
      if (bankList && bankList.length > 0) {
        bankKeys = [];
        for (let i = 0; i < bankList.length; i++) {
          const bk = this._resolveCanonicalTileKey(bankList[i]);
          if (bk) bankKeys.push(bk);
        }
        if (bankKeys.length === 0) bankKeys = null;
      }

      let staticFlatKey = null;
      let isGroundFlushFlat = false;
      let animFlatKeys = null;
      let staticTallKey = null;
      let animTallKeys = null;
      const s = cell.structure;
      if (s && s.id) {
        const cleanStructId = s.id.replace(/_f[0-3]$/, "");
        // Keep all 4 quadrants of 2x2 animated landmarks locked to phase 0 so Ferris wheels & domes never tear!
        const is2x2Slice = /_2x2_(nw|ne|sw|se)$/.test(cleanStructId);
        const phase = is2x2Slice ? 0 : (r + c) & 1;
        const keys4 = [
          this._resolveCanonicalTileKey(this._resolveStructureDrawKey(s.id, phase)),
          this._resolveCanonicalTileKey(this._resolveStructureDrawKey(s.id, 1 + phase)),
          this._resolveCanonicalTileKey(this._resolveStructureDrawKey(s.id, 2 + phase)),
          this._resolveCanonicalTileKey(this._resolveStructureDrawKey(s.id, 3 + phase)),
        ];
        const allSame =
          keys4[0] !== null &&
          keys4[0] === keys4[1] &&
          keys4[0] === keys4[2] &&
          keys4[0] === keys4[3];
        const roofedSpan = isRoofedSpanId(cleanStructId);
        const isFlatDeck =
          !roofedSpan &&
          (FLAT_DECK_IDS.has(cleanStructId) ||
            FLAT_DECK_IDS.has(s.id) ||
            s.category === "walkway" ||
            s.category === "stairs" ||
            s.category === "bridge" ||
            s.category === "rail");

        if (isFlatDeck) {
          isGroundFlushFlat =
            STATIC_GROUND_DECK_IDS.has(cleanStructId) ||
            ((s.category === "walkway" ||
              s.category === "stairs" ||
              s.category === "bridge" ||
              s.category === "rail") &&
              !cleanStructId.startsWith("rail_crossing_gate_"));

          if (allSame) {
            staticFlatKey = keys4[0];
          } else {
            animFlatKeys = keys4;
          }
        } else if (allSame) {
          staticTallKey = keys4[0];
        } else {
          animTallKeys = keys4;
        }
      }

      let staticFloraKey = null;
      let animFloraKeys = null;
      if (cell.flora) {
        const fPhase = (r * 3 + c) & 3;
        const fKeys = [
          this._resolveCanonicalTileKey(this._resolveFloraDrawKey(cell.flora, fPhase)),
          this._resolveCanonicalTileKey(this._resolveFloraDrawKey(cell.flora, 1 + fPhase)),
          this._resolveCanonicalTileKey(this._resolveFloraDrawKey(cell.flora, 2 + fPhase)),
          this._resolveCanonicalTileKey(this._resolveFloraDrawKey(cell.flora, 3 + fPhase)),
        ];
        if (
          fKeys[0] !== null &&
          fKeys[0] === fKeys[1] &&
          fKeys[0] === fKeys[2] &&
          fKeys[0] === fKeys[3]
        ) {
          staticFloraKey = fKeys[0];
        } else {
          animFloraKeys = fKeys;
        }
      }

      // Compute tight world-buffer bounding rect of static above-ground overlays (`staticFloraKey`, `staticTallKey`, upright `staticFlatKey`)
      let hasStaticOverlay = false;
      let ovX0 = 999999;
      let ovY0 = 999999;
      let ovX1 = -999999;
      let ovY1 = -999999;
      const addSpriteBounds = (k) => {
        if (!k || !this.atlas) return;
        const rc = this.atlas.getTileRect ? this.atlas.getTileRect(k) : null;
        const bx0 = rc ? dx + (rc[4] || 0) : dx;
        const by0 = rc ? dyLv + (rc[5] || 0) : dyLv;
        const bx1 = rc ? bx0 + rc[2] : dx + TILE_W;
        const by1 = rc ? by0 + rc[3] : dyLv + TILE_H;
        if (bx0 < ovX0) ovX0 = bx0;
        if (by0 < ovY0) ovY0 = by0;
        if (bx1 > ovX1) ovX1 = bx1;
        if (by1 > ovY1) ovY1 = by1;
        hasStaticOverlay = true;
      };
      if (staticFloraKey) addSpriteBounds(staticFloraKey);
      if (staticTallKey) addSpriteBounds(staticTallKey);
      if (staticFlatKey && !isGroundFlushFlat) addSpriteBounds(staticFlatKey);

      const hasAnimSprite = Boolean(animFlatKeys || animFloraKeys || animTallKeys);
      let animX0 = dx;
      let animY0 = dyLv;
      let animX1 = dx + TILE_W;
      let animY1 = dyLv + TILE_H;
      if (hasAnimSprite && this.atlas && this.atlas.getTileRect) {
        let ax0 = 999999;
        let ay0 = 999999;
        let ax1 = -999999;
        let ay1 = -999999;
        const addAnimArr = (arr) => {
          if (!arr) return;
          for (let fi = 0; fi < 4; fi++) {
            const rc = arr[fi] ? this.atlas.getTileRect(arr[fi]) : null;
            if (!rc) continue;
            const x0 = dx + (rc[4] || 0);
            const y0 = dyLv + (rc[5] || 0);
            if (x0 < ax0) ax0 = x0;
            if (y0 < ay0) ay0 = y0;
            if (x0 + rc[2] > ax1) ax1 = x0 + rc[2];
            if (y0 + rc[3] > ay1) ay1 = y0 + rc[3];
          }
        };
        addAnimArr(animFlatKeys);
        addAnimArr(animFloraKeys);
        addAnimArr(animTallKeys);
        if (ax0 <= ax1) {
          animX0 = ax0;
          animY0 = ay0;
          animX1 = ax1;
          animY1 = ay1;
        }
      }

      const isGroomedPiste = !hasWater && cell.surface === "groomed_piste";
      let scrapeOffsets = null;
      if (isGroomedPiste) {
        scrapeOffsets = new Int16Array(8);
        const seed = (r * 31 + c * 17) & 7;
        for (let k = 0; k < 4; k++) {
          const uScr = 2.0 + ((seed + k * 2.1) % 4.5);
          const vScr = 2.0 + ((seed * 1.7 + k * 1.9) % 4.5);
          const zScr = this.world.getTerrainZ(r, c, uScr, vScr);
          scrapeOffsets[k * 2] = Math.round((c - r) * HALF_W + (vScr - uScr) * 8);
          scrapeOffsets[k * 2 + 1] = Math.round(
            (r + c) * HALF_H + (uScr + vScr) * 4 - zScr * 4
          );
        }
      }

      return {
        r,
        c,
        idx: r * n + c,
        lo,
        maxLv,
        dx,
        dy,
        dyLv,
        topDrawY: Math.min(dy, dyLv),
        botDrawY: dy + TILE_H,
        hasWater,
        baseTerrainKey,
        hydroKeys,
        hydroUnderlayKey,
        hydroDrawDy,
        fringeKeys,
        bankKeys,
        staticFlatKey,
        isGroundFlushFlat,
        animFlatKeys,
        staticFloraKey,
        animFloraKeys,
        staticTallKey,
        animTallKeys,
        hasStaticOverlay,
        ovX0,
        ovY0,
        ovX1,
        ovY1,
        hasAnimSprite,
        animX0,
        animY0,
        animX1,
        animY1,
        isGroomedPiste,
        scrapeOffsets,
        occludesNorthCliff: false,
        occludesNorthOverlay: false,
        occludesNorth: false,
        hasStaticDynamic: false,
        _cliffSlotEpoch: 0,
        _cliffSlotX: 0,
        _cliffSlotY: 0,
        _cliffSlotH: 0,
        _cliffSlotWf: -1,
      };
    }

    _recomputeOccludesNorth(r0, c0, r1, c1, n) {
      const cache = this._cellRenderCache;
      const sr0 = clamp(r0, 0, n - 1);
      const sc0 = clamp(c0, 0, n - 1);
      const sr1 = clamp(r1, 0, n - 1);
      const sc1 = clamp(c1, 0, n - 1);

      for (let r = sr0; r <= sr1; r++) {
        for (let c = sc0; c <= sc1; c++) {
          const desc = cache[r * n + c];
          if (!desc) continue;
          const maxLv = desc.maxLv;
          let occCliff = false;
          let occOverlay = false;

          const checkNorth = (nr, nc, minDrop) => {
            if (nr < 0 || nc < 0) return;
            const nb = cache[nr * n + nc];
            if (!nb || !nb.hasAnimSprite) return;
            if (maxLv > 0 && maxLv - nb.lo >= minDrop) {
              if (
                nb.animX1 > desc.dx &&
                nb.animX0 < desc.dx + TILE_W &&
                nb.animY1 > desc.topDrawY &&
                nb.animY0 < desc.botDrawY
              ) {
                occCliff = true;
              }
            }
            if (
              desc.hasStaticOverlay &&
              nb.animX1 > desc.ovX0 &&
              nb.animX0 < desc.ovX1 &&
              nb.animY1 > desc.ovY0 &&
              nb.animY0 < desc.ovY1
            ) {
              occOverlay = true;
            }
          };

          checkNorth(r - 1, c, 1);
          checkNorth(r, c - 1, 1);
          checkNorth(r - 1, c - 1, 1);
          checkNorth(r - 2, c - 1, 3);
          checkNorth(r - 1, c - 2, 3);

          desc.occludesNorthCliff = occCliff;
          desc.occludesNorthOverlay = occOverlay;
          desc.occludesNorth = occCliff;
          desc.hasStaticDynamic = Boolean(
            desc.hasAnimSprite || occCliff || occOverlay
          );
          desc._cliffSlotWf = -1;
        }
      }
    }

    _acquireWaterFrameCanvas(rw, rh) {
      if (typeof document === "undefined") return null;
      const pool = this._waterFrameCanvasPool;
      let cv = pool[this._waterPoolUsed];
      if (!cv) {
        cv = document.createElement("canvas");
        pool[this._waterPoolUsed] = cv;
      }
      this._waterPoolUsed++;
      if (cv.width !== rw || cv.height !== rh) {
        cv.width = rw;
        cv.height = rh;
      }
      return cv;
    }

    _bakeWaterFrameCanvas(rc, wf) {
      const rw = rc.x1 - rc.x0;
      const rh = rc.y1 - rc.y0;
      if (rw <= 0 || rh <= 0) return null;
      let fcv = rc.frameCanvases[wf];
      if (!fcv) {
        fcv = this._acquireWaterFrameCanvas(rw, rh);
        if (!fcv) return null;
        rc.frameCanvases[wf] = fcv;
      }
      const fctx = fcv.getContext("2d");
      if (!fctx) return null;
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.globalCompositeOperation = "source-over";
      fctx.imageSmoothingEnabled = false;
      fctx.clearRect(0, 0, rw, rh);
      fctx.save();
      fctx.translate(-rc.x0, -rc.y0);
      const cells = rc.cells;
      for (let j = 0; j < cells.length; j++) {
        this._drawCellStaticGround(fctx, cells[j], wf);
      }
      fctx.restore();
      return fcv;
    }

    _rebuildWaterDirtyRects(n, bufW, bufH) {
      const cache = this._cellRenderCache;
      const blockCols = Math.ceil(n / 7);
      const blocks = new Map();

      for (let i = 0; i < cache.length; i++) {
        const d = cache[i];
        if (!d || !d.hasWater) continue;
        const bKey = ((d.r / 7) | 0) * blockCols + ((d.c / 7) | 0);
        let box = blocks.get(bKey);
        const x0 = Math.max(0, d.dx - 4);
        const y0 = Math.max(0, Math.min(d.topDrawY, d.hydroDrawDy) - 4);
        const x1 = Math.min(bufW, d.dx + TILE_W + 4);
        const y1 = Math.min(bufH, d.botDrawY + 4);
        if (!box) {
          blocks.set(bKey, { x0, y0, x1, y1 });
        } else {
          if (x0 < box.x0) box.x0 = x0;
          if (y0 < box.y0) box.y0 = y0;
          if (x1 > box.x1) box.x1 = x1;
          if (y1 > box.y1) box.y1 = y1;
        }
      }

      const rects = Array.from(blocks.values());
      // Merge any overlapping or touching boxes until all `rects` are 100% mutually disjoint
      let merged = true;
      while (merged) {
        merged = false;
        for (let i = 0; i < rects.length && !merged; i++) {
          const a = rects[i];
          for (let j = i + 1; j < rects.length; j++) {
            const b = rects[j];
            if (a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0) {
              a.x0 = Math.min(a.x0, b.x0);
              a.y0 = Math.min(a.y0, b.y0);
              a.x1 = Math.max(a.x1, b.x1);
              a.y1 = Math.max(a.y1, b.y1);
              rects.splice(j, 1);
              merged = true;
              break;
            }
          }
        }
      }

      for (let ri = 0; ri < rects.length; ri++) {
        rects[ri].cells = [];
        rects[ri].frameCanvases = [null, null, null, null];
      }

      this._waterDirtyRects = rects;
      this._waterPoolUsed = 0;
      const patchList = [];

      if (rects.length > 0) {
        for (let depth = 0; depth <= 2 * n - 2; depth++) {
          const rMin = Math.max(0, depth - (n - 1));
          const rMax = Math.min(n - 1, depth);
          for (let r = rMin; r <= rMax; r++) {
            const c = depth - r;
            const d = cache[r * n + c];
            if (!d) continue;
            const cx0 = d.dx;
            const cx1 = d.dx + TILE_W;
            const cy0 = Math.min(d.topDrawY, d.hydroDrawDy);
            const cy1 = d.botDrawY;
            let addedAny = false;
            for (let ri = 0; ri < rects.length; ri++) {
              const rc = rects[ri];
              if (cx1 > rc.x0 && cx0 < rc.x1 && cy1 > rc.y0 && cy0 < rc.y1) {
                rc.cells.push(d);
                if (!addedAny) {
                  patchList.push(d);
                  addedAny = true;
                }
              }
            }
          }
        }

        // Pre-bake all 4 water animation frames (`wf = 0..3`) onto disjoint `rc.frameCanvases`
        // once atlas sheets are ready (`0` `sctx.clip()` calls & `0` steady-frame allocations!)
        if (this._isAtlasReady()) {
          for (let ri = 0; ri < rects.length; ri++) {
            const rc = rects[ri];
            if (rc.cells.length === 0) continue;
            for (let wf = 0; wf < 4; wf++) {
              this._bakeWaterFrameCanvas(rc, wf);
            }
          }
        }
      }
      this._waterPatchCellList = patchList;
    }

    _drawCellStaticGround(ctx, desc, waterFrame) {
      const atlas = this.atlas;
      if (!atlas) return;
      const dx = desc.dx;
      const dy = desc.dy;
      const dyLv = desc.dyLv;

      // 1a. Base Terrain or Hydrology
      if (desc.hasWater) {
        if (desc.hydroUnderlayKey) {
          atlas.drawTile(ctx, desc.hydroUnderlayKey, dx, dy, 1);
        }
        const hk = desc.hydroKeys[waterFrame & 3];
        if (hk) {
          atlas.drawTile(ctx, hk, dx, desc.hydroDrawDy, 1);
        }
      } else if (desc.baseTerrainKey) {
        atlas.drawTile(ctx, desc.baseTerrainKey, dx, dy, 1);
      }

      // 1b. Scalloped Surface Fringes
      if (desc.fringeKeys) {
        for (let i = 0; i < desc.fringeKeys.length; i++) {
          atlas.drawTile(ctx, desc.fringeKeys[i], dx, dyLv, 1);
        }
      }

      // 1c. Scalloped Water Banks
      if (desc.bankKeys) {
        for (let i = 0; i < desc.bankKeys.length; i++) {
          atlas.drawTile(ctx, desc.bankKeys[i], dx, dyLv, 1);
        }
      }

      // 2a_static. Non-animated Flat Decks & Walkways
      if (desc.staticFlatKey) {
        atlas.drawTile(ctx, desc.staticFlatKey, dx, dyLv, 1);
      }

      // 2c_static. Static Non-Animated Mountain Flora, Rocks, Gates & Park Props
      if (desc.staticFloraKey) {
        atlas.drawTile(ctx, desc.staticFloraKey, dx, dyLv, 1);
      }

      // 2d_static. Static Non-Animated Structures, Pylons & Halfpipe Walls
      if (desc.staticTallKey) {
        atlas.drawTile(ctx, desc.staticTallKey, dx, dyLv, 1);
      }
    }

    _drawCellOpaqueMask1a(ctx, desc, ox, oy, waterFrame) {
      const atlas = this.atlas;
      if (!atlas || !desc) return;
      if (desc.hasWater) {
        if (desc.hydroUnderlayKey) {
          atlas.drawTile(ctx, desc.hydroUnderlayKey, ox, oy, 1);
        }
        const hk = desc.hydroKeys[waterFrame & 3];
        if (hk) {
          atlas.drawTile(ctx, hk, ox, oy + (desc.hydroDrawDy - desc.dy), 1);
        }
      } else if (desc.baseTerrainKey) {
        atlas.drawTile(ctx, desc.baseTerrainKey, ox, oy, 1);
      }
    }

    /**
     * Packs `(r, c)`'s southern-masked `128x288` cliff-cap sprite into a single reusable
     * `_cliffAtlasCanvas` (`0` per-cell `document.createElement("canvas")` churn!).
     */
    _drawCliffCap(ctx, desc, n, waterFrame) {
      const atlasCanvas = this._cliffAtlasCanvas;
      const actx = this._cliffAtlasCtx;
      const scratch = this._cliffScratchCanvas;
      const cctx = this._cliffScratchCtx;
      if (!atlasCanvas || !actx || !scratch || !cctx || !this.atlas) return;

      const wf = waterFrame & 3;
      const epoch = this._cliffAtlasEpoch;
      const needsBake =
        desc._cliffSlotEpoch !== epoch ||
        desc._cliffSlotWf < 0 ||
        (desc.hasWater && desc._cliffSlotWf !== wf);

      if (needsBake) {
        const SLOT_W = 128;
        const SLOT_H = 288;
        const cols = 8;

        if (desc._cliffSlotEpoch !== epoch) {
          const maxRows = Math.floor(atlasCanvas.height / SLOT_H);
          const maxSlots = cols * maxRows;
          if (this._cliffAtlasNextSlot >= maxSlots) {
            // Grow atlas height once by 4 rows (`1152px`) while preserving existing slots
            const prevH = atlasCanvas.height;
            cctx.clearRect(0, 0, scratch.width, scratch.height);
            const grown = document.createElement("canvas");
            grown.width = atlasCanvas.width;
            grown.height = prevH + SLOT_H * 4;
            const gctx = grown.getContext("2d");
            if (gctx) {
              gctx.imageSmoothingEnabled = false;
              gctx.drawImage(atlasCanvas, 0, 0);
              this._cliffAtlasCanvas = grown;
              this._cliffAtlasCtx = gctx;
            } else {
              this._cliffAtlasNextSlot = 0;
            }
          }
          const slotIdx = this._cliffAtlasNextSlot++;
          desc._cliffSlotX = (slotIdx % cols) * SLOT_W;
          desc._cliffSlotY = ((slotIdx / cols) | 0) * SLOT_H;
          desc._cliffSlotEpoch = epoch;
        }

        const topShift = desc.dy - desc.topDrawY;
        const ch = Math.min(SLOT_H, TILE_H + topShift);
        cctx.imageSmoothingEnabled = false;
        cctx.globalCompositeOperation = "source-over";
        cctx.clearRect(0, 0, TILE_W, ch);

        const atlas = this.atlas;
        if (desc.hasWater) {
          if (desc.hydroUnderlayKey) {
            atlas.drawTile(cctx, desc.hydroUnderlayKey, 0, topShift, 1);
          }
          const hk = desc.hydroKeys[wf];
          if (hk) {
            atlas.drawTile(cctx, hk, 0, topShift + (desc.hydroDrawDy - desc.dy), 1);
          }
        } else if (desc.baseTerrainKey) {
          atlas.drawTile(cctx, desc.baseTerrainKey, 0, topShift, 1);
        }
        if (desc.fringeKeys) {
          for (let i = 0; i < desc.fringeKeys.length; i++) {
            atlas.drawTile(cctx, desc.fringeKeys[i], 0, topShift + (desc.dyLv - desc.dy), 1);
          }
        }
        if (desc.bankKeys) {
          for (let i = 0; i < desc.bankKeys.length; i++) {
            atlas.drawTile(cctx, desc.bankKeys[i], 0, topShift + (desc.dyLv - desc.dy), 1);
          }
        }
        if (desc.staticFlatKey && desc.isGroundFlushFlat) {
          atlas.drawTile(cctx, desc.staticFlatKey, 0, topShift + (desc.dyLv - desc.dy), 1);
        }

        // Punch out pixels covered by southern neighbors `(r+1, c)`, `(r, c+1)`, `(r+1, c+1)`
        cctx.globalCompositeOperation = "destination-out";
        const r = desc.r;
        const c = desc.c;
        const cache = this._cellRenderCache;
        if (r + 1 < n) {
          this._drawCellOpaqueMask1a(cctx, cache[(r + 1) * n + c], -HALF_W, topShift + HALF_H, wf);
        }
        if (c + 1 < n) {
          this._drawCellOpaqueMask1a(cctx, cache[r * n + (c + 1)], HALF_W, topShift + HALF_H, wf);
        }
        if (r + 1 < n && c + 1 < n) {
          this._drawCellOpaqueMask1a(cctx, cache[(r + 1) * n + (c + 1)], 0, topShift + HALF_H * 2, wf);
        }
        cctx.globalCompositeOperation = "source-over";

        const dstActx = this._cliffAtlasCtx;
        dstActx.imageSmoothingEnabled = false;
        dstActx.clearRect(desc._cliffSlotX, desc._cliffSlotY, TILE_W, ch);
        dstActx.drawImage(scratch, 0, 0, TILE_W, ch, desc._cliffSlotX, desc._cliffSlotY, TILE_W, ch);

        desc._cliffSlotH = ch;
        desc._cliffSlotWf = wf;
      }

      ctx.drawImage(
        this._cliffAtlasCanvas,
        desc._cliffSlotX,
        desc._cliffSlotY,
        TILE_W,
        desc._cliffSlotH,
        desc.dx,
        desc.topDrawY,
        TILE_W,
        desc._cliffSlotH
      );
    }

    _ensureStaticTerrainCache(waterFrame, bufW, bufH, originX, originY) {
      if (!this._staticTerrainBuf || !this._staticTerrainCtx || !this.world) return false;
      const world = this.world;
      const n = world.size;
      const wf = waterFrame & 3;
      const atlasReady = this._isAtlasReady();

      let sizeChanged = false;
      if (this._staticTerrainBuf.width !== bufW || this._staticTerrainBuf.height !== bufH) {
        this._staticTerrainBuf.width = bufW;
        this._staticTerrainBuf.height = bufH;
        sizeChanged = true;
      }
      const sctx = this._staticTerrainCtx;
      if (sctx.imageSmoothingEnabled !== false) sctx.imageSmoothingEnabled = false;

      const total = n * n;
      if (this._dynCliffMarks.length !== total) {
        this._dynCliffMarks = new Uint32Array(total);
        this._dynOverlayMarks = new Uint32Array(total);
      }

      const needsRebuildOrPatch =
        sizeChanged ||
        this._staticCacheWorld !== world ||
        this._staticCacheGridSize !== n ||
        this._staticCacheAtlasReady !== atlasReady ||
        this._staticCacheVersion !== world.version ||
        this._cellRenderCache.length !== total;

      if (needsRebuildOrPatch) {
        let dirty = null;
        if (
          !sizeChanged &&
          this._staticCacheWorld === world &&
          this._staticCacheGridSize === n &&
          this._staticCacheAtlasReady === atlasReady &&
          this._cellRenderCache.length === total &&
          this._staticCacheVersion >= 0
        ) {
          if (typeof world.getDirtyBoundsSince === "function") {
            dirty = world.getDirtyBoundsSince(this._staticCacheVersion);
          } else if (
            world.lastEditBounds &&
            !world.lastEditBounds.full &&
            world.lastEditBounds.prevVersion === this._staticCacheVersion &&
            world.lastEditBounds.version === world.version
          ) {
            dirty = world.lastEditBounds;
          }
        }

        if (dirty && dirty.empty && !dirty.full) {
          this._staticCacheVersion = world.version;
        } else if (
          dirty &&
          !dirty.full &&
          typeof dirty.r0 === "number" &&
          dirty.r0 <= dirty.r1 &&
          dirty.c0 <= dirty.c1
        ) {
          // Incremental Dirty-Rect Patch (#106): rebuild descriptors in neighborhood + clip redraw!
          const pr0 = clamp(dirty.r0 - 2, 0, n - 1);
          const pc0 = clamp(dirty.c0 - 2, 0, n - 1);
          const pr1 = clamp(dirty.r1 + 2, 0, n - 1);
          const pc1 = clamp(dirty.c1 + 2, 0, n - 1);

          for (let r = pr0; r <= pr1; r++) {
            for (let c = pc0; c <= pc1; c++) {
              const prevDesc = this._cellRenderCache[r * n + c];
              const nextDesc = this._buildCellCacheEntry(r, c, n, originX, originY);
              if (prevDesc && prevDesc._cliffSlotEpoch === this._cliffAtlasEpoch) {
                nextDesc._cliffSlotEpoch = prevDesc._cliffSlotEpoch;
                nextDesc._cliffSlotX = prevDesc._cliffSlotX;
                nextDesc._cliffSlotY = prevDesc._cliffSlotY;
              }
              this._cellRenderCache[r * n + c] = nextDesc;
            }
          }
          // Invalidate cliff caps 1 cell further north in case southern neighbor mask changed
          const cr0 = clamp(pr0 - 1, 0, n - 1);
          const cc0 = clamp(pc0 - 1, 0, n - 1);
          for (let r = cr0; r <= pr1; r++) {
            for (let c = cc0; c <= pc1; c++) {
              const d = this._cellRenderCache[r * n + c];
              if (d) d._cliffSlotWf = -1;
            }
          }
          this._recomputeOccludesNorth(cr0, cc0, clamp(pr1 + 2, 0, n - 1), clamp(pc1 + 2, 0, n - 1), n);
          this._rebuildWaterDirtyRects(n, bufW, bufH);

          const minDx = Math.round(originX + (dirty.c0 - dirty.r1) * HALF_W - HALF_W);
          const maxDx = Math.round(originX + (dirty.c1 - dirty.r0) * HALF_W + HALF_W);
          const minDy = Math.round(
            originY + (dirty.r0 + dirty.c0) * HALF_H - TOP_PAD_Y - 4 * ELEV_STEP_PX
          );
          const maxDy = Math.round(
            originY + (dirty.r1 + dirty.c1) * HALF_H - TOP_PAD_Y + TILE_H
          );

          const dirtyX0 = Math.max(0, minDx - 192);
          const dirtyY0 = Math.max(0, minDy - 256);
          const dirtyX1 = Math.min(bufW, maxDx + 192);
          const dirtyY1 = Math.min(bufH, maxDy + 256);
          const dw = dirtyX1 - dirtyX0;
          const dh = dirtyY1 - dirtyY0;

          if (dw > 0 && dh > 0) {
            sctx.save();
            sctx.beginPath();
            sctx.rect(dirtyX0, dirtyY0, dw, dh);
            sctx.clip();
            sctx.clearRect(dirtyX0, dirtyY0, dw, dh);

            for (let depth = 0; depth <= 2 * n - 2; depth++) {
              const rMin = Math.max(0, depth - (n - 1));
              const rMax = Math.min(n - 1, depth);
              for (let r = rMin; r <= rMax; r++) {
                const c = depth - r;
                const d = this._cellRenderCache[r * n + c];
                if (
                  d.dx + TILE_W <= dirtyX0 ||
                  d.dx >= dirtyX1 ||
                  d.botDrawY <= dirtyY0 ||
                  Math.min(d.topDrawY, d.hydroDrawDy) >= dirtyY1
                ) {
                  continue;
                }
                this._drawCellStaticGround(sctx, d, wf);
              }
            }
            sctx.restore();
          }

          this._staticCacheVersion = world.version;
          if (wf !== this._staticWaterFrame) {
            this._patchStaticWaterFrame(sctx, wf);
          }
          return true;
        } else {
          // Full Cache & Static Terrain Buffer Rebuild (initial boot, preset load, or undo/redo)
          this._cliffAtlasEpoch = (this._cliffAtlasEpoch + 1) || 1;
          this._cliffAtlasNextSlot = 0;

          if (this._cellRenderCache.length !== total) {
            this._cellRenderCache = new Array(total);
          }
          for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
              this._cellRenderCache[r * n + c] = this._buildCellCacheEntry(
                r,
                c,
                n,
                originX,
                originY
              );
            }
          }
          this._recomputeOccludesNorth(0, 0, n - 1, n - 1, n);
          this._rebuildWaterDirtyRects(n, bufW, bufH);

          sctx.clearRect(0, 0, bufW, bufH);
          for (let depth = 0; depth <= 2 * n - 2; depth++) {
            const rMin = Math.max(0, depth - (n - 1));
            const rMax = Math.min(n - 1, depth);
            for (let r = rMin; r <= rMax; r++) {
              const c = depth - r;
              this._drawCellStaticGround(sctx, this._cellRenderCache[r * n + c], wf);
            }
          }

          this._staticCacheWorld = world;
          this._staticCacheGridSize = n;
          this._staticCacheAtlasReady = atlasReady;
          this._staticCacheVersion = world.version;
          this._staticWaterFrame = wf;
          return true;
        }
      }

      // Same `world.version`: only refresh water dirty-rects on the 4.2 Hz `waterFrame` tick!
      if (wf !== this._staticWaterFrame) {
        this._patchStaticWaterFrame(sctx, wf);
      }
      return true;
    }

    _patchStaticWaterFrame(sctx, wf) {
      const rects = this._waterDirtyRects;
      const frameIdx = wf & 3;
      if (rects.length > 0) {
        if (sctx.imageSmoothingEnabled !== false) sctx.imageSmoothingEnabled = false;
        for (let i = 0; i < rects.length; i++) {
          const rc = rects[i];
          const rw = rc.x1 - rc.x0;
          const rh = rc.y1 - rc.y0;
          if (rw <= 0 || rh <= 0 || !rc.cells || rc.cells.length === 0) continue;
          const fcv = rc.frameCanvases[frameIdx] || this._bakeWaterFrameCanvas(rc, frameIdx);
          if (fcv) {
            sctx.clearRect(rc.x0, rc.y0, rw, rh);
            sctx.drawImage(fcv, rc.x0, rc.y0);
          }
        }
      }
      this._staticWaterFrame = frameIdx;
    }

    /**
     * Ensures the lightweight `256x160` whole-island minimap overview buffer is fresh for
     * `world.version`, compositing `_staticTerrainBuf` + animated structures so the
     * minimap stays 100% crisp across the entire mountain even when zoomed in!
     */
    _ensureMinimapSceneBuffer() {
      if (!this._minimapSceneBuf || !this._minimapSceneCtx || !this.world) return false;
      if (!this.atlas) {
        this.atlas = window.SANCTUARY_ATLAS || null;
      }
      const world = this.world;
      const n = world.size;
      const m = this._getSceneMetrics(n);

      const wf = Math.floor(this.time * 4.2) & 3;
      this._ensureStaticTerrainCache(wf, m.fullW, m.fullH, m.originX, m.originY);

      const atlasReady = this._isAtlasReady();
      const mmW = 256;
      const mmH = 160;
      if (this._minimapSceneBuf.width !== mmW || this._minimapSceneBuf.height !== mmH) {
        this._minimapSceneBuf.width = mmW;
        this._minimapSceneBuf.height = mmH;
        this._minimapSceneVersion = -1;
      }

      const worldMaxX = n * 64;
      const worldMidY = n * 32 - 28;
      const worldHalfY = n * 32 + 56;
      const fullSx = Math.max(0, m.originX - worldMaxX);
      const fullSy = Math.max(0, m.originY + worldMidY - worldHalfY);
      const fullSw = Math.min(m.fullW - fullSx, worldMaxX * 2);
      const fullSh = Math.min(m.fullH - fullSy, worldHalfY * 2);
      this._minimapFullBounds = { fullSx, fullSy, fullSw, fullSh, mmW, mmH };

      if (
        this._minimapSceneWorld === world &&
        this._minimapSceneVersion === world.version &&
        this._minimapSceneAtlasReady === atlasReady
      ) {
        return true;
      }

      const mctx = this._minimapSceneCtx;
      mctx.clearRect(0, 0, mmW, mmH);
      if (fullSw > 0 && fullSh > 0 && this._staticTerrainBuf) {
        mctx.save();
        mctx.imageSmoothingEnabled = true;
        mctx.drawImage(
          this._staticTerrainBuf,
          fullSx,
          fullSy,
          fullSw,
          fullSh,
          0,
          0,
          mmW,
          mmH
        );

        // Static flora & static structures are already baked in `_staticTerrainBuf`; stamp animated frame-0 tiles
        if (atlasReady && this._cellRenderCache.length === n * n) {
          mctx.scale(mmW / fullSw, mmH / fullSh);
          mctx.translate(-fullSx, -fullSy);
          const cache = this._cellRenderCache;
          for (let depth = 0; depth <= 2 * n - 2; depth++) {
            const rMin = Math.max(0, depth - (n - 1));
            const rMax = Math.min(n - 1, depth);
            for (let r = rMin; r <= rMax; r++) {
              const c = depth - r;
              const d = cache[r * n + c];
              if (!d || !d.hasAnimSprite) continue;
              if (d.animFlatKeys && d.animFlatKeys[0]) {
                this.atlas.drawTile(mctx, d.animFlatKeys[0], d.dx, d.dyLv, 1);
              }
              if (d.animFloraKeys && d.animFloraKeys[0]) {
                this.atlas.drawTile(mctx, d.animFloraKeys[0], d.dx, d.dyLv, 1);
              }
              if (d.animTallKeys && d.animTallKeys[0]) {
                this.atlas.drawTile(mctx, d.animTallKeys[0], d.dx, d.dyLv, 1);
              }
            }
          }
        }
        mctx.restore();
      }

      this._minimapSceneWorld = world;
      this._minimapSceneVersion = world.version;
      this._minimapSceneAtlasReady = atlasReady;
      return true;
    }

    /**
     * Fast whole-island minimap blitter supporting both:
     *   - `renderMinimapSnapshot(targetCtx, cw, ch, proj)` (`#105` 4-arg projection form)
     *   - `renderMinimapSnapshot(targetCtx, dstX, dstY, dstW, dstH, sx, sy, sw, sh)` (`#106` rect form)
     */
    renderMinimapSnapshot(targetCtx, dstX, dstY, dstW, dstH, sx, sy, sw, sh) {
      if (!targetCtx || !this.world) return false;
      if (!this._ensureMinimapSceneBuffer()) return false;
      const mb = this._minimapSceneBuf;
      const b = this._minimapFullBounds;
      if (!mb || !b || b.fullSw <= 0 || b.fullSh <= 0) return false;

      let outX = 0;
      let outY = 0;
      let outW = 0;
      let outH = 0;
      let srcX = 0;
      let srcY = 0;
      let srcW = b.mmW;
      let srcH = b.mmH;

      if (dstW && typeof dstW === "object") {
        // 4-arg `(targetCtx, cw, ch, proj)` signature
        const proj = dstW;
        outX = proj.cx - proj.halfW;
        outY = proj.cy - proj.halfH;
        outW = proj.halfW * 2;
        outH = proj.halfH * 2;
      } else if (typeof dstH === "number") {
        // 5-arg / 9-arg `(targetCtx, dstX, dstY, dstW, dstH, sx, sy, sw, sh)` signature
        outX = dstX;
        outY = dstY;
        outW = dstW;
        outH = dstH;
        if (typeof sx === "number" && typeof sy === "number" && sw > 0 && sh > 0) {
          const scaleX = b.mmW / b.fullSw;
          const scaleY = b.mmH / b.fullSh;
          srcX = clamp((sx - b.fullSx) * scaleX, 0, b.mmW);
          srcY = clamp((sy - b.fullSy) * scaleY, 0, b.mmH);
          srcW = clamp(sw * scaleX, 1, b.mmW - srcX);
          srcH = clamp(sh * scaleY, 1, b.mmH - srcY);
        }
      } else if (typeof dstX === "number" && typeof dstY === "number") {
        outX = 0;
        outY = 0;
        outW = dstX;
        outH = dstY;
      }

      if (outW <= 0 || outH <= 0) return false;
      const prevSmooth = targetCtx.imageSmoothingEnabled;
      targetCtx.imageSmoothingEnabled = true;
      targetCtx.drawImage(mb, srcX, srcY, srcW, srcH, outX, outY, outW, outH);
      targetCtx.imageSmoothingEnabled = prevSmooth;
      return true;
    }

    // =========================================================================
    // Main Render Frame (`render(dt)` / `draw(dt)`)
    // =========================================================================

    draw(dtSeconds = 0.016) {
      return this.render(dtSeconds);
    }

    render(dtSeconds = 0.016) {
      if (!this.ctx || !this.canvas || !this.world) return;
      if (!this.atlas) {
        this.atlas = window.SANCTUARY_ATLAS || null;
      }

      const dt = clamp(Number(dtSeconds) || 0.016, 0, 0.1);
      this.time += dt;
      this._updateShowcaseCamera(dt);
      this._fireworkGlowUsed = 0;
      this._fireworkGlowsScratch.length = 0;
      if (typeof this.world.updateSkiTracks === "function") {
        this.world.updateSkiTracks(dt);
      }
      if (typeof this.world.updateClouds === "function") {
        this.world.updateClouds(dt, this.time);
      }
      this._updateParticles(dt);

      const ctx = this.ctx;
      const dpr = this.dpr;
      const w = this.viewW;
      const h = this.viewH;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // 1. Winter Sky & Distant Horizon Backdrop (`1` cached `drawImage` blit!)
      this._drawBackdrop(ctx, w, h);

      // 2. Render Visible Resort Region at Exact Integer `1:1` Pixel Scale onto Viewport-Sized `_worldBuf`
      //    (`0.0px` seam gaps between adjacent tiles at any zoom `0.5x..3.0x`!)
      const sm = this._getSceneMetrics(this.world.size);
      const vwCheck = this._worldBuf && this._worldCtx;
      if (vwCheck) {
        const destX = Math.round((w * 0.5 - (this.panX + sm.originX) * this.zoom) * dpr) / dpr;
        const destY = Math.round((h * 0.5 - (this.panY + sm.originY) * this.zoom) * dpr) / dpr;
        const z = this.zoom;
        const fullW = sm.fullW;
        const fullH = sm.fullH;

        const sx0 = clamp(Math.floor(-destX / z), 0, fullW);
        const sy0 = clamp(Math.floor(-destY / z), 0, fullH);
        const sx1 = clamp(Math.ceil((w - destX) / z), 0, fullW);
        const sy1 = clamp(Math.ceil((h - destY) / z), 0, fullH);
        const sw = sx1 - sx0;
        const sh = sy1 - sy0;

        if (sw > 0 && sh > 0) {
          const wb = this._ensureViewportWorldBuffer(sw, sh);
          const wctx = wb.ctx;
          const CULL_MARGIN_X = 160;
          const CULL_MARGIN_Y = 208;
          const cx0 = Math.max(0, sx0 - CULL_MARGIN_X);
          const cy0 = Math.max(0, sy0 - CULL_MARGIN_Y);
          const cx1 = Math.min(fullW, sx1 + CULL_MARGIN_X);
          const cy1 = Math.min(fullH, sy1 + CULL_MARGIN_Y);

          const waterFrame = Math.floor(this.time * 4.2) & 3;
          const hasStaticCache = this._ensureStaticTerrainCache(
            waterFrame,
            fullW,
            fullH,
            sm.originX,
            sm.originY
          );

          wctx.setTransform(1, 0, 0, 1, 0, 0);
          wctx.globalCompositeOperation = "source-over";
          if (wctx.imageSmoothingEnabled !== false) wctx.imageSmoothingEnabled = false;
          wctx.clearRect(0, 0, sw, sh);

          if (hasStaticCache) {
            // Fast 1-call `source-over` integer blit onto viewport-sized `_worldBuf` (no `clip()` / `"copy"`!)
            wctx.drawImage(this._staticTerrainBuf, sx0, sy0, sw, sh, 0, 0, sw, sh);

            wctx.save();
            wctx.translate(-sx0, -sy0);
            this._cullRect = { x0: cx0, y0: cy0, x1: cx1, y1: cy1 };
            try {
              this._renderDynamicScenePass(wctx, sm.originX, sm.originY, true);
            } finally {
              this._cullRect = null;
              wctx.restore();
            }
          } else {
            wctx.save();
            wctx.translate(-sx0, -sy0);
            this._cullRect = { x0: cx0, y0: cy0, x1: cx1, y1: cy1 };
            try {
              this._renderMountainScene(wctx, sm.originX, sm.originY, true);
            } finally {
              this._cullRect = null;
              wctx.restore();
            }
          }

          if (ctx.imageSmoothingEnabled !== false) ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            wb.buf,
            0,
            0,
            sw,
            sh,
            destX + sx0 * z,
            destY + sy0 * z,
            sw * z,
            sh * z
          );
        }
      } else {
        ctx.save();
        const originScreenX = w * 0.5 - this.panX * this.zoom;
        const originScreenY = h * 0.5 - this.panY * this.zoom;
        ctx.translate(originScreenX, originScreenY);
        ctx.scale(this.zoom, this.zoom);
        ctx.imageSmoothingEnabled = false;
        this._renderMountainScene(ctx, 0, 0, true);
        ctx.restore();
      }

      // 3. Winter Atmosphere Lighting (`alpenglow` sunbeams / `night` floodlight & chalet glows)
      this._drawAtmosphereLighting(ctx, w, h);

      // 4. Inspected Target Ring, Tactile Ghost Outlines, Floating `+$` Popups & Viewfinder
      this._drawInspectedHighlight(ctx);
      if (this.ghostPreview && !this.cameraToolActive) {
        this._drawGhostOverlayScreen(ctx);
      }
      this._drawFloatingPopups(ctx);

      if (this.cameraToolActive) {
        this._drawCameraViewfinder(ctx);
      }

      ctx.restore();
    }

    _populateGhostCellMap(world, n, structFrame, includeGhost) {
      const ghostCellMap = this._ghostCellMap;
      ghostCellMap.clear();
      const gp = includeGhost && !this.cameraToolActive ? this.ghostPreview : null;
      if (!gp) return ghostCellMap;

      const liftPrev = gp.liftPreview || gp.preview;
      const cand2x2 = gp.baseId || gp.itemId || gp.id || "";
      const clean2x2 = String(cand2x2).replace(/_(nw|ne|sw|se)(_f[0-3])?$/, "");
      const is2x2Landmark =
        gp.kind !== "sculpt" &&
        (COMPOSITE_2X2_IDS.has(clean2x2) || gp.isComposite2x2 || gp.footprint === 2);

      if (gp.kind === "lift" && liftPrev && Array.isArray(liftPrev.ghostSprites)) {
        for (let i = 0; i < liftPrev.ghostSprites.length; i++) {
          const gs = liftPrev.ghostSprites[i];
          if (world.inBounds(gs.r, gs.c)) {
            ghostCellMap.set(gs.r * n + gs.c, {
              spriteKey: this._resolveCanonicalTileKey(
                this._resolveStructureDrawKey(gs.spriteKey, structFrame)
              ),
              level: gs.level !== undefined ? gs.level : world.cells[gs.r][gs.c].minLevel,
              valid: gp.valid !== false,
            });
          }
        }
      } else if (
        is2x2Landmark &&
        typeof gp.r === "number" &&
        typeof gp.c === "number"
      ) {
        const baseId = COMPOSITE_2X2_IDS.has(clean2x2) ? clean2x2 : "grand_hotel_2x2";
        const baseLv = world.inBounds(gp.r, gp.c) ? world.cells[gp.r][gp.c].minLevel : 0;
        const slices = [
          [0, 0, `${baseId}_nw`],
          [0, 1, `${baseId}_ne`],
          [1, 0, `${baseId}_sw`],
          [1, 1, `${baseId}_se`],
        ];
        for (let i = 0; i < slices.length; i++) {
          const sr = gp.r + slices[i][0];
          const sc = gp.c + slices[i][1];
          if (world.inBounds(sr, sc)) {
            ghostCellMap.set(sr * n + sc, {
              spriteKey: this._resolveCanonicalTileKey(
                this._resolveStructureDrawKey(slices[i][2], structFrame)
              ),
              level: baseLv,
              valid: gp.valid !== false,
            });
          }
        }
      } else if (
        gp.spriteKey &&
        gp.kind !== "sculpt" &&
        gp.kind !== "surface" &&
        gp.kind !== "water" &&
        gp.kind !== "bulldoze" &&
        gp.kind !== "inspect" &&
        typeof gp.r === "number" &&
        typeof gp.c === "number" &&
        world.inBounds(gp.r, gp.c)
      ) {
        ghostCellMap.set(gp.r * n + gp.c, {
          spriteKey: this._resolveCanonicalTileKey(gp.spriteKey),
          level: world.cells[gp.r][gp.c].minLevel,
          valid: gp.valid !== false,
        });
      }
      return ghostCellMap;
    }

    _drawCellSkiTracks(ctx, cellTracks, originX, originY) {
      for (let ti = 0; ti < cellTracks.length; ti++) {
        const tr = cellTracks[ti];
        const fade = clamp(1.0 - tr.age / (tr.maxAge || 18.0), 0, 1);
        if (fade <= 0.04) continue;
        const tx = Math.round(originX + tr.wx);
        const ty = Math.round(originY + tr.wy);

        if (tr.kind === "groomer" || tr.kind === "winch_cat_yellow") {
          ctx.fillStyle = lutPick(LUT_WHITE, fade * 0.45);
          ctx.fillRect(tx - 4, ty, 8, 1);
        } else if (tr.kind === "snowboarder" || tr.kind === "snow_tuber") {
          ctx.fillStyle = lutPick(LUT_BOARD_CARVE, fade * 0.52);
          ctx.fillRect(tx - 1, ty, 3, 1);
          ctx.fillStyle = lutPick(LUT_SNOW_LIP, fade * 0.48);
          ctx.fillRect(tx - 1, ty - 1, 2, 1);
        } else {
          const nx = Math.round(Math.cos((tr.angle || 0) + Math.PI * 0.5) * 2);
          const ny = Math.round(Math.sin((tr.angle || 0) + Math.PI * 0.5) * 1);
          ctx.fillStyle = lutPick(LUT_SKI_CARVE, fade * 0.52);
          ctx.fillRect(tx - nx, ty - ny, 2, 1);
          ctx.fillRect(tx + nx, ty + ny, 2, 1);
        }
      }
    }

    /**
     * Fast Dynamic Painter's Pass over `_staticTerrainBuf` (`#106`):
     * Skips ~500/784 empty static cells completely, uses pre-resolved sprite key arrays
     * (`0` regex/template strings per frame), and re-stamps exact southern-masked cliff caps
     * on `_occludesNorth` / entity-seam cells for 100.000% Painter's Z-order parity!
     */
    _renderDynamicScenePass(ctx, originX, originY, includeGhost = true) {
      const world = this.world;
      const n = world.size;
      const waterFrame = Math.floor(this.time * 4.2) & 3;
      const structFrame = Math.floor(this.time * 4.8) & 3;
      const floraFrame = Math.floor(this.time * 5.2) & 3;
      const atlas = this.atlas;

      this._rebuildSkiTrackBuckets(n);
      const projBuckets = this._collectProjectileBuckets(n, originX, originY);
      const clouds = this._resolveFloatingClouds(n);
      const highAirborne = this._highAirborne;
      highAirborne.length = 0;

      const ghostCellMap = this._populateGhostCellMap(world, n, structFrame, includeGhost);
      const hasGhosts = ghostCellMap.size > 0;
      const hasProjs = projBuckets.hasAny;
      const projByCell = projBuckets.byCell;
      const trackBuckets = this._trackBuckets;
      const cache = this._cellRenderCache;
      const worldCells = world.cells;
      const hasSimEntities = Boolean(this.sim && typeof this.sim.getEntitiesInCell === "function");
      const cull = this._cullRect;
      const cullX0 = cull ? cull.x0 : -999999;
      const cullY0 = cull ? cull.y0 : -999999;
      const cullX1 = cull ? cull.x1 : 999999;
      const cullY1 = cull ? cull.y1 : 999999;

      const frameStamp = (this._frameStamp = (this._frameStamp + 1) >>> 0 || 1);
      const dynCliffMarks = this._dynCliffMarks;
      const dynOverlayMarks = this._dynOverlayMarks;

      for (let depth = 0; depth <= 2 * n - 2; depth++) {
        const rMin = Math.max(0, depth - (n - 1));
        const rMax = Math.min(n - 1, depth);

        for (let r = rMin; r <= rMax; r++) {
          const c = depth - r;
          const idx = r * n + c;
          const desc = cache[idx];
          if (!desc) continue;

          const dx = desc.dx;
          const dy = desc.dy;
          if (dx > cullX1 || dx + TILE_W < cullX0 || desc.topDrawY > cullY1 || desc.botDrawY < cullY0) {
            continue;
          }

          const cellTracks = trackBuckets[idx];
          const hasTracks = cellTracks.length > 0;
          const entities = hasSimEntities ? this.sim.getEntitiesInCell(r, c) : null;
          const hasEnts = Boolean(entities && entities.length > 0);
          const cell = worldCells[r][c];
          const wornPiste = desc.isGroomedPiste && cell.pisteQuality < 72;
          const cellProjs = hasProjs ? projByCell.get(idx) : undefined;
          const ghostHere = hasGhosts ? ghostCellMap.get(idx) : undefined;
          const dynCliff = dynCliffMarks[idx] === frameStamp;
          const dynOverlay = dynOverlayMarks[idx] === frameStamp;

          if (
            !desc.hasStaticDynamic &&
            !hasEnts &&
            !hasTracks &&
            !wornPiste &&
            !cellProjs &&
            !ghostHere &&
            !dynCliff &&
            !dynOverlay
          ) {
            continue;
          }

          const dyLv = desc.dyLv;
          const needCliffCap = desc.occludesNorthCliff || dynCliff;

          // Cliff Cap Re-Stamp from single `_cliffAtlasCanvas`: covers northern tall sprites / entities!
          if (needCliffCap) {
            this._drawCliffCap(ctx, desc, n, waterFrame);
          }

          // 1d. Subtle Worn Piste Corduroy Scrape Cue (`pisteQuality < 72`)
          if (wornPiste && desc.scrapeOffsets) {
            const wearAlpha = clamp((72 - cell.pisteQuality) / 85, 0.08, 0.42);
            ctx.fillStyle = lutPick(LUT_WORN_PISTE, wearAlpha);
            const pts = desc.scrapeOffsets;
            for (let k = 0; k < 8; k += 2) {
              ctx.fillRect(originX + pts[k] - 2, originY + pts[k + 1], 4, 1);
            }
          }

          // 1e. Persistent Fading `1px` Twin Ski-Carve Tracks
          if (hasTracks) {
            this._drawCellSkiTracks(ctx, cellTracks, originX, originY);
          }

          // 2a. Flat Decks (animated OR static re-stamp when tracks/wear/upright-canopy present)
          if (desc.animFlatKeys && atlas) {
            const fk = desc.animFlatKeys[structFrame];
            if (fk) atlas.drawTile(ctx, fk, dx, dyLv, 1);
          } else if (
            desc.staticFlatKey &&
            atlas &&
            (wornPiste || hasTracks || !desc.isGroundFlushFlat)
          ) {
            atlas.drawTile(ctx, desc.staticFlatKey, dx, dyLv, 1);
          }

          // 2a-ii. Ice-Surface Projectiles (`puck` & `curling_stone`)
          if (cellProjs) {
            for (let pi = 0; pi < cellProjs.length; pi++) {
              if (cellProjs[pi].kind !== "snowball") {
                this._drawSingleProjectile(ctx, cellProjs[pi]);
              }
            }
          }

          // 2b. Back-Half Ground Entities (`u + v < 8.0` & `extraZ < 0.45`) + High Airborne Shadows
          if (hasEnts) {
            for (let ei = 0; ei < entities.length; ei++) {
              const ent = entities[ei];
              const ez = ent.extraZ !== undefined && Number.isFinite(ent.extraZ) ? ent.extraZ : 0;
              if (ez >= 8.0) {
                this._drawHighAirborneShadow(ctx, ent, r, c, originX, originY);
                highAirborne.push({ ent, r, c, sortKey: r + c + ez * 0.01 });
                continue;
              }
              if (ent.u + ent.v < 8.0 && ez < 0.45) {
                this._drawGroundEntity(ctx, ent, r, c, originX, originY);
              }
            }
          }

          // 2c. Mountain Flora, Gates, Park Props & Animated Snowmaking / Neon / Floodlights
          if (atlas) {
            if (desc.animFloraKeys) {
              const flk = desc.animFloraKeys[floraFrame];
              if (flk) atlas.drawTile(ctx, flk, dx, dyLv, 1);
            } else if (desc.staticFloraKey) {
              atlas.drawTile(ctx, desc.staticFloraKey, dx, dyLv, 1);
            }
          }

          // 2d. Tall Chalets, `2x2` Landmark Slices, Lift Stations, Garlands & Pylons
          if (atlas) {
            if (desc.animTallKeys) {
              const tk = desc.animTallKeys[structFrame];
              if (tk) atlas.drawTile(ctx, tk, dx, dyLv, 1);
            } else if (desc.staticTallKey) {
              atlas.drawTile(ctx, desc.staticTallKey, dx, dyLv, 1);
            }
          }

          // 2e. Painter-Interleaved Translucent Ghost Tile / Lift Station Sprite
          if (ghostHere && ghostHere.spriteKey && atlas) {
            const gDy = dy - ghostHere.level * ELEV_STEP_PX;
            ctx.save();
            ctx.globalAlpha = ghostHere.valid ? 0.72 : 0.45;
            atlas.drawTile(ctx, ghostHere.spriteKey, dx, gDy, 1);
            ctx.restore();
          }

          // 2f. Front-Half Ground Entities (`u + v >= 8.0` or Park Jumpers `0.45 <= extraZ < 8.0`)
          if (hasEnts) {
            for (let ei = 0; ei < entities.length; ei++) {
              const ent = entities[ei];
              const ez = ent.extraZ !== undefined && Number.isFinite(ent.extraZ) ? ent.extraZ : 0;
              if (ez >= 8.0) continue;
              if (ent.u + ent.v >= 8.0 || ez >= 0.45) {
                this._drawGroundEntity(ctx, ent, r, c, originX, originY);
              }
            }
          }

          // 2g. Arcing Snowballs & Powder Bursts in `(r, c)`
          if (cellProjs) {
            for (let pi = 0; pi < cellProjs.length; pi++) {
              if (cellProjs[pi].kind === "snowball") {
                this._drawSingleProjectile(ctx, cellProjs[pi]);
              }
            }
          }

          // Propagate dynamic occlusion strictly to southern cliffs (`S.maxLv > lo`) and overlapping southern trees/buildings!
          const didDynDraw =
            hasEnts ||
            hasTracks ||
            wornPiste ||
            Boolean(cellProjs) ||
            Boolean(ghostHere) ||
            needCliffCap ||
            dynOverlay;

          if (didDynDraw) {
            const refLv = ghostHere ? Math.min(desc.lo, ghostHere.level) : desc.lo;
            let drX0 = 999999;
            let drY0 = 999999;
            let drX1 = -999999;
            let drY1 = -999999;

            if (hasEnts || cellProjs) {
              drX0 = dx - 16;
              drY0 = dyLv + 88;
              drX1 = dx + TILE_W + 16;
              drY1 = dyLv + TILE_H + 16;
            }
            if (ghostHere) {
              const gy0 = dy - ghostHere.level * ELEV_STEP_PX;
              if (dx < drX0) drX0 = dx;
              if (gy0 < drY0) drY0 = gy0;
              if (dx + TILE_W > drX1) drX1 = dx + TILE_W;
              if (gy0 + TILE_H > drY1) drY1 = gy0 + TILE_H;
            }
            if (desc.hasStaticOverlay) {
              if (desc.ovX0 < drX0) drX0 = desc.ovX0;
              if (desc.ovY0 < drY0) drY0 = desc.ovY0;
              if (desc.ovX1 > drX1) drX1 = desc.ovX1;
              if (desc.ovY1 > drY1) drY1 = desc.ovY1;
            }
            if (needCliffCap) {
              if (dx < drX0) drX0 = dx;
              if (desc.topDrawY < drY0) drY0 = desc.topDrawY;
              if (dx + TILE_W > drX1) drX1 = dx + TILE_W;
              if (desc.botDrawY > drY1) drY1 = desc.botDrawY;
            }

            const markSouth = (sr, sc, minDrop) => {
              if (sr >= n || sc >= n) return;
              const sIdx = sr * n + sc;
              const sDesc = cache[sIdx];
              if (!sDesc) return;
              // Uphill cliff cap ONLY when southern cell rises above `(r, c)` and `(r, c)` drew entities/projs/ghost!
              if (
                sDesc.maxLv - refLv >= minDrop &&
                (hasEnts || cellProjs || ghostHere)
              ) {
                dynCliffMarks[sIdx] = frameStamp;
              }
              // Southern tree/building re-stamp ONLY when pixel bounding rects actually intersect!
              if (
                sDesc.hasStaticOverlay &&
                drX0 <= drX1 &&
                drX1 > sDesc.ovX0 &&
                drX0 < sDesc.ovX1 &&
                drY1 > sDesc.ovY0 &&
                drY0 < sDesc.ovY1
              ) {
                dynOverlayMarks[sIdx] = frameStamp;
              }
            };

            markSouth(r + 1, c, 1);
            markSouth(r, c + 1, 1);
            markSouth(r + 1, c + 1, 1);
            if (hasEnts || ghostHere || desc.hasStaticOverlay) {
              markSouth(r + 2, c + 1, 3);
              markSouth(r + 1, c + 2, 3);
            }
          }
        }
      }

      // Unbucketed projectiles + Torchlight Embers + Selfie 4-Point Star Flashes (`sim.getCameraFlashes()`)
      for (let i = 0; i < projBuckets.loose.length; i++) {
        this._drawSingleProjectile(ctx, projBuckets.loose[i]);
      }
      this._drawTorchEmbers(ctx, originX, originY);
      this._drawSelfieCameraFlashes(ctx, originX, originY);

      // PASS 1.8: Soft Mountain-Hugging Cloud Shadows
      this._drawFloatingCloudShadows(ctx, clouds, originX, originY);

      // PASS 2: All 10 Uphill Lift Cables & Cable-Locked Aerial Carriers
      this._renderAerialLiftNetwork(ctx, originX, originY, includeGhost);

      // PASS 2.5: High-Altitude Balloons, Paragliders, Golden Eagles & VIP Helicopters
      if (highAirborne.length > 0) {
        highAirborne.sort((a, b) => a.sortKey - b.sortKey);
        for (let i = 0; i < highAirborne.length; i++) {
          const item = highAirborne[i];
          this._drawGroundEntity(ctx, item.ent, item.r, item.c, originX, originY, false);
        }
      }

      // PASS 3: Reference-Grade Floating Volumetric `3D` Pixel Clouds (`extraZ ~ 22`)
      this._drawFloatingClouds(ctx, clouds, originX, originY);

      // PASS 3.5: Crisp Pixel-Art Fireworks (`sim.getFireworks()`) in Day, Alpenglow & Night!
      this._drawFireworksWorldPass(ctx, originX, originY);

      // PASS 4: Ambient Winter Snow Crystals & Hot-Spring Steam Wisps
      this._drawAmbientParticles(ctx, originX, originY);
    }

    /**
     * Renders the complete Alpine Peak v3 resort directly onto an arbitrary `(ctx, originX, originY)`
     * (used by `exportDioramaPNG()` and non-DOM unit environments).
     */
    _renderMountainScene(ctx, originX, originY, includeGhost = true) {
      const world = this.world;
      const n = world.size;
      const waterFrame = Math.floor(this.time * 4.2) & 3;
      const structFrame = Math.floor(this.time * 4.8) & 3;
      const floraFrame = Math.floor(this.time * 5.2) & 3;
      this._fireworkGlowUsed = 0;
      this._fireworkGlowsScratch.length = 0;

      this._rebuildSkiTrackBuckets(n);
      const projBuckets = this._collectProjectileBuckets(n, originX, originY);
      const clouds = this._resolveFloatingClouds(n);
      const highAirborne = this._highAirborne;
      highAirborne.length = 0;
      const ghostCellMap = this._populateGhostCellMap(world, n, structFrame, includeGhost);

      // -----------------------------------------------------------------------
      // PASS 1: Strict Topological Painter's Order (`depth = 0 .. 2*n - 2`)
      // -----------------------------------------------------------------------
      for (let depth = 0; depth <= 2 * n - 2; depth++) {
        const rMin = Math.max(0, depth - (n - 1));
        const rMax = Math.min(n - 1, depth);

        for (let r = rMin; r <= rMax; r++) {
          const c = depth - r;
          const cell = world.cells[r][c];
          const lo = cell.minLevel;

          const dx = Math.round(originX + (c - r) * HALF_W - HALF_W);
          const dy = Math.round(originY + (r + c) * HALF_H - TOP_PAD_Y);
          const cull = this._cullRect;
          if (
            cull &&
            (dx > cull.x1 || dx + TILE_W < cull.x0 || dy > cull.y1 || dy + TILE_H < cull.y0)
          ) {
            continue;
          }

          const dyLv = dy - lo * ELEV_STEP_PX;

          // 1a. Base Surface or Animated Hydrology
          if (cell.water !== null && cell.water !== undefined) {
            const hKey = this._resolveHydroDrawKey(cell, waterFrame);
            const isCascadeOverlay =
              hKey.startsWith("cascading_waterfall_") || hKey.startsWith("frozen_icefall_");
            const lvMatch = !isCascadeOverlay ? hKey.match(/_lv([0-4])_/) : null;
            const bakedLv = lvMatch ? Number(lvMatch[1]) : 0;
            const extraLvShift = isCascadeOverlay ? lo : Math.max(0, lo - bakedLv);

            if (extraLvShift > 0) {
              if (cell.isFlat) {
                this._drawTileSafe(ctx, this._resolveSurfaceFlatKey(cell.surface, lo, r, c), dx, dy);
              } else {
                const sKey = `${cell.surface}_slope_${cell.slopeMask}_lv${lo}`;
                this._drawTileSafe(
                  ctx,
                  this._hasTile(sKey) ? sKey : `untouched_powder_slope_${cell.slopeMask}_lv${lo}`,
                  dx,
                  dy
                );
              }
            }
            this._drawTileSafe(ctx, hKey, dx, dy - extraLvShift * ELEV_STEP_PX);
          } else if (cell.isFlat) {
            const tKey = this._resolveSurfaceFlatKey(cell.surface, lo, r, c);
            this._drawTileSafe(ctx, tKey, dx, dy);
          } else {
            const sKey = `${cell.surface}_slope_${cell.slopeMask}_lv${lo}`;
            if (this._hasTile(sKey)) {
              this._drawTileSafe(ctx, sKey, dx, dy);
            } else {
              this._drawTileSafe(ctx, `untouched_powder_slope_${cell.slopeMask}_lv${lo}`, dx, dy);
            }
          }

          // 1b. Scalloped 12-Code Snow / Piste / Brick Fringes
          if (cell.surfaceFringes && cell.surfaceFringes.length > 0) {
            for (let i = 0; i < cell.surfaceFringes.length; i++) {
              this._drawTileSafe(ctx, cell.surfaceFringes[i], dx, dyLv);
            }
          }

          // 1c. Scalloped 12-Code Ice / Spring / Meltwater Brook Banks
          const wd = cell.waterDecals;
          const bankList =
            wd && Array.isArray(wd.bankKeys)
              ? wd.bankKeys
              : Array.isArray(wd)
              ? wd
              : Array.isArray(cell.bankKeys)
              ? cell.bankKeys
              : null;
          if (bankList && bankList.length > 0) {
            for (let i = 0; i < bankList.length; i++) {
              this._drawTileSafe(ctx, bankList[i], dx, dyLv);
            }
          }

          // 1d. Subtle Worn Piste Corduroy Scrape Cue (`pisteQuality < 72`)
          if (
            cell.water === null &&
            cell.surface === "groomed_piste" &&
            cell.pisteQuality < 72
          ) {
            const wearAlpha = clamp((72 - cell.pisteQuality) / 85, 0.08, 0.42);
            ctx.fillStyle = lutPick(LUT_WORN_PISTE, wearAlpha);
            const seed = (r * 31 + c * 17) & 7;
            for (let k = 0; k < 4; k++) {
              const uScr = 2.0 + ((seed + k * 2.1) % 4.5);
              const vScr = 2.0 + ((seed * 1.7 + k * 1.9) % 4.5);
              const zScr = world.getTerrainZ(r, c, uScr, vScr);
              const sx = Math.round(originX + (c - r) * HALF_W + (vScr - uScr) * 8);
              const sy = Math.round(originY + (r + c) * HALF_H + (uScr + vScr) * 4 - zScr * 4);
              ctx.fillRect(sx - 2, sy, 4, 1);
            }
          }

          // 1e. Persistent Fading `1px` Twin Ski-Carve Tracks on `(r, c)`
          const cellTracks = this._trackBuckets[r * n + c];
          if (cellTracks && cellTracks.length > 0) {
            this._drawCellSkiTracks(ctx, cellTracks, originX, originY);
          }

          // 2a. Classify Cell Structure into Flat/Low Deck vs Tall Building/Tower
          const s = cell.structure;
          let flatKey = null;
          let tallKey = null;
          if (s && s.id) {
            const cleanStructId = s.id.replace(/_f[0-3]$/, "");
            const is2x2Slice = /_2x2_(nw|ne|sw|se)$/.test(cleanStructId);
            const phase = is2x2Slice ? 0 : (r + c) & 1;
            const animKey = this._resolveStructureDrawKey(s.id, structFrame + phase);
            const roofedSpan = isRoofedSpanId(cleanStructId);
            if (
              !roofedSpan &&
              (FLAT_DECK_IDS.has(cleanStructId) ||
                FLAT_DECK_IDS.has(s.id) ||
                s.category === "walkway" ||
                s.category === "stairs" ||
                s.category === "bridge" ||
                s.category === "rail")
            ) {
              flatKey = animKey;
            } else {
              tallKey = animKey;
            }
          }

          if (flatKey) {
            this._drawTileSafe(ctx, flatKey, dx, dyLv);
          }

          // 2a-ii. Ice-Surface Projectiles (`puck` & `curling_stone`) on `(r, c)`
          const cellProjs = projBuckets.byCell.get(r * n + c);
          if (cellProjs) {
            for (let pi = 0; pi < cellProjs.length; pi++) {
              if (cellProjs[pi].kind !== "snowball") {
                this._drawSingleProjectile(ctx, cellProjs[pi]);
              }
            }
          }

          // 2b. Ground Entities in `(r, c)` Sorted by `u + v`
          const entities =
            this.sim && typeof this.sim.getEntitiesInCell === "function"
              ? this.sim.getEntitiesInCell(r, c)
              : null;

          if (entities && entities.length > 0) {
            for (let ei = 0; ei < entities.length; ei++) {
              const ent = entities[ei];
              const ez = ent.extraZ !== undefined && Number.isFinite(ent.extraZ) ? ent.extraZ : 0;
              if (ez >= 8.0) {
                this._drawHighAirborneShadow(ctx, ent, r, c, originX, originY);
                highAirborne.push({ ent, r, c, sortKey: r + c + ez * 0.01 });
                continue;
              }
              if (ent.u + ent.v < 8.0 && ez < 0.45) {
                this._drawGroundEntity(ctx, ent, r, c, originX, originY);
              }
            }
          }

          // 2c. Mountain Flora, Gates, Park Props & Animated Snowmaking / Neon / Floodlights
          if (cell.flora) {
            const fKey = this._resolveFloraDrawKey(cell.flora, floraFrame + ((r * 3 + c) & 3));
            this._drawTileSafe(ctx, fKey, dx, dyLv);
          }

          // 2d. Tall Chalets, `2x2` Landmark Slices, Lift Stations, Garlands & Pylons
          if (tallKey) {
            this._drawTileSafe(ctx, tallKey, dx, dyLv);
          }

          // 2e. Painter-Interleaved Translucent Ghost Tile / Lift Station Sprite
          const ghostHere = ghostCellMap.get(r * n + c);
          if (ghostHere && ghostHere.spriteKey) {
            const gDy = dy - ghostHere.level * ELEV_STEP_PX;
            ctx.save();
            ctx.globalAlpha = ghostHere.valid ? 0.72 : 0.45;
            this._drawTileSafe(ctx, ghostHere.spriteKey, dx, gDy);
            ctx.restore();
          }

          // 2f. Front-Half Ground Entities (`u + v >= 8.0` or Park Jumpers `0.45 <= extraZ < 8.0`)
          if (entities && entities.length > 0) {
            for (let ei = 0; ei < entities.length; ei++) {
              const ent = entities[ei];
              const ez = ent.extraZ !== undefined && Number.isFinite(ent.extraZ) ? ent.extraZ : 0;
              if (ez >= 8.0) continue;
              if (ent.u + ent.v >= 8.0 || ez >= 0.45) {
                this._drawGroundEntity(ctx, ent, r, c, originX, originY);
              }
            }
          }

          // 2g. Arcing Snowballs & Powder Bursts in `(r, c)`
          if (cellProjs) {
            for (let pi = 0; pi < cellProjs.length; pi++) {
              if (cellProjs[pi].kind === "snowball") {
                this._drawSingleProjectile(ctx, cellProjs[pi]);
              }
            }
          }
        }
      }

      // Any unbucketed projectiles + Torchlight Embers + crisp Selfie 4-Point Star Flashes
      for (let i = 0; i < projBuckets.loose.length; i++) {
        this._drawSingleProjectile(ctx, projBuckets.loose[i]);
      }
      this._drawTorchEmbers(ctx, originX, originY);
      this._drawSelfieCameraFlashes(ctx, originX, originY);

      // PASS 1.8: Soft Mountain-Hugging Cloud Shadows (`rgba(26, 48, 78, 0.12)`)
      this._drawFloatingCloudShadows(ctx, clouds, originX, originY);

      // PASS 2: All 10 Uphill Lift Cables & Cable-Locked Aerial Carriers
      this._renderAerialLiftNetwork(ctx, originX, originY, includeGhost);

      // PASS 2.5: High-Altitude Balloons, Paragliders, Golden Eagles & VIP Helicopters
      if (highAirborne.length > 0) {
        highAirborne.sort((a, b) => a.sortKey - b.sortKey);
        for (let i = 0; i < highAirborne.length; i++) {
          const item = highAirborne[i];
          this._drawGroundEntity(ctx, item.ent, item.r, item.c, originX, originY, false);
        }
      }

      // PASS 3: Reference-Grade Floating Volumetric `3D` Pixel Clouds (`extraZ ~ 22`)
      this._drawFloatingClouds(ctx, clouds, originX, originY);

      // PASS 3.5: Crisp Pixel-Art Fireworks (`sim.getFireworks()`) in Day, Alpenglow & Night!
      this._drawFireworksWorldPass(ctx, originX, originY);

      // -----------------------------------------------------------------------
      // PASS 4: Ambient Winter Snow Crystals & Hot-Spring Steam Wisps
      // -----------------------------------------------------------------------
      this._drawAmbientParticles(ctx, originX, originY);
    }

    _drawHighAirborneShadow(ctx, ent, r, c, originX, originY) {
      const u = ent.u !== undefined ? ent.u : 4.0;
      const v = ent.v !== undefined ? ent.v : 4.0;
      const groundZ =
        ent.z !== undefined && Number.isFinite(ent.z)
          ? ent.z
          : this.world.getSurfaceZ(r, c, u, v, true);
      const footX = Math.round(originX + (c - r) * HALF_W + (v - u) * 8.0);
      const groundY = Math.round(originY + (r + c) * HALF_H + (u + v) * 4.0 - groundZ * 4.0);
      const sp = ent.species || ent.entityType || ent.type || ent.spriteType || "";
      const shadowAlt = Number(ent.groundShadowZ ?? ent.extraZ ?? 12.0);
      const altFade = clamp(1.18 - shadowAlt * 0.025, 0.45, 1.0);

      if (sp === "hot_air_balloon") {
        ctx.fillStyle = `rgba(22, 42, 74, ${(0.16 * altFade).toFixed(2)})`;
        ctx.fillRect(footX - 9, groundY - 3, 18, 6);
        ctx.fillRect(footX - 6, groundY - 4, 12, 8);
        ctx.fillStyle = `rgba(18, 36, 66, ${(0.22 * altFade).toFixed(2)})`;
        ctx.fillRect(footX - 5, groundY - 2, 10, 4);
        return;
      }
      if (sp === "alpine_paraglider") {
        ctx.fillStyle = `rgba(24, 46, 80, ${(0.22 * altFade).toFixed(2)})`;
        ctx.fillRect(footX - 7, groundY - 1, 14, 3);
        ctx.fillRect(footX - 4, groundY - 2, 8, 5);
        return;
      }

      const shW = sp === "vip_helicopter" ? 14 : 8;
      ctx.fillStyle = "rgba(30, 54, 88, 0.25)";
      ctx.fillRect(footX - (shW >> 1), groundY - 1, shW, 2);
      if (shW >= 12) {
        ctx.fillRect(footX - ((shW - 4) >> 1), groundY - 2, shW - 4, 4);
      }
    }

    _drawGroundEntity(ctx, ent, r, c, originX, originY, drawShadow = true) {
      if (!this.atlas || !ent) return;
      const u = ent.u !== undefined ? ent.u : 4.0;
      const v = ent.v !== undefined ? ent.v : 4.0;
      const groundZ =
        ent.z !== undefined && Number.isFinite(ent.z)
          ? ent.z
          : this.world.getSurfaceZ(r, c, u, v, true);
      const extraZ = ent.extraZ !== undefined && Number.isFinite(ent.extraZ) ? ent.extraZ : 0;
      const totalZ = groundZ + extraZ;

      const footX = Math.round(originX + (c - r) * HALF_W + (v - u) * 8.0);
      const groundY = Math.round(originY + (r + c) * HALF_H + (u + v) * 4.0 - groundZ * 4.0);
      const footY = Math.round(originY + (r + c) * HALF_H + (u + v) * 4.0 - totalZ * 4.0);

      // Draw crisp snow ground shadow underneath airborne freestyle park jumpers / low hover!
      if (drawShadow && extraZ > 0.18) {
        const sp = ent.species || ent.entityType || ent.type || "";
        const shW = sp === "vip_helicopter" ? 14 : extraZ > 1.8 ? 6 : 8;
        ctx.fillStyle = "rgba(38, 62, 98, 0.34)";
        ctx.fillRect(footX - (shW >> 1), groundY - 1, shW, 2);
      }

      let key = ent.spriteKey || ent.key;
      if (!key) {
        const sp = ent.species || ent.entityType || ent.type || "skier_carver";
        const dir = ent.dir || ent.heading || "sw";
        const fr = (ent.frame || 0) % 6;
        key = `${sp}_${dir}_f${fr}`;
      }
      this._drawEntitySafe(ctx, key, footX, footY);

      // Crisp 4-point strobe starburst when `ent.cameraFlash > 0` (`slope_photographer`, `yeti_mascot`)
      if (ent.cameraFlash && ent.cameraFlash > 0.05) {
        const fa = clamp(Number(ent.cameraFlash), 0, 1);
        const fx = footX + (ent.dir === "se" || ent.dir === "ne" ? 6 : -6);
        const fy = footY - 14;
        const arm = fa > 0.55 ? 5 : 3;
        ctx.save();
        ctx.globalAlpha = fa;
        ctx.fillStyle = "#fffbe6";
        ctx.fillRect(fx - arm, fy, arm * 2 + 1, 1);
        ctx.fillRect(fx, fy - arm, 1, arm * 2 + 1);
        ctx.fillStyle = "#fde047";
        ctx.fillRect(fx - 2, fy - 2, 1, 1);
        ctx.fillRect(fx + 2, fy - 2, 1, 1);
        ctx.fillRect(fx - 2, fy + 2, 1, 1);
        ctx.fillRect(fx + 2, fy + 2, 1, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(fx - 1, fy - 1, 2, 2);
        ctx.restore();
      }
    }

    _drawTorchEmbers(ctx, originX, originY) {
      if (!this.sim || typeof this.sim.getTorchEmbers !== "function" || !this.world) return;
      const embers = this.sim.getTorchEmbers();
      if (!Array.isArray(embers) || embers.length === 0) return;

      const n = this.world.size;
      const cull = this._cullRect;
      ctx.save();
      for (let i = 0; i < embers.length; i++) {
        const em = embers[i];
        if (!em || em.active === false) continue;
        const lifeRatio =
          typeof em.alpha === "number"
            ? em.alpha
            : typeof em.life === "number" && typeof em.maxLife === "number" && em.maxLife > 0
            ? em.life / em.maxLife
            : typeof em.life === "number"
            ? em.life
            : 0.85;
        const a = clamp(lifeRatio, 0, 1);
        if (a <= 0.04) continue;

        const pos = this._resolveWorldItemPixels(em, n, originX, originY);
        const px = pos.px;
        const py = pos.py - Math.round(Number(em.liftPx || 3));
        if (cull && (px < cull.x0 || px > cull.x1 || py < cull.y0 || py > cull.y1)) continue;

        ctx.globalAlpha = a;
        if (a > 0.58) {
          ctx.fillStyle = "#f97316";
          ctx.fillRect(px - 1, py, 3, 2);
          ctx.fillStyle = "#fde047";
          ctx.fillRect(px, py - 1, 2, 2);
          ctx.fillStyle = "#fffbeb";
          ctx.fillRect(px, py, 1, 1);
        } else {
          ctx.fillStyle = a > 0.3 ? "#fb923c" : "#dc2626";
          ctx.fillRect(px, py, 2, 1);
          ctx.fillStyle = "#fde047";
          ctx.fillRect(px, py, 1, 1);
        }
      }
      ctx.restore();
    }

    _pushFireworkGlowEntry(wx, wy, color, alpha, intensity, radius, shape, cutout, cutoutAlpha) {
      let item = this._fireworkGlowPool[this._fireworkGlowUsed];
      if (!item) {
        item = {
          wx: 0,
          wy: 0,
          groundWy: 0,
          color: "#fbbf24",
          alpha: 0.8,
          intensity: 1.0,
          radius: 4.0,
          shape: "round",
          cutout: true,
          cutoutAlpha: 0.5,
        };
        this._fireworkGlowPool[this._fireworkGlowUsed] = item;
      }
      this._fireworkGlowUsed++;
      item.wx = wx;
      item.wy = wy;
      item.groundWy = wy;
      item.color = color || "#fbbf24";
      item.alpha = clamp(alpha, 0, 1);
      item.intensity = intensity;
      item.radius = radius;
      item.shape = shape;
      item.cutout = cutout;
      item.cutoutAlpha = cutoutAlpha;
      this._fireworkGlowsScratch.push(item);
    }

    _pushFireworkGlow(wx, wy, groundWy, color, alpha, radius) {
      const a = clamp(alpha, 0, 1);
      if (a <= 0.03) return;
      this._pushFireworkGlowEntry(
        wx,
        wy,
        color,
        a,
        clamp(a * 1.25, 0.25, 1.35),
        radius,
        "round",
        true,
        clamp(a * 0.62, 0, 0.72)
      );
      if (typeof groundWy === "number" && Number.isFinite(groundWy) && radius >= 3.5) {
        this._pushFireworkGlowEntry(
          wx,
          groundWy,
          color,
          a * 0.82,
          clamp(a * 0.9, 0.25, 1.15),
          radius * 0.82,
          "iso",
          false,
          0
        );
      }
    }

    _resolveFireworkPalette(fw, idx) {
      if (!fw) return FIREWORK_PALETTE_LIST[idx % FIREWORK_PALETTE_LIST.length];
      const palName = String(fw.palette || fw.style || fw.burstType || fw.preset || "").toLowerCase();
      if (FIREWORK_PALETTES[palName]) return FIREWORK_PALETTES[palName];
      if (typeof fw.color === "string" && fw.color.startsWith("#")) {
        return {
          core: fw.coreColor || "#ffffff",
          bright: fw.color,
          tail: fw.tailColor || fw.secondaryColor || fw.color,
          glow: fw.glowColor || fw.color,
        };
      }
      return FIREWORK_PALETTE_LIST[idx % FIREWORK_PALETTE_LIST.length];
    }

    _drawFireworksWorldPass(ctx, originX, originY, pushGlows = true) {
      if (!this.sim || typeof this.sim.getFireworks !== "function" || !this.world) return;
      const raw = this.sim.getFireworks();
      if (!raw) return;

      // Support `{ shells, sparks }` object OR flat/nested Array!
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.shells)
        ? raw.shells
        : Array.isArray(raw.fireworks)
        ? raw.fireworks
        : EMPTY_ARR;
      const extraSparks = !Array.isArray(raw) && Array.isArray(raw.sparks) ? raw.sparks : null;
      if (list.length === 0 && (!extraSparks || extraSparks.length === 0)) return;

      const n = this.world.size;
      const isDay = this.atmosphere === "day";
      const cull = this._cullRect;

      const drawSparkCluster = (sx, sy, szPx, alpha, coreCol, brightCol, tailCol, vx, vy) => {
        if (cull && (sx + 10 < cull.x0 || sx - 10 > cull.x1 || sy + 10 < cull.y0 || sy - 10 > cull.y1)) {
          return;
        }
        const a = clamp(alpha, 0, 1);
        ctx.globalAlpha = a;
        // Subtle 1px dark rim in bright Daylight so bursts read vividly against pale winter sky!
        if (isDay && a > 0.25) {
          ctx.fillStyle = "rgba(18, 34, 62, 0.38)";
          ctx.fillRect(sx - 1, sy - 1, szPx + 2, szPx + 2);
        }
        // Vivid velocity streak behind expanding burst sparks
        if (typeof vx === "number" && typeof vy === "number" && (Math.abs(vx) > 0.08 || Math.abs(vy) > 0.08)) {
          const mag = Math.hypot(vx, vy) || 1;
          const ux = vx / mag;
          const uy = vy / mag;
          ctx.fillStyle = tailCol;
          ctx.fillRect(Math.round(sx - ux * 3.0), Math.round(sy - uy * 3.0), 2, 2);
          if (!isDay && a > 0.35) {
            ctx.globalAlpha = a * 0.68;
            ctx.fillRect(Math.round(sx - ux * 5.5), Math.round(sy - uy * 5.5), 2, 1);
            ctx.globalAlpha = a;
          }
        }
        ctx.fillStyle = brightCol;
        if (!isDay && szPx >= 4) {
          // Bold 5x5 jewel starburst cluster for primary Night / Alpenglow sparks
          ctx.fillRect(sx - 2, sy, 5, 1);
          ctx.fillRect(sx, sy - 2, 1, 5);
          ctx.fillRect(sx - 1, sy - 1, 3, 3);
          ctx.fillStyle = "#fffbeb";
          ctx.fillRect(sx - 1, sy, 3, 1);
          ctx.fillRect(sx, sy - 1, 1, 3);
          ctx.fillStyle = coreCol || "#ffffff";
          ctx.fillRect(sx, sy, 2, 2);
        } else if (szPx >= 3 || !isDay) {
          // Crisp 3x3 cross jewel cluster
          ctx.fillRect(sx - 1, sy, 3, 1);
          ctx.fillRect(sx, sy - 1, 1, 3);
          ctx.fillRect(sx - 1, sy - 1, 2, 2);
          ctx.fillStyle = coreCol || "#ffffff";
          ctx.fillRect(sx, sy, 2, 2);
        } else {
          ctx.fillRect(sx, sy, 2, 2);
          ctx.fillStyle = coreCol;
          ctx.fillRect(sx, sy, 1, 1);
        }
      };

      const drawRocketTrail = (rx, ry, pal, alpha, vyHint, trailStartPx, trailStartPy, flashAlpha) => {
        if (cull && (rx + 14 < cull.x0 || rx - 14 > cull.x1 || ry + 32 < cull.y0 || ry - 14 > cull.y1)) {
          return;
        }
        ctx.globalAlpha = clamp(alpha, 0, 1);
        if (isDay) {
          ctx.fillStyle = "rgba(22, 36, 62, 0.35)";
          ctx.fillRect(rx - 1, ry - 1, 4, 5);
        }
        // Optional velocity-aligned golden streak from previous frame (`trailStartWorldX/Y`)
        if (typeof trailStartPx === "number" && typeof trailStartPy === "number") {
          const dxT = trailStartPx - rx;
          const dyT = trailStartPy - ry;
          for (let s = 1; s <= 4; s++) {
            const frac = s * 0.25;
            ctx.fillStyle = s <= 2 ? "#fde047" : "#f59e0b";
            ctx.globalAlpha = clamp(alpha * (0.9 - s * 0.15), 0.15, 1);
            ctx.fillRect(Math.round(rx + dxT * frac), Math.round(ry + dyT * frac), s <= 2 ? 2 : 1, 2);
          }
        }
        // Ascending golden ember tail (7 stepped pixels)
        const dirSign = typeof vyHint === "number" && vyHint > 0 ? -1 : 1;
        const tailSteps = isDay ? 6 : 7;
        for (let k = 1; k <= tailSteps; k++) {
          const jitter = ((k + Math.floor(this.time * 24)) & 1) === 0 ? 0 : -1;
          ctx.fillStyle = k <= 2 ? "#fef08a" : k <= 4 ? "#fbbf24" : "#ea580c";
          ctx.globalAlpha = clamp(alpha * (1.0 - k * 0.12), 0.12, 1);
          ctx.fillRect(rx + jitter, ry + dirSign * k * 2, k <= 3 ? 2 : 1, 2);
        }
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = pal.bright || "#fde047";
        ctx.fillRect(rx - 1, ry - 1, isDay ? 3 : 4, isDay ? 3 : 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(rx, ry - 1, 2, 2);
        if (typeof flashAlpha === "number" && flashAlpha > 0.05) {
          ctx.globalAlpha = clamp(flashAlpha, 0, 1);
          ctx.fillStyle = pal.bright || "#fde047";
          ctx.fillRect(rx - 5, ry, 11, 1);
          ctx.fillRect(rx, ry - 5, 1, 11);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(rx - 1, ry - 1, 3, 3);
        }
      };

      ctx.save();
      for (let i = 0; i < list.length; i++) {
        const fw = list[i];
        if (!fw || fw.active === false) continue;

        const pal = this._resolveFireworkPalette(fw, i);
        const phase = String(fw.phase || fw.state || fw.kind || fw.type || "").toLowerCase();
        const sparks = Array.isArray(fw.sparks)
          ? fw.sparks
          : Array.isArray(fw.particles)
          ? fw.particles
          : null;

        const baseAlpha = clamp(
          typeof fw.alpha === "number"
            ? fw.alpha
            : typeof fw.life === "number" && typeof fw.maxLife === "number" && fw.maxLife > 0
            ? fw.life / fw.maxLife
            : 1.0,
          0,
          1
        );
        if (baseAlpha <= 0.03) continue;

        const hasCenter =
          typeof fw.wx === "number" ||
          typeof fw.worldX === "number" ||
          typeof fw.r === "number";
        const centerPos = hasCenter
          ? this._resolveWorldItemPixels(fw, n, originX, originY)
          : { px: originX, py: originY, groundPy: originY + 64 };

        const isRocket =
          phase === "rising" ||
          phase === "rocket" ||
          phase === "ascending" ||
          phase === "launch" ||
          phase === "shell" ||
          Boolean(fw.isRising) ||
          (fw.isBurst === false && phase !== "spark" && phase !== "particle" && phase !== "burst") ||
          (!sparks && phase !== "spark" && phase !== "particle" && phase !== "burst" && fw.isRocket);

        if (isRocket) {
          const tStartPx =
            typeof fw.trailStartWorldX === "number" ? Math.round(originX + fw.trailStartWorldX) : undefined;
          const tStartPy =
            typeof fw.trailStartWorldY === "number" ? Math.round(originY + fw.trailStartWorldY) : undefined;
          drawRocketTrail(centerPos.px, centerPos.py, pal, baseAlpha, fw.vy, tStartPx, tStartPy, fw.flashAlpha);
          if (pushGlows && !isDay) {
            this._pushFireworkGlow(
              centerPos.px - originX,
              centerPos.py - originY,
              centerPos.groundPy - originY,
              "#fbbf24",
              baseAlpha * 0.72,
              2.4
            );
          }
          continue;
        }

        if (sparks && sparks.length > 0) {
          const sparkLimit =
            typeof fw.sparkCount === "number" && fw.sparkCount > 0
              ? Math.min(sparks.length, fw.sparkCount)
              : sparks.length;
          let activeCount = 0;
          let sumAlpha = 0;
          for (let si = 0; si < sparkLimit; si++) {
            const sp = sparks[si];
            if (!sp || sp.active === false) continue;
            const sa = clamp(
              typeof sp.alpha === "number"
                ? sp.alpha
                : typeof sp.life === "number" && typeof sp.maxLife === "number" && sp.maxLife > 0
                ? sp.life / sp.maxLife
                : baseAlpha,
              0,
              1
            );
            if (sa <= 0.04) continue;
            activeCount++;
            sumAlpha += sa;

            let spx = centerPos.px;
            let spy = centerPos.py;
            if (
              typeof sp.wx === "number" ||
              typeof sp.worldX === "number" ||
              typeof sp.r === "number"
            ) {
              const pPos = this._resolveWorldItemPixels(sp, n, originX, originY);
              spx = pPos.px;
              spy = pPos.py;
            } else if (typeof sp.dx === "number" || typeof sp.ox === "number" || typeof sp.x === "number") {
              spx = Math.round(centerPos.px + Number(sp.dx ?? sp.ox ?? sp.x ?? 0));
              spy = Math.round(centerPos.py + Number(sp.dy ?? sp.oy ?? sp.y ?? 0));
            }
            const sz = !isDay
              ? Number(sp.size) >= 3 || (si % 3 === 0 && sa > 0.45)
                ? 4
                : 3
              : Number(sp.size) >= 3 || (si % 3 === 0 && sa > 0.55)
              ? 3
              : 2;
            const sCol = sp.color || (si % 4 === 0 ? pal.core : pal.bright);
            const svx =
              typeof sp.vx === "number"
                ? sp.vx
                : typeof sp.dx === "number" && typeof sp.prevDx === "number"
                ? sp.dx - sp.prevDx
                : sp.ux;
            const svy =
              typeof sp.vy === "number"
                ? sp.vy
                : typeof sp.dy === "number" && typeof sp.prevDy === "number"
                ? sp.dy - sp.prevDy
                : sp.uy;
            drawSparkCluster(
              spx,
              spy,
              sz,
              sa,
              pal.core,
              sCol,
              sp.tailColor || pal.tail,
              svx,
              svy
            );
          }

          if (activeCount > 0) {
            const avgA = clamp(sumAlpha / activeCount, 0.15, 1.0);
            const flashAmt =
              typeof fw.flashAlpha === "number" && fw.flashAlpha > 0.04
                ? clamp(fw.flashAlpha, 0, 1)
                : avgA > 0.72
                ? clamp((avgA - 0.7) * 3.0, 0, 1)
                : 0;
            // Bright central burst flash star during early detonation
            if (flashAmt > 0.04) {
              const arm = flashAmt > 0.55 ? 8 : 5;
              ctx.globalAlpha = flashAmt;
              ctx.fillStyle = pal.bright;
              ctx.fillRect(centerPos.px - arm, centerPos.py, arm * 2 + 1, 1);
              ctx.fillRect(centerPos.px, centerPos.py - arm, 1, arm * 2 + 1);
              ctx.fillStyle = "#fffbeb";
              ctx.fillRect(centerPos.px - 2, centerPos.py - 2, 5, 5);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(centerPos.px - 1, centerPos.py - 1, 3, 3);
            }
            if (pushGlows && !isDay) {
              this._pushFireworkGlow(
                centerPos.px - originX,
                centerPos.py - originY,
                centerPos.groundPy - originY,
                fw.glowColor || pal.glow,
                avgA,
                5.0
              );
            }
          }
          continue;
        }

        // Procedural starburst fallback if `fw` is a burst shell with `{ progress / radius }` and no explicit `sparks` array,
        // OR single flat spark particle!
        if (phase === "burst" || phase === "exploding" || typeof fw.burstRadius === "number") {
          const prog = clamp(Number(fw.progress ?? 1.0 - baseAlpha), 0.05, 1.0);
          const radPx = Number(fw.burstRadius || 34) * prog;
          const rays = 14;
          for (let k = 0; k < rays; k++) {
            const ang = (k / rays) * Math.PI * 2 + (i % 3) * 0.21;
            const sx = Math.round(centerPos.px + Math.cos(ang) * radPx);
            const sy = Math.round(centerPos.py + Math.sin(ang) * radPx * 0.82 + prog * prog * 8);
            drawSparkCluster(
              sx,
              sy,
              !isDay ? (k % 2 === 0 ? 4 : 3) : k % 2 === 0 ? 3 : 2,
              baseAlpha,
              pal.core,
              pal.bright,
              pal.tail,
              Math.cos(ang),
              Math.sin(ang)
            );
          }
          if (pushGlows && !isDay) {
            this._pushFireworkGlow(
              centerPos.px - originX,
              centerPos.py - originY,
              centerPos.groundPy - originY,
              pal.glow,
              baseAlpha,
              4.6
            );
          }
        } else {
          // Flat spark item
          const sz = Number(fw.size) >= 3 ? 3 : 2;
          drawSparkCluster(
            centerPos.px,
            centerPos.py,
            sz,
            baseAlpha,
            pal.core,
            fw.color || pal.bright,
            pal.tail,
            fw.vx,
            fw.vy
          );
        }
      }

      if (extraSparks) {
        for (let si = 0; si < extraSparks.length; si++) {
          const sp = extraSparks[si];
          if (!sp || sp.active === false) continue;
          const pal = this._resolveFireworkPalette(sp, si);
          const sa = clamp(
            typeof sp.alpha === "number"
              ? sp.alpha
              : typeof sp.life === "number" && typeof sp.maxLife === "number" && sp.maxLife > 0
              ? sp.life / sp.maxLife
              : 0.85,
            0,
            1
          );
          if (sa <= 0.04) continue;
          const pPos = this._resolveWorldItemPixels(sp, n, originX, originY);
          drawSparkCluster(
            pPos.px,
            pPos.py,
            Number(sp.size) >= 3 ? 3 : 2,
            sa,
            pal.core,
            sp.color || pal.bright,
            pal.tail,
            sp.vx,
            sp.vy
          );
        }
      }
      ctx.restore();
    }

    // =========================================================================
    // Live Snowball Fight Arcs, Pond-Hockey Pucks, Curling Stones & Selfie Stars
    // =========================================================================

    _resolveWorldItemPixels(item, n, originX, originY) {
      let px = 0;
      let py = 0;
      let groundPy = 0;
      let cellR = -1;
      let cellC = -1;

      const hasWx = typeof item.wx === "number" && typeof item.wy === "number";
      const hasWorldX = typeof item.worldX === "number" && typeof item.worldY === "number";

      if (typeof item.r === "number" && typeof item.c === "number") {
        const isIntRC = Number.isInteger(item.r) && Number.isInteger(item.c) && item.u !== undefined;
        const rInt = isIntRC ? item.r : Math.floor(item.r);
        const cInt = isIntRC ? item.c : Math.floor(item.c);
        const u = isIntRC ? item.u : item.u !== undefined ? item.u : (item.r - rInt) * 8.0;
        const v = isIntRC ? item.v : item.v !== undefined ? item.v : (item.c - cInt) * 8.0;
        cellR = rInt;
        cellC = cInt;

        const sr = clamp(rInt, 0, n - 1);
        const sc = clamp(cInt, 0, n - 1);
        const groundZ =
          typeof item.groundZ === "number"
            ? item.groundZ
            : this.world.getSurfaceZ(sr, sc, clamp(u, 0, 8), clamp(v, 0, 8), true);
        const extraZ = Number(item.extraZ ?? item.arcZ ?? item.heightZ ?? 0);
        const totalZ =
          typeof item.totalZ === "number"
            ? item.totalZ
            : typeof item.z === "number" && extraZ === 0
            ? Math.max(groundZ, item.z)
            : groundZ + extraZ;

        px = Math.round(originX + (cInt - rInt) * HALF_W + (v - u) * 8.0);
        groundPy = Math.round(originY + (rInt + cInt) * HALF_H + (u + v) * 4.0 - groundZ * 4.0);
        py = Math.round(originY + (rInt + cInt) * HALF_H + (u + v) * 4.0 - totalZ * 4.0);
      }

      if (hasWx || hasWorldX) {
        const wx = hasWx ? item.wx : item.worldX;
        const wy = hasWx ? item.wy : item.worldY;
        px = Math.round(originX + wx);
        py = Math.round(originY + wy);
        if (typeof item.groundWy === "number") {
          groundPy = Math.round(originY + item.groundWy);
        } else if (typeof item.shadowWy === "number") {
          groundPy = Math.round(originY + item.shadowWy);
        } else if (!groundPy) {
          const ez = Number(item.extraZ ?? item.arcZ ?? item.heightZ ?? 1.5);
          groundPy = Math.round(py + ez * 4.0);
        }
        if (cellR < 0) {
          const diffUV = wx / 8.0;
          const sumUV = (groundPy - originY) / 4.0;
          cellR = Math.floor(((sumUV - diffUV) * 0.5) / 8.0);
          cellC = Math.floor(((sumUV + diffUV) * 0.5) / 8.0);
        }
      }

      return { px, py, groundPy: groundPy || py + 4, cellR, cellC };
    }

    _collectProjectileBuckets(n, originX, originY) {
      if (!this.sim || typeof this.sim.getProjectiles !== "function") {
        return { byCell: EMPTY_MAP, loose: EMPTY_ARR, hasAny: false };
      }
      const raw = this.sim.getProjectiles();
      if (!Array.isArray(raw) || raw.length === 0) {
        return { byCell: EMPTY_MAP, loose: EMPTY_ARR, hasAny: false };
      }

      const byCell = this._projByCellMap;
      byCell.clear();
      const loose = this._projLooseArr;
      loose.length = 0;
      let cellArrUsed = 0;
      let itemUsed = 0;

      for (let i = 0; i < raw.length; i++) {
        const p = raw[i];
        if (!p) continue;
        const kind = String(p.kind || p.type || "snowball").toLowerCase();
        const pos = this._resolveWorldItemPixels(p, n, originX, originY);

        let norm = this._projItemPool[itemUsed];
        if (!norm) {
          norm = { raw: null, kind: "snowball", px: 0, py: 0, groundPy: 0, impactAlpha: 0, team: "red" };
          this._projItemPool[itemUsed] = norm;
        }
        itemUsed++;
        norm.raw = p;
        norm.kind = kind.includes("puck")
          ? "puck"
          : kind.includes("curl") || kind.includes("stone")
          ? "curling_stone"
          : "snowball";
        norm.px = pos.px;
        norm.py = pos.py;
        norm.groundPy = pos.groundPy;
        norm.impactAlpha = Number(p.impactAlpha ?? p.burstAlpha ?? p.splatAlpha ?? 0);
        norm.team = String(p.team || p.color || p.handleColor || "red").toLowerCase();

        if (pos.cellR >= 0 && pos.cellR < n && pos.cellC >= 0 && pos.cellC < n) {
          const idx = pos.cellR * n + pos.cellC;
          let arr = byCell.get(idx);
          if (!arr) {
            arr = this._projCellPool[cellArrUsed];
            if (!arr) {
              arr = [];
              this._projCellPool[cellArrUsed] = arr;
            } else {
              arr.length = 0;
            }
            cellArrUsed++;
            byCell.set(idx, arr);
          }
          arr.push(norm);
        } else {
          loose.push(norm);
        }
      }
      return { byCell, loose, hasAny: byCell.size > 0 || loose.length > 0 };
    }

    _drawSingleProjectile(ctx, item) {
      const { kind, px, py, groundPy, impactAlpha, team } = item;

      if (kind === "puck") {
        // Subtle ice-skate spray glint + crisp 3x2 dark vulcanized rubber hockey puck (#151922)
        ctx.fillStyle = "rgba(220, 242, 255, 0.55)";
        ctx.fillRect(px - 2, py, 2, 1);
        ctx.fillStyle = "#151922";
        ctx.fillRect(px - 1, py - 1, 3, 2);
        ctx.fillStyle = "#475569";
        ctx.fillRect(px - 1, py - 1, 2, 1);
        return;
      }

      if (kind === "curling_stone") {
        // 4x3 polished granite curling stone + crimson/cobalt handle gliding on ice_curling_lane
        ctx.fillStyle = "rgba(32, 58, 92, 0.34)";
        ctx.fillRect(px - 2, py + 2, 4, 1);
        ctx.fillStyle = "#49515e";
        ctx.fillRect(px - 2, py + 1, 4, 1);
        ctx.fillStyle = "#6d7684";
        ctx.fillRect(px - 2, py - 1, 4, 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(px - 2, py, 4, 1);
        ctx.fillStyle = team.includes("blue") || team.includes("2563") ? "#2563eb" : "#dc2626";
        ctx.fillRect(px - 1, py - 2, 2, 1);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(px - 1, py - 1, 1, 1);
        return;
      }

      // "snowball": 2x1 cool snow shadow + crisp 2x2 white snowball + 1px powder burst on impact!
      if (groundPy >= py) {
        ctx.fillStyle = "rgba(38, 66, 104, 0.38)";
        ctx.fillRect(px - 1, groundPy, 2, 1);
      }

      if (impactAlpha > 0.02) {
        const a = clamp(impactAlpha, 0, 1);
        const spread = Math.max(1, Math.round((1.0 - a) * 5) + 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(px - spread, py - 1, 1, 1);
        ctx.fillRect(px + spread, py - 1, 1, 1);
        ctx.fillRect(px, py - spread, 1, 1);
        ctx.fillRect(px - 1, py + Math.max(1, spread - 1), 1, 1);
        ctx.fillStyle = "#cde4ff";
        ctx.fillRect(px + spread - 1, py - spread + 1, 1, 1);
        ctx.fillRect(px - spread + 1, py - spread + 1, 1, 1);
        ctx.restore();
      }

      if (impactAlpha <= 0.65) {
        ctx.fillStyle = "#bcd8f8";
        ctx.fillRect(px - 1, py - 1, 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(px - 1, py - 1, 2, 1);
        ctx.fillRect(px - 1, py, 1, 1);
      }
    }

    _drawSelfieCameraFlashes(ctx, originX, originY) {
      if (!this.sim || typeof this.sim.getCameraFlashes !== "function") return;
      const flashes = this.sim.getCameraFlashes();
      if (!Array.isArray(flashes) || flashes.length === 0) return;

      const n = this.world.size;
      ctx.save();
      for (let i = 0; i < flashes.length; i++) {
        const fl = flashes[i];
        if (!fl) continue;
        const alpha = clamp(Number(fl.alpha ?? fl.intensity ?? fl.life ?? 1.0), 0, 1);
        if (alpha <= 0.04) continue;

        const pos = this._resolveWorldItemPixels(fl, n, originX, originY);
        const liftHead =
          fl.wx === undefined &&
          fl.worldX === undefined &&
          fl.extraZ === undefined &&
          fl.totalZ === undefined
            ? 15
            : 0;
        const fx = pos.px + Math.round(fl.offsetX || 0);
        const fy = pos.py - liftHead + Math.round(fl.offsetY || 0);
        const arm = alpha > 0.55 ? 5 : 3;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#fffbe6";
        ctx.fillRect(fx - arm, fy, arm * 2 + 1, 1);
        ctx.fillRect(fx, fy - arm, 1, arm * 2 + 1);
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(fx - 2, fy - 2, 1, 1);
        ctx.fillRect(fx + 2, fy - 2, 1, 1);
        ctx.fillRect(fx - 2, fy + 2, 1, 1);
        ctx.fillRect(fx + 2, fy + 2, 1, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(fx - 1, fy - 1, 2, 2);
      }
      ctx.restore();
    }

    // =========================================================================
    // Reference-Grade Floating Volumetric `3D` Pixel Clouds (`extraZ ~ 22.0`)
    // =========================================================================

    _resolveFloatingClouds(n) {
      let raw =
        this.world && typeof this.world.getFloatingClouds === "function"
          ? this.world.getFloatingClouds(this.time)
          : null;

      const resolved = this._resolvedClouds;
      resolved.length = 0;
      let poolIdx = 0;

      const pushCloud = (cl, i) => {
        let exactR;
        let exactC;
        if (typeof cl.exactR === "number" && typeof cl.exactC === "number") {
          exactR = cl.exactR;
          exactC = cl.exactC;
        } else if (
          typeof cl.r === "number" &&
          typeof cl.c === "number" &&
          Number.isInteger(cl.r) &&
          Number.isInteger(cl.c) &&
          (cl.u !== undefined || cl.v !== undefined)
        ) {
          exactR = cl.r + (cl.u !== undefined ? cl.u : 4.0) / 8.0;
          exactC = cl.c + (cl.v !== undefined ? cl.v : 4.0) / 8.0;
        } else {
          exactR = Number(cl.r ?? 4.0);
          exactC = Number(cl.c ?? 4.0);
        }

        const sr = clamp(Math.floor(exactR), 0, n - 1);
        const sc = clamp(Math.floor(exactC), 0, n - 1);
        const su = clamp((exactR - Math.floor(exactR)) * 8.0, 0, 8);
        const sv = clamp((exactC - Math.floor(exactC)) * 8.0, 0, 8);
        const groundZ = this.world.getTerrainZ(sr, sc, su, sv);

        const bobZ = Math.sin(this.time * 0.65 + i * 1.9) * 0.45;
        const skyZ =
          typeof cl.skyZ === "number"
            ? cl.skyZ + bobZ
            : typeof cl.extraZ === "number"
            ? Math.max(25.0, 5.5 + cl.extraZ) + bobZ
            : Math.max(25.5, (Number(cl.z) || 22.0) + 5.0) + bobZ;

        const shadowX =
          typeof cl.wx === "number" ? Math.round(cl.wx) : (exactC - exactR) * HALF_W;
        const baseIsoY = (exactR + exactC) * HALF_H;

        let item = this._cloudPool[poolIdx];
        if (!item) {
          item = {
            spriteKey: "",
            exactR: 0,
            exactC: 0,
            inMountain: false,
            relX: 0,
            shadowRelY: 0,
            cloudRelY: 0,
            alpha: 0.9,
            sortKey: 0,
          };
          this._cloudPool[poolIdx] = item;
        }
        poolIdx++;
        item.spriteKey = cl.spriteKey || `cloud_puff_v${i % 3}`;
        item.exactR = exactR;
        item.exactC = exactC;
        item.inMountain =
          exactR >= 0.35 && exactR <= n - 0.35 && exactC >= 0.35 && exactC <= n - 0.35;
        item.relX = typeof cl.wx === "number" ? cl.wx : shadowX;
        item.shadowRelY = baseIsoY - groundZ * 4.0;
        item.cloudRelY = typeof cl.wy === "number" ? cl.wy : baseIsoY - skyZ * 4.0;
        item.alpha = clamp(Number(cl.alpha ?? 0.92), 0.35, 1.0);
        item.sortKey = exactR + exactC;
        resolved.push(item);
      };

      if (Array.isArray(raw) && raw.length > 0) {
        for (let i = 0; i < raw.length; i++) {
          if (raw[i]) pushCloud(raw[i], i);
        }
      } else {
        const count = 9;
        const span = n + 4.0;
        for (let i = 0; i < count; i++) {
          const baseR = ((i * 3.7 + 1.8) % (n - 2)) + 1.0;
          const drift = (this.time * (0.16 + (i % 3) * 0.04) + i * 4.3) % span;
          pushCloud(
            {
              spriteKey: `cloud_puff_v${i % 3}`,
              exactR: baseR + Math.sin(this.time * 0.22 + i * 1.7) * 0.45,
              exactC: drift - 2.0,
              extraZ: 21.5 + (i % 3) * 1.4,
              alpha: 0.9,
            },
            i
          );
        }
      }

      resolved.sort((a, b) => a.sortKey - b.sortKey);
      return resolved;
    }

    _getCloudShadowSprite(isNight) {
      if (typeof document === "undefined") return null;
      if (isNight && this._cloudShadowNight) return this._cloudShadowNight;
      if (!isNight && this._cloudShadowDay) return this._cloudShadowDay;

      const rx = 38;
      const ry = 18;
      const cv = document.createElement("canvas");
      cv.width = rx * 2 + 4;
      cv.height = ry * 2 + 4;
      const cctx = cv.getContext("2d");
      if (!cctx) return null;
      cctx.fillStyle = isNight ? "rgba(8, 16, 34, 0.14)" : "rgba(26, 48, 78, 0.12)";
      const cx = rx + 2;
      const cy = ry + 2;
      for (let dy = -ry; dy <= ry; dy += 2) {
        const normY = dy / ry;
        const span = Math.round(rx * Math.sqrt(Math.max(0, 1 - normY * normY)));
        if (span > 2) {
          cctx.fillRect(cx - span, cy + dy, span * 2, 2);
        }
      }
      if (isNight) {
        this._cloudShadowNight = cv;
      } else {
        this._cloudShadowDay = cv;
      }
      return cv;
    }

    _drawFloatingCloudShadows(ctx, clouds, originX, originY) {
      if (!clouds || clouds.length === 0) return;
      const isNight = this.atmosphere === "night";
      const shSprite = this._getCloudShadowSprite(isNight);
      if (shSprite) {
        for (let i = 0; i < clouds.length; i++) {
          const cl = clouds[i];
          if (!cl.inMountain) continue;
          const sx = Math.round(originX + cl.relX) - 40;
          const sy = Math.round(originY + cl.shadowRelY) - 20;
          ctx.drawImage(shSprite, sx, sy);
        }
        return;
      }

      ctx.save();
      ctx.fillStyle = isNight ? "rgba(8, 16, 34, 0.14)" : "rgba(26, 48, 78, 0.12)";
      for (let i = 0; i < clouds.length; i++) {
        const cl = clouds[i];
        if (!cl.inMountain) continue;
        const sx = Math.round(originX + cl.relX);
        const sy = Math.round(originY + cl.shadowRelY);
        const rx = 38;
        const ry = 18;
        for (let dy = -ry; dy <= ry; dy += 2) {
          const normY = dy / ry;
          const span = Math.round(rx * Math.sqrt(Math.max(0, 1 - normY * normY)));
          if (span > 2) {
            ctx.fillRect(sx - span, sy + dy, span * 2, 2);
          }
        }
      }
      ctx.restore();
    }

    _drawFloatingClouds(ctx, clouds, originX, originY) {
      if (!clouds || clouds.length === 0) return;
      const isAlpenglow = this.atmosphere === "alpenglow";
      const isNight = this.atmosphere === "night";

      ctx.save();
      for (let i = 0; i < clouds.length; i++) {
        const cl = clouds[i];
        const cx = Math.round(originX + cl.relX);
        const cy = Math.round(originY + cl.cloudRelY);
        ctx.globalAlpha = isNight ? cl.alpha * 0.52 : cl.alpha;

        let key = cl.spriteKey;
        if (!this._hasTile(key) && this._hasTile("cloud_puff_v0")) {
          key = "cloud_puff_v0";
        }
        if (this._hasTile(key)) {
          this.atlas.drawTile(ctx, key, cx - 64, cy - 112, 1);
        } else {
          this._drawFallbackPixelCloud(ctx, cx, cy, isAlpenglow, isNight);
        }
      }
      ctx.restore();
    }

    _drawFallbackPixelCloud(ctx, cx, cy, isAlpenglow, isNight) {
      const topCol = isAlpenglow ? "#ffe6d6" : isNight ? "#9ab4d8" : "#ffffff";
      const midCol = isAlpenglow ? "#efc0ba" : isNight ? "#6d88b2" : "#e8f2fc";
      const botCol = isAlpenglow ? "#b58ca8" : isNight ? "#485f88" : "#bfd4ec";
      const puffs = [
        [-22, 2, 16, 8],
        [-8, -5, 22, 11],
        [14, 0, 18, 9],
        [-2, 4, 28, 8],
      ];
      ctx.fillStyle = botCol;
      for (let i = 0; i < puffs.length; i++) {
        const [ox, oy, rw, rh] = puffs[i];
        ctx.fillRect(cx + ox - rw, cy + oy, rw * 2, rh);
      }
      ctx.fillStyle = midCol;
      for (let i = 0; i < puffs.length; i++) {
        const [ox, oy, rw, rh] = puffs[i];
        ctx.fillRect(cx + ox - rw + 2, cy + oy - 3, rw * 2 - 4, rh);
      }
      ctx.fillStyle = topCol;
      for (let i = 0; i < puffs.length; i++) {
        const [ox, oy, rw, rh] = puffs[i];
        ctx.fillRect(cx + ox - rw + 4, cy + oy - 6, rw * 2 - 8, Math.max(3, rh - 3));
      }
    }

    /**
     * Renders `1px` pixel-stepped dual steel cables across all 10 `#68` lift types
     * (`magic_carpet` & `cliff_funicular` are ground structures with no overhead wire;
     * `tramway_3s` renders crisp twin track + haul cables at `z=16.0, ±13px`!), then
     * renders all 6 aerial carrier types locked at `footY = cableY + 36` (`0.0px` drift!).
     */
    _renderAerialLiftNetwork(ctx, originX, originY, includeGhost = true) {
      const lifts =
        this.world && typeof this.world.getLifts === "function"
          ? this.world.getLifts() || EMPTY_ARR
          : EMPTY_ARR;

      const resolveTowerWx = (tower) => {
        if (typeof tower.wx === "number") return tower.wx;
        return ((tower.c || 0) - (tower.r || 0)) * HALF_W;
      };
      const resolveTowerWy = (tower, spec) => {
        if (typeof tower.wy === "number") return tower.wy;
        const tr = tower.r || 0;
        const tc = tower.c || 0;
        const lv =
          tower.level !== undefined
            ? tower.level
            : this.world && this.world.inBounds(tr, tc)
            ? this.world.cells[tr][tc].minLevel
            : 0;
        return (tr + tc) * HALF_H + 32 - (lv * ELEV_STEP_Z + spec.zCable) * 4.0;
      };

      // 1. Draw Dual `1px` Steel Cables for Every Active Cable Lift
      for (let li = 0; li < lifts.length; li++) {
        const lift = lifts[li];
        const lType = lift.type || "chairlift";
        const spec = LIFT_CABLE_SPECS[lType] || LIFT_CABLE_SPECS.chairlift;
        if (!spec.hasCable || NO_CABLE_LIFT_TYPES.has(lType) || lift.hasOverheadCable === false) {
          continue;
        }
        const towers = lift.towers;
        if (!Array.isArray(towers) || towers.length < 2) continue;
        const sep = lift.halfSepPx ?? lift.strandSepPx ?? spec.sep;
        const sagAmp = spec.sag;
        const is3S = Boolean(spec.is3S || lType === "tramway_3s");

        for (let ti = 0; ti < towers.length - 1; ti++) {
          const awx = resolveTowerWx(towers[ti]);
          const awy = resolveTowerWy(towers[ti], spec);
          const bwx = resolveTowerWx(towers[ti + 1]);
          const bwy = resolveTowerWy(towers[ti + 1], spec);
          this._drawPixelCableSpan(
            ctx,
            originX + awx + sep,
            originY + awy,
            originX + bwx + sep,
            originY + bwy,
            sagAmp,
            false,
            is3S
          );
          this._drawPixelCableSpan(
            ctx,
            originX + awx - sep,
            originY + awy,
            originX + bwx - sep,
            originY + bwy,
            sagAmp,
            false,
            is3S
          );
        }
      }

      // 2. Draw Ghost Dual Cable if Dragging a New Ski Lift (skip magic_carpet & cliff_funicular!)
      const gp = includeGhost && !this.cameraToolActive ? this.ghostPreview : null;
      const liftPrev = gp && gp.kind === "lift" ? gp.liftPreview || gp.preview : null;
      if (liftPrev && Array.isArray(liftPrev.towers) && liftPrev.towers.length >= 2) {
        const pType = liftPrev.type || gp.liftType || gp.itemId || "chairlift";
        const pSpec = LIFT_CABLE_SPECS[pType] || LIFT_CABLE_SPECS.chairlift;
        if (pSpec.hasCable && !NO_CABLE_LIFT_TYPES.has(pType)) {
          const sep = liftPrev.halfSepPx ?? liftPrev.strandSepPx ?? pSpec.sep;
          const is3S = Boolean(pSpec.is3S || pType === "tramway_3s");
          for (let ti = 0; ti < liftPrev.towers.length - 1; ti++) {
            const awx = resolveTowerWx(liftPrev.towers[ti]);
            const awy = resolveTowerWy(liftPrev.towers[ti], pSpec);
            const bwx = resolveTowerWx(liftPrev.towers[ti + 1]);
            const bwy = resolveTowerWy(liftPrev.towers[ti + 1], pSpec);
            this._drawPixelCableSpan(
              ctx,
              originX + awx + sep,
              originY + awy,
              originX + bwx + sep,
              originY + bwy,
              pSpec.sag || 1.5,
              true,
              is3S
            );
            this._drawPixelCableSpan(
              ctx,
              originX + awx - sep,
              originY + awy,
              originX + bwx - sep,
              originY + bwy,
              pSpec.sag || 1.5,
              true,
              is3S
            );
          }
        }
      }

      // 3. Collect & Back-to-Front Sort All Aerial Lift Carriers (pooled, zero per-frame allocs!)
      if (!this.atlas) return;
      const rawCarriers =
        this.sim && typeof this.sim.getAerialCarriers === "function"
          ? this.sim.getAerialCarriers() || EMPTY_ARR
          : EMPTY_ARR;

      const drawList = this._carrierDrawList;
      drawList.length = 0;
      const coveredLiftIds = this._coveredLiftIds;
      coveredLiftIds.clear();
      let poolIdx = 0;

      const pushCarrier = (spriteKey, cableX, cableY, sortKey) => {
        let item = this._carrierPool[poolIdx];
        if (!item) {
          item = { spriteKey: "", cableX: 0, cableY: 0, sortKey: 0 };
          this._carrierPool[poolIdx] = item;
        }
        poolIdx++;
        item.spriteKey = spriteKey;
        item.cableX = cableX;
        item.cableY = cableY;
        item.sortKey = sortKey;
        drawList.push(item);
      };

      for (let i = 0; i < rawCarriers.length; i++) {
        const ac = rawCarriers[i];
        if (!ac) continue;
        if (ac.liftId) coveredLiftIds.add(ac.liftId);
        const cx =
          ac.cableWorldX !== undefined
            ? ac.cableWorldX
            : ac.cableScreenX !== undefined
            ? ac.cableScreenX
            : 0;
        const cy =
          ac.cableWorldY !== undefined
            ? ac.cableWorldY
            : ac.cableScreenY !== undefined
            ? ac.cableScreenY
            : 0;
        pushCarrier(
          ac.spriteKey ||
            `${ac.entityType || "chairlift_empty"}_${ac.dir || "ne"}_f${(ac.frame || 0) % 6}`,
          cx,
          cy,
          (ac.r || 0) + (ac.c || 0) + cy * 0.001
        );
      }

      // Smooth fallback carriers for any aerial lift if `sim` is absent or hasn't synced yet
      if (typeof this.world.sampleLiftStrand === "function") {
        for (let li = 0; li < lifts.length; li++) {
          const lift = lifts[li];
          const lType = lift.type || "chairlift";
          const spec = LIFT_CABLE_SPECS[lType] || LIFT_CABLE_SPECS.chairlift;
          if (!spec.aerial || lift.isSurface || coveredLiftIds.has(lift.id)) continue;

          const count =
            lType === "tramway_3s"
              ? 2
              : Math.max(2, Math.min(6, Math.round((lift.lengthCells || 6) / 2.4)));
          const swingFrame = Math.floor(this.time * 2.2) % 6;
          for (let k = 0; k < count; k++) {
            const tUp = (this.time * 0.075 + k / count) % 1.0;
            const upSample = this.world.sampleLiftStrand(lift, tUp, "up");
            if (upSample) {
              const eType =
                lift.carrierSprite ||
                (spec.upCarrier === "chairlift_rider" && k % 2 === 1
                  ? "chairlift_empty"
                  : spec.upCarrier || "chairlift_rider");
              pushCarrier(
                `${eType}_${upSample.dir}_f${swingFrame}`,
                upSample.cableScreenX,
                upSample.cableScreenY,
                upSample.exactR + upSample.exactC + upSample.cableScreenY * 0.001
              );
            }
            const tDn = (this.time * 0.075 + (k + 0.5) / count) % 1.0;
            const dnSample = this.world.sampleLiftStrand(lift, tDn, "down");
            if (dnSample) {
              const eType = lift.emptyCarrierSprite || spec.dnCarrier || "chairlift_empty";
              pushCarrier(
                `${eType}_${dnSample.dir}_f${swingFrame}`,
                dnSample.cableScreenX,
                dnSample.cableScreenY,
                dnSample.exactR + dnSample.exactC + dnSample.cableScreenY * 0.001
              );
            }
          }
        }
      }

      drawList.sort((a, b) => a.sortKey - b.sortKey);

      const cull = this._cullRect;
      for (let i = 0; i < drawList.length; i++) {
        const item = drawList[i];
        const fx = Math.round(originX + item.cableX);
        const fy = Math.round(originY + item.cableY + 36);
        if (
          cull &&
          (fx + 32 < cull.x0 || fx - 32 > cull.x1 || fy + 16 < cull.y0 || fy - 48 > cull.y1)
        ) {
          continue;
        }
        this._drawEntitySafe(ctx, item.spriteKey, fx, fy);
      }
    }

    _drawAmbientParticles(ctx, originX, originY) {
      if (!this.particles || this.particles.length === 0) return;
      const isAlpenglow = this.atmosphere === "alpenglow";
      const isNight = this.atmosphere === "night";
      const steamLut = isAlpenglow ? LUT_STEAM_ALPENGLOW : LUT_STEAM_DAY;
      const snowLut = isAlpenglow
        ? LUT_SNOW_ALPENGLOW
        : isNight
        ? LUT_SNOW_NIGHT
        : LUT_WHITE;
      const snowScale = isNight ? 0.55 : 0.78;
      const cull = this._cullRect;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const px = Math.round(originX + p.wx);
        const py = Math.round(originY + p.wy);
        if (
          cull &&
          (px < cull.x0 || px > cull.x1 || py < cull.y0 || py > cull.y1)
        ) {
          continue;
        }

        if (p.kind === "steam") {
          ctx.fillStyle = lutPick(steamLut, p.alpha * 0.34);
          ctx.fillRect(px, py, 2, 2);
        } else {
          ctx.fillStyle = lutPick(snowLut, p.alpha * snowScale);
          ctx.fillRect(px, py, p.size, p.size);
        }
      }
    }

    // =========================================================================
    // Winter Sky Backdrop, Aurora Borealis & Night Mode 2.0 Lighting Engine
    // =========================================================================

    _getAuroraCurtainSprite() {
      if (this._auroraCurtainSprite) return this._auroraCurtainSprite;
      if (typeof document === "undefined") return null;
      const cv = document.createElement("canvas");
      cv.width = 384;
      cv.height = 160;
      const actx = cv.getContext("2d");
      if (!actx) return null;

      // Vertical multi-stop boreal curtain: alpine-violet upper crown -> emerald-teal core -> soft fade
      const vGrad = actx.createLinearGradient(0, 6, 0, 154);
      vGrad.addColorStop(0.0, "rgba(139, 92, 246, 0.0)");
      vGrad.addColorStop(0.2, "rgba(167, 139, 250, 0.34)");
      vGrad.addColorStop(0.52, "rgba(45, 212, 191, 0.56)");
      vGrad.addColorStop(0.76, "rgba(110, 231, 183, 0.44)");
      vGrad.addColorStop(1.0, "rgba(16, 185, 129, 0.0)");

      // Sculpted vertical aurora draperies (pixel-stepped columns so curtains read crisp & organic)
      for (let x = 0; x < 384; x += 3) {
        const u = x / 384;
        const env = Math.sin(u * Math.PI);
        const fold =
          0.55 +
          0.28 * Math.sin(u * Math.PI * 6.0 + 0.7) +
          0.17 * Math.cos(u * Math.PI * 13.0 - 0.4);
        const yShift = Math.round(
          14 * Math.sin(u * Math.PI * 3.0 + 0.4) + 6 * Math.cos(u * Math.PI * 7.0)
        );
        const colAlpha = clamp(env * fold, 0, 1);
        if (colAlpha <= 0.03) continue;
        actx.save();
        actx.globalAlpha = colAlpha;
        actx.translate(0, yShift);
        actx.fillStyle = vGrad;
        actx.fillRect(x, 8, 3, 136);
        actx.restore();
      }
      this._auroraCurtainSprite = cv;
      return cv;
    }

    _getBackdropSkyGradient(targetCtx, h, atmo) {
      if (!this._backdropGradCache || this._backdropGradCache.h !== h) {
        this._backdropGradCache = { h, day: null, alpenglow: null, night: null };
      }
      if (this._backdropGradCache[atmo]) return this._backdropGradCache[atmo];
      const grad = targetCtx.createLinearGradient(0, 0, 0, h);
      if (atmo === "alpenglow") {
        grad.addColorStop(0.0, "#4a3f6b");
        grad.addColorStop(0.38, "#9c627e");
        grad.addColorStop(0.72, "#e39a78");
        grad.addColorStop(1.0, "#c8a39b");
      } else if (atmo === "night") {
        grad.addColorStop(0.0, "#060e22");
        grad.addColorStop(0.45, "#0d2044");
        grad.addColorStop(1.0, "#163364");
      } else {
        grad.addColorStop(0.0, "#7ab3e0");
        grad.addColorStop(0.45, "#abd3f2");
        grad.addColorStop(1.0, "#d7ecfb");
      }
      this._backdropGradCache[atmo] = grad;
      return grad;
    }

    _drawBackdrop(ctx, w, h) {
      if (this._backdropBuf && this._backdropCtx) {
        if (
          this._backdropW !== w ||
          this._backdropH !== h ||
          this._backdropAtmo !== this.atmosphere
        ) {
          if (this._backdropBuf.width !== w) this._backdropBuf.width = w;
          if (this._backdropBuf.height !== h) this._backdropBuf.height = h;
          const bctx = this._backdropCtx;
          bctx.fillStyle = this._getBackdropSkyGradient(bctx, h, this.atmosphere);
          bctx.fillRect(0, 0, w, h);
          this._backdropW = w;
          this._backdropH = h;
          this._backdropAtmo = this.atmosphere;
        }
        ctx.drawImage(this._backdropBuf, 0, 0);
      } else {
        ctx.fillStyle = this._getBackdropSkyGradient(ctx, h, this.atmosphere);
        ctx.fillRect(0, 0, w, h);
      }

      if (this.atmosphere === "night") {
        // 1. Twinkling crisp 1px–2px alpine stars across the upper sky (LUT-backed, zero strings!)
        for (let i = 0; i < 54; i++) {
          const sx = Math.round((((i * 197 + 43) % 997) / 997) * w);
          const sy = Math.round((((i * 131 + 19) % 409) / 409) * (h * 0.46));
          const tw = 0.34 + 0.48 * Math.sin(this.time * 1.85 + i * 1.7);
          ctx.fillStyle = lutPick(LUT_STAR, tw);
          const sz = i % 6 === 0 ? 2 : 1;
          ctx.fillRect(sx, sy, sz, sz);
        }

        // 2. Gently undulating Aurora Borealis emerald-teal & violet curtains above the summit horizon
        const auroraSprite = this._getAuroraCurtainSprite();
        const skyBandH = Math.max(96, Math.round(h * 0.28));
        if (auroraSprite) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.imageSmoothingEnabled = true;
          const ribbonW = Math.max(320, Math.round(w * 0.56));
          for (let b = 0; b < 3; b++) {
            const drift = Math.sin(this.time * 0.28 + b * 2.1) * (w * 0.055);
            const rx = Math.round((b * 0.34 - 0.08) * w + drift);
            const ry = Math.round(
              h * (0.015 + b * 0.032) + Math.cos(this.time * 0.36 + b * 1.4) * 10
            );
            ctx.globalAlpha = 0.36 + 0.1 * Math.sin(this.time * 0.52 + b * 1.9);
            ctx.drawImage(auroraSprite, rx, ry, ribbonW, skyBandH);
          }
          ctx.imageSmoothingEnabled = false;
          ctx.restore();
        }

        // Crisp pixel-art vertical aurora shimmer filaments so sky & pixel-art peaks feel unified
        const rayCount = 28;
        for (let i = 0; i < rayCount; i++) {
          const u = (i + 0.5) / rayCount;
          const rx = Math.round(
            u * w + Math.sin(this.time * 0.45 + i * 0.7) * 14
          );
          const waveY =
            h * 0.09 +
            Math.sin(u * Math.PI * 2.6 + this.time * 0.38) * (h * 0.038) +
            Math.cos(u * Math.PI * 5.2 - this.time * 0.24) * 8;
          const pulse = 0.14 + 0.14 * Math.sin(this.time * 1.15 + i * 0.95);
          const rayH = 12 + ((i * 7) % 16);
          ctx.fillStyle = lutPick(LUT_AURORA_VIOLET, pulse * 0.72);
          ctx.fillRect(rx, Math.round(waveY - rayH * 0.55), 2, Math.round(rayH * 0.6));
          ctx.fillStyle = lutPick(LUT_AURORA_MINT, pulse);
          ctx.fillRect(rx, Math.round(waveY), 2, rayH);
        }
      }
    }

    _getCutoutSprite() {
      if (this._cutoutSprite) return this._cutoutSprite;
      if (typeof document === "undefined") return null;
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 128;
      const cctx = cv.getContext("2d");
      if (!cctx) return null;
      const cut = cctx.createRadialGradient(64, 64, 64 * 0.08, 64, 64, 64);
      cut.addColorStop(0.0, "rgba(0, 0, 0, 0.92)");
      cut.addColorStop(0.55, "rgba(0, 0, 0, 0.50)");
      cut.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      cctx.fillStyle = cut;
      cctx.beginPath();
      cctx.arc(64, 64, 64, 0, Math.PI * 2);
      cctx.fill();
      this._cutoutSprite = cv;
      return cv;
    }

    /**
     * Pre-baked `2:1` isometric ground-projected elliptical cutout (`256x120`, `width = 2.13 * height`).
     * Eliminates flat `1:1` circular polka-dots around floodlight pole tops & roofs!
     */
    _getIsoCutoutSprite() {
      if (this._isoCutoutSprite) return this._isoCutoutSprite;
      if (typeof document === "undefined") return null;
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 120;
      const cctx = cv.getContext("2d");
      if (!cctx) return null;
      cctx.save();
      cctx.scale(1.0, 120 / 256);
      const cut = cctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      cut.addColorStop(0.0, "rgba(0, 0, 0, 0.92)");
      cut.addColorStop(0.48, "rgba(0, 0, 0, 0.58)");
      cut.addColorStop(0.82, "rgba(0, 0, 0, 0.20)");
      cut.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      cctx.fillStyle = cut;
      cctx.beginPath();
      cctx.arc(128, 128, 128, 0, Math.PI * 2);
      cctx.fill();
      cctx.restore();
      this._isoCutoutSprite = cv;
      return cv;
    }

    _getGlowSprite(colorHex, intensity) {
      if (typeof document === "undefined") return null;
      const cNorm = String(colorHex || "#ffbe6b").toLowerCase();
      const ib = Math.round(clamp(intensity || 0.85, 0.25, 1.35) * 20);
      const key = `${cNorm}|${ib}`;
      let cv = this._glowSpriteCache.get(key);
      if (cv) return cv;

      cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 128;
      const gctx = cv.getContext("2d");
      if (!gctx) return null;

      const rgb = hexToRgb(cNorm);
      const qInt = ib / 20;
      const halo = gctx.createRadialGradient(64, 64, 2, 64, 64, 64);
      halo.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.28 * qInt).toFixed(3)})`);
      halo.addColorStop(0.45, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.12 * qInt).toFixed(3)})`);
      halo.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      gctx.fillStyle = halo;
      gctx.beginPath();
      gctx.arc(64, 64, 64, 0, Math.PI * 2);
      gctx.fill();

      if (this._glowSpriteCache.size > 128) this._glowSpriteCache.clear();
      this._glowSpriteCache.set(key, cv);
      return cv;
    }

    /**
     * Pre-baked `2:1` isometric elliptical ground-snow glow pool (`256x120`).
     * Adjacent downslope floodlights merge into silky illuminated ski-run ribbons!
     */
    _getIsoGlowSprite(colorHex, intensity) {
      if (typeof document === "undefined") return null;
      const cNorm = String(colorHex || "#ffbe6b").toLowerCase();
      const ib = Math.round(clamp(intensity || 0.85, 0.2, 1.4) * 20);
      const key = `${cNorm}|${ib}`;
      let cv = this._isoGlowSpriteCache.get(key);
      if (cv) return cv;

      cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 120;
      const gctx = cv.getContext("2d");
      if (!gctx) return null;

      const rgb = hexToRgb(cNorm);
      const qInt = ib / 20;
      gctx.save();
      gctx.scale(1.0, 120 / 256);
      const halo = gctx.createRadialGradient(128, 128, 6, 128, 128, 128);
      halo.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(0.36 * qInt, 0, 0.85).toFixed(3)})`);
      halo.addColorStop(0.42, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(0.18 * qInt, 0, 0.55).toFixed(3)})`);
      halo.addColorStop(0.78, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(0.06 * qInt, 0, 0.25).toFixed(3)})`);
      halo.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      gctx.fillStyle = halo;
      gctx.beginPath();
      gctx.arc(128, 128, 128, 0, Math.PI * 2);
      gctx.fill();
      gctx.restore();

      if (this._isoGlowSpriteCache.size > 128) this._isoGlowSpriteCache.clear();
      this._isoGlowSpriteCache.set(key, cv);
      return cv;
    }

    /**
     * Pre-baked translucent volumetric floodlight cone wedge (`160x160`) from mast lamp head `(80, 0)`
     * fanning smoothly down into the `2:1` snow pool (`0` runtime gradient allocations!).
     */
    _getFloodlightWedgeSprite(colorHex) {
      if (typeof document === "undefined") return null;
      const cNorm = String(colorHex || "#e0f2fe").toLowerCase();
      let cv = this._floodWedgeCache.get(cNorm);
      if (cv) return cv;

      cv = document.createElement("canvas");
      cv.width = 160;
      cv.height = 160;
      const wctx = cv.getContext("2d");
      if (!wctx) return null;

      const rgb = hexToRgb(cNorm);
      const beam = wctx.createLinearGradient(80, 0, 80, 156);
      beam.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`);
      beam.addColorStop(0.48, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
      beam.addColorStop(0.88, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`);
      beam.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.0)`);

      wctx.fillStyle = beam;
      wctx.beginPath();
      wctx.moveTo(80 - 3, 0);
      wctx.lineTo(80 + 3, 0);
      wctx.lineTo(154, 152);
      wctx.quadraticCurveTo(80, 162, 6, 152);
      wctx.closePath();
      wctx.fill();

      if (this._floodWedgeCache.size > 32) this._floodWedgeCache.clear();
      this._floodWedgeCache.set(cNorm, cv);
      return cv;
    }

    /**
     * Pre-baked twin xenon headlight cone (`160x112`) extending along `+X` from `(8, 56)`.
     */
    _getHeadlightBeamSprite() {
      if (this._headlightBeamSprite) return this._headlightBeamSprite;
      if (typeof document === "undefined") return null;
      const cv = document.createElement("canvas");
      cv.width = 160;
      cv.height = 112;
      const hctx = cv.getContext("2d");
      if (!hctx) return null;

      const drawLampCone = (oy, spreadTop, spreadBot) => {
        const g = hctx.createLinearGradient(6, oy, 154, 56);
        g.addColorStop(0.0, "rgba(255, 250, 214, 0.44)");
        g.addColorStop(0.38, "rgba(224, 242, 254, 0.22)");
        g.addColorStop(0.78, "rgba(186, 230, 253, 0.08)");
        g.addColorStop(1.0, "rgba(186, 230, 253, 0.0)");
        hctx.fillStyle = g;
        hctx.beginPath();
        hctx.moveTo(6, oy - 2.5);
        hctx.lineTo(6, oy + 2.5);
        hctx.lineTo(154, oy + spreadBot);
        hctx.quadraticCurveTo(158, oy + (spreadTop + spreadBot) * 0.5, 154, oy - spreadTop);
        hctx.closePath();
        hctx.fill();
      };
      drawLampCone(46, 34, 24);
      drawLampCone(66, 24, 34);
      this._headlightBeamSprite = cv;
      return cv;
    }

    _getHeliBeamSprite() {
      if (this._heliBeamSprite) return this._heliBeamSprite;
      if (typeof document === "undefined") return null;
      const cv = document.createElement("canvas");
      cv.width = 96;
      cv.height = 128;
      const bctx = cv.getContext("2d");
      if (!bctx) return null;
      const coneGrad = bctx.createLinearGradient(48, 0, 48, 128);
      coneGrad.addColorStop(0.0, "rgba(224, 242, 254, 0.34)");
      coneGrad.addColorStop(0.7, "rgba(186, 230, 253, 0.14)");
      coneGrad.addColorStop(1.0, "rgba(186, 230, 253, 0.0)");
      bctx.fillStyle = coneGrad;
      bctx.beginPath();
      bctx.moveTo(48 - 4.2, 0);
      bctx.lineTo(48 + 4.2, 0);
      bctx.lineTo(96, 128);
      bctx.lineTo(0, 128);
      bctx.closePath();
      bctx.fill();
      this._heliBeamSprite = cv;
      return cv;
    }

    _ensureAlpenglowGradients(ctx, w, h) {
      if (
        this._alpenglowGradCache &&
        this._alpenglowGradCache.w === w &&
        this._alpenglowGradCache.h === h
      ) {
        return this._alpenglowGradCache;
      }
      const valleyWash = ctx.createLinearGradient(0, h * 0.35, 0, h);
      valleyWash.addColorStop(0, "rgba(255, 166, 118, 0.04)");
      valleyWash.addColorStop(1, "rgba(88, 72, 132, 0.14)");

      const sunGrad = ctx.createLinearGradient(0, 0, w * 0.85, h * 0.85);
      sunGrad.addColorStop(0.0, "rgba(255, 192, 132, 0.24)");
      sunGrad.addColorStop(0.5, "rgba(255, 142, 116, 0.11)");
      sunGrad.addColorStop(1.0, "rgba(120, 96, 160, 0.0)");

      const shaftDefs = [
        [-0.06, 0.16, 0.14],
        [0.18, 0.12, 0.1],
        [0.44, 0.15, 0.09],
      ];
      const beams = [];
      for (let i = 0; i < shaftDefs.length; i++) {
        const [startFrac, widthFrac, alpha] = shaftDefs[i];
        const x0 = w * startFrac;
        const bw = w * widthFrac;
        const beam = ctx.createLinearGradient(x0, 0, x0 + h * 0.72, h);
        beam.addColorStop(0, `rgba(255, 214, 158, ${alpha})`);
        beam.addColorStop(0.65, `rgba(255, 154, 118, ${(alpha * 0.45).toFixed(3)})`);
        beam.addColorStop(1, "rgba(255, 140, 110, 0)");
        beams.push({ x0, bw, grad: beam });
      }
      this._alpenglowGradCache = { w, h, valleyWash, sunGrad, beams };
      return this._alpenglowGradCache;
    }

    _drawAtmosphereLighting(ctx, w, h) {
      if (this.atmosphere === "day") return;

      const zoom = this.zoom;
      const panX = this.panX;
      const panY = this.panY;
      const halfViewW = w * 0.5;
      const halfViewH = h * 0.5;

      if (this.atmosphere === "alpenglow") {
        const ag = this._ensureAlpenglowGradients(ctx, w, h);
        ctx.save();
        ctx.fillStyle = ag.valleyWash;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = ag.sunGrad;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < ag.beams.length; i++) {
          const b = ag.beams[i];
          ctx.fillStyle = b.grad;
          ctx.beginPath();
          ctx.moveTo(b.x0, 0);
          ctx.lineTo(b.x0 + b.bw, 0);
          ctx.lineTo(b.x0 + b.bw + h * 0.78, h);
          ctx.lineTo(b.x0 + h * 0.78, h);
          ctx.closePath();
          ctx.fill();
        }

        // Firework sky/snow blooms & 100% emissive sparks ABOVE the Alpenglow veil!
        const fwGlows = this._fireworkGlowsScratch;
        if (fwGlows.length > 0) {
          ctx.imageSmoothingEnabled = true;
          for (let i = 0; i < fwGlows.length; i++) {
            const fg = fwGlows[i];
            const spX = (fg.wx - panX) * zoom + halfViewW;
            const spY = (fg.wy - panY) * zoom + halfViewH;
            const isIso = fg.shape === "iso";
            const rx = Math.max(24, fg.radius * (isIso ? 32 : 30) * zoom);
            const ry = isIso ? rx * 0.47 : rx;
            if (spX + rx < 0 || spX - rx > w || spY + ry < 0 || spY - ry > h) continue;
            const gs = isIso
              ? this._getIsoGlowSprite(fg.color, 1.1)
              : this._getGlowSprite(fg.color, 1.25);
            if (gs) {
              ctx.globalAlpha = clamp((fg.alpha !== undefined ? fg.alpha : 0.85) * 0.85, 0.04, 1.0);
              ctx.drawImage(gs, spX - rx, spY - ry, rx * 2, ry * 2);
            }
          }
          ctx.globalAlpha = 1.0;
          ctx.imageSmoothingEnabled = false;
        }
        ctx.restore();

        // Re-stamp crisp pixel-art firework rockets & jewel bursts ABOVE the Alpenglow wash
        if (this.sim && typeof this.sim.getFireworks === "function") {
          const smAg = this.world ? this._getSceneMetrics(this.world.size) : null;
          const effDprAg = ctx === this.ctx ? this.dpr : 1;
          const dxAg = smAg
            ? Math.round((halfViewW - (panX + smAg.originX) * zoom) * effDprAg) / effDprAg
            : halfViewW - panX * zoom;
          const dyAg = smAg
            ? Math.round((halfViewH - (panY + smAg.originY) * zoom) * effDprAg) / effDprAg
            : halfViewH - panY * zoom;
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.imageSmoothingEnabled = false;
          ctx.translate(dxAg, dyAg);
          ctx.scale(zoom, zoom);
          this._cullRect = smAg
            ? {
                x0: Math.floor(-dxAg / zoom) - 48,
                y0: Math.floor(-dyAg / zoom) - 48,
                x1: Math.ceil((w - dxAg) / zoom) + 48,
                y1: Math.ceil((h - dyAg) / zoom) + 48,
              }
            : null;
          try {
            this._drawFireworksWorldPass(ctx, smAg ? smAg.originX : 0, smAg ? smAg.originY : 0, false);
          } finally {
            this._cullRect = null;
            ctx.restore();
          }
        }
        return;
      }

      // -----------------------------------------------------------------------
      // Night Mode 2.0: Prussian Cobalt-Cyan Moonlight (`rgba(10, 25, 56, 0.56)`),
      // `2:1` Downslope Floodlight Snow Pools, View-Cached `1:1` Crisp Pixel-Art
      // Emissives, Sweeping Twin Headlights, Lit Cabins, Torches & Fireworks!
      // -----------------------------------------------------------------------
      const {
        staticLights,
        dynamicLights,
        heliSpotlights,
        vehicleHeadlights,
        litCabins,
        torchFlares,
        balloonBurners,
      } = this._collectAllNightLights();

      const halfW = Math.max(160, Math.round(w * 0.5));
      const halfH = Math.max(120, Math.round(h * 0.5));
      const scaleX = halfW / Math.max(1, w);
      const scaleY = halfH / Math.max(1, h);
      const isoCutSprite = this._getIsoCutoutSprite();
      const roundCutSprite = this._getCutoutSprite();

      // Exact texel-grid mapping matching `_worldBuf` (`0.0px` drift at all zooms & PNG export!)
      const sm = this.world ? this._getSceneMetrics(this.world.size) : null;
      const effDpr = ctx === this.ctx ? this.dpr : 1;
      const destX = sm
        ? Math.round((halfViewW - (panX + sm.originX) * zoom) * effDpr) / effDpr
        : halfViewW - panX * zoom;
      const destY = sm
        ? Math.round((halfViewH - (panY + sm.originY) * zoom) * effDpr) / effDpr
        : halfViewH - panY * zoom;
      const sx0 = sm ? clamp(Math.floor(-destX / zoom), 0, sm.fullW) : 0;
      const sy0 = sm ? clamp(Math.floor(-destY / zoom), 0, sm.fullH) : 0;
      const sx1 = sm ? clamp(Math.ceil((w - destX) / zoom), 0, sm.fullW) : 0;
      const sy1 = sm ? clamp(Math.ceil((h - destY) / zoom), 0, sm.fullH) : 0;
      const sw = Math.max(0, sx1 - sx0);
      const sh = Math.max(0, sy1 - sy0);

      const punchCutoutList = (targetCtx, list) => {
        for (let i = 0; i < list.length; i++) {
          const L = list[i];
          if (L.cutout === false) continue;
          const wx =
            L.wx !== undefined
              ? L.wx
              : (L.c - L.r) * HALF_W +
                ((L.v !== undefined ? L.v : 4.0) - (L.u !== undefined ? L.u : 4.0)) * 8.0;
          const wy =
            L.wy !== undefined
              ? L.wy
              : (L.r + L.c) * HALF_H +
                ((L.u !== undefined ? L.u : 4.0) + (L.v !== undefined ? L.v : 4.0)) * 4.0 -
                (L.z || 0) * 4.0;
          const lx = ((wx - panX) * zoom + halfViewW) * scaleX;
          const ly = ((wy - panY) * zoom + halfViewH) * scaleY;
          const isIso = L.shape !== "round";
          const rx = Math.max(16, (L.radius || 2.5) * (isIso ? 34 : 28) * zoom * scaleX);
          const ry = isIso ? rx * 0.47 : rx;
          if (lx + rx < 0 || lx - rx > halfW || ly + ry < 0 || ly - ry > halfH) continue;

          const sp = isIso ? isoCutSprite : roundCutSprite;
          if (sp) {
            const cutAlpha = L.cutoutAlpha !== undefined ? L.cutoutAlpha : 1.0;
            if (cutAlpha < 0.99) targetCtx.globalAlpha = cutAlpha;
            targetCtx.drawImage(sp, lx - rx, ly - ry, rx * 2, ry * 2);
            if (cutAlpha < 0.99) targetCtx.globalAlpha = 1.0;
          }
        }
      };

      const viewKey = `${this.world ? this.world.version : 0}|${w}|${h}|${Math.round(panX * 4)}|${Math.round(panY * 4)}|${Math.round(zoom * 1000)}`;
      const sdb = this._staticDuskCutoutBuf;
      const sdctx = this._staticDuskCutoutCtx;
      const shb = this._staticNightHaloBuf;
      const shctx = this._staticNightHaloCtx;
      const seb = this._staticNightEmissiveBuf;
      const sectx = this._staticNightEmissiveCtx;

      if (sdb && sdctx && shb && shctx && this._nightViewCacheKey !== viewKey) {
        if (sdb.width !== halfW || sdb.height !== halfH) {
          sdb.width = halfW;
          sdb.height = halfH;
        }
        if (shb.width !== halfW || shb.height !== halfH) {
          shb.width = halfW;
          shb.height = halfH;
        }

        // 1. Rich Prussian Cobalt-Cyan Alpine Moonlight (`rgba(10, 25, 56, 0.56)`) + `2:1` elliptical ground cutouts
        sdctx.save();
        sdctx.globalCompositeOperation = "source-over";
        sdctx.imageSmoothingEnabled = true;
        sdctx.clearRect(0, 0, halfW, halfH);
        sdctx.fillStyle = "rgba(10, 25, 56, 0.56)";
        sdctx.fillRect(0, 0, halfW, halfH);
        sdctx.globalCompositeOperation = "destination-out";
        punchCutoutList(sdctx, staticLights);
        sdctx.restore();

        // 2. Bake `2:1` downslope floodlight snow pools, doorstep pools, cerulean summit sheen & cone wedges
        shctx.save();
        shctx.globalCompositeOperation = "source-over";
        shctx.clearRect(0, 0, halfW, halfH);
        shctx.globalCompositeOperation = "screen";
        shctx.imageSmoothingEnabled = true;

        // 2a. Translucent directional floodlight & neon-park cone wedges from mast top into downslope snow pool
        const cones = this._floodlightCones;
        for (let ci = 0; ci < cones.length; ci++) {
          const fc = cones[ci];
          const topX = ((fc.mastWx - panX) * zoom + halfViewW) * scaleX;
          const topY = ((fc.mastWy - panY) * zoom + halfViewH) * scaleY;
          const botX = ((fc.poolWx - panX) * zoom + halfViewW) * scaleX;
          const botY = ((fc.poolWy - panY) * zoom + halfViewH) * scaleY;
          const dx = botX - topX;
          const dy = botY - topY;
          const len = Math.hypot(dx, dy);
          if (len < 4) continue;
          const halfSpread = Math.max(12, fc.spread * zoom * scaleX);
          if (
            Math.max(topX, botX) + halfSpread < 0 ||
            Math.min(topX, botX) - halfSpread > halfW ||
            Math.max(topY, botY) + halfSpread < 0 ||
            Math.min(topY, botY) - halfSpread > halfH
          ) {
            continue;
          }
          const wedge = this._getFloodlightWedgeSprite(fc.color);
          if (wedge) {
            shctx.save();
            shctx.globalAlpha = fc.alpha;
            shctx.translate(topX, topY);
            shctx.rotate(Math.atan2(dy, dx) - Math.PI * 0.5);
            shctx.drawImage(wedge, -halfSpread, 0, halfSpread * 2, len * 1.12);
            shctx.restore();
          }
        }

        // 2b. `2:1` elliptical ground snow illumination pools & high-summit cerulean rim sheen
        for (let i = 0; i < staticLights.length; i++) {
          const L = staticLights[i];
          const spX = (L.wx - panX) * zoom + halfViewW;
          const spY = (L.wy - panY) * zoom + halfViewH;
          const isIso = L.shape !== "round";
          const rx = Math.max(20, (L.radius || 2.5) * (isIso ? 35 : 30) * zoom);
          const ry = isIso ? rx * 0.47 : rx;
          if (spX + rx < 0 || spX - rx > w || spY + ry < 0 || spY - ry > h) continue;
          const glowSprite =
            L._glowSprite ||
            (isIso
              ? this._getIsoGlowSprite(L.color, L.intensity)
              : this._getGlowSprite(L.color, L.intensity));
          if (glowSprite) {
            if (L._cacheable && !L._glowSprite) L._glowSprite = glowSprite;
            shctx.drawImage(
              glowSprite,
              (spX - rx) * scaleX,
              (spY - ry) * scaleY,
              rx * 2 * scaleX,
              ry * 2 * scaleY
            );
          }
        }
        shctx.restore();

        // 3. Bake `1:1` texel-locked crisp pixel-art emissive windows, lanterns, stained glass & bulbs!
        if (seb && sectx && sm && sw > 0 && sh > 0) {
          if (seb.width !== sw || seb.height !== sh) {
            seb.width = sw;
            seb.height = sh;
          }
          sectx.setTransform(1, 0, 0, 1, 0, 0);
          sectx.globalCompositeOperation = "source-over";
          sectx.imageSmoothingEnabled = false;
          sectx.clearRect(0, 0, sw, sh);

          const stamps = this._staticEmissiveStamps;
          let lastColor = "";
          for (let si = 0; si < stamps.length; si++) {
            const st = stamps[si];
            const bx = sm.originX + st.wx - sx0;
            const by = sm.originY + st.wy - sy0;
            if (bx + st.pw < 0 || bx > sw || by + st.ph < 0 || by > sh) continue;
            if (st.color !== lastColor) {
              lastColor = st.color;
              sectx.fillStyle = lastColor;
            }
            sectx.fillRect(bx, by, st.pw, st.ph);
          }
        }

        this._nightViewCacheKey = viewKey;
      }

      // 4. Composite Prussian Cobalt-Cyan Night Tint + Live Dynamic Cutouts (`_duskBuf`)
      const fwGlows = this._fireworkGlowsScratch;
      const hasDynCutouts = dynamicLights.length > 0 || fwGlows.length > 0;
      const db = this._duskBuf;
      const dctx = this._duskCtx;
      if (db && dctx && sdb) {
        if (!hasDynCutouts) {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(sdb, 0, 0, w, h);
          ctx.imageSmoothingEnabled = false;
          ctx.restore();
        } else {
          if (db.width !== halfW || db.height !== halfH) {
            db.width = halfW;
            db.height = halfH;
          }
          dctx.save();
          dctx.globalCompositeOperation = "source-over";
          dctx.imageSmoothingEnabled = true;
          dctx.clearRect(0, 0, halfW, halfH);
          dctx.drawImage(sdb, 0, 0);
          dctx.globalCompositeOperation = "destination-out";
          if (dynamicLights.length > 0) punchCutoutList(dctx, dynamicLights);
          if (fwGlows.length > 0) punchCutoutList(dctx, fwGlows);
          dctx.restore();

          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(db, 0, 0, w, h);
          ctx.imageSmoothingEnabled = false;
          ctx.restore();
        }
      }

      // 5. Additive `"screen"` Halos: Static Snow Pools, Sweeping Twin Headlights, Heli Beams, Torches & Fireworks
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.imageSmoothingEnabled = true;

      if (shb) {
        const shimmer = 0.97 + 0.03 * Math.sin(this.time * 2.8);
        ctx.globalAlpha = shimmer;
        ctx.drawImage(shb, 0, 0, w, h);
        ctx.globalAlpha = 1.0;
      }

      // 5a. Sweeping Twin Vehicle Headlight Cones (`snowcat`, `winch_cat`, `snowmobile`, `shuttle_bus`, `alpine_train_loco`)
      if (vehicleHeadlights.length > 0) {
        const hlSprite = this._getHeadlightBeamSprite();
        if (hlSprite) {
          for (let vi = 0; vi < vehicleHeadlights.length; vi++) {
            const vh = vehicleHeadlights[vi];
            const vx = (vh.wx - panX) * zoom + halfViewW;
            const vy = (vh.wy - panY) * zoom + halfViewH;
            const beamLen = vh.beamLen * zoom;
            const beamW = vh.beamW * zoom;
            if (
              vx + beamLen < 0 ||
              vx - beamLen > w ||
              vy + beamLen < 0 ||
              vy - beamLen > h
            ) {
              continue;
            }
            ctx.save();
            ctx.translate(vx, vy);
            ctx.rotate(vh.angle);
            ctx.drawImage(hlSprite, -4 * zoom, -beamW * 0.5, beamLen, beamW);
            ctx.restore();
          }
        }
      }

      // 5b. VIP Helicopter Searchlight Cones
      for (let hi = 0; hi < heliSpotlights.length; hi++) {
        const hs = heliSpotlights[hi];
        const topX = (hs.heliWx - panX) * zoom + halfViewW;
        const topY = (hs.heliWy - panY) * zoom + halfViewH;
        const botX = (hs.spotWx - panX) * zoom + halfViewW;
        const botY = (hs.spotWy - panY) * zoom + halfViewH;
        const coneR = Math.max(18, 34 * zoom);
        const bdx = botX - topX;
        const bdy = botY - topY;
        const bLen = Math.hypot(bdx, bdy);
        const beamSprite = bLen > 2 ? this._getHeliBeamSprite() : null;
        if (beamSprite) {
          ctx.save();
          ctx.translate(topX, topY);
          ctx.rotate(Math.atan2(bdy, bdx) - Math.PI * 0.5);
          ctx.drawImage(beamSprite, -coneR, 0, coneR * 2, bLen);
          ctx.restore();
        }
      }

      // 5c. Dynamic Halos (Vehicle snow pools, Lit Cabins, Torchlight Skiers, Balloon Burners)
      for (let i = 0; i < dynamicLights.length; i++) {
        const L = dynamicLights[i];
        const wx =
          L.wx !== undefined
            ? L.wx
            : (L.c - L.r) * HALF_W +
              ((L.v !== undefined ? L.v : 4.0) - (L.u !== undefined ? L.u : 4.0)) * 8.0;
        const wy =
          L.wy !== undefined
            ? L.wy
            : (L.r + L.c) * HALF_H +
              ((L.u !== undefined ? L.u : 4.0) + (L.v !== undefined ? L.v : 4.0)) * 4.0 -
              (L.z || 0) * 4.0;
        const spX = (wx - panX) * zoom + halfViewW;
        const spY = (wy - panY) * zoom + halfViewH;
        const isIso = L.shape !== "round";
        const pulse = 0.94 + 0.06 * Math.sin(this.time * 3.6 + i * 1.3);
        const rx = Math.max(18, (L.radius || 2.4) * (isIso ? 34 : 28) * zoom * pulse);
        const ry = isIso ? rx * 0.47 : rx;
        if (spX + rx < 0 || spX - rx > w || spY + ry < 0 || spY - ry > h) continue;

        const glowSprite = isIso
          ? this._getIsoGlowSprite(L.color, L.intensity)
          : this._getGlowSprite(L.color, L.intensity);
        if (glowSprite) {
          ctx.drawImage(glowSprite, spX - rx, spY - ry, rx * 2, ry * 2);
        }
      }

      // 5d. Firework Sky & `2:1` Snow Reflection Blooms
      if (fwGlows.length > 0) {
        for (let i = 0; i < fwGlows.length; i++) {
          const fg = fwGlows[i];
          const spX = (fg.wx - panX) * zoom + halfViewW;
          const spY = (fg.wy - panY) * zoom + halfViewH;
          const isIso = fg.shape === "iso";
          const rx = Math.max(22, fg.radius * (isIso ? 35 : 32) * zoom);
          const ry = isIso ? rx * 0.47 : rx;
          if (spX + rx < 0 || spX - rx > w || spY + ry < 0 || spY - ry > h) continue;
          const gs = isIso
            ? this._getIsoGlowSprite(fg.color, 1.1)
            : this._getGlowSprite(fg.color, 1.25);
          if (gs) {
            ctx.globalAlpha = clamp(fg.alpha !== undefined ? fg.alpha : 0.9, 0.04, 1.0);
            ctx.drawImage(gs, spX - rx, spY - ry, rx * 2, ry * 2);
          }
        }
        ctx.globalAlpha = 1.0;
      }

      ctx.imageSmoothingEnabled = false;
      ctx.restore();

      // 6. Crisp `1:1` Pixel-Art Emissive Pass (`imageSmoothingEnabled = false` ABOVE night tint!)
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.imageSmoothingEnabled = false;

      if (seb && sm && sw > 0 && sh > 0) {
        ctx.drawImage(
          seb,
          0,
          0,
          sw,
          sh,
          destX + sx0 * zoom,
          destY + sy0 * zoom,
          sw * zoom,
          sh * zoom
        );
      }

      // Texel-aligned dynamic pixel helper (`0.0px` seam alignment with `_worldBuf`)
      const stampWorldPx = (wx, wy, pw, ph, color) => {
        const x0 = sm
          ? Math.round(destX + (sm.originX + wx) * zoom)
          : Math.round((wx - panX) * zoom + halfViewW);
        const y0 = sm
          ? Math.round(destY + (sm.originY + wy) * zoom)
          : Math.round((wy - panY) * zoom + halfViewH);
        const x1 = sm
          ? Math.round(destX + (sm.originX + wx + pw) * zoom)
          : Math.round((wx + pw - panX) * zoom + halfViewW);
        const y1 = sm
          ? Math.round(destY + (sm.originY + wy + ph) * zoom)
          : Math.round((wy + ph - panY) * zoom + halfViewH);
        if (x1 < 0 || x0 > w || y1 < 0 || y0 > h) return;
        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
      };

      // 6a. Frozen Lagoon & Ice Rink Golden Lantern Shimmer Ripples
      const iceCells = this._iceShimmerCells;
      for (let ii = 0; ii < iceCells.length; ii++) {
        const ic = iceCells[ii];
        const phase = this.time * 2.4 + ic.seed * 0.9;
        const alpha = 0.22 + 0.16 * Math.sin(phase);
        const drift = Math.round(Math.sin(phase * 0.7) * 5);
        stampWorldPx(
          ic.wx - 8 + drift,
          ic.wy - 1,
          7,
          1,
          lutPick(ic.warm ? LUT_ICE_SHIMMER_GOLD : LUT_ICE_SHIMMER_CYAN, alpha)
        );
        stampWorldPx(
          ic.wx + 2 - drift,
          ic.wy + 2,
          5,
          1,
          lutPick(LUT_ICE_SHIMMER_GOLD, alpha * 0.85)
        );
      }

      // 6b. Animated Centerpiece Emissives (Ferris Wheel, Observatory, Carousel, Pyramid, Ice Palace, DJ, Cinema)
      const structFrame = Math.floor(this.time * 4.8) & 3;
      this._drawAnimatedStructureEmissives(stampWorldPx, structFrame);

      // 6c. Crisp `2x2px` `#FFE082` Lit Gondola, 3S Tram, Funicular & Alpine Train Cabin Windows
      for (let ci = 0; ci < litCabins.length; ci++) {
        const cb = litCabins[ci];
        if (cb.panoramic) {
          stampWorldPx(cb.wx - 5, cb.wy - 1, 2, 2, "#FFE082");
          stampWorldPx(cb.wx - 1, cb.wy - 1, 2, 2, "#FFF8E1");
          stampWorldPx(cb.wx + 3, cb.wy - 1, 2, 2, "#FFE082");
        } else if (cb.warmBubble) {
          stampWorldPx(cb.wx - 2, cb.wy - 1, 3, 2, "#FDBA74");
          stampWorldPx(cb.wx - 1, cb.wy - 1, 1, 1, "#FFFBEB");
        } else {
          stampWorldPx(cb.wx - 3, cb.wy - 1, 2, 2, "#FFE082");
          stampWorldPx(cb.wx + 1, cb.wy - 1, 2, 2, "#FFF8E1");
        }
      }

      // 6d. Crisp Twin Headlamp Dots on Active Vehicles
      for (let vi = 0; vi < vehicleHeadlights.length; vi++) {
        const vh = vehicleHeadlights[vi];
        stampWorldPx(vh.lamp1Wx - 1, vh.lamp1Wy - 1, 2, 2, "#FFFBEB");
        stampWorldPx(vh.lamp2Wx - 1, vh.lamp2Wy - 1, 2, 2, "#FEF08A");
      }

      // 6e. Torchlight Skier Handheld Flame Tips & Hot-Air Balloon Burner Cores
      const flicker = (Math.floor(this.time * 12) & 1) === 0 ? 0 : -1;
      for (let ti = 0; ti < torchFlares.length; ti++) {
        const tf = torchFlares[ti];
        stampWorldPx(tf.wx - 1, tf.wy + flicker, 2, 2, "#FF6D00");
        stampWorldPx(tf.wx - 1, tf.wy - 1 + flicker, 1, 2, "#FFFBEB");
      }
      for (let bi = 0; bi < balloonBurners.length; bi++) {
        const bb = balloonBurners[bi];
        stampWorldPx(bb.wx - 1, bb.wy - 2, 3, 3, "#FFB74D");
        stampWorldPx(bb.wx, bb.wy - 2, 1, 2, "#FFFBEB");
      }

      // 6f. Re-stamp `[F]` Fireworks ABOVE the Prussian-blue Night Veil at 100% emissive brilliance!
      if (this.sim && typeof this.sim.getFireworks === "function") {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.imageSmoothingEnabled = false;
        ctx.translate(destX, destY);
        ctx.scale(zoom, zoom);
        this._cullRect = sm
          ? { x0: sx0 - 48, y0: sy0 - 48, x1: sx1 + 48, y1: sy1 + 48 }
          : null;
        try {
          this._drawFireworksWorldPass(ctx, sm ? sm.originX : 0, sm ? sm.originY : 0, false);
        } finally {
          this._cullRect = null;
          ctx.restore();
        }
      }

      ctx.restore();
    }

    _drawAnimatedStructureEmissives(stampWorldPx, structFrame) {
      const sites = this._animEmissiveSites;
      if (!sites || sites.length === 0) return;

      const cabinPalette = ["#FFE082", "#7DD3FC", "#FDA4AF", "#86EFAC"];
      for (let i = 0; i < sites.length; i++) {
        const s = sites[i];
        const kind = s.kind;

        if (kind === "ferris") {
          // Exact `gen_v3_landmarks.py` wheel geometry (`base_deg = structFrame * 11.25`, `r=48.1`)
          const baseRad = (structFrame * 11.25 * Math.PI) / 180;
          stampWorldPx(s.hubFrontWx - 1, s.hubFrontWy - 1, 3, 3, "#FFFBEB");
          for (let b = 0; b < 24; b++) {
            const th = baseRad + (b * 15 * Math.PI) / 180;
            const X = 48.1 * Math.cos(th);
            const Y = 48.1 * Math.sin(th);
            const bx = Math.round(s.hubFrontWx + 0.88 * X);
            const by = Math.round(s.hubFrontWy + 0.44 * X - 1.0 * Y);
            const sparkle = ((b + structFrame) & 1) === 0 ? "#FFFBEB" : "#FFD54F";
            stampWorldPx(bx, by, 2, 2, sparkle);
          }
          for (let k = 0; k < 8; k++) {
            const th = baseRad + (k * 45 * Math.PI) / 180;
            const X = 48.1 * Math.cos(th);
            const Y = 48.1 * Math.sin(th);
            const gx = Math.round(s.hubMidWx + 0.88 * X);
            const gy = Math.round(s.hubMidWy + 0.44 * X - 1.0 * Y + 5);
            stampWorldPx(gx - 2, gy - 1, 2, 2, cabinPalette[k & 3]);
            stampWorldPx(gx + 1, gy - 1, 2, 2, "#FFF8E1");
          }
        } else if (kind === "observatory") {
          // Rotating silver dome slit gleam (`structFrame`) + blinking aviation strobe beacon
          const slitAngles = [-35, -18, 0, 18];
          const rad = (slitAngles[structFrame & 3] * Math.PI) / 180;
          const sx = Math.round(s.domeWx + Math.sin(rad) * 5.0);
          const sy = Math.round(s.domeWy - 4);
          stampWorldPx(sx - 1, sy - 4, 2, 7, "#BAE6FD");
          stampWorldPx(sx, sy - 3, 1, 5, "#F0F9FF");
          if ((structFrame & 1) === 0) {
            stampWorldPx(s.beaconWx - 1, s.beaconWy - 1, 2, 2, "#FF5252");
            stampWorldPx(s.beaconWx, s.beaconWy - 1, 1, 1, "#FFCDD2");
          }
        } else if (kind === "carousel") {
          // Chasing warm-gold & rose canopy valance bulbs + glowing mirror center column
          stampWorldPx(s.wx - 1, s.wy + 6, 3, 6, "#FFE082");
          for (let b = 0; b < 10; b++) {
            const ang = (b / 10) * Math.PI * 2;
            const bx = Math.round(s.wx + Math.cos(ang) * 20);
            const by = Math.round(s.wy + Math.sin(ang) * 9.5);
            const col = ((b + structFrame) & 1) === 0 ? "#FFFBEB" : "#FFB74D";
            stampWorldPx(bx, by, 2, 2, col);
          }
        } else if (kind === "pyramid") {
          // 3 candle tiers with dancing pixel flame tips
          const tiers = [
            [14, 0],
            [10, -9],
            [6, -17],
          ];
          for (let t = 0; t < tiers.length; t++) {
            const [radX, offY] = tiers[t];
            for (let k = -1; k <= 1; k += 2) {
              const wob = ((structFrame + t + (k > 0 ? 1 : 0)) & 1) === 0 ? 0 : -1;
              stampWorldPx(s.wx + k * radX - 1, s.wy + offY + wob, 2, 2, "#FF9E40");
              stampWorldPx(s.wx + k * radX, s.wy + offY - 1 + wob, 1, 2, "#FFFBEB");
            }
          }
        } else if (kind === "ice_palace") {
          // Pulsing cyan-violet internal crystal turret glow
          const cA = (structFrame & 1) === 0 ? "#67E8F9" : "#A5F3FC";
          const cB = (structFrame & 1) === 0 ? "#C084FC" : "#38BDF8";
          stampWorldPx(s.wx - 13, s.wy - 4, 2, 6, cA);
          stampWorldPx(s.wx + 11, s.wy - 4, 2, 6, cB);
          stampWorldPx(s.wx - 1, s.wy - 10, 3, 4, "#E0F2FE");
        } else if (kind === "dj_booth") {
          // Equalizer LED bars + twin neon stage spots
          const eqCols = ["#22D3EE", "#F43F5E", "#A855F7", "#4ADE80"];
          for (let b = 0; b < 4; b++) {
            const barH = 2 + (((structFrame + b * 3) * 5) % 4);
            stampWorldPx(
              s.wx - 6 + b * 4,
              s.wy + 2 - barH,
              2,
              barH,
              eqCols[(b + structFrame) & 3]
            );
          }
        } else if (kind === "cinema") {
          // Illuminated `2:1` outdoor cinema screen + fairy garland + brass projector lens
          const skyCol = structFrame === 2 ? "#FDE68A" : "#BAE6FD";
          const peakCol = structFrame === 1 ? "#F0F9FF" : "#E0F2FE";
          for (let step = 0; step < 6; step++) {
            const sx = s.screenWx0 + step * 5;
            const sy = s.screenWy0 + Math.round(step * 2.5);
            stampWorldPx(sx, sy - 14, 5, 11, skyCol);
            stampWorldPx(sx + 1, sy - 7 - (step % 2) * 2, 4, 4, peakCol);
            if ((step + structFrame) % 2 === 0) {
              stampWorldPx(sx + 1, sy - 17, 2, 2, "#FFE082");
            }
          }
          stampWorldPx(s.projWx, s.projWy, 2, 2, "#FFFBEB");
        } else if (kind === "hearth") {
          const wob = (structFrame & 1) === 0 ? 0 : -1;
          stampWorldPx(s.wx - 2, s.wy, 5, 2, "#FF6D00");
          stampWorldPx(s.wx - 1, s.wy - 1 + wob, 3, 2, "#FFB74D");
          stampWorldPx(s.wx, s.wy - 2 + wob, 1, 2, "#FFFBEB");
        }
      }
    }

    _computeDownslopeVec(world, r, c) {
      const n = world.size;
      const cell = world.cells[r][c];
      // Local corner gradient `(N=(0,0), E=(0,1), S=(1,1), W=(1,0))`
      let gradR = 0;
      let gradC = 0;
      if (world.cornerZ) {
        const zN = world.cornerZ[r][c] || 0;
        const zE = world.cornerZ[r][c + 1] || 0;
        const zS = world.cornerZ[r + 1][c + 1] || 0;
        const zW = world.cornerZ[r + 1][c] || 0;
        gradR = zN + zE - (zW + zS);
        gradC = zN + zW - (zE + zS);
      }
      const centerZ =
        typeof world.getSurfaceZ === "function"
          ? world.getSurfaceZ(r, c, 4.0, 4.0, true)
          : (cell.minLevel || 0) * ELEV_STEP_Z;

      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      for (let i = 0; i < dirs.length; i++) {
        const [dr, dc] = dirs[i];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        const nz =
          typeof world.getSurfaceZ === "function"
            ? world.getSurfaceZ(nr, nc, 4.0, 4.0, true)
            : (world.cells[nr][nc].minLevel || 0) * ELEV_STEP_Z;
        const drop = centerZ - nz;
        const inv = dr !== 0 && dc !== 0 ? 0.7071 : 1.0;
        gradR += dr * drop * inv;
        gradC += dc * drop * inv;
      }

      const len = Math.hypot(gradR, gradC);
      if (len > 0.08) {
        return { dr: gradR / len, dc: gradC / len };
      }
      // Gentle default piste fall-line toward front-right/front-left viewer valley
      return (r + c) % 2 === 0 ? { dr: 0.78, dc: 0.62 } : { dr: 0.62, dc: 0.78 };
    }

    _appendStructureEmissives(r, c, cell, sid, stampsOut, animOut) {
      const lo = cell.minLevel || 0;
      const baseZ = lo * ELEV_STEP_Z;
      const addIsoPx = (u, v, zLocal, dxPx, dyPx, pw, ph, color) => {
        const wx = Math.round((c - r) * HALF_W + (v - u) * 8.0) + dxPx;
        const wy =
          Math.round((r + c) * HALF_H + (u + v) * 4.0 - (baseZ + zLocal) * 4.0) + dyPx;
        stampsOut.push({ wx, wy, pw, ph, color });
      };
      const isoWorldPt = (u, v, zLocal) => ({
        wx: Math.round((c - r) * HALF_W + (v - u) * 8.0),
        wy: Math.round((r + c) * HALF_H + (u + v) * 4.0 - (baseZ + zLocal) * 4.0),
      });

      // 1. v3 Animated `2x2` Landmarks (anchored on `_nw` quadrant so `iso_pt2` matches `0.0px`!)
      if (sid === "festival_ferris_wheel_2x2_nw") {
        const hf = isoWorldPt(8.5, 8.0, 22.4);
        const hb = isoWorldPt(6.65, 8.0, 22.4);
        animOut.push({
          kind: "ferris",
          hubFrontWx: hf.wx,
          hubFrontWy: hf.wy,
          hubMidWx: Math.round((hf.wx + hb.wx) * 0.5),
          hubMidWy: Math.round((hf.wy + hb.wy) * 0.5),
        });
        // Ticket kiosk golden booth window & boarding platform fairy lamps
        addIsoPx(13.8, 3.75, 3.2, -1, -1, 3, 3, "#FFE082");
        addIsoPx(11.2, 6.2, 2.2, -1, -1, 2, 2, "#FFFBEB");
        addIsoPx(11.2, 9.8, 2.2, -1, -1, 2, 2, "#FFFBEB");
        return;
      }
      if (sid === "sphinx_observatory_2x2_nw") {
        // Panoramic summit research & visitor terrace windows (`gen_v3_landmarks.py` coordinates)
        const flCols = [3.7, 6.9];
        for (let fi = 0; fi < flCols.length; fi++) {
          addIsoPx(9.0, flCols[fi], 8.5, -1, -2, 3, 4, "#FFE082");
          addIsoPx(9.0, flCols[fi], 8.5, 0, -1, 1, 2, "#FFFBEB");
          addIsoPx(9.0, flCols[fi], 12.1, -1, -2, 3, 3, "#FFB74D");
        }
        const frCols = [3.7, 6.9];
        for (let fi = 0; fi < frCols.length; fi++) {
          addIsoPx(frCols[fi], 9.0, 8.5, -1, -2, 3, 4, "#FFE082");
          addIsoPx(frCols[fi], 9.0, 12.1, -1, -2, 3, 3, "#FFB74D");
        }
        addIsoPx(7.6, 11.0, 8.5, -1, -2, 3, 3, "#FFE082");
        addIsoPx(13.0, 5.0, 8.5, -1, -2, 3, 3, "#FFE082");
        addIsoPx(12.4, 3.3, 8.2, -1, -1, 2, 3, "#FFD54F");
        addIsoPx(12.4, 6.6, 8.2, -1, -1, 2, 3, "#FFD54F");
        const dome = isoWorldPt(5.4, 5.4, 20.4);
        const beacon = isoWorldPt(2.35, 8.45, 22.3);
        animOut.push({
          kind: "observatory",
          domeWx: dome.wx,
          domeWy: dome.wy,
          beaconWx: beacon.wx,
          beaconWy: beacon.wy,
        });
        return;
      }
      if (
        sid.startsWith("festival_ferris_wheel_2x2_") ||
        sid.startsWith("sphinx_observatory_2x2_")
      ) {
        return;
      }

      // 2. v2 `2x2` Flagship Hotels, Lodges & Thermal Spa
      if (sid.startsWith("grand_hotel_2x2_")) {
        for (let tier = 0; tier < 3; tier++) {
          const z = 2.2 + tier * 2.7;
          const col = tier === 1 ? "#FFF3C4" : "#FFE082";
          addIsoPx(6.1, 2.6, z, -1, -2, 2, 3, col);
          addIsoPx(6.1, 5.2, z, -1, -2, 2, 3, "#FFB74D");
          addIsoPx(2.8, 6.1, z, -1, -2, 2, 3, col);
          addIsoPx(5.4, 6.1, z, -1, -2, 2, 3, "#FFE082");
        }
        return;
      }
      if (sid.startsWith("base_lodge_2x2_")) {
        addIsoPx(6.0, 2.8, 2.1, -1, -2, 3, 3, "#FFE082");
        addIsoPx(6.0, 5.4, 2.1, -1, -2, 3, 3, "#FFCA7A");
        addIsoPx(3.0, 6.0, 2.1, -1, -2, 3, 3, "#FFE082");
        addIsoPx(5.2, 6.0, 4.7, -1, -1, 2, 3, "#FFB74D");
        return;
      }
      if (sid.startsWith("thermal_spa_2x2_")) {
        if (sid.endsWith("_sw") || sid.endsWith("_se")) {
          addIsoPx(4.0, 4.0, 0.5, -4, -1, 5, 2, "#5EEAD4");
          addIsoPx(5.2, 5.0, 0.5, -2, 0, 4, 2, "#99F6E4");
          addIsoPx(6.2, 3.6, 1.2, -1, -1, 2, 2, "#FEF08A");
        } else {
          addIsoPx(5.8, 3.2, 2.2, -1, -2, 2, 3, "#FFE082");
          addIsoPx(3.2, 5.8, 2.2, -1, -2, 2, 3, "#FFD580");
        }
        return;
      }

      // 3. v3 Animated Festival & Village Showpieces
      if (sid === "winter_carousel") {
        const pt = isoWorldPt(4.0, 4.0, 5.6);
        animOut.push({ kind: "carousel", wx: pt.wx, wy: pt.wy });
        return;
      }
      if (sid === "gluhwein_pyramid") {
        addIsoPx(5.6, 3.8, 1.8, -1, -1, 3, 2, "#FFE082");
        addIsoPx(3.8, 5.6, 1.8, -1, -1, 3, 2, "#FFB74D");
        const pt = isoWorldPt(4.0, 4.0, 2.6);
        animOut.push({ kind: "pyramid", wx: pt.wx, wy: pt.wy });
        return;
      }
      if (sid === "ice_palace_arch") {
        addIsoPx(5.8, 2.4, 2.4, -1, -2, 2, 4, "#67E8F9");
        addIsoPx(2.4, 5.8, 2.4, -1, -2, 2, 4, "#67E8F9");
        const pt = isoWorldPt(4.0, 4.0, 4.2);
        animOut.push({ kind: "ice_palace", wx: pt.wx, wy: pt.wy });
        return;
      }
      if (sid === "gondola_dj_booth") {
        addIsoPx(5.6, 4.0, 2.6, -2, -1, 4, 2, "#22D3EE");
        const pt = isoWorldPt(5.2, 4.4, 2.4);
        animOut.push({ kind: "dj_booth", wx: pt.wx, wy: pt.wy });
        return;
      }
      if (sid === "snow_cinema_screen") {
        const sc = isoWorldPt(5.6, 2.1, 2.6);
        const pr = isoWorldPt(3.8, 6.75, 2.9);
        animOut.push({
          kind: "cinema",
          screenWx0: sc.wx,
          screenWy0: sc.wy,
          projWx: pr.wx,
          projWy: pr.wy,
        });
        return;
      }
      if (
        sid === "raclette_hearth_stall" ||
        sid === "marshmallow_brazier" ||
        sid === "firepit_lounge" ||
        sid === "campfire_ring"
      ) {
        if (sid === "raclette_hearth_stall") {
          addIsoPx(5.6, 3.2, 2.2, -1, -1, 3, 2, "#FFE082");
        }
        const pt = isoWorldPt(4.4, 4.4, 1.4);
        animOut.push({ kind: "hearth", wx: pt.wx, wy: pt.wy });
        return;
      }
      if (sid === "glockenspiel_tower") {
        addIsoPx(5.5, 4.0, 9.2, -1, -1, 3, 3, "#FFF8E1");
        addIsoPx(4.0, 5.5, 9.2, -1, -1, 3, 3, "#FFE082");
        addIsoPx(5.4, 4.0, 6.5, -1, -2, 2, 3, "#FFB74D");
        addIsoPx(4.0, 5.4, 6.5, -1, -2, 2, 3, "#FFB74D");
        addIsoPx(5.6, 4.0, 2.2, -1, -2, 2, 3, "#FFE082");
        return;
      }

      // 4. Sacred, Japanese & Civic Heritage Architecture
      if (sid === "stone_chapel") {
        // Jewel-toned stained glass lancets + rose window + belfry lantern
        addIsoPx(5.8, 2.6, 2.8, -1, -2, 2, 4, "#FB7185");
        addIsoPx(5.8, 4.2, 2.8, -1, -2, 2, 4, "#38BDF8");
        addIsoPx(5.8, 5.6, 2.8, -1, -2, 2, 4, "#34D399");
        addIsoPx(3.6, 6.0, 5.4, -1, -1, 3, 3, "#FBBF24");
        addIsoPx(3.6, 6.0, 5.4, 0, 0, 1, 1, "#FB7185");
        addIsoPx(3.2, 3.2, 9.0, -1, -1, 2, 2, "#FFE082");
        return;
      }
      if (sid === "niseko_ramen_bar") {
        // Glowing red chochin paper lanterns with warm amber cores along eaves
        const vs = [2.3, 3.7, 5.1, 6.3];
        for (let k = 0; k < vs.length; k++) {
          addIsoPx(6.1, vs[k], 2.8, -1, -1, 2, 3, "#FF5252");
          addIsoPx(6.1, vs[k], 2.8, 0, 0, 1, 1, "#FFE082");
        }
        addIsoPx(3.2, 6.1, 2.8, -1, -1, 2, 3, "#FF5252");
        addIsoPx(4.8, 6.1, 2.8, -1, -1, 2, 3, "#FF5252");
        addIsoPx(5.6, 4.2, 1.7, -2, -1, 4, 2, "#FFAB40");
        return;
      }
      if (sid === "town_rathaus") {
        addIsoPx(5.9, 2.6, 2.2, -1, -2, 2, 3, "#FFE082");
        addIsoPx(5.9, 4.8, 2.2, -1, -2, 2, 3, "#FFE082");
        addIsoPx(5.9, 2.6, 4.9, -1, -2, 2, 3, "#FFB74D");
        addIsoPx(5.9, 4.8, 4.9, -1, -2, 2, 3, "#FFB74D");
        addIsoPx(3.6, 5.9, 2.2, -1, -2, 2, 3, "#FFE082");
        addIsoPx(4.0, 4.0, 7.6, -1, -1, 3, 3, "#FFF8E1");
        return;
      }

      // 5. Bridges, Bunting Arches & Garland Street Lamps
      if (sid.startsWith("kapellbrucke_bridge")) {
        const isEw = sid.endsWith("_ew");
        for (let k = 1; k <= 5; k++) {
          const t = (k / 6) * 8.0;
          const u = isEw ? 4.0 : t;
          const v = isEw ? t : 4.0;
          addIsoPx(u, v, 2.9, -1, -1, 2, 2, "#FFE082");
          addIsoPx(u, v, 2.9, 0, -1, 1, 1, "#FFFBEB");
        }
        return;
      }
      if (sid.startsWith("festival_bunting_arch")) {
        const isEw = sid.endsWith("_ew");
        for (let k = 1; k <= 6; k++) {
          const frac = k / 7;
          const pos = frac * 8.0;
          const archZ = 3.2 + Math.sin(frac * Math.PI) * 1.7;
          const u = isEw ? 4.0 : pos;
          const v = isEw ? pos : 4.0;
          addIsoPx(u, v, archZ, -1, -1, 2, 2, k % 2 === 0 ? "#FFFBEB" : "#FFD54F");
        }
        return;
      }
      if (sid.startsWith("street_light_garland")) {
        for (let k = 1; k <= 5; k++) {
          const pos = (k / 6) * 8.0;
          const sagZ = 3.6 - Math.sin((k / 6) * Math.PI) * 0.55;
          addIsoPx(4.0, pos, sagZ, 0, 0, 2, 2, "#FFE082");
        }
        addIsoPx(4.0, 1.2, 3.8, -1, -1, 2, 2, "#FFFBEB");
        addIsoPx(4.0, 6.8, 3.8, -1, -1, 2, 2, "#FFFBEB");
        return;
      }
      if (sid === "alpine_lamp" || sid === "alpine_photo_frame") {
        addIsoPx(4.0, 4.0, 3.1, -1, -2, 2, 3, "#FFFBEB");
        addIsoPx(4.0, 4.0, 3.0, -1, 0, 2, 1, "#FFE082");
        return;
      }
      if (
        sid.startsWith("stone_arch_bridge_") ||
        sid.startsWith("suspension_skybridge_") ||
        sid.startsWith("wooden_footbridge_")
      ) {
        addIsoPx(1.8, 2.2, 1.9, -1, -1, 2, 2, "#FFE082");
        addIsoPx(6.2, 2.2, 1.9, -1, -1, 2, 2, "#FFE082");
        addIsoPx(1.8, 5.8, 1.9, -1, -1, 2, 2, "#FFE082");
        addIsoPx(6.2, 5.8, 1.9, -1, -1, 2, 2, "#FFE082");
        return;
      }

      // 6. Holiday Tree, Ice Sculptures & Igloos
      if (sid === "holiday_tree") {
        const treeCols = ["#FDE047", "#FF5252", "#38BDF8", "#4ADE80"];
        for (let k = 0; k < 8; k++) {
          const z = 1.6 + k * 0.78;
          const rad = (1.0 - k / 10) * 1.8;
          const ang = k * 1.65;
          addIsoPx(
            4.0 + Math.cos(ang) * rad,
            4.0 + Math.sin(ang) * rad,
            z,
            -1,
            -1,
            2,
            2,
            treeCols[k & 3]
          );
        }
        addIsoPx(4.0, 4.0, 8.2, -1, -1, 2, 2, "#FFFBEB");
        return;
      }
      if (
        sid === "ice_hotel_suite" ||
        sid === "crystal_ice_sculpture" ||
        sid === "frozen_fountain" ||
        sid === "ice_sculptor_podium"
      ) {
        addIsoPx(4.8, 3.6, 2.0, -1, -2, 2, 3, "#67E8F9");
        addIsoPx(3.6, 4.8, 2.0, -1, -2, 2, 3, "#A5F3FC");
        addIsoPx(4.2, 4.2, 3.4, 0, -1, 2, 2, "#C084FC");
        return;
      }
      if (sid === "stargaze_igloo") {
        addIsoPx(4.2, 4.2, 2.6, -2, -1, 3, 2, "#FDE68A");
        addIsoPx(5.8, 4.6, 1.2, -1, -1, 2, 2, "#FFB74D");
        return;
      }

      // 7. Chalets, Village Boutiques, Stalls & Lift Stations
      if (
        sid === "chalet_bnb" ||
        sid === "aframe_cabin" ||
        sid === "watermill_lodge" ||
        sid === "ski_school_lodge" ||
        sid === "rescue_clinic" ||
        sid === "craft_brewhouse" ||
        sid === "chocolatier_shop" ||
        sid === "cheese_raclette_cellar" ||
        sid === "swiss_watchmaker" ||
        sid === "bookshop_roastery" ||
        sid === "wax_tuning_shop" ||
        sid === "cowbell_souvenirs" ||
        sid === "cocoa_kiosk" ||
        sid === "christmas_market_stall" ||
        sid === "gingerbread_bakery_stall" ||
        sid === "fondue_gondola_pod" ||
        sid === "schirmbar_umbrella" ||
        sid === "alphorn_band_stage" ||
        sid === "ice_bar_counter" ||
        sid === "curling_stone_hut" ||
        sid === "fireworks_mortar" ||
        sid.includes("_base") ||
        sid.includes("_top") ||
        sid.startsWith("mid_transfer_station")
      ) {
        const isIce = sid === "ice_bar_counter";
        const winA = isIce ? "#67E8F9" : "#FFE082";
        const winB = isIce ? "#A5F3FC" : "#FFB74D";
        addIsoPx(5.8, 3.1, 2.0, -1, -2, 2, 3, winA);
        addIsoPx(5.8, 5.1, 2.0, -1, -2, 2, 3, winB);
        addIsoPx(3.4, 5.8, 2.0, -1, -2, 2, 3, winA);
        if (
          sid === "chalet_bnb" ||
          sid === "aframe_cabin" ||
          sid === "watermill_lodge" ||
          sid === "ski_school_lodge" ||
          sid === "craft_brewhouse"
        ) {
          addIsoPx(5.2, 4.1, 4.6, -1, -1, 2, 2, "#FFF3C4");
        }
        if (sid === "rescue_clinic") {
          addIsoPx(5.6, 4.1, 4.7, -1, -1, 2, 2, "#FF5252");
        }
      }
    }

    _ensureStaticNightLights() {
      const world = this.world;
      if (!world) return EMPTY_ARR;
      if (this._nightLightsWorld === world && this._nightLightsVersion === world.version) {
        return this._staticNightLights;
      }

      const out = [];
      const stampsOut = [];
      const animOut = [];
      const conesOut = [];
      const iceOut = [];
      const seenHaloCells = new Set();

      const pushStatic = (L) => {
        const lu = L.u !== undefined ? L.u : 4.0;
        const lv = L.v !== undefined ? L.v : 4.0;
        const wx = L.wx !== undefined ? L.wx : (L.c - L.r) * HALF_W + (lv - lu) * 8.0;
        const wy =
          L.wy !== undefined
            ? L.wy
            : (L.r + L.c) * HALF_H + (lu + lv) * 4.0 - (L.z || 0) * 4.0;
        out.push({
          r: L.r,
          c: L.c,
          u: lu,
          v: lv,
          z: L.z || 0,
          wx,
          wy,
          radius: L.radius || 2.5,
          color: L.color || "#ffbe6b",
          intensity: L.intensity || 0.85,
          shape: L.shape || "iso",
          cutout: L.cutout !== false,
          cutoutAlpha: L.cutoutAlpha !== undefined ? L.cutoutAlpha : 1.0,
          _cacheable: true,
          _glowSprite: null,
        });
      };

      const registerDownslopeFloodlight = (r, c, baseZ, isNeon, customDesc) => {
        const n = world.size;
        let downDr = customDesc && typeof customDesc.downDr === "number" ? customDesc.downDr : null;
        let downDc = customDesc && typeof customDesc.downDc === "number" ? customDesc.downDc : null;
        if (downDr === null || downDc === null) {
          const g = this._computeDownslopeVec(world, r, c);
          downDr = g.dr;
          downDc = g.dc;
        }

        // Mast lamp head position (`z = baseZ + 3.15`) — crisp 2x2px lamp star ONLY (ZERO 1:1 pole-top circle!)
        const mastWx =
          customDesc && typeof customDesc.mastWx === "number"
            ? customDesc.mastWx
            : (c - r) * HALF_W + (4.4 - 4.4) * 8.0;
        const mastWy =
          customDesc && typeof customDesc.mastWy === "number"
            ? customDesc.mastWy
            : (r + c) * HALF_H + 35.2 - (baseZ + 3.15) * 4.0;

        // Project broad `2:1` snow pool `1.25` tiles downslope onto the piste surface!
        const poolR = clamp(r + downDr * 1.25, 0, n - 1);
        const poolC = clamp(c + downDc * 1.25, 0, n - 1);
        const poolZ =
          typeof world.getSurfaceZ === "function"
            ? world.getSurfaceZ(Math.round(poolR), Math.round(poolC), 4.0, 4.0, true)
            : baseZ;
        const poolWx =
          customDesc && typeof customDesc.poolWx === "number"
            ? customDesc.poolWx
            : (poolC - poolR) * HALF_W;
        const poolWy =
          customDesc && typeof customDesc.poolWy === "number"
            ? customDesc.poolWy
            : (poolR + poolC) * HALF_H + 32.0 - poolZ * 4.0;

        // Near-pole `0.45` downslope bridge pool so neighboring floodlights fuse into silky piste ribbons
        const midR = clamp(r + downDr * 0.45, 0, n - 1);
        const midC = clamp(c + downDc * 0.45, 0, n - 1);
        const midZ =
          typeof world.getSurfaceZ === "function"
            ? world.getSurfaceZ(Math.round(midR), Math.round(midC), 4.0, 4.0, true)
            : baseZ;
        const midWx = (midC - midR) * HALF_W;
        const midWy = (midR + midC) * HALF_H + 32.0 - midZ * 4.0;

        if (isNeon) {
          const isMagenta = ((r + c) & 1) === 1;
          const priCol = isMagenta ? "#f43f5e" : "#22d3ee";
          const secCol = isMagenta ? "#e879f9" : "#38bdf8";
          pushStatic({
            r,
            c,
            wx: poolWx,
            wy: poolWy,
            radius: 4.3,
            color: priCol,
            intensity: 1.14,
            shape: "iso",
          });
          pushStatic({
            r,
            c,
            wx: midWx,
            wy: midWy,
            radius: 2.8,
            color: secCol,
            intensity: 0.88,
            shape: "iso",
            cutoutAlpha: 0.72,
          });
          conesOut.push({
            mastWx,
            mastWy,
            poolWx,
            poolWy,
            color: priCol,
            spread: 42,
            alpha: 0.78,
          });
          stampsOut.push({
            wx: Math.round(mastWx) - 1,
            wy: Math.round(mastWy) - 1,
            pw: 2,
            ph: 2,
            color: isMagenta ? "#FDA4AF" : "#A5F3FC",
          });
        } else {
          pushStatic({
            r,
            c,
            wx: poolWx,
            wy: poolWy,
            radius: 4.9,
            color: "#dff3ff",
            intensity: 1.12,
            shape: "iso",
          });
          pushStatic({
            r,
            c,
            wx: midWx,
            wy: midWy,
            radius: 3.1,
            color: "#fff5d6",
            intensity: 0.78,
            shape: "iso",
            cutoutAlpha: 0.75,
          });
          conesOut.push({
            mastWx,
            mastWy,
            poolWx,
            poolWy,
            color: "#e0f2fe",
            spread: 46,
            alpha: 0.82,
          });
          stampsOut.push({
            wx: Math.round(mastWx) - 1,
            wy: Math.round(mastWy) - 1,
            pw: 2,
            ph: 2,
            color: "#FFFBEB",
          });
        }
      };

      // 1. Honor `world.getNightLightDescriptors()` when available (or `world.getLightSources()`)
      if (typeof world.getNightLightDescriptors === "function") {
        const descs = world.getNightLightDescriptors() || [];
        for (let i = 0; i < descs.length; i++) {
          const d = descs[i];
          if (!d || typeof d.r !== "number" || typeof d.c !== "number") continue;
          const ir = typeof d.parentR === "number" ? d.parentR : Math.floor(d.r);
          const ic = typeof d.parentC === "number" ? d.parentC : Math.floor(d.c);
          const cell =
            world.inBounds(ir, ic) && world.cells[ir] ? world.cells[ir][ic] : null;
          const baseZ =
            typeof d.baseZ === "number"
              ? d.baseZ
              : cell
              ? (cell.minLevel || 0) * ELEV_STEP_Z
              : d.z || 0;
          const dId = String(d.baseId || d.id || "").replace(/_f[0-3]$/, "");
          const eKind = String(d.emissiveKind || d.kind || d.type || "");
          const isDirFlood =
            d.directional === true ||
            dId === "slope_floodlight" ||
            dId === "neon_park_light" ||
            eKind === "floodlight_cone" ||
            eKind === "neon_park_cone";
          if (isDirFlood) {
            const isNeon =
              dId === "neon_park_light" || eKind === "neon_park_cone" || eKind === "neon";
            registerDownslopeFloodlight(ir, ic, baseZ, isNeon, d);
            seenHaloCells.add(ir * 64 + ic);
          } else {
            pushStatic({
              r: d.r,
              c: d.c,
              u: d.u !== undefined ? d.u : 4.8,
              v: d.v !== undefined ? d.v : 4.8,
              z: baseZ + 0.15,
              wx: d.poolWx !== undefined ? d.poolWx : d.wx,
              wy: d.poolWy !== undefined ? d.poolWy : d.wy,
              radius: d.radius || 2.9,
              color: d.color || "#ffbe6b",
              intensity: d.intensity || 0.9,
              shape: "iso",
            });
            if (d.footprint === 2) {
              seenHaloCells.add(ir * 64 + ic);
              seenHaloCells.add(ir * 64 + (ic + 1));
              seenHaloCells.add((ir + 1) * 64 + ic);
              seenHaloCells.add((ir + 1) * 64 + (ic + 1));
            } else {
              seenHaloCells.add(ir * 64 + ic);
            }
          }
        }
      } else if (typeof world.getLightSources === "function") {
        const rawStatic = world.getLightSources() || [];
        for (let i = 0; i < rawStatic.length; i++) {
          const L = rawStatic[i];
          if (!L || typeof L.r !== "number" || typeof L.c !== "number") continue;
          const ir = Math.floor(L.r);
          const ic = Math.floor(L.c);
          const cell =
            world.inBounds(ir, ic) && world.cells[ir] ? world.cells[ir][ic] : null;
          const fl = cell && cell.flora ? cell.flora.replace(/_f[0-3]$/, "") : "";
          const baseZ = cell ? (cell.minLevel || 0) * ELEV_STEP_Z : L.z || 0;
          if (fl === "slope_floodlight" || fl === "neon_park_light") {
            registerDownslopeFloodlight(ir, ic, baseZ, fl === "neon_park_light", L);
          } else {
            // Project onto ground doorstep (`z = baseZ + 0.15`) as `2:1` snow ellipse instead of roof circle!
            pushStatic({
              r: L.r,
              c: L.c,
              u: 4.8,
              v: 4.8,
              z: baseZ + 0.15,
              radius: L.radius || 2.8,
              color: L.color || "#ffbe6b",
              intensity: L.intensity || 0.88,
              shape: "iso",
            });
          }
          seenHaloCells.add(ir * 64 + ic);
        }
      }

      // 2. Full Resort Cell Scan: Emissive Windows, Floodlights, Ice Shimmer & Summit Moonlight Sheen
      if (world.cells) {
        const n = world.size;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const cell = world.cells[r][c];
            const baseZ = (cell.minLevel || 0) * ELEV_STEP_Z;
            const cellTag = r * 64 + c;

            // 2a. Frozen Lagoon / Ice Rink golden shimmer sites
            if (
              cell.water === "frozen_lake" ||
              cell.surface === "ice_rink_pad" ||
              (cell.surface === "crystal_ice_promenade" && ((r + c) & 1) === 0)
            ) {
              iceOut.push({
                wx: (c - r) * HALF_W,
                wy: (r + c) * HALF_H + 32 - baseZ * 4.0,
                seed: r * 17 + c * 31,
                warm: cell.surface !== "crystal_ice_promenade",
              });
            }

            // 2b. Subtle cool cerulean moonlight rim sheen on `Lv 3–4` granite peaks & waterfalls
            if (
              cell.water === "meltwater_brook" &&
              !cell.isFlat &&
              (cell.slopeMask === "1100" || cell.slopeMask === "1001")
            ) {
              pushStatic({
                r,
                c,
                u: 4.5,
                v: 4.5,
                z: baseZ + 1.2,
                radius: 2.3,
                color: "#7dd3fc",
                intensity: 0.56,
                shape: "iso",
                cutout: false,
              });
            } else if (
              (cell.maxLevel || 0) >= 3 &&
              !cell.structure &&
              ((r * 3 + c * 5) & 3) === 0 &&
              (!cell.isFlat || cell.surface === "exposed_rock" || cell.surface === "glacier_ice")
            ) {
              pushStatic({
                r,
                c,
                u: 3.5,
                v: 3.5,
                z: (cell.maxLevel || 3) * ELEV_STEP_Z,
                radius: 2.6,
                color: "#60b6ff",
                intensity: 0.36,
                shape: "iso",
                cutout: false,
              });
            }

            // 2c. Flora Floodlights, Neon Park Lights & Timing Arches
            if (cell.flora) {
              const fl = cell.flora.replace(/_f[0-3]$/, "");
              if (fl === "slope_floodlight" || fl === "neon_park_light") {
                if (!seenHaloCells.has(cellTag)) {
                  registerDownslopeFloodlight(r, c, baseZ, fl === "neon_park_light", null);
                  seenHaloCells.add(cellTag);
                }
              } else if (
                (fl === "glacier_ice_cave" || fl.startsWith("finish_timing_arch")) &&
                !seenHaloCells.has(cellTag)
              ) {
                pushStatic({
                  r,
                  c,
                  u: 4.6,
                  v: 4.6,
                  z: baseZ + 0.2,
                  radius: 2.8,
                  color: fl === "glacier_ice_cave" ? "#38bdf8" : "#fef08a",
                  intensity: 0.88,
                  shape: "iso",
                });
                seenHaloCells.add(cellTag);
              }
            }

            // 2d. Structures: Always stamp `1:1` crisp pixel-art emissive panes + ground snow pool
            const s = cell.structure;
            if (s && s.id) {
              const sid = s.id.replace(/_f[0-3]$/, "");
              this._appendStructureEmissives(r, c, cell, sid, stampsOut, animOut);

              if (!seenHaloCells.has(cellTag)) {
                let spec = null;
                if (sid.startsWith("festival_ferris_wheel_2x2_")) {
                  spec = { radius: 4.2, color: "#ffd166", intensity: 1.04 };
                } else if (sid.startsWith("sphinx_observatory_2x2_")) {
                  spec = { radius: 3.8, color: "#bae6fd", intensity: 0.96 };
                } else if (
                  sid === "winter_carousel" ||
                  sid === "gluhwein_pyramid" ||
                  sid === "raclette_hearth_stall" ||
                  sid === "glockenspiel_tower" ||
                  sid.startsWith("kapellbrucke_bridge") ||
                  sid.startsWith("festival_bunting_arch")
                ) {
                  spec = { radius: 3.5, color: "#ffc971", intensity: 1.0 };
                } else if (sid === "ice_palace_arch" || sid === "ice_bar_counter") {
                  spec = { radius: 3.5, color: "#38bdf8", intensity: 1.04 };
                } else if (sid === "gondola_dj_booth") {
                  spec = {
                    radius: 3.6,
                    color: ((r + c) & 1) === 0 ? "#22d3ee" : "#f43f5e",
                    intensity: 1.06,
                  };
                } else if (sid === "snow_cinema_screen") {
                  spec = { radius: 3.8, color: "#93c5fd", intensity: 0.98 };
                } else if (sid === "ice_hotel_suite") {
                  spec = { radius: 3.4, color: "#38bdf8", intensity: 1.02 };
                } else if (sid === "stargaze_igloo") {
                  spec = { radius: 3.0, color: "#fde68a", intensity: 0.94 };
                } else if (sid.startsWith("street_light_garland")) {
                  spec = { radius: 3.3, color: "#ffd166", intensity: 0.96 };
                } else if (sid === "schirmbar_umbrella" || sid === "marshmallow_brazier") {
                  spec = { radius: 3.5, color: "#ff9e5e", intensity: 1.04 };
                } else if (
                  sid === "christmas_market_stall" ||
                  sid === "gingerbread_bakery_stall" ||
                  sid === "fondue_gondola_pod"
                ) {
                  spec = { radius: 3.2, color: "#ffc971", intensity: 0.96 };
                } else if (sid === "holiday_tree") {
                  spec = { radius: 3.5, color: "#fde047", intensity: 1.02 };
                } else if (sid.startsWith("thermal_spa_2x2_")) {
                  const isPool = sid.endsWith("_se") || sid.endsWith("_sw");
                  spec = {
                    radius: 3.6,
                    color: isPool ? "#5eead4" : "#ffca7a",
                    intensity: 0.96,
                  };
                } else if (
                  sid.startsWith("base_lodge_2x2_") ||
                  sid.startsWith("grand_hotel_2x2_")
                ) {
                  spec = { radius: 3.8, color: "#ffcc70", intensity: 0.98 };
                } else if (
                  sid === "crystal_ice_sculpture" ||
                  sid === "frozen_fountain" ||
                  sid === "ice_sculptor_podium"
                ) {
                  spec = { radius: 2.4, color: "#7dd3fc", intensity: 0.84 };
                } else if (sid === "summit_helipad") {
                  spec = { radius: 2.8, color: "#34d399", intensity: 0.86 };
                } else if (
                  sid === "alpine_lamp" ||
                  sid === "alpine_photo_frame" ||
                  sid === "firepit_lounge" ||
                  sid === "campfire_ring" ||
                  sid === "heated_patio_tables" ||
                  sid === "cedar_hottub" ||
                  sid === "barrel_sauna" ||
                  sid === "alphorn_band_stage" ||
                  sid === "chestnut_cart" ||
                  sid === "cocoa_kiosk" ||
                  sid === "curling_stone_hut" ||
                  sid.startsWith("stone_arch_bridge_") ||
                  sid.startsWith("suspension_skybridge_") ||
                  sid === "niseko_ramen_bar" ||
                  sid === "chalet_bnb" ||
                  sid === "aframe_cabin" ||
                  sid === "watermill_lodge" ||
                  sid === "stone_chapel" ||
                  sid === "town_rathaus" ||
                  sid === "eagles_nest_skywalk" ||
                  sid === "craft_brewhouse" ||
                  sid === "chocolatier_shop" ||
                  sid === "cheese_raclette_cellar" ||
                  sid === "swiss_watchmaker" ||
                  sid === "bookshop_roastery" ||
                  sid === "ski_school_lodge" ||
                  sid === "wax_tuning_shop" ||
                  sid === "cowbell_souvenirs" ||
                  sid === "rescue_clinic" ||
                  sid.includes("_base") ||
                  sid.includes("_top") ||
                  sid.startsWith("mid_transfer_station")
                ) {
                  spec = {
                    radius: 2.9,
                    color: sid === "niseko_ramen_bar" ? "#fb923c" : "#ffbe6b",
                    intensity: 0.9,
                  };
                }

                if (spec) {
                  pushStatic({
                    r,
                    c,
                    u: 4.9,
                    v: 4.9,
                    z: baseZ + 0.15,
                    radius: spec.radius,
                    color: spec.color,
                    intensity: spec.intensity,
                    shape: "iso",
                  });
                  seenHaloCells.add(cellTag);
                }
              }
            }
          }
        }
      }

      // Group static emissive stamps by color once so view-cache rebuilds minimize `fillStyle` switches
      stampsOut.sort((a, b) => (a.color < b.color ? -1 : a.color > b.color ? 1 : 0));

      this._staticNightLights = out;
      this._staticEmissiveStamps = stampsOut;
      this._animEmissiveSites = animOut;
      this._floodlightCones = conesOut;
      this._iceShimmerCells = iceOut;
      this._nightLightsWorld = world;
      this._nightLightsVersion = world.version;
      this._nightViewCacheKey = "";
      return out;
    }

    _collectAllNightLights() {
      const staticLights = this._ensureStaticNightLights();
      const dynamicLights = this._dynamicLightsScratch;
      dynamicLights.length = 0;
      const heliSpotlights = this._heliSpotlightsScratch;
      heliSpotlights.length = 0;
      const vehicleHeadlights = this._vehicleHeadlightsScratch;
      vehicleHeadlights.length = 0;
      const litCabins = this._litCabinsScratch;
      litCabins.length = 0;
      const torchFlares = this._torchFlaresScratch;
      torchFlares.length = 0;
      const balloonBurners = this._balloonBurnersScratch;
      balloonBurners.length = 0;

      if (!this.sim) {
        return {
          staticLights,
          dynamicLights,
          heliSpotlights,
          vehicleHeadlights,
          litCabins,
          torchFlares,
          balloonBurners,
        };
      }

      // Zero-GC reusable pools for dynamic Night Mode 2.0 descriptors
      const dynPool = this._dynLightPool || (this._dynLightPool = []);
      const heliPool = this._heliPool || (this._heliPool = []);
      const hlPool = this._hlPool || (this._hlPool = []);
      const cabPool = this._cabPool || (this._cabPool = []);
      const torchPool = this._torchPool || (this._torchPool = []);
      const burnPool = this._burnPool || (this._burnPool = []);
      let dynUsed = 0;
      let heliUsed = 0;
      let hlUsed = 0;
      let cabUsed = 0;
      let torchUsed = 0;
      let burnUsed = 0;

      const pushDynLight = (wx, wy, radius, color, intensity, shape = "iso", cutout = true) => {
        let item = dynPool[dynUsed];
        if (!item) {
          item = { wx: 0, wy: 0, radius: 2.5, color: "#ffbe6b", intensity: 0.85, shape: "iso", cutout: true };
          dynPool[dynUsed] = item;
        }
        dynUsed++;
        item.wx = wx;
        item.wy = wy;
        item.radius = radius;
        item.color = color;
        item.intensity = intensity;
        item.shape = shape;
        item.cutout = cutout;
        dynamicLights.push(item);
      };

      if (typeof this.sim.getDynamicLightSources === "function") {
        const rawDyn = this.sim.getDynamicLightSources();
        if (Array.isArray(rawDyn)) {
          for (let i = 0; i < rawDyn.length; i++) {
            const d = rawDyn[i];
            if (!d) continue;
            // Skip airborne searchlight / firework / torchlight entries handled with ground-projected cones & flares below
            if (
              d.type === "vip_helicopter" ||
              d.type === "firework_burst" ||
              d.type === "torchlight_skier"
            ) {
              continue;
            }
            const lu = d.u !== undefined ? d.u : 4.0;
            const lv = d.v !== undefined ? d.v : 4.0;
            const wx = d.wx !== undefined ? d.wx : ((d.c || 0) - (d.r || 0)) * HALF_W + (lv - lu) * 8.0;
            const wy =
              d.wy !== undefined
                ? d.wy
                : ((d.r || 0) + (d.c || 0)) * HALF_H + (lu + lv) * 4.0 - (d.z || 0) * 4.0;
            pushDynLight(
              wx,
              wy,
              d.radius || 2.5,
              d.color || "#ffd166",
              d.intensity || 0.85,
              d.shape || "iso",
              d.cutout !== false
            );
          }
        }
      }

      const inspectEntity = (ent) => {
        if (!ent) return;
        const seenRef = ent.entityRef || ent;
        if (seenRef._nightSeen === this._frameStamp) return;
        seenRef._nightSeen = this._frameStamp;
        const et = ent.spriteType || ent.type || ent.species || ent.entityType || "";
        const r = ent.r;
        const c = ent.c;
        if (typeof r !== "number" || typeof c !== "number") return;

        const u = ent.u !== undefined ? ent.u : 4.0;
        const v = ent.v !== undefined ? ent.v : 4.0;
        const gz =
          ent.z !== undefined && Number.isFinite(ent.z)
            ? ent.z
            : this.world && typeof this.world.getSurfaceZ === "function"
            ? this.world.getSurfaceZ(r, c, u, v, true)
            : 0;
        const ez = ent.extraZ !== undefined && Number.isFinite(ent.extraZ) ? ent.extraZ : 0;
        const wx =
          typeof ent.worldX === "number" ? ent.worldX : (c - r) * HALF_W + (v - u) * 8.0;
        const wy =
          typeof ent.worldY === "number"
            ? ent.worldY
            : (r + c) * HALF_H + (u + v) * 4.0 - (gz + ez) * 4.0;

        // 1. VIP Helicopter Searchlight
        if (et === "vip_helicopter") {
          const sweepU = clamp(u + Math.sin(this.time * 2.1) * 2.2, 0, 8);
          const sweepV = clamp(v + Math.cos(this.time * 1.7) * 2.2, 0, 8);
          const spotWx = (c - r) * HALF_W + (sweepV - sweepU) * 8.0;
          const spotWy = (r + c) * HALF_H + (sweepU + sweepV) * 4.0 - gz * 4.0;
          let hs = heliPool[heliUsed];
          if (!hs) {
            hs = { heliWx: 0, heliWy: 0, spotWx: 0, spotWy: 0 };
            heliPool[heliUsed] = hs;
          }
          heliUsed++;
          hs.heliWx = wx;
          hs.heliWy = wy;
          hs.spotWx = spotWx;
          hs.spotWy = spotWy;
          heliSpotlights.push(hs);
          pushDynLight(spotWx, spotWy, 4.1, "#e0f2fe", 1.14, "iso", true);
          return;
        }

        // 2. Sweeping Twin Vehicle Headlights (`piste_groomer`/`snowcat`, `winch_cat`, `snowmobile`, `ski_shuttle_bus`, `alpine_train`)
        const isHeadlightVehicle =
          Boolean(ent.headlightDir) ||
          et === "piste_groomer" ||
          et === "snowcat" ||
          et === "winch_cat_yellow" ||
          et === "winch_cat" ||
          et === "snowmobile" ||
          et === "ski_shuttle_bus" ||
          et === "shuttle_bus" ||
          et === "alpine_train" ||
          et === "alpine_train_loco";
        if (isHeadlightVehicle) {
          const dirTag = String(
            (typeof ent.headlightDir === "string" ? ent.headlightDir : "") ||
              ent.dir ||
              ent.heading ||
              "se"
          ).toLowerCase();
          const hVec = ISO_HEADING_VEC[dirTag] || ISO_HEADING_VEC.se;
          const isTrainOrBus =
            et === "alpine_train" ||
            et === "alpine_train_loco" ||
            et === "ski_shuttle_bus" ||
            et === "shuttle_bus";
          const beamLen = isTrainOrBus ? 116 : et === "snowmobile" ? 78 : 98;
          const beamW = isTrainOrBus ? 62 : 52;
          const perpX = -hVec.dy;
          const perpY = hVec.dx;
          const noseWx = wx + hVec.dx * 10;
          const noseWy = wy - 5 + hVec.dy * 10;

          let hl = hlPool[hlUsed];
          if (!hl) {
            hl = {
              wx: 0,
              wy: 0,
              angle: 0,
              beamLen: 96,
              beamW: 52,
              lamp1Wx: 0,
              lamp1Wy: 0,
              lamp2Wx: 0,
              lamp2Wy: 0,
            };
            hlPool[hlUsed] = hl;
          }
          hlUsed++;
          hl.wx = noseWx;
          hl.wy = noseWy;
          hl.angle = typeof ent.headlightDir === "number" ? ent.headlightDir : hVec.ang;
          hl.beamLen = beamLen;
          hl.beamW = beamW;
          hl.lamp1Wx = Math.round(noseWx + perpX * 3.5);
          hl.lamp1Wy = Math.round(noseWy + perpY * 2.0);
          hl.lamp2Wx = Math.round(noseWx - perpX * 3.5);
          hl.lamp2Wy = Math.round(noseWy - perpY * 2.0);
          vehicleHeadlights.push(hl);

          // Forward ground snow cutout & pool `~1.0` tile ahead of the vehicle nose
          pushDynLight(
            noseWx + hVec.dx * 48,
            noseWy + hVec.dy * 48,
            isTrainOrBus ? 3.5 : 3.0,
            "#fef9c3",
            0.96,
            "iso",
            true
          );
        }

        // 3. Lit Passenger Cabins (`alpine_train`, `funicular_car`, `ski_shuttle_bus`, or `ent.hasLitCabin`)
        if (
          ent.hasLitCabin ||
          et === "alpine_train" ||
          et === "alpine_train_coach" ||
          et === "funicular_car" ||
          et === "ski_shuttle_bus" ||
          et === "shuttle_bus"
        ) {
          let cb = cabPool[cabUsed];
          if (!cb) {
            cb = { wx: 0, wy: 0, panoramic: false, warmBubble: false };
            cabPool[cabUsed] = cb;
          }
          cabUsed++;
          cb.wx = Math.round(wx);
          cb.wy = Math.round(wy - 9);
          cb.panoramic = true;
          cb.warmBubble = false;
          litCabins.push(cb);
          pushDynLight(wx, wy - 4, 2.7, "#ffd166", 0.86, "iso", true);
        }

        // 4. Torchlight Parade Skier (`torchlight_skier` or `ent.torchGlow`)
        if (ent.torchGlow || et === "torchlight_skier") {
          let tf = torchPool[torchUsed];
          if (!tf) {
            tf = { wx: 0, wy: 0 };
            torchPool[torchUsed] = tf;
          }
          torchUsed++;
          tf.wx = Math.round(wx + 5);
          tf.wy = Math.round(wy - 15);
          torchFlares.push(tf);
          pushDynLight(wx + 3, wy - 2, 2.8, "#ff7b29", 1.06, "iso", true);
        }

        // 5. Hot-Air Balloon Burner Glow (`hot_air_balloon` or `ent.burnerGlow`)
        if (et === "hot_air_balloon" || ent.burnerGlow) {
          const glowAmt =
            typeof ent.burnerGlow === "number"
              ? ent.burnerGlow
              : ent.burnerGlow
              ? 1.0
              : Math.sin(this.time * 2.2 + (r + c) * 0.9) > 0.25
              ? 0.85
              : 0;
          if (glowAmt > 0.05) {
            let bb = burnPool[burnUsed];
            if (!bb) {
              bb = { wx: 0, wy: 0 };
              burnPool[burnUsed] = bb;
            }
            burnUsed++;
            bb.wx = Math.round(wx);
            bb.wy = Math.round(wy - 14);
            balloonBurners.push(bb);
            pushDynLight(wx, wy - 20, 3.2, "#ffab40", 0.96 * glowAmt, "round", true);
          }
        }
      };

      const scanArray = (arr) => {
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < arr.length; i++) inspectEntity(arr[i]);
      };

      let scannedDirect = false;
      // Scan `this.sim.entities` first so render-item wrappers (`ri.headlightDir`, `ri.hasLitCabin`) win cleanly
      if (Array.isArray(this.sim.entities) && this.sim.entities.length > 0) {
        scanArray(this.sim.entities);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.crew)) {
        scanArray(this.sim.crew);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.surfaceMovers)) {
        scanArray(this.sim.surfaceMovers);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.skySpectacles)) {
        scanArray(this.sim.skySpectacles);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.skyEntities)) {
        scanArray(this.sim.skyEntities);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.torchlightParade) && (!this.sim._isTorchlightParadeActive || this.sim._isTorchlightParadeActive())) {
        scanArray(this.sim.torchlightParade);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.trainConsist)) {
        scanArray(this.sim.trainConsist);
        scannedDirect = true;
      }
      if (this.sim.train && this.sim.train.state !== "cooldown") {
        inspectEntity(this.sim.train);
        scannedDirect = true;
      }
      if (Array.isArray(this.sim.guests)) {
        scanArray(this.sim.guests);
        scannedDirect = true;
      }
      if (!scannedDirect && typeof this.sim.getEntitiesInCell === "function" && this.world) {
        const n = this.world.size;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const ents = this.sim.getEntitiesInCell(r, c);
            if (ents && ents.length > 0) {
              for (let ei = 0; ei < ents.length; ei++) inspectEntity(ents[ei]);
            }
          }
        }
      }
      if (typeof this.sim.getHighAirborneEntities === "function") {
        scanArray(this.sim.getHighAirborneEntities());
      }

      // 6. Aerial Lift Carriers: Crisp `2x2px` `#FFE082` Lit Cabin Windows + Soft Warm Halos
      if (typeof this.sim.getAerialCarriers === "function") {
        const hasDynFn = typeof this.sim.getDynamicLightSources === "function";
        const carriers = this.sim.getAerialCarriers() || EMPTY_ARR;
        for (let i = 0; i < carriers.length; i++) {
          const ac = carriers[i];
          if (!ac) continue;
          const et = ac.entityType || "";
          const isLitCarrier =
            Boolean(ac.hasLitCabin) ||
            et === "gondola_cabin" ||
            et === "egg_gondola_cabin" ||
            et === "tram_cabin_3s" ||
            et === "bubble_chair_orange";
          if (!isLitCarrier) continue;
          const cx = ac.cableWorldX !== undefined ? ac.cableWorldX : ac.cableScreenX;
          const cy = ac.cableWorldY !== undefined ? ac.cableWorldY : ac.cableScreenY;
          if (typeof cx !== "number" || typeof cy !== "number") continue;

          let cb = cabPool[cabUsed];
          if (!cb) {
            cb = { wx: 0, wy: 0, panoramic: false, warmBubble: false };
            cabPool[cabUsed] = cb;
          }
          cabUsed++;
          cb.wx = Math.round(cx);
          cb.wy = Math.round(cy + 22);
          cb.panoramic = et === "tram_cabin_3s";
          cb.warmBubble = et === "bubble_chair_orange";
          litCabins.push(cb);

          if (!hasDynFn || et === "bubble_chair_orange") {
            pushDynLight(
              cx,
              cy + 22,
              et === "tram_cabin_3s" ? 3.0 : 2.1,
              et === "bubble_chair_orange" ? "#fb923c" : "#ffd166",
              et === "tram_cabin_3s" ? 0.94 : 0.78,
              "round",
              true
            );
          }
        }
      }

      return {
        staticLights,
        dynamicLights,
        heliSpotlights,
        vehicleHeadlights,
        litCabins,
        torchFlares,
        balloonBurners,
      };
    }

    // =========================================================================
    // Tactile Selection, Ghost Preview, Lift Corridor & Floating `+$` Popups
    // =========================================================================

    _drawCellDiamond(ctx, r, c, strokeStyle, fillStyle, lineWidth = 2) {
      if (!this.world || !this.world.inBounds(r, c)) return;
      const pN = this.cellToScreen(r, c, 0, 0, 0);
      const pE = this.cellToScreen(r, c, 0, 8, 0);
      const pS = this.cellToScreen(r, c, 8, 8, 0);
      const pW = this.cellToScreen(r, c, 8, 0, 0);

      ctx.beginPath();
      ctx.moveTo(pN.x, pN.y);
      ctx.lineTo(pE.x, pE.y);
      ctx.lineTo(pS.x, pS.y);
      ctx.lineTo(pW.x, pW.y);
      ctx.closePath();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
      }
    }

    _drawInspectedHighlight(ctx) {
      const appUi = typeof window !== "undefined" && window.app && window.app.ui;
      const target = appUi && appUi.inspectedTarget;
      if (!target || appUi.thumbMode) return;

      ctx.save();
      if (target.kind === "entity") {
        const ent = typeof appUi._resolveInspectedEntity === "function"
          ? appUi._resolveInspectedEntity()
          : target.entityRef;
        if (ent && typeof ent.worldX === "number" && typeof ent.worldY === "number") {
          const sp = this.worldToScreen(ent.worldX, ent.worldY);
          const rx = Math.max(10, 14 * this.zoom);
          const ry = Math.max(6, 7 * this.zoom);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y - 2 * this.zoom, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (target.kind === "tile" && typeof target.r === "number") {
        this._drawCellDiamond(
          ctx,
          target.r,
          target.c,
          "rgba(250, 204, 21, 0.9)",
          "rgba(250, 204, 21, 0.12)",
          2
        );
      } else if (target.kind === "lift" && target.liftRef) {
        const cells = target.liftRef.cells || [];
        for (let i = 0; i < cells.length; i++) {
          this._drawCellDiamond(
            ctx,
            cells[i].r,
            cells[i].c,
            "rgba(250, 204, 21, 0.72)",
            "rgba(250, 204, 21, 0.08)",
            1.5
          );
        }
      }
      ctx.restore();
    }

    _drawGhostOverlayScreen(ctx) {
      const gp = this.ghostPreview;
      if (!gp || !this.world) return;

      const isInspect = gp.kind === "inspect" || gp.tool === "inspect";
      const valid = gp.valid !== false;
      const stroke = isInspect
        ? "rgba(255, 255, 255, 0.42)"
        : valid
        ? "#4ade80"
        : "#fb7185";
      const fill = isInspect
        ? "rgba(255, 255, 255, 0.06)"
        : valid
        ? "rgba(74, 222, 128, 0.17)"
        : "rgba(251, 113, 133, 0.22)";

      ctx.save();
      ctx.lineJoin = "round";

      // 1. Live Drag-to-Build Ski Lift Corridor Outline
      const liftPrev = gp.liftPreview || gp.preview;
      if (gp.kind === "lift" && liftPrev && Array.isArray(liftPrev.cells) && liftPrev.cells.length > 0) {
        for (let i = 0; i < liftPrev.cells.length; i++) {
          const lc = liftPrev.cells[i];
          const isEnd =
            (lc.r === liftPrev.baseR && lc.c === liftPrev.baseC) ||
            (lc.r === liftPrev.topR && lc.c === liftPrev.topC);
          this._drawCellDiamond(
            ctx,
            lc.r,
            lc.c,
            stroke,
            isEnd ? fill : valid ? "rgba(74, 222, 128, 0.08)" : "rgba(251, 113, 133, 0.1)",
            isEnd ? 2.4 : 1.4
          );
        }
        ctx.restore();
        return;
      }

      if (typeof gp.r !== "number" || typeof gp.c !== "number" || !this.world.inBounds(gp.r, gp.c)) {
        ctx.restore();
        return;
      }

      // 1b. Explicit multi-cell brush swatch (`gp.cells`)
      if (Array.isArray(gp.cells) && gp.cells.length > 0) {
        for (let i = 0; i < gp.cells.length; i++) {
          const bc = gp.cells[i];
          const isCenter = bc.r === gp.r && bc.c === gp.c;
          this._drawCellDiamond(
            ctx,
            bc.r,
            bc.c,
            stroke,
            isCenter ? fill : valid ? "rgba(74, 222, 128, 0.09)" : "rgba(251, 113, 133, 0.11)",
            isCenter ? 2.2 : 1.4
          );
        }
        ctx.restore();
        return;
      }

      // 1c. Multi-Tile Sculpt Brushes (`5x5` glacial_bowl, `3x3` matterhorn_peak/smooth, `2x2` cliff_balcony/corridor!)
      const sculptTag = String(
        gp.mode || gp.sculptMode || gp.brushMode || gp.subMode || gp.itemId || ""
      ).toLowerCase();
      const is5x5Brush =
        gp.radius === 2 ||
        gp.brushRadius === 2 ||
        gp.brushSize === 5 ||
        gp.footprint === 5 ||
        sculptTag.includes("glacial_bowl") ||
        sculptTag.endsWith("_5x5");
      const isCorridorBrush =
        sculptTag === "corridor" ||
        sculptTag.includes("cliff_balcony") ||
        (gp.kind === "sculpt" &&
          (gp.footprint === 2 || gp.brushSize === 2 || sculptTag.endsWith("_2x2")));
      const is3x3Brush =
        gp.radius === 1 ||
        gp.brushRadius === 1 ||
        gp.brushSize === 3 ||
        gp.footprint === 3 ||
        sculptTag.includes("matterhorn_peak") ||
        sculptTag.endsWith("_3x3") ||
        sculptTag === "smooth";

      if (is5x5Brush) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const br = gp.r + dr;
            const bc = gp.c + dc;
            if (!this.world.inBounds(br, bc)) continue;
            const dist = Math.max(Math.abs(dr), Math.abs(dc));
            const isCenter = dist === 0;
            const isInner = dist === 1;
            this._drawCellDiamond(
              ctx,
              br,
              bc,
              isCenter ? "#38bdf8" : isInner ? "rgba(56, 189, 248, 0.72)" : stroke,
              isCenter
                ? "rgba(56, 189, 248, 0.24)"
                : isInner
                ? "rgba(56, 189, 248, 0.12)"
                : "rgba(74, 222, 128, 0.07)",
              isCenter ? 2.4 : isInner ? 1.6 : 1.15
            );
          }
        }
        ctx.restore();
        return;
      }

      if (is3x3Brush) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const br = gp.r + dr;
            const bc = gp.c + dc;
            if (!this.world.inBounds(br, bc)) continue;
            const isCenter = dr === 0 && dc === 0;
            this._drawCellDiamond(
              ctx,
              br,
              bc,
              isCenter ? "#38bdf8" : stroke,
              isCenter ? "rgba(56, 189, 248, 0.22)" : "rgba(74, 222, 128, 0.09)",
              isCenter ? 2.3 : 1.35
            );
          }
        }
        ctx.restore();
        return;
      }

      if (isCorridorBrush) {
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            const br = gp.r + dr;
            const bc = gp.c + dc;
            if (!this.world.inBounds(br, bc)) continue;
            this._drawCellDiamond(
              ctx,
              br,
              bc,
              "#38bdf8",
              dr === 0 && dc === 0 ? "rgba(56, 189, 248, 0.2)" : "rgba(74, 222, 128, 0.11)",
              1.9
            );
          }
        }
        ctx.restore();
        return;
      }

      // 2. All `5` `2x2` Flagship Landmark Footprint Outlines (`grand_hotel_2x2`, `thermal_spa_2x2`, `base_lodge_2x2`, `festival_ferris_wheel_2x2`, `sphinx_observatory_2x2`)
      const cand2x2 = String(gp.baseId || gp.itemId || gp.id || "").replace(
        /_(nw|ne|sw|se)(_f[0-3])?$/,
        ""
      );
      if (gp.footprint === 2 || gp.isComposite2x2 || COMPOSITE_2X2_IDS.has(cand2x2)) {
        const r = gp.r;
        const c = gp.c;
        const r1 = Math.min(this.world.size - 1, r + 1);
        const c1 = Math.min(this.world.size - 1, c + 1);
        const pN = this.cellToScreen(r, c, 0, 0, 0);
        const pE = this.cellToScreen(r, c1, 0, 8, 0);
        const pS = this.cellToScreen(r1, c1, 8, 8, 0);
        const pW = this.cellToScreen(r1, c, 8, 0, 0);

        ctx.beginPath();
        ctx.moveTo(pN.x, pN.y);
        ctx.lineTo(pE.x, pE.y);
        ctx.lineTo(pS.x, pS.y);
        ctx.lineTo(pW.x, pW.y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = stroke;
        ctx.stroke();

        // Subtle inner quadrant grid lines so the 2x2 pad reads crisply
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            if (this.world.inBounds(r + dr, c + dc)) {
              this._drawCellDiamond(
                ctx,
                r + dr,
                c + dc,
                valid ? "rgba(134, 239, 172, 0.42)" : "rgba(253, 164, 175, 0.45)",
                null,
                1.0
              );
            }
          }
        }
        ctx.restore();
        return;
      }

      // 3. Single-Cell Tactile Diamond Outline
      this._drawCellDiamond(ctx, gp.r, gp.c, stroke, fill, isInspect ? 1.4 : 2.0);
      ctx.restore();
    }

    _drawFloatingPopups(ctx) {
      if (!this.sim || !Array.isArray(this.sim.floatingPopups) || this.sim.floatingPopups.length === 0) {
        return;
      }
      ctx.save();
      ctx.font = "700 12px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < this.sim.floatingPopups.length; i++) {
        const p = this.sim.floatingPopups[i];
        const wp = this.cellToWorld(
          p.r,
          p.c,
          p.u !== undefined ? p.u : 4.0,
          p.v !== undefined ? p.v : 4.0,
          0
        );
        const sp = this.worldToScreen(wp.wx, wp.wy);
        const py = Math.round(sp.y - 26 * this.zoom - (p.liftPx || 0));
        const px = Math.round(sp.x);

        ctx.globalAlpha = clamp(p.alpha !== undefined ? p.alpha : 1.0, 0, 1);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(11, 20, 36, 0.92)";
        ctx.strokeText(p.text, px, py);
        ctx.fillStyle = p.color || "#86efac";
        ctx.fillText(p.text, px, py);
      }
      ctx.restore();
    }

    _drawCameraViewfinder(ctx) {
      const cx = this.cursorScreenX || this.viewW * 0.5;
      const cy = this.cursorScreenY || this.viewH * 0.5;
      const r = 42;

      ctx.save();
      ctx.strokeStyle = "rgba(250, 204, 21, 0.92)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      const br = 54;
      const len = 12;
      const corners = [
        [-br, -br, 1, 1],
        [br, -br, -1, 1],
        [br, br, -1, -1],
        [-br, br, 1, -1],
      ];
      for (let i = 0; i < corners.length; i++) {
        const [ox, oy, sx, sy] = corners[i];
        ctx.beginPath();
        ctx.moveTo(cx + ox, cy + oy + sy * len);
        ctx.lineTo(cx + ox, cy + oy);
        ctx.lineTo(cx + ox + sx * len, cy + oy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // =========================================================================
    // Crisp 1:1 Offscreen Full-Resort PNG Snapshot Export (`exportDioramaPNG()`)
    // =========================================================================

    exportDioramaPNG(download = true) {
      if (!this.world) return null;
      const n = this.world.size;
      const padX = 128;
      const padTop = 308;
      const padBottom = 116;

      const outW = n * TILE_W + padX * 2;
      const outH = n * 64 + padTop + padBottom;
      const originX = Math.round(outW * 0.5);
      const originY = padTop;

      const off = document.createElement("canvas");
      off.width = outW;
      off.height = outH;
      const octx = off.getContext("2d", { alpha: false });
      octx.imageSmoothingEnabled = false;

      // 1. Sky Backdrop
      this._drawBackdrop(octx, outW, outH);

      // 2. Full 1:1 Resort Scene (without editor cursor ghost)
      this._renderMountainScene(octx, originX, originY, false);

      // 3. Atmosphere Pass Temporarily Mapped to Offscreen Snapshot
      const savedViewW = this.viewW;
      const savedViewH = this.viewH;
      const savedZoom = this.zoom;
      const savedPanX = this.panX;
      const savedPanY = this.panY;

      this.viewW = outW;
      this.viewH = outH;
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = outH * 0.5 - originY;
      this._drawAtmosphereLighting(octx, outW, outH);

      this.viewW = savedViewW;
      this.viewH = savedViewH;
      this.zoom = savedZoom;
      this.panX = savedPanX;
      this.panY = savedPanY;

      const dataUrl = off.toDataURL("image/png");
      if (download && typeof document !== "undefined") {
        try {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = "alpine-peak-snapshot.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          console.warn("Snapshot auto-download blocked:", err);
        }
      }
      return dataUrl;
    }
  }

  window.SanctuaryRenderer = SanctuaryRenderer;
})();
