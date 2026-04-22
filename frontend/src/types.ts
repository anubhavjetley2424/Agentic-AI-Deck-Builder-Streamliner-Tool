export interface LatLng { lat: number; lng: number }

export interface BoundingBox {
  nw: LatLng; se: LatLng
  widthFt: number; depthFt: number
}

export interface Zone {
  id: string
  label: string
  zoneType: string   // 'main' | 'dining' | 'bbq' | 'firepit' | 'lounge' | 'pergola' | 'entry' | 'custom'
  x: number; y: number       // 0–1 normalised within deck boundary
  width: number; height: number
  elevation: number          // ft; negative = sunken
  hasCover: boolean
  hasFirepit: boolean
}

export interface StairConnection {
  id: string
  fromId: string   // zone id or 'ground'
  toId: string
  style: 'wide' | 'modern' | 'narrow'
}

export interface ColumnConfig {
  material: 'timber' | 'steel' | 'composite'
  profile: '90x90' | '140x140' | '90r' | '140r'
  spacingFt: number
}

export interface CatalogEntry {
  id: string; name: string; brand: string; description: string
  revitMaterialName: string; texturePreview: string | null
  rfaFiles: string[]; revitComponents: Record<string, string>
  adsklib?: string | null
  category: 'decking' | 'railing' | 'pergola' | 'ceiling'
  componentCount?: number
}

export interface FamilyCatalog {
  decking: CatalogEntry[]; railings: CatalogEntry[]
  pergolas: CatalogEntry[]; ceiling: CatalogEntry[]
}

export interface DesignBrief {
  address: string
  bboxWidthFt: number; bboxDepthFt: number
  deckMode: 'single' | 'multi'
  template: string; style: string
  floorMaterial: string; railingType: string
  columnType: string; stairType: string
  hasPergola: boolean; hasFirepit: boolean
  zones: Zone[]
  stairConnections: StairConnection[]
  columns: ColumnConfig
  photoIds: string[]
  deckingId: string; railingId: string; pergolaId: string; ceilingId: string
}

export interface DesignResult {
  sessionId: string; screenshotUrls: string[]
  summary: string; iteration: number
}

export interface Template {
  id: string; name: string; tiers: number; description: string
}

export interface AppState {
  step: number
  address: string
  geocoded: LatLng | null
  sitePlanUrl: string | null   // uploaded site plan data-URL
  propWidthM: number           // property width in metres
  propDepthM: number           // property depth in metres
  bbox: BoundingBox | null
  photoIds: string[]
  brief: Partial<DesignBrief>
  result: DesignResult | null
  feedback: string
  loading: boolean
  error: string | null
}

// ── Floor Plan Analysis ──────────────────────────────────────────

export interface RoomDetection {
  name: string
  x_pct: number
  y_pct: number
  width_pct: number
  height_pct: number
  floor: 'ground' | 'first'
}

export interface OutdoorSpace {
  name: string
  x_pct: number
  y_pct: number
  width_pct: number
  height_pct: number
  suitable_for_deck: boolean
  notes: string
}

export interface DeckSuggestion {
  x_pct: number
  y_pct: number
  width_pct: number
  height_pct: number
  reason: string
}

export interface FloorPlanAnalysis {
  property_width_m: number
  property_depth_m: number
  house_width_m: number
  house_depth_m: number
  rooms: RoomDetection[]
  outdoor_spaces: OutdoorSpace[]
  deck_suggestions: DeckSuggestion[]
  notes: string
}

export interface FloorPlanResult {
  success: boolean
  fileId: string
  fileUrl: string
  analysis: FloorPlanAnalysis
  error?: string
}

// ── Deck Design Config ───────────────────────────────────────────

export type ComponentFinish = 'matte' | 'satin' | 'gloss' | 'textured' | 'raw'

export interface FeatureWallConfig {
  enabled: boolean
  material: string
  finish: ComponentFinish
  paint?: string | null
  shape?: string
  sides: ('north' | 'south' | 'east' | 'west')[]
}

/** Per-level styling — each deck level has full independence */
export interface LevelStyling {
  columns: string       // column style id
  columnMaterial: string
  columnFinish: ComponentFinish
  columnPaint?: string | null
  railing: string       // railing style id
  railingMaterial: string
  railingFinish: ComponentFinish
  railingPaint?: string | null
  decking: string       // decking material id
  deckingPattern: string
  deckingFinish: ComponentFinish
  deckingPaint?: string | null
  hasRoof: boolean
  roofStyle?: string
  roofMaterial?: string
  roofFinish?: ComponentFinish
  roofPaint?: string | null
  ceilingMaterial?: string
  ceilingShape?: string
  ceilingFinish?: ComponentFinish
  ceilingPaint?: string | null
  featureWall?: FeatureWallConfig
}

export interface DeckLevel {
  id: string
  name: string
  elevation_ft: number
  x_pct: number       // 0-100 within deck area canvas
  y_pct: number
  width_pct: number
  height_pct: number
  color: string        // display colour for this level
  styling: LevelStyling
}

/** Zone within a single-level deck (sub-area inside the main deck) */
export interface DeckZone {
  id: string
  name: string            // "Zone 1", "Zone 2" — user can rename
  zoneType: string        // User-selectable feature type
  x_pct: number           // 0-100 within deck area
  y_pct: number
  width_pct: number
  height_pct: number
  color: string
}

/** Stair connection between levels/zones with individual styling */
export interface StairConnectionV2 {
  id: string
  fromId: string       // level id or 'ground'
  toId: string         // level id or 'ground'
  style: string        // cascading, standard, floating, wrap
  width: 'standard' | 'wide' | 'extra-wide'
  material?: string
  position_pct?: number  // 0-100 — position along shared edge (for slideable stairs)
  edge?: 'top' | 'bottom' | 'left' | 'right'  // which edge the stair sits on
}

export interface DeckVertex {
  x_pct: number
  y_pct: number
  curved?: boolean   // edge FROM this vertex to next is an arc
}

export interface DeckArea {
  x_pct: number       // bounding-box (computed from vertices for backend)
  y_pct: number
  width_pct: number
  height_pct: number
  vertices: DeckVertex[]
}

export interface DeckStyles {
  stairs: string
  columns: string
  railing: string
  roof: string
}

export interface DeckMaterials {
  decking: string
  railing: string
  columns: string
  roof: string
}

export interface DeckDesignConfig {
  property_width_m: number
  property_depth_m: number
  deck_area: DeckArea
  deck_mode: 'single' | 'multi'
  levels: DeckLevel[]
  zones: DeckZone[]
  stairConnections: StairConnectionV2[]
}

export interface DesignResultV2 {
  sessionId: string
  params: Record<string, unknown>
  screenshotUrls: string[]
  summary: string
  iteration: number
}

// Keep backward compat - unused but referenced
export interface EntryExitPoint {
  id: string
  x_pct: number
  y_pct: number
  type: 'entry' | 'exit' | 'both'
  label: string
}
