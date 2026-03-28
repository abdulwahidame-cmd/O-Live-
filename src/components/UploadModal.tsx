import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Film, Music, Tag, CheckCircle2, Scissors, Wand2, Gauge, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Grayscale', class: 'grayscale' },
  { name: 'Sepia', class: 'sepia' },
  { name: 'Invert', class: 'invert' },
  { name: 'Vibrant', class: 'saturate-200' },
  { name: 'Cool', class: 'hue-rotate-180' },
];

const SPEEDS = [0.5, 1, 1.5, 2];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { profile } = useFirebase();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [step, setStep] = useState<'select' | 'edit' | 'details' | 'success'>('select');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [music, setMusic] = useState('');
  const [category, setCategory] = useState('Lifestyle');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Editing states
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(100);
  const [duration, setDuration] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload MP4, WebM, or MOV.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep('edit');
    setError(null);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
    setEndTime(e.currentTarget.duration);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!navigator.onLine) {
      setError('You are offline. Please check your internet connection.');
      return;
    }

    if (!file || !auth.currentUser || !profile) {
      setError('You must be signed in to upload videos.');
      return;
    }

    if (!title.trim()) {
      setError('Please add a title for your video.');
      return;
    }

    if (!caption.trim()) {
      setError('Please add a caption for your video.');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `videos/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      const startTime = Date.now();

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = snapshot.bytesTransferred / elapsed;
          const remainingBytes = snapshot.totalBytes - snapshot.bytesTransferred;
          const remainingSeconds = remainingBytes / (speed || 1);
          
          setUploadSpeed(speed);
          setRemainingTime(remainingSeconds);
        }, 
        (error: any) => {
          console.error('Upload error:', error);
          let message = 'Failed to upload video. Please try again.';
          
          if (error.code === 'storage/unauthorized') {
            message = 'You do not have permission to upload. Please sign in again.';
          } else if (error.code === 'storage/canceled') {
            message = 'Upload was canceled.';
          } else if (error.code === 'storage/quota-exceeded') {
            message = 'Storage quota exceeded. Please contact support.';
          } else if (error.code === 'storage/retry-limit-exceeded') {
            message = 'Network error. Please check your connection and try again.';
          }
          
          setError(message);
          setUploading(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 2. Save to Firestore
            const videoData = {
              id: `v_${Date.now()}`,
              uid: auth.currentUser!.uid,
              username: profile.username,
              url: downloadURL,
              thumbnail: `https://picsum.photos/seed/${Date.now()}/400/600`, // In a real app, generate thumbnail
              title: title,
              description: caption,
              musicName: music || 'Original Sound',
              tags: tags,
              category: category,
              likes: 0,
              comments: 0,
              shares: 0,
              createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'videos'), videoData);
            
            setUploading(false);
            setStep('success');
          } catch (err: any) {
            console.error('Firestore save error:', err);
            let message = 'Failed to save video details.';
            if (err.message?.includes('permission-denied')) {
              message = 'Permission denied while saving video details.';
            }
            setError(message);
            setUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError('An unexpected error occurred during upload.');
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStep('select');
    setCaption('');
    setTitle('');
    setMusic('');
    setCategory('Lifestyle');
    setTags([]);
    setTagInput('');
    setSelectedFilter(FILTERS[0]);
    setPlaybackSpeed(1);
    setStartTime(0);
    setEndTime(0);
    setUploadProgress(0);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            key="upload-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            key="upload-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl glass-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                {step !== 'select' && step !== 'success' && (
                  <button 
                    onClick={() => setStep(step === 'details' ? 'edit' : 'select')}
                    className="rounded-full p-2 hover:bg-white/10"
                    disabled={uploading}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="text-xl font-bold">
                  {step === 'select' && 'Upload Video'}
                  {step === 'edit' && 'Edit Video'}
                  {step === 'details' && 'Video Details'}
                  {step === 'success' && 'Success'}
                </h2>
              </div>
              <button onClick={reset} className="rounded-full p-2 hover:bg-white/10" disabled={uploading}>
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {step === 'select' && (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-12 transition-colors hover:border-orange-500/50 hover:bg-white/10 cursor-pointer"
                  >
                    <div className="mb-4 rounded-full bg-orange-600/20 p-4 text-orange-500">
                      <Upload size={40} />
                    </div>
                    <p className="mb-2 text-lg font-semibold">Select video to upload</p>
                    <p className="text-sm text-white/40">Or drag and drop a file</p>
                    <p className="mt-4 text-xs text-white/20">MP4, WebM, or MOV, up to 50MB</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="video/*" 
                      className="hidden" 
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500 ring-1 ring-red-500/20">
                      <AlertCircle size={18} />
                      <p>{error}</p>
                    </div>
                  )}
                </div>
              )}

              {step === 'edit' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black shadow-inner">
                      {previewUrl && (
                        <video 
                          ref={videoPreviewRef}
                          src={previewUrl} 
                          className={`h-full w-full object-cover ${selectedFilter.class}`}
                          onLoadedMetadata={handleLoadedMetadata}
                          autoPlay
                          loop
                          muted
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                          <Wand2 size={14} />
                          <span>Filters</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {FILTERS.map((filter, index) => (
                            <button
                              key={`${filter.name}-${index}`}
                              onClick={() => setSelectedFilter(filter)}
                              className={`rounded-lg border p-2 text-xs transition-all ${
                                selectedFilter.name === filter.name 
                                  ? 'border-orange-500 bg-orange-500/20 text-white' 
                                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              {filter.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                          <Gauge size={14} />
                          <span>Playback Speed</span>
                        </div>
                        <div className="flex gap-2">
                          {SPEEDS.map((speed, index) => (
                            <button
                              key={`${speed}-${index}`}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`flex-1 rounded-lg border p-2 text-xs transition-all ${
                                playbackSpeed === speed 
                                  ? 'border-orange-500 bg-orange-500/20 text-white' 
                                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                          <Scissors size={14} />
                          <span>Trim Video</span>
                        </div>
                        <div className="space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-white/40">
                              <span>Start: {startTime.toFixed(1)}s</span>
                              <span>End: {endTime.toFixed(1)}s</span>
                            </div>
                            <div className="relative h-2 w-full rounded-full bg-white/10">
                              <input 
                                type="range"
                                min={0}
                                max={duration}
                                step={0.1}
                                value={startTime}
                                onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime - 0.5))}
                                className="absolute h-full w-full cursor-pointer appearance-none bg-transparent accent-orange-500"
                              />
                              <input 
                                type="range"
                                min={0}
                                max={duration}
                                step={0.1}
                                value={endTime}
                                onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime + 0.5))}
                                className="absolute h-full w-full cursor-pointer appearance-none bg-transparent accent-orange-500"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-center text-white/20">
                            Selected duration: {(endTime - startTime).toFixed(1)}s
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setStep('details')}
                        className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all active:scale-95"
                      >
                        <span>Next</span>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="relative aspect-[9/16] w-32 overflow-hidden rounded-xl bg-black">
                      {previewUrl && (
                        <video 
                          src={previewUrl} 
                          className={`h-full w-full object-cover ${selectedFilter.class}`} 
                        />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <Film size={24} className="text-white/60" />
                        <span className="mt-1 text-[10px] font-bold text-white/80">{playbackSpeed}x</span>
                      </div>
                    </div>
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-white/40">Title</label>
                          <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your video a title..."
                            className="w-full rounded-xl bg-white/5 p-3 text-sm outline-none ring-1 ring-white/10 focus:ring-orange-500/50"
                            disabled={uploading}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-white/40">Caption</label>
                          <textarea 
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Describe your video..."
                            className="w-full rounded-xl bg-white/5 p-3 text-sm outline-none ring-1 ring-white/10 focus:ring-orange-500/50"
                            rows={3}
                            disabled={uploading}
                          />
                        </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40">Music</label>
                        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                          <Music size={16} className="text-white/40" />
                          <input 
                            type="text" 
                            value={music}
                            onChange={(e) => setMusic(e.target.value)}
                            placeholder="Add music..."
                            className="bg-transparent text-sm outline-none w-full"
                            disabled={uploading}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40">Category</label>
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-xl bg-white/5 p-3 text-sm outline-none ring-1 ring-white/10 focus:ring-orange-500/50 appearance-none"
                          disabled={uploading}
                        >
                          {['Dance', 'Nature', 'Lifestyle', 'Comedy', 'DIY'].map(cat => (
                            <option key={cat} value={cat} className="bg-zinc-900 text-white">{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/40">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag, index) => (
                        <span 
                          key={`${tag}-${index}`} 
                          className="flex items-center gap-1 rounded-full bg-orange-600/20 px-3 py-1 text-xs font-medium text-orange-500"
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-white" disabled={uploading}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                      <Tag size={16} className="text-white/40" />
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={addTag}
                        placeholder="Add tags (press Enter)..."
                        className="bg-transparent text-sm outline-none w-full"
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500 ring-1 ring-red-500/20">
                      <AlertCircle size={18} />
                      <p>{error}</p>
                    </div>
                  )}

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white/60">
                          {uploadProgress >= 100 ? 'Processing video...' : 'Uploading video...'}
                        </span>
                        <span className="text-orange-500">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div 
                          className={`h-full ${uploadProgress >= 100 ? 'bg-green-500' : 'bg-orange-600'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                        />
                      </div>
                      {uploadProgress < 100 && (
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span>{(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s</span>
                          <span>{Math.ceil(remainingTime)}s remaining</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full rounded-xl bg-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading 
                      ? (uploadProgress >= 100 ? 'Processing...' : `Uploading (${Math.round(uploadProgress)}%)`) 
                      : 'Post Video'}
                  </button>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-6 rounded-full bg-green-500/20 p-6 text-green-500"
                  >
                    <CheckCircle2 size={64} />
                  </motion.div>
                  <h3 className="mb-2 text-2xl font-bold">Upload Complete!</h3>
                  <p className="mb-8 text-white/60">Your video is being processed and will be live soon.</p>
                  <button 
                    onClick={reset}
                    className="w-full max-w-xs rounded-xl bg-white/10 py-3 font-bold text-white hover:bg-white/20 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

