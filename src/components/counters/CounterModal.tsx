import React, { useState, useRef } from 'react';
import { Camera, X, Check, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { compressImageFile } from '../../services/imageCompression';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle } from '../../i18n/translations';

interface CounterModalProps {
  title: string;
  icon: string;
  photoRequired: boolean;
  onConfirm: (photoUrl?: string | null, photoUrls?: string[]) => void;
  onClose: () => void;
}

export const CounterModal: React.FC<CounterModalProps> = ({
  title,
  icon,
  photoRequired,
  onConfirm,
  onClose,
}) => {
  const { language, t } = useApp();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file);
      setPhotos((prev) => (prev.length < 2 ? [...prev, compressedDataUrl] : prev));
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
      // Reset input value so the same file or a new shot can be taken again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (photoRequired && photos.length === 0) {
      return;
    }
    const primary = photos.length > 0 ? photos[0] : null;
    onConfirm(primary, photos);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-3xl mb-2 shadow-inner">
            {icon}
          </div>
          <h3 className="font-bold text-white text-lg tracking-tight">
            {translateEntityTitle(title, language)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {photoRequired ? t('cm_photo_req_desc') : t('cm_photo_opt_desc')}
          </p>
          {photos.length > 0 && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 py-0.5 px-2.5 rounded-full mx-auto w-fit border border-indigo-500/20">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t('cm_photos_count', { count: photos.length })}</span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Camera / Photo area */}
        <div className="my-4">
          {photos.length === 0 ? (
            /* 0 Photos: Large dashed capture area */
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-full h-40 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 hover:bg-slate-800/80 flex flex-col items-center justify-center p-4 transition-all group"
            >
              {isCompressing ? (
                <div className="flex flex-col items-center text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs font-semibold">{t('cm_compressing')}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-300">
                  <div className="p-3 bg-slate-800 rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {photoRequired ? t('cm_take_photo_req') : t('cm_take_photo_opt')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{t('cm_live_only')}</span>
                </div>
              )}
            </button>
          ) : photos.length === 1 ? (
            /* 1 Photo: Show 1 large preview + button to add 2nd photo */
            <div className="space-y-2.5">
              <div className="relative rounded-xl overflow-hidden border border-slate-700 h-44 bg-black">
                <img src={photos[0]} alt="Preview 1" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(0)}
                  className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 bg-emerald-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                  <Check className="w-3 h-3" /> {t('cm_processed_webp')} (1/2)
                </span>
              </div>

              {/* Add 2nd photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {isCompressing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('cm_add_second_photo')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* 2 Photos: 2-column grid */
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-700 h-40 bg-black">
                  <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow">
                    <Check className="w-2.5 h-2.5" /> #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCompressing || (photoRequired && photos.length === 0)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-1.5 transition-all ${
              photoRequired && photos.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{t('cm_confirm')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
