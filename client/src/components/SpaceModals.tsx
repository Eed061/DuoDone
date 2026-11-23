import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../lib/api';
import { AVATARS, copyText, inviteLinks } from '../lib/utils';
import { haptic, isTelegram, shareToTelegram } from '../lib/tg';
import { prepareImage } from '../lib/image';
import type { Role, SpaceState } from '../types';
import { Avatar, Button, Field, inputCls, Modal, Spinner } from './ui';

export function CreateSpaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, createSpace } = useApp();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setName('');
  }, [open]);
  const submit = async () => {
    setBusy(true);
    const ok = await createSpace(name.trim() || t('onb.spaceNamePh'));
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('hdr.create')}
      footer={
        <Button className="w-full" onClick={submit} loading={busy}>
          {t('onb.create')}
        </Button>
      }
    >
      <Field label={t('onb.spaceName')}>
        <input className={inputCls} value={name} maxLength={60} placeholder={t('onb.spaceNamePh')} onChange={(e) => setName(e.target.value)} />
      </Field>
    </Modal>
  );
}

export function JoinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, joinByCode } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setCode('');
  }, [open]);
  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const ok = await joinByCode(code.trim());
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('onb.join')}
      footer={
        <Button className="w-full" onClick={submit} loading={busy} disabled={!code.trim()}>
          {t('onb.joinBtn')}
        </Button>
      }
    >
      <input
        className={`${inputCls} text-center font-mono tracking-widest uppercase`}
        value={code}
        placeholder={t('onb.codePh')}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
    </Modal>
  );
}

export function InviteBlock({ state }: { state: SpaceState }) {
  const { t, config, toast, run, applyState } = useApp();
  const links = inviteLinks(state.space.inviteCode, config);
  const partnerRole: Role = state.myRole === 'p1' ? 'p2' : 'p1';
  const linked = state.space[partnerRole].linked;
  const copy = async (text: string) => {
    if (await copyText(text)) {
      toast(t('common.copied'), 'ok');
      haptic('success');
    }
  };
  const share = () => {
    const text = t('st.shareText', { name: state.space.name, code: state.space.inviteCode });
    if (isTelegram() || !navigator.share) {
      shareToTelegram(links.primary, text);
    } else {
      navigator.share({ title: 'DuoDone', text, url: links.primary }).catch(() => shareToTelegram(links.primary, text));
    }
  };
  const rotate = async () => {
    const s = await run(() => api.post<SpaceState>(`/spaces/${state.space.id}/rotate-code`));
    if (s) applyState(s);
  };
  return (
    <div className="space-y-3">
      <div className={`rounded-2xl px-3 py-2 text-sm ${linked ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
        {linked ? t('st.partnerLinked') : t('st.partnerWaiting')}
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-2 pl-4">
        <span className="flex-1 font-mono text-xl font-bold tracking-widest text-white">{state.space.inviteCode}</span>
        <Button size="sm" variant="secondary" onClick={() => copy(state.space.inviteCode)}>
          {t('st.copyCode')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => copy(links.primary)}>
          🔗 {t('st.copyLink')}
        </Button>
        <Button onClick={share}>✈️ {t('st.shareTg')}</Button>
      </div>
      {links.tg && (
        <button className="block w-full truncate text-left text-xs text-slate-500" onClick={() => copy(links.web)}>
          🌐 {links.web}
        </button>
      )}
      <button onClick={rotate} className="text-xs text-slate-500 underline">
        ↻ {t('st.newCode')}
      </button>
    </div>
  );
}

export function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, state } = useApp();
  return (
    <Modal open={open} onClose={onClose} title={t('st.invite')}>
      {state ? <InviteBlock state={state} /> : <Spinner />}
    </Modal>
  );
}

function AvatarPicker({ value, onChange, spaceId }: { value: string; onChange: (v: string) => void; spaceId: string }) {
  const { t, run } = useApp();
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    const url = await run(async () => api.upload(await prepareImage(f), spaceId));
    setBusy(false);
    if (url) onChange(url);
  };
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-dashed border-white/20 text-[10px] text-slate-400">
        {busy ? <Spinner /> : <span>📷</span>}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        <span className="sr-only">{t('pf.uploadAvatar')}</span>
      </label>
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl ${value === a ? 'bg-violet-500/30 ring-2 ring-violet-400' : 'bg-slate-800'}`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, state, run, applyState, refreshMe } = useApp();
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [p1Avatar, setP1Avatar] = useState('');
  const [p2Avatar, setP2Avatar] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && state) {
      setP1Name(state.space.p1.name);
      setP2Name(state.space.p2.name);
      setP1Avatar(state.space.p1.avatar);
      setP2Avatar(state.space.p2.avatar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!state) return null;
  const id = state.space.id;

  const save = async () => {
    setBusy(true);
    const s = await run(() =>
      api.patch<SpaceState>(`/spaces/${id}`, {
        p1Name: p1Name.trim() || state.space.p1.name,
        p2Name: p2Name.trim() || state.space.p2.name,
        p1Avatar,
        p2Avatar,
      }),
    );
    setBusy(false);
    if (s) {
      applyState(s);
      refreshMe();
      haptic('success');
      onClose();
    }
  };

  const setActing = async (role: Role) => {
    const s = await run(() => api.post<SpaceState>(`/spaces/${id}/acting-role`, { role }));
    if (s) {
      applyState(s);
      haptic('select');
    }
  };

  const block = (role: Role, name: string, setName: (v: string) => void, av: string, setAv: (v: string) => void) => (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-slate-950/40 p-3">
      <div className="flex items-center gap-3">
        <Avatar value={av} size={44} ring={state.actingRole === role ? 'ring-violet-400' : undefined} />
        <input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t('pf.name')} />
      </div>
      <AvatarPicker value={av} onChange={setAv} spaceId={id} />
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('pf.title')}
      footer={
        <Button className="w-full" onClick={save} loading={busy}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="space-y-3">
        {block('p1', p1Name, setP1Name, p1Avatar, setP1Avatar)}
        {block('p2', p2Name, setP2Name, p2Avatar, setP2Avatar)}
        <div className="pt-2">
          <div className="text-sm font-semibold text-white">{t('pf.whoAmI')}</div>
          <div className="mb-2 text-xs text-slate-400">{state.canSwitchRole ? t('pf.whoAmIDesc') : t('pf.locked')}</div>
          <div className="grid grid-cols-2 gap-2">
            {(['p1', 'p2'] as Role[]).map((r) => {
              const disabled = r !== state.myRole && !state.canSwitchRole;
              return (
                <button
                  key={r}
                  disabled={disabled}
                  onClick={() => setActing(r)}
                  className={`flex items-center gap-2 rounded-2xl border p-2.5 text-left text-sm transition disabled:opacity-40 ${
                    state.actingRole === r ? 'border-violet-400 bg-violet-500/15 text-white' : 'border-white/10 bg-slate-950/40 text-slate-300'
                  }`}
                >
                  <Avatar value={state.space[r].avatar} size={28} />
                  <span className="truncate">{state.space[r].name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
