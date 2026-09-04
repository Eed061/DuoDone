import React, { useState, useRef } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { compressImageFile } from '../../services/imageCompression';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle } from '../../i18n/translations';

interface CounterModalProps {
  title: string;
  icon: string;
  photoRequired: boolean;
  onConfirm: (photoUrl?: string | null) => void;
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file);
      setPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = () => {
    if (photoRequired && !photoUrl) {
      return;
    }
    onConfirm(photoUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
          <p className="text-xs text-slate-400">
            {photoRequired
              ? t('cm_photo_req_desc')
              : t('cm_photo_opt_desc')}
          </p>
        </div>

        {/* Camera / Photo area */}
        <div className="my-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {photoUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-48 bg-black">
              <img src={photoUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-2 left-2 bg-emerald-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3" /> {t('cm_processed_webp')}
              </span>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-full h-40 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 hover:bg-slate-800/80 flex flex-col items-center justify-center p-4 transition-all"
            >
              {isCompressing ? (
                <div className="flex flex-col items-center text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs font-semibold">{t('cm_compressing')}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400 group hover:text-indigo-300">
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
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCompressing || (photoRequired && !photoUrl)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-1.5 transition-all ${
              photoRequired && !photoUrl
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
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
