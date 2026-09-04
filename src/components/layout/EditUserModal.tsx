import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Edit3, Camera, User as UserIcon, Loader2, AtSign } from 'lucide-react';
import { compressImageFile } from '../../services/imageCompression';
import { getTelegramUser } from '../../services/telegram';

interface EditUserModalProps {
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ onClose }) => {
  const { users, updateUser } = useApp();
  const tgUser = getTelegramUser();

  const user1 = users[0] || { id: 'u1', first_name: 'Партнер 1' };
  const user2 = users[1] || { id: 'u2', first_name: 'Партнер 2' };

  const [name1, setName1] = useState(user1.first_name);
  const [avatar1, setAvatar1] = useState(user1.avatar_url || '');
  const [tgUsername1, setTgUsername1] = useState(user1.telegram_username || '');

  const [name2, setName2] = useState(user2.first_name);
  const [avatar2, setAvatar2] = useState(user2.avatar_url || '');
  const [tgUsername2, setTgUsername2] = useState(user2.telegram_username || '');

  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setAvatar: (url: string) => void,
    setLoading: (l: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const compressedWebP = await compressImageFile(file, 400, 400, 0.85);
      setAvatar(compressedWebP);
    } catch (err) {
      console.error('Failed to compress avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name1.trim()) {
      updateUser(user1.id, {
        first_name: name1.trim(),
        avatar_url: avatar1,
        telegram_username: tgUsername1.trim().replace('@', ''),
      });
    }
    if (name2.trim()) {
      updateUser(user2.id, {
        first_name: name2.trim(),
        avatar_url: avatar2,
        telegram_username: tgUsername2.trim().replace('@', ''),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Імена, Фото та TG Партнерів</h3>
            <p className="text-xs text-slate-400">Вкажіть імена та TG @username для 100% прив'язки</p>
          </div>
        </div>

        {/* Current TG Account Banner if available */}
        {tgUser && (
          <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                Твій Telegram акаунт:
              </span>
              <span className="text-white font-mono font-semibold">
                @{tgUser.username || 'немає_username'} (ID: {tgUser.id})
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Partner 1 */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2.5">
            <label className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">👨 Партнер 1</span>
              <span className="text-[10px] text-slate-400 font-normal">Фото, Ім'я та TG</span>
            </label>

            <div className="flex items-center space-x-3">
              <div className="relative group">
                <img
                  src={avatar1 || 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry'}
                  alt={name1}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40 bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef1.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity"
                  title="Змінити фото"
                >
                  {uploading1 ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef1}
                  onChange={(e) => handleAvatarChange(e, setAvatar1, setUploading1)}
                  className="hidden"
                />
                <input
                  type="text"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  placeholder="Ім'я партнера 1 (напр. Діма)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs font-mono">@</span>
                  <input
                    type="text"
                    value={tgUsername1}
                    onChange={(e) => setTgUsername1(e.target.value)}
                    placeholder="Telegram username (напр. dima_ua)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs text-indigo-300 font-mono placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Partner 2 */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2.5">
            <label className="text-[11px] font-bold text-pink-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">👩 Партнер 2</span>
              <span className="text-[10px] text-slate-400 font-normal">Фото, Ім'я та TG</span>
            </label>

            <div className="flex items-center space-x-3">
              <div className="relative group">
                <img
                  src={avatar2 || 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena'}
                  alt={name2}
                  className="w-12 h-12 rounded-full object-cover border-2 border-pink-500/40 bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef2.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity"
                  title="Змінити фото"
                >
                  {uploading2 ? <Loader2 className="w-4 h-4 animate-spin text-pink-400" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef2}
                  onChange={(e) => handleAvatarChange(e, setAvatar2, setUploading2)}
                  className="hidden"
                />
                <input
                  type="text"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                  placeholder="Ім'я партнера 2 (напр. Віка)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs font-mono">@</span>
                  <input
                    type="text"
                    value={tgUsername2}
                    onChange={(e) => setTgUsername2(e.target.value)}
                    placeholder="Telegram username (напр. vika_ua)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs text-pink-300 font-mono placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={uploading1 || uploading2}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Зберегти зміни</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
