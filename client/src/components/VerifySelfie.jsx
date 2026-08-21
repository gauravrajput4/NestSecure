import { useRef, useState, useEffect, useCallback } from 'react';
import { uploadVerification } from '../services/uploadService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from './Button.jsx';

// Live-selfie identity check. Opens the webcam, captures a still to a canvas,
// and posts the JPEG blob to /upload/verify. Falls back to a file picker when
// the camera is unavailable (blocked permission, no device, insecure origin).
export default function VerifySelfie() {
  const { user, patchUser } = useAuth();
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const [live, setLive] = useState(false);
  const [preview, setPreview] = useState(null); // { blob, url }
  const [busy, setBusy] = useState(false);
  const verified = user?.verificationStatus === 'VERIFIED';

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  // Always release the camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setLive(true);
      setPreview(null);
    } catch {
      toast.error('Camera unavailable — upload a photo instead');
      fileRef.current?.click();
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPreview({ blob, url: URL.createObjectURL(blob) });
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo is over 5MB');
      return;
    }
    setPreview({ blob: file, url: URL.createObjectURL(file) });
  };

  const submit = async () => {
    if (!preview) return;
    try {
      setBusy(true);
      const res = await uploadVerification(preview.blob);
      patchUser({
        verificationStatus: res.verificationStatus,
        verificationPhoto: res.verificationPhoto,
        verifiedAt: res.verifiedAt,
      });
      toast.success('Identity verified ✓');
      setPreview(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-display font-bold text-lg sm:text-xl text-ink">
          Identity Verification
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
            verified
              ? 'bg-success/10 text-success'
              : 'bg-warning/15 text-warning'
          }`}
        >
          {verified ? '✓ Verified' : 'Not verified'}
        </span>
      </div>

      {verified ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {user.verificationPhoto && (
            <img
              src={user.verificationPhoto}
              alt="Your verification selfie"
              className="h-20 w-20 rounded-xl object-cover shrink-0"
            />
          )}
          <p className="text-sm text-ink/70">
            Your identity was confirmed
            {user.verifiedAt
              ? ` on ${new Date(user.verifiedAt).toLocaleDateString('en-IN')}`
              : ''}
            . Owners can trust that your booking is genuine.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink/60 mb-4">
            Take a quick live selfie so PG owners know you're a real person. Look
            straight at the camera in good light.
          </p>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl2 bg-ink/5">
            {/* Live feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${live ? '' : 'hidden'}`}
            />
            {/* Captured still */}
            {preview && (
              <img
                src={preview.url}
                alt="Selfie preview"
                className="h-full w-full object-cover"
              />
            )}
            {/* Idle placeholder */}
            {!live && !preview && (
              <div className="flex h-full flex-col items-center justify-center text-ink/30">
                <span className="text-5xl">🤳</span>
                <span className="mt-2 text-sm">No photo yet</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-5 flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3">
            {!live && !preview && (
              <>
                <Button onClick={startCamera} className="w-full sm:w-auto">
                  Open camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="w-full sm:w-auto"
                >
                  Upload instead
                </Button>
              </>
            )}
            {live && (
              <>
                <Button onClick={capture} className="w-full sm:w-auto">
                  📸 Capture
                </Button>
                <Button
                  variant="ghost"
                  onClick={stopCamera}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </>
            )}
            {preview && (
              <>
                <Button
                  onClick={submit}
                  loading={busy}
                  className="w-full sm:w-auto"
                >
                  Submit for verification
                </Button>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setPreview(null);
                    startCamera();
                  }}
                >
                  Retake
                </Button>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={pickFile}
          />
        </>
      )}
    </div>
  );
}
