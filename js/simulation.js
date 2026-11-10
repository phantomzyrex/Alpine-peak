/**
 * Alpine Peak v3 — Grand Ski Resort, Winter Festival & 60-Species Living World (`js/simulation.js`)
 * =================================================================================================
 * Implements `window.SanctuarySim` per Master Spec #125 & Wave 2 Contract #137:
 *   - Immediate Bustling Resort Boot (`seedInitialResortLife()`): 180+ active living characters,
 *     athletes, transit vehicles, sky spectacles & alpine wildlife at >= 60 FPS (`step() < 1.2 ms`,
 *     zero per-frame heap allocations in `step()` / `getRenderEntities()` / `_rebuildCellBuckets()`
 *     / `getFireworks()` / `getTorchEmbers()`).
 *   - All 60 Animated Entity Species (`49` v2 `_f0.._f5` + `11` v3 `_f0.._f3`):
 *     `hot_air_balloon`, `alpine_paraglider`, `torchlight_skier` (10-skier synchronized flare snake
 *     + `getTorchEmbers()`), `retro_neon_skier`, `davos_toboggan_pair`, `husky_dogsled`,
 *     `coaster_sled` (Bezier rail lock on `mountain_coaster_*`), `yeti_mascot`,
 *     `festival_parade_trio`, `ice_artisan`, and `slope_photographer`.
 *   - Night Mode 2.0 Mover Metadata (`headlightDir`, `hasLitCabin`, `burnerGlow`, `groundShadowZ`,
 *     `torchGlow`, `cameraFlash`), Pooled 5-Preset Pixel Fireworks (`getFireworks()`), and
 *     14.0s Choreographed `triggerFestiveFinale()` (`isFestiveFinaleActive()`, `launchFireworkAt()`).
 */
