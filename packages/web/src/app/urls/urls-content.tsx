'use client';

import { motion } from 'framer-motion';
import { Globe, Plus, Edit, Trash2, Save, X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import type { MonitoredUrl } from '@boat-monitor/shared';

interface UrlsContentProps {
  initialUrls: MonitoredUrl[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function UrlsContent({ initialUrls }: UrlsContentProps) {
  const [urls, setUrls] = useState<MonitoredUrl[]>(initialUrls);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MonitoredUrl>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newUrlForm, setNewUrlForm] = useState({
    url: '',
    name: '',
    description: '',
    checkInterval: 5,
    enabled: true
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = (url: MonitoredUrl) => {
    setEditingId(url.id);
    setEditForm(url);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const response = await fetch('/api/urls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm })
      });

      if (!response.ok) throw new Error('Failed to update');

      const { data } = await response.json();
      setUrls(urls.map(u => u.id === editingId ? data : u));
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Fehler beim Speichern der URL');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du diese URL wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/urls?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      setUrls(urls.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Fehler beim Löschen der URL');
    }
  };

  const handleAddUrl = async () => {
    if (!newUrlForm.url || !newUrlForm.name) {
      alert('URL und Name sind erforderlich');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUrlForm)
      });

      if (!response.ok) throw new Error('Failed to create');

      const { data } = await response.json();
      setUrls([...urls, data]);
      setIsAdding(false);
      setNewUrlForm({
        url: '',
        name: '',
        description: '',
        checkInterval: 5,
        enabled: true
      });
    } catch (error) {
      console.error('Failed to create:', error);
      alert('Fehler beim Erstellen der URL');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50">
            <Globe className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
          Überwachte URLs
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Verwalte die zu überwachenden Webseiten
        </p>
      </motion.div>

      {/* Add URL Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Neue URL hinzufügen</span>
        </button>
      </motion.div>

      {/* Add URL Form */}
      {isAdding && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-6 space-y-4"
        >
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Neue URL hinzufügen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                URL *
              </label>
              <input
                type="url"
                value={newUrlForm.url}
                onChange={(e) => setNewUrlForm({ ...newUrlForm, url: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name *
              </label>
              <input
                type="text"
                value={newUrlForm.name}
                onChange={(e) => setNewUrlForm({ ...newUrlForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                placeholder="z.B. Konstanz Bootsliegeplatz"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Beschreibung
              </label>
              <input
                type="text"
                value={newUrlForm.description}
                onChange={(e) => setNewUrlForm({ ...newUrlForm, description: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                placeholder="Optionale Beschreibung"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Prüfintervall (Minuten)
              </label>
              <input
                type="number"
                min="1"
                value={newUrlForm.checkInterval}
                onChange={(e) => setNewUrlForm({ ...newUrlForm, checkInterval: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2 flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUrlForm.enabled}
                  onChange={(e) => setNewUrlForm({ ...newUrlForm, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aktiviert</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsAdding(false)}
              disabled={saving}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddUrl}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Speichert...' : 'Speichern'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* URLs List */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {urls.map((url, index) => (
          <motion.div
            key={url.id}
            variants={item}
            className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6"
          >
            {editingId === url.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL</label>
                    <input
                      type="url"
                      value={editForm.url || ''}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Beschreibung</label>
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prüfintervall (Minuten)</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.checkInterval || 5}
                      onChange={(e) => setEditForm({ ...editForm, checkInterval: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2 flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.enabled !== undefined ? editForm.enabled : true}
                        onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aktiviert</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Abbrechen</span>
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Speichert...' : 'Speichern'}</span>
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {url.name}
                    </h3>
                    {url.enabled ? (
                      <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Aktiv</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                        <XCircle className="h-3 w-3" />
                        <span>Deaktiviert</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                    {url.url}
                  </p>

                  {url.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      {url.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Alle {url.checkInterval} Minuten</span>
                    </div>
                    {url.lastChecked && (
                      <span>
                        Zuletzt: {new Date(url.lastChecked).toLocaleString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(url)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(url.id)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
