'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '@/utils/api';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

export default function ReportIssueModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: ReportIssueModalProps) {
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.preview.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, [attachments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        setErrorMessage(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage(`File "${file.name}" is not a supported format. Please use images (JPG, PNG, GIF, WEBP) or videos (MP4, MOV, AVI).`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      const id = Math.random().toString(36).substring(7);
      
      setAttachments((prev) => [...prev, { file, preview, id }]);
      setErrorMessage('');
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment && attachment.preview.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !body.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('body', body.trim());
      formData.append('user_email', userEmail);
      formData.append('user_name', userName);
      
      // Append attachments
      attachments.forEach((attachment) => {
        formData.append('attachments', attachment.file);
      });

      await api.post('/support/report-issue', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitStatus('success');
      setDescription('');
      setBody('');
      // Cleanup attachments
      attachments.forEach((attachment) => {
        if (attachment.preview.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
      setAttachments([]);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit issue report:', error);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send issue report. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setDescription('');
      setBody('');
      setErrorMessage('');
      setSubmitStatus('idle');
      // Cleanup attachments
      attachments.forEach((attachment) => {
        if (attachment.preview.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
      setAttachments([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="report-issue-title">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity z-[9998]"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 z-[9999] my-8 border-2 border-gray-200 max-h-[90vh] overflow-y-auto">
          {/* Header with distinct styling */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="report-issue-title" className="text-2xl font-bold text-gray-900">Report an Issue</h2>
                <p className="text-sm text-gray-500 mt-1">Help us improve by reporting any issues you encounter</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                type="button"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ Issue report sent successfully! We'll get back to you soon.
              </p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Description Field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrorMessage(''); // Clear error when user types
                }}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
                disabled={isSubmitting}
                onInvalid={(e) => {
                  e.preventDefault();
                  if (!description.trim()) {
                    setErrorMessage('Please fill in all fields');
                  }
                }}
              />
            </div>

            {/* Body Field */}
            <div>
              <label
                htmlFor="body"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                name="body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setErrorMessage(''); // Clear error when user types
                }}
                placeholder="Please provide detailed information about the issue..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                required
                disabled={isSubmitting}
                onInvalid={(e) => {
                  e.preventDefault();
                  if (!body.trim()) {
                    setErrorMessage('Please fill in all fields');
                  }
                }}
              />
            </div>

            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="space-y-3">
                {/* File Input */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="attachments"
                    name="attachments"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachments"
                    className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Click to attach photos or videos (Max 10MB per file)
                    </span>
                  </label>
                </div>

                {/* File Previews */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                      >
                        {attachment.file.type.startsWith('image/') ? (
                          <img
                            src={attachment.preview}
                            alt={attachment.file.name}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 truncate" title={attachment.file.name}>
                            {attachment.file.name}
                          </p>
                          <p className="text-xs text-gray-400">{formatFileSize(attachment.file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Validation Error */}
            {errorMessage && submitStatus !== 'error' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim() || !body.trim()}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Render modal in portal to ensure it's above everything
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
