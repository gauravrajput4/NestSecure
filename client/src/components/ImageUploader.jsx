import { useRef, useState } from 'react';
import { uploadPGImages, removePGImage } from '../services/uploadService.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from './Button.jsx';

const MAX = 8;
const MAX_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

// Owner tool: drag-and-drop gallery manager for one PG.
// Uploads go straight to Cloudinary via the backend; the parent keeps the
// returned image list in sync through onChange.
export default function ImageUploader({ pgId, images = [], onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const remaining = MAX - images.length;

  const send = async (fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" is over ${MAX_MB}MB`);
      return;
    }
    if (files.length > remaining) {
      toast.error(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} allowed`);
      return;
    }

    try {
      setBusy(true);
      const res = await uploadPGImages(pgId, files);
      onChange(res.images);
      toast.success(`Added ${files.length} photo${files.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const drop = async (url) => {
    try {
      const res = await removePGImage(pgId, url);
      onChange(res.images);
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      {/* Existing photos */}
      {images.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg bg-ink/5"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => drop(url)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {remaining > 0 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            send(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            dragging
              ? 'border-indigo-brand bg-indigo-brand/5'
              : 'border-ink/20 hover:border-indigo-brand/60 hover:bg-paper'
          }`}
        >
          <span className="text-3xl">📷</span>
          <p className="mt-2 font-semibold text-ink">
            {busy ? 'Uploading…' : 'Drop photos or click to upload'}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            JPG, PNG, WebP or AVIF · up to {MAX_MB}MB · {remaining} slot
            {remaining === 1 ? '' : 's'} left
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => send(e.target.files)}
          />
        </div>
      ) : (
        <p className="rounded-xl bg-paper px-4 py-3 text-center text-sm text-ink/60">
          Gallery full — {MAX} photos is the maximum.
        </p>
      )}
    </div>
  );
}
