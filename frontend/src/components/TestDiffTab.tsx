'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, Play } from 'lucide-react'
import { ChangeCard } from '@/components/ChangeCard'
import { testDiff, TestDiffResponse } from '@/lib/api'
import type { Change } from '@/lib/useApi'

export function TestDiffTab() {
  const [originalHtml, setOriginalHtml] = useState('')
  const [newHtml, setNewHtml] = useState('')
  const [result, setResult] = useState<TestDiffResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!originalHtml.trim() || !newHtml.trim()) {
      setError('Bitte beide HTML-Felder ausfüllen')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await testDiff(originalHtml, newHtml)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  // Convert TestDiffResponse to Change format for ChangeCard
  const resultAsChange: Change | null = result ? {
    id: 'test-result',
    check_id: 'test-check',
    type: (result.type as Change['type']) || 'CONTENT',
    priority: result.priority,
    confidence: result.confidence,
    description: result.description,
    diff: result.diff || undefined,
    matched_keywords: result.matched_keywords || undefined,
    created_at: new Date().toISOString(),
    url_name: 'Test-Vergleich',
  } : null

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <FlaskConical className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold gradient-text">HTML Diff Tester</h2>
        </div>
        <p className="text-muted text-base md:text-lg">
          Teste die Änderungserkennung mit eigenen HTML-Inhalten
        </p>
      </motion.div>

      {/* Input Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Original HTML */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="block text-sm font-medium text-foreground">
            Original HTML
          </label>
          <textarea
            value={originalHtml}
            onChange={(e) => setOriginalHtml(e.target.value)}
            placeholder="<html>&#10;  <body>&#10;    <h1>Alte Version</h1>&#10;  </body>&#10;</html>"
            className="w-full h-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-foreground font-mono text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                       placeholder:text-muted/50"
          />
        </motion.div>

        {/* New HTML */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label className="block text-sm font-medium text-foreground">
            Neues HTML
          </label>
          <textarea
            value={newHtml}
            onChange={(e) => setNewHtml(e.target.value)}
            placeholder="<html>&#10;  <body>&#10;    <h1>Neue Version</h1>&#10;    <p>Mit Änderungen</p>&#10;  </body>&#10;</html>"
            className="w-full h-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-foreground font-mono text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                       placeholder:text-muted/50"
          />
        </motion.div>
      </div>

      {/* Test Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center mb-8"
      >
        <button
          onClick={handleTest}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 rounded-xl
                     bg-gradient-to-r from-primary to-primary-dark
                     text-white font-semibold text-lg
                     hover:shadow-lg hover:shadow-primary/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300"
        >
          <Play className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analysiere...' : 'Diff Testen'}
        </button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-error/20 border border-error/50 text-error text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Result Section */}
      {resultAsChange && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-foreground">Ergebnis</h3>

          {result?.has_changed ? (
            <ChangeCard change={resultAsChange} />
          ) : (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-muted text-lg">Keine Änderungen erkannt</p>
              <p className="text-sm text-muted/70 mt-2">
                Die beiden HTML-Inhalte sind identisch oder die Unterschiede sind nicht signifikant.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <h3 className="font-semibold text-foreground mb-3">Hinweise</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li>• Die Analyse verwendet dieselbe Logik wie das echte Monitoring</li>
          <li>• Keywords wie &quot;Warteliste&quot;, &quot;Anmeldung&quot;, &quot;Formular&quot; werden als kritisch erkannt</li>
          <li>• HTML-Formulare (&lt;form&gt;, &lt;input&gt;) werden als hochprioritär eingestuft</li>
          <li>• Der Diff zeigt nur relevante Änderungen nach Bereinigung von Scripts und Styles</li>
        </ul>
      </motion.div>
    </div>
  )
}
