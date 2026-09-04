import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Edit3, Camera, User as UserIcon, Loader2, Smartphone, ShieldCheck } from 'lucide-react';
import { compressImageFile } from '../../services/imageCompression';
import { getTelegramUser } from '../../services/telegram';

interface EditUserModalProps {
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ onClose }) => {
  const { users, updateUser, activeUser, switchActiveUser } = useApp();
  const tgUser = getTelegramUser();

  const user1 = users[0] || { id: 'u1', first_name: 'Партнер 1' };
  const user2 = users[1] || { id: 'u2', first_name: 'Партнер 2' };

  const [name1, setName1] = useState(user1.first_name);
  const [avatar1, setAvatar1] = useState(user1.avatar_url || '');

  const [name2, setName2] = useState(user2.first_name);
  const [avatar2, setAvatar2] = useState(user2.avatar_url || '');

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
      });
    }
    if (name2.trim()) {
      updateUser(user2.id, {
        first_name: name2.trim(),
        avatar_url: avatar2,
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
            <h3 className="font-extrabold text-white text-base">Імена та Фото Партнерів</h3>
            <p className="text-xs text-slate-400">Вкажіть власні імена та аватарки</p>
          </div>
        </div>

        {/* Current Device User Role Selector */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700/80 space-y-2">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Хто ви на цьому пристрої:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchActiveUser(user1.id)}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1 ${
                activeUser.id === user1.id
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>👨</span>
              <span className="truncate">{name1 || 'Партнер 1'}</span>
            </button>
            <button
              type="button"
              onClick={() => switchActiveUser(user2.id)}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1 ${
                activeUser.id === user2.id
                  ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>👩</span>
              <span className="truncate">{name2 || 'Партнер 2'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Partner 1 */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2.5">
            <label className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">👨 Партнер 1</span>
              <span className="text-[10px] text-slate-400 font-normal">Фото та Ім'я</span>
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

              <div className="flex-1 space-y-1">
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
                  placeholder="Ім'я партнера 1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 pt-0.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>TG ID: {user1.telegram_id || 'Прив’язано під час входу'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Partner 2 */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2.5">
            <label className="text-[11px] font-bold text-pink-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">👩 Партнер 2</span>
              <span className="text-[10px] text-slate-400 font-normal">Фото та Ім'я</span>
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

              <div className="flex-1 space-y-1">
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
                  placeholder="Ім'я партнера 2"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 pt-0.5">
                  <ShieldCheck className="w-3 h-3 text-pink-400" />
                  <span>TG ID: {user2.telegram_id || 'Прив’язано при прийнятті запрошення'}</span>
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
