'use client';

import { useState, useRef } from 'react';
import {
  Upload, Trash2, Download, Eye, EyeOff,
  FileText, Image, Film, Archive, File,
} from 'lucide-react';
import { useFiles, useUploadFile, useUpdateFile, useDeleteFile } from '@/hooks/useFiles';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { FrelyFile } from '@/types/file';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (mimeType.startsWith('video/')) return <Film className="h-5 w-5 text-purple-500" />;
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-5 w-5 text-amber-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

// ─────────────────────────────────────────
// IMAGE PREVIEW MODAL
// ─────────────────────────────────────────
function ImagePreviewModal({ file, onClose }: { file: FrelyFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm"
        >
          Close
        </button>
        <img
          src={file.cloudinaryUrl}
          alt={file.name}
          className="max-w-full max-h-[80vh] rounded-lg object-contain"
        />
        <p className="text-white text-center text-sm mt-2 opacity-70">{file.name}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// FILE BROWSER
// ─────────────────────────────────────────
interface FileBrowserProps {
  projectId?: string;
  clientId?:  string;
}

export function FileBrowser({ projectId, clientId }: FileBrowserProps) {
  const params      = { projectId, clientId };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging,      setDragging]      = useState(false);
  const [previewFile,   setPreviewFile]   = useState<FrelyFile | null>(null);
  const [deleteFile,    setDeleteFile]    = useState<FrelyFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const { data, isLoading }  = useFiles(params);
  const uploadFile            = useUploadFile(params);
  const updateFile            = useUpdateFile(params);
  const deleteFileMutation    = useDeleteFile(params);

  const files: FrelyFile[] = data?.files || [];

  const handleFiles = async (fileList: FileList) => {
    setUploadProgress(true);
    for (const file of Array.from(fileList)) {
      await uploadFile.mutateAsync({ file });
    }
    setUploadProgress(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (!deleteFile) return;
    await deleteFileMutation.mutateAsync(deleteFile.id);
    setDeleteFile(null);
  };

  const toggleVisibility = async (file: FrelyFile) => {
    await updateFile.mutateAsync({
      id:    file.id,
      input: { isClientVisible: !file.isClientVisible },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Files
          {files.length > 0 && (
            <span className="ml-2 text-xs text-gray-400 font-normal">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          )}
        </h3>
        <Button
          size="sm"
          variant="secondary"
          loading={uploadProgress}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed transition-colors ${
          dragging ? 'border-primary bg-primary-50' : 'border-gray-200'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div
            className="py-10 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Drop files here or click to upload</p>
            <p className="text-xs text-gray-300 mt-1">Max 50MB per file</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                {/* Icon or thumbnail */}
                <div className="shrink-0">
                  {isImage(file.mimeType) ? (
                    <img
                      src={file.cloudinaryUrl}
                      alt={file.name}
                      className="w-10 h-10 rounded object-cover cursor-pointer"
                      onClick={() => setPreviewFile(file)}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file.mimeType)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatSize(file.size)} · {formatDate(file.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Client visibility toggle */}
                  <button
                    onClick={() => toggleVisibility(file)}
                    title={file.isClientVisible ? 'Hide from client' : 'Show to client'}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {file.isClientVisible
                      ? <Eye className="h-4 w-4 text-green-500" />
                      : <EyeOff className="h-4 w-4" />
                    }
                  </button>

                  {/* Download */}
                  <a
                    href={file.cloudinaryUrl}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteFile(file)}
                    className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Drop more files area */}
            <div
              className="px-4 py-3 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-xs text-gray-400">
                <Upload className="h-3 w-3 inline mr-1" />
                Drop more files or click to upload
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {previewFile && (
        <ImagePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      {deleteFile && (
        <ConfirmModal
          title="Delete file"
          description={`Are you sure you want to delete "${deleteFile.name}"? This cannot be undone.`}
          confirmLabel="Delete file"
          loading={deleteFileMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteFile(null)}
        />
      )}
    </div>
  );
}