(function (global) {
  "use strict";

  const ELEV_STEP_Z = 4.0;
  const HALF_W = 64;
  const HALF_H = 32;

  const GUEST_NAMES = [
    "Lukas M.", "Clara V.", "Matteo R.", "Heidi S.", "Felix K.", "Elena B.",
    "Julian W.", "Sofia G.", "Tobias H.", "Amelie D.", "Nico P.", "Freya L.",
    "Marco T.", "Linnea E.", "Henrik A.", "Zoe C.", "Fabian Z.", "Nora N.",
    "Anton F.", "Mila J.", "Soren O.", "Lea U.", "Emil V.", "Greta K.",
    "Hugo B.", "Klara M.", "Liam R.", "Astrid S.", "Jonas W.", "Carmen P.",
    "Theo L.", "Maya H.", "Oskar D.", "Nina G.", "Victor T.", "Eva C.",
    "Bastian R.", "celine M.", "Kaspar L.", "Anouk V.", "Silvan B.", "Romy K.",
    "Dario G.", "Yuna T.", "Kenji N.", "Sakura H.", "chiara F.", "Lorenzo P.",
  ].map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  // Locked 1:1 to `js/renderer.js` `LIFT_CABLE_SPECS` & `js/world.js` `LIFT_SPECS` (`0.0px` drift!)
  const LIFT_SPECS = {
    magic_carpet: {
      zCable: 1.5, sep: 0, sag: 0.0, spacingTiles: 1.45, speedTiles: 0.85,
      aerial: false, isConveyor: true, upSprite: "ski_school_kid", dnSprite: null,
      label: "Covered Magic Carpet",
    },
    cliff_funicular: {
      zCable: 2.0, sep: 0, sag: 0.0, spacingTiles: 99, speedTiles: 1.35,
      aerial: false, isFunicular: true, upSprite: "funicular_car", dnSprite: "funicular_car",
      label: "Stepped Cliff Cog Funicular",
    },
    rope_tow: {
      zCable: 3.0, sep: 5, sag: 0.6, spacingTiles: 1.85, speedTiles: 0.96,
      aerial: false, isSurfaceTow: true, upSprite: "skier_beginner", dnSprite: null,
      label: "Surface Rope Tow",
    },
    tbar_lift: {
      zCable: 7.5, sep: 7, sag: 0.9, spacingTiles: 2.15, speedTiles: 1.12,
      aerial: false, isSurfaceTow: true, upSprite: "tbar_skier_pair", dnSprite: null,
      label: "Glacier Bowl T-Bar",
    },
    classic_2chair: {
      zCable: 11.0, sep: 10, sag: 1.5, spacingTiles: 2.25, speedTiles: 1.05,
      aerial: true, upSprite: "chairlift_rider", dnSprite: "chairlift_empty",
      label: "Heritage Fixed-Grip 2-Chair",
    },
    chairlift: {
      zCable: 11.0, sep: 10, sag: 1.5, spacingTiles: 2.15, speedTiles: 1.15,
      aerial: true, upSprite: "chairlift_rider", dnSprite: "chairlift_empty",
      label: "Detachable Quad Chairlift",
    },
    bubble_6chair: {
      zCable: 11.0, sep: 10, sag: 1.5, spacingTiles: 2.35, speedTiles: 1.28,
      aerial: true, upSprite: "bubble_chair_orange", dnSprite: "bubble_chair_orange",
      label: "Express 6-Pack Bubble Chair",
    },
    egg_gondola: {
      zCable: 14.0, sep: 12, sag: 1.5, spacingTiles: 2.65, speedTiles: 1.22,
      aerial: true, upSprite: "egg_gondola_cabin", dnSprite: "egg_gondola_cabin",
      label: "Retro Alpine Egg Gondola",
    },
    gondola: {
      zCable: 14.0, sep: 12, sag: 1.5, spacingTiles: 2.75, speedTiles: 1.32,
      aerial: true, upSprite: "gondola_cabin", dnSprite: "gondola_cabin",
      label: "Red Summit Express Gondola",
    },
    tramway_3s: {
      zCable: 16.0, sep: 13, sag: 1.5, spacingTiles: 7.5, speedTiles: 1.42,
      aerial: true, is3S: true, upSprite: "tram_cabin_3s", dnSprite: "tram_cabin_3s",
      label: "Swiss 3S Panoramic Tramway",
    },
  };

  // Revenue, Warmth & Thrill Synergies for All Alpine Peak v2 Buildings & Amenities
  const SHOP_PRICES = {
    ski_rental_shop: { price: 25, label: "+$25 Rental", cat: "rentals", warm: 20, thrill: 6, act: "Fitting Carving Skis" },
    wax_tuning_shop: { price: 22, label: "+$22 Hot Wax", cat: "rentals", warm: 25, thrill: 10, act: "Hot-Waxing & Edge Tuning" },
    lift_ticket_booth: { price: 45, label: "+$45 Lift Pass", cat: "tickets", warm: 10, thrill: 8, act: "Buying All-Mountain Lift Pass" },
    ski_school_lodge: { price: 38, label: "+$38 Ski Lesson", cat: "tickets", warm: 45, thrill: 12, act: "Checking In at Ski School" },
    apres_tavern: { price: 32, label: "+$32 Fondue", cat: "apres", warm: 100, thrill: 14, act: "Sharing Swiss Cheese Fondue" },
    cheese_raclette_cellar: { price: 34, label: "+$34 Raclette", cat: "apres", warm: 100, thrill: 15, act: "Savoring Melted Gruyere Raclette" },
    craft_brewhouse: { price: 26, label: "+$26 Alpine Ale", cat: "apres", warm: 92, thrill: 14, act: "Toasting Copper-Kettle Craft Ale" },
    niseko_ramen_bar: { price: 28, label: "+$28 Miso Ramen", cat: "apres", warm: 100, thrill: 15, act: "Slurping Steaming Niseko Ramen" },
    watermill_lodge: { price: 30, label: "+$30 Mill Roast", cat: "apres", warm: 96, thrill: 14, act: "Dining Beside Turning Waterwheel" },
    waffle_hut: { price: 18, label: "+$18 Waffles", cat: "apres", warm: 90, thrill: 10, act: "Eating Hot Mountain Waffles" },
    summit_restaurant: { price: 38, label: "+$38 Panorama", cat: "apres", warm: 100, thrill: 18, act: "Dining at Summit Glass Panorama" },
    schirmbar_umbrella: { price: 24, label: "+$24 Gluhwein", cat: "apres", warm: 88, thrill: 16, act: "Clinking Mugs at Schirmbar" },
    heated_patio_tables: { price: 26, label: "+$26 Patio Fondue", cat: "apres", warm: 92, thrill: 13, act: "Dining Outdoors Under Heat Lamps" },
    christmas_market_stall: { price: 16, label: "+$16 Gingerbread", cat: "apres", warm: 76, thrill: 12, act: "Browsing Christmas Market Stall" },
    cocoa_kiosk: { price: 12, label: "+$12 Hot Cocoa", cat: "apres", warm: 82, thrill: 8, act: "Sipping Marshmallow Hot Cocoa" },
    chestnut_cart: { price: 14, label: "+$14 Chestnuts", cat: "apres", warm: 78, thrill: 8, act: "Buying Roasted Hot Chestnuts" },
    alpine_bakery: { price: 16, label: "+$16 Strudel", cat: "shops", warm: 75, thrill: 9, act: "Warming Up with Apple Strudel" },
    chocolatier_shop: { price: 24, label: "+$24 Pralines", cat: "shops", warm: 68, thrill: 12, act: "Tasting Swiss Truffle Pralines" },
    gear_boutique: { price: 42, label: "+$42 Parka", cat: "shops", warm: 65, thrill: 11, act: "Shopping Pro Alpine Parkas" },
    swiss_watchmaker: { price: 58, label: "+$58 Chronograph", cat: "shops", warm: 60, thrill: 16, act: "Admiring Swiss Chronographs" },
    cowbell_souvenirs: { price: 20, label: "+$20 Cowbell", cat: "shops", warm: 55, thrill: 10, act: "Shopping Brass Alpine Cowbells" },
    bookshop_roastery: { price: 18, label: "+$18 Espresso", cat: "shops", warm: 85, thrill: 10, act: "Reading by Espresso Roaster" },
    grand_hotel_2x2: { price: 68, label: "+$68 Palace Suite", cat: "hotel", warm: 100, thrill: 18, act: "Checking Into Grand Edelweiss Hotel" },
    thermal_spa_2x2: { price: 56, label: "+$56 Thermal Spa", cat: "apres", warm: 100, thrill: 20, act: "Soaking at Copper-Dome Thermal Spa" },
    base_lodge_2x2: { price: 36, label: "+$36 Base Lodge", cat: "apres", warm: 100, thrill: 15, act: "Warming Up at Clock-Tower Base Lodge" },
    chalet_bnb: { price: 46, label: "+$46 Chalet B&B", cat: "hotel", warm: 100, thrill: 14, act: "Resting at Frescoed Chalet B&B" },
    aframe_cabin: { price: 40, label: "+$40 A-Frame", cat: "hotel", warm: 100, thrill: 14, act: "Cozying Up in Pine A-Frame Cabin" },
    stargaze_igloo: { price: 52, label: "+$52 Glass Igloo", cat: "hotel", warm: 100, thrill: 20, act: "Stargazing in Geodesic Dome Igloo" },
    ice_hotel_suite: { price: 55, label: "+$55 Ice Suite", cat: "hotel", warm: 92, thrill: 22, act: "Marveling Inside Sculpted Ice Hotel" },
    cedar_hottub: { price: 22, label: "+$22 Hot Tub", cat: "apres", warm: 100, thrill: 18, act: "Soaking in Steaming Cedar Hot Tub" },
    barrel_sauna: { price: 24, label: "+$24 Sauna", cat: "apres", warm: 100, thrill: 16, act: "Relaxing in Cedar Steam Sauna" },
    firepit_lounge: { price: 12, label: "+$12 Spiced Cider", cat: "apres", warm: 90, thrill: 10, act: "Warming Hands by Stone Firepit" },
    eagles_nest_skywalk: { price: 20, label: "+$20 Skywalk", cat: "shops", warm: 45, thrill: 24, act: "Stepping Out on Glass Summit Skywalk" },
    // v3 Landmarks, Winter Festival & Mountain Attractions
    festival_ferris_wheel_2x2: { price: 32, label: "+$32 Ferris Wheel", cat: "apres", warm: 72, thrill: 38, act: "Soaring High on the Timber Gondola Ferris Wheel" },
    sphinx_observatory_2x2: { price: 38, label: "+$38 Observatory", cat: "tickets", warm: 88, thrill: 34, act: "Stargazing from the Lv 4 Sphinx Observatory Dome" },
    glockenspiel_tower: { price: 18, label: "+$18 Clock Chime", cat: "shops", warm: 65, thrill: 18, act: "Watching Golden Glockenspiel Clockwork Figures" },
    raclette_hearth_stall: { price: 24, label: "+$24 Fire Raclette", cat: "apres", warm: 98, thrill: 16, act: "Savoring Open-Fire Copper Wheel Raclette" },
    winter_carousel: { price: 22, label: "+$22 Carousel", cat: "apres", warm: 70, thrill: 28, act: "Riding Painted Horses on the Winter Carousel" },
    gluhwein_pyramid: { price: 20, label: "+$20 Gluhwein", cat: "apres", warm: 95, thrill: 18, act: "Sipping Mulled Wine at the Spinning Weihnachtspyramide" },
    ice_palace_arch: { price: 24, label: "+$24 Ice Palace", cat: "apres", warm: 60, thrill: 30, act: "Exploring Illuminated Turquoise Ice-Palace Turrets" },
    gondola_dj_booth: { price: 26, label: "+$26 DJ Party", cat: "apres", warm: 84, thrill: 34, act: "Dancing in Ski Boots at the Upcycled Gondola DJ Booth" },
    snow_cinema_screen: { price: 20, label: "+$20 Snow Cinema", cat: "apres", warm: 86, thrill: 22, act: "Watching Ski Films Under Tartan Blankets at Snow Cinema" },
  };

  const HOTEL_IDS = new Set([
    "grand_hotel_2x2", "chalet_bnb", "aframe_cabin", "stargaze_igloo", "ice_hotel_suite", "base_lodge_2x2",
  ]);
  const PATIO_DINING_IDS = new Set([
    "heated_patio_tables", "waffle_hut", "niseko_ramen_bar", "apres_tavern",
    "summit_restaurant", "base_lodge_2x2", "cheese_raclette_cellar", "watermill_lodge",
    "raclette_hearth_stall", "snow_cinema_screen",
  ]);
  const REVELER_HUB_IDS = new Set([
    "schirmbar_umbrella", "firepit_lounge", "craft_brewhouse", "christmas_market_stall",
    "gondola_dj_booth", "gluhwein_pyramid", "winter_carousel",
  ]);
  const SNACK_QUEUE_IDS = new Set([
    "cocoa_kiosk", "chestnut_cart", "alpine_bakery", "chocolatier_shop",
    "raclette_hearth_stall", "gluhwein_pyramid",
  ]);
  const SELFIE_SPOT_IDS = new Set([
    "eagles_nest_skywalk", "crystal_ice_sculpture", "holiday_tree", "champions_podium",
    "frozen_fountain", "glacier_ice_cave", "cascading_waterfall_sw", "cascading_waterfall_se",
    "ice_palace_arch", "giant_snow_sculpture", "alpine_photo_frame",
    "festival_ferris_wheel_2x2", "sphinx_observatory_2x2", "glockenspiel_tower",
  ]);
  const HOTTUB_IDS = new Set([
    "cedar_hottub", "barrel_sauna", "thermal_spa_2x2",
  ]);

  // All 11 Wave-1/Wave-2 v3 entities use 4 frames per heading (`_f0.._f3`)
  const V3_FOUR_FRAME_ENTITIES = new Set([
    "torchlight_skier",
    "retro_neon_skier",
    "davos_toboggan_pair",
    "yeti_mascot",
    "festival_parade_trio",
    "slope_photographer",
    "hot_air_balloon",
    "alpine_paraglider",
    "husky_dogsled",
    "coaster_sled",
    "ice_artisan",
  ]);

  // Night Mode 2.0 mover headlight & illuminated-cabin sets
  const HEADLIGHT_SPRITES = new Set([
    "piste_groomer",
    "snowcat",
    "winch_cat_yellow",
    "winch_cat",
    "snowmobile",
    "ski_shuttle_bus",
    "shuttle_bus",
    "alpine_train",
    "alpine_train_loco",
  ]);

  const LIT_CABIN_SPRITES = new Set([
    "alpine_train",
    "alpine_train_coach",
    "gondola_cabin",
    "egg_gondola_cabin",
    "tram_cabin_3s",
    "bubble_chair_orange",
    "funicular_car",
  ]);

  // 5 Crisp Pixel-Art Firework Presets (`golden_willow`, `crimson_peony`, `glacier_cyan`, `royal_emerald`, `alpine_violet`)
  const FIREWORK_PRESETS = [
    { id: "golden_willow", primary: "#ffe082", secondary: "#ffb300", core: "#ffffff", glow: "#ffca64", droop: 14 },
    { id: "crimson_peony", primary: "#ff5252", secondary: "#ff9e80", core: "#fff3e0", glow: "#ff6b6b", droop: 6 },
    { id: "glacier_cyan", primary: "#40c4ff", secondary: "#b2ebf2", core: "#ffffff", glow: "#38bdf8", droop: 7 },
    { id: "royal_emerald", primary: "#69f0ae", secondary: "#ffd54f", core: "#ffffff", glow: "#34d399", droop: 8 },
    { id: "alpine_violet", primary: "#e040fb", secondary: "#80d8ff", core: "#ffffff", glow: "#c084fc", droop: 7 },
  ];
  const FIREWORK_PRESET_BY_ID = Object.create(null);
  for (let i = 0; i < FIREWORK_PRESETS.length; i++) {
    FIREWORK_PRESET_BY_ID[FIREWORK_PRESETS[i].id] = FIREWORK_PRESETS[i];
  }
  const MAX_POOLED_FIREWORKS = 18;
  const SPARKS_PER_FIREWORK = 28;
  const MAX_TORCH_EMBERS = 96;
  const MAX_FINALE_SCHEDULE = 24;
  const PARK_FEATURE_BONUSES = {
    park_kicker: { jumpZ: 2.9, bonus: 18, label: "Indy Grab! +$18", actLabel: "Landing Indy Grab!" },
    big_air_kicker: { jumpZ: 4.1, bonus: 28, label: "Cork 720 Big Air! +$28", actLabel: "Landing Cork 720 Big Air!" },
    stunt_airbag: { jumpZ: 3.6, bonus: 24, label: "Backflip to Airbag! +$24", actLabel: "Landing Backflip to Airbag!" },
    park_rail: { jumpZ: 1.2, bonus: 14, label: "50-50 Rail Grind! +$14", actLabel: "Landing 50-50 Rail Grind!" },
    rainbow_cbox: { jumpZ: 1.9, bonus: 22, label: "Rainbow Box Press! +$22", actLabel: "Landing Rainbow Box Press!" },
    kinked_stair_rail: { jumpZ: 1.5, bonus: 20, label: "Kinked Rail Slide! +$20", actLabel: "Landing Kinked Rail Slide!" },
    timber_wallride: { jumpZ: 2.4, bonus: 22, label: "Timber Wallride! +$22", actLabel: "Landing Timber Wallride!" },
    halfpipe_wall: { jumpZ: 3.2, bonus: 24, label: "Superpipe Alley-Oop! +$24", actLabel: "Landing Superpipe Alley-Oop!" },
    boardercross_berm: { jumpZ: 1.0, bonus: 16, label: "Banked Berm Carve! +$16", actLabel: "Landing Banked Berm Carve!" },
  };

  // Pre-expanded O(1) lookup table across all directional/variant suffixes (zero hot-path RegExp)
  const PARK_FEATURE_MAP = Object.create(null);
  {
    const dirSuffixes = ["", "_sw", "_se", "_ns", "_ew", "_ne", "_nw", "_v0", "_v1", "_v2", "_v3"];
    const stems = Object.keys(PARK_FEATURE_BONUSES);
    for (let i = 0; i < stems.length; i++) {
      const stem = stems[i];
      const spec = PARK_FEATURE_BONUSES[stem];
      for (let j = 0; j < dirSuffixes.length; j++) {
        PARK_FEATURE_MAP[stem + dirSuffixes[j]] = spec;
      }
    }
  }

  const DEFAULT_COSTS = {
    sculpt_raise: 20, sculpt_lower: 20, sculpt_level: 15,
    untouched_powder: 10, groomed_piste: 20, mogul_chute: 25, glacier_ice: 28,
    wind_hardpack: 18, spring_slush: 16, tubing_chute: 30, nordic_track: 22,
    alpine_cobble: 30, red_brick: 32, packed_snow_path: 18, timber_deck: 34,
    slate_flagstone: 32, alpine_scree: 15, asphalt_road: 28,
    frozen_lake: 35, thermal_spring: 55, meltwater_brook: 40, glacier_crevasse: 45,
    magic_carpet: 280, rope_tow: 360, tbar_lift: 520, classic_2chair: 620,
    chairlift: 720, bubble_6chair: 920, egg_gondola: 1020, gondola: 1150,
    tramway_3s: 1550, cliff_funicular: 840,
    grand_hotel_2x2: 1100, thermal_spa_2x2: 1180, base_lodge_2x2: 1050,
    festival_ferris_wheel_2x2: 980, sphinx_observatory_2x2: 1240,
    valley_train_station: 520, summit_helipad: 680, summit_restaurant: 640,
    eagles_nest_skywalk: 580, apres_tavern: 460, craft_brewhouse: 440,
    niseko_ramen_bar: 410, ski_rental_shop: 340, lift_ticket_booth: 260,
    sculpt_matterhorn_peak: 65, sculpt_glacial_bowl: 75, sculpt_cliff_balcony: 55,
    festive_mosaic_cobble: 34, crystal_ice_promenade: 38,
    mountain_coaster: 95, mountain_coaster_curve: 95, suspension_skybridge: 140,
    glockenspiel_tower: 480, kapellbrucke_bridge: 160, raclette_hearth_stall: 240,
    winter_carousel: 520, gluhwein_pyramid: 360, ice_palace_arch: 420,
    giant_snow_sculpture: 260, fireworks_mortar: 180, festival_bunting_arch: 70,
    gondola_dj_booth: 340, snow_cinema_screen: 310, alpine_photo_frame: 175,
  };

  // 12 Resort Milestones (`getChallenges()`) for Alpine Peak v2
  const CHALLENGE_DEFS = [
    {
      id: "first_chairlift",
      title: "First Mountain Lift",
      description: "Operate at least 1 Uphill Lift (Carpet, Chair, Gondola, Tram, or Funicular)",
      reward: 400,
      icon: "chairlift_base_ns",
    },
    {
      id: "summit_cableway",
      title: "High-Summit Cableway",
      description: "Run a Gondola, Bubble 6-Chair, or 3S Tramway reaching Lv 3+ summit slopes",
      reward: 650,
      icon: "tramway_3s_base_ns",
    },
    {
      id: "diverse_lift_fleet",
      title: "Grand Swiss Lift Network",
      description: "Operate 4+ distinct uphill lift systems simultaneously across the mountain",
      reward: 750,
      icon: "bubble_6chair_base_ns",
    },
    {
      id: "fresh_corduroy",
      title: "Fresh Corduroy & Winch Crew",
      description: "Maintain 28+ Groomed Piste or Chute tiles at 84%+ corduroy quality",
      reward: 450,
      icon: "groomer_garage",
    },
    {
      id: "terrain_park_shredders",
      title: "X-Games Freestyle Park",
      description: "Land 8+ freestyle tricks on Kickers, Big Air, Airbags, C-Boxes, or Halfpipes",
      reward: 550,
      icon: "big_air_kicker_sw",
    },
    {
      id: "ski_school_ducklings",
      title: "Duckling Ski-School Parade",
      description: "Lead Ski-School Duckling squads along gentle runs with a Magic Carpet or School Lodge",
      reward: 500,
      icon: "ski_school_lodge",
    },
    {
      id: "winter_lake_festival",
      title: "Frozen Lake Hockey & Curling",
      description: "Host live 3v3 Pond Hockey & Ice Curling on Frozen Lake / Rink Pads",
      reward: 550,
      icon: "pond_hockey_goal_ns",
    },
    {
      id: "flagship_triad",
      title: "Grand Alpine Landmarks",
      description: "Operate 2+ Flagship 2x2 Landmarks (Grand Hotel, Thermal Spa, or Base Lodge)",
      reward: 700,
      icon: "grand_hotel_2x2_sw",
    },
    {
      id: "rack_railway_viaduct",
      title: "Glacier Express Railway",
      description: "Run the Swiss Rack-Railway across 14+ track/viaduct tiles with a Valley Station",
      reward: 600,
      icon: "stone_viaduct_ew",
    },
    {
      id: "vip_heli_summit",
      title: "VIP Heli-Ski & Skywalk",
      description: "Welcome VIP Helicopter drops at a Summit Helipad or Eagle's Nest Skywalk",
      reward: 650,
      icon: "summit_helipad",
    },
    {
      id: "night_skiing_lights",
      title: "Floodlit Night Festival",
      description: "Illuminate pistes & promenades with 10+ Floodlights, Neon Masts, or Garlands",
      reward: 500,
      icon: "neon_park_light",
    },
    {
      id: "bustling_peak_150",
      title: "Bustling 150-Guest Peak",
      description: "Host 150+ active skiers, rink athletes, and village guests at 4.6★+ Rating",
      reward: 950,
      icon: "summit_restaurant",
    },
  ];

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function stripFrameSuffix(id) {
    if (!id || typeof id !== "string") return "";
    const len = id.length;
    if (len > 3 && id.charCodeAt(len - 3) === 95 && id.charCodeAt(len - 2) === 102) {
      const d = id.charCodeAt(len - 1);
      if (d >= 48 && d <= 53) return id.slice(0, len - 3);
    }
    return id;
  }

  function compareBucketItems(x, y) {
    return x.u + x.v - (y.u + y.v) || x.uid - y.uid;
  }

  const CORRAL_WAYPOINTS = [
    [6.6, 5.6, "ne"],
    [6.9, 4.0, "nw"],
    [6.8, 2.3, "ne"],
    [5.8, 1.9, "se"],
    [4.8, 3.2, "ne"],
  ];

  function normalizeBuildingId(id) {
    const clean = stripFrameSuffix(id);
    if (!clean) return "";
    if (clean.startsWith("grand_hotel_2x2")) return "grand_hotel_2x2";
    if (clean.startsWith("thermal_spa_2x2")) return "thermal_spa_2x2";
    if (clean.startsWith("base_lodge_2x2")) return "base_lodge_2x2";
    if (clean.startsWith("festival_ferris_wheel_2x2")) return "festival_ferris_wheel_2x2";
    if (clean.startsWith("sphinx_observatory_2x2")) return "sphinx_observatory_2x2";
    if (clean.startsWith("snow_cannon_")) return "snow_cannon_sw";
    if (clean.startsWith("ski_rack_bench_")) return "ski_rack_bench_sw";
    if (clean.startsWith("pond_hockey_goal_")) return "pond_hockey_goal_ns";
    return clean;
  }

  function baseFeaturePrefix(id) {
    if (!id) return "";
    return id
      .replace(/_(ns|ew|sw|se|ne|nw)$/, "")
      .replace(/_v[0-3]$/, "");
  }

  function velocityToHeading(dU, dV, fallback = "sw") {
    const au = Math.abs(dU);
    const av = Math.abs(dV);
    if (au < 1e-4 && av < 1e-4) return fallback;
    if (au >= av) return dU >= 0 ? "sw" : "ne";
    return dV >= 0 ? "se" : "nw";
  }

  // Exact port table for closed-loop & linear rack-railway traversal
  function getRailPorts(id) {
    if (!id) return null;
    if (id.endsWith("_curve_ne")) return ["N", "E"];
    if (id.endsWith("_curve_nw")) return ["N", "W"];
    if (id.endsWith("_curve_se")) return ["S", "E"];
    if (id.endsWith("_curve_sw")) return ["S", "W"];
    if (
      id.startsWith("train_track_") ||
      id.startsWith("stone_viaduct_") ||
      id.startsWith("rail_crossing_gate_") ||
      id.startsWith("rail_tunnel_portal_")
    ) {
      if (id.endsWith("_ew") || id.endsWith("_se")) return ["E", "W"];
      return ["N", "S"];
    }
    return null;
  }

  // Exact port table for mountain_coaster_* tubular tracks & 90° curves
  function getCoasterPorts(id) {
    if (!id || !id.startsWith("mountain_coaster")) return null;
    if (id.endsWith("_curve_ne")) return ["N", "E"];
    if (id.endsWith("_curve_nw")) return ["N", "W"];
    if (id.endsWith("_curve_se")) return ["S", "E"];
    if (id.endsWith("_curve_sw")) return ["S", "W"];
    if (id.endsWith("_ew")) return ["E", "W"];
    return ["N", "S"];
  }

  const PORT_SUBTILE = {
    N: [0.0, 4.0],
    S: [8.0, 4.0],
    W: [4.0, 0.0],
    E: [4.0, 8.0],
  };

  const PORT_DELTAS = {
    N: { dr: -1, dc: 0, opp: "S" },
    S: { dr: 1, dc: 0, opp: "N" },
    E: { dr: 0, dc: 1, opp: "W" },
    W: { dr: 0, dc: -1, opp: "E" },
  };

  class SanctuarySim {
    constructor(world, audio) {
      this.world = world || null;
      this.audio = audio || null;

      // Core Tycoon Economy & Rating
      this.cash = 4500;
      this.sandboxMode = false;
      this.resortRating = 4.5;
      this.totalRevenue = 0;
      this.revenueBreakdown = {
        tickets: 0,
        rentals: 0,
        apres: 0,
        hotel: 0,
        shops: 0,
        rail: 0,
        rink: 0,
        tricks: 0,
        heli: 0,
        milestones: 0,
      };

      // Clock & Speed
      this._timeScale = 1;
      this.paused = false;
      this.simTime = 0;
      this._scanTimer = 0.95;
      this._uidCounter = 1;
      this._nameCursor = 0;

      // Live Resort Metrics
      this.runCounts = { green: 0, blue: 0, black: 0, total: 0 };
      this.avgWarmth = 89;
      this.avgThrill = 88;
      this.avgPisteQuality = 95;
      this.tricksLanded = 0;
      this.hockeyGoals = 0;
      this.heliDrops = 0;
      this.tilesGroomedCount = 0;
      this._trainEtaSec = 11;

      // Event Bus
      this._typedListeners = new Map();
      this._wildcardListeners = new Set();
      this.recentEvents = [];

      // 12 Resort Milestones
      this.challenges = CHALLENGE_DEFS.map((d) => ({
        id: d.id,
        title: d.title,
        name: d.title,
        desc: d.description,
        description: d.description,
        recipeText: d.description,
        reward: d.reward,
        grantBonus: d.reward,
        icon: d.icon,
        completed: false,
        discovered: false,
        progressText: "",
      }));
      this.challengesById = {};
      for (const ch of this.challenges) {
        this.challengesById[ch.id] = ch;
      }

      // Active Living Collections
      this.guests = [];        // All human skiers, queues, ducklings, rink athletes, diners, villagers
      this.ducklingSquads = []; // { id, leader, kids: [4], trail: [] }
      this.hockeyMatch = null;  // Live 3v3 pond hockey state + puck
      this.curlingSheets = [];  // Live Bavarian curling sheets + stones
      this.snowballBouts = [];  // Playful snowball fight groups + live arcing snowballs
      this.crew = [];           // Patrol, groomer, winch_cat, zamboni, sleigh, shuttle_bus, snowmobile, shoveler, heli
      this.wildlife = [];       // st_bernard, alpine_ibex, red_deer, soaring golden_eagle
      this.train = null;        // alpine_train (looped or linear)
      this.coasterSleds = [];   // v3 coaster_sled carts on mountain_coaster_* chains
      this.torchlightParade = []; // v3 10-skier torchlight_skier S-turn parade
      this.skySpectacles = [];  // v3 hot_air_balloon (3) + alpine_paraglider (3)
      this.liftSystems = new Map();
      this.aerialCarriers = [];
      this.surfaceMovers = [];  // funicular_car, tbar_skier_pair, magic_carpet & rope_tow riders
      this.projectiles = [];    // Exposed via getProjectiles() for renderer.js!
      this.cameraFlashes = [];  // Exposed via getCameraFlashes() for renderer.js!
      this.entities = [];
      this.floatingPopups = [];

      // v3 Atmosphere Hint, 14s Festive Finale & Zero-Alloc Firework / Ember Pools
      this._atmosphereHint = "";
      this._finaleTimer = 0;
      this._ambientFireworkTimer = 3.2;
      this._fireworkLaunchCounter = 0;
      this._activeFireworks = [];
      this._fireworkPool = this._createFireworkPool(MAX_POOLED_FIREWORKS, SPARKS_PER_FIREWORK);
      this._finaleSchedulePool = Array.from({ length: MAX_FINALE_SCHEDULE }, () => ({
        active: false,
        delay: 0,
        r: 14,
        c: 14,
        presetId: "golden_willow",
        playAudio: false,
      }));
      this._torchEmberHead = 0;
      this._activeTorchEmbers = [];
      this._torchEmberPool = Array.from({ length: MAX_TORCH_EMBERS }, () => ({
        active: false,
        r: 0,
        c: 0,
        u: 4,
        v: 4,
        z: 0,
        extraZ: 0.2,
        worldX: 0,
        worldY: 0,
        life: 0,
        maxLife: 0.85,
        alpha: 0,
        size: 2,
        color: "#ffd54f",
      }));

      // Cached World Topology & Reusable Scratch Buffers (Zero-Alloc Hot Path)
      this._poi = this._emptyPoi();
      this._bucketGridSize = 0;
      this._cellBuckets = [];
      this._worldSignature = null;
      this._syncedWorldVersion = -1;
      this._topologyDirty = false;
      this._unsubscribeWorld = null;
      this._baselineEvaluated = false;
      this._worldMutatedSinceReset = false;
      this._scratchTowerA = { wx: 0, wy: 0 };
      this._scratchTowerB = { wx: 0, wy: 0 };
      this._scratchCableSample = {
        cableWorldX: 0,
        cableWorldY: 0,
        r: 0,
        c: 0,
        u: 4,
        v: 4,
        groundZ: 0,
        worldZ: 0,
        heading: "ne",
      };
      this._dynamicLights = [];

      if (this.world) {
        this._bindWorldListener(this.world);
        this._worldSignature = this._computeWorldSignature();
        this.seedInitialResortLife();
      }
    }

    _emptyPoi() {
      return {
        shopsByType: {},
        allShops: [],
        hotels: [],
        patioSpots: [],
        revelerSpots: [],
        snackSpots: [],
        selfieSpots: [],
        hottubSpots: [],
        alphornSpots: [],
        snowmanSpots: [],
        townCells: [],
        roadCells: [],
        snowPlayCells: [],
        rinkCells: [],
        hockeyArena: null,
        curlingCells: [],
        fishingCells: [],
        pisteCells: [],
        gentlePisteCells: [],
        steepCells: [],
        tubingCells: [],
        nordicCells: [],
        gladeCells: [],
        cragCells: [],
        eyrieCells: [],
        feedingCells: [],
        helipads: [],
        sleighStands: [],
        busStops: [],
        liftTops: [],
        liftBases: [],
        trainPath: [],
        trainIsLoop: false,
        trainStationIdx: 0,
        stationCell: null,
        platformCells: [],
        festivalCells: [],
        fireworkMortars: [],
        iceSculptureSpots: [],
        photoSpots: [],
        peakLaunchCells: [],
        huskyTrailCells: [],
        coasterChains: [],
        lightCount: 0,
        compositeCount: 0,
      };
    }

    _createFireworkPool(shellCount, sparkCount) {
      const pool = [];
      for (let i = 0; i < shellCount; i++) {
        const sparks = [];
        for (let k = 0; k < sparkCount; k++) {
          const ring = k < 18 ? 1.0 : 0.56;
          const ang = (k < 18 ? k / 18 : (k - 18) / 10) * Math.PI * 2 + (k % 2) * 0.14;
          sparks.push({
            ux: Math.cos(ang) * ring,
            uy: Math.sin(ang) * ring * 0.78, // crisp isometric aspect balance
            dx: 0,
            dy: 0,
            prevDx: 0,
            prevDy: 0,
            worldX: 0,
            worldY: 0,
            x: 0,
            y: 0,
            size: k % 3 === 0 ? 3 : 2,
            color: "#ffe082",
            alpha: 1,
            twinklePhase: k * 0.91,
          });
        }
        pool.push({
          id: `fw_${i}`,
          active: false,
          phase: "rising",
          kind: "golden_willow",
          preset: "golden_willow",
          color: "#ffe082",
          primaryColor: "#ffe082",
          secondaryColor: "#ffb300",
          coreColor: "#ffffff",
          glowColor: "#ffca64",
          droop: 10,
          r: 14,
          c: 14,
          u: 4.0,
          v: 4.0,
          driftU: 0,
          driftV: 0,
          groundZ: 0,
          extraZ: 1.0,
          apexExtraZ: 19.0,
          z: 1.0,
          worldZ: 1.0,
          worldX: 0,
          worldY: 0,
          x: 0,
          y: 0,
          groundWorldX: 0,
          groundWorldY: 0,
          trailStartWorldX: 0,
          trailStartWorldY: 0,
          age: 0,
          riseDur: 0.82,
          burstDur: 1.68,
          progress: 0,
          t: 0,
          alpha: 1,
          flashAlpha: 0,
          radiusPx: 0,
          maxRadiusPx: 50,
          playBurstAudio: false,
          sparkCount,
          sparks,
          _lightItem: null,
        });
      }
      return pool;
    }

    // =========================================================================
    // Getters, Stats & Renderer Overlay Contracts
    // =========================================================================

    get ecoGrants() {
      return this.cash;
    }
    set ecoGrants(v) {
      this.cash = Math.max(0, Math.round(Number(v) || 0));
    }

    get starRating() {
      return this.resortRating;
    }

    get freeBuild() {
      return this.sandboxMode;
    }
    set freeBuild(val) {
      this.setSandboxMode(Boolean(val));
    }

    get timeScale() {
      return this._timeScale;
    }
    set timeScale(val) {
      const m = Number(val);
      if (Number.isNaN(m) || m <= 0) {
        this._timeScale = 0;
        this.paused = true;
      } else {
        this._timeScale = clamp(m, 0.25, 4.0);
        this.paused = false;
      }
    }

    get codex() {
      this._flushPendingWorldSync();
      return this.challenges;
    }
    get milestones() {
      this._flushPendingWorldSync();
      return this.challenges;
    }
    get visitorCount() {
      this._flushPendingWorldSync();
      return this.guests.length;
    }
    get activeGuests() {
      this._flushPendingWorldSync();
      return this.guests.length;
    }

    get skiersOnMountain() {
      this._flushPendingWorldSync();
      let n = 0;
      for (let i = 0; i < this.guests.length; i++) {
        const g = this.guests[i];
        if (
          g.roleGroup === "mountain" ||
          g.roleGroup === "lift_queue" ||
          g.roleGroup === "duckling" ||
          g.roleGroup === "nordic" ||
          g.state === "skiing" ||
          g.state === "riding_lift" ||
          g.state === "surface_lift" ||
          g.state === "tumble"
        ) {
          n++;
        }
      }
      return n;
    }

    get townVisitors() {
      this._flushPendingWorldSync();
      return Math.max(0, this.guests.length - this.skiersOnMountain);
    }

    get trainEtaSec() {
      return Math.max(0, Math.ceil(this._trainEtaSec));
    }

    getChallenges() {
      this._flushPendingWorldSync();
      return this.challenges;
    }
    getMilestones() {
      this._flushPendingWorldSync();
      return this.challenges;
    }
    getCodex() {
      this._flushPendingWorldSync();
      return this.challenges;
    }

    getProjectiles() {
      this._flushPendingWorldSync();
      return this.projectiles;
    }

    getCameraFlashes() {
      return this.cameraFlashes;
    }

    getAerialCarriers() {
      this._flushPendingWorldSync();
      return this.aerialCarriers;
    }

    getRenderEntities() {
      this._flushPendingWorldSync();
      return this.entities;
    }

    getFireworks() {
      this._flushPendingWorldSync();
      return this._activeFireworks;
    }

    getTorchEmbers() {
      return this._activeTorchEmbers;
    }

    isFestiveFinaleActive() {
      return this._finaleTimer > 0;
    }

    setAtmosphereHint(atmo) {
      const norm = String(atmo || "").trim().toLowerCase();
      this._atmosphereHint =
        norm === "golden" || norm === "alpenglow"
          ? "alpenglow"
          : norm === "dusk" || norm === "night"
          ? "night"
          : norm === "day"
          ? "day"
          : "";
      if (this._isTorchlightParadeActive() && this.torchlightParade.length > 0) {
        this._rebuildCellBuckets();
      }
      return this._getEffectiveAtmosphere();
    }

    _getEffectiveAtmosphere() {
      if (this._atmosphereHint) return this._atmosphereHint;
      const rAtmo =
        global &&
        global.alpineRenderer &&
        typeof global.alpineRenderer.atmosphere === "string"
          ? global.alpineRenderer.atmosphere.toLowerCase()
          : "";
      if (rAtmo === "alpenglow" || rAtmo === "golden") return "alpenglow";
      if (rAtmo === "night" || rAtmo === "dusk") return "night";
      return "day";
    }

    _isTorchlightParadeActive() {
      if (this._finaleTimer > 0) return true;
      const atmo = this._getEffectiveAtmosphere();
      return atmo === "alpenglow" || atmo === "night";
    }

    getStats() {
      this._flushPendingWorldSync();
      const skiers = this.skiersOnMountain;
      const town = Math.max(0, this.guests.length - skiers);
      let liftRiders = this.surfaceMovers.length;
      for (let i = 0; i < this.aerialCarriers.length; i++) {
        if (this.aerialCarriers[i].strand === "up") liftRiders++;
      }
      let completedMilestones = 0;
      for (let i = 0; i < this.challenges.length; i++) {
        if (this.challenges[i].completed) completedMilestones++;
      }
      return {
        cash: this.cash,
        ecoGrants: this.cash,
        resortRating: this.resortRating,
        starRating: this.resortRating,
        sandboxMode: this.sandboxMode,
        activeGuests: this.guests.length,
        visitors: this.guests.length,
        totalEntities: this.entities.length + liftRiders,
        skiersOnMountain: skiers,
        townVisitors: town,
        liftRiders,
        liftCount: this.liftSystems.size,
        runCounts: { ...this.runCounts },
        avgWarmth: Math.round(this.avgWarmth),
        avgThrill: Math.round(this.avgThrill),
        avgPisteQuality: Math.round(this.avgPisteQuality),
        trainEtaSec: this.trainEtaSec,
        trainAtStation: Boolean(this.train && this.train.state === "boarding"),
        tricksLanded: this.tricksLanded,
        hockeyGoals: this.hockeyGoals,
        heliDrops: this.heliDrops,
        milestonesCompleted: completedMilestones,
        totalMilestones: this.challenges.length,
        coasterSleds: this.coasterSleds.length,
        torchlightActive: this._isTorchlightParadeActive(),
        finaleActive: this.isFestiveFinaleActive(),
        fireworksActive: this._activeFireworks.length,
        totalRevenue: this.totalRevenue,
        revenueBreakdown: { ...this.revenueBreakdown },
      };
    }

    // =========================================================================
    // Event Bus & Economy
    // =========================================================================

    on(typeOrFn, maybeFn) {
      if (typeof typeOrFn === "function") {
        this._wildcardListeners.add(typeOrFn);
        return () => this._wildcardListeners.delete(typeOrFn);
      }
      if (typeof maybeFn !== "function") return () => {};
      if (typeOrFn === "*" || typeOrFn === "all" || typeOrFn === "event") {
        this._wildcardListeners.add(maybeFn);
        return () => this._wildcardListeners.delete(maybeFn);
      }
      if (!this._typedListeners.has(typeOrFn)) {
        this._typedListeners.set(typeOrFn, new Set());
      }
      this._typedListeners.get(typeOrFn).add(maybeFn);
      return () => this.off(typeOrFn, maybeFn);
    }

    off(typeOrFn, maybeFn) {
      if (typeof typeOrFn === "function") {
        this._wildcardListeners.delete(typeOrFn);
        return;
      }
      const set = this._typedListeners.get(typeOrFn);
      if (set && maybeFn) set.delete(maybeFn);
    }

    onEvent(fn) {
      return this.on(fn);
    }

    emitEvent(event) {
      if (!event || typeof event !== "object") return;
      this.recentEvents.push(event);
      if (this.recentEvents.length > 28) this.recentEvents.shift();
      const typed = this._typedListeners.get(event.type);
      if (typed) {
        for (const fn of typed) {
          try {
            fn(event);
          } catch (_) {}
        }
      }
      for (const fn of this._wildcardListeners) {
        try {
          fn(event);
        } catch (_) {}
      }
    }

    setSandboxMode(enabled) {
      this.sandboxMode = Boolean(enabled);
      this.emitEvent({ type: "sandbox_changed", sandboxMode: this.sandboxMode, cash: this.cash });
      return this.sandboxMode;
    }
    toggleSandbox() {
      return this.setSandboxMode(!this.sandboxMode);
    }
    toggleSandboxMode() {
      return this.setSandboxMode(!this.sandboxMode);
    }

    canAfford(cost = 0) {
      if (this.sandboxMode) return true;
      const c = Number(cost) || 0;
      return c <= 0 || this.cash >= c;
    }

    spend(cost = 0, reason = "") {
      const numeric = Math.max(0, Math.round(Number(cost) || 0));
      if (this.sandboxMode || numeric === 0) return true;
      if (this.cash < numeric) return false;
      this.cash -= numeric;
      this.emitEvent({ type: "cash_changed", cash: this.cash, delta: -numeric, reason });
      return true;
    }

    earn(amount, popupR = null, popupC = null, popupText = null, category = "shops", playSound = false) {
      const delta = Math.round(Number(amount) || 0);
      if (delta === 0) return this.cash;
      this.cash = Math.max(0, this.cash + delta);
      if (delta > 0) {
        this.totalRevenue += delta;
        if (this.revenueBreakdown[category] !== undefined) {
          this.revenueBreakdown[category] += delta;
        } else {
          this.revenueBreakdown.shops += delta;
        }
        if (playSound && this.audio && typeof this.audio.playCash === "function") {
          this.audio.playCash(delta);
        }
      }
      if (popupR !== null && popupC !== null) {
        this.addFloatingPopup(
          popupR,
          popupC,
          popupText || (delta > 0 ? `+$${delta}` : `-$${Math.abs(delta)}`),
          delta >= 40 ? "#fde68a" : "#a7f3d0"
        );
      }
      this.emitEvent({ type: "cash_changed", cash: this.cash, delta, category });
      return this.cash;
    }

    refund(amount) {
      return this.earn(Math.max(0, Math.round(Number(amount) || 0)), null, null, null, "shops", false);
    }

    getCost(itemId) {
      if (!itemId) return 0;
      if (this.world && typeof this.world.getItemCost === "function") {
        const wc = this.world.getItemCost(itemId);
        if (wc > 0) return wc;
      }
      if (DEFAULT_COSTS[itemId] !== undefined) return DEFAULT_COSTS[itemId];
      const norm = normalizeBuildingId(itemId);
      if (norm && DEFAULT_COSTS[norm] !== undefined) return DEFAULT_COSTS[norm];
      return 30;
    }

    setSpeed(multiplier) {
      this.timeScale = multiplier;
      return this._timeScale;
    }

    togglePause() {
      return this.paused || this._timeScale === 0 ? this.setSpeed(1) : this.setSpeed(0);
    }

    // =========================================================================
    // World Inspection & 5-Level Tall Isometric Math (`0..4` -> `0..16` z-units)
    // =========================================================================

    _getGridSize() {
      const w = this.world;
      return w ? Number(w.size || w.gridSize || 28) : 28;
    }

    _inBounds(r, c) {
      const n = this._getGridSize();
      return r >= 0 && r < n && c >= 0 && c < n;
    }

    _computeWorldSignature() {
      const w = this.world;
      if (!w) return "none";
      const n = this._getGridSize();
      const preset = w.presetName || w.currentPreset || w.preset || "";
      const seed = w.seed ?? w.worldSeed ?? "";
      const gen = w.generationId ?? w.resetCount ?? "";
      return `${n}:${preset}:${seed}:${gen}`;
    }

    _bindWorldListener(world) {
      if (typeof this._unsubscribeWorld === "function") {
        this._unsubscribeWorld();
        this._unsubscribeWorld = null;
      }
      if (world && typeof world.onChange === "function") {
        this._unsubscribeWorld = world.onChange((w, reason) => {
          if (reason === "preset" || reason === "load" || reason === "reset") {
            this.resetForWorld(w);
          } else {
            this.onWorldChanged();
          }
        });
      }
    }

    _getWorldVersion() {
      const w = this.world;
      return w && typeof w.version === "number" ? w.version : -1;
    }

    _syncWorldInfrastructure(isInitialSeed = false) {
      if (!this.world) return;
      this._topologyDirty = false;
      this._syncedWorldVersion = this._getWorldVersion();
      this._scanWorldTopology();
      this._syncLiftSystems();
      this._reconcileDynamicPopulations(isInitialSeed);
      if (isInitialSeed) this._updateLiftSystems(0);
      this._evaluateStatsAndChallenges(isInitialSeed);
      this._rebuildCellBuckets();
    }

    _flushPendingWorldSync() {
      if (!this.world) return;
      const ver = this._getWorldVersion();
      if (this._topologyDirty || (ver >= 0 && this._syncedWorldVersion !== ver)) {
        this._syncWorldInfrastructure(false);
      }
    }

    onWorldChanged() {
      if (!this.world) return;
      const ver = this._getWorldVersion();
      if (ver >= 0 && this._syncedWorldVersion === ver && !this._topologyDirty) {
        return;
      }
      this._worldMutatedSinceReset = true;
      this._scanTimer = Math.max(this._scanTimer, 0.85);
      this._topologyDirty = true;
    }

    markHabitatDirty() {
      if (!this.world) return;
      this._worldMutatedSinceReset = true;
      this._scanTimer = Math.max(this._scanTimer, 0.85);
      this._topologyDirty = true;
    }

    resetForWorld(world = this.world, options = {}) {
      if (world && world !== this.world) {
        this.world = world;
        this._bindWorldListener(world);
      } else if (world && !this._unsubscribeWorld) {
        this._bindWorldListener(world);
      }
      if (!options.keepCash) {
        this.cash = 4500;
        this.totalRevenue = 0;
        for (const k of Object.keys(this.revenueBreakdown)) {
          this.revenueBreakdown[k] = 0;
        }
      }
      this.tricksLanded = 0;
      this.hockeyGoals = 0;
      this.heliDrops = 0;
      this.tilesGroomedCount = 0;
      this.floatingPopups = [];
      this.projectiles = [];
      this.cameraFlashes = [];
      this._finaleTimer = 0;
      this._ambientFireworkTimer = 3.2;
      this._activeFireworks.length = 0;
      this._activeTorchEmbers.length = 0;
      for (let i = 0; i < this._fireworkPool.length; i++) this._fireworkPool[i].active = false;
      for (let i = 0; i < this._finaleSchedulePool.length; i++) this._finaleSchedulePool[i].active = false;
      for (let i = 0; i < this._torchEmberPool.length; i++) this._torchEmberPool[i].active = false;
      for (const ch of this.challenges) {
        ch.completed = false;
        ch.discovered = false;
      }
      this._baselineEvaluated = false;
      this._worldMutatedSinceReset = false;
      this._worldSignature = this._computeWorldSignature();
      this.seedInitialResortLife();
      this.emitEvent({ type: "sim_reset", cash: this.cash });
    }

    reset(world, options) {
      this.resetForWorld(world, options);
    }

    onWorldReset(world, options) {
      this.resetForWorld(world, options);
    }

    _cellFast(r, c) {
      const w = this.world;
      if (!w) return null;
      const cells = w.cells;
      if (cells) {
        const n = w.size || cells.length;
        if (r < 0 || r >= n || c < 0 || c >= n) return null;
        return cells[r][c];
      }
      return this._inspectCell(r, c);
    }

    _getCornerLevels(r, c) {
      const w = this.world;
      if (!w) return [0, 0, 0, 0];
      const cz = w.cornerZ || w.H || w.corners;
      if (Array.isArray(cz) && cz[r] && cz[r + 1]) {
        return [
          Number(cz[r][c] || 0),
          Number(cz[r][c + 1] || 0),
          Number(cz[r + 1][c + 1] || 0),
          Number(cz[r + 1][c] || 0),
        ];
      }
      if (typeof w.getCellCorners === "function") {
        const res = w.getCellCorners(r, c);
        if (Array.isArray(res) && res.length === 4) return res;
      }
      return [0, 0, 0, 0];
    }

    _getElevLevels(r, c, u = 4.0, v = 4.0) {
      const w = this.world;
      if (!w) return 0;
      const n = w.size || w.gridSize || 28;
      const rr = r < 0 ? 0 : r >= n ? n - 1 : r;
      const cc = c < 0 ? 0 : c >= n ? n - 1 : c;
      let lN = 0;
      let lE = 0;
      let lS = 0;
      let lW = 0;
      const cz = w.cornerZ || w.H || w.corners;
      if (cz && cz[rr] && cz[rr + 1]) {
        lN = cz[rr][cc] || 0;
        lE = cz[rr][cc + 1] || 0;
        lS = cz[rr + 1][cc + 1] || 0;
        lW = cz[rr + 1][cc] || 0;
      } else {
        const cArr = this._getCornerLevels(rr, cc);
        lN = cArr[0];
        lE = cArr[1];
        lS = cArr[2];
        lW = cArr[3];
      }
      const s = u <= 0 ? 0 : u >= 8 ? 1 : u * 0.125;
      const t = v <= 0 ? 0 : v >= 8 ? 1 : v * 0.125;
      const invS = 1 - s;
      const invT = 1 - t;
      return invS * invT * lN + invS * t * lE + s * t * lS + s * invT * lW;
    }

    _getSurfaceZUnits(r, c, u = 4.0, v = 4.0) {
      const w = this.world;
      if (w && typeof w.getSurfaceZ === "function") {
        const val = w.getSurfaceZ(r, c, u, v, true);
        if (typeof val === "number" && !Number.isNaN(val)) {
          if (w.cells) return val;
          const elevLv = this._getElevLevels(r, c, u, v);
          if (elevLv >= 0.75 && Math.abs(val - elevLv) < 0.25) return val * ELEV_STEP_Z;
          return val;
        }
      }
      return this._getElevLevels(r, c, u, v) * ELEV_STEP_Z;
    }

    _toWorldPx(r, c, u = 4.0, v = 4.0, zUnits = 0) {
      return {
        x: (c - r) * HALF_W + (v - u) * 8.0,
        y: (r + c) * HALF_H + (u + v) * 4.0 - zUnits * 4.0,
      };
    }

    _inspectCell(r, c) {
      const w = this.world;
      const n = this._getGridSize();
      if (!w || r < 0 || r >= n || c < 0 || c >= n) return null;

      let cell = null;
      if (Array.isArray(w.cells) && w.cells[r]) cell = w.cells[r][c];
      else if (typeof w.getCell === "function") cell = w.getCell(r, c);

      const surface = cell?.surface || cell?.biome || "untouched_powder";
      let rawWater = cell?.water ?? null;
      if (rawWater && typeof rawWater === "object") rawWater = rawWater.type || rawWater.id || null;
      const water = stripFrameSuffix(rawWater) || null;

      let rawFlora = cell?.flora ?? null;
      if (rawFlora && typeof rawFlora === "object") rawFlora = rawFlora.id || rawFlora.type || null;
      const flora = stripFrameSuffix(rawFlora) || null;

      let rawStruct = cell?.structure ?? null;
      let structId = "";
      let structParentR = null;
      let structParentC = null;
      if (typeof rawStruct === "string") structId = stripFrameSuffix(rawStruct);
      else if (rawStruct && typeof rawStruct === "object") {
        structId = stripFrameSuffix(rawStruct.id || rawStruct.type || rawStruct.itemId || "");
        if (typeof rawStruct.anchorR === "number") structParentR = rawStruct.anchorR;
        else if (typeof rawStruct.parentR === "number") structParentR = rawStruct.parentR;
        if (typeof rawStruct.anchorC === "number") structParentC = rawStruct.anchorC;
        else if (typeof rawStruct.parentC === "number") structParentC = rawStruct.parentC;
      }

      let rawAmenity = cell?.amenity ?? null;
      let amenityId = "";
      if (typeof rawAmenity === "string") amenityId = stripFrameSuffix(rawAmenity);
      else if (rawAmenity && typeof rawAmenity === "object") {
        amenityId = stripFrameSuffix(rawAmenity.id || rawAmenity.type || rawAmenity.itemId || "");
      }

      const corners = this._getCornerLevels(r, c);
      const minLv = Math.min(corners[0], corners[1], corners[2], corners[3]);
      const maxLv = Math.max(corners[0], corners[1], corners[2], corners[3]);
      const avgLv = (corners[0] + corners[1] + corners[2] + corners[3]) * 0.25;
      const pisteQuality =
        typeof cell?.pisteQuality === "number"
          ? cell.pisteQuality
          : typeof cell?.quality === "number"
          ? cell.quality
          : 95;

      return {
        r,
        c,
        surface,
        water,
        flora,
        structureId: structId || null,
        structParentR,
        structParentC,
        amenityId: amenityId || null,
        primaryObjId: normalizeBuildingId(structId || amenityId),
        corners,
        minLv,
        maxLv,
        avgLv,
        isSloped: maxLv > minLv,
        pisteQuality,
      };
    }

    // =========================================================================
    // v2 World Topology, Closed-Loop Rail & Activity Arena Scanner
    // =========================================================================

    _scanWorldTopology() {
      const w = this.world;
      const n = this._getGridSize();
      const poi = this._emptyPoi();
      const seenCompositeRoots = new Set();
      const railNodes = [];
      const coasterNodes = [];
      const hockeyGoals = [];
      let qualitySum = 0;
      let qualityCount = 0;
      let greenGates = 0;
      let blueGates = 0;
      let blackGates = 0;

      const cells = w && Array.isArray(w.cells) ? w.cells : null;
      const cz = w && Array.isArray(w.cornerZ) ? w.cornerZ : null;

      for (let r = 0; r < n; r++) {
        const row = cells ? cells[r] : null;
        const czR0 = cz ? cz[r] : null;
        const czR1 = cz ? cz[r + 1] : null;
        for (let c = 0; c < n; c++) {
          let surface, water, fl, objRaw, objId, structParentR, structParentC, maxLv, avgLv, isSloped, pisteQuality;
          if (row && row[c]) {
            const cell = row[c];
            surface = cell.surface || cell.biome || "untouched_powder";
            water = cell.water ? stripFrameSuffix(cell.water) : null;
            fl = cell.flora ? stripFrameSuffix(cell.flora) : "";
            const st = cell.structure;
            const sId = cell.structureId
              ? stripFrameSuffix(cell.structureId)
              : st && typeof st === "object"
              ? stripFrameSuffix(st.id || "")
              : typeof st === "string"
              ? stripFrameSuffix(st)
              : "";
            const aId = cell.amenity
              ? stripFrameSuffix(typeof cell.amenity === "string" ? cell.amenity : cell.amenity.id || "")
              : "";
            objRaw = sId || aId;
            objId = cell.baseStructureId && SHOP_PRICES[cell.baseStructureId]
              ? cell.baseStructureId
              : normalizeBuildingId(objRaw);
            structParentR =
              st && typeof st.anchorR === "number"
                ? st.anchorR
                : st && typeof st.parentR === "number"
                ? st.parentR
                : null;
            structParentC =
              st && typeof st.anchorC === "number"
                ? st.anchorC
                : st && typeof st.parentC === "number"
                ? st.parentC
                : null;
            if (czR0 && czR1) {
              const z0 = czR0[c] || 0;
              const z1 = czR0[c + 1] || 0;
              const z2 = czR1[c + 1] || 0;
              const z3 = czR1[c] || 0;
              maxLv = cell.maxLevel !== undefined ? cell.maxLevel : Math.max(z0, z1, z2, z3);
              const minLv = cell.minLevel !== undefined ? cell.minLevel : Math.min(z0, z1, z2, z3);
              avgLv = (z0 + z1 + z2 + z3) * 0.25;
              isSloped = maxLv > minLv;
            } else {
              maxLv = cell.maxLevel || 0;
              avgLv = maxLv;
              isSloped = !cell.isFlat;
            }
            pisteQuality = typeof cell.pisteQuality === "number" ? cell.pisteQuality : 95;
          } else {
            const info = this._inspectCell(r, c);
            if (!info) continue;
            surface = info.surface;
            water = info.water;
            fl = info.flora || "";
            objRaw = info.structureId || info.amenityId || "";
            objId = info.primaryObjId;
            structParentR = info.structParentR;
            structParentC = info.structParentC;
            maxLv = info.maxLv;
            avgLv = info.avgLv;
            isSloped = info.isSloped;
            pisteQuality = info.pisteQuality;
          }

          // Night-Skiing & Village Illumination count
          if (
            fl === "slope_floodlight" ||
            fl === "neon_park_light" ||
            objRaw === "alpine_lamp" ||
            objRaw.startsWith("street_light_garland_") ||
            fl.startsWith("finish_timing_arch_") ||
            objRaw.startsWith("festival_bunting_arch") ||
            fl.startsWith("festival_bunting_arch") ||
            objId === "festival_ferris_wheel_2x2" ||
            objId === "winter_carousel" ||
            objId === "gluhwein_pyramid" ||
            objId === "ice_palace_arch" ||
            objId === "gondola_dj_booth" ||
            objId === "snow_cinema_screen"
          ) {
            poi.lightCount++;
          }

          // Trail gates
          if (fl === "gate_green_circle" || fl === "kids_forest_arch") greenGates++;
          else if (fl === "gate_blue_square") blueGates++;
          else if (fl === "gate_black_diamond" || fl === "gate_double_black" || fl === "race_start_house") {
            blackGates++;
          }

          // Closed-loop / linear rack railway cells & v3 mountain coaster cells
          const ports = getRailPorts(objRaw);
          if (ports) {
            railNodes.push({ r, c, id: objRaw, ports });
          } else if (objRaw.startsWith("train_platform_")) {
            poi.platformCells.push({ r, c, id: objRaw });
          }
          if (objRaw === "valley_train_station") {
            poi.stationCell = { r, c };
          }
          const coasterCand = objRaw.startsWith("mountain_coaster")
            ? objRaw
            : fl.startsWith("mountain_coaster")
            ? fl
            : "";
          if (coasterCand) {
            const cPorts = getCoasterPorts(coasterCand);
            if (cPorts) {
              coasterNodes.push({ r, c, id: coasterCand, ports: cPorts, avgLv, maxLv });
            }
          }

          // Revenue Buildings & 2x2 Flagship Landmarks (including v3 Ferris Wheel & Sphinx Observatory)
          const shopCandidateId =
            objId && SHOP_PRICES[objId]
              ? objId
              : fl && SHOP_PRICES[normalizeBuildingId(fl)]
              ? normalizeBuildingId(fl)
              : "";
          if (shopCandidateId) {
            if (
              shopCandidateId === "grand_hotel_2x2" ||
              shopCandidateId === "thermal_spa_2x2" ||
              shopCandidateId === "base_lodge_2x2" ||
              shopCandidateId === "festival_ferris_wheel_2x2" ||
              shopCandidateId === "sphinx_observatory_2x2"
            ) {
              const rootR =
                structParentR !== null
                  ? structParentR
                  : objRaw.endsWith("_sw") || objRaw.endsWith("_se")
                  ? r - 1
                  : r;
              const rootC =
                structParentC !== null
                  ? structParentC
                  : objRaw.endsWith("_ne") || objRaw.endsWith("_se")
                  ? c - 1
                  : c;
              const key = `${shopCandidateId}:${rootR},${rootC}`;
              if (!seenCompositeRoots.has(key)) {
                seenCompositeRoots.add(key);
                poi.compositeCount++;
                const doorR = clamp(rootR + 1, 0, n - 1);
                const doorC = clamp(rootC + 1, 0, n - 1);
                const entry = { r: doorR, c: doorC, id: shopCandidateId };
                (poi.shopsByType[shopCandidateId] = poi.shopsByType[shopCandidateId] || []).push(entry);
                poi.allShops.push(entry);
                if (HOTEL_IDS.has(shopCandidateId)) poi.hotels.push(entry);
                if (PATIO_DINING_IDS.has(shopCandidateId)) poi.patioSpots.push(entry);
                if (REVELER_HUB_IDS.has(shopCandidateId)) poi.revelerSpots.push(entry);
                if (HOTTUB_IDS.has(shopCandidateId)) poi.hottubSpots.push(entry);
                if (SELFIE_SPOT_IDS.has(shopCandidateId)) poi.selfieSpots.push(entry);
                if (shopCandidateId === "festival_ferris_wheel_2x2") poi.festivalCells.push(entry);
                if (shopCandidateId === "sphinx_observatory_2x2") poi.photoSpots.push(entry);
              }
            } else {
              const entry = { r, c, id: shopCandidateId };
              (poi.shopsByType[shopCandidateId] = poi.shopsByType[shopCandidateId] || []).push(entry);
              poi.allShops.push(entry);
              if (HOTEL_IDS.has(shopCandidateId)) poi.hotels.push(entry);
              if (PATIO_DINING_IDS.has(shopCandidateId)) poi.patioSpots.push(entry);
              if (REVELER_HUB_IDS.has(shopCandidateId)) poi.revelerSpots.push(entry);
              if (SNACK_QUEUE_IDS.has(shopCandidateId)) poi.snackSpots.push(entry);
              if (HOTTUB_IDS.has(shopCandidateId)) poi.hottubSpots.push(entry);
              if (SELFIE_SPOT_IDS.has(shopCandidateId)) poi.selfieSpots.push(entry);
            }
          }

          // Ops, Fleet, Festival & Scenic v3 POIs
          if (
            objRaw === "groomer_garage" ||
            objRaw === "winch_cat_bay" ||
            objRaw === "ski_patrol_hut" ||
            objRaw === "rescue_clinic" ||
            objRaw === "snowmobile_pad"
          ) {
            (poi.shopsByType[objRaw] = poi.shopsByType[objRaw] || []).push({ r, c, id: objRaw });
          }
          if (objRaw === "summit_helipad") poi.helipads.push({ r, c });
          if (objRaw === "horse_sleigh_stand") poi.sleighStands.push({ r, c });
          if (objRaw === "shuttle_bus_stop") poi.busStops.push({ r, c });
          if (objRaw === "alphorn_band_stage") poi.alphornSpots.push({ r, c });
          if (objRaw === "snowman_trio" || fl === "snowman_trio") poi.snowmanSpots.push({ r, c });

          if (objRaw.startsWith("fireworks_mortar") || fl.startsWith("fireworks_mortar")) {
            poi.fireworkMortars.push({ r, c });
          }
          if (
            objRaw.startsWith("giant_snow_sculpture") ||
            fl.startsWith("giant_snow_sculpture") ||
            objRaw.startsWith("ice_palace_arch") ||
            fl.startsWith("ice_palace_arch")
          ) {
            poi.iceSculptureSpots.push({ r, c, id: objRaw || fl });
          }
          if (
            objRaw.startsWith("alpine_photo_frame") ||
            fl.startsWith("alpine_photo_frame") ||
            (fl && (PARK_FEATURE_MAP[fl] || PARK_FEATURE_BONUSES[baseFeaturePrefix(fl)]))
          ) {
            poi.photoSpots.push({ r, c, id: objRaw || fl });
          }

          if (SELFIE_SPOT_IDS.has(objRaw) || SELFIE_SPOT_IDS.has(fl)) {
            poi.selfieSpots.push({ r, c, id: objRaw || fl });
          }
          if (water === "thermal_spring" && !isSloped) {
            poi.hottubSpots.push({ r, c, id: "thermal_spring" });
          }

          // Rink, Pond Hockey, Curling & Ice Fishing
          if (objRaw.startsWith("pond_hockey_goal_")) {
            hockeyGoals.push({ r, c, axis: objRaw.endsWith("_ew") ? "ew" : "ns" });
          }
          if (objRaw === "ice_curling_lane") {
            poi.curlingCells.push({ r, c });
          }
          if (
            objRaw === "ice_rink_pad" ||
            (water === "frozen_lake" && !isSloped && !objRaw)
          ) {
            poi.rinkCells.push({ r, c, isLake: water === "frozen_lake" });
          }

          // Walkable Village Promenades, Stairs, Covered/Suspension Bridges & Festival Plazas
          const isWalkStruct =
            objRaw.startsWith("town_walkway") ||
            objRaw.startsWith("snow_stairs") ||
            objRaw.startsWith("covered_escalator") ||
            objRaw.startsWith("timber_bridge") ||
            objRaw.startsWith("stone_arch_bridge") ||
            objRaw.startsWith("kapellbrucke_bridge") ||
            objRaw.startsWith("suspension_skybridge") ||
            objRaw.startsWith("festival_bunting_arch") ||
            objRaw.startsWith("train_platform_") ||
            objRaw.startsWith("rail_crossing_gate_");

          const isFestivalSurface =
            surface === "festive_mosaic_cobble" || surface === "crystal_ice_promenade";

          const isVillageSurface =
            surface === "alpine_cobble" ||
            surface === "red_brick" ||
            surface === "packed_snow_path" ||
            surface === "timber_deck" ||
            surface === "slate_flagstone" ||
            isFestivalSurface;

          if (surface === "asphalt_road" && !water) {
            poi.roadCells.push({ r, c });
          }
          if (
            isWalkStruct ||
            ((isVillageSurface || surface === "asphalt_road") && !water && !objRaw)
          ) {
            poi.townCells.push({ r, c });
          }
          if (
            (isFestivalSurface && !water && !objRaw) ||
            objRaw.startsWith("festival_bunting_arch") ||
            fl.startsWith("festival_bunting_arch") ||
            shopCandidateId === "raclette_hearth_stall" ||
            shopCandidateId === "winter_carousel" ||
            shopCandidateId === "gluhwein_pyramid" ||
            shopCandidateId === "gondola_dj_booth" ||
            shopCandidateId === "snow_cinema_screen"
          ) {
            poi.festivalCells.push({ r, c });
          }
          if (!water && !objRaw && (surface === "nordic_track" || surface === "packed_snow_path")) {
            poi.huskyTrailCells.push({ r, c, surface });
          }
          if (!water && !objRaw && maxLv >= 3) {
            poi.peakLaunchCells.push({ r, c, avgLv });
          }

          // Snowy clearings near town/base for snowball fights & sledding families
          if (
            !water &&
            !objRaw &&
            !fl &&
            !isSloped &&
            maxLv <= 1 &&
            (surface === "untouched_powder" || surface === "packed_snow_path")
          ) {
            poi.snowPlayCells.push({ r, c });
          }

          // Skiable Mountain Surfaces, Tubing, Nordic & Glades
          if (!water && water !== "glacier_crevasse") {
            if (
              surface === "groomed_piste" ||
              surface === "mogul_chute" ||
              surface === "wind_hardpack" ||
              surface === "spring_slush" ||
              surface === "glacier_ice"
            ) {
              const pEntry = {
                r,
                c,
                surface,
                quality: pisteQuality,
                avgLv,
                isSloped,
              };
              poi.pisteCells.push(pEntry);
              if (avgLv >= 1.0 && avgLv <= 2.8) {
                poi.gentlePisteCells.push(pEntry);
              }
              qualitySum += pisteQuality;
              qualityCount++;
              if (surface === "mogul_chute" || (isSloped && avgLv >= 2.2)) {
                poi.steepCells.push({ r, c });
              }
            }
            if (surface === "tubing_chute" || fl === "tubing_bale_corral") {
              poi.tubingCells.push({ r, c, isCorral: fl === "tubing_bale_corral" });
            }
            if (surface === "nordic_track" || fl === "nordic_signpost") {
              poi.nordicCells.push({ r, c });
            }
            if (
              !objRaw &&
              (fl.startsWith("frosted_birch") ||
                fl.startsWith("golden_larch") ||
                fl.startsWith("weeping_hemlock") ||
                fl === "glacier_ice_cave" ||
                (surface === "untouched_powder" && avgLv >= 1 && avgLv <= 3 && !fl))
            ) {
              poi.gladeCells.push({ r, c, isCave: fl === "glacier_ice_cave" });
            }
          }

          // Wildlife Habitats (`alpine_ibex`, `red_deer`, `golden_eagle`)
          if (!water && !objRaw && (maxLv >= 3 || fl.startsWith("summit_crag"))) {
            poi.cragCells.push({ r, c });
          }
          if (fl === "eagle_eyrie_crag") poi.eyrieCells.push({ r, c });
          if (fl === "wildlife_feeding_rack") poi.feedingCells.push({ r, c });
        }
      }

      // Fallback walkable town cells if custom empty map
      if (poi.townCells.length === 0) {
        for (let r = Math.max(0, n - 5); r < n; r++) {
          for (let c = 0; c < n; c++) {
            const cell = this._cellFast(r, c);
            const maxLv = cell ? (cell.maxLevel !== undefined ? cell.maxLevel : cell.maxLv || 0) : 0;
            const st = cell ? cell.structureId || cell.structure : null;
            if (cell && !cell.water && !st && maxLv <= 1) {
              poi.townCells.push({ r, c });
            }
          }
        }
      }

      // Outer frozen lake edge cells for `ice_fisherman` (away from hockey center)
      for (let i = 0; i < poi.rinkCells.length; i++) {
        const rc = poi.rinkCells[i];
        if (!rc.isLake) continue;
        const nearGoal = hockeyGoals.some((g) => Math.abs(g.r - rc.r) + Math.abs(g.c - rc.c) <= 2);
        if (!nearGoal) poi.fishingCells.push(rc);
      }

      // Build 3v3 Pond Hockey Arena from `pond_hockey_goal_*` pair or frozen lake span
      if (hockeyGoals.length >= 2) {
        const gA = hockeyGoals[0];
        const gB = hockeyGoals[1];
        poi.hockeyArena = {
          goalRed: { r: gA.r, c: gA.c, u: 4.0, v: 4.0 },
          goalBlue: { r: gB.r, c: gB.c, u: 4.0, v: 4.0 },
          minR: Math.min(gA.r, gB.r),
          maxR: Math.max(gA.r, gB.r),
          minC: Math.min(gA.c, gB.c) - 1,
          maxC: Math.max(gA.c, gB.c) + 1,
        };
      } else if (poi.rinkCells.length >= 4) {
        const sorted = poi.rinkCells.slice().sort((a, b) => a.r - b.r || a.c - b.c);
        const gA = sorted[0];
        const gB = sorted[sorted.length - 1];
        poi.hockeyArena = {
          goalRed: { r: gA.r, c: gA.c, u: 4.0, v: 4.0 },
          goalBlue: { r: gB.r, c: gB.c, u: 4.0, v: 4.0 },
          minR: Math.min(gA.r, gB.r),
          maxR: Math.max(gA.r, gB.r),
          minC: Math.min(gA.c, gB.c),
          maxC: Math.max(gA.c, gB.c),
        };
      }

      // Build Ordered Closed-Loop or Linear Rack-Railway Path & Mountain Coaster Chains
      const railInfo = this._buildOrderedTrainPath(railNodes, poi.platformCells, poi.stationCell);
      poi.trainPath = railInfo.path;
      poi.trainIsLoop = railInfo.isLoop;
      poi.trainStationIdx = railInfo.stationIdx;
      poi.coasterChains = this._buildOrderedCoasterChains(coasterNodes);

      this.avgPisteQuality = qualityCount > 0 ? qualitySum / qualityCount : 95;
      const liftCount = this.world && typeof this.world.getLifts === "function"
        ? (this.world.getLifts() || []).length
        : 0;
      this.runCounts = {
        green: Math.max(greenGates, liftCount > 0 ? 1 : 0),
        blue: Math.max(blueGates, poi.pisteCells.length >= 25 ? 2 : 0),
        black: Math.max(blackGates, poi.steepCells.length >= 8 ? 1 : 0),
        total: 0,
      };
      this.runCounts.total = this.runCounts.green + this.runCounts.blue + this.runCounts.black;

      this._poi = poi;
    }

    _buildOrderedCoasterChains(coasterNodes) {
      if (!coasterNodes || coasterNodes.length < 2) return [];
      const byKey = new Map();
      for (let i = 0; i < coasterNodes.length; i++) {
        byKey.set(`${coasterNodes[i].r},${coasterNodes[i].c}`, coasterNodes[i]);
      }

      const adj = new Map();
      for (const [key, node] of byKey.entries()) {
        const list = [];
        for (let pIdx = 0; pIdx < node.ports.length; pIdx++) {
          const p = node.ports[pIdx];
          const d = PORT_DELTAS[p];
          const nk = `${node.r + d.dr},${node.c + d.dc}`;
          const nb = byKey.get(nk);
          if (nb && nb.ports.includes(d.opp)) {
            list.push(nk);
          }
        }
        if (list.length === 0) {
          for (const p of ["N", "E", "S", "W"]) {
            const d = PORT_DELTAS[p];
            const nk = `${node.r + d.dr},${node.c + d.dc}`;
            if (byKey.has(nk)) list.push(nk);
          }
        }
        adj.set(key, list);
      }

      const seenComp = new Set();
      const chains = [];
      const dirPortFromDelta = (dr, dc) => {
        if (dr < 0) return "N";
        if (dr > 0) return "S";
        if (dc > 0) return "E";
        return "W";
      };

      for (const seedKey of byKey.keys()) {
        if (seenComp.has(seedKey)) continue;
        const comp = [];
        const q = [seedKey];
        seenComp.add(seedKey);
        while (q.length > 0) {
          const cur = q.shift();
          comp.push(cur);
          const nbs = adj.get(cur) || [];
          for (let i = 0; i < nbs.length; i++) {
            const nb = nbs[i];
            if (!seenComp.has(nb)) {
              seenComp.add(nb);
              q.push(nb);
            }
          }
        }
        if (comp.length < 2) continue;
        const compSet = new Set(comp);

        const endpoints = comp.filter(
          (k) => (adj.get(k) || []).filter((x) => compSet.has(x)).length <= 1
        );
        let startKey = comp[0];
        if (endpoints.length > 0) {
          endpoints.sort((a, b) => {
            const na = byKey.get(a);
            const nb = byKey.get(b);
            return nb.avgLv - na.avgLv || na.r - nb.r || na.c - nb.c;
          });
          startKey = endpoints[0];
        } else {
          comp.sort((a, b) => {
            const na = byKey.get(a);
            const nb = byKey.get(b);
            return nb.avgLv - na.avgLv || na.r - nb.r || na.c - nb.c;
          });
          startKey = comp[0];
        }

        const ordered = [];
        const visited = new Set();
        let curr = startKey;
        let prev = null;
        while (curr && !visited.has(curr)) {
          visited.add(curr);
          ordered.push(byKey.get(curr));
          const nbs = (adj.get(curr) || []).filter(
            (k) => compSet.has(k) && !visited.has(k) && k !== prev
          );
          prev = curr;
          curr = nbs.length > 0 ? nbs[0] : null;
        }
        if (ordered.length < 2) continue;

        const first = ordered[0];
        const last = ordered[ordered.length - 1];
        const isLoop =
          ordered.length >= 4 &&
          Math.abs(first.r - last.r) + Math.abs(first.c - last.c) === 1 &&
          (adj.get(`${last.r},${last.c}`) || []).includes(`${first.r},${first.c}`);

        // Orient linear mountain coaster chains from higher elevation to lower elevation
        if (!isLoop) {
          if (
            first.avgLv < last.avgLv ||
            (Math.abs(first.avgLv - last.avgLv) < 0.05 && first.r > last.r)
          ) {
            ordered.reverse();
          }
        }

        const steps = [];
        const len = ordered.length;
        for (let i = 0; i < len; i++) {
          const cur = ordered[i];
          const prevNode = i > 0 ? ordered[i - 1] : isLoop ? ordered[len - 1] : null;
          const nextNode = i + 1 < len ? ordered[i + 1] : isLoop ? ordered[0] : null;

          let entryPort = null;
          let exitPort = null;
          if (prevNode) {
            entryPort = dirPortFromDelta(prevNode.r - cur.r, prevNode.c - cur.c);
          }
          if (nextNode) {
            exitPort = dirPortFromDelta(nextNode.r - cur.r, nextNode.c - cur.c);
          }
          if (!entryPort) {
            entryPort =
              cur.ports.find((p) => p !== exitPort) ||
              (exitPort ? PORT_DELTAS[exitPort].opp : cur.ports[0] || "N");
          }
          if (!exitPort) {
            exitPort =
              cur.ports.find((p) => p !== entryPort) ||
              PORT_DELTAS[entryPort].opp ||
              cur.ports[1] ||
              "S";
          }
          steps.push({
            r: cur.r,
            c: cur.c,
            id: cur.id,
            avgLv: cur.avgLv,
            entryPort,
            exitPort,
          });
        }
        chains.push({ steps, isLoop });
      }

      chains.sort((a, b) => b.steps.length - a.steps.length);
      return chains;
    }

    _buildOrderedTrainPath(railNodes, platformCells, stationCell) {
      if (!railNodes || railNodes.length < 3) {
        return { path: [], isLoop: false, stationIdx: 0 };
      }
      const byKey = new Map();
      for (let i = 0; i < railNodes.length; i++) {
        byKey.set(`${railNodes[i].r},${railNodes[i].c}`, railNodes[i]);
      }

      // Build port-respecting adjacency (with 4-neighbor fallback for custom track layouts)
      const adj = new Map();
      for (const [key, node] of byKey.entries()) {
        const list = [];
        for (const p of node.ports) {
          const d = PORT_DELTAS[p];
          const nk = `${node.r + d.dr},${node.c + d.dc}`;
          const nb = byKey.get(nk);
          if (nb && nb.ports.includes(d.opp)) {
            list.push(nk);
          }
        }
        if (list.length === 0) {
          for (const p of ["N", "E", "S", "W"]) {
            const d = PORT_DELTAS[p];
            const nk = `${node.r + d.dr},${node.c + d.dc}`;
            if (byKey.has(nk)) list.push(nk);
          }
        }
        adj.set(key, list);
      }

      // Pick the largest connected component (ignores isolated scenic tunnel spurs!)
      const seenComp = new Set();
      let bestComp = [];
      for (const startKey of byKey.keys()) {
        if (seenComp.has(startKey)) continue;
        const comp = [];
        const q = [startKey];
        seenComp.add(startKey);
        while (q.length > 0) {
          const cur = q.shift();
          comp.push(cur);
          const nbs = adj.get(cur) || [];
          for (const nb of nbs) {
            if (!seenComp.has(nb)) {
              seenComp.add(nb);
              q.push(nb);
            }
          }
        }
        if (comp.length > bestComp.length) bestComp = comp;
      }

      if (bestComp.length < 3) return { path: [], isLoop: false, stationIdx: 0 };
      const compSet = new Set(bestComp);

      // Prefer degree-1 endpoint for linear tracks; otherwise start at top-left corner of loop
      let startKey = bestComp[0];
      const endpoints = bestComp.filter((k) => (adj.get(k) || []).filter((x) => compSet.has(x)).length <= 1);
      if (endpoints.length > 0) {
        endpoints.sort((a, b) => {
          const na = byKey.get(a);
          const nb = byKey.get(b);
          return na.c - nb.c || na.r - nb.r;
        });
        startKey = endpoints[0];
      } else {
        bestComp.sort((a, b) => {
          const na = byKey.get(a);
          const nb = byKey.get(b);
          return na.r - nb.r || na.c - nb.c;
        });
        startKey = bestComp[0];
      }

      const ordered = [];
      const visited = new Set();
      let curr = startKey;
      let prev = null;
      while (curr && !visited.has(curr)) {
        visited.add(curr);
        ordered.push(byKey.get(curr));
        const nbs = (adj.get(curr) || []).filter((k) => compSet.has(k) && !visited.has(k) && k !== prev);
        prev = curr;
        curr = nbs.length > 0 ? nbs[0] : null;
      }

      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const isLoop =
        ordered.length >= 6 &&
        Math.abs(first.r - last.r) + Math.abs(first.c - last.c) === 1;

      // Locate best station stop index closest to `train_platform_*` or `valley_train_station`
      const anchors = platformCells.length > 0 ? platformCells : stationCell ? [stationCell] : [];
      let stationIdx = Math.floor(ordered.length * 0.5);
      if (anchors.length > 0) {
        let bestDist = Infinity;
        for (let i = 0; i < ordered.length; i++) {
          for (let j = 0; j < anchors.length; j++) {
            const d = Math.abs(ordered[i].r - anchors[j].r) + Math.abs(ordered[i].c - anchors[j].c);
            if (d < bestDist) {
              bestDist = d;
              stationIdx = i;
            }
          }
        }
      }

      return { path: ordered, isLoop, stationIdx };
    }

    // =========================================================================
    // All 10 Uphill Lift Systems (`0.0px` Sheave Lock + Surface/Funicular Movers)
    // =========================================================================

    _extractWorldLifts() {
      const w = this.world;
      if (!w || typeof w.getLifts !== "function") return [];
      const raw = w.getLifts() || [];
      const out = [];
      for (let i = 0; i < raw.length; i++) {
        const l = raw[i];
        if (!l) continue;
        const type = l.type || "chairlift";
        const spec = LIFT_SPECS[type] || LIFT_SPECS.chairlift;
        const baseR = l.baseR ?? l.r0 ?? l.towers?.[0]?.r ?? 0;
        const baseC = l.baseC ?? l.c0 ?? l.towers?.[0]?.c ?? 0;
        const topTower = Array.isArray(l.towers) && l.towers.length >= 2 ? l.towers[l.towers.length - 1] : null;
        const topR = l.topR ?? l.r1 ?? topTower?.r ?? baseR;
        const topC = l.topC ?? l.c1 ?? topTower?.c ?? baseC;
        const spanTiles = Math.max(1, Math.hypot(topR - baseR, topC - baseC));
        const baseCell = this._cellFast(baseR, baseC);
        const topCell = this._cellFast(topR, topC);
        const towers = Array.isArray(l.towers) && l.towers.length >= 2
          ? l.towers
          : [
              { r: baseR, c: baseC, level: baseCell ? (baseCell.minLevel ?? baseCell.minLv ?? 0) : 0 },
              { r: topR, c: topC, level: topCell ? (topCell.minLevel ?? topCell.minLv ?? 0) : 0 },
            ];
        out.push({
          id: String(l.id || `${type}_${baseR}_${baseC}_${topR}_${topC}`),
          type,
          spec,
          baseR,
          baseC,
          topR,
          topC,
          spanTiles,
          towers,
          halfSepPx: l.halfSepPx ?? spec.sep,
        });
      }
      return out;
    }

    _resolveTowerWorld(tower, spec, out) {
      const target = out || { wx: 0, wy: 0 };
      if (typeof tower.wx === "number" && typeof tower.wy === "number") {
        target.wx = tower.wx;
        target.wy = tower.wy;
        return target;
      }
      const tr = tower.r || 0;
      const tc = tower.c || 0;
      let lv = tower.level;
      if (lv === undefined) {
        const cFast = this._cellFast(tr, tc);
        lv = cFast ? (cFast.minLevel ?? cFast.minLv ?? 0) : 0;
      }
      target.wx = (tc - tr) * HALF_W;
      target.wy = (tr + tc) * HALF_H + 32 - (lv * ELEV_STEP_Z + spec.zCable) * 4.0;
      return target;
    }

    /**
     * Exact span-wise interpolation matching `js/renderer.js` `_renderAerialLiftNetwork`
     * to 0.000px (`wx = A.wx*(1-local) + B.wx*local ± sep`, `wy = A.wy*(1-local) + B.wy*local + sin(local*PI)*sag`).
     */
    _sampleLiftCable(sys, sNorm, strand = "up", out = null) {
      const { lift } = sys;
      const spec = lift.spec;
      const towers = lift.towers;
      const segs = Math.max(1, towers.length - 1);
      const t = clamp(strand === "up" ? sNorm : 1.0 - sNorm, 0, 1);
      const scaled = t * segs;
      const ti = Math.min(segs - 1, Math.floor(scaled));
      const local = clamp(scaled - ti, 0, 1);

      const tA = towers[ti];
      const tB = towers[ti + 1];
      const pA = this._resolveTowerWorld(tA, spec, this._scratchTowerA);
      const pB = this._resolveTowerWorld(tB, spec, this._scratchTowerB);

      const sep = strand === "up" ? lift.halfSepPx : -lift.halfSepPx;
      const sag = spec.sag || 0;
      const cableWorldX = pA.wx + (pB.wx - pA.wx) * local + sep;
      const cableWorldY = pA.wy + (pB.wy - pA.wy) * local + Math.sin(local * Math.PI) * sag;

      const fR = tA.r + (tB.r - tA.r) * local;
      const fC = tA.c + (tB.c - tA.c) * local;
      const cellR = clamp(Math.round(fR), 0, this._getGridSize() - 1);
      const cellC = clamp(Math.round(fC), 0, this._getGridSize() - 1);
      const u = clamp(4.0 + (fR - cellR) * 8.0, 0.5, 7.5);
      const v = clamp(4.0 + (fC - cellC) * 8.0, 0.5, 7.5);
      const dR = strand === "up" ? tB.r - tA.r : tA.r - tB.r;
      const dC = strand === "up" ? tB.c - tA.c : tA.c - tB.c;
      const heading = velocityToHeading(dR, dC, strand === "up" ? "ne" : "sw");
      const groundZ = this._getSurfaceZUnits(cellR, cellC, u, v);

      const res = out || {
        cableWorldX: 0,
        cableWorldY: 0,
        r: 0,
        c: 0,
        u: 4,
        v: 4,
        groundZ: 0,
        worldZ: 0,
        heading: "ne",
      };
      res.cableWorldX = cableWorldX;
      res.cableWorldY = cableWorldY;
      res.r = cellR;
      res.c = cellC;
      res.u = u;
      res.v = v;
      res.groundZ = groundZ;
      res.worldZ = groundZ + spec.zCable;
      res.heading = heading;
      return res;
    }

    _syncLiftSystems() {
      const lifts = this._extractWorldLifts();
      const activeIds = new Set();
      const liftTops = [];
      const liftBases = [];

      for (let i = 0; i < lifts.length; i++) {
        const lift = lifts[i];
        activeIds.add(lift.id);
        liftTops.push({ r: lift.topR, c: lift.topC, liftId: lift.id, type: lift.type });
        liftBases.push({ r: lift.baseR, c: lift.baseC, liftId: lift.id, type: lift.type });

        if (!this.liftSystems.has(lift.id)) {
          const spec = lift.spec;
          const carriers = [];
          if (spec.isFunicular) {
            carriers.push({
              id: `funi_${lift.id}`,
              phase: (i * 0.27) % 1.0,
              dirSign: 1,
              dwell: 0,
              _moverItem: null,
            });
          } else {
            const perStrand = spec.is3S
              ? Math.max(2, Math.min(4, Math.round(lift.spanTiles / 5.5)))
              : Math.max(2, Math.min(9, Math.round(lift.spanTiles / spec.spacingTiles)));
            const total = spec.aerial ? perStrand * 2 : perStrand;
            for (let k = 0; k < total; k++) {
              carriers.push({
                id: `carrier_${lift.id}_${k}`,
                phase: k / total,
                occupiedUp: k % 4 !== 3, // ~75% occupied uphill for bustling realism
                passengerId: null,
                _moverItem: null,
                _aerialItem: null,
              });
            }
          }
          this.liftSystems.set(lift.id, { lift, carriers });
        } else {
          this.liftSystems.get(lift.id).lift = lift;
        }
      }

      for (const oldId of Array.from(this.liftSystems.keys())) {
        if (!activeIds.has(oldId)) {
          this.liftSystems.delete(oldId);
        }
      }

      this._poi.liftTops = liftTops;
      this._poi.liftBases = liftBases;
      this._updateLiftSystems(0);
    }

    _updateLiftSystems(dt) {
      this.aerialCarriers.length = 0;
      this.surfaceMovers.length = 0;
      const swingFrame = Math.floor(this.simTime * 2.4) % 6;
      const skiFrame = Math.floor(this.simTime * 4.5) % 6;
      const sample = this._scratchCableSample;

      for (const sys of this.liftSystems.values()) {
        const { lift, carriers } = sys;
        const spec = lift.spec;

        if (spec.isFunicular) {
          const car = carriers[0];
          if (dt > 0) {
            if (car.dwell > 0) {
              car.dwell -= dt;
            } else {
              const rate = spec.speedTiles / Math.max(2.5, lift.spanTiles);
              car.phase += car.dirSign * rate * dt;
              if (car.phase >= 1.0) {
                car.phase = 1.0;
                car.dirSign = -1;
                car.dwell = 2.2;
              } else if (car.phase <= 0.0) {
                car.phase = 0.0;
                car.dirSign = 1;
                car.dwell = 2.2;
              }
            }
          }
          const s = this._sampleLiftCable(sys, car.phase, "up", sample);
          const heading = velocityToHeading(
            (lift.topR - lift.baseR) * car.dirSign,
            (lift.topC - lift.baseC) * car.dirSign,
            "ne"
          );
          let mv = car._moverItem;
          if (!mv) {
            mv = {
              uid: 900000 + this.surfaceMovers.length,
              id: car.id,
              spriteType: "funicular_car",
              category: "fleet",
              name: "Cliff Cog Funicular",
              roleLabel: spec.label,
              skill: "Transit",
              heading,
              frame: 0,
              r: s.r,
              c: s.c,
              u: s.u,
              v: s.v,
              z: s.groundZ + 0.35,
              extraZ: 0,
              activityText: "",
              thoughtText: "Effortless Swiss cog-rail ascent from valley to terrace!",
              warmth: 98,
              thrill: 88,
              cashSpent: 0,
              runsCompleted: 0,
              hasHeadlights: false,
              hasLitCabin: true,
              _renderItem: null,
            };
            car._moverItem = mv;
          }
          mv.uid = 900000 + this.surfaceMovers.length;
          mv.roleLabel = spec.label;
          mv.heading = heading;
          mv.frame = car.dwell > 0 ? 0 : swingFrame;
          mv.r = s.r;
          mv.c = s.c;
          mv.u = s.u;
          mv.v = s.v;
          mv.z = s.groundZ + 0.35;
          mv.hasLitCabin = true;
          mv.activityText = car.dwell > 0 ? "Boarding Passengers at Funicular Station" : "Climbing Stepped Cliff Cog Track";
          this.surfaceMovers.push(mv);
          continue;
        }

        const loopLen = Math.max(3, lift.spanTiles * (spec.aerial ? 2.0 : 1.0));
        const phaseRate = spec.speedTiles / loopLen;

        for (let i = 0; i < carriers.length; i++) {
          const cObj = carriers[i];
          if (dt > 0) {
            cObj.phase = (cObj.phase + phaseRate * dt) % 1.0;
          }

          if (!spec.aerial) {
            // Surface conveyor / rope_tow / tbar_lift uphill skiers
            const s = this._sampleLiftCable(sys, cObj.phase, "up", sample);
            const spriteType =
              lift.type === "magic_carpet"
                ? i % 2 === 0
                  ? "ski_school_kid"
                  : "skier_beginner"
                : spec.upSprite;
            let mv = cObj._moverItem;
            if (!mv) {
              mv = {
                uid: 910000 + this.surfaceMovers.length,
                id: cObj.id,
                spriteType,
                category: "guest",
                name: lift.type === "tbar_lift" ? "Glacier T-Bar Pair" : "Surface Lift Rider",
                roleLabel: spec.label,
                skill: lift.type === "tbar_lift" ? "Cruiser" : "Beginner",
                heading: s.heading,
                frame: skiFrame,
                r: s.r,
                c: s.c,
                u: s.u,
                v: s.v,
                z: s.groundZ + (lift.type === "magic_carpet" ? 0.2 : 0.05),
                extraZ: 0,
                activityText: `Riding ${spec.label} Uphill`,
                thoughtText: "Smooth glide up to the top of the piste!",
                warmth: 90,
                thrill: 84,
                cashSpent: 45,
                runsCompleted: 2,
                hasHeadlights: false,
                hasLitCabin: false,
                _renderItem: null,
              };
              cObj._moverItem = mv;
            }
            mv.uid = 910000 + this.surfaceMovers.length;
            mv.spriteType = spriteType;
            mv.roleLabel = spec.label;
            mv.heading = s.heading;
            mv.frame = skiFrame;
            mv.r = s.r;
            mv.c = s.c;
            mv.u = s.u;
            mv.v = s.v;
            mv.z = s.groundZ + (lift.type === "magic_carpet" ? 0.2 : 0.05);
            this.surfaceMovers.push(mv);
            continue;
          }

          // Aerial loop: [0..0.5) uphill, [0.5..1.0) downhill return
          const isUp = cObj.phase < 0.5;
          const sNorm = isUp ? cObj.phase * 2.0 : (cObj.phase - 0.5) * 2.0;
          const strand = isUp ? "up" : "down";
          const s = this._sampleLiftCable(sys, sNorm, strand, sample);

          let entityType = isUp ? spec.upSprite : spec.dnSprite;
          if (
            (lift.type === "chairlift" || lift.type === "classic_2chair") &&
            isUp &&
            !cObj.occupiedUp &&
            !cObj.passengerId
          ) {
            entityType = "chairlift_empty";
          }

          const f = (swingFrame + i) % 6;
          const hasLitCabin = LIT_CABIN_SPRITES.has(entityType);
          let ac = cObj._aerialItem;
          if (!ac) {
            ac = {
              id: cObj.id,
              liftId: lift.id,
              liftType: lift.type,
              strand,
              sNorm,
              entityType,
              dir: s.heading,
              heading: s.heading,
              frame: f,
              spriteKey: `${entityType}_${s.heading}_f${f}`,
              _lastEntityType: entityType,
              _lastHeading: s.heading,
              _lastFrame: f,
              r: s.r,
              c: s.c,
              u: s.u,
              v: s.v,
              worldZ: s.worldZ,
              cableWorldX: s.cableWorldX,
              cableWorldY: s.cableWorldY,
              cableScreenX: s.cableWorldX,
              cableScreenY: s.cableWorldY,
              passengerId: isUp ? cObj.passengerId : null,
              label: spec.label,
              hasLitCabin,
              _lightItem: null,
            };
            cObj._aerialItem = ac;
          } else {
            ac.liftId = lift.id;
            ac.liftType = lift.type;
            ac.strand = strand;
            ac.sNorm = sNorm;
            ac.entityType = entityType;
            ac.dir = s.heading;
            ac.heading = s.heading;
            ac.frame = f;
            ac.hasLitCabin = hasLitCabin;
            if (
              ac._lastEntityType !== entityType ||
              ac._lastHeading !== s.heading ||
              ac._lastFrame !== f
            ) {
              ac._lastEntityType = entityType;
              ac._lastHeading = s.heading;
              ac._lastFrame = f;
              ac.spriteKey = `${entityType}_${s.heading}_f${f}`;
            }
            ac.r = s.r;
            ac.c = s.c;
            ac.u = s.u;
            ac.v = s.v;
            ac.worldZ = s.worldZ;
            ac.cableWorldX = s.cableWorldX;
            ac.cableWorldY = s.cableWorldY;
            ac.cableScreenX = s.cableWorldX;
            ac.cableScreenY = s.cableWorldY;
            ac.passengerId = isUp ? cObj.passengerId : null;
            ac.label = spec.label;
          }
          this.aerialCarriers.push(ac);
        }
      }
    }

    // =========================================================================
    // Bustling Resort Seeder (`seedInitialResortLife()`) — v2 + 11 v3 Species!
    // =========================================================================

    _nextUid() {
      return this._uidCounter++;
    }

    _nextGuestName() {
      const name = GUEST_NAMES[this._nameCursor % GUEST_NAMES.length];
      this._nameCursor++;
      return name;
    }

    _makeActor(opts) {
      const n = this._getGridSize();
      const r = clamp(Math.round(opts.r ?? n - 4), 0, n - 1);
      const c = clamp(Math.round(opts.c ?? Math.floor(n / 2)), 0, n - 1);
      const u = clamp(opts.u ?? 4.0, 0.8, 7.2);
      const v = clamp(opts.v ?? 4.0, 0.8, 7.2);
      const uid = this._nextUid();
      const spriteType = opts.spriteType || "town_shopper";
      const maxFrames = opts.maxFrames || (V3_FOUR_FRAME_ENTITIES.has(spriteType) ? 4 : 6);
      return {
        uid,
        id: opts.id || `${opts.prefix || "actor"}_${uid}`,
        category: opts.category || "guest",
        roleGroup: opts.roleGroup || "village",
        role: opts.role || spriteType,
        spriteType,
        baseSprite: opts.baseSprite || spriteType,
        name: opts.name || this._nextGuestName(),
        roleLabel: opts.roleLabel || "Resort Visitor",
        skill: opts.skill || "Cruiser",
        state: opts.state || "active",
        heading: opts.heading || "sw",
        maxFrames,
        frame: (opts.frame ?? uid) % maxFrames,
        animTimer: (uid * 0.13) % 1.0,
        r,
        c,
        u,
        v,
        z: this._getSurfaceZUnits(r, c, u, v),
        extraZ: opts.extraZ || 0,
        burnerGlow: opts.burnerGlow || 0,
        groundShadowZ: opts.groundShadowZ || 0,
        torchGlow: opts.torchGlow || 0,
        cameraFlash: opts.cameraFlash || 0,
        hasHeadlights:
          opts.hasHeadlights !== undefined
            ? Boolean(opts.hasHeadlights)
            : HEADLIGHT_SPRITES.has(spriteType),
        hasLitCabin:
          opts.hasLitCabin !== undefined
            ? Boolean(opts.hasLitCabin)
            : LIT_CABIN_SPRITES.has(spriteType),
        anchorR: opts.anchorR ?? r,
        anchorC: opts.anchorC ?? c,
        anchorU: opts.anchorU ?? u,
        anchorV: opts.anchorV ?? v,
        targetR: opts.targetR ?? r,
        targetC: opts.targetC ?? c,
        targetU: opts.targetU ?? u,
        targetV: opts.targetV ?? v,
        phase: opts.phase ?? ((uid * 0.37) % (Math.PI * 2)),
        timer: opts.timer ?? (1.5 + (uid % 7) * 0.8),
        subTimer: opts.subTimer ?? 0,
        speed: opts.speed ?? 1.25,
        warmth: opts.warmth ?? 88 + (uid % 12),
        thrill: opts.thrill ?? 84 + (uid % 15),
        cashSpent: opts.cashSpent ?? 45,
        runsCompleted: opts.runsCompleted ?? (uid % 4),
        activityText: opts.activityText || "Exploring Alpine Peak",
        thoughtText: opts.thoughtText || "Crisp mountain air and fresh corduroy!",
        meta: opts.meta || {},
      };
    }

    _pickFrom(arr, idx, fallbackCell) {
      if (arr && arr.length > 0) return arr[idx % arr.length];
      return fallbackCell;
    }

    /**
     * Computes target population scale:
     *   - Full resorts (`zermatt_grand`, `twin_summits`, `night_park`, `glacier_bowl` or >= 3 lifts):
     *     `scale = 1.0` -> ~180+ active entities + sky spectacles + coaster sleds + torchlight parade!
     *   - Starter `fresh_powder` (1 lift, 4 buildings): `scale = 0.42` (~85 active entities)
     *     and grows smoothly up to `1.0` as the player builds lifts & lodges!
     */
    _computeResortScale() {
      const liftCount = this.liftSystems.size;
      const shopCount = this._poi.allShops.length;
      const pisteCount = this._poi.pisteCells.length;
      if (liftCount >= 3 || shopCount >= 8) return 1.0;
      if (liftCount >= 2 || shopCount >= 5) return 0.78;
      return clamp(0.38 + liftCount * 0.14 + Math.min(0.25, pisteCount / 220), 0.4, 1.0);
    }

    seedInitialResortLife() {
      this.guests = [];
      this.ducklingSquads = [];
      this.hockeyMatch = null;
      this.curlingSheets = [];
      this.snowballBouts = [];
      this.crew = [];
      this.wildlife = [];
      this.train = null;
      this.coasterSleds = [];
      this.torchlightParade = [];
      this._torchParadeWaypoints = [];
      this.skySpectacles = [];
      this.liftSystems.clear();
      this.aerialCarriers = [];
      this.surfaceMovers = [];
      this.projectiles = [];
      this.cameraFlashes = [];
      this.floatingPopups = [];
      this._activeFireworks.length = 0;
      this._activeTorchEmbers.length = 0;
      for (let i = 0; i < this._fireworkPool.length; i++) this._fireworkPool[i].active = false;
      for (let i = 0; i < this._torchEmberPool.length; i++) this._torchEmberPool[i].active = false;

      if (!this.world) return;

      this._syncWorldInfrastructure(true);
    }

    _reconcileDynamicPopulations(initial = false) {
      const n = this._getGridSize();
      const poi = this._poi;
      const scale = this._computeResortScale();
      const defaultTown = poi.townCells[0] || { r: n - 4, c: Math.floor(n / 2) };
      const defaultPiste = poi.pisteCells[0] || { r: Math.floor(n * 0.35), c: Math.floor(n / 2) };

      // -----------------------------------------------------------------------
      // 1. Swiss Rack-Railway Train (`alpine_train` — Closed-Loop or Linear!)
      // -----------------------------------------------------------------------
      if (poi.trainPath.length >= 3) {
        if (!this.train) {
          const startIdx = poi.trainIsLoop
            ? (poi.trainStationIdx + 2) % poi.trainPath.length
            : Math.min(2, poi.trainPath.length - 1);
          const cell = poi.trainPath[startIdx];
          this.train = this._makeActor({
            id: "alpine_train_1",
            category: "fleet",
            roleGroup: "fleet",
            role: "train",
            spriteType: "alpine_train",
            name: "Glacier Express Rack-Train",
            roleLabel: poi.trainIsLoop ? "Looped Mountain Rack-Railway" : "Valley Express Railway",
            skill: "Transit",
            state: "cruising",
            r: cell.r,
            c: cell.c,
            u: 4.0,
            v: 4.0,
            heading: "se",
            hasHeadlights: true,
            hasLitCabin: true,
            activityText: "Gliding Over Stone Viaducts & Valley Loop",
            thoughtText: "Next stop: Alpine Peak Valley Depot!",
            meta: {
              pathPos: startIdx,
              dwellTimer: 0,
              cooldownTimer: 0,
              stationLockout: 0,
            },
          });
        }
      } else {
        this.train = null;
      }

      // Refresh torchlight downhill parade spine whenever world topology changes
      this._torchParadeWaypoints = this._buildTorchParadeWaypoints();

      if (!initial) {
        // Reconcile VIP helicopter, Mountain Coaster sleds, Ice Artisans & Slope Photographers on live player builds!
        const hasHeli = this.crew.some((x) => x.role === "vip_helicopter");
        if (poi.helipads.length > 0 && !hasHeli) {
          this._spawnVipHelicopter(poi.helipads[0], true);
        }
        this._reconcileV3DynamicFeatures(false);
        return;
      }

      // -----------------------------------------------------------------------
      // 2. Core Free-Roaming Mountain Skiers, Carvers, Snowboarders & Tubers
      // -----------------------------------------------------------------------
      const mountainQuota = Math.round(35 * scale);
      const mountainTypes = [
        { sprite: "skier_carver", skill: "Cruiser", label: "Blue-Run Carver" },
        { sprite: "skier_expert", skill: "Expert", label: "Black-Diamond Expert" },
        { sprite: "snowboarder", skill: "Freestyle", label: "Terrain-Park Snowboarder" },
        { sprite: "skier_beginner", skill: "Beginner", label: "Green-Run Skier" },
        { sprite: "snow_tuber", skill: "Family", label: "Snow-Tubing Rider" },
      ];
      const slopedPistes = poi.pisteCells.filter((p) => p.avgLv >= 0.5);
      const pistePool = slopedPistes.length > 0 ? slopedPistes : [defaultPiste];

      for (let i = 0; i < mountainQuota; i++) {
        const spec =
          i % 9 === 8 && (poi.tubingCells.length > 0 || i < 4)
            ? mountainTypes[4]
            : mountainTypes[i % 4];
        const isTubing = spec.sprite === "snow_tuber" && poi.tubingCells.length > 0;
        const cell = isTubing
          ? this._pickFrom(poi.tubingCells, i, defaultPiste)
          : this._pickFrom(pistePool, i * 7 + 3, defaultPiste);

        const strolling = i >= Math.round(mountainQuota * 0.72);
        const startCell = strolling ? this._pickFrom(poi.townCells, i * 5, defaultTown) : cell;
        const spr = strolling ? (i % 2 === 0 ? "skier_walking" : "town_shopper") : spec.sprite;

        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: strolling ? "village" : "mountain",
            role: "resort_guest",
            spriteType: spr,
            baseSprite: spec.sprite,
            skill: spec.skill,
            roleLabel: spec.label,
            state: strolling ? "town_stroll" : "skiing",
            r: startCell.r,
            c: startCell.c,
            u: 2.2 + ((i * 1.7) % 3.6),
            v: 2.2 + ((i * 2.3) % 3.6),
            heading: i % 2 === 0 ? "sw" : "se",
            speed: spec.sprite === "skier_expert" ? 2.15 : spec.sprite === "snowboarder" ? 1.95 : 1.65,
            activityText: strolling
              ? "Strolling Heated Village Promenade"
              : spec.sprite === "snow_tuber"
              ? "Spinning Down Banked Snow-Tubing Chute!"
              : `Carving S-Turns Down ${spec.skill} Run`,
            thoughtText:
              spec.sprite === "snowboarder"
                ? "Spotting the next Big-Air kicker and Rainbow C-Box!"
                : "Fresh corduroy under my edges — pure Alpine bliss!",
            meta: {
              carvePhase: i * 0.9,
              carveAmp: spec.sprite === "skier_beginner" ? 1.15 : 0.85,
              jumpTimer: 0,
              jumpDur: 0.65,
              jumpPeakZ: 2.8,
              wipeoutCooldown: 1.5 + (i % 7),
            },
          })
        );
      }

      // -----------------------------------------------------------------------
      // 3. Visible Snaking Lift-Base Queues (`4–6` `skier_walking` per lift!)
      // -----------------------------------------------------------------------
      const bases = poi.liftBases.slice(0, 5);
      const perQueue = scale >= 0.9 ? 4 : 3;
      const corralOffsets = [
        [6.1, 5.2, "ne"],
        [6.7, 3.8, "nw"],
        [7.1, 2.5, "ne"],
        [6.4, 1.6, "se"],
        [5.5, 2.2, "ne"],
      ];
      for (let b = 0; b < bases.length; b++) {
        const base = bases[b];
        const qCellR = clamp(base.r + 1, 0, n - 1);
        const qCellC = clamp(base.c, 0, n - 1);
        for (let slot = 0; slot < perQueue; slot++) {
          const [ou, ov, hd] = corralOffsets[slot % corralOffsets.length];
          this.guests.push(
            this._makeActor({
              category: "guest",
              roleGroup: "lift_queue",
              role: "lift_queue_skier",
              spriteType: "skier_walking",
              baseSprite: "skier_walking",
              skill: slot % 2 === 0 ? "Cruiser" : "Expert",
              roleLabel: "Lift Corral Skier",
              state: "lift_queue",
              r: qCellR,
              c: qCellC,
              u: ou,
              v: ov,
              anchorR: qCellR,
              anchorC: qCellC,
              heading: hd,
              timer: 1.6 + slot * 0.65,
              activityText: `Queuing in Corral for ${LIFT_SPECS[base.type]?.label || "Ski Lift"}`,
              thoughtText: "Line is moving super fast — scanning my RFID ski pass!",
              meta: { slot, totalSlots: perQueue, liftId: base.liftId },
            })
          );
        }
      }

      // -----------------------------------------------------------------------
      // 4. Ski-School "Duckling" Trains (`ski_patrol` + 4 `ski_school_kid`s!)
      // -----------------------------------------------------------------------
      const squadCount = scale >= 0.9 ? 3 : scale >= 0.7 ? 2 : 1;
      const gentlePistes = poi.pisteCells.filter((p) => p.avgLv <= 2.6);
      const duckPool = gentlePistes.length > 0 ? gentlePistes : pistePool;

      for (let s = 0; s < squadCount; s++) {
        const startCell = this._pickFrom(duckPool, s * 11 + 2, defaultPiste);
        const leader = this._makeActor({
          category: "crew",
          roleGroup: "duckling",
          role: "ski_instructor",
          spriteType: "ski_patrol",
          name: `Instructor ${["Beat", "Ursula", "Gian"][s % 3]}`,
          roleLabel: "Swiss Ski-School Instructor",
          skill: "Instructor",
          state: "leading_ducklings",
          r: startCell.r,
          c: startCell.c,
          u: 4.0,
          v: 4.0,
          heading: "sw",
          speed: 1.18,
          activityText: "Leading Ski-School Duckling Wedge Turn Drill",
          thoughtText: "Hands on knees, pizza wedge — great job, little ducklings!",
          meta: { squadIdx: s },
        });
        this.crew.push(leader);

        const trail = [];
        for (let t = 0; t < 36; t++) {
          trail.push({
            r: clamp(startCell.r - Math.floor(t / 12), 0, n - 1),
            c: startCell.c,
            u: clamp(4.0 - (t % 6) * 0.35, 1.2, 6.8),
            v: clamp(4.0 + Math.sin(t * 0.45) * 1.4, 1.2, 6.8),
            heading: "sw",
          });
        }

        const kids = [];
        for (let k = 0; k < 4; k++) {
          const sample = trail[Math.min(trail.length - 1, (k + 1) * 6)];
          const kid = this._makeActor({
            category: "guest",
            roleGroup: "duckling",
            role: "ski_school_kid",
            spriteType: "ski_school_kid",
            baseSprite: "ski_school_kid",
            roleLabel: `Ski-School Duckling #${k + 1}`,
            skill: "Duckling",
            state: "following_instructor",
            r: sample.r,
            c: sample.c,
            u: sample.u,
            v: sample.v,
            heading: sample.heading,
            activityText: "Following Ski School Instructor!",
            thoughtText: k % 2 === 0 ? "Pizza... French fries... Pizza!" : "Look Mom, no poles in my neon bib!",
            meta: { lagSteps: (k + 1) * 6 },
          });
          kids.push(kid);
          this.guests.push(kid);
        }
        this.ducklingSquads.push({ id: `squad_${s}`, leader, kids, trail });
      }

      // -----------------------------------------------------------------------
      // 5. Nordic Cross-Country (`nordic_xc_skier`) & Backcountry (`snowshoer_hiker`)
      // -----------------------------------------------------------------------
      const nordicCount = Math.max(2, Math.round(5 * scale));
      const nordicPool = poi.nordicCells.length > 0 ? poi.nordicCells : poi.snowPlayCells.length > 0 ? poi.snowPlayCells : poi.townCells;
      for (let i = 0; i < nordicCount; i++) {
        const cell = this._pickFrom(nordicPool, i * 3, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "nordic",
            role: "nordic_xc_skier",
            spriteType: "nordic_xc_skier",
            roleLabel: "Nordic Cross-Country Skier",
            skill: "Nordic",
            r: cell.r,
            c: cell.c,
            u: 2.5 + (i % 3) * 1.4,
            v: 2.5 + ((i + 1) % 3) * 1.4,
            speed: 1.38,
            activityText: "Double-Poling Along Groomed Nordic Loop",
            thoughtText: "Rhythmic kick-and-glide through silent snow-laden larches!",
          })
        );
      }

      const snowshoeCount = Math.max(2, Math.round(5 * scale));
      const gladePool = poi.gladeCells.length > 0 ? poi.gladeCells : nordicPool;
      for (let i = 0; i < snowshoeCount; i++) {
        const cell = this._pickFrom(gladePool, i * 4 + 1, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "nordic",
            role: "snowshoer_hiker",
            spriteType: "snowshoer_hiker",
            roleLabel: "Backcountry Snowshoer",
            skill: "Explorer",
            r: cell.r,
            c: cell.c,
            u: 3.0 + (i % 3) * 1.1,
            v: 3.0 + ((i + 2) % 3) * 1.1,
            speed: 0.92,
            activityText: cell.isCave ? "Marveling at Glowing Blue Glacier Ice Cave" : "Trekking Backcountry Powder Glade",
            thoughtText: "Untouched pine glades and shimmering blue glacier ice!",
          })
        );
      }

      // -----------------------------------------------------------------------
      // 6. Frozen Lake & Ice-Rink Social Sports (3v3 Hockey, Curling, Skaters, Zamboni)
      // -----------------------------------------------------------------------
      if (poi.hockeyArena && scale >= 0.65) {
        const ar = poi.hockeyArena;
        const midR = Math.round((ar.minR + ar.maxR) * 0.5);
        const midC = Math.round((ar.minC + ar.maxC) * 0.5);
        const reds = [];
        const blues = [];
        for (let k = 0; k < 3; k++) {
          const rRed = clamp(ar.minR + 1 + (k % 2), ar.minR, ar.maxR);
          const cRed = clamp(midC + (k - 1), 0, n - 1);
          const pRed = this._makeActor({
            category: "guest",
            roleGroup: "rink",
            role: "hockey_player",
            spriteType: "hockey_player_red",
            roleLabel: "Zermatt Red Pond-Hockey Forward",
            skill: "Hockey",
            r: rRed,
            c: cRed,
            u: 2.8 + k * 1.1,
            v: 3.2 + k * 0.9,
            heading: "sw",
            speed: 1.95,
            activityText: "Skating 3v3 Pond Hockey — Stickhandling Puck!",
            thoughtText: "Tape-to-tape pass — top-shelf wrister incoming!",
            meta: { team: "red", slot: k },
          });
          reds.push(pRed);
          this.guests.push(pRed);

          const rBlue = clamp(ar.maxR - 1 - (k % 2), ar.minR, ar.maxR);
          const cBlue = clamp(midC + (1 - k), 0, n - 1);
          const pBlue = this._makeActor({
            category: "guest",
            roleGroup: "rink",
            role: "hockey_player",
            spriteType: "hockey_player_blue",
            roleLabel: "Glacier Blue Pond-Hockey Defender",
            skill: "Hockey",
            r: rBlue,
            c: cBlue,
            u: 3.0 + k * 1.0,
            v: 3.4 + k * 0.8,
            heading: "ne",
            speed: 1.95,
            activityText: "Skating 3v3 Pond Hockey — Poke-Checking!",
            thoughtText: "Protect the crease and break out up the boards!",
            meta: { team: "blue", slot: k },
          });
          blues.push(pBlue);
          this.guests.push(pBlue);
        }

        this.hockeyMatch = {
          arena: ar,
          reds,
          blues,
          allPlayers: reds.concat(blues),
          carrier: reds[0],
          passTimer: 1.9,
          goalCooldown: 4.5,
          puck: {
            id: "hockey_puck_1",
            kind: "puck",
            r: midR,
            c: midC,
            u: 4.0,
            v: 4.0,
            extraZ: 0.05,
            targetR: ar.goalBlue.r,
            targetC: ar.goalBlue.c,
            targetU: 4.0,
            targetV: 4.0,
            inFlight: false,
            flightT: 0,
          },
        };
      }

      // Bavarian Ice Curling (`curling_player` + live `"curling_stone"` projectiles!)
      const curlSource = poi.curlingCells.length > 0 ? poi.curlingCells : poi.rinkCells.slice(0, 2);
      if (curlSource.length > 0) {
        const curlCount = scale >= 0.8 ? 4 : 2;
        for (let i = 0; i < curlCount; i++) {
          const cell = curlSource[i % curlSource.length];
          const isSweeper = i % 2 === 1;
          const player = this._makeActor({
            category: "guest",
            roleGroup: "rink",
            role: "curling_player",
            spriteType: "curling_player",
            roleLabel: isSweeper ? "Bavarian Curling Sweeper" : "Bavarian Curling Skip",
            skill: "Curling",
            r: cell.r,
            c: cell.c,
            u: isSweeper ? 4.4 : 2.1,
            v: 2.6 + (i % 2) * 2.4,
            heading: isSweeper ? "sw" : "se",
            activityText: isSweeper ? "Furiously Sweeping Ice Ahead of Granite Stone!" : "Sliding Polished Granite Curling Stone Toward Button!",
            thoughtText: "Hurry hard!! Curl right onto the bullseye button!",
          });
          this.guests.push(player);
          if (!isSweeper) {
            this.curlingSheets.push({
              id: `curl_sheet_${i}`,
              r: cell.r,
              c: cell.c,
              u: 2.2,
              v: 3.0 + i * 0.8,
              dirU: 1,
              team: i % 4 === 0 ? "red" : "blue",
              progress: (i * 0.45) % 1.0,
              dwell: 0,
            });
          }
        }
      }

      // Figure `ice_skater`s, `penguin_aid_skater` kids, `ice_fisherman` & `mini_zamboni`
      if (poi.rinkCells.length > 0) {
        const skaterCount = Math.max(2, Math.round(6 * scale));
        for (let i = 0; i < skaterCount; i++) {
          const rc = poi.rinkCells[(i * 2) % poi.rinkCells.length];
          this.guests.push(
            this._makeActor({
              category: "guest",
              roleGroup: "rink",
              role: "ice_skater",
              spriteType: "ice_skater",
              roleLabel: "Village Figure Skater",
              skill: "Skater",
              r: rc.r,
              c: rc.c,
              u: 2.5 + (i % 3) * 1.4,
              v: 2.5 + ((i + 1) % 3) * 1.4,
              activityText: "Gliding & Figure-Spinning Across Frozen Lagoon",
              thoughtText: "Lantern reflections shimmering on freshly resurfaced ice!",
            })
          );
        }

        const penguinCount = Math.max(1, Math.round(3 * scale));
        for (let i = 0; i < penguinCount; i++) {
          const rc = poi.rinkCells[(i * 3 + 1) % poi.rinkCells.length];
          this.guests.push(
            this._makeActor({
              category: "guest",
              roleGroup: "rink",
              role: "penguin_aid_skater",
              spriteType: "penguin_aid_skater",
              roleLabel: "Junior Penguin-Aid Skater",
              skill: "Junior",
              r: rc.r,
              c: rc.c,
              u: 3.2 + i * 0.9,
              v: 3.5 + i * 0.7,
              speed: 0.72,
              activityText: "Pushing Orange Penguin Skating Aid on the Rink",
              thoughtText: "Steady, steady — my orange penguin keeps me upright!",
            })
          );
        }

        const fishPool = poi.fishingCells.length > 0 ? poi.fishingCells : [poi.rinkCells[poi.rinkCells.length - 1]];
        const fishCount = scale >= 0.8 ? 2 : 1;
        for (let i = 0; i < fishCount; i++) {
          const fc = fishPool[i % fishPool.length];
          this.guests.push(
            this._makeActor({
              category: "guest",
              roleGroup: "rink",
              role: "ice_fisherman",
              spriteType: "ice_fisherman",
              roleLabel: "Alpine Lake Ice Angler",
              skill: "Angler",
              r: fc.r,
              c: fc.c,
              u: 2.3 + i * 3.1,
              v: 5.8 - i * 2.2,
              heading: i % 2 === 0 ? "se" : "sw",
              activityText: "Jigging Ice-Fishing Rod Beside Auger Hole",
              thoughtText: "Thermos of hot tea and a nibble from an Arctic char!",
            })
          );
        }

        // Compact `mini_zamboni` ice resurfacer
        const zCell = poi.rinkCells[0];
        this.crew.push(
          this._makeActor({
            category: "crew",
            roleGroup: "fleet",
            role: "mini_zamboni",
            spriteType: "mini_zamboni",
            name: "Olympia Mini-Zamboni",
            roleLabel: "Lagoon Ice Resurfacer",
            skill: "Crew",
            r: zCell.r,
            c: zCell.c,
            u: 4.0,
            v: 4.0,
            speed: 0.95,
            activityText: "Polishing Mirror-Glass Ice Sheet Across Rink",
            thoughtText: "Laying down warm floodwater for silky figure-skating blades!",
          })
        );
      }

      // -----------------------------------------------------------------------
      // 7. Seated Outdoor Diners, Schirmbar Reveler Clusters & Snack Queues!
      // -----------------------------------------------------------------------
      const patioPool = poi.patioSpots.length > 0 ? poi.patioSpots : poi.allShops;
      const dinerCount = patioPool.length > 0 ? Math.max(2, Math.round(10 * scale)) : 0;
      const seatOffsets = [
        [5.8, 3.0, "se"],
        [5.8, 5.2, "sw"],
        [3.1, 5.9, "nw"],
        [6.3, 4.1, "ne"],
      ];
      for (let i = 0; i < dinerCount; i++) {
        const spot = patioPool[i % patioPool.length];
        const [su, sv, shd] = seatOffsets[i % seatOffsets.length];
        const dishText =
          spot.id === "niseko_ramen_bar"
            ? "Slurping Steaming Niseko Miso Ramen Outdoors!"
            : spot.id === "waffle_hut"
            ? "Enjoying Hot Belgian Waffles & Gluhwein on Sun Deck!"
            : "Sharing Swiss Cheese Fondue Outdoors!";
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "dining",
            role: "outdoor_diner",
            spriteType: "outdoor_diner",
            roleLabel: "Sun-Terrace Patio Diner",
            skill: "Gourmet",
            r: spot.r,
            c: spot.c,
            u: su,
            v: sv,
            heading: shd,
            warmth: 98,
            activityText: dishText,
            thoughtText: "Bubbling Gruyere fondue under glowing patio heat lamps!",
            meta: { spotId: spot.id },
          })
        );
      }

      const revPool = poi.revelerSpots.length > 0 ? poi.revelerSpots : patioPool;
      const revCount = revPool.length > 0 ? Math.max(3, Math.round(11 * scale)) : 0;
      for (let i = 0; i < revCount; i++) {
        const hub = revPool[Math.floor(i / 3) % revPool.length];
        const angle = (i % 4) * (Math.PI * 0.5) + 0.4;
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "apres",
            role: "apres_reveler",
            spriteType: "apres_reveler",
            roleLabel: "Apres-Ski Schirmbar Reveler",
            skill: "Apres",
            r: hub.r,
            c: hub.c,
            u: clamp(4.4 + Math.cos(angle) * 2.1, 1.4, 6.8),
            v: clamp(4.4 + Math.sin(angle) * 2.1, 1.4, 6.8),
            heading: i % 2 === 0 ? "sw" : "se",
            warmth: 96,
            activityText: "Clinking Gluhwein & Craft Steins at Apres-Ski!",
            thoughtText: "Prost! Best powder day of the winter!",
            meta: { hubId: hub.id },
          })
        );
      }

      const snackPool = poi.snackSpots.length > 0 ? poi.snackSpots : poi.allShops.slice(0, 3);
      const snackKiosks = snackPool.slice(0, scale >= 0.9 ? 3 : 1);
      for (let k = 0; k < snackKiosks.length; k++) {
        const kiosk = snackKiosks[k];
        const qR = clamp(kiosk.r + 1, 0, n - 1);
        const qC = kiosk.c;
        for (let slot = 0; slot < 3; slot++) {
          this.guests.push(
            this._makeActor({
              category: "guest",
              roleGroup: "snack_queue",
              role: "snack_queue_guest",
              spriteType: "town_shopper",
              roleLabel: "Village Snack-Stand Shopper",
              skill: "Foodie",
              r: qR,
              c: qC,
              u: clamp(2.1 + slot * 1.9, 1.5, 6.6),
              v: clamp(3.6 + (slot % 2) * 0.9, 1.5, 6.6),
              heading: "ne",
              timer: 2.4 + slot * 1.5 + k * 0.9,
              activityText: `Queuing for Fresh Treats at ${SHOP_PRICES[kiosk.id]?.act?.replace(/^[A-Za-z]+ /, "") || "Kiosk"}`,
              thoughtText: "Can smell the roasted chestnuts, cocoa, and warm strudel!",
              meta: { kioskR: kiosk.r, kioskC: kiosk.c, kioskId: kiosk.id, slot },
            })
          );
        }
      }

      // -----------------------------------------------------------------------
      // 8. Snowball Fights, Snowmen, Selfies, Sleds, Hot Tubs, Alphorns & Luggage!
      // -----------------------------------------------------------------------
      const snowFieldPool = poi.snowPlayCells.length > 0 ? poi.snowPlayCells : poi.townCells;
      const boutCount = scale >= 0.8 ? 2 : 1;
      for (let b = 0; b < boutCount; b++) {
        const center = this._pickFrom(snowFieldPool, b * 9 + 3, defaultTown);
        const kids = [];
        const triOffsets = [
          [2.0, 2.2, "se"],
          [6.0, 5.8, "nw"],
          [2.3, 5.9, "sw"],
        ];
        for (let k = 0; k < 3; k++) {
          const [ku, kv, khd] = triOffsets[k];
          const kid = this._makeActor({
            category: "guest",
            roleGroup: "snowplay",
            role: "snowball_kid",
            spriteType: "snowball_kid",
            roleLabel: "Playful Snowball-Fight Kid",
            skill: "Playful",
            r: center.r,
            c: center.c,
            u: ku,
            v: kv,
            heading: khd,
            activityText: "Packing & Tossing Arcing Snowballs with Friends!",
            thoughtText: "Duck behind the snowbank — incoming powder snowball!",
          });
          kids.push(kid);
          this.guests.push(kid);
        }
        this.snowballBouts.push({
          id: `bout_${b}`,
          r: center.r,
          c: center.c,
          kids,
          throwTimer: 0.5 + b * 0.7,
        });
      }

      // `snowman_builder`
      const smPool = poi.snowmanSpots.length > 0 ? poi.snowmanSpots : snowFieldPool;
      const smCount = scale >= 0.8 ? 2 : 1;
      for (let i = 0; i < smCount; i++) {
        const sp = this._pickFrom(smPool, i * 2, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "snowplay",
            role: "snowman_builder",
            spriteType: "snowman_builder",
            roleLabel: "Family Snowman Sculptor",
            skill: "Creative",
            r: sp.r,
            c: sp.c,
            u: 5.7,
            v: 2.8 + i * 1.8,
            heading: "ne",
            activityText: "Rolling Giant Snowball & Adding Carrot Nose!",
            thoughtText: "Just needs a wool scarf and pine-cone buttons!",
          })
        );
      }

      // `selfie_tourist` snapping camera star-flashes (`getCameraFlashes()`)!
      const selfiePool = poi.selfieSpots.length > 0 ? poi.selfieSpots : poi.townCells;
      const selfieCount = Math.max(2, Math.round(5 * scale));
      for (let i = 0; i < selfieCount; i++) {
        const sp = this._pickFrom(selfiePool, i * 2, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "selfie_tourist",
            spriteType: "selfie_tourist",
            roleLabel: "Panoramic Selfie Photographer",
            skill: "Tourist",
            r: sp.r,
            c: sp.c,
            u: 5.5,
            v: 5.2 - (i % 3) * 1.2,
            heading: i % 2 === 0 ? "ne" : "nw",
            timer: 1.2 + i * 0.95,
            activityText: `Snapping Panorama Photos at ${sp.id ? sp.id.replace(/_/g, " ") : "Summit View"}`,
            thoughtText: "Say 'Fondue'! Wait till everyone sees this Matterhorn view!",
          })
        );
      }

      // `parent_pulling_sled` & `dog_walker`
      const familyCount = Math.max(1, Math.round(3 * scale));
      for (let i = 0; i < familyCount; i++) {
        const tc = this._pickFrom(poi.townCells, i * 6 + 2, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "parent_pulling_sled",
            spriteType: "parent_pulling_sled",
            roleLabel: "Parent Pulling Wooden Toboggan",
            skill: "Family",
            r: tc.r,
            c: tc.c,
            speed: 0.95,
            activityText: "Pulling Cozy Wooden Sled Along Village Lane",
            thoughtText: "Next stop: hot cocoa and the twinkling holiday spruce!",
          })
        );

        const dc = this._pickFrom(poi.townCells, i * 6 + 5, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "dog_walker",
            spriteType: "dog_walker",
            roleLabel: "Alpine Dog Walker",
            skill: "Local",
            r: dc.r,
            c: dc.c,
            speed: 1.05,
            activityText: "Walking Happy Mountain Pup Through Snowflakes",
            thoughtText: "He loves bounding into every fresh snowdrift!",
          })
        );
      }

      // `hottub_bather` visibly bobbing inside `cedar_hottub` / `barrel_sauna` / `thermal_spring` / `thermal_spa_2x2`
      if (poi.hottubSpots.length > 0) {
        const bathCount = Math.min(5, Math.max(1, Math.round(4 * scale)));
        for (let i = 0; i < bathCount; i++) {
          const hs = poi.hottubSpots[i % poi.hottubSpots.length];
          this.guests.push(
            this._makeActor({
              category: "guest",
              roleGroup: "spa",
              role: "hottub_bather",
              spriteType: "hottub_bather",
              roleLabel: "Thermal Spa & Hot-Tub Bather",
              skill: "Wellness",
              r: hs.r,
              c: hs.c,
              u: 3.8 + (i % 2) * 0.9,
              v: 3.8 + ((i + 1) % 2) * 0.9,
              heading: i % 2 === 0 ? "sw" : "se",
              warmth: 100,
              activityText: "Soaking in Steaming Mineral Hot Tub in Wool Beanie",
              thoughtText: "40°C mineral steam while snowflakes melt on my nose!",
            })
          );
        }
      }

      // `alphorn_musician` on `alphorn_band_stage`
      const hornPool = poi.alphornSpots.length > 0 ? poi.alphornSpots : [defaultTown];
      const hornCount = poi.alphornSpots.length > 0 ? 2 : 1;
      for (let i = 0; i < hornCount; i++) {
        const hs = hornPool[i % hornPool.length];
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "alphorn_musician",
            spriteType: "alphorn_musician",
            roleLabel: "Traditional Swiss Alphorn Trio",
            skill: "Musician",
            r: hs.r,
            c: hs.c,
            u: 3.4 + i * 1.8,
            v: 4.5,
            heading: "sw",
            timer: 5.0 + i * 4.0,
            activityText: "Blowing Deep Resonant Swiss Alphorn Harmonies",
            thoughtText: "Echoing traditional Valais horn chords off the granite peaks!",
          })
        );
      }

      // `traveler_luggage`: Wave of 6–8 newly arrived tourists rolling suitcases from station -> hotels!
      const lugOrigin =
        poi.platformCells[0] ||
        poi.stationCell ||
        this._pickFrom(poi.townCells, 0, defaultTown);
      const lugCount = Math.max(2, Math.round(7 * scale));
      for (let i = 0; i < lugCount; i++) {
        const hotel = this._pickFrom(poi.hotels, i, defaultTown);
        const startC = i < 3 ? lugOrigin : this._pickFrom(poi.townCells, i * 4 + 1, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "traveler_luggage",
            spriteType: "traveler_luggage",
            roleLabel: "Arriving Rail-Depot Traveler",
            skill: "Arrival",
            r: startC.r,
            c: startC.c,
            targetR: hotel.r,
            targetC: hotel.c,
            speed: 1.02,
            activityText: `Rolling Wheeled Suitcase Toward ${hotel.id ? hotel.id.replace(/_2x2|_/g, " ") : "Chalet"}`,
            thoughtText: "Just stepped off the Swiss cogwheel train — can't wait to check in!",
            meta: { hotelId: hotel.id || "grand_hotel_2x2" },
          })
        );
      }

      // -----------------------------------------------------------------------
      // 9. Resort Fleet, Groundskeepers & High-Peak Alpine Wildlife
      // -----------------------------------------------------------------------
      // `snow_shoveler` clearing walkways
      const shovelerCount = scale >= 0.8 ? 2 : 1;
      for (let i = 0; i < shovelerCount; i++) {
        const sc = this._pickFrom(poi.townCells, i * 11 + 3, defaultTown);
        this.crew.push(
          this._makeActor({
            category: "crew",
            roleGroup: "crew",
            role: "snow_shoveler",
            spriteType: "snow_shoveler",
            name: `Keeper ${["Reto", "Sepp"][i % 2]}`,
            roleLabel: "Promenade Snowkeeper",
            skill: "Crew",
            r: sc.r,
            c: sc.c,
            speed: 0.65,
            activityText: "Shoveling Fresh Powder Off Heated Stone Steps",
            thoughtText: "Keeping every chalet doorway crisp, dry, and slip-free!",
          })
        );
      }

      // `piste_groomer` & `winch_cat_yellow`
      const groomHome = poi.shopsByType.groomer_garage?.[0] || defaultPiste;
      this.crew.push(
        this._makeActor({
          category: "crew",
          roleGroup: "fleet",
          role: "groomer",
          spriteType: "piste_groomer",
          name: "PistenBully 600 Polar",
          roleLabel: "Corduroy Piste Groomer",
          skill: "Fleet",
          r: groomHome.r,
          c: groomHome.c,
          speed: 1.15,
          activityText: "Laying Fresh Velvet Corduroy Across Main Pistes",
          thoughtText: "Diesel purring — sculpting 100% corduroy perfection!",
        })
      );

      if (poi.shopsByType.winch_cat_bay?.length > 0 || poi.steepCells.length >= 4) {
        const winchHome = poi.shopsByType.winch_cat_bay?.[0] || poi.steepCells[0] || defaultPiste;
        this.crew.push(
          this._makeActor({
            category: "crew",
            roleGroup: "fleet",
            role: "winch_cat",
            spriteType: "winch_cat_yellow",
            name: "Yellow Steep-Chute Winch Cat",
            roleLabel: "Couloir Winch Groomer",
            skill: "Fleet",
            r: winchHome.r,
            c: winchHome.c,
            speed: 0.98,
            activityText: "Winch-Grooming Steep Black-Diamond Mogul Couloir",
            thoughtText: "4-ton crane winch anchored firmly to the summit ridge!",
          })
        );
      }

      // Roaming `ski_patrol` & `snowmobile`
      const patrolHome = poi.shopsByType.ski_patrol_hut?.[0] || defaultPiste;
      this.crew.push(
        this._makeActor({
          category: "crew",
          roleGroup: "crew",
          role: "ski_patrol",
          spriteType: "ski_patrol",
          name: "Patrol Captain Moritz",
          roleLabel: "Mountain Rescue Ski Patrol",
          skill: "Rescue",
          r: patrolHome.r,
          c: patrolHome.c,
          speed: 1.85,
          activityText: "Sweeping High-Mountain Couloirs & Safety Nets",
          thoughtText: "Radio clear — watching over every beginner and expert!",
        })
      );

      const sledPad = poi.shopsByType.snowmobile_pad?.[0] || patrolHome;
      this.crew.push(
        this._makeActor({
          category: "crew",
          roleGroup: "fleet",
          role: "snowmobile",
          spriteType: "snowmobile",
          name: "Rescue Lynx Snowmobile",
          roleLabel: "Rapid-Response Patrol Sled",
          skill: "Rescue",
          r: sledPad.r,
          c: sledPad.c,
          speed: 2.15,
          activityText: "Patrolling Ridge Traverses on Rescue Snowmobile",
          thoughtText: "Ready to zip to any yard-sale wipeout in seconds!",
        })
      );

      // `horse_sleigh` & `ski_shuttle_bus`
      const sleighHome = poi.sleighStands[0] || poi.roadCells[0] || defaultTown;
      this.crew.push(
        this._makeActor({
          category: "crew",
          roleGroup: "fleet",
          role: "horse_sleigh",
          spriteType: "horse_sleigh",
          name: "Zermatt Velvet Horse-Sleigh",
          roleLabel: "Scenic Village Sleigh Tour",
          skill: "Transit",
          r: sleighHome.r,
          c: sleighHome.c,
          speed: 1.08,
          timer: 9.0,
          activityText: "Trotting Jingling Horse-Drawn Sleigh Along Village Avenue",
          thoughtText: "Wool lap-blankets and silver sleigh bells in the twilight!",
        })
      );

      if (poi.roadCells.length > 0 || poi.busStops.length > 0) {
        const busHome = poi.busStops[0] || poi.roadCells[0];
        this.crew.push(
          this._makeActor({
            category: "crew",
            roleGroup: "fleet",
            role: "ski_shuttle_bus",
            spriteType: "ski_shuttle_bus",
            name: "E-Alpin Ski-Shuttle Bus",
            roleLabel: "Zero-Emission Resort Shuttle",
            skill: "Transit",
            r: busHome.r,
            c: busHome.c,
            speed: 1.48,
            timer: 11.0,
            activityText: "Shutting Skiers Between Chalets & Base Terminals",
            thoughtText: "Whisper-quiet electric drive with heated ski racks!",
          })
        );
      }

      // `vip_helicopter` on `summit_helipad`
      if (poi.helipads.length > 0) {
        this._spawnVipHelicopter(poi.helipads[0], false);
      }

      // Wildlife: `st_bernard`, `alpine_ibex`, `red_deer`, and high-soaring `golden_eagle`!
      const dogHome = poi.shopsByType.rescue_clinic?.[0] || patrolHome;
      this.wildlife.push(
        this._makeActor({
          category: "wildlife",
          roleGroup: "wildlife",
          role: "st_bernard",
          spriteType: "st_bernard",
          name: "Barry the St. Bernard",
          roleLabel: "Alpine Rescue Mascot Dog",
          skill: "Mascot",
          r: dogHome.r,
          c: dogHome.c,
          speed: 0.85,
          activityText: "Trotting Cheerfully with Cedar Rescue Barrel",
          thoughtText: "Woof! Plenty of ear scratches at the waffle deck!",
        })
      );

      const cragPool = poi.cragCells.length > 0 ? poi.cragCells : [defaultPiste];
      for (let i = 0; i < 2; i++) {
        const cc = this._pickFrom(cragPool, i * 5, defaultPiste);
        this.wildlife.push(
          this._makeActor({
            category: "wildlife",
            roleGroup: "wildlife",
            role: "alpine_ibex",
            spriteType: "alpine_ibex",
            name: i === 0 ? "Matterhorn Bull Ibex" : "granite Ridge Ibex".replace(/^g/, "G"),
            roleLabel: "High-Summit Alpine Ibex",
            skill: "Wildlife",
            r: cc.r,
            c: cc.c,
            speed: 0.95,
            activityText: "Bounding Effortlessly Across Lv 4 Granite Crags",
            thoughtText: "Surveying the entire valley from the highest spire!",
          })
        );
      }

      const deerPool = poi.feedingCells.length > 0 ? poi.feedingCells : gladePool;
      for (let i = 0; i < 2; i++) {
        const dc = this._pickFrom(deerPool, i * 3, defaultTown);
        this.wildlife.push(
          this._makeActor({
            category: "wildlife",
            roleGroup: "wildlife",
            role: "red_deer",
            spriteType: "red_deer",
            name: i === 0 ? "Antlered Alpine Stag" : "Forest Hind Deer",
            roleLabel: "Timberline Red Deer",
            skill: "Wildlife",
            r: dc.r,
            c: dc.c,
            speed: 0.78,
            activityText: poi.feedingCells.length > 0
              ? "Grazing Sweet Hay at Timber Wildlife Feeding Rack"
              : "Foraging Quietly Beneath Frosted Larch Groves",
            thoughtText: "Peaceful winter sanctuary at the edge of the pines!",
          })
        );
      }

      const eyrie = poi.eyrieCells[0] || { r: 2, c: Math.floor(n * 0.48) };
      for (let i = 0; i < 2; i++) {
        this.wildlife.push(
          this._makeActor({
            category: "wildlife",
            roleGroup: "wildlife",
            role: "golden_eagle",
            spriteType: "golden_eagle",
            name: i === 0 ? "Summit Golden Eagle" : "Glacier Thermal Eagle",
            roleLabel: "High-Altitude Golden Eagle",
            skill: "Apex",
            r: clamp(eyrie.r + 2 + i * 2, 1, n - 2),
            c: clamp(eyrie.c + (i === 0 ? -2 : 3), 1, n - 2),
            anchorR: clamp(eyrie.r + 3, 2, n - 3),
            anchorC: clamp(eyrie.c, 3, n - 4),
            extraZ: 19.4 + i * 1.1,
            phase: i * Math.PI,
            activityText: "Soaring Wide Thermal Figure-Eights Above Summit Eyrie",
            thoughtText: "Riding crisp updrafts high above the 3S tramway cables!",
          })
        );
      }

      // -----------------------------------------------------------------------
      // 10. Alpine Peak v3 — 11 New Living Sky, Slope, Ride & Festival Species!
      // -----------------------------------------------------------------------
      // 10a. `hot_air_balloon` (3 colorful balloons drifting across upper-mid valley, extraZ 16..20)
      const balloonNames = [
        "Montgolfiere 'Alpenrose'",
        "Helvetia Sky-Balloon",
        "Matterhorn Gold Balloon",
      ];
      for (let i = 0; i < 3; i++) {
        const bAnchorR = clamp(Math.round(n * (0.28 + i * 0.16)), 4, n - 6);
        const bAnchorC = clamp(Math.round(n * (0.24 + i * 0.25)), 4, n - 6);
        const initZ = 16.6 + i * 1.4;
        this.skySpectacles.push(
          this._makeActor({
            id: `hot_air_balloon_${i + 1}`,
            category: "aerial",
            roleGroup: "sky",
            role: "hot_air_balloon",
            spriteType: "hot_air_balloon",
            maxFrames: 4,
            name: balloonNames[i],
            roleLabel: "Alpine Hot-Air Balloon",
            skill: "Scenic",
            r: bAnchorR,
            c: bAnchorC,
            anchorR: bAnchorR,
            anchorC: bAnchorC,
            u: 4.0,
            v: 4.0,
            extraZ: initZ,
            groundShadowZ: initZ,
            burnerGlow: i === 0 ? 1.0 : 0.0,
            frame: i === 0 ? 2 : i % 2,
            phase: i * 2.1,
            activityText: i === 0 ? "Firing Propane Burner Above Sunlit Glacier Valley!" : "Drifting Peacefully Over Chalets & Spruces",
            thoughtText: "360-degree panorama from Matterhorn crags down to the Ferris wheel!",
            meta: {
              baseZ: initZ,
              orbitR: 2.6 + i * 0.45,
              orbitC: 3.8 + i * 0.65,
              burnerCycle: i * 2.7,
              burnerForceTimer: i === 0 ? 1.4 : 0,
            },
          })
        );
      }

      // 10b. `alpine_paraglider` (3 tandem paragliders launching near Lv 4 peaks in figure-8s, extraZ 11..15)
      const gliderNames = [
        "Tandem Wing 'Adler'",
        "Glacier Thermal Glider",
        "Valais Sky-Paraglider",
      ];
      const launchPool = poi.peakLaunchCells.length > 0 ? poi.peakLaunchCells : [{ r: 4, c: Math.floor(n * 0.5) }];
      for (let i = 0; i < 3; i++) {
        const lp = this._pickFrom(launchPool, i * 7 + 2, { r: 5, c: Math.floor(n * 0.5) });
        const gAnchorR = clamp(lp.r + 3 + i * 2, 4, n - 7);
        const gAnchorC = clamp(lp.c + (i - 1) * 3, 4, n - 5);
        const initZ = 11.8 + i * 1.35;
        this.skySpectacles.push(
          this._makeActor({
            id: `alpine_paraglider_${i + 1}`,
            category: "aerial",
            roleGroup: "sky",
            role: "alpine_paraglider",
            spriteType: "alpine_paraglider",
            maxFrames: 4,
            name: gliderNames[i],
            roleLabel: "Summit Tandem Paraglider",
            skill: "Aerial",
            r: gAnchorR,
            c: gAnchorC,
            anchorR: gAnchorR,
            anchorC: gAnchorC,
            u: 4.0,
            v: 4.0,
            extraZ: initZ,
            groundShadowZ: initZ,
            phase: i * 2.09,
            activityText: "Carving Banking Figure-Eights on Ridge Updrafts!",
            thoughtText: "Nothing between our boots and the snow-dusted pines below!",
            meta: {
              baseZ: initZ,
              figR: 2.8 + (i % 2) * 0.5,
              figC: 4.2 + i * 0.4,
            },
          })
        );
      }

      // 10c. `torchlight_skier` (Synchronized 10-instructor flare snake for Alpenglow, Night & Finale!)
      const torchNames = [
        "Instructor Kaspar",
        "Instructor Heidi",
        "Instructor Flurin",
        "Instructor Seraina",
        "Instructor Dario",
        "Instructor Ladina",
        "Instructor Andri",
        "Instructor Nina",
        "Instructor Corsin",
        "Instructor Saskia",
      ];
      const spine = this._torchParadeWaypoints;
      const spineLen = Math.max(2, spine.length);
      for (let i = 0; i < 10; i++) {
        const sPos = (i * 0.65) % spineLen;
        const wp = spine[Math.floor(sPos) % spine.length] || defaultPiste;
        this.torchlightParade.push(
          this._makeActor({
            id: `torchlight_skier_${i + 1}`,
            category: "crew",
            roleGroup: "torchlight",
            role: "torchlight_skier",
            spriteType: "torchlight_skier",
            maxFrames: 4,
            name: torchNames[i],
            roleLabel: "Torchlight Parade Instructor",
            skill: "Master",
            r: wp.r,
            c: wp.c,
            u: 4.0,
            v: 4.0,
            heading: "sw",
            torchGlow: 0.94,
            warmth: 98,
            thrill: 97,
            activityText: "Carving Synchronized S-Turns in Glowing Torchlight Snake!",
            thoughtText: "Hold exact formation — golden magnesium flares lighting the corduroy!",
            meta: {
              slot: i,
              spinePos: sPos,
              emberTimer: (i * 0.03) % 0.14,
            },
          })
        );
      }

      // 10d. `retro_neon_skier` (5 flashy 80s neon freestyle skiers ripping pistes & park kickers!)
      const neonNames = [
        "Neon-Viper Rico",
        "Magenta-Blaze Trixie",
        "Turbo-Daffy Jean-Luc",
        "Laser-Carve Bianca",
        "Synth-Shred Sven",
      ];
      for (let i = 0; i < 5; i++) {
        const pc = this._pickFrom(pistePool, i * 9 + 4, defaultPiste);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "mountain",
            role: "resort_guest",
            spriteType: "retro_neon_skier",
            baseSprite: "retro_neon_skier",
            maxFrames: 4,
            name: neonNames[i],
            roleLabel: "80s Neon Freestyle Skier",
            skill: "80s Neon",
            state: "skiing",
            r: pc.r,
            c: pc.c,
            u: 2.6 + (i % 3) * 1.3,
            v: 2.8 + ((i + 1) % 3) * 1.2,
            heading: i % 2 === 0 ? "sw" : "se",
            speed: 2.08,
            thrill: 98,
            activityText: "Ripping Hot-Dog Moguls & Popping Spread-Eagle Jumps!",
            thoughtText: "1988 Valais Freestyle Cup vibes — watch this Daffy split!",
            meta: {
              carvePhase: i * 1.15,
              carveAmp: 1.05,
              jumpTimer: 0,
              jumpDur: 0.72,
              jumpPeakZ: 3.1,
              wipeoutCooldown: 999,
              rollerTimer: 2.2 + i * 1.3,
            },
          })
        );
      }

      // 10e. `davos_toboggan_pair` (4 parent+kid wooden sled pairs sliding gentle chutes & trudging back!)
      const sledNames = [
        "Papa Marc & Little Leo",
        "Mama Nadia & Mia",
        "Uncle Stefan & Noah",
        "Auntie Clara & Leni",
      ];
      const sledLanePool =
        poi.tubingCells.length >= 2
          ? poi.tubingCells
          : poi.gentlePisteCells.length > 0
          ? poi.gentlePisteCells
          : pistePool;
      for (let i = 0; i < 4; i++) {
        const topSled = this._pickFrom(sledLanePool, i * 3, defaultPiste);
        const topR = clamp(topSled.r, 1, n - 5);
        const botR = clamp(topR + 3, topR + 1, n - 3);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "mountain",
            role: "davos_toboggan_pair",
            spriteType: "davos_toboggan_pair",
            baseSprite: "davos_toboggan_pair",
            maxFrames: 4,
            name: sledNames[i],
            roleLabel: "Davos Wooden Sled Pair",
            skill: "Toboggan",
            state: i % 2 === 0 ? "sliding" : "trudging",
            r: i % 2 === 0 ? topR : botR,
            c: topSled.c,
            anchorR: topR,
            anchorC: topSled.c,
            targetR: botR,
            targetC: topSled.c,
            u: 3.2 + (i % 2) * 1.6,
            v: 3.0 + (i % 3) * 1.0,
            heading: i % 2 === 0 ? "sw" : "ne",
            speed: 1.62,
            activityText:
              i % 2 === 0
                ? "Whooshing Down Banked Snow Chute on Ash-Wood Davos Sled!"
                : "Hiking Back Up Gentle Run for Another Toboggan Slide!",
            thoughtText: "Hold tight to the steering strap — snow spray everywhere!",
          })
        );
      }

      // 10f. `husky_dogsled` (2 Arctic husky dog-sled teams cruising nordic_track / packed_snow_path!)
      const huskyPool =
        poi.huskyTrailCells.length > 0
          ? poi.huskyTrailCells
          : poi.nordicCells.length > 0
          ? poi.nordicCells
          : poi.townCells;
      for (let i = 0; i < 2; i++) {
        const hc = this._pickFrom(huskyPool, i * 7 + 1, defaultTown);
        this.crew.push(
          this._makeActor({
            category: "crew",
            roleGroup: "fleet",
            role: "husky_dogsled",
            spriteType: "husky_dogsled",
            maxFrames: 4,
            name: i === 0 ? "Yukon Star Husky Team" : "Glacier Trail Mushers",
            roleLabel: "Arctic Husky Dog-Sled Team",
            skill: "Mushing",
            r: hc.r,
            c: hc.c,
            u: 3.5 + i * 1.2,
            v: 3.8,
            speed: 1.44,
            timer: 10.5 + i * 5.0,
            activityText: "Mushing Eager Siberian Huskies Along Packed Snow Trail!",
            thoughtText: "Hike! Hike! Warm fur blankets and brass sled lantern aglow!",
          })
        );
      }

      // 10g. `yeti_mascot` (2 friendly resort Yetis waving & posing for YETI SELFIEs!)
      const festPool = poi.festivalCells.length > 0 ? poi.festivalCells : poi.townCells;
      for (let i = 0; i < 2; i++) {
        const yc = this._pickFrom(festPool, i * 5 + 1, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "yeti_mascot",
            spriteType: "yeti_mascot",
            maxFrames: 4,
            name: i === 0 ? "Fluffy the Matterhorn Yeti" : "Bobo the Glacier Yeti",
            roleLabel: "Friendly Alpine Yeti Mascot",
            skill: "Mascot",
            r: yc.r,
            c: yc.c,
            u: 4.2,
            v: 3.8 + i * 1.1,
            speed: 0.82,
            timer: 3.4 + i * 2.2,
            activityText: "Strolling Festival Plaza & High-Fiving Kids!",
            thoughtText: "Big fluffy wave for the camera — YETI SELFIE time!",
            meta: { waveTimer: 0 },
          })
        );
      }

      // 10h. `festival_parade_trio` (2 Swiss cowbell, accordion & star-lantern folk trios!)
      for (let i = 0; i < 2; i++) {
        const fc = this._pickFrom(festPool, i * 6 + 3, defaultTown);
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "festival_parade_trio",
            spriteType: "festival_parade_trio",
            maxFrames: 4,
            name: i === 0 ? "Valais Trycheln & Accordion Trio" : "Zermatt Star-Lantern Folk Band",
            roleLabel: "Swiss Cowbell & Accordion Trio",
            skill: "Folk Band",
            r: fc.r,
            c: fc.c,
            u: 3.8,
            v: 4.2,
            speed: 0.76,
            timer: 5.2 + i * 3.1,
            activityText: "Ringing Brass Trycheln Cowbells & Playing Polka Harmonies!",
            thoughtText: "♪ ♫ Festive Alpine melodies warming the winter market!",
          })
        );
      }

      // 10i-k. `coaster_sled` (3–4), `ice_artisan` (2), and `slope_photographer` (3)
      this._reconcileV3DynamicFeatures(true);
    }

    _buildTorchParadeWaypoints() {
      const n = this._getGridSize();
      const pistes = this._poi.pisteCells;
      if (!pistes || pistes.length < 4) {
        const fallback = [];
        const midC = Math.floor(n * 0.5);
        for (let r = 3; r <= Math.max(6, n - 7); r++) {
          fallback.push({ r, c: midC });
        }
        return fallback;
      }

      const byRow = new Map();
      let minR = n;
      let maxR = 0;
      for (let i = 0; i < pistes.length; i++) {
        const p = pistes[i];
        if (p.r < minR) minR = p.r;
        if (p.r > maxR) maxR = p.r;
        let arr = byRow.get(p.r);
        if (!arr) {
          arr = [];
          byRow.set(p.r, arr);
        }
        arr.push(p);
      }

      const topRow = byRow.get(minR) || [pistes[0]];
      let curC = topRow[Math.floor(topRow.length * 0.5)].c;
      const spine = [];
      for (let r = minR; r <= maxR; r++) {
        const rowCells = byRow.get(r);
        if (rowCells && rowCells.length > 0) {
          let best = rowCells[0];
          let bestScore = Infinity;
          for (let j = 0; j < rowCells.length; j++) {
            const cand = rowCells[j];
            const dist = Math.abs(cand.c - curC) + (cand.surface === "groomed_piste" ? 0 : 0.8);
            if (dist < bestScore) {
              bestScore = dist;
              best = cand;
            }
          }
          if (Math.abs(best.c - curC) <= 4) {
            curC = best.c;
          }
          spine.push({ r, c: curC });
        } else {
          spine.push({ r, c: curC });
        }
      }
      return spine;
    }

    _reconcileV3DynamicFeatures(initial = false) {
      const n = this._getGridSize();
      const poi = this._poi;
      const defaultTown = poi.townCells[0] || { r: n - 4, c: Math.floor(n / 2) };
      const defaultPiste = poi.pisteCells[0] || { r: Math.floor(n * 0.35), c: Math.floor(n / 2) };

      // A. Mountain Coaster Sleds (`coaster_sled` — 3 to 4 yellow carts on connected tracks!)
      const chains = poi.coasterChains;
      if (!chains || chains.length === 0) {
        this.coasterSleds.length = 0;
      } else {
        let totalTrackCells = 0;
        for (let i = 0; i < chains.length; i++) totalTrackCells += chains[i].steps.length;
        const targetSleds = totalTrackCells >= 6 ? 4 : 3;
        const sledTitles = [
          "Toboggan-Blitz Cart #1",
          "Matterhorn Coaster #2",
          "Eiger Express Sled #3",
          "Glacier Rocket Cart #4",
        ];
        while (this.coasterSleds.length > targetSleds) {
          this.coasterSleds.pop();
        }
        for (let k = this.coasterSleds.length; k < targetSleds; k++) {
          const chainIdx = k % chains.length;
          const ch = chains[chainIdx];
          const initPos = ((k / targetSleds) * ch.steps.length) % ch.steps.length;
          const st = ch.steps[Math.floor(initPos)] || ch.steps[0];
          this.coasterSleds.push(
            this._makeActor({
              id: `coaster_sled_${k + 1}`,
              category: "fleet",
              roleGroup: "coaster",
              role: "coaster_sled",
              spriteType: "coaster_sled",
              maxFrames: 4,
              name: sledTitles[k % sledTitles.length],
              roleLabel: "Alpine Mountain Coaster",
              skill: "Thrill",
              r: st.r,
              c: st.c,
              u: 4.0,
              v: 4.0,
              heading: "sw",
              thrill: 99,
              activityText: "Banked High-G Descent on Tubular Mountain Coaster!",
              thoughtText: "Hands up — zero-brake gravity run through the curves!",
              meta: {
                chainIdx,
                pathPos: initPos,
                rideRevenueTimer: 6.5 + k * 2.8,
              },
            })
          );
        }
        for (let k = 0; k < this.coasterSleds.length; k++) {
          const sled = this.coasterSleds[k];
          sled.meta.chainIdx = k % chains.length;
          const ch = chains[sled.meta.chainIdx];
          if (sled.meta.pathPos >= ch.steps.length) {
            sled.meta.pathPos = sled.meta.pathPos % ch.steps.length;
          }
        }
      }

      // B. Crystal Ice Artisans (`ice_artisan` — 1 to 2 carvers beside snow sculptures / ice arches!)
      const existingArtisans = this.guests.filter((g) => g.role === "ice_artisan");
      const icePool =
        poi.iceSculptureSpots.length > 0
          ? poi.iceSculptureSpots
          : initial
          ? poi.festivalCells.length > 0
            ? poi.festivalCells
            : poi.snowmanSpots.length > 0
            ? poi.snowmanSpots
            : [defaultTown]
          : [];
      const targetArtisans = icePool.length > 0 ? Math.min(2, Math.max(1, icePool.length >= 2 ? 2 : initial ? 2 : 1)) : 0;
      for (let i = existingArtisans.length; i < targetArtisans; i++) {
        const sp = icePool[i % icePool.length];
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "village",
            role: "ice_artisan",
            spriteType: "ice_artisan",
            maxFrames: 4,
            name: i === 0 ? "Master Sculptor Lukas" : "Ice Artisan Chiara",
            roleLabel: "Crystal Ice Sculptor",
            skill: "Artisan",
            r: sp.r,
            c: sp.c,
            u: 5.5,
            v: 2.7 + (i % 2) * 2.4,
            heading: "ne",
            activityText: "Chiseling Shimmering Glacier Ice Blocks into Festival Art!",
            thoughtText: "Every prism facet catches the alpenglow like a diamond!",
          })
        );
      }

      // C. Pro Slope Photographers (`slope_photographer` — 2 to 3 tripod photographers!)
      const existingPhotogs = this.guests.filter((g) => g.role === "slope_photographer");
      const photoPool =
        poi.photoSpots.length > 0
          ? poi.photoSpots
          : initial
          ? poi.selfieSpots.length > 0
            ? poi.selfieSpots
            : [defaultPiste]
          : [];
      const targetPhotogs = photoPool.length > 0 ? (initial || photoPool.length >= 3 ? 3 : 2) : 0;
      const photogNames = ["Action-Cam Gian", "Pro Lens Elena", "Summit Shutter Marco"];
      for (let i = existingPhotogs.length; i < targetPhotogs; i++) {
        const pp = photoPool[(i * 2) % photoPool.length];
        this.guests.push(
          this._makeActor({
            category: "guest",
            roleGroup: "mountain",
            role: "slope_photographer",
            spriteType: "slope_photographer",
            maxFrames: 4,
            name: photogNames[i % photogNames.length],
            roleLabel: "Pro Slope Photographer",
            skill: "Press",
            r: pp.r,
            c: pp.c,
            u: 5.8,
            v: 5.6 - (i % 3) * 1.4,
            heading: i % 2 === 0 ? "ne" : "nw",
            timer: 2.1 + i * 1.35,
            activityText: "Framing Telephoto Action Shots Beside Terrain Park & Summit!",
            thoughtText: "1/2000s shutter ready — catch that mid-air spread-eagle!",
            meta: { flashPulseTimer: 0 },
          })
        );
      }
    }

    _spawnVipHelicopter(pad, startHigh = false) {
      this.crew.push(
        this._makeActor({
          category: "crew",
          roleGroup: "fleet",
          role: "vip_helicopter",
          spriteType: "vip_helicopter",
          name: "Air-Zermatt VIP Red Heli",
          roleLabel: "Summit Heli-Ski Charter",
          skill: "VIP",
          r: pad.r,
          c: pad.c,
          anchorR: pad.r,
          anchorC: pad.c,
          u: 4.0,
          v: 4.0,
          extraZ: startHigh ? 20.0 : 4.2,
          heading: "sw",
          activityText: "Touching Down on Illuminated Summit Helipad",
          thoughtText: "Dropping VIP powder hounds onto untouched Lv 4 bowls!",
          meta: { cycleTime: startHigh ? 0.0 : 9.5 }, // 28s full flight/landing cycle
        })
      );
    }

    // =========================================================================
    // Main Simulation Tick (`step(dt)`) & Biomechanical Kinematics
    // =========================================================================

    step(dt = 1 / 60) {
      if (!this.world) return;
      const sig = this._computeWorldSignature();
      if (sig !== this._worldSignature) {
        this.resetForWorld(this.world, { keepCash: true });
        return;
      }
      this._flushPendingWorldSync();

      const rawDt = clamp(Number(dt) || 1 / 60, 0, 0.1);
      if (this.paused || this._timeScale <= 0 || rawDt <= 0) {
        this._rebuildCellBuckets();
        return;
      }

      const scaledDt = rawDt * this._timeScale;
      this.simTime += scaledDt;

      // 1. Uphill Lift Belts, Funiculars & Surface Tows
      this._updateLiftSystems(scaledDt);

      // 2. Closed-Loop / Linear Swiss Rack-Railway Train
      this._stepTrain(scaledDt);

      // 3. Ski-School Duckling Squads (Instructor + 4 Kids Single-File)
      this._stepDucklingSquads(scaledDt);

      // 4. Snaking Lift-Base Queues
      this._stepLiftQueues(scaledDt);

      // 5. Core Mountain Skiers, Carvers, Boarders, Tubers, Wipeouts & Strollers
      this._stepCoreGuests(scaledDt);

      // 6. 3v3 Pond Hockey, Bavarian Curling, Skaters, Penguins & Anglers
      this._stepRinkAndProjectiles(scaledDt);

      // 7. Outdoor Diners, Schirmbar Revelers, Snack Queues, Snowballs, Selfies & Luggage
      this._stepVillageLife(scaledDt);

      // 8. Fleet, Groomers, Sleigh, Bus, Huskies, VIP Helicopter & High-Peak Wildlife
      this._stepCrewFleetAndWildlife(scaledDt);

      // 8b. Alpine Peak v3: Sky Spectacles, Mountain Coaster Sleds, Torchlight Snake & Fireworks!
      this._stepSkySpectacles(scaledDt);
      this._stepCoasterSleds(scaledDt);
      this._stepTorchlightParade(scaledDt);
      this._stepFireworks(scaledDt);

      // 9. Popups, Camera Flashes & Periodic Topology / Milestone Evaluation
      this._updateFloatingPopups(rawDt);
      this._updateCameraFlashes(rawDt);

      this._scanTimer += scaledDt;
      if (this._scanTimer >= 1.0) {
        this._scanTimer = 0;
        this._evaluateStatsAndChallenges(false);
      }

      // 10. Rebuild O(1) Painter-Sorted Cell Buckets
      this._rebuildCellBuckets();
    }

    update(dt) {
      this.step(dt);
    }

    tick(dt) {
      this.step(dt);
    }

    getFinaleTimeRemaining() {
      return Math.max(0, this._finaleTimer);
    }

    launchFireworkAt(r, c, presetId = null, playSound = true) {
      const n = this._getGridSize();
      const rr = clamp(Math.round(Number(r) || Math.floor(n * 0.5)), 0, n - 1);
      const cc = clamp(Math.round(Number(c) || Math.floor(n * 0.5)), 0, n - 1);

      let fw = null;
      let oldest = this._fireworkPool[0];
      for (let i = 0; i < this._fireworkPool.length; i++) {
        const cand = this._fireworkPool[i];
        if (!cand.active) {
          fw = cand;
          break;
        }
        if (cand.age > oldest.age) oldest = cand;
      }
      if (!fw) fw = oldest;

      const seq = this._fireworkLaunchCounter++;
      const preset =
        (presetId && FIREWORK_PRESET_BY_ID[presetId]) ||
        FIREWORK_PRESETS[seq % FIREWORK_PRESETS.length];

      const groundZ = this._getSurfaceZUnits(rr, cc, 4.0, 4.0);
      const extraZ = 0.85;
      const z = groundZ + extraZ;
      const groundWX = (cc - rr) * HALF_W;
      const groundWY = (rr + cc) * HALF_H + 32 - groundZ * 4.0;

      fw.active = true;
      fw.phase = "rising";
      fw.isRising = true;
      fw.isBurst = false;
      fw.kind = preset.id;
      fw.preset = preset.id;
      fw.color = preset.primary;
      fw.primaryColor = preset.primary;
      fw.secondaryColor = preset.secondary;
      fw.coreColor = preset.core;
      fw.glowColor = preset.glow;
      fw.droop = preset.droop;
      fw.r = rr;
      fw.c = cc;
      fw.u = 4.0;
      fw.v = 4.0;
      fw.driftU = ((seq % 5) - 2) * 0.38;
      fw.driftV = (((seq * 3) % 5) - 2) * 0.38;
      fw.groundZ = groundZ;
      fw.extraZ = extraZ;
      fw.apexExtraZ = 18.0 + (seq % 4) * 1.15;
      fw.z = z;
      fw.worldZ = z;
      fw.groundWorldX = groundWX;
      fw.groundWorldY = groundWY;
      fw.worldX = groundWX;
      fw.worldY = groundWY - extraZ * 4.0;
      fw.x = fw.worldX;
      fw.y = fw.worldY;
      fw.trailStartWorldX = fw.worldX;
      fw.trailStartWorldY = fw.worldY + 9;
      fw.age = 0;
      fw.riseDur = 0.74 + (seq % 3) * 0.08;
      fw.burstDur = 1.68;
      fw.progress = 0;
      fw.t = 0;
      fw.alpha = 1.0;
      fw.flashAlpha = 0;
      fw.radiusPx = 0;
      fw.maxRadiusPx = 46 + (seq % 3) * 6;
      fw.playBurstAudio = Boolean(playSound);

      for (let k = 0; k < fw.sparkCount; k++) {
        const sp = fw.sparks[k];
        sp.dx = 0;
        sp.dy = 0;
        sp.prevDx = 0;
        sp.prevDy = 0;
        sp.worldX = fw.worldX;
        sp.worldY = fw.worldY;
        sp.x = fw.worldX;
        sp.y = fw.worldY;
        sp.alpha = 1.0;
        sp.color =
          k % 4 === 0
            ? preset.core
            : k % 2 === 0
            ? preset.primary
            : preset.secondary;
      }

      if (this._activeFireworks.indexOf(fw) === -1) {
        this._activeFireworks.push(fw);
      }
      return fw;
    }

    triggerFireworkBurst(r, c, presetId = null) {
      return this.launchFireworkAt(r, c, presetId, true);
    }

    fireMortarAt(r, c) {
      return this.launchFireworkAt(r, c, null, true);
    }

    triggerFestiveFinale() {
      this._flushPendingWorldSync();
      const n = this._getGridSize();
      const poi = this._poi;
      this._finaleTimer = 14.0;

      // Resolve mortar launch battery (with graceful festival plaza / town center fallback if bulldozed)
      const pads =
        poi.fireworkMortars.length > 0
          ? poi.fireworkMortars
          : poi.festivalCells.length > 0
          ? poi.festivalCells
          : poi.townCells.length > 0
          ? poi.townCells
          : [{ r: Math.floor(n * 0.68), c: Math.floor(n * 0.5) }];

      // Immediate opening 3-shell salvo
      const openCount = Math.min(3, Math.max(2, pads.length));
      for (let i = 0; i < openCount; i++) {
        const pad = pads[(i * 2) % pads.length];
        const preset = FIREWORK_PRESETS[i % FIREWORK_PRESETS.length];
        this.launchFireworkAt(pad.r, pad.c, preset.id, i === 0);
      }

      // Schedule 21 choreographed multi-salvo bursts across the 14.0s finale
      for (let s = 0; s < this._finaleSchedulePool.length; s++) {
        const slot = this._finaleSchedulePool[s];
        if (s < 21) {
          const pad = pads[(s * 3 + 1) % pads.length];
          slot.active = true;
          slot.delay = 0.42 + s * 0.54;
          slot.r = pad.r;
          slot.c = pad.c;
          slot.presetId = FIREWORK_PRESETS[(s + 2) % FIREWORK_PRESETS.length].id;
          slot.playAudio = s % 3 === 0;
        } else {
          slot.active = false;
        }
      }

      // Ignite all 3 hot_air_balloon burners simultaneously!
      for (let i = 0; i < this.skySpectacles.length; i++) {
        const sp = this.skySpectacles[i];
        if (sp.role === "hot_air_balloon") {
          sp.meta.burnerForceTimer = 6.2;
          sp.burnerGlow = 1.0;
          sp.frame = 2 + (i % 2);
          sp.activityText = "Festive Finale Burner Salute Above the Valley!";
        }
      }

      // Refresh synchronized 10-skier torchlight parade snake on main piste!
      const spine = this._torchParadeWaypoints;
      if (spine && spine.length >= 2) {
        for (let i = 0; i < this.torchlightParade.length; i++) {
          const ts = this.torchlightParade[i];
          ts.meta.spinePos = (i * 0.62) % spine.length;
          ts.torchGlow = 1.0;
          ts.activityText = "Leading Grand Finale Torchlight S-Turn Snake!";
        }
        const midWp = spine[Math.floor(spine.length * 0.45)];
        this.addFloatingPopup(midWp.r, midWp.c, "🔥 Torchlight Parade!", "#ffd54f");
      }

      // Dispatch / whistle Swiss Rack-Railway train!
      if (this.train) {
        if (this.train.state === "cooldown") {
          this.train.state = "cruising";
          this.train.meta.pathPos = 0;
          this.train.meta.stationLockout = 0;
        }
        this.train.activityText = "Sounding Festive Brass Whistle Along Illuminated Viaduct!";
      }

      // Trigger procedural fanfare + whistle + burst SFX
      if (this.audio) {
        if (typeof this.audio.playFestivalFanfare === "function") {
          this.audio.playFestivalFanfare();
        } else if (typeof this.audio.playDiscovery === "function") {
          this.audio.playDiscovery();
        }
        if (typeof this.audio.playFireworkBurst === "function") {
          this.audio.playFireworkBurst();
        }
        if (this.train && typeof this.audio.playTrainBell === "function") {
          this.audio.playTrainBell();
        }
      }

      const bannerCell = pads[0];
      this.addFloatingPopup(bannerCell.r, bannerCell.c, "🎆 GRAND ALPINE FINALE!", "#fde68a");
      this._stepTorchlightParade(0);
      this._rebuildCellBuckets();
      this.emitEvent({ type: "festive_finale_started", duration: 14.0 });
      return true;
    }

    _stepFireworks(dt) {
      if (this._finaleTimer > 0) {
        this._finaleTimer = Math.max(0, this._finaleTimer - dt);
        for (let i = 0; i < this._finaleSchedulePool.length; i++) {
          const slot = this._finaleSchedulePool[i];
          if (!slot.active) continue;
          slot.delay -= dt;
          if (slot.delay <= 0) {
            slot.active = false;
            this.launchFireworkAt(slot.r, slot.c, slot.presetId, slot.playAudio);
          }
        }
        if (this._finaleTimer === 0) {
          this.emitEvent({ type: "festive_finale_ended" });
        }
      } else if (this._poi.fireworkMortars.length > 0) {
        const atmo = this._getEffectiveAtmosphere();
        if (atmo === "alpenglow" || atmo === "night") {
          this._ambientFireworkTimer -= dt;
          if (this._ambientFireworkTimer <= 0) {
            this._ambientFireworkTimer = 3.6 + (this._fireworkLaunchCounter % 3) * 0.9;
            const mortars = this._poi.fireworkMortars;
            const m = mortars[this._fireworkLaunchCounter % mortars.length];
            this.launchFireworkAt(m.r, m.c, null, false);
          }
        }
      }

      const activeList = this._activeFireworks;
      activeList.length = 0;

      for (let i = 0; i < this._fireworkPool.length; i++) {
        const fw = this._fireworkPool[i];
        if (!fw.active) continue;

        if (fw.phase === "rising") {
          fw.age += dt;
          const p = clamp(fw.age / fw.riseDur, 0, 1);
          const ease = 1.0 - (1.0 - p) * (1.0 - p);
          const prevWX = fw.worldX;
          const prevWY = fw.worldY;
          fw.progress = p;
          fw.t = p;
          fw.u = clamp(4.0 + fw.driftU * ease, 0.5, 7.5);
          fw.v = clamp(4.0 + fw.driftV * ease, 0.5, 7.5);
          fw.extraZ = 0.85 + (fw.apexExtraZ - 0.85) * ease;
          fw.z = fw.groundZ + fw.extraZ;
          fw.worldZ = fw.z;
          fw.worldX = (fw.c - fw.r) * HALF_W + (fw.v - fw.u) * 8.0;
          fw.worldY = (fw.r + fw.c) * HALF_H + (fw.u + fw.v) * 4.0 - fw.z * 4.0;
          fw.x = fw.worldX;
          fw.y = fw.worldY;
          fw.trailStartWorldX = prevWX;
          fw.trailStartWorldY = prevWY + 6;
          fw.alpha = 1.0;
          fw.flashAlpha = p > 0.84 ? (p - 0.84) / 0.16 : 0;

          if (fw.age >= fw.riseDur) {
            fw.phase = "burst";
            fw.isRising = false;
            fw.isBurst = true;
            fw.age = 0;
            fw.progress = 0;
            fw.t = 0;
            fw.flashAlpha = 1.0;
            if (fw.playBurstAudio && this.audio && typeof this.audio.playFireworkBurst === "function") {
              this.audio.playFireworkBurst();
            }
          }
          activeList.push(fw);
        } else {
          fw.age += dt;
          if (fw.age >= fw.burstDur) {
            fw.active = false;
            continue;
          }
          const p = clamp(fw.age / fw.burstDur, 0, 1);
          const expand = 1.0 - Math.pow(1.0 - p, 2.35);
          const grav = fw.droop * p * p;
          fw.progress = p;
          fw.t = p;
          fw.radiusPx = fw.maxRadiusPx * expand;
          fw.alpha = p < 0.45 ? 1.0 : clamp(1.0 - (p - 0.45) / 0.55, 0, 1);
          fw.flashAlpha = p < 0.22 ? clamp(1.0 - p / 0.22, 0, 1) : 0;

          const sparks = fw.sparks;
          for (let k = 0; k < fw.sparkCount; k++) {
            const sp = sparks[k];
            sp.prevDx = sp.dx;
            sp.prevDy = sp.dy;
            sp.dx = sp.ux * fw.radiusPx;
            sp.dy = sp.uy * fw.radiusPx + grav;
            sp.worldX = fw.worldX + sp.dx;
            sp.worldY = fw.worldY + sp.dy;
            sp.x = sp.worldX;
            sp.y = sp.worldY;
            sp.alpha = fw.alpha * (0.78 + 0.22 * Math.sin(this.simTime * 22.0 + sp.twinklePhase));
          }
          activeList.push(fw);
        }
      }
    }

    _stepSkySpectacles(dt) {
      const n = this._getGridSize();
      for (let i = 0; i < this.skySpectacles.length; i++) {
        const s = this.skySpectacles[i];
        if (s.role === "hot_air_balloon") {
          s.phase += dt * 0.22;
          const fR = clamp(s.anchorR + Math.sin(s.phase) * s.meta.orbitR, 2.5, n - 3.5);
          const fC = clamp(s.anchorC + Math.cos(s.phase * 0.78) * s.meta.orbitC, 2.5, n - 3.5);
          const dR = Math.cos(s.phase) * s.meta.orbitR;
          const dC = -Math.sin(s.phase * 0.78) * s.meta.orbitC * 0.78;
          s.r = Math.floor(fR);
          s.c = Math.floor(fC);
          s.u = clamp((fR - s.r) * 8.0, 0.5, 7.5);
          s.v = clamp((fC - s.c) * 8.0, 0.5, 7.5);
          s.z = this._getSurfaceZUnits(s.r, s.c, s.u, s.v);
          s.extraZ = clamp(s.meta.baseZ + Math.sin(s.phase * 2.4) * 1.05, 16.0, 20.0);
          s.groundShadowZ = s.extraZ;
          s.heading = velocityToHeading(dR, dC, s.heading);

          s.meta.burnerForceTimer = Math.max(0, (s.meta.burnerForceTimer || 0) - dt);
          s.meta.burnerCycle = (s.meta.burnerCycle + dt) % 7.6;
          const puffing = s.meta.burnerForceTimer > 0 || s.meta.burnerCycle < 1.8;
          if (puffing) {
            s.frame = 2 + (Math.floor(this.simTime * 7.5 + s.uid) % 2);
            s.burnerGlow =
              s.meta.burnerForceTimer > 0
                ? 1.0
                : clamp(0.86 + 0.14 * Math.sin(this.simTime * 15.0 + s.uid), 0.72, 1.0);
            if (s.meta.burnerForceTimer <= 0) {
              s.activityText = "Firing Propane Burner Above Sunlit Glacier Valley!";
            }
          } else {
            s.frame = Math.floor(this.simTime * 2.4 + s.uid) % 2;
            s.burnerGlow = 0;
            s.activityText = "Drifting Peacefully Over Chalets & Spruces";
          }
          continue;
        }

        // `alpine_paraglider` banking figure-8s (`extraZ: 11..15`, `f0..f3`)
        s.phase += dt * 0.58;
        const fR = clamp(s.anchorR + Math.sin(s.phase) * s.meta.figR, 2.0, n - 3.5);
        const fC = clamp(s.anchorC + Math.sin(s.phase * 2.0) * s.meta.figC, 2.0, n - 3.5);
        const dR = Math.cos(s.phase) * s.meta.figR;
        const dC = Math.cos(s.phase * 2.0) * s.meta.figC * 2.0;
        s.r = Math.floor(fR);
        s.c = Math.floor(fC);
        s.u = clamp((fR - s.r) * 8.0, 0.5, 7.5);
        s.v = clamp((fC - s.c) * 8.0, 0.5, 7.5);
        s.z = this._getSurfaceZUnits(s.r, s.c, s.u, s.v);
        s.extraZ = clamp(s.meta.baseZ + Math.cos(s.phase * 1.6) * 0.95, 11.0, 15.0);
        s.groundShadowZ = s.extraZ;
        s.heading = velocityToHeading(dR, dC, s.heading);
        this._advanceAnim(s, dt, 4.6);
      }
    }

    _stepCoasterSleds(dt) {
      const chains = this._poi.coasterChains;
      if (!chains || chains.length === 0 || this.coasterSleds.length === 0) return;

      for (let i = 0; i < this.coasterSleds.length; i++) {
        const sled = this.coasterSleds[i];
        const ch = chains[sled.meta.chainIdx % chains.length];
        if (!ch || ch.steps.length < 2) continue;
        const steps = ch.steps;
        const len = steps.length;

        const curIdx = Math.floor(sled.meta.pathPos) % len;
        const nextIdx = (curIdx + 1) % len;
        const dropBoost = Math.max(0, steps[curIdx].avgLv - steps[nextIdx].avgLv) * 0.55;
        const speedCells = 2.45 + dropBoost;
        sled.meta.pathPos += speedCells * dt;
        if (sled.meta.pathPos >= len) {
          sled.meta.pathPos -= len;
        }

        const idx = Math.floor(sled.meta.pathPos) % len;
        const t = sled.meta.pathPos - Math.floor(sled.meta.pathPos);
        const st = steps[idx];
        const p0 = PORT_SUBTILE[st.entryPort] || PORT_SUBTILE.N;
        const p2 = PORT_SUBTILE[st.exitPort] || PORT_SUBTILE.S;
        const inv = 1.0 - t;

        sled.r = st.r;
        sled.c = st.c;
        sled.u = clamp(inv * inv * p0[0] + 8.0 * inv * t + t * t * p2[0], 0.2, 7.8);
        sled.v = clamp(inv * inv * p0[1] + 8.0 * inv * t + t * t * p2[1], 0.2, 7.8);
        sled.z = this._getSurfaceZUnits(sled.r, sled.c, sled.u, sled.v) + 0.18;

        const du = 2.0 * inv * (4.0 - p0[0]) + 2.0 * t * (p2[0] - 4.0);
        const dv = 2.0 * inv * (4.0 - p0[1]) + 2.0 * t * (p2[1] - 4.0);
        sled.heading = velocityToHeading(du, dv, sled.heading);
        this._advanceAnim(sled, dt, 7.5);

        sled.meta.rideRevenueTimer -= dt;
        if (sled.meta.rideRevenueTimer <= 0) {
          sled.meta.rideRevenueTimer = 16.5 + i * 3.2;
          if (i < 2) {
            this.earn(22, sled.r, sled.c, "🎢 +$22 Coaster Thrill!", "tickets", false);
          }
        }
      }
    }

    _emitTorchEmber(r, c, u, v, z, seq) {
      const slot = this._torchEmberPool[this._torchEmberHead];
      this._torchEmberHead = (this._torchEmberHead + 1) % this._torchEmberPool.length;
      slot.active = true;
      slot.r = r;
      slot.c = c;
      slot.u = clamp(u + ((seq % 3) - 1) * 0.28, 0.4, 7.6);
      slot.v = clamp(v + (((seq >> 1) % 3) - 1) * 0.28, 0.4, 7.6);
      slot.z = z;
      slot.extraZ = 0.22;
      slot.worldX = (c - r) * HALF_W + (slot.v - slot.u) * 8.0;
      slot.worldY = (r + c) * HALF_H + (slot.u + slot.v) * 4.0 - (z + slot.extraZ) * 4.0;
      slot.x = slot.worldX;
      slot.y = slot.worldY;
      slot.life = 0;
      slot.maxLife = 0.78 + (seq % 3) * 0.14;
      slot.alpha = 1.0;
      slot.size = seq % 3 === 0 ? 3 : 2;
      slot.color = seq % 2 === 0 ? "#ffd54f" : "#ff9e40";
    }

    _stepTorchEmbers(dt) {
      const out = this._activeTorchEmbers;
      out.length = 0;
      for (let i = 0; i < this._torchEmberPool.length; i++) {
        const em = this._torchEmberPool[i];
        if (!em.active) continue;
        em.life += dt;
        if (em.life >= em.maxLife) {
          em.active = false;
          continue;
        }
        em.alpha = clamp(1.0 - em.life / em.maxLife, 0, 1);
        out.push(em);
      }
    }

    _stepTorchlightParade(dt) {
      if (dt > 0) this._stepTorchEmbers(dt);
      if (!this._isTorchlightParadeActive()) return;

      const spine = this._torchParadeWaypoints;
      if (!spine || spine.length < 2 || this.torchlightParade.length === 0) return;
      const n = this._getGridSize();
      const len = spine.length;

      for (let i = 0; i < this.torchlightParade.length; i++) {
        const ts = this.torchlightParade[i];
        if (dt > 0) {
          ts.meta.spinePos += 1.85 * dt;
          if (ts.meta.spinePos >= len) {
            ts.meta.spinePos -= len;
          }
          this._advanceAnim(ts, dt, 6.8);
        }

        const idxA = Math.floor(ts.meta.spinePos) % len;
        const idxB = Math.min(len - 1, idxA + 1);
        const frac = ts.meta.spinePos - Math.floor(ts.meta.spinePos);
        const wpA = spine[idxA];
        const wpB = spine[idxB];

        const wavePhase = this.simTime * 3.2 - i * 0.56;
        const latOffsetC = Math.sin(wavePhase) * 0.34;
        const latVelC = Math.cos(wavePhase) * 1.08;

        const fR = clamp(wpA.r + (wpB.r - wpA.r) * frac + 0.5, 0.5, n - 0.5);
        const fC = clamp(wpA.c + (wpB.c - wpA.c) * frac + 0.5 + latOffsetC, 0.5, n - 0.5);

        ts.r = clamp(Math.floor(fR), 0, n - 1);
        ts.c = clamp(Math.floor(fC), 0, n - 1);
        ts.u = clamp((fR - ts.r) * 8.0, 0.6, 7.4);
        ts.v = clamp((fC - ts.c) * 8.0, 0.6, 7.4);
        ts.z = this._getSurfaceZUnits(ts.r, ts.c, ts.u, ts.v);
        ts.heading = velocityToHeading(
          Math.max(0.45, wpB.r - wpA.r),
          wpB.c - wpA.c + latVelC,
          ts.heading
        );
        ts.torchGlow = clamp(0.86 + 0.14 * Math.sin(this.simTime * 10.0 + i * 1.15), 0.85, 1.0);

        if (dt > 0) {
          ts.meta.emberTimer -= dt;
          if (ts.meta.emberTimer <= 0) {
            ts.meta.emberTimer = 0.13;
            this._emitTorchEmber(ts.r, ts.c, ts.u, ts.v, ts.z, ts.uid + Math.floor(this.simTime * 12));
          }
        }
      }
    }

    _advanceAnim(ent, dt, fps = 6.5) {
      ent.animTimer += dt * fps;
      const mf = V3_FOUR_FRAME_ENTITIES.has(ent.spriteType) ? 4 : 6;
      if (ent.animTimer >= 1.0) {
        const steps = Math.floor(ent.animTimer);
        ent.animTimer -= steps;
        ent.frame = (ent.frame + steps) % mf;
      } else if (ent.frame >= mf) {
        ent.frame = ent.frame % mf;
      }
    }

    /**
     * Smooth sub-tile displacement (`u, v in [0..8]`) with seamless cell handoff
     * and water/crevasse boundary protection. Returns `true` if moved cleanly.
     */
    _moveSubTile(ent, dU, dV, allowWater = false) {
      const n = this._getGridSize();
      let nr = ent.r;
      let nc = ent.c;
      let nu = ent.u + dU;
      let nv = ent.v + dV;

      while (nu >= 8.0) {
        nu -= 8.0;
        nr += 1;
      }
      while (nu < 0.0) {
        nu += 8.0;
        nr -= 1;
      }
      while (nv >= 8.0) {
        nv -= 8.0;
        nc += 1;
      }
      while (nv < 0.0) {
        nv += 8.0;
        nc -= 1;
      }

      if (nr < 0 || nr >= n || nc < 0 || nc >= n) {
        ent.u = clamp(ent.u - dU * 0.5, 1.0, 7.0);
        ent.v = clamp(ent.v - dV * 0.5, 1.0, 7.0);
        return false;
      }

      if (!allowWater && (nr !== ent.r || nc !== ent.c)) {
        const cell = this._cellFast(nr, nc);
        if (cell && cell.water) {
          const b = cell.baseStructureId || cell.structureId || "";
          const bridged =
            b === "timber_bridge" ||
            b === "stone_arch_bridge" ||
            b === "stone_viaduct" ||
            b === "kapellbrucke_bridge" ||
            b === "suspension_skybridge" ||
            b.startsWith("timber_bridge") ||
            b.startsWith("stone_arch_bridge") ||
            b.startsWith("stone_viaduct") ||
            b.startsWith("kapellbrucke_bridge") ||
            b.startsWith("suspension_skybridge");
          if (!bridged && !(cell.water === "frozen_lake" && ent.roleGroup === "rink")) {
            return false;
          }
        }
      }

      ent.r = nr;
      ent.c = nc;
      ent.u = nu;
      ent.v = nv;
      ent.z = this._getSurfaceZUnits(nr, nc, nu, nv);
      ent.heading = velocityToHeading(dU, dV, ent.heading);
      return true;
    }

    _teleportToSummitOrPiste(ent) {
      const poi = this._poi;
      if (ent.baseSprite === "snow_tuber" && poi.tubingCells.length > 0) {
        const topTube = poi.tubingCells[0];
        ent.r = topTube.r;
        ent.c = topTube.c;
      } else if (poi.liftTops.length > 0) {
        const lt = poi.liftTops[ent.uid % poi.liftTops.length];
        ent.r = clamp(lt.r + 1, 0, this._getGridSize() - 1);
        ent.c = lt.c;
      } else if (poi.pisteCells.length > 0) {
        const pc = poi.pisteCells[ent.uid % Math.min(12, poi.pisteCells.length)];
        ent.r = pc.r;
        ent.c = pc.c;
      }
      ent.u = 3.2 + (ent.uid % 3) * 0.8;
      ent.v = 3.2 + ((ent.uid + 1) % 3) * 0.8;
      ent.z = this._getSurfaceZUnits(ent.r, ent.c, ent.u, ent.v);
      ent.extraZ = 0;
    }

    // -------------------------------------------------------------------------
    // Core Skiers, Snowboarders, 80s Neon Skiers, Tubers, Wipeouts & Strollers
    // -------------------------------------------------------------------------
    _stepCoreGuests(dt) {
      const poi = this._poi;
      const n = this._getGridSize();

      for (let i = 0; i < this.guests.length; i++) {
        const g = this.guests[i];
        if (g.role !== "resort_guest") continue;
        const isRetroNeon = g.baseSprite === "retro_neon_skier";

        // State A: Yard-sale wipeout (`skier_wipeout`, 1.8s recovery + patrol dispatch!)
        if (g.state === "tumble") {
          g.timer -= dt;
          g.spriteType = "skier_wipeout";
          this._advanceAnim(g, dt, 4.5);
          if (g.timer <= 0) {
            g.state = "skiing";
            g.spriteType = g.baseSprite;
            if (isRetroNeon) g.frame = g.frame % 4;
            g.meta.wipeoutCooldown = 18.0 + (g.uid % 12);
            g.activityText = "Dusted Off Powder — Back Carving Downhill!";
            g.thoughtText = "Ski Patrol checked on me — ready to shred again!";
          }
          continue;
        }

        // State B: Downhill Skiing / Snowboarding / 80s Freestyle / Snow-Tubing + Jumps
        if (g.state === "skiing") {
          g.spriteType = g.baseSprite;
          g.meta.carvePhase += dt * (g.baseSprite === "snow_tuber" ? 4.4 : isRetroNeon ? 3.9 : 3.3);
          g.meta.wipeoutCooldown = Math.max(0, (g.meta.wipeoutCooldown || 0) - dt);

          if (isRetroNeon && g.meta.jumpTimer <= 0) {
            g.meta.rollerTimer = (g.meta.rollerTimer || 5.0) - dt;
            if (g.meta.rollerTimer <= 0) {
              g.meta.rollerTimer = 5.4 + (g.uid % 4) * 1.3;
              g.meta.jumpDur = 0.72;
              g.meta.jumpTimer = 0.72;
              g.meta.jumpPeakZ = 3.0;
              const popTxt = (g.uid + Math.floor(this.simTime)) % 2 === 0 ? "RADICAL!" : "DAFFY!";
              this.addFloatingPopup(g.r, g.c, popTxt, "#f472b6");
              g.activityText = popTxt === "DAFFY!" ? "Popping 80s Airborne Daffy Split!" : "Throwing Neon Spread-Eagle Jump!";
            }
          }

          // Parabolic jump arc if mid-trick
          if (g.meta.jumpTimer > 0) {
            g.meta.jumpTimer = Math.max(0, g.meta.jumpTimer - dt);
            const p = 1.0 - g.meta.jumpTimer / g.meta.jumpDur;
            g.extraZ = Math.sin(p * Math.PI) * g.meta.jumpPeakZ;
            if (isRetroNeon) {
              g.frame = p < 0.5 ? 2 : 3; // `f2` daffy split, `f3` spread-eagle!
            } else {
              g.frame = p < 0.5 ? 4 : 5;
            }
          } else {
            g.extraZ = 0;
            if (isRetroNeon) {
              g.frame = Math.floor(this.simTime * 7.5 + g.uid) % 2; // `f0..f1` deep parallel carve
            } else {
              this._advanceAnim(g, dt, 7.5);
            }
          }

          // Compute downhill gradient + sinusoidal S-turn carve velocity
          const zHere = this._getElevLevels(g.r, g.c, g.u, g.v);
          const zSouth = this._getElevLevels(Math.min(n - 1, g.r + 1), g.c, g.u, g.v);
          const zEast = this._getElevLevels(g.r, Math.min(n - 1, g.c + 1), g.u, g.v);
          const zWest = this._getElevLevels(g.r, Math.max(0, g.c - 1), g.u, g.v);

          let downU = zHere >= zSouth ? 1.0 : 0.72;
          let latV = Math.sin(g.meta.carvePhase) * (g.meta.carveAmp || 0.9);
          if (zWest - zEast > 0.35) latV += 0.35;
          else if (zEast - zWest > 0.35) latV -= 0.35;

          const spd = g.speed * 5.2 * dt;
          const prevR = g.r;
          const prevC = g.c;
          const moved = this._moveSubTile(g, downU * spd, latV * spd, false);

          if (moved && (g.r !== prevR || g.c !== prevC)) {
            const cell = this._cellFast(g.r, g.c);
            if (cell) {
              // Degrade corduroy slightly for `piste_groomer` / `winch_cat_yellow` to groom
              if (typeof cell.pisteQuality === "number") {
                cell.pisteQuality = Math.max(68, cell.pisteQuality - 0.35);
              } else {
                const rawCell = this.world.cells?.[g.r]?.[g.c];
                if (rawCell && typeof rawCell.pisteQuality === "number") {
                  rawCell.pisteQuality = Math.max(68, rawCell.pisteQuality - 0.35);
                }
              }

              // Check Freestyle Terrain Park Kicker / Rail / Airbag / Halfpipe (O(1) zero-regex)!
              const fl = cell.flora;
              const feat = fl ? PARK_FEATURE_MAP[fl] || PARK_FEATURE_BONUSES[baseFeaturePrefix(fl)] : null;
              if (feat && g.meta.jumpTimer <= 0) {
                g.meta.jumpDur = feat.jumpZ >= 3.0 ? 0.82 : 0.58;
                g.meta.jumpTimer = g.meta.jumpDur;
                g.meta.jumpPeakZ = feat.jumpZ;
                g.thrill = Math.min(100, g.thrill + 10);
                this.tricksLanded++;
                if (isRetroNeon) {
                  this.earn(feat.bonus + 6, g.r, g.c, (this.tricksLanded % 2 === 0 ? "RADICAL! " : "DAFFY! ") + `+$${feat.bonus + 6}`, "tricks", false);
                } else if (this.tricksLanded % 2 === 1) {
                  this.earn(feat.bonus, g.r, g.c, feat.label, "tricks", false);
                }
                g.activityText = isRetroNeon ? "80s Neon Spread-Eagle Over Park Kicker!" : feat.actLabel || `Landing ${feat.label.split("!")[0]}!`;
              }

              // Occasional Yard-Sale Wipeout on steep/mogul slopes!
              const cellMaxLv = cell.maxLevel !== undefined ? cell.maxLevel : cell.maxLv || 0;
              const cellSloped = cell.isFlat !== undefined ? !cell.isFlat : Boolean(cell.isSloped);
              if (
                g.meta.jumpTimer <= 0 &&
                g.meta.wipeoutCooldown <= 0 &&
                (cell.surface === "mogul_chute" || (cellSloped && cellMaxLv >= 2)) &&
                ((g.uid * 17 + Math.floor(this.simTime * 5)) % 19 === 0)
              ) {
                g.state = "tumble";
                g.timer = 1.8;
                g.spriteType = "skier_wipeout";
                g.extraZ = 0;
                g.activityText = "Whoops! Yard sale in deep powder!";
                g.thoughtText = "Lost a ski in the moguls — waving to Ski Patrol!";
                this._dispatchPatrolToWipeout(g.r, g.c);
                continue;
              }
            }
          }

          // Reached valley base or blocked -> complete ski run, visit village or cycle back uphill!
          const curCell = this._cellFast(g.r, g.c);
          const curMaxLv = curCell ? (curCell.maxLevel !== undefined ? curCell.maxLevel : curCell.maxLv || 0) : 0;
          const atBottom =
            !moved ||
            g.r >= n - 6 ||
            (curCell && curMaxLv === 0 && curCell.surface !== "groomed_piste" && curCell.surface !== "tubing_chute") ||
            (curCell && curCell.flora === "tubing_bale_corral");

          if (atBottom && g.meta.jumpTimer <= 0) {
            g.runsCompleted++;
            g.warmth = Math.max(58, g.warmth - 8);
            if (g.runsCompleted % 3 === 0 && poi.townCells.length > 0) {
              const tc = this._pickFrom(poi.townCells, g.uid + g.runsCompleted, { r: g.r, c: g.c });
              g.state = "town_stroll";
              g.roleGroup = "village";
              g.spriteType = g.uid % 2 === 0 ? "skier_walking" : "town_shopper";
              g.r = tc.r;
              g.c = tc.c;
              g.u = 4.0;
              g.v = 4.0;
              g.z = this._getSurfaceZUnits(g.r, g.c, 4.0, 4.0);
              g.timer = 6.5 + (g.uid % 5);
              const shop = this._pickFrom(poi.allShops, g.uid + g.runsCompleted, tc);
              g.targetR = shop.r;
              g.targetC = shop.c;
              g.meta.shopId = shop.id;
              g.activityText = "Heading Into Alpine Village for Warm Apres-Ski";
            } else {
              // Board uphill lift pass & drop onto summit / lift top!
              if (g.runsCompleted % 4 === 1) {
                this.earn(18, g.r, g.c, "+$18 Lift Ride", "tickets", false);
                g.cashSpent += 18;
              }
              this._teleportToSummitOrPiste(g);
            }
          }
          continue;
        }

        // State C: Village Strolling & Shop Visits
        g.timer -= dt;
        this._advanceAnim(g, dt, 5.5);
        const dR = g.targetR - g.r;
        const dC = g.targetC - g.c;
        if (Math.abs(dR) + Math.abs(dC) > 0) {
          const stepU = Math.sign(dR) * g.speed * 3.4 * dt;
          const stepV = Math.sign(dC) * g.speed * 3.4 * dt;
          if (!this._moveSubTile(g, stepU, stepV, false)) {
            const alt = this._pickFrom(poi.townCells, g.uid + Math.floor(this.simTime), { r: g.r, c: g.c });
            g.targetR = alt.r;
            g.targetC = alt.c;
          }
        } else {
          g.u = clamp(4.0 + Math.sin(this.simTime * 1.6 + g.phase) * 1.4, 1.5, 6.5);
          g.v = clamp(4.0 + Math.cos(this.simTime * 1.4 + g.phase) * 1.4, 1.5, 6.5);
        }

        if (g.timer <= 0) {
          const shopSpec = g.meta.shopId ? SHOP_PRICES[g.meta.shopId] : null;
          if (shopSpec) {
            g.warmth = Math.min(100, g.warmth + (shopSpec.warm || 40));
            g.thrill = Math.min(100, g.thrill + (shopSpec.thrill || 10));
            g.cashSpent += shopSpec.price;
            if ((g.uid + Math.floor(this.simTime)) % 3 === 0) {
              this.earn(shopSpec.price, g.r, g.c, shopSpec.label, shopSpec.cat, false);
            }
            g.activityText = shopSpec.act;
          }
          // Return to mountain slopes refreshed!
          g.state = "skiing";
          g.roleGroup = "mountain";
          g.spriteType = g.baseSprite;
          if (isRetroNeon) g.frame = g.frame % 4;
          this._teleportToSummitOrPiste(g);
          g.activityText = `Carving Fresh S-Turns Down ${g.skill} Run`;
        }
      }
    }

    _dispatchPatrolToWipeout(r, c) {
      let nearest = null;
      let bestD = Infinity;
      for (let i = 0; i < this.crew.length; i++) {
        const m = this.crew[i];
        if (m.role === "ski_patrol" || m.role === "snowmobile") {
          const d = Math.abs(m.r - r) + Math.abs(m.c - c);
          if (d < bestD) {
            bestD = d;
            nearest = m;
          }
        }
      }
      if (nearest) {
        nearest.targetR = r;
        nearest.targetC = c;
        nearest.timer = 4.5;
        nearest.activityText = "Responding to Skier Yard-Sale Tumble on Piste!";
      }
    }

    // -------------------------------------------------------------------------
    // Snaking Lift-Base Queues (`skier_walking` Corral Shuffle)
    // -------------------------------------------------------------------------
    _stepLiftQueues(dt) {
      const corralWaypoints = CORRAL_WAYPOINTS;
      for (let i = 0; i < this.guests.length; i++) {
        const q = this.guests[i];
        if (q.role !== "lift_queue_skier") continue;
        q.timer -= dt;
        if (q.timer <= 0) {
          q.timer = 1.9;
          q.meta.slot = (q.meta.slot + 1) % corralWaypoints.length;
        }
        const wp = corralWaypoints[q.meta.slot % corralWaypoints.length];
        const tu = wp[0];
        const tv = wp[1];
        const thd = wp[2];
        const du = (tu - q.u) * Math.min(1, dt * 3.2);
        const dv = (tv - q.v) * Math.min(1, dt * 3.2);
        q.u = clamp(q.u + du, 1.0, 7.2);
        q.v = clamp(q.v + dv, 1.0, 7.2);
        q.z = this._getSurfaceZUnits(q.r, q.c, q.u, q.v);
        q.heading = thd;
        if (Math.hypot(tu - q.u, tv - q.v) > 0.25) {
          this._advanceAnim(q, dt, 5.0);
        } else {
          q.frame = 0;
        }
      }
    }

    // -------------------------------------------------------------------------
    // Ski-School "Duckling" Squads (Instructor + 4 Neon-Bib Kids Single-File!)
    // -------------------------------------------------------------------------
    _stepDucklingSquads(dt) {
      const n = this._getGridSize();
      const poi = this._poi;

      for (let s = 0; s < this.ducklingSquads.length; s++) {
        const sq = this.ducklingSquads[s];
        const leader = sq.leader;
        leader.phase += dt * 2.5;
        this._advanceAnim(leader, dt, 6.0);

        const dU = leader.speed * 3.9 * dt;
        const dV = Math.sin(leader.phase) * 1.05 * leader.speed * 3.9 * dt;
        const ok = this._moveSubTile(leader, dU, dV, false);
        const cur = this._cellFast(leader.r, leader.c);
        const curMaxLv = cur ? (cur.maxLevel !== undefined ? cur.maxLevel : cur.maxLv || 0) : 0;

        if (!ok || leader.r >= n - 6 || (cur && curMaxLv === 0 && cur.surface === "alpine_cobble")) {
          // Teleport whole duckling squad back to gentle upper slope!
          const gentle = poi.gentlePisteCells;
          const top = gentle.length > 0 ? gentle[s % gentle.length] : { r: 5, c: Math.floor(n / 2) };
          leader.r = top.r;
          leader.c = top.c;
          leader.u = 4.0;
          leader.v = 4.0;
          leader.z = this._getSurfaceZUnits(top.r, top.c, 4.0, 4.0);
          while (sq.trail.length > 36) sq.trail.pop();
          for (let t = 0; t < 36; t++) {
            const tu = clamp(4.0 - t * 0.08, 1.2, 6.8);
            if (t < sq.trail.length) {
              const pt = sq.trail[t];
              pt.r = top.r;
              pt.c = top.c;
              pt.u = tu;
              pt.v = 4.0;
              pt.heading = "sw";
            } else {
              sq.trail.push({
                r: top.r,
                c: top.c,
                u: tu,
                v: 4.0,
                heading: "sw",
              });
            }
          }
        } else {
          const head = sq.trail[0];
          const movedDist =
            Math.abs(leader.r - head.r) * 8 +
            Math.abs(leader.c - head.c) * 8 +
            Math.hypot(leader.u - head.u, leader.v - head.v);
          if (movedDist >= 0.42) {
            if (sq.trail.length >= 44) {
              const recycled = sq.trail.pop();
              recycled.r = leader.r;
              recycled.c = leader.c;
              recycled.u = leader.u;
              recycled.v = leader.v;
              recycled.heading = leader.heading;
              sq.trail.unshift(recycled);
            } else {
              sq.trail.unshift({
                r: leader.r,
                c: leader.c,
                u: leader.u,
                v: leader.v,
                heading: leader.heading,
              });
            }
          }
        }

        for (let k = 0; k < sq.kids.length; k++) {
          const kid = sq.kids[k];
          const idx = Math.min(sq.trail.length - 1, (k + 1) * 6);
          const pt = sq.trail[idx];
          kid.r = pt.r;
          kid.c = pt.c;
          kid.u = pt.u;
          kid.v = pt.v;
          kid.z = this._getSurfaceZUnits(pt.r, pt.c, pt.u, pt.v);
          kid.heading = pt.heading;
          this._advanceAnim(kid, dt, 6.2);
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3v3 Pond Hockey, Bavarian Curling, Figure Skaters & Projectiles
    // -------------------------------------------------------------------------
    _stepRinkAndProjectiles(dt) {
      this.projectiles.length = 0;
      const poi = this._poi;

      // 1. Live 3v3 Pond Hockey + Sliding Rubber Puck + Goal Celebrations!
      if (this.hockeyMatch) {
        const hm = this.hockeyMatch;
        const ar = hm.arena;
        hm.passTimer -= dt;
        hm.goalCooldown = Math.max(0, hm.goalCooldown - dt);

        const allPlayers = hm.allPlayers || (hm.allPlayers = hm.reds.concat(hm.blues));
        for (let i = 0; i < allPlayers.length; i++) {
          const p = allPlayers[i];
          p.phase += dt * (2.6 + (i % 3) * 0.4);
          this._advanceAnim(p, dt, 7.5);
          const homeR =
            p.meta.team === "red"
              ? ar.minR + 0.8 + p.meta.slot * 0.6
              : ar.maxR - 0.8 - p.meta.slot * 0.6;
          const midC = (ar.minC + ar.maxC) * 0.5;
          const targetGlobalR = clamp(homeR + Math.sin(p.phase) * 0.9, ar.minR + 0.3, ar.maxR - 0.3);
          const targetGlobalC = clamp(midC + (p.meta.slot - 1) * 0.75 + Math.cos(p.phase * 0.85) * 0.7, ar.minC + 0.2, ar.maxC - 0.2);

          const curGlobalR = p.r + p.u / 8.0;
          const curGlobalC = p.c + p.v / 8.0;
          const dU = clamp((targetGlobalR - curGlobalR) * 8.0, -1, 1) * p.speed * 3.8 * dt;
          const dV = clamp((targetGlobalC - curGlobalC) * 8.0, -1, 1) * p.speed * 3.8 * dt;

          const nr = clamp(Math.floor(curGlobalR + dU / 8.0), ar.minR, ar.maxR);
          const nc = clamp(Math.floor(curGlobalC + dV / 8.0), Math.max(0, ar.minC), Math.min(this._getGridSize() - 1, ar.maxC));
          p.r = nr;
          p.c = nc;
          p.u = clamp((curGlobalR + dU / 8.0 - nr) * 8.0, 1.2, 6.8);
          p.v = clamp((curGlobalC + dV / 8.0 - nc) * 8.0, 1.2, 6.8);
          p.z = this._getSurfaceZUnits(p.r, p.c, p.u, p.v);
          p.heading = velocityToHeading(dU, dV, p.heading);
        }

        // Puck stickhandling, passing & wrist-shots at goal!
        const pk = hm.puck;
        if (!pk.inFlight && hm.carrier) {
          pk.r = hm.carrier.r;
          pk.c = hm.carrier.c;
          pk.u = clamp(hm.carrier.u + 0.85, 0.8, 7.2);
          pk.v = clamp(hm.carrier.v + 0.65, 0.8, 7.2);

          if (hm.passTimer <= 0) {
            hm.passTimer = 2.2;
            pk.inFlight = true;
            pk.flightT = 0;
            pk.startR = pk.r + pk.u / 8.0;
            pk.startC = pk.c + pk.v / 8.0;

            // Shoot on goal if cooldown ready; otherwise crisp cross-ice pass!
            if (hm.goalCooldown <= 0) {
              const goal = hm.carrier.meta.team === "red" ? ar.goalBlue : ar.goalRed;
              pk.endR = goal.r + 0.5;
              pk.endC = goal.c + 0.5;
              pk.isShotOnGoal = true;
              pk.shootingTeam = hm.carrier.meta.team;
            } else {
              const nextPool = hm.carrier.meta.team === "red" ? hm.blues : hm.reds;
              const nextCarrier = nextPool[Math.floor(this.simTime * 3) % nextPool.length];
              hm.carrier = nextCarrier;
              pk.endR = nextCarrier.r + nextCarrier.u / 8.0;
              pk.endC = nextCarrier.c + nextCarrier.v / 8.0;
              pk.isShotOnGoal = false;
              if (this.audio && typeof this.audio.playHockeyClack === "function" && Math.floor(this.simTime) % 4 === 0) {
                this.audio.playHockeyClack(false);
              }
            }
          }
        } else if (pk.inFlight) {
          pk.flightT += dt * 2.4;
          const t = clamp(pk.flightT, 0, 1);
          const gR = pk.startR + (pk.endR - pk.startR) * t;
          const gC = pk.startC + (pk.endC - pk.startC) * t;
          pk.r = clamp(Math.floor(gR), 0, this._getGridSize() - 1);
          pk.c = clamp(Math.floor(gC), 0, this._getGridSize() - 1);
          pk.u = clamp((gR - pk.r) * 8.0, 0.5, 7.5);
          pk.v = clamp((gC - pk.c) * 8.0, 0.5, 7.5);

          if (t >= 1.0) {
            pk.inFlight = false;
            if (pk.isShotOnGoal) {
              this.hockeyGoals++;
              hm.goalCooldown = 9.5;
              this.earn(20, pk.r, pk.c, "GOAL! 🏒 +$20", "rink", false);
              if (this.audio && typeof this.audio.playHockeyClack === "function") {
                this.audio.playHockeyClack(true);
              }
              const otherPool = pk.shootingTeam === "red" ? hm.blues : hm.reds;
              hm.carrier = otherPool[0];
            }
          }
        }

        let pkItem = pk._projItem;
        if (!pkItem) {
          pkItem = { id: pk.id, kind: "puck", r: pk.r, c: pk.c, u: pk.u, v: pk.v, extraZ: 0.06 };
          pk._projItem = pkItem;
        } else {
          pkItem.r = pk.r;
          pkItem.c = pk.c;
          pkItem.u = pk.u;
          pkItem.v = pk.v;
        }
        this.projectiles.push(pkItem);
      }

      // 2. Bavarian Ice Curling Stones (`curling_stone` projectiles!)
      for (let i = 0; i < this.curlingSheets.length; i++) {
        const cs = this.curlingSheets[i];
        if (cs.dwell > 0) {
          cs.dwell -= dt;
          if (cs.dwell <= 0) {
            cs.progress = 0;
            cs.team = cs.team === "red" ? "blue" : "red";
          }
        } else {
          cs.progress += dt * 0.36;
          if (cs.progress >= 1.0) {
            cs.progress = 1.0;
            cs.dwell = 2.0;
          }
        }
        const stoneU = 1.4 + cs.progress * 5.2;
        let csItem = cs._projItem;
        if (!csItem) {
          csItem = {
            id: cs.id,
            kind: "curling_stone",
            team: cs.team,
            r: cs.r,
            c: cs.c,
            u: stoneU,
            v: cs.v,
            extraZ: 0.08,
          };
          cs._projItem = csItem;
        } else {
          csItem.team = cs.team;
          csItem.r = cs.r;
          csItem.c = cs.c;
          csItem.u = stoneU;
          csItem.v = cs.v;
        }
        this.projectiles.push(csItem);
      }

      // 3. Figure `ice_skater`s, `penguin_aid_skater`s, `curling_player`s & `ice_fisherman`
      for (let i = 0; i < this.guests.length; i++) {
        const g = this.guests[i];
        if (g.roleGroup !== "rink" || g.role === "hockey_player") continue;

        if (g.role === "ice_skater") {
          g.phase += dt * 1.9;
          const spinning = Math.sin(g.phase * 0.7) > 0.78;
          if (spinning) {
            g.frame = 4 + (Math.floor(this.simTime * 10) % 2); // `f4..f5` figure spin!
          } else {
            this._advanceAnim(g, dt, 6.5);
          }
          const dU = Math.cos(g.phase) * 2.2 * dt;
          const dV = Math.sin(g.phase) * 2.2 * dt;
          g.u = clamp(g.u + dU, 1.3, 6.7);
          g.v = clamp(g.v + dV, 1.3, 6.7);
          g.heading = velocityToHeading(dU, dV, g.heading);
          g.z = this._getSurfaceZUnits(g.r, g.c, g.u, g.v);
        } else if (g.role === "penguin_aid_skater") {
          g.phase += dt * 1.35;
          this._advanceAnim(g, dt, 4.8);
          const dU = Math.sin(g.phase) * 1.4 * dt;
          const dV = Math.cos(g.phase) * 1.4 * dt;
          g.u = clamp(g.u + dU, 1.6, 6.4);
          g.v = clamp(g.v + dV, 1.6, 6.4);
          g.heading = velocityToHeading(dU, dV, g.heading);
          g.z = this._getSurfaceZUnits(g.r, g.c, g.u, g.v);
        } else {
          // `curling_player` & `ice_fisherman` subtle expressive animation
          this._advanceAnim(g, dt, g.role === "curling_player" ? 5.5 : 2.6);
        }
      }

      // 4. Live Parabolic Snowball Fights (`snowball_kid` + `"snowball"` projectiles!)
      for (let b = 0; b < this.snowballBouts.length; b++) {
        const bout = this.snowballBouts[b];
        for (let k = 0; k < bout.kids.length; k++) {
          const kid = bout.kids[k];
          kid.phase += dt * 2.2;
          this._advanceAnim(kid, dt, 6.0);
          kid.u = clamp(kid.anchorU + Math.sin(kid.phase + k) * 0.55, 1.2, 6.8);
          kid.v = clamp(kid.anchorV + Math.cos(kid.phase + k) * 0.55, 1.2, 6.8);
        }

        bout.throwTimer -= dt;
        if (bout.throwTimer <= 0 && bout.kids.length >= 2) {
          bout.throwTimer = 1.35 + (b % 2) * 0.35;
          const idxA = Math.floor(this.simTime * 3 + b) % bout.kids.length;
          const idxB = (idxA + 1) % bout.kids.length;
          const thrower = bout.kids[idxA];
          const target = bout.kids[idxB];
          thrower.heading = velocityToHeading(target.u - thrower.u, target.v - thrower.v, thrower.heading);
          bout.ball = {
            id: `snowball_${b}`,
            r: bout.r,
            c: bout.c,
            u0: thrower.u,
            v0: thrower.v,
            u1: target.u,
            v1: target.v,
            t: 0,
            impactTimer: 0,
          };
        }

        if (bout.ball) {
          const sb = bout.ball;
          let sbItem = bout._projItem;
          if (!sbItem) {
            sbItem = {
              id: sb.id,
              kind: "snowball",
              r: sb.r,
              c: sb.c,
              u: sb.u0,
              v: sb.v0,
              extraZ: 0.7,
              impactAlpha: 0,
            };
            bout._projItem = sbItem;
          }
          if (sb.t < 1.0) {
            sb.t = Math.min(1.0, sb.t + dt * 2.1);
            const u = sb.u0 + (sb.u1 - sb.u0) * sb.t;
            const v = sb.v0 + (sb.v1 - sb.v0) * sb.t;
            const arcZ = 0.7 + Math.sin(sb.t * Math.PI) * 2.25;
            sbItem.id = sb.id;
            sbItem.r = sb.r;
            sbItem.c = sb.c;
            sbItem.u = u;
            sbItem.v = v;
            sbItem.extraZ = arcZ;
            sbItem.impactAlpha = 0;
            this.projectiles.push(sbItem);
            if (sb.t >= 1.0) {
              sb.impactTimer = 0.28;
              if (this.audio && typeof this.audio.playSnowballPop === "function" && b === 0 && Math.floor(this.simTime) % 3 === 0) {
                this.audio.playSnowballPop();
              }
            }
          } else if (sb.impactTimer > 0) {
            sb.impactTimer = Math.max(0, sb.impactTimer - dt);
            sbItem.id = sb.id;
            sbItem.r = sb.r;
            sbItem.c = sb.c;
            sbItem.u = sb.u1;
            sbItem.v = sb.v1;
            sbItem.extraZ = 0.45;
            sbItem.impactAlpha = clamp(sb.impactTimer / 0.28, 0, 1);
            this.projectiles.push(sbItem);
          } else {
            bout.ball = null;
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // Village Dining, Revelers, Snack Queues, Selfie Flashes, Alphorn & Luggage
    // -------------------------------------------------------------------------
    _stepVillageLife(dt) {
      const poi = this._poi;
      for (let i = 0; i < this.guests.length; i++) {
        const g = this.guests[i];

        if (g.roleGroup === "nordic") {
          g.phase += dt * 1.4;
          this._advanceAnim(g, dt, 5.8);
          const dU = Math.cos(g.phase + g.uid) * g.speed * 3.1 * dt;
          const dV = Math.sin(g.phase * 0.8 + g.uid) * g.speed * 3.1 * dt;
          if (!this._moveSubTile(g, dU, dV, false)) {
            g.phase += Math.PI * 0.65;
          }
          continue;
        }

        if (
          g.role === "outdoor_diner" ||
          g.role === "apres_reveler" ||
          g.role === "hottub_bather" ||
          g.role === "snowman_builder" ||
          g.role === "ice_artisan"
        ) {
          this._advanceAnim(g, dt, g.role === "ice_artisan" ? 5.2 : g.role === "apres_reveler" ? 4.4 : 2.8);
          continue;
        }

        if (g.role === "davos_toboggan_pair") {
          const n = this._getGridSize();
          if (g.state === "sliding") {
            g.phase += dt * 3.1;
            this._advanceAnim(g, dt, 6.8);
            const dU = g.speed * 4.4 * dt;
            const dV = Math.sin(g.phase) * 0.75 * g.speed * 3.6 * dt;
            const ok = this._moveSubTile(g, dU, dV, false);
            if (!ok || g.r >= g.targetR || g.r >= n - 4) {
              g.state = "trudging";
              g.activityText = "Hiking Back Up Gentle Run for Another Toboggan Slide!";
            }
          } else {
            this._advanceAnim(g, dt, 4.2);
            const dU = -g.speed * 2.2 * dt;
            const dV = clamp(g.anchorC - g.c, -1, 1) * g.speed * 2.0 * dt;
            const ok = this._moveSubTile(g, dU, dV, false);
            if (!ok || g.r <= g.anchorR || g.r <= 2) {
              g.state = "sliding";
              g.activityText = "Whooshing Down Banked Snow Chute on Ash-Wood Davos Sled!";
            }
          }
          continue;
        }

        if (g.role === "yeti_mascot") {
          g.cameraFlash = Math.max(0, (g.cameraFlash || 0) - dt * 2.4);
          if (g.meta.waveTimer > 0) {
            g.meta.waveTimer = Math.max(0, g.meta.waveTimer - dt);
            g.frame = 2 + (Math.floor(this.simTime * 5.5 + g.uid) % 2); // `f2..f3` big friendly wave!
          } else {
            g.phase += dt * 0.95;
            const dU = Math.cos(g.phase + g.uid) * g.speed * 2.5 * dt;
            const dV = Math.sin(g.phase * 1.15 + g.uid) * g.speed * 2.5 * dt;
            if (!this._moveSubTile(g, dU, dV, false)) {
              g.phase += Math.PI * 0.72;
            }
            g.frame = Math.floor(this.simTime * 4.2 + g.uid) % 2; // `f0..f1` bouncy Yeti stroll
            g.timer -= dt;
            if (g.timer <= 0) {
              g.timer = 6.8 + (g.uid % 3) * 1.9;
              g.meta.waveTimer = 2.0;
              g.cameraFlash = 1.0;
              g.activityText = "Posing & Waving Fluffy Paws for a YETI SELFIE!";
              this.earn(16, g.r, g.c, "📸 YETI SELFIE! +$16", "apres", false);
              this.cameraFlashes.push({
                id: `flash_${this._nextUid()}`,
                r: g.r,
                c: g.c,
                u: g.u,
                v: g.v,
                extraZ: 3.8,
                alpha: 1.0,
                age: 0,
                duration: 0.4,
              });
            }
          }
          continue;
        }

        if (g.role === "festival_parade_trio") {
          g.phase += dt * 0.88;
          this._advanceAnim(g, dt, 4.8);
          const dU = Math.cos(g.phase + g.uid) * g.speed * 2.4 * dt;
          const dV = Math.sin(g.phase + g.uid) * g.speed * 2.4 * dt;
          if (!this._moveSubTile(g, dU, dV, false)) {
            g.phase += Math.PI * 0.7;
          }
          g.timer -= dt;
          if (g.timer <= 0) {
            g.timer = 7.5 + (g.uid % 3) * 2.2;
            this.addFloatingPopup(g.r, g.c, "♪ ♫", "#fde68a");
            if ((g.uid + Math.floor(this.simTime)) % 2 === 0) {
              this.earn(15, g.r, g.c, null, "apres", false);
            }
          }
          continue;
        }

        if (g.role === "slope_photographer") {
          g.cameraFlash = Math.max(0, (g.cameraFlash || 0) - dt * 2.6);
          g.timer -= dt;
          if (g.meta.flashPulseTimer > 0) {
            g.meta.flashPulseTimer = Math.max(0, g.meta.flashPulseTimer - dt);
            g.frame = 3; // `f3` white-gold telephoto strobe starburst!
          } else {
            g.frame = Math.floor(this.simTime * 2.4 + g.uid) % 3; // `f0..f2` tripod panning
            if (g.timer <= 0) {
              g.timer = 4.6 + (g.uid % 3) * 1.4;
              g.meta.flashPulseTimer = 0.36;
              g.frame = 3;
              g.cameraFlash = 1.0;
              this.cameraFlashes.push({
                id: `flash_${this._nextUid()}`,
                r: g.r,
                c: g.c,
                u: g.u,
                v: g.v,
                extraZ: 3.7,
                alpha: 1.0,
                age: 0,
                duration: 0.38,
              });
            }
          }
          continue;
        }

        if (g.role === "alphorn_musician") {
          this._advanceAnim(g, dt, 3.2);
          g.timer -= dt;
          if (g.timer <= 0) {
            g.timer = 16.0;
            if (this.audio && typeof this.audio.playAlphorn === "function") {
              this.audio.playAlphorn();
            }
            this.earn(16, g.r, g.c, "♪ Alphorn Encore! +$16", "apres", false);
          }
          continue;
        }

        if (g.role === "selfie_tourist") {
          this._advanceAnim(g, dt, 3.6);
          g.timer -= dt;
          if (g.timer <= 0) {
            g.timer = 4.2 + (g.uid % 4) * 0.9;
            g.frame = 5;
            this.cameraFlashes.push({
              id: `flash_${this._nextUid()}`,
              r: g.r,
              c: g.c,
              u: g.u,
              v: g.v,
              extraZ: 3.6,
              alpha: 1.0,
              age: 0,
              duration: 0.38,
            });
          }
          continue;
        }

        if (g.role === "snack_queue_guest") {
          g.timer -= dt;
          if (g.timer <= 0) {
            g.timer = 4.5;
            g.meta.slot = (g.meta.slot + 2) % 3; // front advances to kiosk, cycles smoothly!
            if (g.meta.slot === 0) {
              const spec = SHOP_PRICES[g.meta.kioskId] || { price: 14, label: "+$14 Treat", cat: "apres" };
              this.earn(spec.price, g.meta.kioskR, g.meta.kioskC, spec.label, spec.cat, false);
              g.cashSpent += spec.price;
            }
          }
          const targetU = clamp(2.0 + g.meta.slot * 1.95, 1.4, 6.6);
          g.u += (targetU - g.u) * Math.min(1, dt * 3.0);
          this._advanceAnim(g, dt, Math.abs(targetU - g.u) > 0.2 ? 5.0 : 2.0);
          continue;
        }

        if (g.role === "parent_pulling_sled" || g.role === "dog_walker") {
          g.phase += dt * 1.1;
          this._advanceAnim(g, dt, 5.0);
          const dU = Math.cos(g.phase) * g.speed * 2.8 * dt;
          const dV = Math.sin(g.phase) * g.speed * 2.8 * dt;
          if (!this._moveSubTile(g, dU, dV, false)) {
            g.phase += Math.PI * 0.75;
          }
          continue;
        }

        if (g.role === "traveler_luggage") {
          this._advanceAnim(g, dt, 5.4);
          const dR = g.targetR - g.r;
          const dC = g.targetC - g.c;
          if (Math.abs(dR) + Math.abs(dC) > 0) {
            const stepU = Math.sign(dR) * g.speed * 3.2 * dt;
            const stepV = Math.sign(dC) * g.speed * 3.2 * dt;
            if (!this._moveSubTile(g, stepU, stepV, false)) {
              const nextT = this._pickFrom(poi.townCells, g.uid + Math.floor(this.simTime), { r: g.r, c: g.c });
              g.targetR = nextT.r;
              g.targetC = nextT.c;
            }
          } else {
            // Checked in at hotel -> cycle back from train platform on next arrival wave!
            const hSpec = SHOP_PRICES[g.meta.hotelId] || SHOP_PRICES.grand_hotel_2x2;
            if ((g.uid + Math.floor(this.simTime)) % 4 === 0) {
              this.earn(hSpec.price, g.r, g.c, hSpec.label, "hotel", false);
            }
            const origin = poi.platformCells[0] || poi.stationCell || this._pickFrom(poi.townCells, 0, { r: g.r, c: g.c });
            g.r = origin.r;
            g.c = origin.c;
            g.u = 4.0;
            g.v = 4.0;
            g.z = this._getSurfaceZUnits(g.r, g.c, 4.0, 4.0);
            const nextHotel = this._pickFrom(poi.hotels, g.uid + Math.floor(this.simTime), origin);
            g.targetR = nextHotel.r;
            g.targetC = nextHotel.c;
            g.meta.hotelId = nextHotel.id || "grand_hotel_2x2";
          }
        }
      }
    }

    _updateCameraFlashes(dt) {
      for (let i = this.cameraFlashes.length - 1; i >= 0; i--) {
        const fl = this.cameraFlashes[i];
        fl.age += dt;
        fl.alpha = clamp(1.0 - fl.age / fl.duration, 0, 1);
        if (fl.age >= fl.duration) this.cameraFlashes.splice(i, 1);
      }
    }

    // -------------------------------------------------------------------------
    // Swiss Rack-Railway Train (`alpine_train` — Closed Loop & Linear!)
    // -------------------------------------------------------------------------
    _stepTrain(dt) {
      const tr = this.train;
      const path = this._poi.trainPath;
      if (!tr || path.length < 3) return;

      const isLoop = this._poi.trainIsLoop;
      const stationIdx = clamp(this._poi.trainStationIdx, 0, path.length - 1);

      if (tr.state === "cooldown") {
        tr.meta.cooldownTimer -= dt;
        this._trainEtaSec = Math.max(1, tr.meta.cooldownTimer);
        if (tr.meta.cooldownTimer <= 0) {
          tr.state = "cruising";
          tr.meta.pathPos = 0;
          tr.meta.stationLockout = 0;
        }
        return;
      }

      if (tr.state === "boarding") {
        tr.meta.dwellTimer -= dt;
        tr.frame = 0;
        this._trainEtaSec = 0;
        if (tr.meta.dwellTimer <= 0) {
          tr.state = "cruising";
          tr.meta.stationLockout = 3.5;
          tr.activityText = isLoop
            ? "Climbing Stone Viaducts Around Rack-Railway Loop"
            : "Departing Alpine Peak Valley Depot";
        }
        return;
      }

      // Cruising smoothly along ordered rail nodes
      tr.meta.stationLockout = Math.max(0, (tr.meta.stationLockout || 0) - dt);
      const speedCells = 2.15;
      const prevIdx = Math.floor(tr.meta.pathPos) % path.length;
      tr.meta.pathPos += speedCells * dt;

      if (!isLoop && tr.meta.pathPos >= path.length - 1) {
        tr.state = "cooldown";
        tr.meta.cooldownTimer = 9.0;
        this._trainEtaSec = 9;
        return;
      }

      if (isLoop && tr.meta.pathPos >= path.length) {
        tr.meta.pathPos -= path.length;
      }

      const idxA = Math.floor(tr.meta.pathPos) % path.length;
      const idxB = isLoop ? (idxA + 1) % path.length : Math.min(path.length - 1, idxA + 1);
      const frac = tr.meta.pathPos - Math.floor(tr.meta.pathPos);
      const cellA = path[idxA];
      const cellB = path[idxB];

      const fR = cellA.r + (cellB.r - cellA.r) * frac;
      const fC = cellA.c + (cellB.c - cellA.c) * frac;
      tr.r = Math.round(fR);
      tr.c = Math.round(fC);
      tr.u = clamp(4.0 + (fR - tr.r) * 8.0, 0.5, 7.5);
      tr.v = clamp(4.0 + (fC - tr.c) * 8.0, 0.5, 7.5);
      const viaductLift = cellA.id && cellA.id.startsWith("stone_viaduct_") ? 0.45 : 0.05;
      tr.z = this._getSurfaceZUnits(tr.r, tr.c, tr.u, tr.v) + viaductLift;
      tr.heading = velocityToHeading(cellB.r - cellA.r, cellB.c - cellA.c, tr.heading);
      this._advanceAnim(tr, dt, 7.0);

      // Compute live ETA to station
      const cellsToStop =
        idxA <= stationIdx
          ? stationIdx - tr.meta.pathPos
          : isLoop
          ? path.length - tr.meta.pathPos + stationIdx
          : 0;
      this._trainEtaSec = Math.max(1, cellsToStop / speedCells);

      // Trigger station stop when crossing `stationIdx`!
      if (tr.meta.stationLockout <= 0 && prevIdx !== stationIdx && idxA === stationIdx) {
        tr.state = "boarding";
        tr.meta.dwellTimer = 3.2;
        tr.activityText = "Boarding Skiers & Unloading Suitcase Travelers at Valley Depot!";
        this.earn(25, tr.r, tr.c, "🚆 +$25 Rail Express", "rail", false);
        if (this.audio && typeof this.audio.playTrainBell === "function") {
          this.audio.playTrainBell();
        }
      }
    }

    // -------------------------------------------------------------------------
    // Fleet (`piste_groomer`, `winch_cat_yellow`, `horse_sleigh`, `ski_shuttle_bus`,
    // `snowmobile`, `mini_zamboni`, `vip_helicopter`) & Wildlife (`golden_eagle`!)
    // -------------------------------------------------------------------------
    _stepCrewFleetAndWildlife(dt) {
      const poi = this._poi;
      const n = this._getGridSize();

      for (let i = 0; i < this.crew.length; i++) {
        const cObj = this.crew[i];
        if (cObj.role === "ski_instructor") continue; // updated in `_stepDucklingSquads`

        if (cObj.role === "vip_helicopter") {
          // 28s cycle: [0..8s) descend 21->0.2, [8..14s) landed on helipad (+$120!), [14..22s) climb 0.2->21, [22..28s) high scenic orbit
          cObj.meta.cycleTime = (cObj.meta.cycleTime + dt) % 28.0;
          const t = cObj.meta.cycleTime;
          this._advanceAnim(cObj, dt, 14.0); // fast crisp rotor blades!
          const pad = poi.helipads[0] || { r: cObj.anchorR, c: cObj.anchorC };

          if (t < 8.0) {
            const p = t / 8.0;
            cObj.r = pad.r;
            cObj.c = pad.c;
            cObj.u = 4.0 + (1 - p) * 2.2;
            cObj.v = 4.0 - (1 - p) * 2.2;
            cObj.extraZ = 20.5 * (1 - p * p) + 0.15;
            cObj.heading = "sw";
            cObj.activityText = "Final Approach Onto Illuminated Summit Helipad";
          } else if (t < 14.0) {
            if (!cObj.meta.paidThisCycle) {
              cObj.meta.paidThisCycle = true;
              this.heliDrops++;
              this.earn(120, pad.r, pad.c, "🚁 +$120 VIP Heli-Drop!", "heli", false);
              if (this.audio && typeof this.audio.playHeliRotor === "function") {
                this.audio.playHeliRotor();
              }
            }
            cObj.r = pad.r;
            cObj.c = pad.c;
            cObj.u = 4.0;
            cObj.v = 4.0;
            cObj.extraZ = 0.12;
            cObj.activityText = "Unloading VIP Powder Skiers on Summit Helipad!";
          } else if (t < 22.0) {
            cObj.meta.paidThisCycle = false;
            const p = (t - 14.0) / 8.0;
            cObj.r = pad.r;
            cObj.c = clamp(pad.c + Math.round(p * 2), 1, n - 2);
            cObj.u = 4.0;
            cObj.v = 4.0 + p * 2.0;
            cObj.extraZ = 0.15 + p * p * 20.5;
            cObj.heading = "se";
            cObj.activityText = "Lifting Off Summit Helipad Over Matterhorn Ridge";
          } else {
            const ang = ((t - 22.0) / 6.0) * Math.PI * 2;
            cObj.r = clamp(pad.r + 1 + Math.round(Math.sin(ang) * 2), 1, n - 2);
            cObj.c = clamp(pad.c + 2 + Math.round(Math.cos(ang) * 3), 1, n - 2);
            cObj.u = 4.0;
            cObj.v = 4.0;
            cObj.extraZ = 20.6;
            cObj.heading = Math.cos(ang) >= 0 ? "se" : "nw";
            cObj.activityText = "Banking Scenic Panorama Orbit Above Summit";
          }
          cObj.z = this._getSurfaceZUnits(cObj.r, cObj.c, cObj.u, cObj.v);
          continue;
        }

        if (cObj.role === "mini_zamboni" && poi.rinkCells.length > 0) {
          cObj.phase += dt * 1.05;
          this._advanceAnim(cObj, dt, 5.0);
          const idx = Math.floor((cObj.phase * 0.4) % poi.rinkCells.length);
          const rc = poi.rinkCells[idx];
          const dR = rc.r - cObj.r;
          const dC = rc.c - cObj.c;
          if (Math.abs(dR) + Math.abs(dC) > 0) {
            this._moveSubTile(cObj, Math.sign(dR) * 2.8 * dt, Math.sign(dC) * 2.8 * dt, true);
          } else {
            cObj.u = clamp(4.0 + Math.sin(cObj.phase * 2.0) * 2.2, 1.5, 6.5);
            cObj.heading = Math.cos(cObj.phase * 2.0) >= 0 ? "sw" : "ne";
          }
          continue;
        }

        if (cObj.role === "husky_dogsled") {
          cObj.phase += dt * 1.08;
          cObj.timer -= dt;
          this._advanceAnim(cObj, dt, 6.4);
          const trailPool =
            poi.huskyTrailCells.length > 0
              ? poi.huskyTrailCells
              : poi.nordicCells.length > 0
              ? poi.nordicCells
              : poi.townCells;
          if (trailPool.length > 0) {
            const wp = trailPool[(cObj.uid * 3 + Math.floor(cObj.phase * 0.65)) % trailPool.length];
            const dU = clamp(wp.r - cObj.r, -1, 1) * cObj.speed * 3.5 * dt;
            const dV = clamp(wp.c - cObj.c, -1, 1) * cObj.speed * 3.5 * dt;
            if (!this._moveSubTile(cObj, dU || 0.6 * dt, dV || 2.4 * dt, false)) {
              cObj.phase += 1.9;
            }
          }
          if (cObj.timer <= 0) {
            cObj.timer = 18.0;
            this.earn(24, cObj.r, cObj.c, "🐕 +$24 Husky Sled!", "shops", false);
          }
          continue;
        }

        if (cObj.role === "horse_sleigh" || cObj.role === "ski_shuttle_bus") {
          cObj.phase += dt * 0.95;
          cObj.timer -= dt;
          this._advanceAnim(cObj, dt, 5.8);
          const roadPool = poi.roadCells.length > 0 ? poi.roadCells : poi.townCells;
          if (roadPool.length > 0) {
            const wp = roadPool[Math.floor(cObj.phase * 0.75) % roadPool.length];
            const dU = clamp(wp.r - cObj.r, -1, 1) * cObj.speed * 3.4 * dt;
            const dV = clamp(wp.c - cObj.c, -1, 1) * cObj.speed * 3.4 * dt;
            if (!this._moveSubTile(cObj, dU || 0.4 * dt, dV || 2.6 * dt, false)) {
              cObj.phase += 2.1;
            }
          }
          if (cObj.timer <= 0) {
            if (cObj.role === "horse_sleigh") {
              cObj.timer = 17.0;
              this.earn(28, cObj.r, cObj.c, "🐴 +$28 Sleigh Tour", "shops", false);
              if (this.audio && typeof this.audio.playSleighBells === "function") {
                this.audio.playSleighBells();
              }
            } else {
              cObj.timer = 19.0;
              this.earn(18, cObj.r, cObj.c, "🚌 +$18 Ski Shuttle", "tickets", false);
            }
          }
          continue;
        }

        // `groomer`, `winch_cat`, `ski_patrol`, `snowmobile`, `snow_shoveler`
        cObj.phase += dt * 1.15;
        this._advanceAnim(cObj, dt, 5.6);
        const pool =
          cObj.role === "snow_shoveler"
            ? poi.townCells
            : cObj.role === "winch_cat" && poi.steepCells.length > 0
            ? poi.steepCells
            : poi.pisteCells;

        if (cObj.timer > 0 && (cObj.role === "ski_patrol" || cObj.role === "snowmobile")) {
          cObj.timer -= dt;
          const dU = clamp(cObj.targetR - cObj.r, -1, 1) * cObj.speed * 4.2 * dt;
          const dV = clamp(cObj.targetC - cObj.c, -1, 1) * cObj.speed * 4.2 * dt;
          this._moveSubTile(cObj, dU, dV, false);
          continue;
        }

        if (pool.length > 0) {
          const wp = pool[(cObj.uid * 5 + Math.floor(cObj.phase * 0.45)) % pool.length];
          const dU = clamp(wp.r - cObj.r, -1, 1) * cObj.speed * 3.2 * dt;
          const dV = clamp(wp.c - cObj.c, -1, 1) * cObj.speed * 3.2 * dt;
          this._moveSubTile(cObj, dU, dV, false);
          if (cObj.role === "groomer" || cObj.role === "winch_cat") {
            const rawCell = this.world.cells?.[cObj.r]?.[cObj.c];
            if (rawCell && typeof rawCell.pisteQuality === "number" && rawCell.pisteQuality < 99) {
              rawCell.pisteQuality = 100;
              this.tilesGroomedCount++;
            }
          }
        }
      }

      // Wildlife (`golden_eagle` high-altitude PASS 2.5 soaring + `st_bernard`, `alpine_ibex`, `red_deer`)
      for (let i = 0; i < this.wildlife.length; i++) {
        const w = this.wildlife[i];
        if (w.role === "golden_eagle") {
          w.phase += dt * 0.52;
          this._advanceAnim(w, dt, 4.2);
          const fR = clamp(w.anchorR + Math.sin(w.phase) * 3.2, 1.2, n - 2.2);
          const fC = clamp(w.anchorC + Math.sin(w.phase * 2.0) * 4.4, 1.2, n - 2.2);
          const dR = Math.cos(w.phase) * 3.2;
          const dC = Math.cos(w.phase * 2.0) * 8.8;
          w.r = Math.floor(fR);
          w.c = Math.floor(fC);
          w.u = clamp((fR - w.r) * 8.0, 0.5, 7.5);
          w.v = clamp((fC - w.c) * 8.0, 0.5, 7.5);
          w.z = this._getSurfaceZUnits(w.r, w.c, w.u, w.v);
          w.extraZ = 19.6 + Math.sin(w.phase * 1.5) * 1.2; // High above trees, below volumetric clouds!
          w.heading = velocityToHeading(dR, dC, w.heading);
          continue;
        }

        w.phase += dt * 0.95;
        this._advanceAnim(w, dt, 4.6);
        const dU = Math.cos(w.phase + w.uid) * w.speed * 2.4 * dt;
        const dV = Math.sin(w.phase * 1.2 + w.uid) * w.speed * 2.4 * dt;
        if (!this._moveSubTile(w, dU, dV, false)) {
          w.phase += Math.PI * 0.7;
        }
      }
    }

    // =========================================================================
    // 12 Resort Milestones & Star Rating Evaluator
    // =========================================================================

    _evaluateStatsAndChallenges(isInitialSeed = false) {
      const poi = this._poi;
      let warmSum = 0;
      let thrillSum = 0;
      const gLen = this.guests.length;
      if (gLen > 0) {
        for (let i = 0; i < gLen; i++) {
          warmSum += this.guests[i].warmth ?? 90;
          thrillSum += this.guests[i].thrill ?? 88;
        }
        this.avgWarmth = warmSum / gLen;
        this.avgThrill = thrillSum / gLen;
      }

      const liftCount = this.liftSystems.size;
      const distinctLiftTypes = new Set();
      let hasHighCableway = false;
      for (const sys of this.liftSystems.values()) {
        distinctLiftTypes.add(sys.lift.type);
        const topCell = this._cellFast(sys.lift.topR, sys.lift.topC);
        const topMaxLv = topCell ? (topCell.maxLevel !== undefined ? topCell.maxLevel : topCell.maxLv || 0) : 0;
        if (
          topCell &&
          topMaxLv >= 3 &&
          (sys.lift.type === "gondola" ||
            sys.lift.type === "egg_gondola" ||
            sys.lift.type === "bubble_6chair" ||
            sys.lift.type === "tramway_3s")
        ) {
          hasHighCableway = true;
        }
      }

      // Compute 1.0★ .. 5.0★ Resort Rating
      const rawRating =
        2.3 +
        Math.min(0.85, liftCount * 0.16) +
        Math.min(0.65, poi.allShops.length * 0.04) +
        (this.avgWarmth / 100) * 0.55 +
        (this.avgThrill / 100) * 0.45 +
        (this.avgPisteQuality / 100) * 0.3;
      this.resortRating = Math.round(clamp(rawRating, 1.0, 5.0) * 10) / 10;

      const checks = {
        first_chairlift: {
          ok: liftCount >= 1,
          prog: `${liftCount}/1 Lift`,
        },
        summit_cableway: {
          ok: hasHighCableway,
          prog: hasHighCableway ? "Lv 3+ Cableway Active" : "Build Gondola/Bubble/3S to Lv 3+",
        },
        diverse_lift_fleet: {
          ok: distinctLiftTypes.size >= 4 || liftCount >= 4,
          prog: `${Math.max(distinctLiftTypes.size, Math.min(4, liftCount))}/4 Lift Systems`,
        },
        fresh_corduroy: {
          ok: poi.pisteCells.length >= 28 && this.avgPisteQuality >= 84,
          prog: `${poi.pisteCells.length}/28 Pistes (${Math.round(this.avgPisteQuality)}%)`,
        },
        terrain_park_shredders: {
          ok: this.tricksLanded >= 8,
          prog: `${Math.min(8, this.tricksLanded)}/8 Park Tricks`,
        },
        ski_school_ducklings: {
          ok:
            this.ducklingSquads.length >= 1 &&
            (Boolean(poi.shopsByType.ski_school_lodge?.length) || distinctLiftTypes.has("magic_carpet")),
          prog: `${this.ducklingSquads.length} Duckling Squads`,
        },
        winter_lake_festival: {
          ok: Boolean(this.hockeyMatch) && this.curlingSheets.length >= 1,
          prog: this.hockeyMatch ? "3v3 Hockey & Curling Live" : "Place Hockey Goals & Curling Lane",
        },
        flagship_triad: {
          ok: poi.compositeCount >= 2,
          prog: `${poi.compositeCount}/2 Flagship 2x2 Landmarks`,
        },
        rack_railway_viaduct: {
          ok: poi.trainPath.length >= 14 && Boolean(poi.stationCell),
          prog: `${poi.trainPath.length}/14 Rail Tiles`,
        },
        vip_heli_summit: {
          ok: poi.helipads.length >= 1 || Boolean(poi.shopsByType.eagles_nest_skywalk?.length),
          prog: poi.helipads.length >= 1 ? "Summit Helipad Active" : "Place Summit Helipad / Skywalk",
        },
        night_skiing_lights: {
          ok: poi.lightCount >= 10,
          prog: `${poi.lightCount}/10 Resort Lights`,
        },
        bustling_peak_150: {
          ok: this.guests.length >= 150 && this.resortRating >= 4.6,
          prog: `${this.guests.length}/150 Guests (${this.resortRating.toFixed(1)}★)`,
        },
      };

      for (let i = 0; i < this.challenges.length; i++) {
        const ch = this.challenges[i];
        const st = checks[ch.id];
        if (!st) continue;
        ch.progressText = st.prog;
        if (st.ok && !ch.completed) {
          ch.completed = true;
          ch.discovered = true;
          if (!isInitialSeed) {
            this.earn(ch.reward, null, null, null, "milestones", false);
            if (this.audio && typeof this.audio.playDiscovery === "function") {
              this.audio.playDiscovery();
            }
            this.emitEvent({
              type: "milestone_completed",
              challenge: ch,
              milestone: ch,
              reward: ch.reward,
            });
          }
        }
      }
      this._baselineEvaluated = true;
    }

    // =========================================================================
    // Live Guest, Athlete & Vehicle Inspector (`findEntityAt`, `getEntityById`)
    // =========================================================================

    _formatInspectorPayload(raw) {
      if (!raw) return null;
      if (raw.liftType) {
        const rider = raw.passengerId ? this.guests.find((g) => g.id === raw.passengerId) : null;
        return {
          id: raw.id,
          type: raw.entityType,
          species: raw.entityType,
          name: rider ? `${rider.name} (On Lift)` : raw.label || "Aerial Lift Carrier",
          roleLabel: raw.label || "Alpine Cableway",
          skillBadge: rider ? rider.skill : "Transit",
          spriteKey: raw.spriteKey,
          r: raw.r,
          c: raw.c,
          u: raw.u,
          v: raw.v,
          worldZ: raw.worldZ,
          worldX: raw.cableWorldX,
          worldY: raw.cableWorldY + 24,
          activityText: raw.strand === "up" ? `Ascending ${raw.label}` : `Returning on ${raw.label}`,
          thoughtText: "Zero-drift Swiss cableway engineering above the spruces!",
          warmth: rider ? Math.round(rider.warmth) : 94,
          thrill: rider ? Math.round(rider.thrill) : 88,
          cashSpent: rider ? rider.cashSpent : 45,
          runsCompleted: rider ? rider.runsCompleted : 2,
        };
      }

      const maxF = V3_FOUR_FRAME_ENTITIES.has(raw.spriteType) ? 4 : 6;
      const safeFrame =
        raw.frame >= maxF || raw.frame < 0 ? ((raw.frame % maxF) + maxF) % maxF : raw.frame;
      const spriteKey = `${raw.spriteType}_${raw.heading}_f${safeFrame}`;
      const wp = this._toWorldPx(raw.r, raw.c, raw.u, raw.v, (raw.z || 0) + (raw.extraZ || 0));
      return {
        id: raw.id,
        type: raw.spriteType,
        species: raw.spriteType,
        name: raw.name || "Resort Visitor",
        roleLabel: raw.roleLabel || "Alpine Visitor",
        skillBadge: raw.skill || "Visitor",
        spriteKey,
        r: raw.r,
        c: raw.c,
        u: raw.u,
        v: raw.v,
        worldZ: (raw.z || 0) + (raw.extraZ || 0),
        worldX: wp.x,
        worldY: wp.y,
        activityText: raw.activityText || "Exploring Alpine Peak",
        thoughtText: raw.thoughtText || "Loving this bustling winter wonderland!",
        bio: raw.thoughtText || "Loving this bustling winter wonderland!",
        warmth: Math.round(raw.warmth ?? 94),
        thrill: Math.round(raw.thrill ?? 90),
        cashSpent: raw.cashSpent ?? 0,
        runsCompleted: raw.runsCompleted ?? 0,
      };
    }

    getEntityById(id) {
      if (!id) return null;
      this._flushPendingWorldSync();
      const g = this.guests.find((x) => x.id === id);
      if (g) return this._formatInspectorPayload(g);
      if (this.train && this.train.id === id) return this._formatInspectorPayload(this.train);
      const cs = this.coasterSleds.find((x) => x.id === id);
      if (cs) return this._formatInspectorPayload(cs);
      const sk = this.skySpectacles.find((x) => x.id === id);
      if (sk) return this._formatInspectorPayload(sk);
      const tp = this.torchlightParade.find((x) => x.id === id);
      if (tp) return this._formatInspectorPayload(tp);
      const sm = this.surfaceMovers.find((x) => x.id === id);
      if (sm) return this._formatInspectorPayload(sm);
      const c = this.crew.find((x) => x.id === id);
      if (c) return this._formatInspectorPayload(c);
      const w = this.wildlife.find((x) => x.id === id);
      if (w) return this._formatInspectorPayload(w);
      const ac = this.aerialCarriers.find((x) => x.id === id);
      if (ac) return this._formatInspectorPayload(ac);
      return null;
    }

    findEntityAt(worldX, worldY, maxRadiusPx = 30) {
      const wx = Number(worldX);
      const wy = Number(worldY);
      if (Number.isNaN(wx) || Number.isNaN(wy)) return null;
      this._flushPendingWorldSync();

      let best = null;
      let bestDist = maxRadiusPx;

      for (let i = 0; i < this.aerialCarriers.length; i++) {
        const ac = this.aerialCarriers[i];
        const d = Math.hypot(ac.cableWorldX - wx, ac.cableWorldY + 24 - wy);
        if (d < bestDist) {
          bestDist = d;
          best = ac;
        }
      }

      for (let i = 0; i < this.entities.length; i++) {
        const ri = this.entities[i];
        const d = Math.hypot(ri.worldX - wx, ri.worldY - 14 - wy);
        if (d < bestDist) {
          bestDist = d;
          best = ri.entityRef;
        }
      }
      return best ? this._formatInspectorPayload(best) : null;
    }

    inspectAt(worldX, worldY, maxRadiusPx = 30) {
      return this.findEntityAt(worldX, worldY, maxRadiusPx);
    }

    // =========================================================================
    // Floating Popups, Dynamic Night Lights & O(1) Painter-Sorted Cell Buckets
    // =========================================================================

    addFloatingPopup(r, c, text, color = "#a7f3d0") {
      const n = this._getGridSize();
      const rr = clamp(Math.round(r), 0, n - 1);
      const cc = clamp(Math.round(c), 0, n - 1);
      this.floatingPopups.push({
        r: rr,
        c: cc,
        u: 4.0,
        v: 4.0,
        z: this._getSurfaceZUnits(rr, cc, 4.0, 4.0),
        text: String(text),
        color,
        alpha: 1.0,
        liftPx: 0,
        age: 0,
        duration: 1.5,
      });
      if (this.floatingPopups.length > 28) this.floatingPopups.shift();
    }

    _updateFloatingPopups(dt) {
      for (let i = this.floatingPopups.length - 1; i >= 0; i--) {
        const p = this.floatingPopups[i];
        p.age += dt;
        const t = clamp(p.age / p.duration, 0, 1);
        p.liftPx = Math.round(t * 26);
        p.alpha = t < 0.55 ? 1.0 : clamp(1.0 - (t - 0.55) / 0.45, 0, 1);
        if (p.age >= p.duration) this.floatingPopups.splice(i, 1);
      }
    }

    _pushEntityToBuckets(ent, n) {
      if (ent.r < 0 || ent.r >= n || ent.c < 0 || ent.c >= n) return;
      const maxF = V3_FOUR_FRAME_ENTITIES.has(ent.spriteType) ? 4 : 6;
      const safeFrame =
        ent.frame >= maxF || ent.frame < 0 ? ((ent.frame % maxF) + maxF) % maxF : ent.frame;
      const extraZ = ent.extraZ || 0;
      const totalZ = (ent.z || 0) + extraZ;
      const worldX = (ent.c - ent.r) * HALF_W + (ent.v - ent.u) * 8.0;
      const worldY = (ent.r + ent.c) * HALF_H + (ent.u + ent.v) * 4.0 - totalZ * 4.0;
      const isVehicle =
        ent.category === "crew" || ent.category === "fleet" || ent.category === "train";
      const headlightDir =
        ent.hasHeadlights || HEADLIGHT_SPRITES.has(ent.spriteType) ? ent.heading : null;
      const hasLitCabin = Boolean(ent.hasLitCabin || LIT_CABIN_SPRITES.has(ent.spriteType));

      let ri = ent._renderItem;
      if (!ri) {
        ri = {
          uid: ent.uid,
          id: ent.id,
          type: ent.spriteType,
          entityType: ent.spriteType,
          species: ent.spriteType,
          category: ent.category,
          isVehicle,
          name: ent.name,
          roleLabel: ent.roleLabel,
          activityText: ent.activityText,
          thoughtText: ent.thoughtText,
          warmth: ent.warmth,
          thrill: ent.thrill,
          cashSpent: ent.cashSpent,
          spriteKey: `${ent.spriteType}_${ent.heading}_f${safeFrame}`,
          _lastSpriteType: ent.spriteType,
          _lastHeading: ent.heading,
          _lastFrame: safeFrame,
          dir: ent.heading,
          heading: ent.heading,
          frame: safeFrame,
          r: ent.r,
          c: ent.c,
          u: ent.u,
          v: ent.v,
          z: ent.z,
          extraZ,
          burnerGlow: ent.burnerGlow || 0,
          groundShadowZ: ent.groundShadowZ || 0,
          torchGlow: ent.torchGlow || 0,
          cameraFlash: ent.cameraFlash || 0,
          headlightDir,
          hasLitCabin,
          screenOffsetY: -Math.round(extraZ * 4.0),
          worldX,
          worldY,
          entityRef: ent,
        };
        ent._renderItem = ri;
      } else {
        ri.uid = ent.uid;
        ri.type = ent.spriteType;
        ri.entityType = ent.spriteType;
        ri.species = ent.spriteType;
        ri.category = ent.category;
        ri.isVehicle = isVehicle;
        ri.roleLabel = ent.roleLabel;
        ri.activityText = ent.activityText;
        ri.thoughtText = ent.thoughtText;
        ri.warmth = ent.warmth;
        ri.thrill = ent.thrill;
        ri.cashSpent = ent.cashSpent;
        if (
          ri._lastSpriteType !== ent.spriteType ||
          ri._lastHeading !== ent.heading ||
          ri._lastFrame !== safeFrame
        ) {
          ri._lastSpriteType = ent.spriteType;
          ri._lastHeading = ent.heading;
          ri._lastFrame = safeFrame;
          ri.spriteKey = `${ent.spriteType}_${ent.heading}_f${safeFrame}`;
        }
        ri.dir = ent.heading;
        ri.heading = ent.heading;
        ri.frame = safeFrame;
        ri.r = ent.r;
        ri.c = ent.c;
        ri.u = ent.u;
        ri.v = ent.v;
        ri.z = ent.z;
        ri.extraZ = extraZ;
        ri.burnerGlow = ent.burnerGlow || 0;
        ri.groundShadowZ = ent.groundShadowZ || 0;
        ri.torchGlow = ent.torchGlow || 0;
        ri.cameraFlash = ent.cameraFlash || 0;
        ri.headlightDir = headlightDir;
        ri.hasLitCabin = hasLitCabin;
        ri.screenOffsetY = -Math.round(extraZ * 4.0);
        ri.worldX = worldX;
        ri.worldY = worldY;
      }

      this.entities.push(ri);
      this._cellBuckets[ent.r * n + ent.c].push(ri);
    }

    _rebuildCellBuckets() {
      const n = this._getGridSize();
      const total = n * n;
      if (this._bucketGridSize !== n || this._cellBuckets.length !== total) {
        this._bucketGridSize = n;
        this._cellBuckets = Array.from({ length: total }, () => []);
      } else {
        for (let i = 0; i < total; i++) this._cellBuckets[i].length = 0;
      }

      this.entities.length = 0;
      for (let i = 0; i < this.guests.length; i++) {
        this._pushEntityToBuckets(this.guests[i], n);
      }
      for (let i = 0; i < this.surfaceMovers.length; i++) {
        this._pushEntityToBuckets(this.surfaceMovers[i], n);
      }
      for (let i = 0; i < this.coasterSleds.length; i++) {
        this._pushEntityToBuckets(this.coasterSleds[i], n);
      }
      for (let i = 0; i < this.crew.length; i++) {
        this._pushEntityToBuckets(this.crew[i], n);
      }
      for (let i = 0; i < this.wildlife.length; i++) {
        this._pushEntityToBuckets(this.wildlife[i], n);
      }
      for (let i = 0; i < this.skySpectacles.length; i++) {
        this._pushEntityToBuckets(this.skySpectacles[i], n);
      }
      if (this._isTorchlightParadeActive()) {
        for (let i = 0; i < this.torchlightParade.length; i++) {
          this._pushEntityToBuckets(this.torchlightParade[i], n);
        }
      }
      if (this.train && this.train.state !== "cooldown") {
        this._pushEntityToBuckets(this.train, n);
      }

      for (let i = 0; i < total; i++) {
        const b = this._cellBuckets[i];
        const len = b.length;
        if (len === 2) {
          if (compareBucketItems(b[0], b[1]) > 0) {
            const tmp = b[0];
            b[0] = b[1];
            b[1] = tmp;
          }
        } else if (len > 2) {
          b.sort(compareBucketItems);
        }
      }
    }

    getEntitiesInCell(r, c) {
      this._flushPendingWorldSync();
      const n = this._bucketGridSize;
      if (r < 0 || r >= n || c < 0 || c >= n) return EMPTY_BUCKET;
      return this._cellBuckets[r * n + c] || EMPTY_BUCKET;
    }

    getDynamicLightSources() {
      this._flushPendingWorldSync();
      const lights = this._dynamicLights;
      lights.length = 0;
      for (let i = 0; i < this.crew.length; i++) {
        const m = this.crew[i];
        if (
          m.role === "groomer" ||
          m.role === "winch_cat" ||
          m.role === "snowmobile" ||
          m.role === "ski_shuttle_bus" ||
          m.role === "horse_sleigh" ||
          m.role === "husky_dogsled" ||
          m.role === "vip_helicopter"
        ) {
          let li = m._lightItem;
          if (!li) {
            li = {
              type: m.spriteType,
              r: m.r,
              c: m.c,
              u: m.u,
              v: m.v,
              z: (m.z || 0) + (m.extraZ || 0),
              radius: m.role === "vip_helicopter" ? 3.5 : m.role === "husky_dogsled" ? 2.3 : 2.8,
              color: m.role === "horse_sleigh" || m.role === "husky_dogsled" ? "#ffc872" : "#e0f2fe",
              intensity: 0.92,
            };
            m._lightItem = li;
          } else {
            li.type = m.spriteType;
            li.r = m.r;
            li.c = m.c;
            li.u = m.u;
            li.v = m.v;
            li.z = (m.z || 0) + (m.extraZ || 0);
          }
          lights.push(li);
        }
      }
      if (this.train && this.train.state !== "cooldown") {
        let tLight = this.train._lightItem;
        if (!tLight) {
          tLight = {
            type: "alpine_train",
            r: this.train.r,
            c: this.train.c,
            u: this.train.u,
            v: this.train.v,
            z: this.train.z,
            radius: 3.2,
            color: "#ffca7a",
            intensity: 0.96,
          };
          this.train._lightItem = tLight;
        } else {
          tLight.r = this.train.r;
          tLight.c = this.train.c;
          tLight.u = this.train.u;
          tLight.v = this.train.v;
          tLight.z = this.train.z;
        }
        lights.push(tLight);
      }
      for (let i = 0; i < this.aerialCarriers.length; i++) {
        const ac = this.aerialCarriers[i];
        if (ac.hasLitCabin) {
          let acLight = ac._lightItem;
          if (!acLight) {
            acLight = {
              type: ac.entityType,
              r: ac.r,
              c: ac.c,
              u: ac.u,
              v: ac.v,
              z: ac.worldZ,
              radius: ac.entityType === "tram_cabin_3s" ? 2.6 : 1.9,
              color: "#ffbe6b",
              intensity: 0.82,
            };
            ac._lightItem = acLight;
          } else {
            acLight.type = ac.entityType;
            acLight.r = ac.r;
            acLight.c = ac.c;
            acLight.u = ac.u;
            acLight.v = ac.v;
            acLight.z = ac.worldZ;
            acLight.radius = ac.entityType === "tram_cabin_3s" ? 2.6 : 1.9;
          }
          lights.push(acLight);
        }
      }
      if (this._isTorchlightParadeActive()) {
        for (let i = 0; i < this.torchlightParade.length; i++) {
          const ts = this.torchlightParade[i];
          let tl = ts._lightItem;
          if (!tl) {
            tl = {
              type: "torchlight_skier",
              r: ts.r,
              c: ts.c,
              u: ts.u,
              v: ts.v,
              z: ts.z + 0.6,
              radius: 2.3,
              color: "#ffb347",
              intensity: ts.torchGlow || 0.94,
            };
            ts._lightItem = tl;
          } else {
            tl.r = ts.r;
            tl.c = ts.c;
            tl.u = ts.u;
            tl.v = ts.v;
            tl.z = ts.z + 0.6;
            tl.intensity = ts.torchGlow || 0.94;
          }
          lights.push(tl);
        }
      }
      for (let i = 0; i < this._activeFireworks.length; i++) {
        const fw = this._activeFireworks[i];
        if (!fw.isBurst) continue;
        let fl = fw._lightItem;
        if (!fl) {
          fl = {
            type: "firework_burst",
            r: fw.r,
            c: fw.c,
            u: fw.u,
            v: fw.v,
            z: fw.z,
            radius: 4.4,
            color: fw.glowColor,
            intensity: fw.alpha * 0.95,
          };
          fw._lightItem = fl;
        } else {
          fl.r = fw.r;
          fl.c = fw.c;
          fl.u = fw.u;
          fl.v = fw.v;
          fl.z = fw.z;
          fl.color = fw.glowColor;
          fl.intensity = fw.alpha * 0.95;
        }
        lights.push(fl);
      }
      return lights;
    }

    getLightSources() {
      return this.getDynamicLightSources();
    }

    serialize() {
      return {
        cash: this.cash,
        sandboxMode: this.sandboxMode,
        totalRevenue: this.totalRevenue,
        revenueBreakdown: { ...this.revenueBreakdown },
        tricksLanded: this.tricksLanded,
        hockeyGoals: this.hockeyGoals,
        heliDrops: this.heliDrops,
        tilesGroomedCount: this.tilesGroomedCount,
        completedChallenges: this.challenges.filter((c) => c.completed).map((c) => c.id),
      };
    }

    deserialize(data) {
      if (!data || typeof data !== "object") return;
      this.resetForWorld(this.world, { keepCash: true });
      if (typeof data.cash === "number") this.cash = data.cash;
      if (typeof data.sandboxMode === "boolean") this.sandboxMode = data.sandboxMode;
      if (typeof data.totalRevenue === "number") this.totalRevenue = data.totalRevenue;
      if (data.revenueBreakdown && typeof data.revenueBreakdown === "object") {
        Object.assign(this.revenueBreakdown, data.revenueBreakdown);
      }
      if (typeof data.tricksLanded === "number") this.tricksLanded = data.tricksLanded;
      if (typeof data.hockeyGoals === "number") this.hockeyGoals = data.hockeyGoals;
      if (typeof data.heliDrops === "number") this.heliDrops = data.heliDrops;
      if (typeof data.tilesGroomedCount === "number") this.tilesGroomedCount = data.tilesGroomedCount;
      if (Array.isArray(data.completedChallenges)) {
        for (const id of data.completedChallenges) {
          if (this.challengesById[id]) {
            this.challengesById[id].completed = true;
            this.challengesById[id].discovered = true;
          }
        }
      }
      this._evaluateStatsAndChallenges(true);
      this._rebuildCellBuckets();
    }
  }

  const EMPTY_BUCKET = Object.freeze([]);

  global.SanctuarySim = SanctuarySim;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SanctuarySim;
  }
})(typeof window !== "undefined" ? window : globalThis);
