'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Hash, Plus, Pencil, Trash2, Pause, Play, AlertTriangle, Link } from 'lucide-react'
import type { MonitoredUrl, UrlCreateData, UrlUpdateData } from '@/lib/useApi'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { formatDateTime } from '@/lib/dateUtils'

interface UrlListProps {
  urls: MonitoredUrl[]
  loading: boolean
  onCreateUrl: (data: UrlCreateData) => Promise<MonitoredUrl>
  onUpdateUrl: (id: string, data: UrlUpdateData) => Promise<MonitoredUrl>
  onDeleteUrl: (id: string) => Promise<void>
  onToggleUrl: (id: string) => Promise<{ enabled: boolean }>
}

interface UrlFormData {
  url: string
  name: string
  description: string
  enabled: boolean
}

const initialFormData: UrlFormData = {
  url: '',
  name: '',
  description: '',
  enabled: true,
}

function validateUrl(url: string): string | null {
  if (!url.trim()) return 'URL ist erforderlich'
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL muss http oder https verwenden'
    }
    return null
  } catch {
    return 'Ungültiges URL-Format'
  }
}

function validateName(name: string): string | null {
  if (!name.trim()) return 'Name ist erforderlich'
  if (name.length > 255) return 'Name darf maximal 255 Zeichen haben'
  return null
}

export function UrlList({
  urls,
  loading,
  onCreateUrl,
  onUpdateUrl,
  onDeleteUrl,
  onToggleUrl,
}: UrlListProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUrl, setEditingUrl] = useState<MonitoredUrl | null>(null)
  const [deletingUrl, setDeletingUrl] = useState<MonitoredUrl | null>(null)
  const [formData, setFormData] = useState<UrlFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UrlFormData, string>>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const resetForm = () => {
    setFormData(initialFormData)
    setFormErrors({})
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (url: MonitoredUrl) => {
    setFormData({
      url: url.url,
      name: url.name,
      description: url.description || '',
      enabled: url.enabled,
    })
    setFormErrors({})
    setEditingUrl(url)
  }

  const handleSubmit = async () => {
    const errors: Partial<Record<keyof UrlFormData, string>> = {}
    const urlError = validateUrl(formData.url)
    const nameError = validateName(formData.name)

    if (urlError) errors.url = urlError
    if (nameError) errors.name = nameError

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSubmitLoading(true)
    try {
      if (editingUrl) {
        await onUpdateUrl(editingUrl.id, {
          url: formData.url,
          name: formData.name,
          description: formData.description || undefined,
          enabled: formData.enabled,
        })
        setEditingUrl(null)
      } else {
        await onCreateUrl({
          url: formData.url,
          name: formData.name,
          description: formData.description || undefined,
          enabled: formData.enabled,
        })
        setShowAddModal(false)
      }
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed'
      setFormErrors({ url: message })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUrl) return

    setActionLoading(deletingUrl.id)
    try {
      await onDeleteUrl(deletingUrl.id)
      setDeletingUrl(null)
    } catch (err) {
      console.error('Failed to delete URL:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggle = async (id: string) => {
    setActionLoading(id)
    try {
      await onToggleUrl(id)
    } catch (err) {
      console.error('Failed to toggle URL:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <LoadingSpinner size="md" message="URLs werden geladen..." className="py-16" />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Überwachte URLs</h2>
        <Button onClick={openAddModal} icon={<Plus className="w-5 h-5" />}>
          URL hinzufügen
        </Button>
      </div>

      {/* URL List */}
      {urls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-ultra rounded-2xl p-12 text-center"
        >
          <Link className="w-16 h-16 text-muted mb-4 mx-auto" />
          <h3 className="text-xl font-bold text-foreground mb-2">Keine URLs konfiguriert</h3>
          <p className="text-muted mb-6">Füge deine erste URL hinzu, um mit der Überwachung zu beginnen</p>
          <Button onClick={openAddModal}>Erste URL hinzufügen</Button>
        </motion.div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {urls.map((url, index) => (
              <motion.div
                key={url.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`
                  glass-ultra rounded-2xl p-6
                  hover:border-primary/30 transition-all duration-300
                  ${!url.enabled ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground truncate">{url.name}</h3>
                      <motion.div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          url.enabled
                            ? 'bg-success/20 text-success'
                            : 'bg-muted/20 text-muted'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className={`w-2 h-2 rounded-full ${url.enabled ? 'bg-success' : 'bg-muted'}`} />
                        {url.enabled ? 'Aktiv' : 'Pausiert'}
                      </motion.div>
                    </div>

                    {/* Description */}
                    {url.description && (
                      <p className="text-sm text-muted mb-3">{url.description}</p>
                    )}

                    {/* URL */}
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary-light hover:underline break-all block mb-4 transition-colors"
                    >
                      {url.url}
                    </a>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted">
                      {url.last_checked && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Letzter Check: {formatDateTime(url.last_checked)}
                        </div>
                      )}
                      {url.last_hash && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Hash className="w-4 h-4" />
                          {url.last_hash.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle(url.id)}
                      disabled={actionLoading === url.id}
                      className={`p-2.5 rounded-xl transition-colors ${
                        url.enabled
                          ? 'text-success hover:bg-success/10'
                          : 'text-muted hover:bg-white/10'
                      }`}
                      title={url.enabled ? 'Pausieren' : 'Fortsetzen'}
                    >
                      {url.enabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(url)}
                      className="p-2.5 rounded-xl text-primary hover:bg-primary/10 transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeletingUrl(url)}
                      className="p-2.5 rounded-xl text-error hover:bg-error/10 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || !!editingUrl}
        onClose={() => {
          setShowAddModal(false)
          setEditingUrl(null)
          resetForm()
        }}
        title={editingUrl ? 'URL bearbeiten' : 'Neue URL hinzufügen'}
        size="md"
      >
        <div className="space-y-5">
          <Input
            label="URL"
            placeholder="https://example.com/page"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            error={formErrors.url}
            required
          />

          <Input
            label="Name"
            placeholder="Meine Webseite"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Beschreibung</label>
            <textarea
              placeholder="Optionale Beschreibung..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder-muted transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-white/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Überwachung aktivieren</label>
              <p className="text-xs text-muted">Überwachung sofort nach Speichern starten</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                formData.enabled ? 'bg-primary' : 'bg-white/20'
              }`}
            >
              <motion.div
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: formData.enabled ? '24px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                setEditingUrl(null)
                resetForm()
              }}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              loading={submitLoading}
            >
              {editingUrl ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUrl}
        onClose={() => setDeletingUrl(null)}
        title="URL löschen"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Bist du sicher, dass du{' '}
            <span className="font-bold text-error">{deletingUrl?.name}</span> löschen möchtest?
          </p>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              Dies löscht permanent alle zugehörigen Checks, Screenshots und Änderungshistorie.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeletingUrl(null)}
            >
              Abbrechen
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              loading={actionLoading === deletingUrl?.id}
            >
              Löschen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
