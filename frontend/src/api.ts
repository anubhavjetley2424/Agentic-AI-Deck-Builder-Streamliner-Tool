import type { DesignBrief, DesignResult, DesignResultV2, Template, FamilyCatalog, FloorPlanResult, DeckDesignConfig } from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  health: () => request<{ status: string; revitConnected: boolean }>('/health'),

  geocode: (address: string) =>
    request<{ lat: number; lng: number; displayName: string }>('/geocode', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  revitStatus: () =>
    request<{ connected: boolean; levelId: number | null }>('/revit/status'),

  getMaterials: () =>
    request<{ materials: { name: string; id: number }[] }>('/revit/materials'),

  checkColumnMaterials: (columnStyle: string) =>
    request<{
      revitConnected: boolean
      columnStyle: string
      materialCheck: Record<string, {
        available: boolean
        recommended: boolean
        matchingRevitMaterials: string[]
      }>
      totalRevitMaterials: number
    }>(`/revit/column-materials/${columnStyle}`),

  getStairTypes: () =>
    request<{ types: string[] }>('/revit/stair-types'),

  getRailingTypes: () =>
    request<{ types: string[] }>('/revit/railing-types'),

  getTemplates: () =>
    request<{ templates: Template[] }>('/templates'),

  getCatalog: () =>
    request<{ catalog: FamilyCatalog }>('/catalog'),

  uploadPhotos: async (files: FileList): Promise<string[]> => {
    const form = new FormData()
    for (const f of Array.from(files)) form.append('files', f)
    const res = await fetch(BASE + '/photos/upload', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.photoIds
  },

  generate: (brief: DesignBrief) =>
    request<DesignResult>('/design/generate', {
      method: 'POST',
      body: JSON.stringify({ brief }),
    }),

  refine: (sessionId: string, feedback: string) =>
    request<DesignResult>('/design/refine', {
      method: 'POST',
      body: JSON.stringify({ sessionId, feedback }),
    }),

  analyzeFloorPlan: async (file: File): Promise<FloorPlanResult> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(BASE + '/floorplan/analyze', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Floor plan analysis failed')
    return res.json()
  },

  generateDesignV2: (config: DeckDesignConfig) =>
    request<DesignResultV2>('/design/generate-v2', {
      method: 'POST',
      body: JSON.stringify({ config }),
    }),

  refineDesignV2: (sessionId: string, feedback: string) =>
    request<DesignResultV2>('/design/refine-v2', {
      method: 'POST',
      body: JSON.stringify({ sessionId, feedback }),
    }),
}
