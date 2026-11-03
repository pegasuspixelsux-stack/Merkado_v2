'use client';

import { useRef, useState } from 'react';
import {
  upload,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
} from '@imagekit/next';
import { ImagePlus, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { compressImageToWebP } from '../utils/imageCompressor';

export interface UploadedImage {
  /** Public ImageKit URL of the uploaded asset. */
  url: string;
  /** ImageKit file id: store it alongside the URL to delete or replace the file later. */
  fileId: string;
}

interface ImageUploadProps {
  /** Called once per successfully uploaded file. Save the result to Firestore here. */
  onUploaded: (image: UploadedImage) => void;
  /** ImageKit folder for the uploads. Default: /Merkado-v2 */
  folder?: string;
  /** Allow picking several files at once. Default: false */
  multiple?: boolean;
  /** Called with a readable message when something fails. */
  onError?: (message: string) => void;
  className?: string;
}

async function getAuthParams() {
  const user = auth?.currentUser;
  if (!user) throw new Error('You must be signed in to upload images.');
  const res = await fetch('/api/upload-auth', {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: '' }));
    throw new Error(error || 'Could not get upload permission.');
  }
  return (await res.json()) as {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
  };
}

function describeError(err: unknown): string {
  if (err instanceof ImageKitAbortError) return 'Upload cancelled.';
  if (err instanceof ImageKitInvalidRequestError || err instanceof ImageKitServerError) {
    return err.message || 'ImageKit rejected the upload.';
  }
  if (err instanceof ImageKitUploadNetworkError) return 'Network error while uploading.';
  return err instanceof Error ? err.message : 'Upload failed.';
}

export default function ImageUpload({
  onUploaded,
  folder = '/Merkado-v2',
  multiple = false,
  onError,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fail = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      fail('Please choose an image file.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const [i, original] of (multiple ? files : files.slice(0, 1)).entries()) {
        const prefix = files.length > 1 && multiple ? `(${i + 1}/${files.length}) ` : '';
        setProgress(0);

        setStatus(`${prefix}Optimizing…`);
        const file = await compressImageToWebP(original); // WebP, under 1 MB

        setStatus(`${prefix}Uploading…`);
        const { token, expire, signature, publicKey } = await getAuthParams();
        const result = await upload({
          file,
          fileName: file.name,
          folder,
          useUniqueFileName: true,
          token,
          expire,
          signature,
          publicKey,
          onProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
        });
        if (!result.url || !result.fileId) throw new Error('ImageKit returned no URL.');
        onUploaded({ url: result.url, fileId: result.fileId });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      fail(describeError(err));
    } finally {
      setBusy(false);
      setStatus('');
      setProgress(0);
    }
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) void handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors cursor-pointer ${
          dragging ? 'border-[#1D1D1F] bg-[#F5F5F7]' : 'border-[#000000]/15 hover:border-[#000000]/40'
        } ${busy ? 'opacity-70 cursor-wait' : ''}`}
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>
              {status}
              {progress > 0 && progress < 100 ? ` ${progress}%` : ''}
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="w-5 h-5" />
            <span>
              <span className="font-medium">Click to upload</span> or drag a photo here
            </span>
            <span className="text-xs text-[#515154]">Converted to WebP under 1 MB automatically</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
