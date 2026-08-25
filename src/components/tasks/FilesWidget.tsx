import React, { useState, useEffect, useRef } from 'react';
import { dbService, type TaskFile } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Paperclip, Trash2, Loader2, Download, AlertCircle } from 'lucide-react';

interface FilesWidgetProps {
  taskId: string;
  onFilesChange: () => void;
}

const MAX_FILE_SIZE_MB = 5;

export const FilesWidget: React.FC<FilesWidgetProps> = ({ taskId, onFilesChange }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [taskId]);

  const loadFiles = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await dbService.getTaskFiles(user.id, taskId);
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!user || !selectedFile) return;

    setUploadError(null);

    // Validate size limit (5MB)
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setUploadError(`File is too large (${fileSizeMB.toFixed(1)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      // Simulate progress bar increments
      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return null;
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 100);

      // Perform actual storage upload
      const { storagePath } = await dbService.uploadFileToStorage(user.id, selectedFile);
      
      clearInterval(interval);
      setUploadProgress(100);

      // Save database metadata reference
      const newFile = await dbService.createTaskFile({
        task_id: taskId,
        user_id: user.id,
        file_name: selectedFile.name,
        storage_path: storagePath,
        mime_type: selectedFile.type || 'application/octet-stream',
        file_size: selectedFile.size
      });

      setFiles(prev => [...prev, newFile]);
      onFilesChange();

      // Clear states
      setTimeout(() => setUploadProgress(null), 800);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload file. Please try again.');
      setUploadProgress(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = (file: TaskFile) => {
    const publicUrl = dbService.getFileDownloadUrl(file.storage_path);
    if (publicUrl === '#mock-download') {
      alert(`Mock download trigger for file: ${file.file_name} (${(file.file_size ? file.file_size / 1024 : 0).toFixed(1)} KB)`);
      return;
    }
    window.open(publicUrl, '_blank');
  };

  const handleDelete = async (fileId: string) => {
    if (!user) return;
    try {
      // Optimistic delete
      setFiles(prev => prev.filter(f => f.id !== fileId));
      await dbService.deleteTaskFile(user.id, fileId);
      onFilesChange();
    } catch (err) {
      console.error('Failed to delete file:', err);
      loadFiles(); // Revert on failure
    }
  };

  const formatBytes = (bytes: number | null, decimals = 1) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3.5 select-none">
      <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
        <span className="uppercase tracking-wider">Attachments</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover font-bold transition-colors cursor-pointer"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span>Upload File</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="p-3.5 rounded-xl border border-border/10 bg-surface/10 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
            <span>Uploading attachment...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-text-secondary justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span>Loading files...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {files.length === 0 ? (
            <p className="text-[11px] text-text-secondary/40 font-medium py-1.5 text-center">
              No files attached
            </p>
          ) : (
            files.map(file => (
              <div 
                key={file.id} 
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/10 bg-surface/10 hover:bg-surface-hover/30 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-7 w-7 rounded-lg bg-surface border border-border/15 flex items-center justify-center text-text-secondary select-none shadow-sm">
                    📄
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {file.file_name}
                    </p>
                    <p className="text-[9px] font-semibold text-text-secondary/60">
                      {formatBytes(file.file_size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface transition-all focus:outline-none"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-text-secondary hover:text-danger rounded hover:bg-surface transition-all focus:outline-none"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
