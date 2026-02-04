'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MonitoredUrl, UrlCreateData, UrlUpdateData } from '@/lib/useApi'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

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
  if (!url.trim()) return 'URL is required'
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must use http or https protocol'
    }
    return null
  } catch {
    return 'Invalid URL format'
  }
}

function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required'
  if (name.length > 255) return 'Name must be 255 characters or less'
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-muted">Loading URLs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Monitored URLs</h2>
        <Button onClick={openAddModal} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }>
          Add URL
        </Button>
      </div>

      {/* URL List */}
      {urls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-ultra rounded-2xl p-12 text-center"
        >
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No URLs configured</h3>
          <p className="text-muted mb-6">Add your first URL to start monitoring</p>
          <Button onClick={openAddModal}>Add Your First URL</Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
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
                        {url.enabled ? 'Active' : 'Paused'}
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Last check: {new Date(url.last_checked).toLocaleString()}
                        </div>
                      )}
                      {url.last_hash && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
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
                      title={url.enabled ? 'Pause monitoring' : 'Resume monitoring'}
                    >
                      {url.enabled ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(url)}
                      className="p-2.5 rounded-xl text-primary hover:bg-primary/10 transition-colors"
                      title="Edit URL"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeletingUrl(url)}
                      className="p-2.5 rounded-xl text-error hover:bg-error/10 transition-colors"
                      title="Delete URL"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
        title={editingUrl ? 'Edit URL' : 'Add New URL'}
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
            placeholder="My Website"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder-muted transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-white/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Enable Monitoring</label>
              <p className="text-xs text-muted">Start monitoring immediately after saving</p>
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
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              loading={submitLoading}
            >
              {editingUrl ? 'Save Changes' : 'Add URL'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUrl}
        onClose={() => setDeletingUrl(null)}
        title="Delete URL"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Are you sure you want to delete{' '}
            <span className="font-bold text-error">{deletingUrl?.name}</span>?
          </p>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
            <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-warning">
              This will permanently delete all associated checks, screenshots, and change history.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeletingUrl(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              loading={actionLoading === deletingUrl?.id}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
