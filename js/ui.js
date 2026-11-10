/* ============================================================================
 * Alpine Peak v3 — Grand Ski Resort, Winter Festival & Night Mode 2.0 Tycoon
 * Interactive Chalet Studio Controller (`window.SanctuaryUI` & `window.app`)
 * 174-Variety Catalog across 5 Tabs (32 + 30 + 35 + 33 + 44 = 174)
 * ============================================================================ */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. Metadata for All 10 Uphill Lift Systems (#68 & #78)
  // ---------------------------------------------------------------------------
  const LIFT_META = {
    magic_carpet: {
      name: "Covered Magic Carpet Conveyor",
      shortName: "Magic Carpet",
      badge: "Surface Conveyor",
      minLen: 2,
      iconCandidates: ["magic_carpet_base_ns_f0", "magic_carpet_mid_ns", "magic_carpet_base_ew_f0"],
    },
    rope_tow: {
      name: "Beginner Surface Rope Tow",
      shortName: "Rope Tow",
      badge: "Surface Lift",
      minLen: 3,
      iconCandidates: ["rope_tow_base_f0", "rope_tow_top_f0"],
    },
    tbar_lift: {
      name: "Glacier Bowl Surface T-Bar",
      shortName: "T-Bar Lift",
      badge: "Surface T-Bar",
      minLen: 3,
      iconCandidates: ["tbar_base_ns_f0", "tbar_pylon_ns", "tbar_base_ew_f0"],
    },
    classic_2chair: {
      name: "Heritage Double Chairlift",
      shortName: "2-Chair",
      badge: "Aerial Chairlift",
      minLen: 3,
      iconCandidates: ["classic_2chair_base_ns_f0", "lift_pylon_ns", "classic_2chair_base_ew_f0"],
    },
    chairlift: {
      name: "Detachable Quad Chairlift",
      shortName: "Quad Chair",
      badge: "Aerial Chairlift",
      minLen: 3,
      iconCandidates: ["chairlift_base_ns_f0", "lift_pylon_ns", "chairlift_base_ew_f0"],
    },
    bubble_6chair: {
      name: "Express 6-Pack Bubble Chair",
      shortName: "6-Bubble",
      badge: "Heated Bubble Lift",
      minLen: 3,
      iconCandidates: ["bubble_6chair_base_ns_f0", "lift_pylon_ns", "bubble_6chair_base_ew_f0"],
    },
    egg_gondola: {
      name: "Retro 4-Person Egg Gondola",
      shortName: "Egg Gondola",
      badge: "Aerial Gondola",
      minLen: 4,
      iconCandidates: ["egg_gondola_base_ns_f0", "gondola_pylon_ns", "egg_gondola_base_ew_f0"],
    },
    gondola: {
      name: "Red Summit Express Gondola",
      shortName: "Red Gondola",
      badge: "Aerial Gondola",
      minLen: 4,
      iconCandidates: ["gondola_base_ns_f0", "gondola_pylon_ns", "gondola_base_ew_f0"],
    },
    tramway_3s: {
      name: "Swiss 3S Panoramic Tramway",
      shortName: "3S Tramway",
      badge: "3S Tri-Cable Tram",
      minLen: 4,
      iconCandidates: ["tramway_3s_base_ns_f0", "tramway_pylon_ns", "tramway_3s_base_ew_f0"],
    },
    cliff_funicular: {
      name: "Stepped Cliff Cog Funicular",
      shortName: "Funicular",
      badge: "Inclined Rail Lift",
      minLen: 3,
      iconCandidates: ["funicular_base_ns_f0", "funicular_track_ns", "funicular_base_ew_f0"],
    },
  };

  // ---------------------------------------------------------------------------
  // 2. 5-Category 174-Item Alpine Construction Catalog (Locked to #125 & #139)
  // ---------------------------------------------------------------------------
  const PALETTE_TABS = [
    // =========================================================================
    // TAB 1: SCULPT & SNOW (32 items: 11 Brushes + 8 Snow + 9 Paving + 4 Water)
    // =========================================================================
    {
      id: "sculpt",
      label: "Sculpt & Snow",
      subFilters: [
        { id: "all", label: "All" },
        { id: "brushes", label: "Brushes" },
        { id: "snow", label: "Snow & Ice" },
        { id: "paving", label: "Village Paving" },
        { id: "water", label: "Water" },
      ],
      items: [
        // 11 Sculpt Brushes & Hero Landform Stamps (`sub: "brushes"`)
        {
          id: "sculpt_matterhorn_peak",
          sub: "brushes",
          name: "Matterhorn Pyramid Horn (3x3)",
          shortLabel: "Horn Peak",
          cost: 85,
          kind: "sculpt",
          sculptMode: "sculpt_matterhorn_peak",
          radius: 1,
          footprint: 3,
          dragPaint: false,
          spriteCandidates: [
            "ui_matterhorn_peak",
            "summit_crag_v0",
            "untouched_powder_lv4_v0",
          ],
          badgeText: "3x3▲",
          badgeColor: "#e6b968",
          desc: "One-click 3×3 alpine horn stamp raising a dramatic pyramidal summit peak with granite scree flanks!",
        },
        {
          id: "sculpt_glacial_bowl",
          sub: "brushes",
          name: "Glacial Ski Cirque Bowl (5x5)",
          shortLabel: "Glacial Bowl",
          cost: 95,
          kind: "sculpt",
          sculptMode: "sculpt_glacial_bowl",
          radius: 2,
          footprint: 5,
          dragPaint: false,
          spriteCandidates: [
            "ui_glacial_bowl",
            "glacier_ice_lv2_v0",
            "groomed_piste_lv1_v0",
          ],
          badgeText: "5x5∪",
          badgeColor: "#6cc4f8",
          desc: "Carves a sweeping 5×5 U-shaped concave ski amphitheater framed by sheltered side ridges!",
        },
        {
          id: "sculpt_cliff_balcony",
          sub: "brushes",
          name: "Walled Cliff Overlook Terrace (2x2)",
          shortLabel: "Cliff Terrace",
          cost: 70,
          kind: "sculpt",
          sculptMode: "sculpt_cliff_balcony",
          radius: 0,
          footprint: 2,
          dragPaint: false,
          spriteCandidates: [
            "ui_cliff_balcony",
            "festive_mosaic_cobble_lv1_v0",
            "retaining_wall_ns",
          ],
          badgeText: "2x2=",
          badgeColor: "#7ad99b",
          desc: "Grades a 2×2 cliffside sun-terrace paved in Star Mosaic and auto-lines downhill drops with stone walls!",
        },
        {
          id: "sculpt_raise",
          sub: "brushes",
          name: "Raise Mountain (+1 · 1x1)",
          shortLabel: "Raise +1",
          cost: 20,
          kind: "sculpt",
          sculptMode: "raise",
          radius: 0,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["untouched_powder_lv2_v0", "untouched_powder_lv1_v0"],
          badgeText: "+1",
          badgeColor: "#7ad99b",
          desc: "Click or drag to raise single mountain cells up toward Summit Lv 4 granite cliffs.",
        },
        {
          id: "sculpt_lower",
          sub: "brushes",
          name: "Carve Bowl (-1 · 1x1)",
          shortLabel: "Lower -1",
          cost: 20,
          kind: "sculpt",
          sculptMode: "lower",
          radius: 0,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["groomed_piste_lv0_v0", "untouched_powder_lv0_v0"],
          badgeText: "-1",
          badgeColor: "#f2a65a",
          desc: "Lower single mountain cells down toward Valley Lv 0 to carve ski bowls and creek beds.",
        },
        {
          id: "sculpt_level",
          sub: "brushes",
          name: "Level Terrace (1x1)",
          shortLabel: "Terrace",
          cost: 25,
          kind: "sculpt",
          sculptMode: "level",
          radius: 0,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["alpine_cobble_lv1_v0", "alpine_cobble_lv0_v0"],
          badgeText: "=",
          badgeColor: "#e6b968",
          desc: "Drag across slopes to grade a crisp flat terrace for lift stations, chalets, or shops.",
        },
        {
          id: "sculpt_raise_3x3",
          sub: "brushes",
          name: "Raise Alpine Massif (3x3)",
          shortLabel: "3x3 Massif",
          cost: 45,
          kind: "sculpt",
          sculptMode: "raise_3x3",
          brushBase: "raise",
          radius: 1,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["untouched_powder_lv3_v0", "untouched_powder_lv2_v0"],
          badgeText: "3x3+",
          badgeColor: "#7ad99b",
          desc: "Sculpt sweeping 3x3 mountain peaks and summit ridges in a single stroke.",
        },
        {
          id: "sculpt_lower_3x3",
          sub: "brushes",
          name: "Carve Glacial Cirque (3x3)",
          shortLabel: "3x3 Cirque",
          cost: 45,
          kind: "sculpt",
          sculptMode: "lower_3x3",
          brushBase: "lower",
          radius: 1,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["glacier_ice_lv1_v0", "untouched_powder_lv0_v0"],
          badgeText: "3x3-",
          badgeColor: "#f2a65a",
          desc: "Excavate broad 3x3 alpine amphitheaters, glacier bowls, and valley lake basins.",
        },
        {
          id: "sculpt_level_3x3",
          sub: "brushes",
          name: "Grade Village Plateau (3x3)",
          shortLabel: "3x3 Plateau",
          cost: 50,
          kind: "sculpt",
          sculptMode: "level_3x3",
          brushBase: "level",
          radius: 1,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["red_brick_lv1_v0", "alpine_cobble_lv1_v0"],
          badgeText: "3x3=",
          badgeColor: "#e6b968",
          desc: "Flatten a 3x3 terrace at the clicked elevation — ideal for 2x2 Grand Hotels & Spas!",
        },
        {
          id: "sculpt_smooth",
          sub: "brushes",
          name: "Smooth Skiable Grade (3x3)",
          shortLabel: "Smooth",
          cost: 30,
          kind: "sculpt",
          sculptMode: "smooth",
          brushBase: "smooth",
          radius: 1,
          footprint: 1,
          dragPaint: true,
          spriteCandidates: ["groomed_piste_slope_1100_lv1", "groomed_piste_lv1_v0"],
          badgeText: "~",
          badgeColor: "#6cc4f8",
          desc: "Blends sharp ledges toward neighbor elevations to create continuous skiable ramps.",
        },
        {
          id: "sculpt_corridor",
          sub: "brushes",
          name: "2x2 Piste Trail Cutter",
          shortLabel: "Trail Cut",
          cost: 40,
          kind: "sculpt",
          sculptMode: "corridor",
          brushBase: "corridor",
          radius: 0,
          footprint: 2,
          dragPaint: true,
          spriteCandidates: ["groomed_piste_lv2_v0", "groomed_piste_lv1_v0"],
          badgeText: "2x2",
          badgeColor: "#6cc4f8",
          desc: "Clears dense trees/boulders in a 2x2 swath and grooms fresh corduroy ski piste!",
        },

        // 8 Mountain Snow & Ice Surfaces (`sub: "snow"`)
        {
          id: "untouched_powder",
          sub: "snow",
          name: "Deep Backcountry Powder",
          shortLabel: "Powder",
          cost: 10,
          kind: "surface",
          surfaceId: "untouched_powder",
          dragPaint: true,
          spriteCandidates: ["untouched_powder_lv1_v0", "untouched_powder_lv0_v0"],
          desc: "Sparkling untouched alpine powder snow casting scalloped drifts onto village stone.",
        },
        {
          id: "groomed_piste",
          sub: "snow",
          name: "Groomed Corduroy Piste",
          shortLabel: "Corduroy",
          cost: 20,
          kind: "surface",
          surfaceId: "groomed_piste",
          dragPaint: true,
          spriteCandidates: ["groomed_piste_lv1_v0", "groomed_piste_lv0_v0"],
          desc: "Fast machine-ribbed corduroy ski run — connect from lift tops down to base lodges!",
        },
        {
          id: "mogul_chute",
          sub: "snow",
          name: "Black-Diamond Mogul Chute",
          shortLabel: "Moguls",
          cost: 25,
          kind: "surface",
          surfaceId: "mogul_chute",
          dragPaint: true,
          spriteCandidates: ["mogul_chute_lv2_v0", "mogul_chute_lv1_v0", "mogul_chute_lv0_v0"],
          desc: "Bumpy sculpted mogul cushions on steep chutes for expert skiers.",
        },
        {
          id: "glacier_ice",
          sub: "snow",
          name: "Blue Alpine Glacier Sheet",
          shortLabel: "Glacier Ice",
          cost: 28,
          kind: "surface",
          surfaceId: "glacier_ice",
          dragPaint: true,
          spriteCandidates: ["glacier_ice_lv3_v0", "glacier_ice_lv2_v0", "glacier_ice_lv0_v0"],
          desc: "Luminous high-altitude cyan glacier ice with natural crystalline stress seams.",
        },
        {
          id: "wind_hardpack",
          sub: "snow",
          name: "Wind-Scoured Ridge Hardpack",
          shortLabel: "Hardpack",
          cost: 18,
          kind: "surface",
          surfaceId: "wind_hardpack",
          dragPaint: true,
          spriteCandidates: ["wind_hardpack_lv2_v0", "wind_hardpack_lv1_v0", "wind_hardpack_lv0_v0"],
          desc: "Crisp wind-rippled sastrugi snowpack along exposed upper ridges and race courses.",
        },
        {
          id: "spring_slush",
          sub: "snow",
          name: "Sun-Warmed Corn Snow",
          shortLabel: "Corn Snow",
          cost: 16,
          kind: "surface",
          surfaceId: "spring_slush",
          dragPaint: true,
          spriteCandidates: ["spring_slush_lv1_v0", "spring_slush_lv0_v0"],
          desc: "Soft sun-kissed lower-valley spring snow for relaxed afternoon cruisers.",
        },
        {
          id: "tubing_chute",
          sub: "snow",
          name: "Banked Snow-Tubing Lanes",
          shortLabel: "Tubing Lane",
          cost: 30,
          kind: "surface",
          surfaceId: "tubing_chute",
          dragPaint: true,
          spriteCandidates: ["tubing_chute_lv1_v0", "tubing_chute_lv0_v0"],
          desc: "Twin sculpted U-channel snow chutes where inflatable snow-tubers spin downhill!",
        },
        {
          id: "nordic_track",
          sub: "snow",
          name: "Nordic XC Classic Track",
          shortLabel: "XC Track",
          cost: 22,
          kind: "surface",
          surfaceId: "nordic_track",
          dragPaint: true,
          spriteCandidates: ["nordic_track_lv1_v0", "nordic_track_lv0_v0"],
          desc: "Machine-set parallel cross-country ski grooves winding through quiet pine glades.",
        },

        // 9 Village Paving, Festival Mosaic & Rock Surfaces (`sub: "paving"`)
        {
          id: "festive_mosaic_cobble",
          sub: "paving",
          name: "Star-of-Zermatt Mosaic Plaza",
          shortLabel: "Star Mosaic",
          cost: 38,
          kind: "surface",
          surfaceId: "festive_mosaic_cobble",
          dragPaint: true,
          spriteCandidates: [
            "festive_mosaic_cobble_lv0_v0",
            "festive_mosaic_cobble_lv1_v0",
            "alpine_cobble_lv0_v0",
          ],
          desc: "Heated bicolored porphyry & compass-star stone mosaic for Winter Festival plazas.",
        },
        {
          id: "crystal_ice_promenade",
          sub: "paving",
          name: "Luminous Crystal Ice Promenade",
          shortLabel: "Ice Walk",
          cost: 42,
          kind: "surface",
          surfaceId: "crystal_ice_promenade",
          dragPaint: true,
          spriteCandidates: [
            "crystal_ice_promenade_lv0_v0",
            "crystal_ice_promenade_lv1_v0",
            "glacier_ice_lv0_v0",
          ],
          desc: "Translucent frost-blue glacier block promenade glowing softly beside Ice Palaces & rinks.",
        },
        {
          id: "alpine_cobble",
          sub: "paving",
          name: "Heated European Cobblestone",
          shortLabel: "Cobble",
          cost: 30,
          kind: "surface",
          surfaceId: "alpine_cobble",
          dragPaint: true,
          spriteCandidates: ["alpine_cobble_lv0_v0", "alpine_cobble_lv1_v0"],
          desc: "Snow-melted grey porphyry cobblestone streets for village shoppers & horse sleighs.",
        },
        {
          id: "red_brick",
          sub: "paving",
          name: "Herringbone Market Brick",
          shortLabel: "Red Brick",
          cost: 32,
          kind: "surface",
          surfaceId: "red_brick",
          dragPaint: true,
          spriteCandidates: ["red_brick_lv0_v0", "red_brick_lv1_v0"],
          desc: "Warm terracotta herringbone brick paving for festive Christmas Market squares.",
        },
        {
          id: "packed_snow_path",
          sub: "paving",
          name: "Boot-Packed Village Snow Lane",
          shortLabel: "Snow Path",
          cost: 18,
          kind: "surface",
          surfaceId: "packed_snow_path",
          dragPaint: true,
          spriteCandidates: ["packed_snow_path_lv0_v0", "packed_snow_path_lv1_v0"],
          desc: "Cozy compacted snow footpath for sled-pulling families, dog walkers & skiers.",
        },
        {
          id: "timber_deck",
          sub: "paving",
          name: "Honey-Cedar Sun Terrace Deck",
          shortLabel: "Cedar Deck",
          cost: 34,
          kind: "surface",
          surfaceId: "timber_deck",
          dragPaint: true,
          spriteCandidates: ["timber_deck_lv0_v0", "timber_deck_lv1_v0"],
          desc: "Warm alpine cedar plank decking for outdoor fondue patios, hot tubs & Schirmbars.",
        },
        {
          id: "slate_flagstone",
          sub: "paving",
          name: "Alpine Slate Ashlar Plaza",
          shortLabel: "Flagstone",
          cost: 32,
          kind: "surface",
          surfaceId: "slate_flagstone",
          dragPaint: true,
          spriteCandidates: ["slate_flagstone_lv0_v0", "slate_flagstone_lv1_v0"],
          desc: "Dressed dark mountain slate flagstones with crisp frost-limned mortar joints.",
        },
        {
          id: "asphalt_road",
          sub: "paving",
          name: "Plowed Resort Shuttle Road",
          shortLabel: "Shuttle Rd",
          cost: 28,
          kind: "surface",
          surfaceId: "asphalt_road",
          dragPaint: true,
          spriteCandidates: ["asphalt_road_lv0_v0", "asphalt_road_lv1_v0"],
          desc: "Snow-plowed valley tarmac with dashed markings for electric ski-shuttle buses.",
        },
        {
          id: "alpine_scree",
          sub: "paving",
          name: "Granite Talus & Scree",
          shortLabel: "Scree Rock",
          cost: 15,
          kind: "surface",
          surfaceId: "alpine_scree",
          dragPaint: true,
          spriteCandidates: ["alpine_scree_lv3_v0", "alpine_scree_lv2_v0", "alpine_scree_lv0_v0"],
          desc: "Exposed rugged granite talus and snow-dusted moraine rock along high ridges.",
        },

        // 4 Water, Creek, Waterfalls & Crevasses (`sub: "water"`)
        {
          id: "meltwater_brook",
          sub: "water",
          name: "Rushing Creek & Waterfall",
          shortLabel: "Waterfall",
          cost: 40,
          kind: "water",
          waterId: "meltwater_brook",
          dragPaint: true,
          spriteCandidates: [
            "cascading_waterfall_sw_f0",
            "meltwater_brook_lv1_f0",
            "meltwater_brook_lv0_f0",
          ],
          desc: "Unfrozen cerulean mountain stream — paint across 1100/1001 slopes for churning waterfalls!",
        },
        {
          id: "frozen_lake",
          sub: "water",
          name: "Frozen Skating & Hockey Lake",
          shortLabel: "Ice Lake",
          cost: 35,
          kind: "water",
          waterId: "frozen_lake",
          dragPaint: true,
          spriteCandidates: ["frozen_lake_lv0_f0", "frozen_lake_lv1_f0"],
          desc: "Mirror glacier ice lagoon for figure skaters, pond hockey & icefalls on slopes.",
        },
        {
          id: "thermal_spring",
          sub: "water",
          name: "Steaming Mineral Hot Spring",
          shortLabel: "Hot Spring",
          cost: 55,
          kind: "water",
          waterId: "thermal_spring",
          dragPaint: true,
          spriteCandidates: ["thermal_spring_lv0_f0", "thermal_spring_lv1_f0"],
          desc: "Turquoise geothermal spring framed by snowy boulders where bathers soak (Lv 0–2).",
        },
        {
          id: "glacier_crevasse",
          sub: "water",
          name: "Deep Blue Glacier Crevasse",
          shortLabel: "Crevasse",
          cost: 45,
          kind: "water",
          waterId: "glacier_crevasse",
          dragPaint: true,
          spriteCandidates: ["glacier_crevasse_lv3_f0", "glacier_crevasse_lv2_f0", "glacier_crevasse_lv0_f0"],
          desc: "Dramatic cobalt-cyan abyssal glacier fissure across high alpine icefields.",
        },
      ],
    },

    // =========================================================================
    // TAB 2: LIFTS & TRANSIT (30 items: 11 Lifts + 8 Rail + 11 Fleet & Bridges)
    // =========================================================================
    {
      id: "lifts",
      label: "Lifts & Transit",
      subFilters: [
        { id: "all", label: "All" },
        { id: "lifts", label: "Lifts & Trams" },
        { id: "rail", label: "Mountain Rail" },
        { id: "fleet", label: "Fleet & Bridges" },
      ],
      items: [
        // 10 Drag-to-Build Uphill Lifts + 1 Mid-Mountain Transfer Hub = 11 (`sub: "lifts"`)
        {
          id: "magic_carpet",
          sub: "lifts",
          name: "Covered Magic Carpet (Drag)",
          shortLabel: "Carpet",
          cost: 280,
          kind: "lift",
          liftType: "magic_carpet",
          isLiftDrag: true,
          spriteCandidates: ["magic_carpet_base_ns_f0", "magic_carpet_mid_ns"],
          desc: "Plexiglass-covered conveyor tunnel for ski-school ducklings & beginners (drag ≥2 tiles).",
        },
        {
          id: "rope_tow",
          sub: "lifts",
          name: "Beginner Rope Tow (Drag)",
          shortLabel: "Rope Tow",
          cost: 360,
          kind: "lift",
          liftType: "rope_tow",
          isLiftDrag: true,
          spriteCandidates: ["rope_tow_base_f0", "rope_tow_top_f0"],
          desc: "Compact bunny-hill surface rope tow — click Base and drag uphill along N-S or E-W.",
        },
        {
          id: "tbar_lift",
          sub: "lifts",
          name: "Glacier Surface T-Bar (Drag)",
          shortLabel: "T-Bar",
          cost: 520,
          kind: "lift",
          liftType: "tbar_lift",
          isLiftDrag: true,
          spriteCandidates: ["tbar_base_ns_f0", "tbar_pylon_ns"],
          desc: "Wind-resistant high-glacier T-bar pulling paired skiers smoothly up snow bowls.",
        },
        {
          id: "classic_2chair",
          sub: "lifts",
          name: "Heritage Double Chair (Drag)",
          shortLabel: "2-Chair",
          cost: 620,
          kind: "lift",
          liftType: "classic_2chair",
          isLiftDrag: true,
          spriteCandidates: ["classic_2chair_base_ns_f0", "lift_pylon_ns"],
          desc: "Classic fixed-grip timber-station 2-seater chairlift for scenic forest trails.",
        },
        {
          id: "chairlift",
          sub: "lifts",
          name: "Detachable Quad Chair (Drag)",
          shortLabel: "Quad Chair",
          cost: 720,
          kind: "lift",
          liftType: "chairlift",
          isLiftDrag: true,
          spriteCandidates: ["chairlift_base_ns_f0", "lift_pylon_ns"],
          desc: "High-speed alpine 4-pack chairlift — click Base & drag uphill along N-S or E-W.",
        },
        {
          id: "bubble_6chair",
          sub: "lifts",
          name: "6-Pack Orange Bubble Chair (Drag)",
          shortLabel: "6-Bubble",
          cost: 920,
          kind: "lift",
          liftType: "bubble_6chair",
          isLiftDrag: true,
          spriteCandidates: ["bubble_6chair_base_ns_f0", "lift_pylon_ns"],
          desc: "Heated flagship 6-person chairlift with bright orange weatherproof bubble domes!",
        },
        {
          id: "egg_gondola",
          sub: "lifts",
          name: "Retro 4-Seat Egg Gondola (Drag)",
          shortLabel: "Egg Gondola",
          cost: 1020,
          kind: "lift",
          liftType: "egg_gondola",
          isLiftDrag: true,
          spriteCandidates: ["egg_gondola_base_ns_f0", "gondola_pylon_ns"],
          desc: "Vintage European rounded egg-cabin gondola linking village plazas to mid-mountain.",
        },
        {
          id: "gondola",
          sub: "lifts",
          name: "Red Summit Gondola (Drag)",
          shortLabel: "Red Gondola",
          cost: 1150,
          kind: "lift",
          liftType: "gondola",
          isLiftDrag: true,
          spriteCandidates: ["gondola_base_ns_f0", "gondola_pylon_ns"],
          desc: "Swiss panoramic 8-person crimson cabins soaring from Base Lodge up to Lv 4!",
        },
        {
          id: "tramway_3s",
          sub: "lifts",
          name: "Swiss 3S Peak Tramway (Drag)",
          shortLabel: "3S Tram",
          cost: 1550,
          kind: "lift",
          liftType: "tramway_3s",
          isLiftDrag: true,
          spriteCandidates: ["tramway_3s_base_ns_f0", "tramway_pylon_ns"],
          desc: "Monumental tri-cable aerial tramway with wide-span A-frame pylons & 30-guest cabins!",
        },
        {
          id: "cliff_funicular",
          sub: "lifts",
          name: "Stepped Cliff Funicular (Drag)",
          shortLabel: "Funicular",
          cost: 840,
          kind: "lift",
          liftType: "cliff_funicular",
          isLiftDrag: true,
          spriteCandidates: ["funicular_base_ns_f0", "funicular_track_ns"],
          desc: "Inclined cog-rail funicular climbing steep terraces between village & upper hotels!",
        },
        {
          id: "mid_transfer_station",
          sub: "lifts",
          name: "Mid-Mountain Lift Transfer Hub",
          shortLabel: "Transfer Hub",
          cost: 480,
          kind: "structure",
          rotMode: "axis",
          variants: {
            ns: "mid_transfer_station_ns",
            ew: "mid_transfer_station_ew",
          },
          spriteCandidates: ["mid_transfer_station_ns_f0", "mid_transfer_station_ew_f0"],
          desc: "Chalet interchange deck connecting lower valley gondolas to upper glacier lifts ([R] rotates).",
        },

        // 8 Swiss Mountain Rail & Retaining Infrastructure (`sub: "rail"`)
        {
          id: "valley_train_station",
          sub: "rail",
          name: "Swiss Valley Train Depot",
          shortLabel: "Train Stn",
          cost: 520,
          kind: "structure",
          spriteCandidates: ["valley_train_station_f0", "valley_train_station"],
          desc: "Clocktower depot where the Bernina Express delivers waves of suitcase-rolling guests!",
        },
        {
          id: "train_track_ns",
          sub: "rail",
          name: "Cogwheel Rail Track",
          shortLabel: "Rail Track",
          cost: 40,
          kind: "structure",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "train_track_ns", ew: "train_track_ew" },
          spriteCandidates: ["train_track_ns", "train_track_ew"],
          desc: "Snow-cleared Swiss rack-railway sleepers & steel rails ([R] toggles N-S / E-W).",
        },
        {
          id: "train_track_curve",
          sub: "rail",
          name: "Curved Cogwheel Track",
          shortLabel: "Rail Curve",
          cost: 45,
          kind: "structure",
          rotMode: "corner",
          variants: {
            ne: "train_track_curve_ne",
            se: "train_track_curve_se",
            sw: "train_track_curve_sw",
            nw: "train_track_curve_nw",
          },
          spriteCandidates: [
            "train_track_curve_ne",
            "train_track_curve_se",
            "train_track_curve_sw",
            "train_track_curve_nw",
          ],
          desc: "90° curved mountain rail turnout for looped valley railway circuits ([R] cycles NE/SE/SW/NW).",
        },
        {
          id: "stone_viaduct",
          sub: "rail",
          name: "Landwasser Stone Viaduct",
          shortLabel: "Viaduct",
          cost: 145,
          kind: "structure",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "stone_viaduct_ns", ew: "stone_viaduct_ew" },
          spriteCandidates: ["stone_viaduct_ns", "stone_viaduct_ew"],
          desc: "Arched granite railway viaduct carrying the Swiss train across creeks & gorges ([R] rotates).",
        },
        {
          id: "rail_tunnel_portal",
          sub: "rail",
          name: "Granite Rail Tunnel Portal",
          shortLabel: "Rail Tunnel",
          cost: 160,
          kind: "structure",
          rotMode: "dir",
          variants: { sw: "rail_tunnel_portal_sw", se: "rail_tunnel_portal_se" },
          spriteCandidates: ["rail_tunnel_portal_sw", "rail_tunnel_portal_se"],
          desc: "Masonry mountain railway portal bored into steep alpine cliff walls ([R] toggles SW/SE).",
        },
        {
          id: "train_platform_ns",
          sub: "rail",
          name: "Alpine Passenger Platform",
          shortLabel: "Platform",
          cost: 85,
          kind: "structure",
          rotMode: "axis",
          variants: { ns: "train_platform_ns", ew: "train_platform_ew" },
          spriteCandidates: ["train_platform_ns", "train_platform_ew"],
          desc: "Lantern-lit stone passenger boarding platform beside railway tracks ([R] toggles N-S / E-W).",
        },
        {
          id: "rail_crossing_gate",
          sub: "rail",
          name: "Swiss Rail Crossing Gate",
          shortLabel: "Crossing",
          cost: 75,
          kind: "structure",
          rotMode: "axis",
          variants: { ns: "rail_crossing_gate_ns", ew: "rail_crossing_gate_ew" },
          spriteCandidates: ["rail_crossing_gate_ns", "rail_crossing_gate_ew"],
          desc: "Red-and-white striped grade crossing with St. Andrew's cross allowing walkers across tracks!",
        },
        {
          id: "retaining_wall",
          sub: "rail",
          name: "Terrace Stone Retaining Wall",
          shortLabel: "Stone Wall",
          cost: 40,
          kind: "amenity",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "retaining_wall_ns", ew: "retaining_wall_ew" },
          spriteCandidates: ["retaining_wall_ns", "retaining_wall_ew"],
          desc: "Dressed granite parapet wall framing multi-level alpine town terraces ([R] rotates).",
        },

        // 11 Fleet Depots, Walkways, Escalators & Bridges (`sub: "fleet"`)
        {
          id: "groomer_garage",
          sub: "fleet",
          name: "PistenBully Snowcat Barn",
          shortLabel: "Snowcat",
          cost: 420,
          kind: "structure",
          spriteCandidates: ["groomer_garage_f0", "groomer_garage"],
          desc: "Dispatches red snowcats to re-groom worn ski pistes back to 100% velvet corduroy!",
        },
        {
          id: "winch_cat_bay",
          sub: "fleet",
          name: "Steep-Chute Winch-Cat Bay",
          shortLabel: "Winch Cat",
          cost: 460,
          kind: "structure",
          spriteCandidates: ["winch_cat_bay_f0", "winch_cat_bay"],
          desc: "Deploys yellow crane-boom winch snowcats specialized for steep Black-Diamond chutes!",
        },
        {
          id: "snowmobile_pad",
          sub: "fleet",
          name: "Patrol Snowmobile Pad",
          shortLabel: "Snowmobile",
          cost: 280,
          kind: "structure",
          spriteCandidates: ["snowmobile_pad_f0", "snowmobile_pad"],
          desc: "Rapid-response rescue snowmobile bay assisting yard-sale wipeouts across the mountain.",
        },
        {
          id: "horse_sleigh_stand",
          sub: "fleet",
          name: "Velvet Horse-Sleigh Stand",
          shortLabel: "Sleigh Stand",
          cost: 310,
          kind: "structure",
          spriteCandidates: ["horse_sleigh_stand_f0", "horse_sleigh_stand"],
          desc: "Launches romantic plumed horse-drawn sleigh tours through car-free cobblestone streets!",
        },
        {
          id: "shuttle_bus_stop",
          sub: "fleet",
          name: "Electric Ski-Shuttle Shelter",
          shortLabel: "Bus Stop",
          cost: 260,
          kind: "structure",
          spriteCandidates: ["shuttle_bus_stop_f0", "shuttle_bus_stop"],
          desc: "Heated glass-and-timber bus stop served by roof-rack resort shuttle buses.",
        },
        {
          id: "summit_helipad",
          sub: "fleet",
          name: "VIP & Rescue Summit Helipad",
          shortLabel: "Helipad",
          cost: 680,
          kind: "structure",
          spriteCandidates: ["summit_helipad_f0", "summit_helipad"],
          desc: "Illuminated high-peak H-pad welcoming VIP heli-ski drops (+$120) & mountain rescue!",
        },
        {
          id: "town_walkway",
          sub: "fleet",
          name: "Heated Stone Promenade",
          shortLabel: "Walkway",
          cost: 25,
          kind: "amenity",
          dragPaint: true,
          spriteCandidates: ["town_walkway_ns", "town_walkway_cross", "town_walkway_ew"],
          desc: "Drag 11-way auto-joining heated stone walkways linking chalets, shops & lift bases.",
        },
        {
          id: "snow_stairs",
          sub: "fleet",
          name: "Cut-Stone Snow Stairs",
          shortLabel: "Stairs",
          cost: 45,
          kind: "amenity",
          dragPaint: true,
          rotMode: "cardinal",
          variants: {
            n: "snow_stairs_n",
            e: "snow_stairs_e",
            s: "snow_stairs_s",
            w: "snow_stairs_w",
          },
          spriteCandidates: ["snow_stairs_s", "snow_stairs_w", "snow_stairs_n", "snow_stairs_e"],
          desc: "Carved granite steps with timber handrails on sloped transitions ([R] cycles N/E/S/W).",
        },
        {
          id: "covered_escalator",
          sub: "fleet",
          name: "Covered Terrace Escalator",
          shortLabel: "Escalator",
          cost: 115,
          kind: "amenity",
          rotMode: "cardinal",
          variants: {
            n: "covered_escalator_n",
            e: "covered_escalator_e",
            s: "covered_escalator_s",
            w: "covered_escalator_w",
          },
          spriteCandidates: [
            "covered_escalator_s",
            "covered_escalator_w",
            "covered_escalator_n",
            "covered_escalator_e",
          ],
          desc: "Warm-lit glass tube village escalator carrying ski-booted guests effortlessly uphill ([R]).",
        },
        {
          id: "timber_bridge",
          sub: "fleet",
          name: "Alpine Timber Creek Bridge",
          shortLabel: "Wood Bridge",
          cost: 95,
          kind: "amenity",
          rotMode: "axis",
          variants: { ns: "timber_bridge_ns", ew: "timber_bridge_ew" },
          spriteCandidates: ["timber_bridge_ns", "timber_bridge_ew"],
          desc: "Crosses meltwater brooks, skating lakes & hot springs ([R] toggles N-S / E-W).",
        },
        {
          id: "stone_arch_bridge",
          sub: "fleet",
          name: "Granite Arch Promenade Bridge",
          shortLabel: "Stone Bridge",
          cost: 135,
          kind: "amenity",
          rotMode: "axis",
          variants: { ns: "stone_arch_bridge_ns", ew: "stone_arch_bridge_ew" },
          spriteCandidates: ["stone_arch_bridge_ns", "stone_arch_bridge_ew"],
          desc: "Old-world arched granite bridge with wrought-iron lanterns over rushing creeks ([R]).",
        },
      ],
    },

    // =========================================================================
    // TAB 3: RUNS & PARK (32 items: 12 Race + 10 Freestyle Park + 10 Safety)
    // =========================================================================
    {
      id: "runs",
      label: "Runs & Park",
      subFilters: [
        { id: "all", label: "All" },
        { id: "park", label: "Coaster & Park" },
        { id: "race", label: "Gates & Race" },
        { id: "safety", label: "Snow & Safety" },
      ],
      items: [
        // 3 v3 Mountain Coaster & Cliff Skybridge Thrill Rides (`sub: "park"`)
        {
          id: "mountain_coaster",
          sub: "park",
          name: "Alpine Gravity Mountain Coaster",
          shortLabel: "Mtn Coaster",
          cost: 165,
          kind: "structure",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "mountain_coaster_ns", ew: "mountain_coaster_ew" },
          spriteCandidates: [
            "mountain_coaster_ns_f0",
            "mountain_coaster_ew_f0",
            "mountain_coaster_ns",
            "train_track_ns",
          ],
          desc: "Drag tubular steel coaster rails down wooded slopes — yellow solo sleds bank & zip downhill ([R])!",
        },
        {
          id: "mountain_coaster_curve",
          sub: "park",
          name: "Banked Mountain Coaster Turn",
          shortLabel: "Coaster Turn",
          cost: 175,
          kind: "structure",
          rotMode: "corner",
          variants: {
            ne: "mountain_coaster_curve_ne",
            se: "mountain_coaster_curve_se",
            sw: "mountain_coaster_curve_sw",
            nw: "mountain_coaster_curve_nw",
          },
          spriteCandidates: [
            "mountain_coaster_curve_sw_f0",
            "mountain_coaster_curve_se_f0",
            "mountain_coaster_curve_ne_f0",
            "mountain_coaster_curve_nw_f0",
            "train_track_curve_sw",
          ],
          desc: "90° banked tubular coaster hairpin with LED chasers ([R] cycles NE/SE/SW/NW; drag auto-corners!).",
        },
        {
          id: "suspension_skybridge",
          sub: "park",
          name: "Peak-to-Peak Cliff Skybridge",
          shortLabel: "Skybridge",
          cost: 220,
          kind: "structure",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "suspension_skybridge_ns", ew: "suspension_skybridge_ew" },
          spriteCandidates: [
            "suspension_skybridge_ew_f0",
            "suspension_skybridge_ns_f0",
            "suspension_skybridge_ew",
            "stone_viaduct_ew",
          ],
          desc: "Swaying catenary cable footbridge hung with fluttering prayer flags over gorges & waterfalls ([R]).",
        },

        // 12 Trail Gates & World-Cup Racing (`sub: "race"`)
        {
          id: "gate_green_circle",
          sub: "race",
          name: "Green Circle Beginner Gate",
          shortLabel: "Green Gate",
          cost: 40,
          kind: "flora",
          spriteCandidates: ["gate_green_circle"],
          desc: "Designates gentle Green Circle runs for snowplow learners & ski-school ducklings.",
        },
        {
          id: "gate_blue_square",
          sub: "race",
          name: "Blue Square Cruiser Gate",
          shortLabel: "Blue Gate",
          cost: 45,
          kind: "flora",
          spriteCandidates: ["gate_blue_square"],
          desc: "Designates sweeping Blue Square cruiser runs for parallel S-turn carvers.",
        },
        {
          id: "gate_black_diamond",
          sub: "race",
          name: "Black Diamond Expert Gate",
          shortLabel: "Black Gate",
          cost: 55,
          kind: "flora",
          spriteCandidates: ["gate_black_diamond"],
          desc: "Designates steep expert summit pistes and mogul chutes (Black Diamond).",
        },
        {
          id: "gate_double_black",
          sub: "race",
          name: "Double-Black Extreme Sign",
          shortLabel: "2x Black",
          cost: 65,
          kind: "flora",
          spriteCandidates: ["gate_double_black"],
          desc: "Twin-diamond warning portal for hair-raising cliff couloirs & glacier drops!",
        },
        {
          id: "kids_forest_arch",
          sub: "race",
          name: "Carved Bear Kids Forest Arch",
          shortLabel: "Kids Arch",
          cost: 75,
          kind: "flora",
          spriteCandidates: ["kids_forest_arch"],
          desc: "Whimsical carved wooden bear & pine welcome arch for family adventure trails.",
        },
        {
          id: "nordic_signpost",
          sub: "race",
          name: "Nordic XC Trail Signpost",
          shortLabel: "XC Sign",
          cost: 35,
          kind: "flora",
          spriteCandidates: ["nordic_signpost"],
          desc: "Directional timber trail fingerpost guiding cross-country skiers & snowshoers.",
        },
        {
          id: "cliff_warning_rope",
          sub: "race",
          name: "Cliff Bamboo Warning Rope",
          shortLabel: "Cliff Rope",
          cost: 30,
          kind: "flora",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "cliff_warning_rope_ns", ew: "cliff_warning_rope_ew" },
          spriteCandidates: ["cliff_warning_rope_ns", "cliff_warning_rope_ew"],
          desc: "Bamboo poles with high-vis warning pennants along crevasses & drop-offs ([R] rotates).",
        },
        {
          id: "race_start_house",
          sub: "race",
          name: "World-Cup Race Start Hut",
          shortLabel: "Start Hut",
          cost: 140,
          kind: "flora",
          spriteCandidates: ["race_start_house"],
          desc: "Elevated alpine racing start gate with countdown clock & timing wand!",
        },
        {
          id: "slalom_poles_red_blue",
          sub: "race",
          name: "Red & Blue Slalom Poles",
          shortLabel: "Slalom",
          cost: 50,
          kind: "flora",
          dragPaint: true,
          spriteCandidates: ["slalom_poles_red_blue"],
          desc: "Spring-loaded red & blue slalom gates for tight rhythmic alpine racing.",
        },
        {
          id: "gs_panel_gates",
          sub: "race",
          name: "Giant Slalom Panel Gates",
          shortLabel: "GS Gates",
          cost: 60,
          kind: "flora",
          dragPaint: true,
          spriteCandidates: ["gs_panel_gates"],
          desc: "Twin-pole fabric banner Giant Slalom gates for high-speed World Cup carvers.",
        },
        {
          id: "finish_timing_arch",
          sub: "race",
          name: "Swiss LED Finish Timing Arch",
          shortLabel: "Finish Arch",
          cost: 165,
          kind: "flora",
          rotMode: "axis",
          variants: { ns: "finish_timing_arch_ns", ew: "finish_timing_arch_ew" },
          spriteCandidates: ["finish_timing_arch_ns", "finish_timing_arch_ew"],
          desc: "Spanning alpine race finish gantry with glowing split-time scoreboard ([R] rotates).",
        },
        {
          id: "champions_podium",
          sub: "race",
          name: "1-2-3 Medal Champions Podium",
          shortLabel: "Podium",
          cost: 110,
          kind: "flora",
          spriteCandidates: ["champions_podium"],
          desc: "Festive 1-2-3 timber victory podium where racers & selfie tourists celebrate!",
        },

        // 10 Pro Freestyle Terrain Park & Tubing (`sub: "park"`)
        {
          id: "park_kicker",
          sub: "park",
          name: "Freestyle Medium Snow Kicker",
          shortLabel: "Kicker",
          cost: 110,
          kind: "flora",
          rotMode: "dir",
          variants: { sw: "park_kicker_sw", se: "park_kicker_se" },
          spriteCandidates: ["park_kicker_sw", "park_kicker_se"],
          desc: "Shaped blue-lip tabletop jump boosting snowboarders & skiers into aerial grabs ([R]).",
        },
        {
          id: "big_air_kicker",
          sub: "park",
          name: "Pro X-Games Big-Air Kicker",
          shortLabel: "Big Air",
          cost: 175,
          kind: "flora",
          rotMode: "dir",
          variants: { sw: "big_air_kicker_sw", se: "big_air_kicker_se" },
          spriteCandidates: ["big_air_kicker_sw", "big_air_kicker_se"],
          desc: "Towering pro competition snow wedge with evergreen takeoff markers ([R] toggles SW/SE).",
        },
        {
          id: "stunt_airbag",
          sub: "park",
          name: "Pro Stunt Landing Airbag",
          shortLabel: "Airbag",
          cost: 160,
          kind: "flora",
          rotMode: "dir",
          variants: { sw: "stunt_airbag_sw", se: "stunt_airbag_se" },
          spriteCandidates: ["stunt_airbag_sw", "stunt_airbag_se"],
          desc: "Giant cushioned red-and-gold stunt airbag below Big Air kickers ([R] toggles SW/SE).",
        },
        {
          id: "park_rail",
          sub: "park",
          name: "Steel Jib Grind Box & Rail",
          shortLabel: "Jib Rail",
          cost: 85,
          kind: "flora",
          rotMode: "axis",
          variants: { ns: "park_rail_ns", ew: "park_rail_ew" },
          spriteCandidates: ["park_rail_ns", "park_rail_ew"],
          desc: "Terrain-park steel grind rail & slick poly box for freestyle boardslides ([R] rotates).",
        },
        {
          id: "rainbow_cbox",
          sub: "park",
          name: "Arched Rainbow Jib C-Box",
          shortLabel: "Rainbow Box",
          cost: 115,
          kind: "flora",
          rotMode: "axis",
          variants: { ns: "rainbow_cbox_ns", ew: "rainbow_cbox_ew" },
          spriteCandidates: ["rainbow_cbox_ns", "rainbow_cbox_ew"],
          desc: "Vibrant multi-stripe arched rainbow box boosting freestyle park thrill ([R] rotates).",
        },
        {
          id: "kinked_stair_rail",
          sub: "park",
          name: "Down-Flat-Down Stair Rail",
          shortLabel: "Kink Rail",
          cost: 105,
          kind: "flora",
          rotMode: "axis",
          variants: { ns: "kinked_stair_rail_ns", ew: "kinked_stair_rail_ew" },
          spriteCandidates: ["kinked_stair_rail_ns", "kinked_stair_rail_ew"],
          desc: "Street-style timber steps with twin steel kinked handrails ([R] toggles N-S / E-W).",
        },
        {
          id: "timber_wallride",
          sub: "park",
          name: "Angled Timber Wallride",
          shortLabel: "Wallride",
          cost: 125,
          kind: "flora",
          rotMode: "dir",
          variants: { sw: "timber_wallride_sw", se: "timber_wallride_se" },
          spriteCandidates: ["timber_wallride_sw", "timber_wallride_se"],
          desc: "Steeply banked log-frame freestyle wallride for high-arc snow spray ([R] rotates).",
        },
        {
          id: "halfpipe_wall",
          sub: "park",
          name: "Sculpted Superpipe Wall",
          shortLabel: "Superpipe",
          cost: 130,
          kind: "flora",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "halfpipe_wall_ns", ew: "halfpipe_wall_ew" },
          spriteCandidates: ["halfpipe_wall_ns", "halfpipe_wall_ew"],
          desc: "Curved Olympic snow halfpipe transition deck with blue dye lip ([R] rotates).",
        },
        {
          id: "boardercross_berm",
          sub: "park",
          name: "Banked Boardercross Berm",
          shortLabel: "BX Berm",
          cost: 95,
          kind: "flora",
          dragPaint: true,
          rotMode: "dir",
          variants: { sw: "boardercross_berm_sw", se: "boardercross_berm_se" },
          spriteCandidates: ["boardercross_berm_sw", "boardercross_berm_se"],
          desc: "High-speed sculpted parabolic snow turn for boardercross & skicross packs ([R]).",
        },
        {
          id: "tubing_bale_corral",
          sub: "park",
          name: "Snow-Tubing Hay Bale Corral",
          shortLabel: "Tube Corral",
          cost: 70,
          kind: "flora",
          dragPaint: true,
          spriteCandidates: ["tubing_bale_corral"],
          desc: "Padded golden straw bales & colorful pennants banking snow-tubing runouts.",
        },

        // 10 Snowmaking, Night Lights, Avalanche Safety & Ridge Flags (`sub: "safety"`)
        {
          id: "safety_net",
          sub: "safety",
          name: "Orange Alpine Safety B-Net",
          shortLabel: "Safety Net",
          cost: 35,
          kind: "flora",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "safety_net_ns", ew: "safety_net_ew" },
          spriteCandidates: ["safety_net_ns", "safety_net_ew"],
          desc: "High-visibility orange catch fencing along race turns and cliff edges ([R] rotates).",
        },
        {
          id: "tower_crash_pad",
          sub: "safety",
          name: "Yellow Pylon Crash Mattress",
          shortLabel: "Crash Pad",
          cost: 32,
          kind: "flora",
          spriteCandidates: ["tower_crash_pad"],
          desc: "Thick padded safety cushion wrapped around high-speed ski corridor hazards.",
        },
        {
          id: "wind_drift_fence",
          sub: "safety",
          name: "Timber Snow-Drift Fence",
          shortLabel: "Drift Fence",
          cost: 34,
          kind: "flora",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "wind_drift_fence_ns", ew: "wind_drift_fence_ew" },
          spriteCandidates: ["wind_drift_fence_ns", "wind_drift_fence_ew"],
          desc: "Slatted larch wind fence trapping deep powder drifts on upper ridges ([R] rotates).",
        },
        {
          id: "snow_cannon",
          sub: "safety",
          name: "Yellow Fan Snow Cannon",
          shortLabel: "Snow Gun",
          cost: 145,
          kind: "flora",
          rotMode: "dir",
          variants: { sw: "snow_cannon_sw", se: "snow_cannon_se" },
          spriteCandidates: ["snow_cannon_sw_f0", "snow_cannon_se_f0", "snow_cannon_sw"],
          desc: "Animated snowmaking fan gun blasting crystal plumes — slows piste wear by 58% ([R])!",
        },
        {
          id: "giraffe_snow_lance",
          sub: "safety",
          name: "Tall Aluminum Snow Lance",
          shortLabel: "Snow Lance",
          cost: 130,
          kind: "flora",
          spriteCandidates: ["giraffe_snow_lance_f0", "giraffe_snow_lance"],
          desc: "Slender inclined snowmaking lance dusting silent powder mist onto cruiser trails.",
        },
        {
          id: "slope_floodlight",
          sub: "safety",
          name: "Night-Skiing Lattice Floodlight",
          shortLabel: "Floodlight",
          cost: 135,
          kind: "flora",
          spriteCandidates: ["slope_floodlight_f0", "slope_floodlight"],
          desc: "Tall steel stadium mast bathing ski runs in crisp alpine white light during Night Ski!",
        },
        {
          id: "neon_park_light",
          sub: "safety",
          name: "Neon Freestyle Park LED Mast",
          shortLabel: "Neon Mast",
          cost: 150,
          kind: "flora",
          spriteCandidates: ["neon_park_light_f0", "neon_park_light"],
          desc: "Electric cyan & magenta LED light tower casting vibrant glow across Night-Ski parks!",
        },
        {
          id: "gazex_blaster",
          sub: "safety",
          name: "Summit Gazex Avalanche Blaster",
          shortLabel: "Gazex Pipe",
          cost: 160,
          kind: "flora",
          spriteCandidates: ["gazex_blaster"],
          desc: "Remote-triggered summit exploder tube & orange gas shelter keeping steep bowls safe.",
        },
        {
          id: "weather_wind_mast",
          sub: "safety",
          name: "Spinning Anemometer & Windsock",
          shortLabel: "Wind Mast",
          cost: 90,
          kind: "flora",
          spriteCandidates: ["weather_wind_mast_f0", "weather_wind_mast"],
          desc: "Summit weather station with spinning 3-cup anemometer & striped orange windsock.",
        },
        {
          id: "prayer_flags",
          sub: "safety",
          name: "Alpine Ridge Prayer Flags",
          shortLabel: "Ridge Flags",
          cost: 40,
          kind: "flora",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "prayer_flags_ns", ew: "prayer_flags_ew" },
          spriteCandidates: ["prayer_flags_ns", "prayer_flags_ew"],
          desc: "Colorful fluttering high-altitude ridge flags strung between snowy cairns ([R] rotates).",
        },
      ],
    },

    // =========================================================================
    // TAB 4: TOWN & CHALETS (33 items: 8 Landmarks/Hotels + 10 Shops + 15 Dining & Civic)
    // =========================================================================
    {
      id: "town",
      label: "Town & Chalets",
      subFilters: [
        { id: "all", label: "All" },
        { id: "hotels", label: "Hotels & Spas" },
        { id: "shops", label: "Shops & Gear" },
        { id: "dining", label: "Dining & Civic" },
      ],
      items: [
        // 4 Flagship `2x2` Composite Landmarks + 4 `1x1` Chalets/Suites = 8 (`sub: "hotels"`)
        {
          id: "sphinx_observatory_2x2",
          sub: "hotels",
          name: "Jungfrau Sphinx Summit Observatory (2x2)",
          shortLabel: "Observatory",
          cost: 1320,
          kind: "structure",
          footprint: 2,
          isComposite2x2: true,
          compositePrefix: "sphinx_observatory_2x2",
          badgeText: "2×2",
          badgeColor: "#6cc4f8",
          spriteCandidates: [
            "sphinx_observatory_2x2_se_f0",
            "sphinx_observatory_2x2_sw_f0",
            "sphinx_observatory_2x2_nw_f0",
            "summit_restaurant_f0",
          ],
          desc: "Iconic 2×2 rotating silver astronomical dome & cliffside sky-terrace for Lv 3–4 peaks!",
        },
        {
          id: "grand_hotel_2x2",
          sub: "hotels",
          name: "Grand Edelweiss Palace Hotel (2x2)",
          shortLabel: "Grand Hotel",
          cost: 1100,
          kind: "structure",
          footprint: 2,
          isComposite2x2: true,
          compositePrefix: "grand_hotel_2x2",
          badgeText: "2×2",
          badgeColor: "#e6b968",
          spriteCandidates: [
            "grand_hotel_2x2_se_f0",
            "grand_hotel_2x2_sw_f0",
            "grand_hotel_2x2_nw_f0",
          ],
          desc: "Flagship 2×2 Belle-Époque palace hotel with copper Mansard turret & glowing suites!",
        },
        {
          id: "thermal_spa_2x2",
          sub: "hotels",
          name: "Copper-Dome Thermal Spa (2x2)",
          shortLabel: "Thermal Spa",
          cost: 1180,
          kind: "structure",
          footprint: 2,
          isComposite2x2: true,
          compositePrefix: "thermal_spa_2x2",
          badgeText: "2×2",
          badgeColor: "#6cc4f8",
          spriteCandidates: [
            "thermal_spa_2x2_se_f0",
            "thermal_spa_2x2_sw_f0",
            "thermal_spa_2x2_nw_f0",
          ],
          desc: "Luxurious 2×2 oxidized copper-patina alpine bathhouse with steaming outdoor lagoon!",
        },
        {
          id: "base_lodge_2x2",
          sub: "hotels",
          name: "Terracotta Clock-Tower Base Lodge (2x2)",
          shortLabel: "Base Lodge",
          cost: 1050,
          kind: "structure",
          footprint: 2,
          isComposite2x2: true,
          compositePrefix: "base_lodge_2x2",
          badgeText: "2×2",
          badgeColor: "#f2a65a",
          spriteCandidates: [
            "base_lodge_2x2_se_f0",
            "base_lodge_2x2_sw_f0",
            "base_lodge_2x2_nw_f0",
          ],
          desc: "Bustling 2×2 timber-and-terracotta ski base lodge with sun deck & clock tower!",
        },
        {
          id: "chalet_bnb",
          sub: "hotels",
          name: "Frescoed Balcony Chalet B&B",
          shortLabel: "Chalet B&B",
          cost: 420,
          kind: "structure",
          spriteCandidates: ["chalet_bnb_f0", "chalet_bnb"],
          desc: "Carved larch guest chalet with flowerboxes, shuttered windows & chimney smoke.",
        },
        {
          id: "aframe_cabin",
          sub: "hotels",
          name: "Slate-Gable Pine A-Frame",
          shortLabel: "A-Frame",
          cost: 360,
          kind: "structure",
          spriteCandidates: ["aframe_cabin_f0", "aframe_cabin"],
          desc: "Steep snow-shedding slate A-frame cabin with panoramic warm amber glass wall.",
        },
        {
          id: "stargaze_igloo",
          sub: "hotels",
          name: "Geodesic Stargazing Glass Igloo",
          shortLabel: "Glass Igloo",
          cost: 390,
          kind: "structure",
          spriteCandidates: ["stargaze_igloo_f0", "stargaze_igloo"],
          desc: "Heated faceted aurora-dome suite glowing warmly on snow-draped terraces.",
        },
        {
          id: "ice_hotel_suite",
          sub: "hotels",
          name: "Sculpted Glacier Ice Hotel Suite",
          shortLabel: "Ice Hotel",
          cost: 450,
          kind: "structure",
          spriteCandidates: ["ice_hotel_suite_f0", "ice_hotel_suite"],
          desc: "Translucent glacier-block archway suite radiating crystalline cyan light at night!",
        },

        // 10 Ski Gear, Tickets, School & European Boutiques (`sub: "shops"`)
        {
          id: "ski_rental_shop",
          sub: "shops",
          name: "Alpine Ski & Board Rental",
          shortLabel: "Ski Rental",
          cost: 340,
          kind: "structure",
          spriteCandidates: ["ski_rental_shop_f0", "ski_rental_shop"],
          desc: "Outfits arriving train & bus travelers with carved skis, boots & snowboards (+$24).",
        },
        {
          id: "lift_ticket_booth",
          sub: "shops",
          name: "Lift Pass & Trail Ticket Booth",
          shortLabel: "Tickets",
          cost: 260,
          kind: "structure",
          spriteCandidates: ["lift_ticket_booth_f0", "lift_ticket_booth"],
          desc: "Swiss chalet pass window selling day & night lift passes at valley plazas (+$35).",
        },
        {
          id: "ski_school_lodge",
          sub: "shops",
          name: "Kids Ski-School Duckling Lodge",
          shortLabel: "Ski School",
          cost: 370,
          kind: "structure",
          spriteCandidates: ["ski_school_lodge_f0", "ski_school_lodge"],
          desc: "Home of neon-bib ski-school duckling trains following red-jacket instructors!",
        },
        {
          id: "wax_tuning_shop",
          sub: "shops",
          name: "Hot-Wax & Edge Tuning Atelier",
          shortLabel: "Wax Shop",
          cost: 300,
          kind: "structure",
          spriteCandidates: ["wax_tuning_shop_f0", "wax_tuning_shop"],
          desc: "Precision stone-grind & hot-iron ski wax workshop boosting carver speed.",
        },
        {
          id: "gear_boutique",
          sub: "shops",
          name: "Goggles & Down Parka Boutique",
          shortLabel: "Boutique",
          cost: 380,
          kind: "structure",
          spriteCandidates: ["gear_boutique_f0", "gear_boutique"],
          desc: "Upscale alpine winterwear boutique with illuminated display windows (+$30).",
        },
        {
          id: "swiss_watchmaker",
          sub: "shops",
          name: "Swiss Horology & Clockmaker",
          shortLabel: "Watchmaker",
          cost: 490,
          kind: "structure",
          spriteCandidates: ["swiss_watchmaker_f0", "swiss_watchmaker"],
          desc: "Pastel cream-and-brass watchmaker facade with hanging gilded pocket-watch sign!",
        },
        {
          id: "chocolatier_shop",
          sub: "shops",
          name: "Artisan Swiss Chocolatier",
          shortLabel: "Chocolatier",
          cost: 360,
          kind: "structure",
          spriteCandidates: ["chocolatier_shop_f0", "chocolatier_shop"],
          desc: "Burgundy-awned praline & truffle confiserie drawing sweet-toothed village queues!",
        },
        {
          id: "cheese_raclette_cellar",
          sub: "shops",
          name: "Aged Gruyère & Raclette Cellar",
          shortLabel: "Cheese Vault",
          cost: 390,
          kind: "structure",
          spriteCandidates: ["cheese_raclette_cellar_f0", "cheese_raclette_cellar"],
          desc: "Vaulted stone cellar aging golden alpine cheese wheels & melting hot raclette.",
        },
        {
          id: "cowbell_souvenirs",
          sub: "shops",
          name: "Brass Cowbell & Cuckoo Shop",
          shortLabel: "Souvenirs",
          cost: 290,
          kind: "structure",
          spriteCandidates: ["cowbell_souvenirs_f0", "cowbell_souvenirs"],
          desc: "Cheerful sage-shuttered gift chalet hung with hand-forged Swiss cowbells.",
        },
        {
          id: "bookshop_roastery",
          sub: "shops",
          name: "Fireside Bookshop & Roastery",
          shortLabel: "Book Cafe",
          cost: 330,
          kind: "structure",
          spriteCandidates: ["bookshop_roastery_f0", "bookshop_roastery"],
          desc: "Cozy timber bookshop & espresso roastery warming chilly afternoon strollers.",
        },

        // 15 Mountain Dining, Civic Towers, Covered Bridges & Patrol (`sub: "dining"`)
        {
          id: "glockenspiel_tower",
          sub: "dining",
          name: "Astronomical Glockenspiel Tower",
          shortLabel: "Clock Tower",
          cost: 540,
          kind: "structure",
          spriteCandidates: ["glockenspiel_tower_f0", "glockenspiel_tower", "town_rathaus_f0"],
          desc: "Ornate Alpine clockwork bell spire with spinning golden figures & illuminated celestial dial!",
        },
        {
          id: "kapellbrucke_bridge",
          sub: "dining",
          name: "Lucerne Covered Timber Bridge",
          shortLabel: "Covered Brdg",
          cost: 210,
          kind: "structure",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "kapellbrucke_bridge_ns", ew: "kapellbrucke_bridge_ew" },
          spriteCandidates: [
            "kapellbrucke_bridge_ew_f0",
            "kapellbrucke_bridge_ns_f0",
            "kapellbrucke_bridge_ew",
            "stone_viaduct_ew",
          ],
          desc: "Snow-dusted gabled wooden footbridge with warm glowing interior lanterns over creeks ([R]).",
        },
        {
          id: "raclette_hearth_stall",
          sub: "dining",
          name: "Open-Fire Raclette & Almond Hearth",
          shortLabel: "Raclette Fire",
          cost: 280,
          kind: "structure",
          spriteCandidates: [
            "raclette_hearth_stall_f0",
            "raclette_hearth_stall",
            "cheese_raclette_cellar_f0",
          ],
          desc: "Blazing copper fire brazier melting Alpine cheese wheels & roasting sugared almonds (+$26)!",
        },
        {
          id: "alpine_bakery",
          sub: "dining",
          name: "Pretzel & Apple-Strudel Bakery",
          shortLabel: "Bakery",
          cost: 310,
          kind: "structure",
          spriteCandidates: ["alpine_bakery_f0", "alpine_bakery"],
          desc: "Wood-oven village bakery with golden pretzel crest & cinnamon-sugar aroma (+$18).",
        },
        {
          id: "apres_tavern",
          sub: "dining",
          name: "Fondue & Wood-Fired Après Tavern",
          shortLabel: "Après Tavern",
          cost: 460,
          kind: "structure",
          spriteCandidates: ["apres_tavern_f0", "apres_tavern"],
          desc: "Lively timber tavern with string-lit terrace where skiers toast fondue & cocoa!",
        },
        {
          id: "craft_brewhouse",
          sub: "dining",
          name: "Copper-Kettle Alpine Brewhouse",
          shortLabel: "Brewhouse",
          cost: 440,
          kind: "structure",
          spriteCandidates: ["craft_brewhouse_f0", "craft_brewhouse"],
          desc: "Gabled brick-and-timber brewhouse gleaming with polished copper mash kettles.",
        },
        {
          id: "niseko_ramen_bar",
          sub: "dining",
          name: "Niseko Red-Lantern Ramen Bar",
          shortLabel: "Ramen Bar",
          cost: 410,
          kind: "structure",
          spriteCandidates: ["niseko_ramen_bar_f0", "niseko_ramen_bar"],
          desc: "Charred-cedar Niseko noodle bar with noren curtains & glowing red chochin lanterns!",
        },
        {
          id: "waffle_hut",
          sub: "dining",
          name: "Mid-Mountain Glühwein & Waffle Hut",
          shortLabel: "Waffle Hut",
          cost: 350,
          kind: "structure",
          spriteCandidates: ["waffle_hut_f0", "waffle_hut"],
          desc: "Slope-side log cabin serving hot Liège waffles & spiced mulled wine at Lv 1–3.",
        },
        {
          id: "summit_restaurant",
          sub: "dining",
          name: "Panoramic Summit Glass Restaurant",
          shortLabel: "Summit Rest",
          cost: 640,
          kind: "structure",
          spriteCandidates: ["summit_restaurant_f0", "summit_restaurant"],
          desc: "Cantilevered high-peak fine dining observatory overlooking glacier bowls (+$42).",
        },
        {
          id: "eagles_nest_skywalk",
          sub: "dining",
          name: "Eagle's Nest Glass Cliff Skywalk",
          shortLabel: "Skywalk",
          cost: 580,
          kind: "structure",
          spriteCandidates: ["eagles_nest_skywalk_f0", "eagles_nest_skywalk"],
          desc: "Dramatic glass-floored summit viewing spur where selfie tourists snap flashes!",
        },
        {
          id: "stone_chapel",
          sub: "dining",
          name: "Copper-Spire Stained-Glass Chapel",
          shortLabel: "Chapel",
          cost: 430,
          kind: "structure",
          spriteCandidates: ["stone_chapel_f0", "stone_chapel"],
          desc: "Historic alpine parish chapel with glowing stained-glass lancets & bell spire.",
        },
        {
          id: "town_rathaus",
          sub: "dining",
          name: "Frescoed Swiss Town Hall (Rathaus)",
          shortLabel: "Rathaus",
          cost: 510,
          kind: "structure",
          spriteCandidates: ["town_rathaus_f0", "town_rathaus"],
          desc: "Stepped-gable ochre civic hall with heraldic crests & illuminated turret clock.",
        },
        {
          id: "watermill_lodge",
          sub: "dining",
          name: "Turning-Wheel Creekside Mill Lodge",
          shortLabel: "Watermill",
          cost: 470,
          kind: "structure",
          spriteCandidates: ["watermill_lodge_f0", "watermill_lodge"],
          desc: "Half-timbered creekside inn with an animated turning wooden waterwheel!",
        },
        {
          id: "ski_patrol_hut",
          sub: "dining",
          name: "Alpine Ski Patrol Rescue Cabin",
          shortLabel: "Ski Patrol",
          cost: 320,
          kind: "structure",
          spriteCandidates: ["ski_patrol_hut_f0", "ski_patrol_hut"],
          desc: "Swiss Red-Cross mountain rescue cabin dispatching patrol skiers & St. Bernards.",
        },
        {
          id: "rescue_clinic",
          sub: "dining",
          name: "Mountain First-Aid & Rescue Clinic",
          shortLabel: "Clinic",
          cost: 430,
          kind: "structure",
          spriteCandidates: ["rescue_clinic_f0", "rescue_clinic"],
          desc: "Modern alpine medical chalet keeping injured skiers warm, safe & cared for.",
        },
      ],
    },

    // =========================================================================
    // TAB 5: APRÈS & NATURE (44 items: 10 Festival + 11 Market + 10 Rink + 13 Forest)
    // =========================================================================
    {
      id: "apres",
      label: "Après & Nature",
      subFilters: [
        { id: "all", label: "All" },
        { id: "festival", label: "Winter Festival" },
        { id: "market", label: "Après & Market" },
        { id: "rink", label: "Rink & Fun" },
        { id: "forest", label: "Forest & Crags" },
      ],
      items: [
        // 10 Grand Winter Festival & Ice Carnival Showcase Items (`sub: "festival"`)
        {
          id: "festival_ferris_wheel_2x2",
          sub: "festival",
          name: "Timber Gondola Ferris Wheel (2x2)",
          shortLabel: "Ferris Wheel",
          cost: 1250,
          kind: "structure",
          footprint: 2,
          isComposite2x2: true,
          compositePrefix: "festival_ferris_wheel_2x2",
          badgeText: "2×2",
          badgeColor: "#fde047",
          spriteCandidates: [
            "festival_ferris_wheel_2x2_se_f0",
            "festival_ferris_wheel_2x2_sw_f0",
            "festival_ferris_wheel_2x2_nw_f0",
            "holiday_tree_f0",
          ],
          desc: "Showstopping 2×2 wooden Christmas-market Ferris wheel with swinging mini-gondolas & star-lit rim!",
        },
        {
          id: "winter_carousel",
          sub: "festival",
          name: "Vintage Alpine Winter Carousel",
          shortLabel: "Carousel",
          cost: 480,
          kind: "amenity",
          spriteCandidates: ["winter_carousel_f0", "winter_carousel", "schirmbar_umbrella_f0"],
          desc: "Crimson-and-gold striped fairground pavilion spinning with painted horses & warm bulb strings!",
        },
        {
          id: "gluhwein_pyramid",
          sub: "festival",
          name: "Spinning Glühwein Christmas Pyramid",
          shortLabel: "Xmas Pyramid",
          cost: 340,
          kind: "amenity",
          spriteCandidates: ["gluhwein_pyramid_f0", "gluhwein_pyramid", "christmas_market_stall_f0"],
          desc: "3-tier carved wooden Weihnachtspyramide with candle-spun rotor blades & mulled-wine counter!",
        },
        {
          id: "ice_palace_arch",
          sub: "festival",
          name: "Illuminated Crystal Ice Palace",
          shortLabel: "Ice Palace",
          cost: 440,
          kind: "amenity",
          spriteCandidates: ["ice_palace_arch_f0", "ice_palace_arch", "ice_hotel_suite_f0"],
          desc: "Translucent turquoise glacier-brick turrets & Gothic archway glowing cyan-violet at night!",
        },
        {
          id: "giant_snow_sculpture",
          sub: "festival",
          name: "Festival Giant Snow Dragon",
          shortLabel: "Snow Dragon",
          cost: 310,
          kind: "amenity",
          spriteCandidates: [
            "giant_snow_sculpture_f0",
            "giant_snow_sculpture",
            "crystal_ice_sculpture",
          ],
          desc: "Monumental Sapporo-style carved snow dragon & Matterhorn centerpiece where ice artisans chisel!",
        },
        {
          id: "fireworks_mortar",
          sub: "festival",
          name: "Grand Fireworks Mortar Pad",
          shortLabel: "Fireworks",
          cost: 290,
          kind: "amenity",
          spriteCandidates: ["fireworks_mortar_f0", "fireworks_mortar", "gazex_blaster"],
          desc: "Launches pixel-art golden willow & peony starburst shells (click in Inspect or press [F] Finale)!",
        },
        {
          id: "festival_bunting_arch",
          sub: "festival",
          name: "Festival Pennant & Bulb Canopy",
          shortLabel: "Fest Bunting",
          cost: 75,
          kind: "amenity",
          dragPaint: true,
          rotMode: "axis",
          variants: { ns: "festival_bunting_arch_ns", ew: "festival_bunting_arch_ew" },
          spriteCandidates: [
            "festival_bunting_arch_ns_f0",
            "festival_bunting_arch_ew_f0",
            "festival_bunting_arch_ns",
            "street_light_garland_ns_f0",
          ],
          desc: "Drag crisscross Swiss/Bavarian carnival pennants & warm Edison bulbs along streets ([R] rotates).",
        },
        {
          id: "gondola_dj_booth",
          sub: "festival",
          name: "Upcycled Red Gondola DJ Booth",
          shortLabel: "Gondola DJ",
          cost: 360,
          kind: "amenity",
          spriteCandidates: ["gondola_dj_booth_f0", "gondola_dj_booth", "alphorn_band_stage_f0"],
          desc: "Vintage Zermatt gondola cabin on a snow deck with turntables, subwoofers & pulsing party lights!",
        },
        {
          id: "snow_cinema_screen",
          sub: "festival",
          name: "Snow-Bank Outdoor Winter Cinema",
          shortLabel: "Snow Cinema",
          cost: 330,
          kind: "amenity",
          spriteCandidates: ["snow_cinema_screen_f0", "snow_cinema_screen", "trail_map_board"],
          desc: "Timber projection screen playing pixel ski-jump films beside plaid-blanket log benches!",
        },
        {
          id: "alpine_photo_frame",
          sub: "festival",
          name: "Panoramic Selfie Frame & Swing",
          shortLabel: "Selfie Swing",
          cost: 195,
          kind: "amenity",
          spriteCandidates: ["alpine_photo_frame_f0", "alpine_photo_frame", "trail_map_board"],
          desc: "Giant carved ZERMATT wooden frame & rope swing where guests & Yetis pose for flash selfies!",
        },

        // 11 Après-Ski, Christmas Market, Wellness & Festoon Lighting (`sub: "market"`)
        {
          id: "schirmbar_umbrella",
          sub: "market",
          name: "Glass-Walled Après Schirmbar",
          shortLabel: "Schirmbar",
          cost: 260,
          kind: "amenity",
          spriteCandidates: ["schirmbar_umbrella_f0", "schirmbar_umbrella"],
          desc: "Iconic round glass-enclosed umbrella bar where après revelers clink mugs!",
        },
        {
          id: "cocoa_kiosk",
          sub: "market",
          name: "Steaming Hot Cocoa Kiosk",
          shortLabel: "Cocoa Hut",
          cost: 160,
          kind: "amenity",
          spriteCandidates: ["cocoa_kiosk_f0", "cocoa_kiosk"],
          desc: "Copper-pot marshmallow hot chocolate stand restoring +30% guest warmth.",
        },
        {
          id: "christmas_market_stall",
          sub: "market",
          name: "Garland Christmas Market Stall",
          shortLabel: "Xmas Stall",
          cost: 175,
          kind: "amenity",
          spriteCandidates: ["christmas_market_stall_f0", "christmas_market_stall"],
          desc: "Pine-garlanded timber market booth selling gingerbread, ornaments & Glühwein!",
        },
        {
          id: "chestnut_cart",
          sub: "market",
          name: "Glowing Roasted-Chestnut Cart",
          shortLabel: "Chestnuts",
          cost: 135,
          kind: "amenity",
          spriteCandidates: ["chestnut_cart_f0", "chestnut_cart"],
          desc: "Spoked wooden street cart with glowing coal brazier roasting sweet marroni.",
        },
        {
          id: "cedar_hottub",
          sub: "market",
          name: "Steaming Cedar Barrel Hot Tub",
          shortLabel: "Hot Tub",
          cost: 210,
          kind: "amenity",
          spriteCandidates: ["cedar_hottub_f0", "cedar_hottub"],
          desc: "Outdoor copper-banded cedar tub where happy bathers soak in rising steam!",
        },
        {
          id: "barrel_sauna",
          sub: "market",
          name: "Nordic Cedar Barrel Sauna",
          shortLabel: "Sauna",
          cost: 230,
          kind: "amenity",
          spriteCandidates: ["barrel_sauna_f0", "barrel_sauna"],
          desc: "Cozy horizontal pine barrel sauna with glowing stove porthole & snow roof.",
        },
        {
          id: "firepit_lounge",
          sub: "market",
          name: "Crackling Stone Firepit Lounge",
          shortLabel: "Firepit",
          cost: 150,
          kind: "amenity",
          spriteCandidates: ["firepit_lounge_f0", "firepit_lounge"],
          desc: "Circular granite fire ring with log benches casting warm flickering light.",
        },
        {
          id: "heated_patio_tables",
          sub: "market",
          name: "Outdoor Fondue Patio & Heaters",
          shortLabel: "Patio Dine",
          cost: 165,
          kind: "amenity",
          spriteCandidates: ["heated_patio_tables_f0", "heated_patio_tables"],
          desc: "Sun-terrace tables under mushroom heat lamps where diners share cheese fondue!",
        },
        {
          id: "holiday_tree",
          sub: "market",
          name: "Twinkling Village Holiday Tree",
          shortLabel: "Holiday Tree",
          cost: 140,
          kind: "amenity",
          spriteCandidates: ["holiday_tree_f0", "holiday_tree"],
          desc: "Grand village spruce draped in twinkling fairy lights & a golden crest star!",
        },
        {
          id: "street_light_garland",
          sub: "market",
          name: "Edison-Bulb Garland Street Arch",
          shortLabel: "Garland",
          cost: 65,
          kind: "amenity",
          dragPaint: true,
          rotMode: "axis",
          variants: {
            ns: "street_light_garland_ns",
            ew: "street_light_garland_ew",
          },
          spriteCandidates: [
            "street_light_garland_ns_f0",
            "street_light_garland_ew_f0",
            "street_light_garland_ns",
          ],
          desc: "Festive pine-and-bulb garland spanning cobblestone promenades ([R] rotates).",
        },
        {
          id: "alpine_lamp",
          sub: "market",
          name: "Wrought-Iron Village Lantern",
          shortLabel: "Lantern",
          cost: 45,
          kind: "amenity",
          dragPaint: true,
          spriteCandidates: ["alpine_lamp_f0", "alpine_lamp"],
          desc: "Classic brass-and-iron street lamp casting cozy golden pools on snowy paths.",
        },

        // 10 Pond Hockey, Curling, Ice Rink, Stage & Village Props (`sub: "rink"`)
        {
          id: "ice_rink_pad",
          sub: "rink",
          name: "Timber-Boarded Ice Rink Pad",
          shortLabel: "Ice Rink",
          cost: 190,
          kind: "amenity",
          dragPaint: true,
          spriteCandidates: ["ice_rink_pad_f0", "ice_rink_pad"],
          desc: "Polished village skating rink welcoming figure skaters, penguin aids & Zambonis!",
        },
        {
          id: "ice_curling_lane",
          sub: "rink",
          name: "Bavarian Ice Curling Sheet",
          shortLabel: "Curling",
          cost: 205,
          kind: "amenity",
          spriteCandidates: ["ice_curling_lane_f0", "ice_curling_lane"],
          desc: "Painted red-and-blue bullseye house where curling players slide granite stones!",
        },
        {
          id: "pond_hockey_goal",
          sub: "rink",
          name: "Red-Frame Pond Hockey Goal",
          shortLabel: "Hockey Goal",
          cost: 95,
          kind: "amenity",
          rotMode: "axis",
          variants: { ns: "pond_hockey_goal_ns", ew: "pond_hockey_goal_ew" },
          spriteCandidates: ["pond_hockey_goal_ns", "pond_hockey_goal_ew"],
          desc: "Sparks live 3v3 Red vs. Blue pond hockey games with sliding pucks & goal cheers ([R])!",
        },
        {
          id: "alphorn_band_stage",
          sub: "rink",
          name: "Festive Swiss Alphorn Stage",
          shortLabel: "Alphorn Stg",
          cost: 245,
          kind: "amenity",
          spriteCandidates: ["alphorn_band_stage_f0", "alphorn_band_stage"],
          desc: "Garlanded wooden pavilion where traditional Alphorn musicians perform!",
        },
        {
          id: "ski_lockers",
          sub: "rink",
          name: "Heated Base-Area Ski Lockers",
          shortLabel: "Ski Lockers",
          cost: 85,
          kind: "amenity",
          spriteCandidates: ["ski_lockers"],
          desc: "Cedar gear cubbies & boot-warmer lockers beside lift terminals.",
        },
        {
          id: "frozen_fountain",
          sub: "rink",
          name: "Icicle-Draped Stone Fountain",
          shortLabel: "Fountain",
          cost: 155,
          kind: "amenity",
          spriteCandidates: ["frozen_fountain_f0", "frozen_fountain"],
          desc: "Tiered plaza fountain shimmering with crystalline icicles & bubbling spring water.",
        },
        {
          id: "crystal_ice_sculpture",
          sub: "rink",
          name: "Chiselled Ice Stag Sculpture",
          shortLabel: "Ice Stag",
          cost: 130,
          kind: "amenity",
          spriteCandidates: ["crystal_ice_sculpture"],
          desc: "Translucent hand-carved alpine stag sculpture — a favorite selfie landmark!",
        },
        {
          id: "trail_map_board",
          sub: "rink",
          name: "Painted Mountain Panorama Map",
          shortLabel: "Trail Map",
          cost: 55,
          kind: "amenity",
          spriteCandidates: ["trail_map_board"],
          desc: "Gabled timber trail map board showing Green, Blue & Black-Diamond ski runs.",
        },
        {
          id: "ski_rack_bench",
          sub: "rink",
          name: "Cedar Ski-Rack & Boot Bench",
          shortLabel: "Ski Rack",
          cost: 40,
          kind: "amenity",
          rotMode: "dir",
          variants: { sw: "ski_rack_bench_sw", se: "ski_rack_bench_se" },
          spriteCandidates: ["ski_rack_bench_sw", "ski_rack_bench_se"],
          desc: "Resting bench with colorful racked skis & poles outside lodges ([R] toggles SW/SE).",
        },
        {
          id: "snowman_trio",
          sub: "rink",
          name: "Cheerful Alpine Snowman Trio",
          shortLabel: "Snowmen",
          cost: 35,
          kind: "amenity",
          spriteCandidates: ["snowman_trio"],
          desc: "Three scarf-wrapped snowmen where kids gather to roll snowballs & build!",
        },

        // 13 Multi-Scale Alpine Forests, Granite Crags, Ice Caves & Wildlife (`sub: "forest"`)
        {
          id: "spruce_tall_v0",
          sub: "forest",
          name: "Towering Snow Norway Spruce",
          shortLabel: "Tall Spruce",
          cost: 25,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["spruce_tall_v0", "spruce_tall_v1"],
          spriteCandidates: ["spruce_tall_v0", "spruce_tall_v1"],
          desc: "Old-growth evergreen heavily pillowed in fresh snow (auto-alternates v0/v1).",
        },
        {
          id: "spruce_med_v0",
          sub: "forest",
          name: "Medium Alpine Spruce",
          shortLabel: "Med Spruce",
          cost: 20,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["spruce_med_v0", "spruce_med_v1"],
          spriteCandidates: ["spruce_med_v0", "spruce_med_v1"],
          desc: "Mid-canopy snow-laden conifer framing ski pistes & glades (auto-alternates v0/v1).",
        },
        {
          id: "golden_larch_v0",
          sub: "forest",
          name: "Golden Winter Alpine Larch",
          shortLabel: "Gold Larch",
          cost: 26,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["golden_larch_v0", "golden_larch_v1"],
          spriteCandidates: ["golden_larch_v0", "golden_larch_v1"],
          desc: "Warm amber-gold needles dusted with frost — adds rich color contrast against snow!",
        },
        {
          id: "weeping_hemlock_v0",
          sub: "forest",
          name: "Weeping Mountain Hemlock",
          shortLabel: "Hemlock",
          cost: 24,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["weeping_hemlock_v0", "weeping_hemlock_v1"],
          spriteCandidates: ["weeping_hemlock_v0", "weeping_hemlock_v1"],
          desc: "Graceful drooping blue-green hemlock boughs heavy with alpine powder.",
        },
        {
          id: "dwarf_krummholz_v0",
          sub: "forest",
          name: "Timberline Dwarf Krummholz",
          shortLabel: "Krummholz",
          cost: 16,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["dwarf_krummholz_v0", "dwarf_krummholz_v1"],
          spriteCandidates: ["dwarf_krummholz_v0", "dwarf_krummholz_v1"],
          desc: "Wind-sculpted low timberline mugo pine cushions for high ridges (Lv 2–4).",
        },
        {
          id: "frosted_birch_v0",
          sub: "forest",
          name: "Frosted Silver Paper Birch",
          shortLabel: "Silver Birch",
          cost: 22,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["frosted_birch_v0", "frosted_birch_v1"],
          spriteCandidates: ["frosted_birch_v0", "frosted_birch_v1"],
          desc: "Delicate white-barked winter birch clump with hoarfrost twigs along creeks.",
        },
        {
          id: "alpine_shrub_cluster",
          sub: "forest",
          name: "Winter Heather & Snowberry Shrubs",
          shortLabel: "Shrubs",
          cost: 14,
          kind: "flora",
          dragPaint: true,
          spriteCandidates: ["alpine_shrub_cluster"],
          desc: "Low russet heather & snowberry underbrush breaking up bare snow clearings.",
        },
        {
          id: "fallen_snow_log",
          sub: "forest",
          name: "Snow-Blanketed Fallen Pine Log",
          shortLabel: "Snow Log",
          cost: 15,
          kind: "flora",
          spriteCandidates: ["fallen_snow_log"],
          desc: "Mossy weathered larch trunk pillowed in deep forest powder.",
        },
        {
          id: "summit_crag_v0",
          sub: "forest",
          name: "Matterhorn Granite Crag",
          shortLabel: "Granite Crag",
          cost: 35,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["summit_crag_v0", "summit_crag_v1"],
          spriteCandidates: ["summit_crag_v0", "summit_crag_v1"],
          desc: "Jagged snow-veined granite spire for dramatic summit skylines & cliffs.",
        },
        {
          id: "snow_boulder_v0",
          sub: "forest",
          name: "Glacial Erratic Snow Boulder",
          shortLabel: "Boulder",
          cost: 18,
          kind: "flora",
          dragPaint: true,
          naturalPair: ["snow_boulder_v0", "snow_boulder_v1"],
          spriteCandidates: ["snow_boulder_v0", "snow_boulder_v1"],
          desc: "Chiseled alpine granite boulders capped with wind-packed snow.",
        },
        {
          id: "glacier_ice_cave",
          sub: "forest",
          name: "Glowing Blue Glacier Ice Cave",
          shortLabel: "Ice Cave",
          cost: 95,
          kind: "flora",
          spriteCandidates: ["glacier_ice_cave"],
          desc: "Three-spire turquoise serac grotto glowing with ethereal blue ice light — draws hikers!",
        },
        {
          id: "wildlife_feeding_rack",
          sub: "forest",
          name: "Alpine Deer & Ibex Hay Crib",
          shortLabel: "Deer Crib",
          cost: 45,
          kind: "flora",
          spriteCandidates: ["wildlife_feeding_rack"],
          desc: "Roofed timber hay manger attracting wild Red Deer & Alpine Ibex to forest glades!",
        },
        {
          id: "eagle_eyrie_crag",
          sub: "forest",
          name: "Golden Eagle Eyrie Spire",
          shortLabel: "Eagle Eyrie",
          cost: 85,
          kind: "flora",
          spriteCandidates: ["eagle_eyrie_crag"],
          desc: "High granite pinnacle with cliffside twig eyrie where Golden Eagles soar overhead!",
        },
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // 3. Fast Catalog Lookup Maps (Canonical + Every Directional/Variant Alias)
  // ---------------------------------------------------------------------------
  const SPECIAL_TOOLS = {
    bulldoze: {
      id: "bulldoze",
      name: "Clear Structure, Lift or Tree",
      shortLabel: "Clear",
      cost: 0,
      kind: "bulldoze",
      dragPaint: true,
      desc: "Click or drag to clear buildings, walkways, trees, or demolish an entire ski lift line.",
    },
  };

  const TOOL_BY_ID = new Map();
  const TAB_OF_TOOL = new Map();
  const VARIANT_ROT_LOOKUP = new Map();
  const ALL_CATALOG_ITEMS = [];

  for (const tab of PALETTE_TABS) {
    for (const item of tab.items) {
      item.tabId = tab.id;
      item.tabLabel = tab.label;
      item._searchText = `${item.id} ${item.name} ${item.shortLabel || ""} ${item.sub || ""} ${item.desc || ""}`.toLowerCase();
      ALL_CATALOG_ITEMS.push(item);

      TOOL_BY_ID.set(item.id, item);
      TAB_OF_TOOL.set(item.id, tab.id);

      if (item.variants && typeof item.variants === "object") {
        for (const [rotKey, varId] of Object.entries(item.variants)) {
          if (!TOOL_BY_ID.has(varId)) {
            TOOL_BY_ID.set(varId, item);
            TAB_OF_TOOL.set(varId, tab.id);
          }
          VARIANT_ROT_LOOKUP.set(varId, { rotMode: item.rotMode, rotKey });
        }
      }
      if (Array.isArray(item.naturalPair)) {
        for (const altId of item.naturalPair) {
          if (!TOOL_BY_ID.has(altId)) {
            TOOL_BY_ID.set(altId, item);
            TAB_OF_TOOL.set(altId, tab.id);
          }
        }
      }
      // Base-ID convenience aliases (e.g. `spruce_tall` -> `spruce_tall_v0`, `train_track` -> `train_track_ns`)
      const stripped = item.id.replace(/_(v0|ns|sw)$/, "");
      if (stripped !== item.id && !TOOL_BY_ID.has(stripped)) {
        TOOL_BY_ID.set(stripped, item);
        TAB_OF_TOOL.set(stripped, tab.id);
      }
    }
  }

  // Rich Inspector Biographies for All v3 Festival, Sky, Slope & Sled Entities (#125 & #139)
  const ENTITY_INSPECTOR_DEFAULTS = {
    hot_air_balloon: {
      name: "Montgolfier Alpine Balloon",
      badge: "Hot-Air Balloon",
      action: "Drifting serenely above the Matterhorn amphitheater",
      thought: "Look at the Ferris Wheel and ski trails glowing across the valley!",
    },
    alpine_paraglider: {
      name: "Thermal Ridge Paraglider",
      badge: "Summit Paraglider",
      action: "Banking graceful figure-8 thermals off the summit crags",
      thought: "Best view in the Swiss Alps — soaring right beside the gondolas!",
    },
    torchlight_skier: {
      name: "Torchlight Parade Instructor",
      badge: "Torchlight Parade",
      action: "Carving synchronized S-turns with a blazing magnesium flare",
      thought: "A ribbon of golden fire winding from the summit down to town!",
    },
    retro_neon_skier: {
      name: "80s Neon Freestyle Hotdogger",
      badge: "Retro Freestyler",
      action: "Throwing daffy & spread-eagle tricks off terrain-park kickers",
      thought: "Electric neon chevron suit and fresh corduroy — totally radical!",
    },
    davos_toboggan_pair: {
      name: "Davos Wooden Toboggan Pair",
      badge: "Family Sledders",
      action: "Zipping down the snow lane on a classic ash-wood Davos sled",
      thought: "Lean into the snowy berm — hold onto your pom-pom beanie!",
    },
    husky_dogsled: {
      name: "Siberian Husky Dogsled Team",
      badge: "Husky Musher",
      action: "Mushing briskly along frosted Nordic pine trails",
      thought: "Good dogs! Crisp powder underfoot and sleigh bells echoing.",
    },
    coaster_sled: {
      name: "Alpine Gravity Coaster Rider",
      badge: "Mountain Coaster",
      action: "Banking full-tilt along tubular steel mountain-coaster rails",
      thought: "Hands in the air through the hairpin turn — what a rush!",
    },
    yeti_mascot: {
      name: "Barni the Alpine Yeti",
      badge: "Resort Mascot",
      action: "Waving to delighted kids & posing for Winter Festival selfies",
      thought: "Warm striped scarf, roasted almonds, and high-fives for everyone!",
    },
    festival_parade_trio: {
      name: "Trycheln & Accordion Folk Trio",
      badge: "Festival Parade",
      action: "Ringing Swiss brass cowbells & playing festive folk polkas",
      thought: "Accordion melodies echoing off timber chalets warm the whole square!",
    },
    ice_artisan: {
      name: "Sapporo Ice-Carving Artisan",
      badge: "Master Sculptor",
      action: "Chiseling crystalline facets on snow dragons & glacier arches",
      thought: "Just one more bevel so the dragon wing catches the lantern light!",
    },
    slope_photographer: {
      name: "Alpine Action Photographer",
      badge: "Pro Telephoto",
      action: "Framing crisp strobe-lit powder turns & summit portraits",
      thought: "Nailed the powder roostertail right in front of the Matterhorn!",
    },
  };

  // 12 Resort Milestones fallback (when sim hasn't hydrated yet)
  const FALLBACK_CHALLENGES = [
    {
      id: "first_chairlift",
      title: "First Mountain Lift",
      desc: "Operate at least 1 Chairlift, Gondola, or Tram hauling skiers uphill.",
      reward: 350,
    },
    {
      id: "summit_gondola",
      title: "Matterhorn Summit Observatory",
      desc: "Connect a Summit Gondola/3S Tram or crown Lv 3–4 with a Sphinx Observatory.",
      reward: 650,
    },
    {
      id: "ski_school_ducklings",
      title: "Ski-School Duckling Parade",
      desc: "Pair a Kids Ski-School Lodge with a Magic Carpet or Green Run.",
      reward: 400,
    },
    {
      id: "terrain_park",
      title: "Mountain Coaster & Freestyle Park",
      desc: "Thrill riders with a Mountain Coaster, Big-Air kickers, or rainbow rails.",
      reward: 500,
    },
    {
      id: "world_cup_race",
      title: "World-Cup Slalom Classic",
      desc: "Set a Race Start Hut, Slalom/GS gates & LED Finish Timing Arch.",
      reward: 500,
    },
    {
      id: "pond_hockey_classic",
      title: "Frozen Lagoon Classic",
      desc: "Host Pond Hockey, Curling, or Ice Skating on the frozen lake.",
      reward: 450,
    },
    {
      id: "cascading_hydrology",
      title: "Skybridge & Waterfall Gorge",
      desc: "Span a rushing Meltwater Waterfall with a Skybridge, Viaduct, or Covered Bridge.",
      reward: 450,
    },
    {
      id: "night_lights",
      title: "Night Mode 2.0 & Torchlight Ski",
      desc: "Illuminate pistes with Slope Floodlights, Neon Masts & Festival Bunting.",
      reward: 450,
    },
    {
      id: "fresh_corduroy",
      title: "Velvet Corduroy Fleet",
      desc: "Maintain 85%+ piste quality with Snowcat & Winch-Cat Garages.",
      reward: 500,
    },
    {
      id: "grand_hospitality",
      title: "Winter Festival & 2×2 Landmarks",
      desc: "Operate a Timber Ferris Wheel, Grand Hotel, Thermal Spa, or Winter Carousel.",
      reward: 750,
    },
    {
      id: "peak_rush",
      title: "190-Guest Winter Carnival",
      desc: "Host a bustling resort of skiers, coaster riders, balloons & festival strollers.",
      reward: 650,
    },
    {
      id: "five_star_resort",
      title: "4.7★ Premier Alpine Peak",
      desc: "Achieve a 4.7★+ Resort Reputation across runs, lifts & festival village.",
      reward: 900,
    },
  ];

  // ---------------------------------------------------------------------------
  // 4. SanctuaryUI Studio Controller (`window.SanctuaryUI`)
  // ---------------------------------------------------------------------------
  class SanctuaryUI {
    constructor({ canvas, world, sim, renderer, audio, atlas, thumbMode = false }) {
      this.canvas = canvas;
      this.world = world;
      this.sim = sim;
      this.renderer = renderer;
      this.audio = audio;
      this.atlas = atlas;
      this.thumbMode = Boolean(thumbMode);

      // Active Construction & Expandable Multi-Row Catalog State
      this.activeTab = "lifts";
      this.activeSubFilter = "all";
      this.searchQuery = "";
      this.dockRows = 2; // 2 (default compact grid) | 3 (expanded catalog) | 1 (slim strip)
      this.activeTool = null; // null = Inspect & Pan mode

      // 4 Independent Rotation States (`[R]` cycles all cleanly)
      this.dirRotation = "sw"; // "sw" | "se"
      this.axisRotation = "ns"; // "ns" | "ew"
      this.cardinalRotation = "s"; // "n" | "e" | "s" | "w"
      this.cornerRotation = "ne"; // "ne" | "se" | "sw" | "nw"

      // Mountain & Studio Settings
      this.currentPreset = "zermatt_grand";
      this.currentSeed = 202612;
      this.atmosphere = "day";
      this.simSpeed = 1;
      this.zenMode = false;
      this.guideOpen = false;
      this.dockCollapsed = false;

      // Pointer, Pan & Lift-Drag State
      this.hoverCell = null; // { r, c, u, v }
      this.pointerDown = false;
      this.isPanning = false;
      this.spaceHeld = false;
      this.panStartX = 0;
      this.panStartY = 0;
      this.dragMovedPx = 0;
      this.paintedCellsInStroke = new Set();
      this.lastSculptTimeByCell = new Map();
      this.strokeTargetLevel = 1;

      // Drag-to-Build Ski Lift State (all 10 lift types)
      this.liftAnchor = null; // { r, c }
      this.liftDragging = false;

      // Live Guest / Vehicle / Lift / Building Inspector State
      this.inspectedTarget = null;
      this.followEntity = false;

      // Keyboard Panning
      this.keysDown = new Set();

      // Caches & Milestone Tracking
      this._thumbCache = new Map();
      this._entityIconCache = new Map();
      this._knownCompletedChallenges = new Set();
      this._bootCompleted = false;
      this._lastHudSyncTime = 0;
      this._lastCashValue = null;

      // Stage 1/2 Zero-Lag DOM, Persistent Catalog Cache, Layout Rect & Stroke Batching State
      this._masterCardById = new Map();
      this._subFilterBtnsByTab = new Map();
      this._searchChipRec = null;
      this._renderedSubTabId = null;
      this._emptyTrayEl = null;
      this._catalogPrewarmed = false;
      this._trayScrolled = false;
      this._trayArrowsVisible = null;
      this._tooltipHidden = true;
      this._liftBannerVisible = false;
      this._lastBtnInspect = null;
      this._lastBtnBulldoze = null;
      this._lastCursorMask = -1;
      this._lastRotateSfxTime = -1000;
      this._minimapCtx = null;
      this._cardElsById = new Map();
      this._hoveredCardId = null;
      this._lastAffordCash = null;
      this._lastAffordSandbox = null;
      this._lastCanUndo = null;
      this._lastCanRedo = null;
      this._guideLiftRows = new Map();
      this._guideEmptyLiftEl = null;
      this._guideChallengeCards = new Map();
      this._canvasRect = null;
      this._minimapRect = null;
      this._atmoGroupRect = null;
      this._minimapBaseBuf = null;
      this._minimapBaseVer = -1;
      this._minimapBaseAtmo = "";
      this._minimapBaseW = 0;
      this._minimapBaseH = 0;
      this._minimapBaseValid = false;
      this._inStrokeBatch = false;
      this._inDragApply = false;
      this._hudDirty = false;
      this._pendingHoverCoords = null;
      this._hoverRafId = 0;
      this._finaleFallbackUntil = 0;
      this._finaleResetTimer = 0;
      this._lastBtnFestive = null;
      this._lastBtnShowcase = null;
      this._inspPortraitSpan = null;

      // Mobile Responsive & 2-Finger Pinch State (<= 768px only; 0 impact > 768px)
      this._isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      this.mobileMenuOpen = false;
      this._mobSearchOpen = false;
      this._touchPoints = new Map();
      this._isPinching = false;
      this._pinchPrevDist = 0;
      this._pinchPrevMidX = 0;
      this._pinchPrevMidY = 0;

      this._cacheDom();
      if (this.renderer) {
        this.renderer.onShowcaseCameraChange = (active) => {
          this._syncShowcaseButton(Boolean(active));
        };
      }
      if (this.sim && typeof this.sim.setAtmosphereHint === "function") {
        this.sim.setAtmosphereHint(this.atmosphere);
      }
      this._bindDomEvents();
      this._bindCanvasEvents();
      this._bindKeyboardEvents();
      this._bindSimEvents();

      if (this._isMobile) {
        this.setDockRows(1);
        this.setDockCollapsed(true);
      } else {
        this.setDockRows(2);
      }
      this.renderPaletteTray();
      this.updateToolButtons();
      this.refreshUI(true);
    }

    _setText(el, val) {
      if (!el) return;
      const s = String(val === undefined || val === null ? "" : val);
      if (el._lastText !== s) {
        el._lastText = s;
        el.textContent = s;
      }
    }

    _setFillScale(el, pct) {
      if (!el) return;
      const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
      const s = (clamped / 100).toFixed(3);
      if (el.style.width) {
        el.style.removeProperty("width");
      }
      if (el._lastScale !== s) {
        el._lastScale = s;
        el.style.setProperty("--fill-scale", s);
      }
    }

    _invalidateLayoutRects() {
      this._canvasRect = null;
      this._minimapRect = null;
      this._atmoGroupRect = null;
    }

    _getMinimapRect() {
      const mc = this.dom && this.dom.minimapCanvas;
      if (!mc) return null;
      if (!this._minimapRect || this._minimapRect.width < 1) {
        this._minimapRect = mc.getBoundingClientRect();
      }
      return this._minimapRect;
    }

    _getAtmoGroupRect() {
      const ag = this.dom && this.dom.atmoGroup;
      if (!ag) return null;
      if (!this._atmoGroupRect || this._atmoGroupRect.width < 1) {
        this._atmoGroupRect = ag.getBoundingClientRect();
      }
      return this._atmoGroupRect;
    }

    _cacheDom() {
      this.dom = {
        hudRoot: document.getElementById("hud-root"),
        shutterFlash: document.getElementById("shutter-flash"),

        // Top-Left Carved Timber Status Ledger
        statRating: document.getElementById("stat-rating"),
        statCashPill: document.getElementById("stat-cash-pill"),
        statCash: document.getElementById("stat-cash"),
        statSkiers: document.getElementById("stat-skiers"),
        statTown: document.getElementById("stat-town"),
        runsGreen: document.getElementById("runs-green"),
        runsBlue: document.getElementById("runs-blue"),
        runsBlack: document.getElementById("runs-black"),
        hudWarmthFill: document.getElementById("hud-warmth-fill"),
        hudWarmthLabel: document.getElementById("hud-warmth-label"),
        hudThrillFill: document.getElementById("hud-thrill-fill"),
        hudThrillLabel: document.getElementById("hud-thrill-label"),
        btnGuideToggle: document.getElementById("btn-guide-toggle"),
        guideBadgeDot: document.getElementById("guide-badge-dot"),
        btnModeToggle: document.getElementById("btn-mode-toggle"),
        modeLabel: document.getElementById("mode-label"),

        // Top-Right Wheel & Studio Controls
        presetSelect: document.getElementById("preset-select"),
        btnNewIsland: document.getElementById("btn-new-island"),
        atmoGroup: document.getElementById("atmo-group"),
        atmoActiveLabel: document.getElementById("atmo-active-label"),
        speedGroup: document.getElementById("speed-group"),
        hudMinimap: document.getElementById("hud-minimap"),
        minimapCanvas: document.getElementById("minimap-canvas"),
        btnUndo: document.getElementById("btn-undo"),
        btnRedo: document.getElementById("btn-redo"),
        btnZoomOut: document.getElementById("btn-zoom-out"),
        btnZoomReset: document.getElementById("btn-zoom-reset"),
        btnZoomIn: document.getElementById("btn-zoom-in"),
        btnFestiveFinale: document.getElementById("btn-festive-finale"),
        btnShowcaseCam: document.getElementById("btn-showcase-cam"),
        btnSound: document.getElementById("btn-sound"),
        iconSoundOn: document.getElementById("icon-sound-on"),
        iconSoundOff: document.getElementById("icon-sound-off"),
        btnZen: document.getElementById("btn-zen"),
        btnZenRestore: document.getElementById("btn-zen-restore"),
        btnSnapshot: document.getElementById("btn-snapshot"),

        // Lift Drag Helper & Toasts
        liftDragBanner: document.getElementById("lift-drag-banner"),
        toastContainer: document.getElementById("toast-container"),

        // Live Inspector Card
        inspectorCard: document.getElementById("inspector-card"),
        inspPortrait: document.getElementById("insp-portrait"),
        inspName: document.getElementById("insp-name"),
        inspBadge: document.getElementById("insp-badge"),
        btnInspClose: document.getElementById("btn-insp-close"),
        inspAction: document.getElementById("insp-action"),
        inspThought: document.getElementById("insp-thought"),
        inspMeters: document.getElementById("insp-meters"),
        inspStaticHeader: document.getElementById("insp-static-header"),
        inspWarmthFill: document.getElementById("insp-warmth-fill"),
        inspWarmthVal: document.getElementById("insp-warmth-val"),
        inspThrillFill: document.getElementById("insp-thrill-fill"),
        inspThrillVal: document.getElementById("insp-thrill-val"),
        inspMeta: document.getElementById("insp-meta"),
        btnInspFollow: document.getElementById("btn-insp-follow"),
        inspFollowLabel: document.getElementById("insp-follow-label"),

        // Slide-Over Resort Guide Drawer
        guideDrawer: document.getElementById("guide-drawer"),
        guideSubtitle: document.getElementById("guide-subtitle"),
        btnGuideClose: document.getElementById("btn-guide-close"),
        econTrainEta: document.getElementById("econ-train-eta"),
        econCash: document.getElementById("econ-cash"),
        econWarmth: document.getElementById("econ-warmth"),
        econThrill: document.getElementById("econ-thrill"),
        econGrooming: document.getElementById("econ-grooming"),
        liftsCountMeta: document.getElementById("lifts-count-meta"),
        liftsStatusList: document.getElementById("lifts-status-list"),
        milestonesEyebrow: document.getElementById("milestones-eyebrow"),
        milestonesMeta: document.getElementById("milestones-meta"),
        challengesList: document.getElementById("challenges-list"),

        // Bottom Multi-Row Construction Dock
        buildDock: document.getElementById("hud-bottom-dock"),
        paletteTooltip: document.getElementById("palette-tooltip"),
        tooltipTitle: document.getElementById("tooltip-title"),
        tooltipCost: document.getElementById("tooltip-cost"),
        tooltipDesc: document.getElementById("tooltip-desc"),
        dockTabs: document.getElementById("dock-tabs"),
        btnInspect: document.getElementById("btn-inspect"),
        btnRotate: document.getElementById("btn-rotate"),
        rotateBadge: document.getElementById("rotate-badge"),
        btnBulldoze: document.getElementById("btn-bulldoze"),
        btnGridExpand: document.getElementById("btn-grid-expand"),
        gridExpandLabel: document.getElementById("grid-expand-label"),
        btnDockCollapse: document.getElementById("btn-dock-collapse"),
        dockCollapseGlyph: document.getElementById("dock-collapse-glyph"),
        dockSubbar: document.getElementById("dock-subbar"),
        dockSubfilters: document.getElementById("dock-subfilters"),
        catalogSearch: document.getElementById("catalog-search"),
        btnSearchClear: document.getElementById("btn-search-clear"),
        dockTray: document.getElementById("dock-tray"),
        btnTrayLeft: document.getElementById("btn-tray-left"),
        btnTrayRight: document.getElementById("btn-tray-right"),

        // Mobile-Only Responsive Chrome (<= 768px)
        mobileVitalPill: document.getElementById("mobile-vital-pill"),
        mobStatCash: document.getElementById("mob-stat-cash"),
        mobStatCrowd: document.getElementById("mob-stat-crowd"),
        mobStatRating: document.getElementById("mob-stat-rating"),
        mobRunsGreen: document.getElementById("mob-runs-green"),
        mobRunsBlue: document.getElementById("mob-runs-blue"),
        mobRunsBlack: document.getElementById("mob-runs-black"),
        mobGuideDot: document.getElementById("mob-guide-dot"),
        btnMobileMenu: document.getElementById("btn-mobile-menu"),
        mobBtnInspect: document.getElementById("mob-btn-inspect"),
        mobBtnRotate: document.getElementById("mob-btn-rotate"),
        mobRotateBadge: document.getElementById("mob-rotate-badge"),
        mobBtnBulldoze: document.getElementById("mob-btn-bulldoze"),
        mobBtnUndo: document.getElementById("mob-btn-undo"),
        mobileSheetBackdrop: document.getElementById("mobile-sheet-backdrop"),
        mobileMenuSheet: document.getElementById("mobile-menu-sheet"),
        btnMobileMenuClose: document.getElementById("btn-mobile-menu-close"),
        mobAtmoSeg: document.getElementById("mob-atmo-seg"),
        mobPresetSelect: document.getElementById("mob-preset-select"),
        mobBtnNew: document.getElementById("mob-btn-new"),
        mobSpeedSeg: document.getElementById("mob-speed-seg"),
        mobBtnMode: document.getElementById("mob-btn-mode"),
        mobModeLabel: document.getElementById("mob-mode-label"),
        mobBtnFinale: document.getElementById("mob-btn-finale"),
        mobBtnTour: document.getElementById("mob-btn-tour"),
        mobBtnGuide: document.getElementById("mob-btn-guide"),
        mobBtnSound: document.getElementById("mob-btn-sound"),
        mobSoundLabel: document.getElementById("mob-sound-label"),
        mobBtnSnapshot: document.getElementById("mob-btn-snapshot"),
        mobBtnZen: document.getElementById("mob-btn-zen"),
        btnMobSearchToggle: document.getElementById("btn-mob-search-toggle"),
        btnMobDockFold: document.getElementById("btn-mob-dock-fold"),
      };

      // Isolate layout/style roots inside the fixed bottom dock so badge/tab/card updates
      // never invalidate ancestor or sibling HUD subtrees (0.0px visual change).
      const isolatedEls = [
        this.dom.buildDock,
        this.dom.dockTabs,
        this.dom.btnInspect,
        this.dom.btnRotate,
        this.dom.btnBulldoze,
        this.dom.btnGridExpand,
      ];
      for (let i = 0; i < isolatedEls.length; i++) {
        const el = isolatedEls[i];
        if (el && el.style) el.style.contain = "layout style";
      }
    }

    // -------------------------------------------------------------------------
    // 5. Crisp Pixel-Art Thumbnails & Generalized 2x2 Landmark Stitching
    // -------------------------------------------------------------------------
    _resolveSpriteKey(candidates, wantEntity = false) {
      if (!this.atlas || !Array.isArray(candidates)) return candidates ? candidates[0] : "";
      for (const key of candidates) {
        if (!key) continue;
        if (wantEntity) {
          if (typeof this.atlas.hasEntity === "function" && this.atlas.hasEntity(key)) return key;
        } else {
          if (typeof this.atlas.hasTile === "function" && this.atlas.hasTile(key)) return key;
        }
      }
      if (!wantEntity && typeof this.atlas.hasEntity === "function") {
        for (const key of candidates) {
          if (key && this.atlas.hasEntity(key)) return key;
        }
      }
      return candidates[0] || "";
    }

    getConcreteToolId(tool, r = 0, c = 0) {
      if (!tool) return "";
      if (tool.rotMode === "dir" && tool.variants) {
        return tool.variants[this.dirRotation] || tool.id;
      }
      if (tool.rotMode === "axis" && tool.variants) {
        return tool.variants[this.axisRotation] || tool.id;
      }
      if (tool.rotMode === "cardinal" && tool.variants) {
        return tool.variants[this.cardinalRotation] || tool.id;
      }
      if (tool.rotMode === "corner" && tool.variants) {
        return tool.variants[this.cornerRotation] || tool.id;
      }
      if (tool.naturalPair && this.atlas && typeof this.atlas.hasTile === "function") {
        const alt = tool.naturalPair[(r + c) & 1];
        if (this.atlas.hasTile(alt)) return alt;
      }
      return tool.id;
    }

    _resolveCompositeSliceKey(prefix, quad) {
      if (!this.atlas || typeof this.atlas.hasTile !== "function") return "";
      const withFrame = `${prefix}_${quad}_f0`;
      if (this.atlas.hasTile(withFrame)) return withFrame;
      const plain = `${prefix}_${quad}`;
      if (this.atlas.hasTile(plain)) return plain;
      return "";
    }

    getToolThumbnailDataUrl(tool) {
      if (!tool) return "";
      const rotTag = tool.rotMode ? this.getActiveRotationToken(tool) : "0";
      const cacheKey = `${tool.id}:${rotTag}`;
      if (this._thumbCache.has(cacheKey)) {
        return this._thumbCache.get(cacheKey);
      }

      let dataUrl = "";

      // Generalized 2x2 Composite Landmark Stitcher (`grand_hotel_2x2`, `thermal_spa_2x2`, `base_lodge_2x2`)
      if (
        tool.isComposite2x2 &&
        this.atlas &&
        typeof this.atlas.hasTile === "function" &&
        typeof this.atlas.drawTile === "function"
      ) {
        const prefix = tool.compositePrefix || tool.id;
        const kNW = this._resolveCompositeSliceKey(prefix, "nw");
        const kNE = this._resolveCompositeSliceKey(prefix, "ne");
        const kSW = this._resolveCompositeSliceKey(prefix, "sw");
        const kSE = this._resolveCompositeSliceKey(prefix, "se");
        if (kNW && kNE && kSW && kSE) {
          try {
            const full = document.createElement("canvas");
            full.width = 256;
            full.height = 288;
            const fctx = full.getContext("2d");
            fctx.imageSmoothingEnabled = false;
            // Painter's order: nw (0,0) -> ne (0,1) -> sw (1,0) -> se (1,1)
            this.atlas.drawTile(fctx, kNW, 64, 0, 1);
            this.atlas.drawTile(fctx, kNE, 128, 32, 1);
            this.atlas.drawTile(fctx, kSW, 0, 32, 1);
            this.atlas.drawTile(fctx, kSE, 64, 64, 1);

            const imgData = fctx.getImageData(0, 0, 256, 288).data;
            let minX = 256;
            let minY = 288;
            let maxX = 0;
            let maxY = 0;
            for (let y = 0; y < 288; y++) {
              for (let x = 0; x < 256; x++) {
                if (imgData[(y * 256 + x) * 4 + 3] > 8) {
                  if (x < minX) minX = x;
                  if (y < minY) minY = y;
                  if (x + 1 > maxX) maxX = x + 1;
                  if (y + 1 > maxY) maxY = y + 1;
                }
              }
            }
            if (maxX > minX && maxY > minY) {
              const bw = maxX - minX;
              const bh = maxY - minY;
              const out = document.createElement("canvas");
              out.width = 48;
              out.height = 48;
              const octx = out.getContext("2d");
              octx.imageSmoothingEnabled = false;
              const scale = Math.min(44 / bw, 44 / bh);
              const dw = Math.max(1, Math.round(bw * scale));
              const dh = Math.max(1, Math.round(bh * scale));
              octx.drawImage(
                full,
                minX,
                minY,
                bw,
                bh,
                Math.floor((48 - dw) / 2),
                Math.floor((48 - dh) / 2),
                dw,
                dh
              );
              dataUrl = out.toDataURL("image/png");
            }
          } catch (_) {}
        }
      }

      // Standard Atlas Tile Lookup
      if (!dataUrl && this.atlas && typeof this.atlas.renderThumbnailDataUrl === "function") {
        let candidates = tool.spriteCandidates || [tool.id];
        if (tool.rotMode && tool.variants) {
          const concrete = this.getConcreteToolId(tool);
          candidates = [concrete, `${concrete}_f0`, ...candidates];
        } else {
          candidates = [...candidates, `${tool.id}_f0`, tool.id];
        }
        const key = this._resolveSpriteKey(candidates, false);
        if (key) {
          try {
            dataUrl = this.atlas.renderThumbnailDataUrl(key, false, 48) || "";
          } catch (_) {}
        }
      }

      if (dataUrl) {
        this._thumbCache.set(cacheKey, dataUrl);
      }
      return dataUrl;
    }

    getEntityPortraitDataUrl(spriteOrId, isTile = false) {
      if (!spriteOrId || !this.atlas || typeof this.atlas.renderThumbnailDataUrl !== "function") {
        return "";
      }
      const cacheKey = `${isTile ? "T" : "E"}:${spriteOrId}`;
      if (this._entityIconCache.has(cacheKey)) {
        return this._entityIconCache.get(cacheKey);
      }
      let url = "";
      const candidates = isTile
        ? [
            spriteOrId,
            `${spriteOrId}_f0`,
            `${spriteOrId}_ns_f0`,
            `${spriteOrId}_se_f0`,
            `${spriteOrId}_sw`,
            `${spriteOrId}_ns`,
          ]
        : [spriteOrId, `${spriteOrId}_sw_f0`, `${spriteOrId}_se_f0`, `${spriteOrId}_f0`];
      for (const cand of candidates) {
        try {
          url = this.atlas.renderThumbnailDataUrl(cand, !isTile, 48) || "";
          if (url) break;
        } catch (_) {}
      }
      if (url) this._entityIconCache.set(cacheKey, url);
      return url;
    }

    _normalizeThumbSprite(sp, targetPx = 40) {
      if (!sp || typeof sp.x !== "number" || typeof sp.y !== "number") return null;
      const baseW = sp.w || sp.size || targetPx;
      const k = baseW > 0 && baseW !== targetPx ? targetPx / baseW : 1;
      const rawX = sp.x > 0 ? -sp.x : sp.x;
      const rawY = sp.y > 0 ? -sp.y : sp.y;
      return {
        url: typeof sp.url === "string" ? sp.url : "",
        x: rawX * k,
        y: rawY * k,
        w: targetPx,
        h: targetPx,
        sheetW: (sp.sheetW || 0) * k,
        sheetH: (sp.sheetH || 0) * k,
      };
    }

    _resolveToolSpriteKey(tool) {
      if (!tool) return "";
      if (tool.isComposite2x2) {
        return tool.compositePrefix || tool.id;
      }
      let candidates = tool.spriteCandidates || [tool.id];
      if (tool.rotMode && tool.variants) {
        const concrete = this.getConcreteToolId(tool);
        candidates = [concrete, `${concrete}_f0`, ...candidates];
      } else {
        candidates = [...candidates, `${tool.id}_f0`, tool.id];
      }
      return this._resolveSpriteKey(candidates, false);
    }

    _getToolThumbSprite(tool, targetPx = 40) {
      if (!tool || !this.atlas || typeof this.atlas.getThumbSprite !== "function") return null;
      if (
        typeof BUILT_IN_TOOL_SVGS !== "undefined" &&
        BUILT_IN_TOOL_SVGS &&
        BUILT_IN_TOOL_SVGS[tool.id]
      ) {
        return null;
      }

      const primaryKey = this._resolveToolSpriteKey(tool);
      const tryKeys = [];
      if (primaryKey) tryKeys.push(primaryKey);
      if (tool.isComposite2x2) {
        if (tool.id && !tryKeys.includes(tool.id)) tryKeys.push(tool.id);
        if (Array.isArray(tool.spriteCandidates)) {
          for (let i = 0; i < tool.spriteCandidates.length; i++) {
            const k = tool.spriteCandidates[i];
            if (k && !tryKeys.includes(k)) tryKeys.push(k);
          }
        }
      } else {
        if (tool.rotMode && tool.variants) {
          const concrete = this.getConcreteToolId(tool);
          if (concrete && !tryKeys.includes(concrete)) tryKeys.push(concrete);
        }
        if (Array.isArray(tool.spriteCandidates)) {
          for (let i = 0; i < tool.spriteCandidates.length; i++) {
            const k = tool.spriteCandidates[i];
            if (k && !tryKeys.includes(k)) tryKeys.push(k);
          }
        }
        if (tool.id && !tryKeys.includes(tool.id)) tryKeys.push(tool.id);
      }

      for (let i = 0; i < tryKeys.length; i++) {
        const sp = this.atlas.getThumbSprite(tryKeys[i], targetPx);
        if (sp) {
          return this._normalizeThumbSprite(sp, targetPx);
        }
      }
      return null;
    }

    _applyToolThumb(wrap, item) {
      if (!wrap || !item) return;
      const sp = this._getToolThumbSprite(item, 40);
      if (sp) {
        if (wrap._thumbImg) {
          wrap._thumbImg.remove();
          wrap._thumbImg = null;
        }
        const bgOverride =
          sp.url && sp.url.startsWith("data:") ? `;background-image:url("${sp.url}")` : "";
        const cssVars = `--thumb-x:${sp.x.toFixed(2)}px;--thumb-y:${sp.y.toFixed(2)}px;--thumb-sheet-w:${sp.sheetW.toFixed(2)}px;--thumb-sheet-h:${sp.sheetH.toFixed(2)}px${bgOverride}`;
        let span = wrap._thumbSpan;
        if (!span) {
          span = document.createElement("span");
          span.className = "palette-thumb palette-thumb-sprite pixelated";
          span.dataset.sprite = "1";
          span.setAttribute("aria-hidden", "true");
          wrap._thumbSpan = span;
          wrap.insertBefore(span, wrap.firstChild);
        }
        if (span._lastCssVars !== cssVars) {
          span._lastCssVars = cssVars;
          span.style.cssText = cssVars;
        }
        return;
      }

      if (wrap._thumbSpan) {
        wrap._thumbSpan.remove();
        wrap._thumbSpan = null;
      }
      const thumbUrl = this.getToolThumbnailDataUrl(item);
      if (thumbUrl) {
        let img = wrap._thumbImg;
        if (!img) {
          img = document.createElement("img");
          img.className = "palette-thumb pixelated";
          img.decoding = "async";
          img.alt = item.name;
          wrap._thumbImg = img;
          wrap.insertBefore(img, wrap.firstChild);
        }
        if (img._lastSrc !== thumbUrl) {
          img._lastSrc = thumbUrl;
          img.src = thumbUrl;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 6. Multi-Row Catalog Dock, Sub-Filters, Quick Search & Tool Selection
    // -------------------------------------------------------------------------
    getCatalog() {
      return PALETTE_TABS;
    }

    getFilteredItems(tabObj) {
      const tab =
        (tabObj && Array.isArray(tabObj.items) ? tabObj : null) ||
        PALETTE_TABS.find((t) => t.id === (tabObj || this.activeTab)) ||
        PALETTE_TABS[0];
      if (this.searchQuery.length > 0) {
        return ALL_CATALOG_ITEMS.filter((it) => it._searchText.includes(this.searchQuery));
      }
      if (this.activeSubFilter && this.activeSubFilter !== "all") {
        return tab.items.filter((it) => it.sub === this.activeSubFilter);
      }
      return tab.items;
    }

    getActiveRotationToken(tool) {
      if (tool && tool.rotMode === "axis") return this.axisRotation.toUpperCase();
      if (tool && tool.rotMode === "cardinal") return this.cardinalRotation.toUpperCase();
      if (tool && tool.rotMode === "corner") return this.cornerRotation.toUpperCase();
      return this.dirRotation.toUpperCase();
    }

    _syncDockSafeClearance() {
      // Guarantees 0px overlap between `#hud-bottom-dock`, `#mobile-tool-rail`, `#inspector-card`, and `#guide-drawer`!
      let safeBottomPx = 214;
      if (this._isMobile) {
        if (this.dockCollapsed) {
          safeBottomPx = 68;
        } else {
          safeBottomPx = this._tooltipHidden ? 204 : 234;
        }
      } else if (this.dockCollapsed) {
        safeBottomPx = 56;
      } else if (this.dockRows === 1) {
        safeBottomPx = 148;
      } else if (this.dockRows === 3) {
        safeBottomPx = 278;
      } else {
        safeBottomPx = 214;
      }
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.style.setProperty("--dock-safe-bottom", `${safeBottomPx}px`);
      }
      this._invalidateLayoutRects();
    }

    setDockCollapsed(collapsed) {
      const next = Boolean(collapsed);
      this.dockCollapsed = next;
      if (this.dom.buildDock) {
        this.dom.buildDock.classList.toggle("collapsed", next);
      }
      if (this.dom.dockCollapseGlyph) {
        this.dom.dockCollapseGlyph.innerHTML = next ? "&#9652;" : "&#9662;";
      }
      if (next && this._mobSearchOpen) {
        this.setMobileSearchOpen(false);
      }
      this._syncDockSafeClearance();
      this._updateTrayScrollArrows();
      return this.dockCollapsed;
    }

    _syncMobileBackdrop() {
      if (!this.dom.mobileSheetBackdrop) return;
      const show = Boolean(this._isMobile && (this.mobileMenuOpen || this.guideOpen));
      this.dom.mobileSheetBackdrop.classList.toggle("hidden", !show);
    }

    toggleMobileMenu(forceBool) {
      this.mobileMenuOpen =
        typeof forceBool === "boolean" ? forceBool : !this.mobileMenuOpen;
      if (this.mobileMenuOpen) {
        if (this.guideOpen) {
          this.guideOpen = false;
          if (this.dom.guideDrawer) {
            this.dom.guideDrawer.classList.remove("open");
            this.dom.guideDrawer.setAttribute("aria-hidden", "true");
          }
          if (this.dom.btnGuideToggle) this.dom.btnGuideToggle.classList.remove("active");
        }
        if (this.inspectedTarget) {
          this.closeInspector();
        }
      }
      if (this.dom.mobileMenuSheet) {
        this.dom.mobileMenuSheet.classList.toggle("open", this.mobileMenuOpen);
        this.dom.mobileMenuSheet.setAttribute(
          "aria-hidden",
          this.mobileMenuOpen ? "false" : "true"
        );
      }
      if (this.dom.btnMobileMenu) {
        this.dom.btnMobileMenu.classList.toggle("active", this.mobileMenuOpen);
        this.dom.btnMobileMenu.setAttribute(
          "aria-expanded",
          this.mobileMenuOpen ? "true" : "false"
        );
      }
      this._syncMobileBackdrop();
      return this.mobileMenuOpen;
    }

    setMobileSearchOpen(open) {
      const want = Boolean(open);
      this._mobSearchOpen = want;
      if (this.dom.dockSubbar) {
        this.dom.dockSubbar.classList.toggle("mob-search-open", want);
      }
      if (this.dom.btnMobSearchToggle) {
        this.dom.btnMobSearchToggle.classList.toggle("active", want);
      }
      if (!want && this.searchQuery.length > 0) {
        this.setSearchQuery("");
      }
      if (want && this.dom.catalogSearch) {
        this.dom.catalogSearch.focus();
      }
      return want;
    }

    _syncMobileBreakpoint() {
      if (typeof window === "undefined") return;
      const nowMobile = window.innerWidth <= 768;
      if (nowMobile === this._isMobile) return;
      this._isMobile = nowMobile;
      if (nowMobile) {
        this.setDockRows(1);
        this.setDockCollapsed(true);
      } else {
        if (this.mobileMenuOpen) this.toggleMobileMenu(false);
        if (this._mobSearchOpen) this.setMobileSearchOpen(false);
        this._syncMobileBackdrop();
        this.setDockRows(2);
        this.renderMinimap(true);
      }
    }

    setDockRows(rows) {
      const n = Number(rows);
      if (![1, 2, 3].includes(n)) return this.dockRows;
      this.dockRows = n;
      if (this.dom.buildDock) {
        this.dom.buildDock.classList.remove("rows-1", "rows-2", "rows-3");
        this.dom.buildDock.classList.add(`rows-${n}`);
        if (this.dockCollapsed) {
          this.dockCollapsed = false;
          this.dom.buildDock.classList.remove("collapsed");
          if (this.dom.dockCollapseGlyph) this.dom.dockCollapseGlyph.innerHTML = "&#9662;";
        }
      }
      this._setText(this.dom.gridExpandLabel, `${n}-Row`);
      this._syncDockSafeClearance();
      this._updateTrayScrollArrows();
      return this.dockRows;
    }

    cycleDockRows() {
      // Cycles 2-Row (default) -> 3-Row (expanded catalog) -> 1-Row (slim strip) -> 2-Row
      const next = this.dockRows === 2 ? 3 : this.dockRows === 3 ? 1 : 2;
      return this.setDockRows(next);
    }

    _resetTrayScrollIfNeeded() {
      if (this._trayScrolled && this.dom.dockTray) {
        this._trayScrolled = false;
        this.dom.dockTray.scrollTop = 0;
        this.dom.dockTray.scrollLeft = 0;
      }
    }

    selectSubFilter(subId) {
      const nextSub = String(subId || "all");
      if (this.activeSubFilter === nextSub && this._cardElsById.size > 0) {
        return this.activeSubFilter;
      }
      this.activeSubFilter = nextSub;
      this.renderPaletteTray();
      this._resetTrayScrollIfNeeded();
      return this.activeSubFilter;
    }

    setSearchQuery(query) {
      const q = String(query || "");
      const nextSearch = q.trim().toLowerCase();
      if (this.dom.catalogSearch && this.dom.catalogSearch.value !== q) {
        this.dom.catalogSearch.value = q;
      }
      if (this.dom.btnSearchClear) {
        this.dom.btnSearchClear.classList.toggle("hidden", nextSearch.length === 0);
      }
      if (this.searchQuery === nextSearch && this._cardElsById.size > 0) {
        return this.searchQuery;
      }
      this.searchQuery = nextSearch;
      this.renderPaletteTray();
      this._resetTrayScrollIfNeeded();
      return this.searchQuery;
    }

    _ensureSubFilterChips(tab) {
      let list = this._subFilterBtnsByTab.get(tab.id);
      if (list) return list;
      const filters = (tab && tab.subFilters) || [{ id: "all", label: "All" }];
      list = [];
      for (let i = 0; i < filters.length; i++) {
        const sf = filters[i];
        const count =
          sf.id === "all"
            ? tab.items.length
            : tab.items.filter((it) => it.sub === sf.id).length;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "subfilter-chip";
        btn.dataset.sub = sf.id;
        const lblSpan = document.createElement("span");
        lblSpan.textContent = sf.label;
        const cntSpan = document.createElement("span");
        cntSpan.className = "subfilter-count";
        cntSpan.textContent = String(count);
        btn.appendChild(lblSpan);
        btn.appendChild(cntSpan);
        list.push({ id: sf.id, btn, isActive: false });
      }
      this._subFilterBtnsByTab.set(tab.id, list);
      return list;
    }

    _renderSubFilterChips(tab, searchMatchCount = -1) {
      if (!this.dom.dockSubfilters) return;

      if (this.searchQuery.length > 0) {
        const matchCount =
          searchMatchCount >= 0
            ? searchMatchCount
            : ALL_CATALOG_ITEMS.filter((it) => it._searchText.includes(this.searchQuery)).length;
        if (!this._searchChipRec) {
          const pill = document.createElement("button");
          pill.type = "button";
          pill.className = "subfilter-chip active";
          const lblSpan = document.createElement("span");
          lblSpan.textContent = "Search All 5 Tabs";
          const cntSpan = document.createElement("span");
          cntSpan.className = "subfilter-count";
          pill.appendChild(lblSpan);
          pill.appendChild(cntSpan);
          pill.addEventListener("click", () => this.setSearchQuery(""));
          this._searchChipRec = { pill, countEl: cntSpan };
        }
        this._setText(this._searchChipRec.countEl, matchCount);
        if (this._renderedSubTabId !== "__search__") {
          this._renderedSubTabId = "__search__";
          this.dom.dockSubfilters.replaceChildren(this._searchChipRec.pill);
        }
        return;
      }

      const chips = this._ensureSubFilterChips(tab);
      let validSub = false;
      for (let i = 0; i < chips.length; i++) {
        if (chips[i].id === this.activeSubFilter) {
          validSub = true;
          break;
        }
      }
      if (!validSub) {
        this.activeSubFilter = "all";
      }

      const needMount = this._renderedSubTabId !== tab.id;
      const frag = needMount ? document.createDocumentFragment() : null;
      for (let i = 0; i < chips.length; i++) {
        const chip = chips[i];
        const wantActive = chip.id === this.activeSubFilter;
        if (chip.isActive !== wantActive) {
          chip.isActive = wantActive;
          chip.btn.classList.toggle("active", wantActive);
        }
        if (frag) frag.appendChild(chip.btn);
      }
      if (needMount) {
        this._renderedSubTabId = tab.id;
        this.dom.dockSubfilters.replaceChildren(frag);
      }
    }

    _ensureMasterCard(item) {
      let rec = this._masterCardById.get(item.id);
      if (rec) return rec;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-card";
      btn.style.contain = "layout style";
      btn.dataset.toolId = item.id;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("aria-pressed", "false");

      let rotBadgeEl = null;
      let initRotText = "";
      if (item.isLiftDrag) {
        const dragTag = document.createElement("span");
        dragTag.className = "palette-drag-tag";
        dragTag.textContent = "DRAG";
        btn.appendChild(dragTag);
      } else if (item.rotMode) {
        rotBadgeEl = document.createElement("span");
        rotBadgeEl.className = "palette-rot-tag";
        initRotText = "R";
        this._setText(rotBadgeEl, initRotText);
        btn.appendChild(rotBadgeEl);
      }

      const costBadge = document.createElement("span");
      costBadge.className = "palette-cost-badge";
      const paidCostText = `$${item.cost}`;
      this._setText(costBadge, paidCostText);
      btn.appendChild(costBadge);

      const wrap = document.createElement("div");
      wrap.className = "palette-thumb-wrap";
      this._applyToolThumb(wrap, item);
      if (item.badgeText) {
        const badge = document.createElement("span");
        badge.className = "palette-sculpt-badge";
        badge.textContent = item.badgeText;
        if (item.badgeColor) {
          badge.style.color = item.badgeColor;
          badge.style.borderColor = item.badgeColor;
        }
        wrap.appendChild(badge);
      }
      btn.appendChild(wrap);

      const lbl = document.createElement("span");
      lbl.className = "palette-label";
      lbl.textContent = item.shortLabel || item.name;
      btn.appendChild(lbl);

      rec = {
        item,
        card: btn,
        thumbWrap: wrap,
        rotBadgeEl,
        costBadgeEl: costBadge,
        paidCostText,
        isActive: false,
        unaffordable: false,
        costText: paidCostText,
        rotText: initRotText,
        renderedRotToken: item.rotMode ? this.getActiveRotationToken(item) : "",
        thumbFnRef: (this.atlas && this.atlas.getThumbSprite) || null,
      };
      this._masterCardById.set(item.id, rec);
      return rec;
    }

    _prewarmCatalogDom() {
      if (this._catalogPrewarmed) return;
      this._catalogPrewarmed = true;
      for (let i = 0; i < PALETTE_TABS.length; i++) {
        this._ensureSubFilterChips(PALETTE_TABS[i]);
      }
      for (let i = 0; i < ALL_CATALOG_ITEMS.length; i++) {
        this._ensureMasterCard(ALL_CATALOG_ITEMS[i]);
      }
    }

    renderPaletteTray() {
      if (!this.dom.dockTray) return;
      const tab = PALETTE_TABS.find((t) => t.id === this.activeTab) || PALETTE_TABS[0];

      // Sync active tab pill & exact per-tab item count badges (diffed)
      if (this.dom.dockTabs) {
        if (!this._tabBtns) {
          this._tabBtns = Array.from(this.dom.dockTabs.querySelectorAll(".dock-tab"));
        }
        for (let i = 0; i < this._tabBtns.length; i++) {
          const btn = this._tabBtns[i];
          const tDef =
            btn._tabDef ||
            (btn._tabDef = PALETTE_TABS.find((t) => t.id === btn.dataset.tab) || null);
          const wantActive = this.searchQuery.length === 0 && btn.dataset.tab === tab.id;
          if (btn._isActive !== wantActive) {
            btn._isActive = wantActive;
            btn.classList.toggle("active", wantActive);
          }
          const countEl = btn._countEl || (btn._countEl = btn.querySelector(".tab-count"));
          if (countEl && tDef) {
            this._setText(countEl, tDef.items.length);
          }
        }
      }

      let searchItems = null;
      if (this.searchQuery.length > 0) {
        searchItems = ALL_CATALOG_ITEMS.filter((it) => it._searchText.includes(this.searchQuery));
      }
      this._renderSubFilterChips(tab, searchItems ? searchItems.length : -1);

      let visibleItems;
      if (searchItems) {
        visibleItems = searchItems;
      } else if (this.activeSubFilter && this.activeSubFilter !== "all") {
        visibleItems = tab.items.filter((it) => it.sub === this.activeSubFilter);
      } else {
        visibleItems = tab.items;
      }

      const isSandbox = this._isSandbox();
      const cashRounded = Math.max(0, Math.round(this._getCash()));
      this._lastAffordCash = cashRounded;
      this._lastAffordSandbox = isSandbox;
      this._cardElsById.clear();
      this._hoveredCardId = null;

      if (visibleItems.length === 0) {
        if (!this._emptyTrayEl) {
          const empty = document.createElement("div");
          empty.className = "palette-empty-msg";
          this._emptyTrayEl = empty;
        }
        this._setText(
          this._emptyTrayEl,
          `No alpine items match "${this.searchQuery}" across 174 varieties.`
        );
        this.dom.dockTray.replaceChildren(this._emptyTrayEl);
        this._updateTrayScrollArrows();
        return;
      }

      const frag = document.createDocumentFragment();
      const activeId = this.activeTool ? this.activeTool.id : null;
      const curThumbFn = (this.atlas && this.atlas.getThumbSprite) || null;

      for (let i = 0; i < visibleItems.length; i++) {
        const item = visibleItems[i];
        const rec = this._ensureMasterCard(item);

        const isActive = activeId === item.id;
        if (rec.isActive !== isActive) {
          rec.isActive = isActive;
          rec.card.classList.toggle("active", isActive);
          rec.card.setAttribute("aria-selected", isActive ? "true" : "false");
          rec.card.setAttribute("aria-pressed", isActive ? "true" : "false");
        }

        const unaffordable = !isSandbox && item.cost > cashRounded;
        if (rec.unaffordable !== unaffordable) {
          rec.unaffordable = unaffordable;
          rec.card.classList.toggle("unaffordable", unaffordable);
        }

        const wantCost = isSandbox ? "FREE" : rec.paidCostText;
        if (rec.costText !== wantCost) {
          rec.costText = wantCost;
          this._setText(rec.costBadgeEl, wantCost);
        }

        if (item.rotMode) {
          const curRotTok = this.getActiveRotationToken(item);
          const wantRot = isActive ? curRotTok : "R";
          if (rec.rotBadgeEl && rec.rotText !== wantRot) {
            rec.rotText = wantRot;
            this._setText(rec.rotBadgeEl, wantRot);
          }
          if (rec.thumbFnRef !== curThumbFn || rec.renderedRotToken !== curRotTok) {
            this._applyToolThumb(rec.thumbWrap, item);
            rec.thumbFnRef = curThumbFn;
            rec.renderedRotToken = curRotTok;
          }
        } else if (rec.thumbFnRef !== curThumbFn) {
          this._applyToolThumb(rec.thumbWrap, item);
          rec.thumbFnRef = curThumbFn;
        }

        this._cardElsById.set(item.id, rec);
        frag.appendChild(rec.card);
      }

      this.dom.dockTray.replaceChildren(frag);
      this._updateTrayScrollArrows();
    }

    _syncActiveCardSelection(prevId, nextId, rotChanged = false) {
      if (prevId && prevId !== nextId) {
        const prevEntry = this._cardElsById.get(prevId) || this._masterCardById.get(prevId);
        if (prevEntry && prevEntry.isActive) {
          prevEntry.isActive = false;
          prevEntry.card.classList.remove("active");
          prevEntry.card.setAttribute("aria-selected", "false");
          prevEntry.card.setAttribute("aria-pressed", "false");
          if (prevEntry.rotBadgeEl && prevEntry.rotText !== "R") {
            prevEntry.rotText = "R";
            this._setText(prevEntry.rotBadgeEl, "R");
          }
        }
      }
      if (nextId) {
        const nextEntry = this._cardElsById.get(nextId);
        if (nextEntry) {
          if (!nextEntry.isActive) {
            nextEntry.isActive = true;
            nextEntry.card.classList.add("active");
            nextEntry.card.setAttribute("aria-selected", "true");
            nextEntry.card.setAttribute("aria-pressed", "true");
          }
          if (nextEntry.item.rotMode) {
            const tok = this.getActiveRotationToken(nextEntry.item);
            if (nextEntry.rotBadgeEl && nextEntry.rotText !== tok) {
              nextEntry.rotText = tok;
              this._setText(nextEntry.rotBadgeEl, tok);
            }
            const curThumbFn = (this.atlas && this.atlas.getThumbSprite) || null;
            if (
              rotChanged ||
              nextEntry.renderedRotToken !== tok ||
              nextEntry.thumbFnRef !== curThumbFn
            ) {
              this._applyToolThumb(nextEntry.thumbWrap, nextEntry.item);
              nextEntry.renderedRotToken = tok;
              nextEntry.thumbFnRef = curThumbFn;
            }
          }
        }
      }
    }

    _syncActiveRotatedCard() {
      if (this.activeTool && this.activeTool.rotMode) {
        const entry =
          this._cardElsById.get(this.activeTool.id) ||
          this._masterCardById.get(this.activeTool.id);
        if (entry) {
          const tok = this.getActiveRotationToken(this.activeTool);
          if (entry.isActive && entry.rotBadgeEl && entry.rotText !== tok) {
            entry.rotText = tok;
            this._setText(entry.rotBadgeEl, tok);
          }
          const curThumbFn = (this.atlas && this.atlas.getThumbSprite) || null;
          if (entry.renderedRotToken !== tok || entry.thumbFnRef !== curThumbFn) {
            this._applyToolThumb(entry.thumbWrap, this.activeTool);
            entry.renderedRotToken = tok;
            entry.thumbFnRef = curThumbFn;
          }
        }
      }
    }

    _updateTrayScrollArrows() {
      const tray = this.dom.dockTray;
      if (!tray) return;
      if (this.dockRows !== 1 || this.dockCollapsed) {
        if (this._trayArrowsVisible !== false) {
          this._trayArrowsVisible = false;
          if (this.dom.btnTrayLeft) this.dom.btnTrayLeft.classList.add("hidden");
          if (this.dom.btnTrayRight) this.dom.btnTrayRight.classList.add("hidden");
        }
        return;
      }
      if (this._scrollArrowRaf) return;
      this._scrollArrowRaf = requestAnimationFrame(() => {
        this._scrollArrowRaf = 0;
        if (this.dockRows !== 1 || this.dockCollapsed) {
          if (this._trayArrowsVisible !== false) {
            this._trayArrowsVisible = false;
            if (this.dom.btnTrayLeft) this.dom.btnTrayLeft.classList.add("hidden");
            if (this.dom.btnTrayRight) this.dom.btnTrayRight.classList.add("hidden");
          }
          return;
        }
        this._trayArrowsVisible = true;
        const canLeft = tray.scrollLeft > 6;
        const canRight = tray.scrollLeft + tray.clientWidth < tray.scrollWidth - 6;
        if (this.dom.btnTrayLeft) this.dom.btnTrayLeft.classList.toggle("hidden", !canLeft);
        if (this.dom.btnTrayRight) this.dom.btnTrayRight.classList.toggle("hidden", !canRight);
      });
    }

    showTooltip(item) {
      if (!item || !this.dom.paletteTooltip) return;
      const isSandbox = this._isSandbox();
      this._setText(this.dom.tooltipTitle, item.name);
      this._setText(
        this.dom.tooltipCost,
        item.cost > 0
          ? isSandbox
            ? "Free-Build"
            : item.isLiftDrag
            ? `$${item.cost}+ line`
            : item.paidCostText || `$${item.cost}`
          : "Tool"
      );
      this._setText(this.dom.tooltipDesc, item.desc || "");
      if (this._tooltipHidden) {
        this._tooltipHidden = false;
        this.dom.paletteTooltip.classList.remove("hidden");
        if (this._isMobile) this._syncDockSafeClearance();
      }
    }

    hideTooltip() {
      if (!this._tooltipHidden && this.dom.paletteTooltip) {
        this._tooltipHidden = true;
        this.dom.paletteTooltip.classList.add("hidden");
        if (this._isMobile) this._syncDockSafeClearance();
      }
    }

    selectTab(tabId) {
      const tab = PALETTE_TABS.find((t) => t.id === tabId);
      if (!tab) return false;

      // Mobile drawer UX: tapping the already-open active category medallion folds the 1-row dock!
      if (
        this._isMobile &&
        !this.dockCollapsed &&
        this.activeTab === tab.id &&
        this.searchQuery.length === 0
      ) {
        this.setDockCollapsed(true);
        return true;
      }

      const curThumbFn = (this.atlas && this.atlas.getThumbSprite) || null;
      const firstRec = tab.items.length > 0 ? this._cardElsById.get(tab.items[0].id) : null;
      const sameView =
        this.activeTab === tab.id &&
        this.activeSubFilter === "all" &&
        this.searchQuery.length === 0 &&
        this._cardElsById.size === tab.items.length &&
        Boolean(!firstRec || firstRec.thumbFnRef === curThumbFn);

      this.activeTab = tab.id;
      this.activeSubFilter = "all";
      if (this.searchQuery.length > 0) {
        this.searchQuery = "";
        if (this.dom.catalogSearch) this.dom.catalogSearch.value = "";
        if (this.dom.btnSearchClear) this.dom.btnSearchClear.classList.add("hidden");
      }
      if (this._isMobile && this._mobSearchOpen) {
        this.setMobileSearchOpen(false);
      }
      if (this.dockCollapsed) {
        this.setDockCollapsed(false);
      }
      if (!sameView) {
        this.renderPaletteTray();
      }
      this._resetTrayScrollIfNeeded();
      this.updateToolButtons();
      return true;
    }

    selectTool(toolId) {
      // Finish any in-progress stroke batch & cancel lift anchor when switching tools
      this._endStrokeBatch();
      this._cancelLiftAnchor();

      const prevId = this.activeTool ? this.activeTool.id : null;

      if (
        toolId === null ||
        toolId === undefined ||
        toolId === "" ||
        toolId === "none" ||
        toolId === "inspect" ||
        toolId === "pan"
      ) {
        this.activeTool = null;
        this._syncActiveCardSelection(prevId, null, false);
        this.hideTooltip();
        this.updateToolButtons();
        this._syncRendererGhost();
        return null;
      }

      const norm = String(toolId).trim();
      const prevDir = this.dirRotation;
      const prevAxis = this.axisRotation;
      const prevCard = this.cardinalRotation;
      const prevCorner = this.cornerRotation;

      // Sync explicit variant rotation token if caller passed e.g. `park_kicker_se` or `train_track_curve_nw`
      const rotMeta = VARIANT_ROT_LOOKUP.get(norm);
      if (rotMeta) {
        if (rotMeta.rotMode === "dir") this.dirRotation = rotMeta.rotKey;
        else if (rotMeta.rotMode === "axis") this.axisRotation = rotMeta.rotKey;
        else if (rotMeta.rotMode === "cardinal") this.cardinalRotation = rotMeta.rotKey;
        else if (rotMeta.rotMode === "corner") this.cornerRotation = rotMeta.rotKey;
      } else {
        if (norm.endsWith("_ew")) this.axisRotation = "ew";
        else if (norm.endsWith("_ns")) this.axisRotation = "ns";
        else if (norm.endsWith("_se")) this.dirRotation = "se";
        else if (norm.endsWith("_sw")) this.dirRotation = "sw";
      }

      const rotChanged =
        prevDir !== this.dirRotation ||
        prevAxis !== this.axisRotation ||
        prevCard !== this.cardinalRotation ||
        prevCorner !== this.cornerRotation;

      if (norm === "bulldoze" || norm === "clear" || norm === "demolish") {
        this.activeTool = SPECIAL_TOOLS.bulldoze;
        this._syncActiveCardSelection(prevId, null, false);
        this.showTooltip(this.activeTool);
        this.updateToolButtons();
        this._syncRendererGhost();
        return this.activeTool;
      }

      const found = TOOL_BY_ID.get(norm);
      if (!found) return null;

      let needTrayRebuild = false;
      const targetTab = TAB_OF_TOOL.get(norm) || found.tabId;
      if (targetTab && targetTab !== this.activeTab) {
        this.activeTab = targetTab;
        this.activeSubFilter = "all";
        needTrayRebuild = true;
      } else if (
        this.activeSubFilter !== "all" &&
        found.sub &&
        found.sub !== this.activeSubFilter
      ) {
        this.activeSubFilter = "all";
        needTrayRebuild = true;
      } else if (!this._cardElsById.has(found.id)) {
        needTrayRebuild = true;
      }

      // Keep bottom dock OPEN when selecting an item (both desktop and mobile per spec)
      if (this.dockCollapsed) {
        this.setDockCollapsed(false);
      }

      this.activeTool = found;
      if (needTrayRebuild) {
        this.renderPaletteTray();
      } else {
        this._syncActiveCardSelection(prevId, found.id, rotChanged);
      }
      this.showTooltip(found);
      this.updateToolButtons();
      this._syncRendererGhost();
      return found;
    }

    rotateTool() {
      this.dirRotation = this.dirRotation === "sw" ? "se" : "sw";
      this.axisRotation = this.axisRotation === "ns" ? "ew" : "ns";
      const cardOrder = ["n", "e", "s", "w"];
      this.cardinalRotation = cardOrder[(cardOrder.indexOf(this.cardinalRotation) + 1) % 4];
      const cornerOrder = ["ne", "se", "sw", "nw"];
      this.cornerRotation = cornerOrder[(cornerOrder.indexOf(this.cornerRotation) + 1) % 4];

      if (this.audio && typeof this.audio.playClick === "function") {
        const now = performance.now();
        if (now - this._lastRotateSfxTime > 45) {
          this._lastRotateSfxTime = now;
          this.audio.playClick();
        }
      }
      this._syncActiveRotatedCard();
      this.updateToolButtons();
      this._syncRendererGhost();
      return this.getActiveRotationToken(this.activeTool);
    }

    setRotation(rot) {
      const s = String(rot).toLowerCase();
      if (s === "0" || s === "sw" || s === "ns" || s === "n") {
        this.dirRotation = "sw";
        this.axisRotation = "ns";
        if (s === "n") this.cardinalRotation = "n";
        if (s === "sw") this.cornerRotation = "sw";
      } else if (s === "1" || s === "se" || s === "ew" || s === "e") {
        this.dirRotation = "se";
        this.axisRotation = "ew";
        if (s === "e") this.cardinalRotation = "e";
        if (s === "se") this.cornerRotation = "se";
      } else if (s === "s" || s === "w") {
        this.cardinalRotation = s;
      } else if (s === "ne" || s === "nw") {
        this.cornerRotation = s;
      }
      this._syncActiveRotatedCard();
      this.updateToolButtons();
      this._syncRendererGhost();
    }

    updateToolButtons() {
      const isInspect = this.activeTool === null;
      const isBulldoze = Boolean(this.activeTool && this.activeTool.id === "bulldoze");
      const canRotate = Boolean(this.activeTool && this.activeTool.rotMode);
      const rotTok = this.getActiveRotationToken(this.activeTool);

      if (this.dom.btnInspect && this._lastBtnInspect !== isInspect) {
        this._lastBtnInspect = isInspect;
        this.dom.btnInspect.classList.toggle("active", isInspect);
        if (this.dom.mobBtnInspect) {
          this.dom.mobBtnInspect.classList.toggle("hidden", isInspect);
        }
      }
      if (this.dom.btnBulldoze && this._lastBtnBulldoze !== isBulldoze) {
        this._lastBtnBulldoze = isBulldoze;
        this.dom.btnBulldoze.classList.toggle("active", isBulldoze);
        if (this.dom.mobBtnBulldoze) {
          this.dom.mobBtnBulldoze.classList.toggle("active", isBulldoze);
        }
      }
      if (this.dom.mobBtnRotate) {
        this.dom.mobBtnRotate.classList.toggle("hidden", !canRotate);
      }
      this._setText(this.dom.rotateBadge, rotTok);
      this._setText(this.dom.mobRotateBadge, rotTok);

      if (this.canvas) {
        const panCur = Boolean(this.isPanning || this.spaceHeld);
        const bullCur = Boolean(!this.isPanning && isBulldoze);
        const buildCur = Boolean(!this.isPanning && !isInspect && !isBulldoze);
        const mask = (panCur ? 1 : 0) | (bullCur ? 2 : 0) | (buildCur ? 4 : 0);
        if (this._lastCursorMask !== mask) {
          this._lastCursorMask = mask;
          this.canvas.classList.toggle("cursor-panning", panCur);
          this.canvas.classList.toggle("cursor-bulldoze", bullCur);
          this.canvas.classList.toggle("cursor-build", buildCur);
        }
      }
    }

    // -------------------------------------------------------------------------
    // 7. Economy Helpers & World Mutation Dispatch (Sculpt, Paint, Build, Lift)
    // -------------------------------------------------------------------------
    _isSandbox() {
      return Boolean(this.sim && (this.sim.sandboxMode || this.sim.freeBuild));
    }

    _getCash() {
      if (!this.sim) return 4500;
      if (typeof this.sim.cash === "number") return this.sim.cash;
      if (typeof this.sim.ecoGrants === "number") return this.sim.ecoGrants;
      return 4500;
    }

    _canAfford(cost) {
      if (this._isSandbox() || cost <= 0 || !this.sim) return true;
      if (typeof this.sim.canAfford === "function") return this.sim.canAfford(cost);
      return this._getCash() >= cost;
    }

    _deductIfUnchanged(cost, cashBefore, label) {
      if (this._isSandbox() || cost <= 0 || !this.sim) return;
      if (this._getCash() !== cashBefore) return;
      if (typeof this.sim.spend === "function") {
        this.sim.spend(cost, label);
      } else if (typeof this.sim.cash === "number") {
        this.sim.cash = Math.max(0, this.sim.cash - cost);
      }
    }

    _cancelLiftAnchor() {
      this.liftAnchor = null;
      this.liftDragging = false;
      if (this._liftBannerVisible && this.dom.liftDragBanner) {
        this._liftBannerVisible = false;
        this.dom.liftDragBanner.classList.add("hidden");
        this.dom.liftDragBanner.classList.remove("invalid");
      }
    }

    _updateLiftDragPreview(r2, c2) {
      if (!this.liftAnchor || !this.activeTool || this.activeTool.kind !== "lift" || !this.world) {
        return null;
      }
      const { r: r1, c: c1 } = this.liftAnchor;
      const liftType = this.activeTool.liftType || this.activeTool.id;
      const meta = LIFT_META[liftType] || { minLen: 3, shortName: liftType };
      let preview = null;
      if (typeof this.world.previewLiftLine === "function") {
        try {
          preview = this.world.previewLiftLine(r1, c1, r2, c2, liftType);
        } catch (_) {}
      }

      const len =
        (preview &&
          (preview.lengthCells !== undefined
            ? preview.lengthCells + 1
            : preview.length || (Array.isArray(preview.cells) && preview.cells.length))) ||
        Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
      const estCost =
        preview && typeof preview.cost === "number"
          ? preview.cost
          : this.activeTool.cost + Math.max(0, len - meta.minLen) * 55;
      const isValid = preview ? preview.valid !== false : len >= meta.minLen;

      if (this.dom.liftDragBanner && !this.thumbMode) {
        const label = this.activeTool.shortLabel || meta.shortName || liftType;
        const costStr = this._isSandbox() ? "Free" : `$${estCost}`;
        if (!isValid) {
          this.dom.liftDragBanner.textContent = `${label}: Drag ≥${meta.minLen} tiles along N-S or E-W (${r1},${c1}) → (${r2},${c2}) · [Esc] cancel`;
          this.dom.liftDragBanner.classList.add("invalid");
        } else {
          this.dom.liftDragBanner.textContent = `${label}: (${r1},${c1}) → (${r2},${c2}) · ${len} tiles · ${costStr} · Release/Click to build`;
          this.dom.liftDragBanner.classList.remove("invalid");
        }
        this._liftBannerVisible = true;
        this.dom.liftDragBanner.classList.remove("hidden");
      }

      if (this.renderer) {
        const ghost = {
          tool: "lift",
          kind: "lift",
          itemId: liftType,
          liftType,
          r: r2,
          c: c2,
          r1,
          c1,
          r2,
          c2,
          valid: isValid && this._canAfford(estCost),
          preview,
          liftPreview: preview,
          cells: preview && Array.isArray(preview.cells) ? preview.cells : undefined,
        };
        this.renderer.ghostPreview = ghost;
        if (typeof this.renderer.setGhostPreview === "function") {
          this.renderer.setGhostPreview(ghost);
        }
      }
      return preview;
    }

    buildLift(r1, c1, r2, c2, liftType = "chairlift") {
      if (!this.world || typeof this.world.buildLiftLine !== "function") return false;
      const tool = TOOL_BY_ID.get(liftType) || { cost: 720, name: liftType };
      const meta = LIFT_META[liftType] || { minLen: 3 };
      let preview = null;
      if (typeof this.world.previewLiftLine === "function") {
        try {
          preview = this.world.previewLiftLine(r1, c1, r2, c2, liftType);
        } catch (_) {}
      }
      const len =
        (preview &&
          (preview.lengthCells !== undefined
            ? preview.lengthCells + 1
            : preview.length || (Array.isArray(preview.cells) && preview.cells.length))) ||
        Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
      const cost =
        preview && typeof preview.cost === "number"
          ? preview.cost
          : (tool.cost || 600) + Math.max(0, len - meta.minLen) * 55;

      if (!this._canAfford(cost)) {
        this.showToast({
          eyebrow: "Insufficient Treasury",
          message: `Need $${cost} to construct ${tool.name || liftType}.`,
        });
        return false;
      }

      const cashBefore = this._getCash();
      const res = this.world.buildLiftLine(r1, c1, r2, c2, liftType);
      const ok = Boolean(res && (typeof res !== "object" || res.ok !== false));
      if (ok) {
        this._deductIfUnchanged(cost, cashBefore, tool.name || liftType);
        if (this.audio) {
          if (typeof this.audio.playBuild === "function") this.audio.playBuild();
          else if (typeof this.audio.playCash === "function") this.audio.playCash();
          else if (typeof this.audio.playClick === "function") this.audio.playClick();
        }
        this._notifyWorldMutated();
      } else {
        this.showToast({
          eyebrow: "Lift Alignment",
          message: `Drag at least ${meta.minLen} clear tiles along N-S or E-W from Base to Upper Station.`,
        });
      }
      return ok;
    }

    _getRotIndex(tool) {
      if (!tool || !tool.rotMode) return 0;
      if (tool.rotMode === "axis") return this.axisRotation === "ew" ? 1 : 0;
      if (tool.rotMode === "dir") return this.dirRotation === "se" ? 1 : 0;
      if (tool.rotMode === "cardinal") {
        return Math.max(0, ["n", "e", "s", "w"].indexOf(this.cardinalRotation));
      }
      if (tool.rotMode === "corner") {
        return Math.max(0, ["ne", "se", "sw", "nw"].indexOf(this.cornerRotation));
      }
      return 0;
    }

    _beginStrokeBatch() {
      if (this._inStrokeBatch || !this.world) return;
      if (typeof this.world.beginBatch === "function") {
        this.world.beginBatch();
        this._inStrokeBatch = true;
      }
    }

    _endStrokeBatch() {
      if (this._inStrokeBatch) {
        this._inStrokeBatch = false;
        if (this.world && typeof this.world.endBatch === "function") {
          this.world.endBatch();
        }
      }
      if (this._hudDirty) {
        this._hudDirty = false;
        this.refreshUI(true, false);
      }
    }

    applyToolAt(r, c, opts = {}) {
      if (!this.world || !this.activeTool) return false;
      if (typeof this.world.inBounds === "function" && !this.world.inBounds(r, c)) return false;

      const tool = this.activeTool;
      if (tool.kind === "lift") {
        return false; // handled via drag/2-click buildLift
      }

      const cost = tool.cost || 0;
      if (tool.kind !== "bulldoze" && !this._canAfford(cost)) {
        if (!opts.isDrag) {
          this.showToast({
            eyebrow: "Insufficient Treasury",
            message: `Need $${cost} for ${tool.name} (toggle Free-Build for unlimited budget).`,
          });
        }
        return false;
      }

      const cashBefore = this._getCash();
      const rotIndex = this._getRotIndex(tool);
      let ok = false;

      if (tool.kind === "bulldoze") {
        if (typeof this.world.bulldoze === "function") ok = Boolean(this.world.bulldoze(r, c));
        else if (typeof this.world.clearCell === "function") ok = Boolean(this.world.clearCell(r, c));
        else if (typeof this.world.removeStructure === "function") {
          ok = Boolean(this.world.removeStructure(r, c));
        }
      } else if (tool.kind === "sculpt") {
        const mode = tool.sculptMode || "raise";
        const lvl = typeof opts.targetLevel === "number" ? opts.targetLevel : this.strokeTargetLevel;
        if (mode === "raise") {
          if (typeof this.world.raiseTerrain === "function") ok = Boolean(this.world.raiseTerrain(r, c));
          else if (typeof this.world.sculpt === "function") ok = Boolean(this.world.sculpt(r, c, "raise"));
        } else if (mode === "lower") {
          if (typeof this.world.lowerTerrain === "function") ok = Boolean(this.world.lowerTerrain(r, c));
          else if (typeof this.world.sculpt === "function") ok = Boolean(this.world.sculpt(r, c, "lower"));
        } else if (mode === "level") {
          if (typeof this.world.levelTerrain === "function") {
            ok = Boolean(this.world.levelTerrain(r, c, lvl));
          } else if (typeof this.world.sculpt === "function") {
            ok = Boolean(this.world.sculpt(r, c, "level", lvl));
          }
        } else {
          // Multi-tile brushes: `sculpt_matterhorn_peak`, `sculpt_glacial_bowl`, `sculpt_cliff_balcony`,
          // `raise_3x3`, `lower_3x3`, `level_3x3`, `smooth`, `corridor`
          if (typeof this.world.sculpt === "function") {
            ok = Boolean(this.world.sculpt(r, c, mode, lvl));
            if (!ok && mode.startsWith("sculpt_")) {
              ok = Boolean(this.world.sculpt(r, c, mode.slice(7), lvl));
            }
          }
          if (!ok && typeof this.world.sculptBrush === "function") {
            const rad = typeof tool.radius === "number" ? tool.radius : 1;
            ok = Boolean(this.world.sculptBrush(r, c, mode, rad, lvl));
          }
          if (!ok && typeof this.world.sculptAt === "function") {
            ok = Boolean(this.world.sculptAt(r, c, mode, lvl));
          }
        }
      } else if (tool.kind === "surface") {
        const surf = tool.surfaceId || tool.id;
        if (typeof this.world.paintSurface === "function") ok = Boolean(this.world.paintSurface(r, c, surf));
        else if (typeof this.world.setSurface === "function") ok = Boolean(this.world.setSurface(r, c, surf));
        else if (typeof this.world.paintBiome === "function") ok = Boolean(this.world.paintBiome(r, c, surf));
      } else if (tool.kind === "water") {
        const wid = tool.waterId || tool.id;
        if (typeof this.world.paintWater === "function") ok = Boolean(this.world.paintWater(r, c, wid));
        else if (typeof this.world.setWater === "function") ok = Boolean(this.world.setWater(r, c, wid));
      } else if (tool.kind === "flora") {
        const concreteId = this.getConcreteToolId(tool, r, c);
        if (typeof this.world.placeFlora === "function") {
          ok = Boolean(this.world.placeFlora(r, c, concreteId, rotIndex));
        }
        if (!ok && typeof this.world.placeStructure === "function") {
          ok = Boolean(this.world.placeStructure(r, c, concreteId, rotIndex));
        }
        if (!ok && typeof this.world.placeAmenity === "function") {
          ok = Boolean(this.world.placeAmenity(r, c, concreteId, rotIndex));
        }
        if (!ok && typeof this.world.placeItem === "function") {
          ok = Boolean(this.world.placeItem(r, c, concreteId, rotIndex));
        }
      } else if (tool.kind === "amenity") {
        const concreteId =
          tool.id === "town_walkway" ? "town_walkway" : this.getConcreteToolId(tool, r, c);
        if (typeof this.world.placeAmenity === "function") {
          ok = Boolean(this.world.placeAmenity(r, c, concreteId, rotIndex));
          if (!ok && concreteId !== tool.id) {
            ok = Boolean(this.world.placeAmenity(r, c, tool.id, rotIndex));
          }
        }
        if (!ok && typeof this.world.placeStructure === "function") {
          ok = Boolean(this.world.placeStructure(r, c, concreteId, rotIndex));
          if (!ok && concreteId !== tool.id) {
            ok = Boolean(this.world.placeStructure(r, c, tool.id, rotIndex));
          }
        }
        if (!ok && typeof this.world.placeFlora === "function") {
          ok = Boolean(this.world.placeFlora(r, c, concreteId, rotIndex));
        }
        if (!ok && typeof this.world.placeItem === "function") {
          ok = Boolean(this.world.placeItem(r, c, concreteId, rotIndex));
        }
      } else if (tool.kind === "structure") {
        const concreteId = this.getConcreteToolId(tool, r, c);
        if (typeof this.world.placeStructure === "function") {
          ok = Boolean(this.world.placeStructure(r, c, concreteId, rotIndex));
          if (!ok && concreteId !== tool.id) {
            ok = Boolean(this.world.placeStructure(r, c, tool.id, rotIndex));
          }
        }
        if (!ok && typeof this.world.placeAmenity === "function" && !tool.isComposite2x2) {
          ok = Boolean(this.world.placeAmenity(r, c, concreteId, rotIndex));
        }
        if (!ok && typeof this.world.placeFlora === "function" && !tool.isComposite2x2) {
          ok = Boolean(this.world.placeFlora(r, c, concreteId, rotIndex));
        }
        if (!ok && typeof this.world.placeItem === "function") {
          ok = Boolean(this.world.placeItem(r, c, concreteId, rotIndex));
        }
      }

      if (ok) {
        if (tool.kind !== "bulldoze") {
          this._deductIfUnchanged(cost, cashBefore, tool.name);
        }
        if (this.audio) {
          if (
            (tool.id === "winter_carousel" || tool.id === "festival_ferris_wheel_2x2") &&
            typeof this.audio.playCarouselChime === "function"
          ) {
            this.audio.playCarouselChime();
          } else if (typeof this.audio.playBuild === "function") {
            this.audio.playBuild();
          } else if (typeof this.audio.playPlace === "function") {
            this.audio.playPlace();
          } else if (typeof this.audio.playClick === "function") {
            this.audio.playClick();
          }
        }
        const prevDrag = this._inDragApply;
        this._inDragApply = Boolean(opts.isDrag);
        this._notifyWorldMutated();
        this._inDragApply = prevDrag;
      }
      return ok;
    }

    _notifyWorldMutated() {
      if (this.sim) {
        if (typeof this.sim.onWorldChanged === "function") this.sim.onWorldChanged();
        else if (typeof this.sim._syncWorldInfrastructure === "function") {
          this.sim._syncWorldInfrastructure(false);
        }
      }
      if (this.pointerDown || this._inDragApply) {
        this._hudDirty = true;
        if (this.hoverCell) {
          this._syncRendererGhost();
        }
        return;
      }
      this._syncRendererGhost();
      this.refreshUI(true, false);
    }

    // -------------------------------------------------------------------------
    // 8. Ghost Preview & Camera Helpers
    // -------------------------------------------------------------------------
    setHoverCell(r, c, u = 4.0, v = 4.0) {
      if (r === null || c === null || r === undefined || c === undefined) {
        if (this.hoverCell === null) return;
        this.hoverCell = null;
        this._syncRendererGhost();
        return;
      }
      const prev = this.hoverCell;
      if (prev && prev.r === r && prev.c === c) {
        prev.u = u;
        prev.v = v;
        if (this.renderer && this.renderer.ghostPreview) {
          this.renderer.ghostPreview.u = u;
          this.renderer.ghostPreview.v = v;
        }
        return;
      }
      this.hoverCell = { r, c, u, v };
      if (this.liftAnchor && this.activeTool && this.activeTool.kind === "lift") {
        this._updateLiftDragPreview(r, c);
      } else {
        this._syncRendererGhost();
      }
    }

    _syncRendererGhost() {
      if (!this.renderer) return;
      if (this.thumbMode || !this.hoverCell) {
        this.renderer.ghostPreview = null;
        if (typeof this.renderer.setGhostPreview === "function") {
          this.renderer.setGhostPreview(null);
        }
        return;
      }

      const { r, c, u, v } = this.hoverCell;
      if (!this.activeTool) {
        const inspectGhost = { tool: "inspect", kind: "inspect", r, c, u, v, valid: true };
        this.renderer.ghostPreview = inspectGhost;
        if (typeof this.renderer.setGhostPreview === "function") {
          this.renderer.setGhostPreview(inspectGhost);
        }
        return;
      }

      if (this.activeTool.kind === "lift" && this.liftAnchor) {
        this._updateLiftDragPreview(r, c);
        return;
      }

      const tool = this.activeTool;
      const concreteId = this.getConcreteToolId(tool, r, c);
      let valid = this._canAfford(tool.cost || 0);
      if (valid && this.world) {
        if (tool.kind === "structure" && typeof this.world.canPlaceStructure === "function") {
          valid = Boolean(this.world.canPlaceStructure(r, c, concreteId));
        } else if (tool.kind === "amenity" && typeof this.world.canPlaceAmenity === "function") {
          valid = Boolean(this.world.canPlaceAmenity(r, c, concreteId));
        } else if (tool.kind === "flora" && typeof this.world.canPlaceFlora === "function") {
          valid = Boolean(this.world.canPlaceFlora(r, c, concreteId));
        }
      }

      const spriteKey = this._resolveSpriteKey(
        [concreteId, `${concreteId}_f0`, ...(tool.spriteCandidates || [])],
        false
      );

      const ghost = {
        tool: tool.kind,
        kind: tool.kind,
        itemId: concreteId,
        baseId: tool.id,
        spriteKey,
        sculptMode: tool.sculptMode || null,
        radius: tool.radius || 0,
        footprint: tool.footprint || 1,
        isComposite2x2: Boolean(tool.isComposite2x2),
        r,
        c,
        u,
        v,
        valid,
      };
      this.renderer.ghostPreview = ghost;
      if (typeof this.renderer.setGhostPreview === "function") {
        this.renderer.setGhostPreview(ghost);
      }
    }

    _getZoom() {
      if (!this.renderer) return 1.0;
      return this.renderer.zoom || 1.0;
    }

    _yieldShowcaseCamera() {
      if (
        this.renderer &&
        typeof this.renderer.isShowcaseCameraActive === "function" &&
        this.renderer.isShowcaseCameraActive()
      ) {
        if (typeof this.renderer.setShowcaseCamera === "function") {
          this.renderer.setShowcaseCamera(false);
        }
        this._syncShowcaseButton(false);
      }
    }

    _panBy(screenDx, screenDy) {
      if (!this.renderer) return;
      if (Math.abs(screenDx) > 1 || Math.abs(screenDy) > 1) {
        if (this.followEntity) this.setFollowEntity(false);
        this._yieldShowcaseCamera();
      }
      if (typeof this.renderer.panBy === "function") {
        this.renderer.panBy(screenDx, screenDy);
      } else if (typeof this.renderer.panX === "number") {
        const z = this._getZoom();
        this.renderer.panX -= screenDx / z;
        this.renderer.panY -= screenDy / z;
      }
    }

    _zoomByFactor(factor, clientX, clientY) {
      if (!this.renderer) return;
      this._yieldShowcaseCamera();
      const cx = clientX !== undefined ? clientX : window.innerWidth * 0.5;
      const cy = clientY !== undefined ? clientY : window.innerHeight * 0.5;
      const next = Math.max(0.5, Math.min(3.0, this._getZoom() * factor));
      if (typeof this.renderer.setZoom === "function") {
        this.renderer.setZoom(next, cx, cy);
      } else {
        this.renderer.zoom = next;
      }
      this._updateZoomReadout();
    }

    applyThumbHeroFraming() {
      if (!this.renderer) return;
      const vw = this.renderer.viewW || window.innerWidth || 1280;
      const vh = this.renderer.viewH || window.innerHeight || 800;
      if (typeof this.renderer.centerOnWorld === "function") {
        this.renderer.centerOnWorld(true);
      }
      const scaleFit = Math.min(vw / 1480, vh / 920);
      this.renderer.zoom = Math.max(0.58, Math.min(1.05, 0.86 * scaleFit));
      this.renderer.panX = 140;
      this.renderer.panY = 790;
      if (typeof this.renderer._clampCamera === "function") {
        this.renderer._clampCamera();
      }
      this.setHoverCell(null, null);
      this._updateZoomReadout();
    }

    applyPresetHeroFraming(presetName = this.currentPreset) {
      if (!this.renderer || this.thumbMode) return false;
      if (presetName !== "zermatt_grand") return false;
      const vw = this.renderer.viewW || window.innerWidth || 1440;
      const vh = this.renderer.viewH || window.innerHeight || 900;
      // Frame the Matterhorn Summit Observatory (r=1..5, c=11..16), Waterfall Gorge & Skybridge,
      // Skating Lagoon, AND the Mid-Mountain Sun-Terrace & Winter Festival Ferris Wheel Square
      // (r=11..20, c=8..20) heroically centered above the 214px bottom Build Dock!
      const fit = Math.min(vw / 1440, vh / 900);
      this.renderer.zoom = Math.max(0.68, Math.min(0.96, 0.82 * fit));
      this.renderer.panX = 165;
      this.renderer.panY = 855;
      if (typeof this.renderer._clampCamera === "function") {
        this.renderer._clampCamera();
      }
      this._updateZoomReadout();
      return true;
    }

    resetCameraView() {
      if (!this.renderer) return;
      this.setFollowEntity(false);
      this._yieldShowcaseCamera();
      if (this.thumbMode) {
        this.applyThumbHeroFraming();
        return;
      }
      if (this.currentPreset === "zermatt_grand" && this.applyPresetHeroFraming("zermatt_grand")) {
        return;
      }
      if (typeof this.renderer.resetCamera === "function") {
        this.renderer.resetCamera();
      } else if (typeof this.renderer.centerOnWorld === "function") {
        this.renderer.centerOnWorld(true);
      } else {
        this.renderer.zoom = 1.0;
      }
      this._updateZoomReadout();
    }

    centerOnCell(r, c) {
      if (!this.renderer || !this.world) return;
      this.setFollowEntity(false);
      this._yieldShowcaseCamera();
      if (typeof this.renderer.centerOnCell === "function") {
        this.renderer.centerOnCell(r, c);
      } else {
        this.renderer.panX = (c - r) * 64;
        this.renderer.panY = (r + c) * 32;
      }
    }

    _updateZoomReadout() {
      if (this.dom.btnZoomReset) {
        this._setText(this.dom.btnZoomReset, `${Math.round(this._getZoom() * 100)}%`);
      }
    }

    _pickCellFromEvent(e) {
      if (!this.renderer || typeof this.renderer.screenToCell !== "function") return null;
      const hit = this.renderer.screenToCell(e.clientX, e.clientY);
      if (!hit) return null;
      const r = Array.isArray(hit) ? hit[0] : hit.r !== undefined ? hit.r : hit.row;
      const c = Array.isArray(hit) ? hit[1] : hit.c !== undefined ? hit.c : hit.col;
      const size = (this.world && this.world.size) || 28;
      if (typeof r !== "number" || typeof c !== "number" || r < 0 || c < 0 || r >= size || c >= size) {
        return null;
      }
      return {
        r: Math.floor(r),
        c: Math.floor(c),
        u: typeof hit.u === "number" ? hit.u : 4.0,
        v: typeof hit.v === "number" ? hit.v : 4.0,
      };
    }

    // -------------------------------------------------------------------------
    // 9. Live Guest, Vehicle, Lift & Building Inspector (`#inspector-card`)
    // -------------------------------------------------------------------------
    _cellHasFireworksMortar(r, c) {
      if (!this.world) return false;
      const cell =
        this.world.cells && this.world.cells[r] && this.world.cells[r][c]
          ? this.world.cells[r][c]
          : typeof this.world.getCell === "function"
          ? this.world.getCell(r, c)
          : null;
      if (!cell) return false;
      const s =
        (cell.structure && (cell.structure.baseId || cell.structure.id || cell.structure)) || "";
      const a = (cell.amenity && (cell.amenity.id || cell.amenity)) || "";
      const f = (cell.flora && (cell.flora.id || cell.flora)) || "";
      return (
        String(s).startsWith("fireworks_mortar") ||
        String(a).startsWith("fireworks_mortar") ||
        String(f).startsWith("fireworks_mortar")
      );
    }

    _triggerMortarBurstAt(r, c) {
      let launched = false;
      if (this.sim) {
        const singleFns = [
          "launchFireworkAt",
          "triggerFireworkAt",
          "spawnFireworkAt",
          "fireMortarAt",
          "launchFirework",
          "spawnFirework",
          "triggerFireworkBurst",
        ];
        for (let i = 0; i < singleFns.length; i++) {
          const fn = this.sim[singleFns[i]];
          if (typeof fn === "function") {
            fn.call(this.sim, r, c);
            launched = true;
            break;
          }
        }
        if (!launched && typeof this.sim.triggerFestiveFinale === "function") {
          this.sim.triggerFestiveFinale();
          launched = true;
        }
      }
      if (this.audio) {
        if (typeof this.audio.playFireworkBurst === "function") {
          this.audio.playFireworkBurst();
        } else if (typeof this.audio.playClick === "function") {
          this.audio.playClick();
        }
      }
      this.showToast({
        eyebrow: "Pyrotechnic Mortar Battery",
        message: "Starburst Fireworks Shell Launched Over Alpine Peak!",
        iconKey: "fireworks_mortar_f0",
      });
      return launched;
    }

    inspectAtClient(clientX, clientY) {
      if (!this.renderer) return null;
      let wx = 0;
      let wy = 0;
      if (typeof this.renderer.screenToWorld === "function") {
        const wpt = this.renderer.screenToWorld(clientX, clientY);
        if (wpt) {
          wx = wpt.wx !== undefined ? wpt.wx : wpt.x || 0;
          wy = wpt.wy !== undefined ? wpt.wy : wpt.y || 0;
        }
      }
      const cellHit = this._pickCellFromEvent({ clientX, clientY });

      // Interactive Fireworks Mortar Click-to-Launch in Inspect Mode (#139)
      if (cellHit && this._cellHasFireworksMortar(cellHit.r, cellHit.c)) {
        this._triggerMortarBurstAt(cellHit.r, cellHit.c);
        this.inspectedTarget = { kind: "tile", r: cellHit.r, c: cellHit.c };
        this.followEntity = false;
        this.renderInspectorCard();
        return this.inspectedTarget;
      }

      // 1. Direct Entity Hit via `sim.findEntityAt(worldX, worldY)`
      let entity = null;
      if (this.sim && typeof this.sim.findEntityAt === "function") {
        try {
          entity = this.sim.findEntityAt(wx, wy);
        } catch (_) {}
      }

      // Fallback proximity scan across cell entities & aerial carriers near click
      if (!entity && this.sim && cellHit) {
        let bestDist = 42;
        const consider = (ent) => {
          if (!ent) return;
          const er = ent.r !== undefined ? ent.r : ent.row;
          const ec = ent.c !== undefined ? ent.c : ent.col;
          if (typeof er !== "number" || typeof ec !== "number") return;
          const dCell = Math.hypot(er - cellHit.r, ec - cellHit.c);
          if (dCell <= 1.8 && dCell * 24 < bestDist) {
            bestDist = dCell * 24;
            entity = ent;
          }
        };
        if (typeof this.sim.getEntitiesInCell === "function") {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const list = this.sim.getEntitiesInCell(cellHit.r + dr, cellHit.c + dc) || [];
              list.forEach(consider);
            }
          }
        }
        if (!entity && typeof this.sim.getAerialCarriers === "function") {
          const carriers = this.sim.getAerialCarriers() || [];
          carriers.forEach(consider);
        }
      }

      if (entity) {
        const entId = entity.id !== undefined ? entity.id : entity.uid;
        this.inspectedTarget = {
          kind: "entity",
          id: entId,
          entityRef: entity,
        };
        this.followEntity = false;
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.renderInspectorCard();
        return this.inspectedTarget;
      }

      // 2. Lift or Building / Piste Tile Inspection
      if (cellHit && this.world) {
        return this.inspectAt(cellHit.r, cellHit.c);
      }

      this.closeInspector();
      return null;
    }

    inspectAt(r, c) {
      if (!this.world) return null;
      const size = this.world.size || 28;
      if (r < 0 || c < 0 || r >= size || c >= size) return null;

      // Interactive Fireworks Mortar Click-to-Launch in Inspect Mode (#139)
      if (this._cellHasFireworksMortar(r, c)) {
        this._triggerMortarBurstAt(r, c);
        this.inspectedTarget = { kind: "tile", r, c };
        this.followEntity = false;
        this.renderInspectorCard();
        return this.inspectedTarget;
      }

      // Check entities inside (r, c) first
      if (this.sim && typeof this.sim.getEntitiesInCell === "function") {
        const ents = this.sim.getEntitiesInCell(r, c);
        if (Array.isArray(ents) && ents.length > 0) {
          const ent = ents[0];
          this.inspectedTarget = {
            kind: "entity",
            id: ent.id !== undefined ? ent.id : ent.uid,
            entityRef: ent,
          };
          this.followEntity = false;
          this.renderInspectorCard();
          return this.inspectedTarget;
        }
      }

      // Check Ski Lifts spanning (r, c)
      const lifts = typeof this.world.getLifts === "function" ? this.world.getLifts() || [] : [];
      for (const lift of lifts) {
        const towers = lift.towers || lift.cells || [];
        const onLift =
          (lift.baseR === r && lift.baseC === c) ||
          (lift.topR === r && lift.topC === c) ||
          towers.some((t) => t && t.r === r && t.c === c);
        if (onLift) {
          this.inspectedTarget = { kind: "lift", liftRef: lift, r, c };
          this.followEntity = false;
          this.renderInspectorCard();
          return this.inspectedTarget;
        }
      }

      // Inspect Building / Amenity / Surface Cell
      const cell =
        this.world.cells && this.world.cells[r] && this.world.cells[r][c]
          ? this.world.cells[r][c]
          : typeof this.world.getCell === "function"
          ? this.world.getCell(r, c)
          : null;
      if (cell) {
        this.inspectedTarget = { kind: "tile", r, c };
        this.followEntity = false;
        this.renderInspectorCard();
        return this.inspectedTarget;
      }
      return null;
    }

    setFollowEntity(flag) {
      this.followEntity = Boolean(flag && this.inspectedTarget && this.inspectedTarget.kind === "entity");
      if (this.followEntity) {
        this._yieldShowcaseCamera();
      }
      if (this.dom.btnInspFollow) {
        this.dom.btnInspFollow.classList.toggle("active", this.followEntity);
      }
      if (this.dom.inspFollowLabel) {
        this._setText(this.dom.inspFollowLabel, this.followEntity ? "Following ●" : "Follow");
      }
    }

    closeInspector() {
      this.inspectedTarget = null;
      this.setFollowEntity(false);
      if (this.dom.inspectorCard) {
        this.dom.inspectorCard.classList.add("hidden");
      }
    }

    _resolveInspectedEntity() {
      if (!this.inspectedTarget || this.inspectedTarget.kind !== "entity") return null;
      if (this.sim && this.inspectedTarget.id !== undefined && typeof this.sim.getEntityById === "function") {
        const live = this.sim.getEntityById(this.inspectedTarget.id);
        if (live) return live;
      }
      return this.inspectedTarget.entityRef || null;
    }

    updateFollowCamera() {
      if (!this.followEntity || !this.renderer) return;
      const ent = this._resolveInspectedEntity();
      if (!ent) {
        this.setFollowEntity(false);
        return;
      }
      if (typeof ent.worldX === "number" && typeof ent.worldY === "number") {
        this.renderer.panX = ent.worldX;
        this.renderer.panY = ent.worldY - 18;
      } else {
        const r = ent.r !== undefined ? ent.r : ent.row;
        const c = ent.c !== undefined ? ent.c : ent.col;
        const u = ent.u !== undefined ? ent.u : 4.0;
        const v = ent.v !== undefined ? ent.v : 4.0;
        if (typeof r === "number" && typeof c === "number") {
          if (typeof this.renderer.cellToWorld === "function") {
            const pt = this.renderer.cellToWorld(r, c, u, v);
            this.renderer.panX = pt.wx;
            this.renderer.panY = pt.wy - 18;
          } else {
            this.renderer.panX = (c - r) * 64 + (v - u) * 8;
            this.renderer.panY = (r + c) * 32 + (u + v) * 4 - (ent.z || 0) * 4 - 18;
          }
        }
      }
    }

    _getLiftThumbSprite(liftType, targetPx = 28) {
      if (!this.atlas || typeof this.atlas.getThumbSprite !== "function") return null;
      const meta = LIFT_META[liftType] || LIFT_META.chairlift;
      const cands = meta.iconCandidates || [];
      const resolved = this._resolveSpriteKey(cands, true);
      const tryKeys = resolved ? [resolved, ...cands] : cands;
      for (let i = 0; i < tryKeys.length; i++) {
        const sp = this.atlas.getThumbSprite(tryKeys[i], targetPx);
        if (sp) return this._normalizeThumbSprite(sp, targetPx);
      }
      return null;
    }

    _getLiftIconDataUrl(liftType) {
      const meta = LIFT_META[liftType] || LIFT_META.chairlift;
      for (const cand of meta.iconCandidates || []) {
        const url = this.getEntityPortraitDataUrl(cand, true);
        if (url) return url;
      }
      return "";
    }

    _setInspectorPortraitSrc(url) {
      if (this._inspPortraitSpan) {
        this._inspPortraitSpan.classList.add("hidden");
      }
      const img = this.dom.inspPortrait;
      if (!img) return;
      if (url) {
        if (img._lastSrc !== url) {
          img._lastSrc = url;
          img.src = url;
        }
        img.classList.remove("hidden");
      } else {
        img.classList.add("hidden");
      }
    }

    _setInspectorPortraitSprite(sp, fallbackUrlFn) {
      if (sp) {
        const img = this.dom.inspPortrait;
        if (img) img.classList.add("hidden");
        const well = img && img.parentNode;
        if (well) {
          if (!this._inspPortraitSpan) {
            const span = document.createElement("span");
            span.className = "insp-portrait palette-thumb-sprite pixelated";
            span.dataset.sprite = "1";
            span.setAttribute("aria-hidden", "true");
            well.insertBefore(span, img);
            this._inspPortraitSpan = span;
          }
          const bgOverride =
            sp.url && sp.url.startsWith("data:") ? `;background-image:url("${sp.url}")` : "";
          const cssVars = `--thumb-x:${sp.x.toFixed(2)}px;--thumb-y:${sp.y.toFixed(2)}px;--thumb-sheet-w:${sp.sheetW.toFixed(2)}px;--thumb-sheet-h:${sp.sheetH.toFixed(2)}px${bgOverride}`;
          if (this._inspPortraitSpan._lastCssVars !== cssVars) {
            this._inspPortraitSpan._lastCssVars = cssVars;
            this._inspPortraitSpan.style.cssText = cssVars;
          }
          this._inspPortraitSpan.classList.remove("hidden");
        }
        return true;
      }
      const url = typeof fallbackUrlFn === "function" ? fallbackUrlFn() : "";
      this._setInspectorPortraitSrc(url);
      return false;
    }

    _getFirstThumbSprite(candidates, targetPx = 64) {
      if (!this.atlas || typeof this.atlas.getThumbSprite !== "function" || !Array.isArray(candidates)) {
        return null;
      }
      for (let i = 0; i < candidates.length; i++) {
        const k = candidates[i];
        if (!k) continue;
        const sp = this.atlas.getThumbSprite(k, targetPx);
        if (sp) return this._normalizeThumbSprite(sp, targetPx);
      }
      return null;
    }

    renderInspectorCard() {
      if (!this.dom.inspectorCard) return;
      if (!this.inspectedTarget || this.thumbMode) {
        this.dom.inspectorCard.classList.add("hidden");
        return;
      }

      if (this.inspectedTarget.kind === "entity") {
        const ent = this._resolveInspectedEntity();
        if (!ent) {
          this.closeInspector();
          return;
        }
        const typeKey = ent.type || ent.species || ent.kind || ent.id || "skier_carver";
        const spriteKey = ent.spriteKey || `${typeKey}_sw_f0`;
        const entSp = this._getFirstThumbSprite(
          [
            spriteKey,
            typeKey,
            `${typeKey}_sw_f0`,
            `${typeKey}_se_f0`,
            `${typeKey}_ne_f0`,
            `${typeKey}_nw_f0`,
            `${typeKey}_f0`,
          ],
          64
        );
        this._setInspectorPortraitSprite(
          entSp,
          () =>
            this.getEntityPortraitDataUrl(spriteKey, false) ||
            this.getEntityPortraitDataUrl(typeKey, false)
        );

        const defBio = ENTITY_INSPECTOR_DEFAULTS[typeKey] || null;
        this._setText(
          this.dom.inspName,
          ent.name || (defBio && defBio.name) || this._humanizeId(typeKey)
        );
        this._setText(
          this.dom.inspBadge,
          ent.roleLabel ||
            ent.skillLabel ||
            ent.skill ||
            (defBio && defBio.badge) ||
            this._humanizeId(typeKey)
        );
        this._setText(
          this.dom.inspAction,
          ent.activityText ||
            ent.stateLabel ||
            ent.action ||
            (defBio && defBio.action) ||
            "Enjoying Alpine Peak Resort"
        );
        const rawThought = ent.thoughtText || (defBio && defBio.thought) || "";
        this._setText(
          this.dom.inspThought,
          rawThought
            ? `\u201C${String(rawThought).replace(/^["\u201C]|["\u201D]$/g, "")}\u201D`
            : "\u201CCrisp winter mountain air and fresh snow!\u201D"
        );

        const hasMeters = typeof ent.warmth === "number" || typeof ent.thrill === "number";
        this.dom.inspMeters.classList.toggle("hidden", !hasMeters);
        if (this.dom.inspStaticHeader) {
          this.dom.inspStaticHeader.classList.toggle("hidden", hasMeters);
        }
        if (hasMeters) {
          const warmth = Math.max(0, Math.min(100, Math.round(ent.warmth ?? 85)));
          const thrill = Math.max(0, Math.min(100, Math.round(ent.thrill ?? 80)));
          this._setFillScale(this.dom.inspWarmthFill, warmth);
          this._setText(this.dom.inspWarmthVal, `Warmth ${warmth}%`);
          this._setFillScale(this.dom.inspThrillFill, thrill);
          this._setText(this.dom.inspThrillVal, `Thrill ${thrill}%`);
        }

        const spent = ent.cashSpent !== undefined ? ent.cashSpent : ent.spent;
        this._setText(
          this.dom.inspMeta,
          typeof spent === "number" ? `Spent $${Math.round(spent)}` : "Active"
        );
        this.dom.btnInspFollow.dataset.mode = "follow";
        this._setText(this.dom.inspFollowLabel, this.followEntity ? "Following ●" : "Follow");
        this.dom.btnInspFollow.classList.toggle("active", this.followEntity);
        this.dom.inspectorCard.classList.remove("hidden");
        return;
      }

      if (this.inspectedTarget.kind === "lift") {
        const lift = this.inspectedTarget.liftRef || {};
        const lType = lift.type || lift.liftType || "chairlift";
        const meta = LIFT_META[lType] || LIFT_META.chairlift;
        const liftSp = this._getLiftThumbSprite(lType, 64);
        this._setInspectorPortraitSprite(liftSp, () => this._getLiftIconDataUrl(lType));
        this._setText(this.dom.inspName, lift.name || meta.name);
        this._setText(this.dom.inspBadge, meta.badge);
        const lvBase = lift.baseLevel !== undefined ? lift.baseLevel : 0;
        const lvTop = lift.topLevel !== undefined ? lift.topLevel : 3;
        this._setText(
          this.dom.inspAction,
          `Hauling Guests Uphill (Lv ${lvBase} \u2192 Lv ${lvTop})`
        );
        this._setText(
          this.dom.inspThought,
          "\u201CCable & sheave tension nominal \u00B7 Smooth continuous loop.\u201D"
        );
        this.dom.inspMeters.classList.add("hidden");
        if (this.dom.inspStaticHeader) this.dom.inspStaticHeader.classList.remove("hidden");
        const towerCount = Array.isArray(lift.towers)
          ? lift.towers.length
          : (lift.lengthCells || 3) + 1;
        this._setText(this.dom.inspMeta, `${towerCount} Nodes`);
        this.dom.btnInspFollow.dataset.mode = "center";
        this.dom.btnInspFollow.classList.remove("active");
        this._setText(this.dom.inspFollowLabel, "Center Top");
        this.dom.inspectorCard.classList.remove("hidden");
        return;
      }

      if (this.inspectedTarget.kind === "tile" && this.world) {
        const { r, c } = this.inspectedTarget;
        const cell =
          this.world.cells && this.world.cells[r] ? this.world.cells[r][c] : null;
        if (!cell) {
          this.closeInspector();
          return;
        }
        const structId =
          (cell.structure && (cell.structure.baseId || cell.structure.id || cell.structure)) ||
          (cell.amenity && (cell.amenity.id || cell.amenity)) ||
          (cell.flora && (cell.flora.id || cell.flora)) ||
          cell.water ||
          cell.surface ||
          cell.biome ||
          "untouched_powder";
        const cleanId = String(structId);
        const toolMeta = TOOL_BY_ID.get(cleanId);
        const elev = cell.minLevel !== undefined ? cell.minLevel : cell.level || 0;
        const spriteCand =
          (toolMeta && toolMeta.spriteCandidates && toolMeta.spriteCandidates[0]) ||
          `${cleanId}_lv${elev}_v0`;
        const tileSp =
          (toolMeta && this._getToolThumbSprite(toolMeta, 64)) ||
          this._getFirstThumbSprite(
            [
              cleanId,
              `${cleanId}_f0`,
              spriteCand,
              `${cleanId}_ns_f0`,
              `${cleanId}_se_f0`,
              `${cleanId}_sw`,
              `${cleanId}_ns`,
            ],
            64
          );
        this._setInspectorPortraitSprite(
          tileSp,
          () =>
            (toolMeta && this.getToolThumbnailDataUrl(toolMeta)) ||
            this.getEntityPortraitDataUrl(cleanId, true) ||
            this.getEntityPortraitDataUrl(spriteCand, true)
        );
        this._setText(this.dom.inspName, (toolMeta && toolMeta.name) || this._humanizeId(cleanId));
        this._setText(this.dom.inspBadge, `(${r},${c}) Lv${elev}`);
        const wearPct =
          typeof cell.pisteQuality === "number"
            ? Math.round(cell.pisteQuality)
            : typeof cell.wear === "number"
            ? Math.round((1 - cell.wear) * 100)
            : null;
        this._setText(
          this.dom.inspAction,
          wearPct !== null &&
            (cell.surface === "groomed_piste" ||
              cell.surface === "mogul_chute" ||
              cell.surface === "tubing_chute")
            ? `Snow Surface Quality: ${wearPct}% Corduroy`
            : (toolMeta && toolMeta.desc) || "Alpine mountain terrain & village parcel."
        );
        this._setText(
          this.dom.inspThought,
          cleanId.startsWith("fireworks_mortar")
            ? "\u201CClick this mortar pad again or press [F] to launch celebratory fireworks!\u201D"
            : "\u201CSelect any of the 174 palette items below to build or groom.\u201D"
        );
        this.dom.inspMeters.classList.add("hidden");
        if (this.dom.inspStaticHeader) this.dom.inspStaticHeader.classList.remove("hidden");
        this._setText(this.dom.inspMeta, `Lv ${elev}`);
        this.dom.btnInspFollow.dataset.mode = "center";
        this.dom.btnInspFollow.classList.remove("active");
        this._setText(this.dom.inspFollowLabel, "Center");
        this.dom.inspectorCard.classList.remove("hidden");
      }
    }

    _humanizeId(raw) {
      return String(raw || "")
        .replace(/_f[0-5]$/, "")
        .replace(/_v[0-3]$/, "")
        .replace(/_2x2.*$/, "")
        .split("_")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    // -------------------------------------------------------------------------
    // 10. Presets, Winter Atmospheres, Speed, Undo/Redo, Zen & Snapshot PNG
    // -------------------------------------------------------------------------
    loadPreset(presetName, seed) {
      if (!this.world) return false;
      this._endStrokeBatch();
      const chosenSeed =
        seed !== undefined && seed !== null
          ? seed
          : Math.floor(100000 + Math.random() * 899999);
      this.currentPreset = presetName;
      this.currentSeed = chosenSeed;
      this._cancelLiftAnchor();
      this.closeInspector();

      if (this.dom.presetSelect && this.dom.presetSelect.value !== presetName) {
        this.dom.presetSelect.value = presetName;
      }
      if (this.dom.mobPresetSelect && this.dom.mobPresetSelect.value !== presetName) {
        this.dom.mobPresetSelect.value = presetName;
      }

      const wasBooted = this._bootCompleted;
      this._bootCompleted = false;
      this._knownCompletedChallenges.clear();

      if (typeof this.world.loadPreset === "function") {
        this.world.loadPreset(presetName, chosenSeed);
      } else if (typeof this.world.generatePreset === "function") {
        this.world.generatePreset(presetName, chosenSeed);
      }

      if (this.sim) {
        if (typeof this.sim.resetForWorld === "function") this.sim.resetForWorld(this.world);
        else if (typeof this.sim.onWorldReset === "function") this.sim.onWorldReset();
        else if (typeof this.sim.seedInitialResortLife === "function") {
          this.sim.seedInitialResortLife();
        }
      }

      if (presetName === "night_park") {
        this.setAtmosphere("night");
      } else if (this.atmosphere === "night" && presetName === "zermatt_grand") {
        this.setAtmosphere("day");
      }

      for (const ch of this._readChallenges()) {
        if (ch.completed) this._knownCompletedChallenges.add(ch.id);
      }
      this._bootCompleted = wasBooted;
      this._minimapBaseValid = false;
      this._lastMinimapTime = 0;

      this.resetCameraView();
      this.refreshUI(true, false);
      if (this.guideOpen) this.renderGuideDrawer();
      return true;
    }

    setPreset(presetName, seed) {
      return this.loadPreset(presetName, seed);
    }

    newMountain() {
      const nextSeed = Math.floor(100000 + Math.random() * 899999);
      this.loadPreset(this.currentPreset, nextSeed);
      const opt =
        this.dom.presetSelect &&
        this.dom.presetSelect.querySelector(`option[value="${this.currentPreset}"]`);
      this.showToast({
        eyebrow: "Fresh 28×28 Alpine Peak",
        message: `Generated ${opt ? opt.textContent : this.currentPreset} (Seed #${nextSeed})`,
      });
      return nextSeed;
    }

    setAtmosphere(mode) {
      const raw = String(mode || "day").toLowerCase();
      const canonical =
        raw === "golden" || raw === "alpenglow"
          ? "alpenglow"
          : raw === "dusk" || raw === "night"
          ? "night"
          : "day";
      this.atmosphere = canonical;
      this._lastMinimapTime = 0;

      if (this.renderer) {
        if (typeof this.renderer.setAtmosphere === "function") {
          this.renderer.setAtmosphere(canonical);
        } else {
          this.renderer.atmosphere = canonical;
        }
      }
      if (this.audio && typeof this.audio.setAtmosphere === "function") {
        this.audio.setAtmosphere(canonical);
      }
      if (this.sim && typeof this.sim.setAtmosphereHint === "function") {
        this.sim.setAtmosphereHint(canonical);
      }

      if (this.dom.atmoGroup) {
        this.dom.atmoGroup.dataset.activeAtmo = canonical;
        const btns = this.dom.atmoGroup.querySelectorAll(".seg-btn");
        btns.forEach((b) => b.classList.toggle("active", b.dataset.atmo === canonical));
      }
      if (this.dom.mobAtmoSeg) {
        const mobBtns = this.dom.mobAtmoSeg.querySelectorAll("[data-atmo]");
        mobBtns.forEach((b) => b.classList.toggle("active", b.dataset.atmo === canonical));
      }
      if (this.dom.atmoActiveLabel) {
        this._setText(
          this.dom.atmoActiveLabel,
          canonical === "alpenglow"
            ? "Alpenglow"
            : canonical === "night"
            ? "Night Ski"
            : "Bluebird Day"
        );
      }
      return canonical;
    }

    _syncFestiveButton(isActive) {
      const flag = Boolean(isActive);
      const btn = this.dom && this.dom.btnFestiveFinale;
      if (btn && this._lastBtnFestive !== flag) {
        this._lastBtnFestive = flag;
        btn.classList.toggle("active", flag);
        btn.setAttribute("aria-pressed", flag ? "true" : "false");
        if (this.dom.mobBtnFinale) {
          this.dom.mobBtnFinale.classList.toggle("active", flag);
        }
      }
    }

    _syncShowcaseButton(isActive) {
      const flag = Boolean(isActive);
      const btn = this.dom && this.dom.btnShowcaseCam;
      if (btn && this._lastBtnShowcase !== flag) {
        this._lastBtnShowcase = flag;
        btn.classList.toggle("active", flag);
        btn.setAttribute("aria-pressed", flag ? "true" : "false");
        if (this.dom.mobBtnTour) {
          this.dom.mobBtnTour.classList.toggle("active", flag);
        }
      }
    }

    triggerFestiveFinale() {
      let triggeredSim = false;
      if (this.sim && typeof this.sim.triggerFestiveFinale === "function") {
        this.sim.triggerFestiveFinale();
        triggeredSim = true;
      }
      if (!triggeredSim && this.audio) {
        if (typeof this.audio.playFestivalFanfare === "function") {
          this.audio.playFestivalFanfare();
        } else if (typeof this.audio.playFireworkBurst === "function") {
          this.audio.playFireworkBurst();
        } else if (typeof this.audio.playClick === "function") {
          this.audio.playClick();
        }
      }
      this._finaleFallbackUntil = performance.now() + 14000;
      this._syncFestiveButton(true);
      if (this._finaleResetTimer && typeof clearTimeout === "function") {
        clearTimeout(this._finaleResetTimer);
      }
      if (typeof setTimeout === "function") {
        this._finaleResetTimer = setTimeout(() => {
          this._finaleResetTimer = 0;
          const stillActive = Boolean(
            this.sim &&
              typeof this.sim.isFestiveFinaleActive === "function" &&
              this.sim.isFestiveFinaleActive()
          );
          if (!stillActive) {
            this._finaleFallbackUntil = 0;
            this._syncFestiveButton(false);
          }
        }, 14100);
      }
      this.showToast({
        eyebrow: "Grand Winter Festival",
        message: "Winter Festival Finale — Fireworks, Torchlight Ski Parade & Balloons!",
        iconKey: "fireworks_mortar_f0",
      });
      return true;
    }

    setShowcaseCamera(enabled) {
      const want = Boolean(enabled);
      if (want && this.followEntity) {
        this.setFollowEntity(false);
      }
      let active = want;
      if (this.renderer) {
        if (typeof this.renderer.setShowcaseCamera === "function") {
          const res = this.renderer.setShowcaseCamera(want);
          if (typeof res === "boolean") active = res;
          else if (typeof this.renderer.isShowcaseCameraActive === "function") {
            active = Boolean(this.renderer.isShowcaseCameraActive());
          }
        } else {
          this.renderer._showcaseActive = want;
        }
      }
      this._syncShowcaseButton(active);
      return active;
    }

    toggleShowcaseCamera() {
      if (this.followEntity) {
        this.setFollowEntity(false);
      }
      let active = false;
      if (this.renderer && typeof this.renderer.toggleShowcaseCamera === "function") {
        const res = this.renderer.toggleShowcaseCamera();
        if (typeof res === "boolean") active = res;
        else if (typeof this.renderer.isShowcaseCameraActive === "function") {
          active = Boolean(this.renderer.isShowcaseCameraActive());
        } else {
          active = !this._lastBtnShowcase;
        }
      } else if (this.renderer && typeof this.renderer.setShowcaseCamera === "function") {
        const cur =
          typeof this.renderer.isShowcaseCameraActive === "function"
            ? Boolean(this.renderer.isShowcaseCameraActive())
            : Boolean(this._lastBtnShowcase);
        active = this.setShowcaseCamera(!cur);
      } else {
        active = !this._lastBtnShowcase;
      }
      this._syncShowcaseButton(active);
      if (active) {
        this.showToast({
          eyebrow: "60 FPS Showcase Tour",
          message: "Gliding across Winter Festival Square, Waterfalls & Matterhorn Summit ([C] or pan to exit).",
          iconKey: "sphinx_observatory_2x2_se_f0",
        });
      }
      return active;
    }

    setSpeed(mult) {
      const s = Number(mult);
      if (![0, 1, 2].includes(s)) return false;
      this.simSpeed = s;
      if (this.sim) {
        if (typeof this.sim.setSpeed === "function") this.sim.setSpeed(s);
        else if ("timeScale" in this.sim) this.sim.timeScale = s;
      }
      if (this.dom.speedGroup) {
        const btns = this.dom.speedGroup.querySelectorAll(".seg-btn");
        btns.forEach((b) => b.classList.toggle("active", Number(b.dataset.speed) === s));
      }
      if (this.dom.mobSpeedSeg) {
        const mobBtns = this.dom.mobSpeedSeg.querySelectorAll("[data-speed]");
        mobBtns.forEach((b) => b.classList.toggle("active", Number(b.dataset.speed) === s));
      }
      return true;
    }

    setSandboxMode(enabled) {
      if (!this.sim) return false;
      const flag = Boolean(enabled);
      if (typeof this.sim.setSandboxMode === "function") this.sim.setSandboxMode(flag);
      else this.sim.sandboxMode = flag;

      // In-place cost badge & affordability update across visible palette cards (0 DOM rebuilds)
      const cash = Math.max(0, Math.round(this._getCash()));
      for (const entry of this._cardElsById.values()) {
        const item = entry.item;
        const wantCost = flag ? "FREE" : entry.paidCostText || `$${item.cost}`;
        if (entry.costBadgeEl && entry.costText !== wantCost) {
          entry.costText = wantCost;
          this._setText(entry.costBadgeEl, wantCost);
        }
        const unaff = !flag && item.cost > cash;
        if (entry.unaffordable !== unaff) {
          entry.unaffordable = unaff;
          entry.card.classList.toggle("unaffordable", unaff);
        }
      }
      this._lastAffordCash = cash;
      this._lastAffordSandbox = flag;
      this.refreshUI(true, false);
      return flag;
    }

    toggleSandbox() {
      return this.setSandboxMode(!this._isSandbox());
    }

    toggleGuide(forceBool) {
      this.guideOpen = typeof forceBool === "boolean" ? forceBool : !this.guideOpen;
      if (this.guideOpen && this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        if (this.dom.mobileMenuSheet) {
          this.dom.mobileMenuSheet.classList.remove("open");
          this.dom.mobileMenuSheet.setAttribute("aria-hidden", "true");
        }
        if (this.dom.btnMobileMenu) {
          this.dom.btnMobileMenu.classList.remove("active");
          this.dom.btnMobileMenu.setAttribute("aria-expanded", "false");
        }
      }
      if (this.dom.guideDrawer) {
        this.dom.guideDrawer.classList.toggle("open", this.guideOpen);
        this.dom.guideDrawer.setAttribute("aria-hidden", this.guideOpen ? "false" : "true");
      }
      if (this.dom.btnGuideToggle) {
        this.dom.btnGuideToggle.classList.toggle("active", this.guideOpen);
      }
      if (this.guideOpen) {
        if (this.dom.guideBadgeDot) this.dom.guideBadgeDot.classList.add("hidden");
        if (this.dom.mobGuideDot) this.dom.mobGuideDot.classList.add("hidden");
        this.renderGuideDrawer();
      }
      this._syncMobileBackdrop();
      return this.guideOpen;
    }

    toggleZen(forceBool) {
      this.zenMode = typeof forceBool === "boolean" ? forceBool : !this.zenMode;
      if (this.zenMode && this.mobileMenuOpen) {
        this.toggleMobileMenu(false);
      }
      if (this.dom.hudRoot) this.dom.hudRoot.classList.toggle("zen-hidden", this.zenMode);
      if (this.dom.btnZenRestore) {
        if (this.thumbMode) {
          this.dom.btnZenRestore.classList.add("hidden");
        } else {
          this.dom.btnZenRestore.classList.toggle("hidden", !this.zenMode);
        }
      }
      this._invalidateLayoutRects();
      return this.zenMode;
    }

    _toggleSound() {
      if (!this.audio || typeof this.audio.toggleMute !== "function") return false;
      const muted = Boolean(this.audio.toggleMute());
      if (this.dom.iconSoundOn) this.dom.iconSoundOn.classList.toggle("hidden", muted);
      if (this.dom.iconSoundOff) this.dom.iconSoundOff.classList.toggle("hidden", !muted);
      if (this.dom.mobSoundLabel) {
        this._setText(
          this.dom.mobSoundLabel,
          muted ? "\uD83D\uDD07 Muted" : "\uD83D\uDD0A Sound On"
        );
      }
      if (this.dom.mobBtnSound) {
        this.dom.mobBtnSound.classList.toggle("active", !muted);
      }
      return muted;
    }

    undo() {
      this._endStrokeBatch();
      if (!this.world || typeof this.world.undo !== "function") return false;
      const ok = Boolean(this.world.undo());
      if (ok) {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this._notifyWorldMutated();
      }
      return ok;
    }

    redo() {
      this._endStrokeBatch();
      if (!this.world || typeof this.world.redo !== "function") return false;
      const ok = Boolean(this.world.redo());
      if (ok) {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this._notifyWorldMutated();
      }
      return ok;
    }

    exportDioramaPNG() {
      if (!this.renderer || typeof this.renderer.exportDioramaPNG !== "function") return null;
      if (this.dom.shutterFlash && !this.thumbMode) {
        this.dom.shutterFlash.classList.add("active");
        setTimeout(() => this.dom.shutterFlash.classList.remove("active"), 180);
      }
      if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
      const dataUrl = this.renderer.exportDioramaPNG();
      this.showToast({
        eyebrow: "1:1 Mountain Panorama Saved",
        message: "Exported crisp full-resort pixel-art PNG!",
      });
      return dataUrl;
    }

    // -------------------------------------------------------------------------
    // 11. Resort Guide Drawer, Live Stats & Toast Notifications
    // -------------------------------------------------------------------------
    showToast({ eyebrow = "Alpine Peak Dispatch", message = "", reward = "", iconKey = null }) {
      if (this.thumbMode || !this.dom.toastContainer || !message) return;

      while (this.dom.toastContainer.children.length >= 3) {
        this.dom.toastContainer.firstElementChild.remove();
      }

      const card = document.createElement("div");
      card.className = "field-toast";

      if (iconKey) {
        const sp =
          this.atlas && typeof this.atlas.getThumbSprite === "function"
            ? this._normalizeThumbSprite(this.atlas.getThumbSprite(iconKey, 34), 34)
            : null;
        if (sp) {
          const span = document.createElement("span");
          span.className = "toast-thumb palette-thumb-sprite pixelated";
          span.dataset.sprite = "1";
          span.setAttribute("aria-hidden", "true");
          span.style.cssText = `--thumb-x:${sp.x.toFixed(2)}px;--thumb-y:${sp.y.toFixed(2)}px;--thumb-sheet-w:${sp.sheetW.toFixed(2)}px;--thumb-sheet-h:${sp.sheetH.toFixed(2)}px`;
          card.appendChild(span);
        } else {
          const iconUrl =
            this.getEntityPortraitDataUrl(iconKey, true) ||
            this.getEntityPortraitDataUrl(iconKey, false);
          if (iconUrl) {
            const img = document.createElement("img");
            img.className = "toast-thumb pixelated";
            img.src = iconUrl;
            img.alt = "";
            card.appendChild(img);
          }
        }
      }

      const body = document.createElement("div");
      body.className = "toast-content";

      const eye = document.createElement("span");
      eye.className = "toast-eyebrow";
      eye.textContent = eyebrow;
      body.appendChild(eye);

      const msg = document.createElement("div");
      msg.className = "toast-message";
      msg.textContent = message;
      if (reward) {
        const rew = document.createElement("span");
        rew.className = "toast-reward";
        rew.textContent = ` ${reward}`;
        msg.appendChild(rew);
      }
      body.appendChild(msg);
      card.appendChild(body);

      this.dom.toastContainer.appendChild(card);
      setTimeout(() => {
        card.classList.add("leaving");
        setTimeout(() => card.remove(), 240);
      }, 4600);
    }

    _bindSimEvents() {
      if (!this.sim || typeof this.sim.onEvent !== "function") return;
      this.sim.onEvent((evt) => {
        if (!evt || typeof evt !== "object" || !this._bootCompleted) return;
        if (evt.type === "challenge_completed" || evt.type === "milestone_completed") {
          const ch = evt.challenge || evt.milestone || {};
          if (ch.id) this._knownCompletedChallenges.add(ch.id);
          const bonus = evt.reward || ch.reward || 450;
          this.showToast({
            eyebrow: "Resort Milestone Unlocked",
            message: ch.title || evt.title || "Alpine Milestone Complete!",
            reward: `+$${bonus}`,
            iconKey: "grand_hotel_2x2_se_f0",
          });
          if (!this.guideOpen) {
            if (this.dom.guideBadgeDot) this.dom.guideBadgeDot.classList.remove("hidden");
            if (this.dom.mobGuideDot) this.dom.mobGuideDot.classList.remove("hidden");
          }
          this.refreshUI(true, false);
        } else if (evt.type === "train_arrival") {
          this.showToast({
            eyebrow: "Bernina Express Arrived",
            message: `${evt.passengers || 6} new travelers stepped onto the valley platform!`,
            iconKey: "alpine_train_sw_f0",
          });
        } else if (evt.type === "heli_arrival") {
          this.showToast({
            eyebrow: "Summit VIP Heli-Drop",
            message: "VIP powder skiers touched down at the Summit Helipad!",
            reward: evt.reward ? `+$${evt.reward}` : "+$120",
            iconKey: "vip_helicopter_sw_f0",
          });
        }
      });
    }

    _readStats() {
      const raw =
        this.sim && typeof this.sim.getStats === "function" ? this.sim.getStats() || {} : {};
      const cash = typeof raw.cash === "number" ? raw.cash : this._getCash();
      const resortRating =
        typeof raw.resortRating === "number"
          ? raw.resortRating
          : (this.sim && this.sim.resortRating) || 4.4;

      let runCounts = raw.runCounts || null;
      if (!runCounts && this.world && typeof this.world.getSkiRuns === "function") {
        const runs = this.world.getSkiRuns() || [];
        runCounts = { green: 0, blue: 0, black: 0 };
        for (const r of runs) {
          const diff = String(r.difficulty || r.rating || "blue").toLowerCase();
          if (diff.includes("green")) runCounts.green++;
          else if (diff.includes("black")) runCounts.black++;
          else runCounts.blue++;
        }
      }
      if (!runCounts) runCounts = { green: 0, blue: 0, black: 0 };
      const blackTotal =
        (runCounts.black || 0) + (runCounts.doubleBlack || runCounts.double_black || 0);

      return {
        cash,
        resortRating,
        skiersOnMountain: raw.skiersOnMountain ?? raw.skiers ?? 0,
        townVisitors: raw.townVisitors ?? raw.shoppers ?? 0,
        activeGuests: raw.activeGuests ?? (raw.skiersOnMountain || 0) + (raw.townVisitors || 0),
        runCounts: {
          green: runCounts.green || 0,
          blue: runCounts.blue || 0,
          black: blackTotal,
        },
        avgWarmth: raw.avgWarmth ?? 86,
        avgThrill: raw.avgThrill ?? 88,
        avgPisteQuality: raw.avgPisteQuality ?? 95,
        trainEtaSec: raw.trainEtaSec ?? null,
      };
    }

    _readChallenges() {
      let raw = null;
      if (this.sim) {
        if (typeof this.sim.getChallenges === "function") raw = this.sim.getChallenges();
        else if (Array.isArray(this.sim.challenges)) raw = this.sim.challenges;
      }
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((c, idx) => ({
          id: c.id || `m_${idx}`,
          title: c.title || c.name || "Resort Milestone",
          desc: c.desc || c.description || "",
          reward: c.reward || c.bonus || 450,
          completed: Boolean(c.completed || c.unlocked),
        }));
      }
      return FALLBACK_CHALLENGES.map((c, idx) => ({ ...c, id: c.id || `m_${idx}`, completed: false }));
    }

    renderGuideDrawer() {
      if (!this.dom.guideDrawer) return;
      const stats = this._readStats();
      const challenges = this._readChallenges();
      let doneCount = 0;
      for (let i = 0; i < challenges.length; i++) {
        if (challenges[i].completed) doneCount++;
      }

      this._setText(
        this.dom.guideSubtitle,
        `${doneCount} of ${challenges.length} Resort Milestones Completed \u00B7 \u2605 ${stats.resortRating.toFixed(1)} Rating`
      );
      if (this.dom.milestonesEyebrow) {
        this._setText(this.dom.milestonesEyebrow, `Resort Milestones (${challenges.length})`);
      }

      this._setText(
        this.dom.econCash,
        this._isSandbox() ? "\u221E Free" : `$${Math.round(stats.cash).toLocaleString()}`
      );
      this._setText(this.dom.econWarmth, `${Math.round(stats.avgWarmth)}%`);
      this._setText(this.dom.econThrill, `${Math.round(stats.avgThrill)}%`);
      this._setText(this.dom.econGrooming, `${Math.round(stats.avgPisteQuality)}%`);
      if (typeof stats.trainEtaSec === "number") {
        this._setText(
          this.dom.econTrainEta,
          stats.trainEtaSec <= 1
            ? "Swiss Train: At Platform"
            : `Next Train: ${Math.ceil(stats.trainEtaSec)}s`
        );
      } else {
        this._setText(this.dom.econTrainEta, "Swiss Train: Active");
      }

      // Active Lifts & Piste Status (in-place keyed reconciliation — zero innerHTML tear-down)
      const lifts =
        this.world && typeof this.world.getLifts === "function"
          ? this.world.getLifts() || []
          : [];
      const totalRuns =
        (stats.runCounts.green || 0) + (stats.runCounts.blue || 0) + (stats.runCounts.black || 0);
      this._setText(this.dom.liftsCountMeta, `${lifts.length} Lifts \u00B7 ${totalRuns} Rated Runs`);

      if (this.dom.liftsStatusList) {
        if (lifts.length === 0) {
          if (this._guideLiftRows.size > 0) {
            this._guideLiftRows.clear();
          }
          if (!this._guideEmptyLiftEl) {
            const empty = document.createElement("div");
            empty.className = "challenge-card";
            empty.innerHTML = `<div class="challenge-info"><div class="challenge-title">No Ski Lifts Operating Yet</div><div class="challenge-desc">Choose any of the 10 Lift Systems in Tab 2 and drag uphill!</div></div>`;
            this._guideEmptyLiftEl = empty;
          }
          if (
            this.dom.liftsStatusList.firstElementChild !== this._guideEmptyLiftEl ||
            this.dom.liftsStatusList.children.length !== 1
          ) {
            this.dom.liftsStatusList.replaceChildren(this._guideEmptyLiftEl);
          }
        } else {
          if (
            this._guideEmptyLiftEl &&
            this._guideEmptyLiftEl.parentNode === this.dom.liftsStatusList
          ) {
            this._guideEmptyLiftEl.remove();
          }
          const activeKeys = new Set();
          for (let idx = 0; idx < lifts.length; idx++) {
            const lift = lifts[idx];
            const lType = lift.type || lift.liftType || "chairlift";
            const key =
              lift.id !== undefined
                ? `id_${lift.id}`
                : `${lType}_${lift.baseR}_${lift.baseC}_${lift.topR}_${lift.topC}_${idx}`;
            activeKeys.add(key);

            const meta = LIFT_META[lType] || LIFT_META.chairlift;
            const titleStr = lift.name || `${meta.shortName} #${idx + 1}`;
            const bLv = lift.baseLevel !== undefined ? lift.baseLevel : 0;
            const tLv = lift.topLevel !== undefined ? lift.topLevel : 2;
            const subStr = `Lv ${bLv} \u2192 Lv ${tLv} \u00B7 Click to view`;

            let entry = this._guideLiftRows.get(key);
            if (!entry) {
              const row = document.createElement("div");
              row.className = "lift-row-card";

              const left = document.createElement("div");
              left.className = "lift-row-left";
              const sp = this._getLiftThumbSprite(lType, 28);
              if (sp) {
                const span = document.createElement("span");
                span.className = "lift-row-icon palette-thumb-sprite pixelated";
                span.dataset.sprite = "1";
                span.setAttribute("aria-hidden", "true");
                span.style.cssText = `--thumb-x:${sp.x.toFixed(2)}px;--thumb-y:${sp.y.toFixed(2)}px;--thumb-sheet-w:${sp.sheetW.toFixed(2)}px;--thumb-sheet-h:${sp.sheetH.toFixed(2)}px`;
                left.appendChild(span);
              } else {
                const iconUrl = this._getLiftIconDataUrl(lType);
                if (iconUrl) {
                  const img = document.createElement("img");
                  img.className = "lift-row-icon pixelated";
                  img.src = iconUrl;
                  img.alt = lType;
                  left.appendChild(img);
                }
              }

              const metaWrap = document.createElement("div");
              const titleEl = document.createElement("div");
              titleEl.className = "lift-row-title";
              const subEl = document.createElement("div");
              subEl.className = "lift-row-sub";
              metaWrap.appendChild(titleEl);
              metaWrap.appendChild(subEl);
              left.appendChild(metaWrap);

              const statusEl = document.createElement("span");
              statusEl.className = "lift-status-pill";
              statusEl.textContent = "Running";

              row.appendChild(left);
              row.appendChild(statusEl);
              entry = { row, titleEl, subEl, statusEl, liftRef: lift };
              row.addEventListener("click", () => {
                const cur = entry.liftRef || lift;
                const tr = cur.topR !== undefined ? cur.topR : cur.baseR;
                const tc = cur.topC !== undefined ? cur.topC : cur.baseC;
                if (typeof tr === "number" && typeof tc === "number") {
                  this.centerOnCell(tr, tc);
                }
              });
              this._guideLiftRows.set(key, entry);
            }

            entry.liftRef = lift;
            this._setText(entry.titleEl, titleStr);
            this._setText(entry.subEl, subStr);

            if (this.dom.liftsStatusList.children[idx] !== entry.row) {
              this.dom.liftsStatusList.insertBefore(
                entry.row,
                this.dom.liftsStatusList.children[idx] || null
              );
            }
          }

          for (const [key, entry] of this._guideLiftRows.entries()) {
            if (!activeKeys.has(key)) {
              entry.row.remove();
              this._guideLiftRows.delete(key);
            }
          }
        }
      }

      // 12 Resort Milestones (in-place keyed reconciliation)
      if (this.dom.challengesList) {
        if (this._guideChallengeCards.size !== challenges.length) {
          this._guideChallengeCards.clear();
          const frag = document.createDocumentFragment();
          for (let i = 0; i < challenges.length; i++) {
            const ch = challenges[i];
            const card = document.createElement("div");
            card.className = `challenge-card${ch.completed ? " completed" : ""}`;

            const info = document.createElement("div");
            info.className = "challenge-info";
            const titleEl = document.createElement("div");
            titleEl.className = "challenge-title";
            titleEl.textContent = `${ch.completed ? "\u2713 " : ""}${ch.title}`;
            const descEl = document.createElement("div");
            descEl.className = "challenge-desc";
            descEl.textContent = ch.desc;
            info.appendChild(titleEl);
            info.appendChild(descEl);

            const rewEl = document.createElement("span");
            rewEl.className = "challenge-reward";
            rewEl.textContent = ch.completed ? "Claimed" : `+$${ch.reward}`;

            card.appendChild(info);
            card.appendChild(rewEl);
            frag.appendChild(card);
            this._guideChallengeCards.set(ch.id, {
              card,
              titleEl,
              descEl,
              rewEl,
              completed: ch.completed,
            });
          }
          this.dom.challengesList.replaceChildren(frag);
        } else {
          for (let i = 0; i < challenges.length; i++) {
            const ch = challenges[i];
            const entry = this._guideChallengeCards.get(ch.id);
            if (!entry) continue;
            if (entry.completed !== ch.completed) {
              entry.completed = ch.completed;
              entry.card.classList.toggle("completed", ch.completed);
            }
            this._setText(entry.titleEl, `${ch.completed ? "\u2713 " : ""}${ch.title}`);
            this._setText(entry.descEl, ch.desc);
            this._setText(entry.rewEl, ch.completed ? "Claimed" : `+$${ch.reward}`);
          }
        }
      }
    }

    refreshUI(force = false, syncMinimap = force) {
      const now = performance.now();
      if (!force && now - this._lastHudSyncTime < 220) return;
      this._lastHudSyncTime = now;

      const stats = this._readStats();
      const isSandbox = this._isSandbox();
      const cashRounded = Math.max(0, Math.round(stats.cash));

      if (this.dom.statRating) {
        this._setText(this.dom.statRating, stats.resortRating.toFixed(1));
      }
      if (this.dom.mobStatRating) {
        this._setText(this.dom.mobStatRating, stats.resortRating.toFixed(1));
      }
      const cashDisplay = isSandbox ? "\u221E Free" : `$${cashRounded.toLocaleString()}`;
      if (this.dom.statCash) {
        this._setText(this.dom.statCash, cashDisplay);
      }
      if (this.dom.mobStatCash) {
        this._setText(this.dom.mobStatCash, cashDisplay);
      }
      if (
        this._lastCashValue !== null &&
        cashRounded > this._lastCashValue &&
        !isSandbox
      ) {
        if (this.dom.statCashPill) {
          this.dom.statCashPill.classList.add("pulse-gain");
          setTimeout(() => this.dom.statCashPill.classList.remove("pulse-gain"), 320);
        }
        if (this.dom.mobileVitalPill && this._isMobile) {
          this.dom.mobileVitalPill.classList.add("pulse-gain");
          setTimeout(() => this.dom.mobileVitalPill.classList.remove("pulse-gain"), 320);
        }
      }
      this._lastCashValue = cashRounded;

      if (this.dom.statSkiers) this._setText(this.dom.statSkiers, `${stats.skiersOnMountain}`);
      if (this.dom.statTown) this._setText(this.dom.statTown, `${stats.townVisitors}`);
      if (this.dom.mobStatCrowd) {
        this._setText(
          this.dom.mobStatCrowd,
          `${(stats.skiersOnMountain || 0) + (stats.townVisitors || 0)}`
        );
      }

      if (this.dom.runsGreen) this._setText(this.dom.runsGreen, `${stats.runCounts.green || 0}`);
      if (this.dom.runsBlue) this._setText(this.dom.runsBlue, `${stats.runCounts.blue || 0}`);
      if (this.dom.runsBlack) this._setText(this.dom.runsBlack, `${stats.runCounts.black || 0}`);
      if (this.dom.mobRunsGreen) {
        this._setText(this.dom.mobRunsGreen, `${stats.runCounts.green || 0}`);
      }
      if (this.dom.mobRunsBlue) {
        this._setText(this.dom.mobRunsBlue, `${stats.runCounts.blue || 0}`);
      }
      if (this.dom.mobRunsBlack) {
        this._setText(this.dom.mobRunsBlack, `${stats.runCounts.black || 0}`);
      }

      // Live Top-Left Carved Timber Dual Gauges (GPU --fill-scale, zero layout reflow)
      const warmthPct = Math.max(0, Math.min(100, Math.round(stats.avgWarmth ?? 86)));
      const thrillPct = Math.max(0, Math.min(100, Math.round(stats.avgThrill ?? 88)));
      if (this.dom.hudWarmthFill) this._setFillScale(this.dom.hudWarmthFill, warmthPct);
      if (this.dom.hudWarmthLabel) this._setText(this.dom.hudWarmthLabel, `Warmth ${warmthPct}%`);
      if (this.dom.hudThrillFill) this._setFillScale(this.dom.hudThrillFill, thrillPct);
      if (this.dom.hudThrillLabel) this._setText(this.dom.hudThrillLabel, `Thrill ${thrillPct}%`);

      const modeText = isSandbox ? "Free-Build" : "Tycoon Mode";
      if (this.dom.btnModeToggle) this.dom.btnModeToggle.classList.toggle("free-build", isSandbox);
      if (this.dom.modeLabel) this._setText(this.dom.modeLabel, modeText);
      if (this.dom.mobBtnMode) this.dom.mobBtnMode.classList.toggle("free-build", isSandbox);
      if (this.dom.mobModeLabel) this._setText(this.dom.mobModeLabel, modeText);

      // Affordability tint on visible palette cards — ONLY when cash or sandbox state changed!
      if (cashRounded !== this._lastAffordCash || isSandbox !== this._lastAffordSandbox) {
        this._lastAffordCash = cashRounded;
        this._lastAffordSandbox = isSandbox;
        for (const entry of this._cardElsById.values()) {
          const unaff = !isSandbox && entry.item.cost > cashRounded;
          if (entry.unaffordable !== unaff) {
            entry.unaffordable = unaff;
            entry.card.classList.toggle("unaffordable", unaff);
          }
          const wantCost = isSandbox ? "FREE" : entry.paidCostText || `$${entry.item.cost}`;
          if (entry.costBadgeEl && entry.costText !== wantCost) {
            entry.costText = wantCost;
            this._setText(entry.costBadgeEl, wantCost);
          }
        }
      }

      // Detect newly completed Resort Milestones if sim didn't push an event
      const challenges = this._readChallenges();
      for (let i = 0; i < challenges.length; i++) {
        const ch = challenges[i];
        if (ch.completed && !this._knownCompletedChallenges.has(ch.id)) {
          this._knownCompletedChallenges.add(ch.id);
          if (this._bootCompleted) {
            this.showToast({
              eyebrow: "Resort Milestone Unlocked",
              message: ch.title,
              reward: `+$${ch.reward}`,
            });
            if (!this.guideOpen) {
              if (this.dom.guideBadgeDot) this.dom.guideBadgeDot.classList.remove("hidden");
              if (this.dom.mobGuideDot) this.dom.mobGuideDot.classList.remove("hidden");
            }
          }
        }
      }

      // Undo / Redo state (dirty-checked)
      if (this.world && this.dom.btnUndo && this.dom.btnRedo) {
        const canUndo =
          typeof this.world.canUndo === "function"
            ? this.world.canUndo()
            : Array.isArray(this.world.undoStack)
            ? this.world.undoStack.length > 0
            : true;
        const canRedo =
          typeof this.world.canRedo === "function"
            ? this.world.canRedo()
            : Array.isArray(this.world.redoStack)
            ? this.world.redoStack.length > 0
            : true;
        if (canUndo !== this._lastCanUndo) {
          this._lastCanUndo = canUndo;
          this.dom.btnUndo.disabled = !canUndo;
          if (this.dom.mobBtnUndo) this.dom.mobBtnUndo.disabled = !canUndo;
        }
        if (canRedo !== this._lastCanRedo) {
          this._lastCanRedo = canRedo;
          this.dom.btnRedo.disabled = !canRedo;
        }
      }

      if (this.inspectedTarget) {
        this.renderInspectorCard();
      }
      if (this.guideOpen) {
        this.renderGuideDrawer();
      }
      const finaleActive =
        this.sim && typeof this.sim.isFestiveFinaleActive === "function"
          ? Boolean(this.sim.isFestiveFinaleActive())
          : now < this._finaleFallbackUntil;
      this._syncFestiveButton(finaleActive);
      if (this.renderer && typeof this.renderer.isShowcaseCameraActive === "function") {
        this._syncShowcaseButton(Boolean(this.renderer.isShowcaseCameraActive()));
      }
      this._updateZoomReadout();
      if (syncMinimap) {
        this.renderMinimap(true);
      }
    }

    // -------------------------------------------------------------------------
    // 11b. Live Isometric 2:1 Diamond Minimap (Cached Base + Live Pips & Box)
    // -------------------------------------------------------------------------
    _getMinimapProjection(cw, ch) {
      const n = (this.world && this.world.size) || 28;
      // Inner rope diamond bounds of minimap_bezel.png: N=(0.4991, 0.334), E=(0.7851, 0.5679), S=(0.4991, 0.7895), W=(0.2168, 0.5679)
      const cx = cw * 0.5005;
      const cy = ch * 0.562;
      const halfW = cw * 0.285;
      const halfH = ch * 0.228;
      const worldMaxX = n * 64;
      const worldMidY = n * 32 - 28;
      const worldHalfY = n * 32 + 56;
      return { cx, cy, halfW, halfH, worldMaxX, worldMidY, worldHalfY };
    }

    renderMinimap(force = false) {
      const mc = this.dom.minimapCanvas;
      if (!mc || !this.renderer || !this.world || this.zenMode || this.thumbMode || this._isMobile) return;
      const now = performance.now();
      if (!force && this._lastMinimapTime && now - this._lastMinimapTime < 90) return;
      this._lastMinimapTime = now;

      const rect = this._getMinimapRect();
      if (!rect || rect.width < 20 || rect.height < 20) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = Math.round(rect.width * dpr);
      const ch = Math.round(rect.height * dpr);
      if (mc.width !== cw || mc.height !== ch) {
        mc.width = cw;
        mc.height = ch;
      }

      const ctx = this._minimapCtx || (this._minimapCtx = mc.getContext("2d"));
      if (!ctx) return;

      const proj = this._getMinimapProjection(cw, ch);
      const worldVer =
        typeof this.world.version === "number" ? this.world.version : -1;

      const needBaseRebuild =
        !this._minimapBaseBuf ||
        !this._minimapBaseValid ||
        this._minimapBaseVer !== worldVer ||
        this._minimapBaseAtmo !== this.atmosphere ||
        this._minimapBaseW !== cw ||
        this._minimapBaseH !== ch;

      if (needBaseRebuild && typeof document !== "undefined") {
        if (!this._minimapBaseBuf) {
          this._minimapBaseBuf = document.createElement("canvas");
        }
        if (this._minimapBaseBuf.width !== cw || this._minimapBaseBuf.height !== ch) {
          this._minimapBaseBuf.width = cw;
          this._minimapBaseBuf.height = ch;
        }
        const bctx = this._minimapBaseBuf.getContext("2d");
        if (bctx) {
          bctx.clearRect(0, 0, cw, ch);
          // 1. Atmospheric Sky Fill inside Diamond
          bctx.fillStyle =
            this.atmosphere === "night"
              ? "#0d1b38"
              : this.atmosphere === "alpenglow"
              ? "#9f647d"
              : "#8dc0e8";
          bctx.fillRect(0, 0, cw, ch);

          // 2. Cached Offscreen Mountain Snapshot (rebuilt ONLY on world/atmo/size change)
          let drewMountain = false;
          const dstX = proj.cx - proj.halfW;
          const dstY = proj.cy - proj.halfH;
          const dstW = proj.halfW * 2;
          const dstH = proj.halfH * 2;

          if (typeof this.renderer.renderMinimapSnapshot === "function") {
            const originX =
              typeof this.renderer._staticOriginX === "number"
                ? this.renderer._staticOriginX
                : this.renderer._bufOriginX || proj.worldMaxX;
            const originY =
              typeof this.renderer._staticOriginY === "number"
                ? this.renderer._staticOriginY
                : this.renderer._bufOriginY || proj.worldHalfY - proj.worldMidY;
            const sx = Math.max(0, originX - proj.worldMaxX);
            const sy = Math.max(0, originY + proj.worldMidY - proj.worldHalfY);
            const sw = proj.worldMaxX * 2;
            const sh = proj.worldHalfY * 2;

            bctx.imageSmoothingEnabled = true;
            const res =
              this.renderer.renderMinimapSnapshot.length <= 4
                ? this.renderer.renderMinimapSnapshot(bctx, cw, ch, proj)
                : this.renderer.renderMinimapSnapshot(
                    bctx,
                    dstX,
                    dstY,
                    dstW,
                    dstH,
                    sx,
                    sy,
                    sw,
                    sh
                  );
            drewMountain = res !== false;
          } else {
            const srcBuf = this.renderer._staticTerrainBuf || this.renderer._worldBuf;
            if (srcBuf && srcBuf.width > 0 && srcBuf.height > 0) {
              const originX =
                this.renderer._staticTerrainBuf &&
                typeof this.renderer._staticOriginX === "number"
                  ? this.renderer._staticOriginX
                  : this.renderer._bufOriginX || 0;
              const originY =
                this.renderer._staticTerrainBuf &&
                typeof this.renderer._staticOriginY === "number"
                  ? this.renderer._staticOriginY
                  : this.renderer._bufOriginY || 0;
              const sx = Math.max(0, originX - proj.worldMaxX);
              const sy = Math.max(0, originY + proj.worldMidY - proj.worldHalfY);
              const sw = Math.min(srcBuf.width - sx, proj.worldMaxX * 2);
              const sh = Math.min(srcBuf.height - sy, proj.worldHalfY * 2);
              if (sw > 0 && sh > 0) {
                bctx.imageSmoothingEnabled = true;
                bctx.drawImage(srcBuf, sx, sy, sw, sh, dstX, dstY, dstW, dstH);
                drewMountain = true;
              }
            }
          }

          // 3. Subtle Night / Alpenglow Tint so Minimap Matches Active Atmosphere
          if (this.atmosphere === "night") {
            bctx.fillStyle = "rgba(8, 18, 44, 0.34)";
            bctx.fillRect(0, 0, cw, ch);
          } else if (this.atmosphere === "alpenglow") {
            bctx.fillStyle = "rgba(236, 146, 114, 0.14)";
            bctx.fillRect(0, 0, cw, ch);
          }

          this._minimapBaseValid = drewMountain;
          this._minimapBaseVer = worldVer;
          this._minimapBaseAtmo = this.atmosphere;
          this._minimapBaseW = cw;
          this._minimapBaseH = ch;
        }
      }

      // Fast 1:1 blit of cached opaque static minimap base (`cw x ch` ~ 260x170 -> < 0.03 ms)
      if (this._minimapBaseBuf && this._minimapBaseBuf.width === cw) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._minimapBaseBuf, 0, 0);
      } else {
        ctx.clearRect(0, 0, cw, ch);
      }

      // 4. Crisp Live Crowd & Gondola Telemetry Pips (batched by color, fallback coords supported)
      if (this.sim && Array.isArray(this.sim.entities)) {
        const ents = this.sim.entities;
        const scaleX = proj.halfW / proj.worldMaxX;
        const scaleY = proj.halfH / proj.worldHalfY;
        const dot = Math.max(1.5, 1.6 * dpr);
        const halfDot = dot * 0.5;

        for (let pass = 0; pass < 2; pass++) {
          const wantVehicle = pass === 1;
          ctx.fillStyle = wantVehicle ? "#f87171" : "#fef08a";
          for (let i = 0; i < ents.length; i += 2) {
            const ent = ents[i];
            if (!ent || Boolean(ent.isVehicle) !== wantVehicle) continue;
            let wx = ent.worldX;
            let wy = ent.worldY;
            if (typeof wx !== "number" || typeof wy !== "number") {
              const er = ent.r !== undefined ? ent.r : ent.row;
              const ec = ent.c !== undefined ? ent.c : ent.col;
              if (typeof er !== "number" || typeof ec !== "number") continue;
              const eu = typeof ent.u === "number" ? ent.u : 4.0;
              const ev = typeof ent.v === "number" ? ent.v : 4.0;
              wx = (ec - er) * 64 + (ev - eu) * 8;
              wy =
                (er + ec) * 32 +
                (eu + ev) * 4 -
                ((ent.z || 0) + (ent.extraZ || 0)) * 4;
            }
            const mx = proj.cx + wx * scaleX;
            const my = proj.cy + (wy - proj.worldMidY) * scaleY;
            ctx.fillRect(mx - halfDot, my - halfDot, dot, dot);
          }
        }
      }

      // 5. Golden Camera Viewport Box
      const vw = this.renderer.viewW / this.renderer.zoom;
      const vh = this.renderer.viewH / this.renderer.zoom;
      const rx = proj.cx + ((this.renderer.panX - vw * 0.5) / proj.worldMaxX) * proj.halfW;
      const ry =
        proj.cy +
        ((this.renderer.panY - vh * 0.5 - proj.worldMidY) / proj.worldHalfY) * proj.halfH;
      const rw = (vw / proj.worldMaxX) * proj.halfW;
      const rh = (vh / proj.worldHalfY) * proj.halfH;

      ctx.save();
      ctx.strokeStyle = "rgba(18, 10, 4, 0.85)";
      ctx.lineWidth = 2.6 * dpr;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 1.4 * dpr;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.restore();
    }

    _panCameraFromMinimapEvent(e) {
      const mc = this.dom.minimapCanvas;
      if (!mc || !this.renderer || !this.world) return false;
      const rect = this._getMinimapRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return false;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const proj = this._getMinimapProjection(1, 1);
      const wx = ((nx - proj.cx) / proj.halfW) * proj.worldMaxX;
      const wy = proj.worldMidY + ((ny - proj.cy) / proj.halfH) * proj.worldHalfY;

      this.setFollowEntity(false);
      this._yieldShowcaseCamera();
      this.renderer.panX = wx;
      this.renderer.panY = wy;
      if (typeof this.renderer._clampCamera === "function") {
        this.renderer._clampCamera();
      }
      this.renderMinimap(true);
      return true;
    }

    // -------------------------------------------------------------------------
    // 12. DOM, Pointer, Lift-Drag, Wheel & Keyboard Event Listeners
    // -------------------------------------------------------------------------
    _bindDomEvents() {
      this.dom.btnGuideToggle.addEventListener("click", () => {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.toggleGuide();
      });
      this.dom.btnGuideClose.addEventListener("click", () => this.toggleGuide(false));

      this.dom.btnModeToggle.addEventListener("click", () => {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        const isFree = this.toggleSandbox();
        this.showToast({
          eyebrow: isFree ? "Free-Build Sandbox Enabled" : "Resort Tycoon Economy",
          message: isFree
            ? "Unlimited Swiss Francs — build all 174 alpine varieties freely!"
            : "Earn revenue from lift tickets, rentals, mountain dining & train/heli arrivals.",
        });
      });

      this.dom.presetSelect.addEventListener("change", (e) => {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.loadPreset(e.target.value);
      });
      this.dom.btnNewIsland.addEventListener("click", () => {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.newMountain();
      });

      this.dom.atmoGroup.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-atmo]");
        if (btn && btn.dataset.atmo) {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.setAtmosphere(btn.dataset.atmo);
          return;
        }
        // Radial fallback on the 3-sector wheel (cached rect — zero layout reflow)
        const rect = this._getAtmoGroupRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;
        const dx = e.clientX - (rect.left + rect.width * 0.5);
        const dy = e.clientY - (rect.top + rect.height * 0.5);
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180 (0 = East, 90 = South, -90 = North)
        let sector = "day";
        if (deg >= 30 && deg <= 150) sector = "night";
        else if (deg > -90 && deg < 30) sector = "alpenglow";
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.setAtmosphere(sector);
      });

      if (this.dom.minimapCanvas) {
        let minimapDragging = false;
        this.dom.minimapCanvas.addEventListener("pointerdown", (e) => {
          e.stopPropagation();
          minimapDragging = true;
          if (this.dom.minimapCanvas.setPointerCapture) {
            try {
              this.dom.minimapCanvas.setPointerCapture(e.pointerId);
            } catch (_) {}
          }
          this._panCameraFromMinimapEvent(e);
        });
        this.dom.minimapCanvas.addEventListener("pointermove", (e) => {
          if (!minimapDragging) return;
          e.stopPropagation();
          this._panCameraFromMinimapEvent(e);
        });
        const stopMinimapDrag = () => {
          minimapDragging = false;
        };
        this.dom.minimapCanvas.addEventListener("pointerup", stopMinimapDrag);
        this.dom.minimapCanvas.addEventListener("pointercancel", stopMinimapDrag);
      }

      this.dom.speedGroup.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-speed]");
        if (!btn) return;
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.setSpeed(Number(btn.dataset.speed));
      });

      this.dom.btnUndo.addEventListener("click", () => this.undo());
      this.dom.btnRedo.addEventListener("click", () => this.redo());
      this.dom.btnZoomIn.addEventListener("click", () => this._zoomByFactor(1.25));
      this.dom.btnZoomOut.addEventListener("click", () => this._zoomByFactor(0.8));
      this.dom.btnZoomReset.addEventListener("click", () => this.resetCameraView());

      if (this.dom.btnFestiveFinale) {
        this.dom.btnFestiveFinale.addEventListener("click", () => {
          this.triggerFestiveFinale();
        });
      }
      if (this.dom.btnShowcaseCam) {
        this.dom.btnShowcaseCam.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.toggleShowcaseCamera();
        });
      }

      this.dom.btnSound.addEventListener("click", () => this._toggleSound());

      this.dom.btnZen.addEventListener("click", () => this.toggleZen(true));
      this.dom.btnZenRestore.addEventListener("click", () => this.toggleZen(false));
      this.dom.btnSnapshot.addEventListener("click", () => this.exportDioramaPNG());

      // Inspector Controls
      this.dom.btnInspClose.addEventListener("click", () => this.closeInspector());
      this.dom.btnInspFollow.addEventListener("click", () => {
        if (!this.inspectedTarget) return;
        if (this.inspectedTarget.kind === "entity") {
          this.setFollowEntity(!this.followEntity);
        } else if (this.inspectedTarget.kind === "lift" && this.inspectedTarget.liftRef) {
          const l = this.inspectedTarget.liftRef;
          this.centerOnCell(l.topR ?? this.inspectedTarget.r, l.topC ?? this.inspectedTarget.c);
        } else if (typeof this.inspectedTarget.r === "number") {
          this.centerOnCell(this.inspectedTarget.r, this.inspectedTarget.c);
        }
      });

      // Bottom Multi-Row Dock Controls (Single Delegated Listeners — 0 per-card closures)
      this.dom.dockTabs.addEventListener("click", (e) => {
        const tabBtn = e.target.closest("[data-tab]");
        if (!tabBtn) return;
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.selectTab(tabBtn.dataset.tab);
      });

      if (this.dom.dockSubfilters) {
        this.dom.dockSubfilters.addEventListener("click", (e) => {
          const chip = e.target && e.target.closest ? e.target.closest(".subfilter-chip[data-sub]") : null;
          if (!chip || !chip.dataset.sub) return;
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.selectSubFilter(chip.dataset.sub);
        });
      }

      if (this.dom.dockTray) {
        this.dom.dockTray.addEventListener("click", (e) => {
          const card = e.target && e.target.closest ? e.target.closest(".palette-card[data-tool-id]") : null;
          if (!card) return;
          const toolId = card.dataset.toolId;
          const item = TOOL_BY_ID.get(toolId);
          if (!item) return;
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.selectTool(this.activeTool && this.activeTool.id === toolId ? null : toolId);
          if (this.activeTool && this.activeTool.id === toolId) {
            this.showTooltip(item);
          }
        });

        this.dom.dockTray.addEventListener("pointerover", (e) => {
          const card = e.target && e.target.closest ? e.target.closest(".palette-card[data-tool-id]") : null;
          const nextId = card ? card.dataset.toolId : null;
          if (nextId === this._hoveredCardId) return;
          this._hoveredCardId = nextId;
          if (card && nextId) {
            const item = TOOL_BY_ID.get(nextId);
            if (item) this.showTooltip(item);
          } else if (this.activeTool) {
            this.showTooltip(this.activeTool);
          } else {
            this.hideTooltip();
          }
        });

        this.dom.dockTray.addEventListener("pointerout", (e) => {
          if (!this._hoveredCardId) return;
          const rel = e.relatedTarget;
          const nextCard = rel && rel.closest ? rel.closest(".palette-card[data-tool-id]") : null;
          if (!nextCard || !this.dom.dockTray.contains(nextCard)) {
            this._hoveredCardId = null;
            if (this.activeTool) {
              this.showTooltip(this.activeTool);
            } else {
              this.hideTooltip();
            }
          }
        });
      }

      this.dom.btnInspect.addEventListener("click", () => {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.selectTool(null);
      });
      this.dom.btnRotate.addEventListener("click", () => this.rotateTool());
      this.dom.btnBulldoze.addEventListener("click", () => {
        if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
        this.selectTool(this.activeTool && this.activeTool.id === "bulldoze" ? null : "bulldoze");
      });

      if (this.dom.btnGridExpand) {
        this.dom.btnGridExpand.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.cycleDockRows();
        });
      }

      if (this.dom.catalogSearch) {
        this.dom.catalogSearch.addEventListener("input", (e) => {
          this.setSearchQuery(e.target.value);
        });
        this.dom.catalogSearch.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            if (this.searchQuery.length > 0) {
              this.setSearchQuery("");
            } else {
              this.dom.catalogSearch.blur();
            }
          }
        });
      }

      if (this.dom.btnSearchClear) {
        this.dom.btnSearchClear.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.setSearchQuery("");
          if (this.dom.catalogSearch) this.dom.catalogSearch.focus();
        });
      }

      this.dom.btnDockCollapse.addEventListener("click", () => {
        this.setDockCollapsed(!this.dockCollapsed);
      });

      // Mobile-Only Responsive Controls (<= 768px)
      if (this.dom.mobileVitalPill) {
        this.dom.mobileVitalPill.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.toggleGuide();
        });
      }
      if (this.dom.btnMobileMenu) {
        this.dom.btnMobileMenu.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.toggleMobileMenu();
        });
      }
      if (this.dom.btnMobileMenuClose) {
        this.dom.btnMobileMenuClose.addEventListener("click", () => {
          this.toggleMobileMenu(false);
        });
      }
      if (this.dom.mobileSheetBackdrop) {
        this.dom.mobileSheetBackdrop.addEventListener("click", () => {
          if (this.mobileMenuOpen) this.toggleMobileMenu(false);
          if (this.guideOpen) this.toggleGuide(false);
        });
      }
      if (this.dom.mobAtmoSeg) {
        this.dom.mobAtmoSeg.addEventListener("click", (e) => {
          const btn = e.target && e.target.closest ? e.target.closest("[data-atmo]") : null;
          if (!btn || !btn.dataset.atmo) return;
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.setAtmosphere(btn.dataset.atmo);
        });
      }
      if (this.dom.mobPresetSelect) {
        this.dom.mobPresetSelect.addEventListener("change", (e) => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.loadPreset(e.target.value);
          this.toggleMobileMenu(false);
        });
      }
      if (this.dom.mobBtnNew) {
        this.dom.mobBtnNew.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.newMountain();
          this.toggleMobileMenu(false);
        });
      }
      if (this.dom.mobSpeedSeg) {
        this.dom.mobSpeedSeg.addEventListener("click", (e) => {
          const btn = e.target && e.target.closest ? e.target.closest("[data-speed]") : null;
          if (!btn) return;
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.setSpeed(Number(btn.dataset.speed));
        });
      }
      if (this.dom.mobBtnMode) {
        this.dom.mobBtnMode.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          const isFree = this.toggleSandbox();
          this.showToast({
            eyebrow: isFree ? "Free-Build Sandbox Enabled" : "Resort Tycoon Economy",
            message: isFree
              ? "Unlimited Swiss Francs — build all 174 alpine varieties freely!"
              : "Earn revenue from lift tickets, rentals, mountain dining & train/heli arrivals.",
          });
        });
      }
      if (this.dom.mobBtnFinale) {
        this.dom.mobBtnFinale.addEventListener("click", () => {
          this.toggleMobileMenu(false);
          this.triggerFestiveFinale();
        });
      }
      if (this.dom.mobBtnTour) {
        this.dom.mobBtnTour.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.toggleMobileMenu(false);
          this.toggleShowcaseCamera();
        });
      }
      if (this.dom.mobBtnGuide) {
        this.dom.mobBtnGuide.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.toggleGuide(true);
        });
      }
      if (this.dom.mobBtnSound) {
        this.dom.mobBtnSound.addEventListener("click", () => this._toggleSound());
      }
      if (this.dom.mobBtnSnapshot) {
        this.dom.mobBtnSnapshot.addEventListener("click", () => {
          this.toggleMobileMenu(false);
          this.exportDioramaPNG();
        });
      }
      if (this.dom.mobBtnZen) {
        this.dom.mobBtnZen.addEventListener("click", () => {
          this.toggleMobileMenu(false);
          this.toggleZen(true);
        });
      }
      if (this.dom.mobBtnInspect) {
        this.dom.mobBtnInspect.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.selectTool(null);
        });
      }
      if (this.dom.mobBtnRotate) {
        this.dom.mobBtnRotate.addEventListener("click", () => this.rotateTool());
      }
      if (this.dom.mobBtnBulldoze) {
        this.dom.mobBtnBulldoze.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.selectTool(
            this.activeTool && this.activeTool.id === "bulldoze" ? null : "bulldoze"
          );
        });
      }
      if (this.dom.mobBtnUndo) {
        this.dom.mobBtnUndo.addEventListener("click", () => this.undo());
      }
      if (this.dom.btnMobSearchToggle) {
        this.dom.btnMobSearchToggle.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.setMobileSearchOpen(!this._mobSearchOpen);
        });
      }
      if (this.dom.btnMobDockFold) {
        this.dom.btnMobDockFold.addEventListener("click", () => {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.setDockCollapsed(true);
        });
      }

      this.dom.btnTrayLeft.addEventListener("click", () => {
        this.dom.dockTray.scrollBy({ left: -240, behavior: "smooth" });
      });
      this.dom.btnTrayRight.addEventListener("click", () => {
        this.dom.dockTray.scrollBy({ left: 240, behavior: "smooth" });
      });
      this.dom.dockTray.addEventListener(
        "scroll",
        () => {
          this._trayScrolled =
            this.dom.dockTray.scrollTop > 0 || this.dom.dockTray.scrollLeft > 0;
          this._updateTrayScrollArrows();
        },
        { passive: true }
      );
      window.addEventListener(
        "resize",
        () => {
          this._syncMobileBreakpoint();
          this._invalidateLayoutRects();
          this._updateTrayScrollArrows();
        },
        { passive: true }
      );
      window.addEventListener("scroll", () => this._invalidateLayoutRects(), {
        passive: true,
      });
      if (typeof ResizeObserver === "function") {
        const ro = new ResizeObserver(() => this._invalidateLayoutRects());
        if (this.dom.minimapCanvas) ro.observe(this.dom.minimapCanvas);
        if (this.canvas) ro.observe(this.canvas);
      }
    }

    _flushPendingHover() {
      this._hoverRafId = 0;
      const coords = this._pendingHoverCoords;
      if (!coords) return;
      this._pendingHoverCoords = null;
      if (this.isPanning && this.pointerDown) return;
      const hit = this._pickCellFromEvent(coords);
      if (!hit) {
        this.setHoverCell(null, null);
      } else {
        this.setHoverCell(hit.r, hit.c, hit.u, hit.v);
      }
    }

    _bindCanvasEvents() {
      if (!this.canvas) return;

      this.canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (this.liftAnchor) {
          this._cancelLiftAnchor();
          this._syncRendererGhost();
        }
      });

      this.canvas.addEventListener("pointerdown", (e) => {
        if (this.audio && typeof this.audio.unlock === "function") {
          this.audio.unlock();
        }

        // 2-Finger Touch Pinch-to-Zoom & Midpoint Pan (Touch pointers only — 0 mouse impact)
        if (e.pointerType === "touch") {
          this._touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (this._touchPoints.size >= 2) {
            const pts = Array.from(this._touchPoints.values());
            this._isPinching = true;
            this._pinchPrevDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            this._pinchPrevMidX = (pts[0].x + pts[1].x) * 0.5;
            this._pinchPrevMidY = (pts[0].y + pts[1].y) * 0.5;
            this.pointerDown = false;
            this.isPanning = false;
            this.paintedCellsInStroke.clear();
            this._endStrokeBatch();
            this._cancelLiftAnchor();
            this.setHoverCell(null, null);
            this.updateToolButtons();
            return;
          }
          if (this._isPinching) return;
        }

        const wantPan =
          e.button === 1 ||
          e.button === 2 ||
          this.spaceHeld ||
          (e.button === 0 && this.activeTool === null);

        this.pointerDown = true;
        this.panStartX = e.clientX;
        this.panStartY = e.clientY;
        this.dragMovedPx = 0;

        if (wantPan) {
          this.isPanning = true;
          this.updateToolButtons();
          return;
        }

        if (e.button !== 0) return;

        const hit = this._pickCellFromEvent(e);
        if (!hit) return;
        this.setHoverCell(hit.r, hit.c, hit.u, hit.v);

        // Lift Drag-to-Build OR 2-Click Endpoint Selection (all 10 lift types)
        if (this.activeTool && this.activeTool.kind === "lift") {
          if (!this.liftAnchor) {
            this.liftAnchor = { r: hit.r, c: hit.c };
            this.liftDragging = true;
            this._updateLiftDragPreview(hit.r, hit.c);
          } else {
            const { r: r1, c: c1 } = this.liftAnchor;
            const liftType = this.activeTool.liftType || this.activeTool.id;
            this._cancelLiftAnchor();
            this.buildLift(r1, c1, hit.r, hit.c, liftType);
            this._syncRendererGhost();
          }
          return;
        }

        // Standard Click / Drag-Paint Tool (wrapped in world batch so stroke = 1 rebuild/undo)
        this._beginStrokeBatch();
        this.paintedCellsInStroke.clear();
        this.lastSculptTimeByCell.clear();
        if (
          (this.activeTool.sculptMode === "level" ||
            this.activeTool.sculptMode === "level_3x3") &&
          this.world &&
          this.world.cells
        ) {
          const cell = this.world.cells[hit.r] && this.world.cells[hit.r][hit.c];
          this.strokeTargetLevel = cell ? cell.minLevel ?? 1 : 1;
        }

        const key = `${hit.r},${hit.c}`;
        this.paintedCellsInStroke.add(key);
        this.lastSculptTimeByCell.set(key, performance.now());
        this.applyToolAt(hit.r, hit.c, { isDrag: false, targetLevel: this.strokeTargetLevel });
      });

      window.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") {
          if (this._touchPoints.has(e.pointerId)) {
            this._touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
          }
          if (this._isPinching) {
            if (this._touchPoints.size >= 2) {
              const pts = Array.from(this._touchPoints.values());
              const midX = (pts[0].x + pts[1].x) * 0.5;
              const midY = (pts[0].y + pts[1].y) * 0.5;
              const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
              const dx = midX - this._pinchPrevMidX;
              const dy = midY - this._pinchPrevMidY;
              if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) {
                this._panBy(dx, dy);
              }
              if (this._pinchPrevDist > 12 && dist > 12) {
                const factor = dist / this._pinchPrevDist;
                if (Math.abs(factor - 1) > 0.004) {
                  this._zoomByFactor(factor, midX, midY);
                }
              }
              this._pinchPrevDist = dist;
              this._pinchPrevMidX = midX;
              this._pinchPrevMidY = midY;
            }
            return;
          }
        }

        if (this.isPanning && this.pointerDown) {
          const dx = e.clientX - this.panStartX;
          const dy = e.clientY - this.panStartY;
          this.panStartX = e.clientX;
          this.panStartY = e.clientY;
          this.dragMovedPx += Math.hypot(dx, dy);
          this._panBy(dx, dy);
          return;
        }

        // Idle mouse hover: skip screenToCell over HUD; coalesce canvas hover to 1x per rAF!
        if (!this.pointerDown && !this.liftDragging && !this.liftAnchor) {
          if (e.pointerType === "touch") return;
          if (e.target !== this.canvas) {
            this._pendingHoverCoords = null;
            if (this.hoverCell !== null) {
              this.setHoverCell(null, null);
            }
            return;
          }
          this._pendingHoverCoords = { clientX: e.clientX, clientY: e.clientY };
          if (!this._hoverRafId && typeof requestAnimationFrame === "function") {
            this._hoverRafId = requestAnimationFrame(() => this._flushPendingHover());
          } else if (typeof requestAnimationFrame !== "function") {
            this._flushPendingHover();
          }
          return;
        }

        this._pendingHoverCoords = null;
        const hit = this._pickCellFromEvent(e);
        if (!hit) {
          this.setHoverCell(null, null);
          return;
        }
        this.setHoverCell(hit.r, hit.c, hit.u, hit.v);

        if (this.liftAnchor && this.activeTool && this.activeTool.kind === "lift") {
          this._updateLiftDragPreview(hit.r, hit.c);
          return;
        }

        if (this.pointerDown && this.activeTool && this.activeTool.dragPaint) {
          const key = `${hit.r},${hit.c}`;
          if (this.activeTool.kind === "sculpt") {
            const lastT = this.lastSculptTimeByCell.get(key) || 0;
            if (!this.paintedCellsInStroke.has(key) && performance.now() - lastT > 140) {
              this.paintedCellsInStroke.add(key);
              this.lastSculptTimeByCell.set(key, performance.now());
              this.applyToolAt(hit.r, hit.c, { isDrag: true, targetLevel: this.strokeTargetLevel });
            }
          } else if (!this.paintedCellsInStroke.has(key)) {
            this.paintedCellsInStroke.add(key);
            this.applyToolAt(hit.r, hit.c, { isDrag: true });
          }
        }
      });

      const finishStrokeAndSyncHud = () => {
        this._endStrokeBatch();
        if (this._hudDirty) {
          this._hudDirty = false;
          this.refreshUI(true, false);
        }
      };

      window.addEventListener("pointerup", (e) => {
        if (e.pointerType === "touch") {
          this._touchPoints.delete(e.pointerId);
          if (this._isPinching) {
            if (this._touchPoints.size === 0) {
              this._isPinching = false;
              this._pinchPrevDist = 0;
            }
            return;
          }
        }

        const wasPanning = this.isPanning;
        const moved = this.dragMovedPx;
        this.pointerDown = false;
        this.isPanning = false;
        this.paintedCellsInStroke.clear();
        finishStrokeAndSyncHud();
        this.updateToolButtons();

        // Finish Drag-to-Build Lift if dragged beyond anchor; else stay anchored for 2nd click!
        if (this.liftDragging && this.liftAnchor && this.activeTool && this.activeTool.kind === "lift") {
          this.liftDragging = false;
          const hit = this._pickCellFromEvent(e) || this.hoverCell;
          if (hit) {
            const liftType = this.activeTool.liftType || this.activeTool.id;
            const minSpan = liftType === "magic_carpet" ? 1 : 2;
            const dist = Math.abs(hit.r - this.liftAnchor.r) + Math.abs(hit.c - this.liftAnchor.c);
            if (dist >= minSpan) {
              const { r: r1, c: c1 } = this.liftAnchor;
              this._cancelLiftAnchor();
              this.buildLift(r1, c1, hit.r, hit.c, liftType);
              this._syncRendererGhost();
            }
          }
          return;
        }

        // Clean Left-Click in Inspect Mode -> Open Live Guest/Lift/Building Inspector!
        if (
          e.target === this.canvas &&
          e.button === 0 &&
          wasPanning &&
          moved < 5 &&
          this.activeTool === null
        ) {
          this.inspectAtClient(e.clientX, e.clientY);
        }
      });

      window.addEventListener("pointercancel", (e) => {
        if (e && e.pointerType === "touch") {
          this._touchPoints.delete(e.pointerId);
          if (this._touchPoints.size === 0) {
            this._isPinching = false;
            this._pinchPrevDist = 0;
          }
        }
        this.pointerDown = false;
        this.isPanning = false;
        this.liftDragging = false;
        this.paintedCellsInStroke.clear();
        finishStrokeAndSyncHud();
        this.updateToolButtons();
      });

      this.canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          this._zoomByFactor(factor, e.clientX, e.clientY);
        },
        { passive: false }
      );
    }

    _bindKeyboardEvents() {
      window.addEventListener("keydown", (e) => {
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

        if (e.code === "Space" && !e.repeat) {
          this.spaceHeld = true;
          this.updateToolButtons();
        }

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) this.redo();
          else this.undo();
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
          e.preventDefault();
          this.redo();
          return;
        }

        const k = e.key.toLowerCase();
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
          this.keysDown.add(k);
          return;
        }

        if (k === "/") {
          if (this.dom.catalogSearch && !this.zenMode) {
            e.preventDefault();
            if (this.dockCollapsed) this.dom.btnDockCollapse.click();
            this.dom.catalogSearch.focus();
          }
        } else if (k === "r") {
          this.rotateTool();
        } else if (k === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.triggerFestiveFinale();
        } else if (k === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (this.audio && typeof this.audio.playClick === "function") this.audio.playClick();
          this.toggleShowcaseCamera();
        } else if (k === "p") {
          this.setSpeed(this.simSpeed === 0 ? 1 : 0);
        } else if (k === "x") {
          this.selectTool(this.activeTool && this.activeTool.id === "bulldoze" ? null : "bulldoze");
        } else if (k === "g") {
          this.toggleGuide();
        } else if (k === "h") {
          this.toggleZen();
        } else if (k === "m") {
          this.dom.btnSound.click();
        } else if (k === "=" || k === "+") {
          this._zoomByFactor(1.2);
        } else if (k === "-") {
          this._zoomByFactor(0.84);
        } else if (k === "0") {
          this.resetCameraView();
        } else if (e.key === "Escape") {
          if (this.liftAnchor) {
            this._cancelLiftAnchor();
            this._syncRendererGhost();
          } else if (this.activeTool !== null) {
            this.selectTool(null);
          } else if (this.searchQuery.length > 0) {
            this.setSearchQuery("");
          } else if (this.inspectedTarget) {
            this.closeInspector();
          } else if (this.mobileMenuOpen) {
            this.toggleMobileMenu(false);
          } else if (this.guideOpen) {
            this.toggleGuide(false);
          } else if (
            this.renderer &&
            typeof this.renderer.isShowcaseCameraActive === "function" &&
            this.renderer.isShowcaseCameraActive()
          ) {
            this.setShowcaseCamera(false);
          } else if (this.zenMode) {
            this.toggleZen(false);
          }
        } else if (k >= "1" && k <= "5") {
          const tab = PALETTE_TABS[Number(k) - 1];
          if (tab) this.selectTab(tab.id);
        }
      });

      window.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
          this.spaceHeld = false;
          this.updateToolButtons();
        }
        this.keysDown.delete(e.key.toLowerCase());
      });

      window.addEventListener("blur", () => {
        this.spaceHeld = false;
        this.pointerDown = false;
        this.isPanning = false;
        this.liftDragging = false;
        this._touchPoints.clear();
        this._isPinching = false;
        this._pinchPrevDist = 0;
        this.keysDown.clear();
        this.paintedCellsInStroke.clear();
        this._endStrokeBatch();
        if (this._hudDirty) {
          this._hudDirty = false;
          this.refreshUI(true, false);
        }
      });
    }

    updateKeyboardPan(dtSeconds) {
      if (this.keysDown.size === 0) return;
      const speedPx = 560 * dtSeconds;
      let dx = 0;
      let dy = 0;
      if (this.keysDown.has("a") || this.keysDown.has("arrowleft")) dx += speedPx;
      if (this.keysDown.has("d") || this.keysDown.has("arrowright")) dx -= speedPx;
      if (this.keysDown.has("w") || this.keysDown.has("arrowup")) dy += speedPx;
      if (this.keysDown.has("s") || this.keysDown.has("arrowdown")) dy -= speedPx;
      if (dx !== 0 || dy !== 0) {
        this._panBy(dx, dy);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 13. Alpine Peak v2 Bootstrapping (`28x28` Grid) & Global `window.app`
  // ---------------------------------------------------------------------------
  async function bootAlpinePeak() {
    if (typeof document === "undefined") return;
    const canvas = document.getElementById("sanctuary-canvas");
    if (!canvas) return;

    const isThumbMode =
      typeof global.location !== "undefined" &&
      new URLSearchParams(global.location.search || "").get("thumb") === "1";

    if (isThumbMode && document.body) {
      document.body.classList.add("thumb-mode");
    }

    const atlas = global.SANCTUARY_ATLAS || null;
    if (atlas && typeof atlas.loadImages === "function") {
      try {
        await atlas.loadImages();
      } catch (err) {
        console.error("Failed to load SANCTUARY_ATLAS images:", err);
      }
    }

    const audio = global.SanctuaryAudio ? new global.SanctuaryAudio() : null;
    const world = global.SanctuaryWorld ? new global.SanctuaryWorld(28) : null;

    if (world) {
      if (typeof world.loadPreset === "function") {
        world.loadPreset("zermatt_grand", 202612);
      } else if (typeof world.generatePreset === "function") {
        world.generatePreset("zermatt_grand", 202612);
      }
    }

    const sim = global.SanctuarySim ? new global.SanctuarySim(world, audio) : null;
    const renderer = global.SanctuaryRenderer
      ? new global.SanctuaryRenderer(canvas, world, sim)
      : null;

    const ui = new SanctuaryUI({
      canvas,
      world,
      sim,
      renderer,
      audio,
      atlas,
      thumbMode: isThumbMode,
    });

    // Warm up resort simulation so ski tracks, aerial carriers & 160+ crowd are bustling at t=0
    if (sim && typeof sim.update === "function") {
      const steps = isThumbMode ? 24 : 6;
      for (let i = 0; i < steps; i++) {
        sim.update(0.1);
      }
      if (isThumbMode && Array.isArray(sim.floatingPopups)) {
        sim.floatingPopups.length = 0;
      }
    }

    for (const ch of ui._readChallenges()) {
      if (ch.completed) ui._knownCompletedChallenges.add(ch.id);
    }
    ui._bootCompleted = true;

    if (isThumbMode) {
      ui.toggleZen(true);
      ui.applyThumbHeroFraming();
      if (typeof global.addEventListener === "function") {
        global.addEventListener("resize", () => ui.applyThumbHeroFraming());
      }
      if (renderer && typeof renderer.render === "function") {
        renderer.render(0.016);
      }
    } else {
      ui.applyPresetHeroFraming("zermatt_grand");
      if (typeof global.addEventListener === "function") {
        global.addEventListener("resize", () => {
          if (
            ui.currentPreset === "zermatt_grand" &&
            !ui.followEntity &&
            !(
              renderer &&
              typeof renderer.isShowcaseCameraActive === "function" &&
              renderer.isShowcaseCameraActive()
            )
          ) {
            ui._updateZoomReadout();
          }
        });
      }
    }

    ui.refreshUI(true);

    // Expose Locked `window.app` Contract (#68, #78, #125 & #139)
    const app = {
      world,
      sim,
      renderer,
      audio,
      ui,
      atlas,
      catalogCount: ALL_CATALOG_ITEMS.length,
      getCatalog: () => PALETTE_TABS,
      thumbMode: isThumbMode,
      selectTool: (id) => ui.selectTool(id),
      selectTab: (tabId) => ui.selectTab(tabId),
      selectSubFilter: (subId) => ui.selectSubFilter(subId),
      setSearchQuery: (q) => ui.setSearchQuery(q),
      setDockRows: (n) => ui.setDockRows(n),
      cycleDockRows: () => ui.cycleDockRows(),
      rotateTool: () => ui.rotateTool(),
      setRotation: (rot) => ui.setRotation(rot),
      setAtmosphere: (mode) => ui.setAtmosphere(mode),
      loadPreset: (preset, seed) => ui.loadPreset(preset, seed),
      setPreset: (preset, seed) => ui.loadPreset(preset, seed),
      newMountain: () => ui.newMountain(),
      newIsland: () => ui.newMountain(),
      setSpeed: (mult) => ui.setSpeed(mult),
      toggleSandbox: () => ui.toggleSandbox(),
      toggleSandboxMode: () => ui.toggleSandbox(),
      setSandboxMode: (flag) => ui.setSandboxMode(flag),
      buildLift: (r1, c1, r2, c2, type) => ui.buildLift(r1, c1, r2, c2, type),
      applyToolAt: (r, c, opts) => ui.applyToolAt(r, c, opts),
      setHoverCell: (r, c, u, v) => ui.setHoverCell(r, c, u, v),
      inspectAt: (r, c) => ui.inspectAt(r, c),
      toggleGuide: (flag) => ui.toggleGuide(flag),
      toggleCodex: (flag) => ui.toggleGuide(flag),
      toggleZen: (flag) => ui.toggleZen(flag),
      triggerFestiveFinale: () => ui.triggerFestiveFinale(),
      toggleShowcaseCamera: () => ui.toggleShowcaseCamera(),
      setShowcaseCamera: (flag) => ui.setShowcaseCamera(flag),
      applyPresetHeroFraming: (preset) => ui.applyPresetHeroFraming(preset),
      exportDioramaPNG: () => ui.exportDioramaPNG(),
      undo: () => ui.undo(),
      redo: () => ui.redo(),
      resetView: () => ui.resetCameraView(),
      refreshUI: () => ui.refreshUI(true),
    };
    global.app = app;

    // Main Alpine Resort Loop
    // Performance: full 60fps while interacting with the canvas (pan / zoom / build / keys)
    // or running Showcase Glide / Festive Finale; otherwise world redraws at ~30fps.
    let lastTime = performance.now();
    let lastRenderTime = 0;
    let lastInteractTime = performance.now();
    const IDLE_FRAME_MS = 1000 / 30 - 2;
    const markInteract = () => {
      lastInteractTime = performance.now();
    };
    ["pointerdown", "wheel", "keydown", "resize"].forEach((evt) =>
      global.addEventListener(evt, markInteract, { passive: true })
    );
    global.addEventListener(
      "pointermove",
      (e) => {
        if (
          ui.pointerDown ||
          ui.isPanning ||
          ui.liftDragging ||
          ui.liftAnchor ||
          (e && e.target === canvas)
        ) {
          lastInteractTime = performance.now();
        }
      },
      { passive: true }
    );

    function frame(now) {
      const rawDt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      ui._flushPendingHover();
      ui.updateKeyboardPan(rawDt);

      if (sim) {
        if (typeof sim.update === "function") {
          sim.update(rawDt);
        } else if (typeof sim.tick === "function" && ui.simSpeed > 0) {
          sim.tick(rawDt * ui.simSpeed);
        }
        if (isThumbMode && Array.isArray(sim.floatingPopups) && sim.floatingPopups.length > 0) {
          sim.floatingPopups.length = 0;
        }
      }

      ui.updateFollowCamera();

      const showcaseActive = Boolean(
        renderer &&
          typeof renderer.isShowcaseCameraActive === "function" &&
          renderer.isShowcaseCameraActive()
      );
      const finaleActive = Boolean(
        (sim && typeof sim.isFestiveFinaleActive === "function" && sim.isFestiveFinaleActive()) ||
          now < ui._finaleFallbackUntil
      );
      const interacting =
        now - lastInteractTime < 400 ||
        ui.pointerDown ||
        ui._isPinching ||
        ui.keysDown.size > 0 ||
        ui.followEntity ||
        showcaseActive ||
        finaleActive;
      if (interacting || now - lastRenderTime >= IDLE_FRAME_MS) {
        const renderDt = Math.min(0.08, Math.max(0.001, (now - (lastRenderTime || now - 16)) / 1000));
        lastRenderTime = now;
        if (renderer && !renderer._ownsLoop) {
          if (typeof renderer.render === "function") {
            renderer.render(renderDt);
          } else if (typeof renderer.draw === "function") {
            renderer.draw(renderDt);
          }
        }
      }

      if (ui._hudDirty && !ui.pointerDown) {
        ui._hudDirty = false;
        ui.refreshUI(true, false);
      }
      ui.refreshUI(false);
      ui.renderMinimap(false);
      requestAnimationFrame(frame);
    }

    if (typeof setTimeout === "function") {
      setTimeout(() => ui._prewarmCatalogDom(), 16);
    }
    requestAnimationFrame(frame);
  }

  global.SanctuaryUI = SanctuaryUI;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootAlpinePeak);
    } else {
      bootAlpinePeak();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
