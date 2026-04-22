import { useRef, useState } from 'react'
import type { AppState } from '../../types'
import { api } from '../../api'

interface Props {
  state: AppState
  update: (p: Partial<AppState>) => void
  next: () => void
  back: () => void
}

export default function PhotoStep({ state, update, next, back }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    setPreviews(p => [...p, ...urls])
    setUploading(true)
    try {
      const ids = await api.uploadPhotos(files)
      update({ photoIds: [...state.photoIds, ...ids] })
    } catch {
      // Photos are optional — silently ignore upload errors
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-parchment mb-2">Got backyard photos?</h1>
        <p className="text-wood-400 text-sm">Optional — helps the agent understand your space, existing features, and style</p>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload backyard photos — click or drag files here"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-surface-500 rounded-2xl bg-surface-800 hover:bg-surface-700 transition-colors cursor-pointer p-12 text-center mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 focus-visible:border-wood-500"
      >
        <div className="w-14 h-14 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-wood-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-wood-300 font-medium text-sm mb-1">Drop photos here or click to browse</p>
        <p className="text-wood-600 text-xs">JPG, PNG, HEIC — any angle of your backyard</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {previews.map((src, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden border border-surface-600 relative">
              <img src={src} alt={`Uploaded backyard photo ${i + 1}`} className="w-full h-full object-cover" />
              {uploading && i >= previews.length - 1 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-wood-300 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skip notice */}
      <div className="bg-surface-800 border border-surface-600 rounded-xl px-5 py-4 mb-8 flex gap-3 items-start">
        <svg className="w-4 h-4 text-wood-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-wood-400 leading-relaxed">
          You can skip this step — the agent will design based on your boundaries and preferences alone.
          Photos help it understand context like slopes, existing structures, and sight lines.
        </p>
      </div>

      {/* Nav */}
      <div className="flex justify-between">
        <button
          onClick={back}
          className="px-6 py-3 text-wood-500 text-sm font-medium hover:text-wood-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 rounded-xl cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={next}
          className="px-8 py-3 bg-wood-500 text-white rounded-xl font-medium text-sm hover:bg-wood-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-300 ring-offset-2 ring-offset-surface-900 cursor-pointer"
        >
          {previews.length > 0 ? 'Continue with photos' : 'Skip photos'} →
        </button>
      </div>
    </div>
  )
}
