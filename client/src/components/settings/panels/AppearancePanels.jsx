import { useMemo, useState } from 'react';
import Modal from '../../Modal.jsx';
import Button from '../../Button.jsx';
import Input from '../../Input.jsx';
import Select from '../../Select.jsx';
import SettingsSection from '../SettingsSection.jsx';
import ColorField, { isValidHex } from '../ColorField.jsx';
import ThemePreview from '../ThemePreview.jsx';
import {
  THEME_TOKEN_FIELDS,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  FONT_SCALE_OPTIONS,
  RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  CONTAINER_OPTIONS,
  MODE_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  getPredefinedTheme,
} from '../../../config/themes.js';

const EMPTY_BUILDER = getPredefinedTheme('indigo-professional');

function Swatch({ theme, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-brand/60 ${
        active
          ? 'border-indigo-brand ring-2 ring-indigo-brand/30'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div className="flex h-12 w-full">
        <span className="flex-1" style={{ background: theme.primary }} />
        <span className="w-1/4" style={{ background: theme.accent }} />
        <span className="w-1/5" style={{ background: theme.success }} />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-sm font-semibold text-neutral-800">
          {theme.name}
        </span>
        {active && (
          <span className="shrink-0 rounded-full bg-indigo-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-brand">
            Active
          </span>
        )}
      </div>
      {children}
    </button>
  );
}

// Theme manager — activation is immediate (no save bar); custom themes are
// created/edited in a modal with a live preview + hex validation.
export function ThemePanel({
  activeTheme = 'indigo-professional',
  customThemes = [],
  predefined = [],
  onActivate,
  onCreate,
  onUpdate,
  onDelete,
  busy = false,
}) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create
  const [draft, setDraft] = useState(EMPTY_BUILDER);

  const list = predefined.length ? predefined : [];

  const invalid = useMemo(() => {
    if (!draft.name || !draft.name.trim()) return true;
    return THEME_TOKEN_FIELDS.some((f) => !isValidHex(draft[f.key]));
  }, [draft]);

  const openCreate = (base) => {
    setEditingId(null);
    setDraft({ ...(base || EMPTY_BUILDER), name: base ? `${base.name} copy` : 'My theme' });
    setBuilderOpen(true);
  };

  const openEdit = (theme) => {
    setEditingId(theme._id);
    setDraft({ ...theme });
    setBuilderOpen(true);
  };

  const saveBuilder = async () => {
    const payload = { name: draft.name.trim() };
    THEME_TOKEN_FIELDS.forEach((f) => (payload[f.key] = draft[f.key]));
    if (editingId) await onUpdate?.(editingId, payload);
    else await onCreate?.(payload);
    setBuilderOpen(false);
  };

  return (
    <SettingsSection
      title="Theme"
      description="Pick a palette or craft your own. Activating a theme applies it across the site instantly."
      actions={
        <Button size="sm" variant="secondary" onClick={() => openCreate(null)} disabled={busy}>
          + Custom theme
        </Button>
      }
    >
      {/* Predefined */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Predefined
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <Swatch
              key={t.key}
              theme={t}
              active={activeTheme === t.key}
              onClick={() => !busy && activeTheme !== t.key && onActivate?.(t.key)}
            />
          ))}
        </div>
      </div>

      {/* Custom */}
      <div className="border-t border-neutral-200 pt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Custom themes
        </h3>
        {customThemes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
            No custom themes yet. Create one to tailor the palette to your brand.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customThemes.map((t) => {
              const active = activeTheme === t._id;
              return (
                <div key={t._id} className="space-y-2">
                  <Swatch
                    theme={t}
                    active={active}
                    onClick={() => !busy && !active && onActivate?.(t._id)}
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      disabled={busy}
                      className="font-semibold text-indigo-brand hover:text-indigo-deep disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <span className="text-neutral-300">·</span>
                    <button
                      type="button"
                      onClick={() => openCreate(t)}
                      disabled={busy}
                      className="font-semibold text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                    >
                      Duplicate
                    </button>
                    <span className="text-neutral-300">·</span>
                    <button
                      type="button"
                      onClick={() => !active && onDelete?.(t._id)}
                      disabled={busy || active}
                      title={active ? 'Switch to another theme before deleting' : undefined}
                      className="font-semibold text-danger hover:text-danger/80 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Builder modal */}
      <Modal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        size="xl"
        title={editingId ? 'Edit theme' : 'Create custom theme'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBuilderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBuilder} loading={busy} disabled={invalid}>
              {editingId ? 'Save theme' : 'Create theme'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ThemePreview theme={draft} />
          <Input
            label="Theme name"
            value={draft.name || ''}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            maxLength={60}
          />
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            {THEME_TOKEN_FIELDS.map((f) => (
              <ColorField
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={draft[f.key] || ''}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              />
            ))}
          </div>
        </div>
      </Modal>
    </SettingsSection>
  );
}

// Typography, layout, mode, and button style — one backend section (appearance).
export function AppearancePanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Typography & layout"
      description="Fonts, sizing, and shape. Defaults reproduce the current look exactly."
    >
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Color mode
        </h3>
        <Select
          label="Mode"
          options={MODE_OPTIONS}
          value={value.mode || 'light'}
          onChange={(e) => patch({ mode: e.target.value })}
        />
        {(value.mode === 'dark' || value.mode === 'system') && (
          <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-700">
            The current design is optimized for light mode. Dark mode is
            scaffolded — surfaces will remain light until a full dark palette is
            enabled.
          </p>
        )}
      </div>

      <div className="grid gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-2">
        <Select
          label="Heading font"
          options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          value={value.headingFont || 'Inter'}
          onChange={(e) => patch({ headingFont: e.target.value })}
        />
        <Select
          label="Body font"
          options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          value={value.bodyFont || 'Inter'}
          onChange={(e) => patch({ bodyFont: e.target.value })}
        />
        <Select
          label="Heading weight"
          options={FONT_WEIGHT_OPTIONS}
          value={value.fontWeight || 'semibold'}
          onChange={(e) => patch({ fontWeight: e.target.value })}
        />
        <Select
          label="Font scale"
          options={FONT_SCALE_OPTIONS}
          value={value.fontScale || 'default'}
          onChange={(e) => patch({ fontScale: e.target.value })}
        />
      </div>

      <div className="grid gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-2">
        <Select
          label="Corner radius"
          options={RADIUS_OPTIONS}
          value={value.radius || 'default'}
          onChange={(e) => patch({ radius: e.target.value })}
        />
        <Select
          label="Density"
          options={DENSITY_OPTIONS}
          value={value.density || 'comfortable'}
          onChange={(e) => patch({ density: e.target.value })}
        />
        <Select
          label="Container width"
          options={CONTAINER_OPTIONS}
          value={value.containerWidth || 'standard'}
          onChange={(e) => patch({ containerWidth: e.target.value })}
        />
        <Select
          label="Button style"
          options={BUTTON_STYLE_OPTIONS}
          value={value.buttonStyle || 'solid'}
          onChange={(e) => patch({ buttonStyle: e.target.value })}
        />
      </div>
    </SettingsSection>
  );
}
