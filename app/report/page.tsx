'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GeminiVisionResult, IssueCategory } from '@/types'
import { CategoryBadge, SeverityDots } from '@/components/IssueBadges'
import {
  Upload, MapPin, Loader2, CheckCircle2, Sparkles, AlertCircle, Camera
} from 'lucide-react'

type Step = 'photo' | 'details' | 'location' | 'review'

const CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = [
  { value: 'pothole',       label: 'Pothole' },
  { value: 'water_leakage', label: 'Water Leakage' },
  { value: 'streetlight',   label: 'Streetlight' },
  { value: 'garbage',       label: 'Garbage' },
  { value: 'stray_animals', label: 'Stray Animals' },
  { value: 'other',         label: 'Other' },
]

export default function ReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('photo')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<GeminiVisionResult | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IssueCategory>('other')
  const [severity, setSeverity] = useState(3)

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleFileSelect = useCallback(async (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setAnalyzing(true)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const result: GeminiVisionResult = await res.json()
      setAiResult(result)
      setCategory(result.category)
      setSeverity(result.severity)
      if (!title) setTitle(result.summary)
    } catch {
      // AI analysis failed silently, user can fill manually
    } finally {
      setAnalyzing(false)
    }
  }, [title])

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const getLocation = () => {
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setLocError('Could not get location. Please enable location access.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = async () => {
    if (!imageFile || !lat || !lng) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('issue-photos')
        .upload(path, imageFile)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('issue-photos')
        .getPublicUrl(path)

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          lat,
          lng,
          image_url: publicUrl,
          ai_summary: aiResult?.summary ?? description.slice(0, 100),
          suggested_authority: aiResult?.suggested_authority ?? 'Municipal Corporation',
        }),
      })

      const issue = await res.json()
      router.push(`/issues/${issue.id}`)
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const STEPS: Step[] = ['photo', 'details', 'location', 'review']
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Report an issue</h1>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1">
              <div className={`h-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <span className="text-xs text-gray-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">

        {step === 'photo' && (
          <div>
            <h2 className="font-medium text-gray-900 mb-1">Upload a photo</h2>
            <p className="text-sm text-gray-500 mb-4">Gemini AI will auto-detect the issue type</p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {imagePreview ? (
              <div className="relative">
                <div className="relative h-52 rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                </div>
                {analyzing && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gemini is analyzing your photo…
                  </div>
                )}
                {aiResult && !analyzing && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-0.5">AI detected</p>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={aiResult.category} />
                        <SeverityDots severity={aiResult.severity} />
                      </div>
                      <p className="text-xs text-blue-700 mt-1">{aiResult.summary}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Change photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Tap to take photo or upload</span>
              </button>
            )}

            <button
              onClick={() => setStep('details')}
              disabled={!imageFile || analyzing}
              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-medium text-gray-900 mb-1">Issue details</h2>
              <p className="text-sm text-gray-500 mb-4">AI has pre-filled what it can — edit as needed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="More details about the issue…"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity — <span className="font-normal text-gray-500">{severity}/5</span>
              </label>
              <input
                type="range" min={1} max={5} step={1}
                value={severity}
                onChange={e => setSeverity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Minor</span><span>Critical</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('photo')} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">Back</button>
              <button
                onClick={() => setStep('location')}
                disabled={!title}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'location' && (
          <div>
            <h2 className="font-medium text-gray-900 mb-1">Location</h2>
            <p className="text-sm text-gray-500 mb-4">We need your location to pin this issue on the map</p>

            {lat && lng ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Location captured</p>
                  <p className="text-xs text-green-600">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={getLocation}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-8 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {locating ? (
                  <><Loader2 className="w-5 h-5 animate-spin text-blue-600" /><span className="text-sm text-gray-600">Getting location…</span></>
                ) : (
                  <><MapPin className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500">Tap to use current location</span></>
                )}
              </button>
            )}

            {locError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {locError}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep('details')} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">Back</button>
              <button
                onClick={() => setStep('review')}
                disabled={!lat || !lng}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div>
            <h2 className="font-medium text-gray-900 mb-4">Review & submit</h2>

            {imagePreview && (
              <div className="relative h-36 rounded-xl overflow-hidden mb-4">
                <Image src={imagePreview} alt="Issue" fill className="object-cover" />
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-900">{title}</span>
                <CategoryBadge category={category} />
              </div>
              {description && <p className="text-sm text-gray-500">{description}</p>}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Severity:</span>
                <SeverityDots severity={severity} />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {lat?.toFixed(4)}, {lng?.toFixed(4)}
              </div>
              {aiResult && (
                <p className="text-xs text-gray-500">
                  Authority: {aiResult.suggested_authority}
                </p>
              )}
            </div>

            {submitError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-3">
                <AlertCircle className="w-4 h-4" /> {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep('location')} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
