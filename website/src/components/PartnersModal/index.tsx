import type { ReactNode } from 'react';
import { Modal, ModalClose } from '@site/src/components/Modal';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6';
import { GoHeartFill } from 'react-icons/go';
import { LuBuilding2, LuCheck, LuMail, LuSend, LuUser } from 'react-icons/lu';

type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

type Draft = {
  name: string;
  email: string;
  company: string;
  type: PartnershipType | '';
  message: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  email: '',
  company: '',
  type: '',
  message: '',
};

const DRAFT_KEY = 'lagune:partners-draft';
const WEB3FORMS_PUBLIC_KEY = '0e430072-493e-4eba-9991-9879134fe5ef';
const SUBMIT_COOLDOWN_MS = 8000;
const STATS_URL = 'https://wellwelwel.github.io/wellwelwel/stats.json';
const FALLBACK_DOWNLOADS = '500 million';

const DOWNLOAD_SCALES = [
  { threshold: 1_000_000_000, unit: 'billion' },
  { threshold: 1_000_000, unit: 'million' },
  { threshold: 1_000, unit: 'thousand' },
] as const;

const floorToLeadingDigit = (value: number): number => {
  const place = 10 ** Math.floor(Math.log10(value));
  return Math.floor(value / place) * place;
};

const formatDownloads = (value: number): string => {
  const scale = DOWNLOAD_SCALES.find(({ threshold }) => value >= threshold);
  if (!scale) return String(Math.floor(value));

  return `${floorToLeadingDigit(value / scale.threshold)} ${scale.unit}`;
};

const SOCIALS = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/wellwelwel/',
    Icon: FaLinkedin,
  },
  { name: 'GitHub', url: 'https://github.com/wellwelwel', Icon: FaGithub },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/wellwelwel/',
    Icon: FaInstagram,
  },
  {
    name: 'GitHub Sponsors',
    url: 'https://github.com/sponsors/wellwelwel',
    Icon: GoHeartFill,
  },
] as const;

const readDownloadsPerYear = (data: unknown): number | null => {
  if (typeof data !== 'object' || data === null) return null;
  const perYear = (data as { downloadsPerYear?: unknown }).downloadsPerYear;
  if (typeof perYear !== 'object' || perYear === null) return null;
  const value = (perYear as { value?: unknown }).value;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const PARTNERSHIP_TYPES = ['Sponsorship', 'Integration', 'Other'] as const;

const fieldClass =
  'w-full rounded-xl border border-line bg-card px-3.5 py-2.5 [font-family:var(--font-mono)] font-normal text-[16px] leading-[1.5] text-ink placeholder:[font-family:var(--font-mono)] placeholder:text-muted transition-[border-color,background-color,box-shadow] duration-200 ease-out outline-none hover:border-white/[0.18] focus:border-accent focus:bg-card-hover focus:[box-shadow:0_0_0_3px_rgba(0,94,255,0.18)]';

const groupClass =
  'flex items-stretch overflow-hidden rounded-xl border border-line bg-card transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-white/[0.18] focus-within:border-accent focus-within:bg-card-hover focus-within:[box-shadow:0_0_0_3px_rgba(0,94,255,0.18)]';

const groupLabelClass =
  'flex w-12 shrink-0 items-center justify-center border-r border-line bg-white/[0.03] text-[#9499a5] [&>svg]:size-[18px]';

const groupInputClass =
  'w-full bg-transparent px-3.5 py-2 [font-family:var(--font-mono)] font-semibold text-[16px] leading-[1.5] text-ink placeholder:[font-family:var(--font-mono)] placeholder:text-muted outline-none';

const labelClass =
  'flex flex-col gap-2 text-[13px] font-semibold tracking-[-0.005em] text-ink';

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode => (
  <label className={labelClass}>
    {label}
    {children}
  </label>
);

const InlineField = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}): ReactNode => (
  <label className={groupClass}>
    <span className={groupLabelClass} aria-hidden>
      {icon}
    </span>
    <span className='sr-only'>{label}</span>
    {children}
  </label>
);

const isPartnershipType = (value: unknown): value is PartnershipType =>
  PARTNERSHIP_TYPES.some((type) => type === value);

const readDraft = (): Draft => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_DRAFT;
    const value = parsed as Partial<Record<keyof Draft, unknown>>;
    return {
      name: typeof value.name === 'string' ? value.name : '',
      email: typeof value.email === 'string' ? value.email : '',
      company: typeof value.company === 'string' ? value.company : '',
      type: isPartnershipType(value.type) ? value.type : '',
      message: typeof value.message === 'string' ? value.message : '',
    };
  } catch {
    return EMPTY_DRAFT;
  }
};

const TypeChips = ({
  value,
  onChange,
}: {
  value: PartnershipType | '';
  onChange: (type: PartnershipType) => void;
}): ReactNode => {
  const groupRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>(
    Object.create(null)
  );
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const measure = () => {
      const active = value ? refs.current[value] : null;
      setPill(
        active ? { left: active.offsetLeft, width: active.offsetWidth } : null
      );
    };

    measure();

    const group = groupRef.current;
    if (!group) return;

    const observer = new ResizeObserver(measure);
    observer.observe(group);

    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={groupRef}
      className='relative flex items-stretch gap-1 rounded-xl border border-line bg-card p-1'
      role='radiogroup'
      aria-label='Partnership type'
    >
      {pill && (
        <span
          className='absolute top-1 bottom-1 rounded-lg border border-accent/50 bg-accent/15 transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none'
          style={{ left: pill.left, width: pill.width }}
          aria-hidden
        />
      )}
      {PARTNERSHIP_TYPES.map((type) => {
        const on = value === type;

        return (
          <button
            key={type}
            ref={(el) => {
              refs.current[type] = el;
            }}
            type='button'
            role='radio'
            aria-checked={on}
            onClick={() => onChange(type)}
            className={`relative z-[1] flex-1 rounded-lg px-3.5 py-1.5 text-[13px] font-bold tracking-[-0.01em] whitespace-nowrap transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              on ? 'text-ink' : 'text-[rgba(233,237,247,0.7)] hover:text-ink'
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
};

const SuccessState = ({ onReset }: { onReset: () => void }): ReactNode => (
  <div className='lagune-fade-in flex flex-col items-center text-center gap-4 py-8'>
    <span className='flex items-center justify-center size-14 rounded-full bg-accent/15 text-accent [&>svg]:size-7'>
      <LuCheck aria-hidden />
    </span>
    <div className='flex flex-col gap-1.5'>
      <h3 className='font-display font-bold text-[20px] tracking-[-0.01em] text-ink m-0'>
        Thanks for reaching out
      </h3>
      <p className='max-w-[34ch] text-[15px] leading-[1.6] text-[rgba(233,237,247,0.82)] m-0'>
        We read every partnership request and will get back to you soon.
      </p>
    </div>
    <button
      type='button'
      onClick={onReset}
      className='inline-flex items-center pl-4 pr-3.5 py-2 rounded-full border border-line bg-card text-[14px] font-semibold text-ink transition-[background-color,border-color] duration-200 ease-out hover:bg-card-hover hover:border-white/[0.18]'
    >
      Send another
    </button>
  </div>
);

export const PartnersModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactNode => {
  const lastSubmitRef = useRef(0);
  const fetchedRef = useRef(false);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [downloads, setDownloads] = useState(FALLBACK_DOWNLOADS);

  useEffect(() => {
    if (!open) return;
    setDraft(readDraft());
  }, [open]);

  useEffect(() => {
    if (!open || fetchedRef.current) return;

    fetchedRef.current = true;

    let active = true;

    fetch(STATS_URL)
      .then((response) => response.json())
      .then((data: unknown) => {
        const perYear = readDownloadsPerYear(data);
        if (active && perYear !== null) {
          setDownloads(formatDownloads(perYear));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [open, draft]);

  const update =
    (field: 'name' | 'email' | 'company' | 'message') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((current) => ({ ...current, [field]: event.target.value }));

  const selectType = (type: PartnershipType) =>
    setDraft((current) => ({ ...current, type }));

  useEffect(() => {
    if (!open) return;

    setSent(false);
    setStatus('idle');
  }, [open]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    const honeypot = event.currentTarget.elements.namedItem('website');
    if (honeypot instanceof HTMLInputElement && honeypot.value) {
      setSent(true);
      setStatus('idle');
      setDraft((current) => ({ ...current, type: '', message: '' }));
      return;
    }

    const now = performance.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) return;
    lastSubmitRef.current = now;

    setStatus('sending');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_PUBLIC_KEY,
          botcheck: false,
          subject: 'New partnership request — Lagune',
          from_name: draft.name,
          name: draft.name,
          email: draft.email,
          company: draft.company,
          partnership_type: draft.type,
          message: draft.message,
        }),
      });
      const data: unknown = await response.json();
      const success =
        typeof data === 'object' &&
        data !== null &&
        'success' in data &&
        data.success === true;

      if (!success) throw new Error('Submission failed');

      setSent(true);
      setStatus('idle');
      setDraft((current) => ({ ...current, type: '', message: '' }));
    } catch {
      setStatus('error');
      lastSubmitRef.current = 0;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label='Partner with Weslley Araújo'
      padding='p-[clamp(12px,2.5vw,28px)]'
      panelClassName='lagune-modal-panel relative flex flex-col w-full max-w-[1240px] max-h-full rounded-[28px] bg-[#0a0f1f75] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
    >
      <div
        className='pointer-events-none absolute inset-0 bg-cover bg-center'
        style={{ backgroundImage: 'url(/img/bg-partner.jpeg)', opacity: 0.05 }}
        aria-hidden
      />

      <div
        className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,9,20,0.25)_0%,rgba(6,9,20,0.18)_45%,rgba(6,9,20,0.4)_100%)]'
        aria-hidden
      />

      <ModalClose
        onClose={onClose}
        className='absolute top-3 right-3 z-[2] inline-flex items-center justify-center size-9 rounded-full text-[#9499a5] bg-black/30 border border-white/[0.12] [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)] transition-[color,background-color] duration-200 ease-out hover:bg-black/50 hover:text-ink [&>svg]:size-[18px]'
      />

      <div className='relative flex flex-1 flex-col min-h-0 overflow-y-auto'>
        {sent ? (
          <div className='px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,28px)]'>
            <SuccessState onReset={() => setSent(false)} />
          </div>
        ) : (
          <div className='grid flex-1 gap-7 p-[clamp(24px,4vw,56px)] md:grid-cols-[minmax(0,1fr)_auto]'>
            <form
              onSubmit={onSubmit}
              className='lagune-fade-in relative isolate flex w-full max-w-[480px] flex-col gap-4 self-start overflow-hidden rounded-[18px] border border-white/[0.12] bg-[rgba(10,15,31,0.55)] px-[clamp(18px,2.5vw,26px)] py-[clamp(18px,2.5vw,24px)] [backdrop-filter:blur(24px)_saturate(150%)] [-webkit-backdrop-filter:blur(24px)_saturate(150%)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_-12px_rgba(0,0,0,0.5)] [animation-delay:0.08s]'
            >
              <div
                className='pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-[0.025] mix-blend-screen'
                style={{
                  backgroundImage: 'url(/img/bg-partner-texture.jpg)',
                }}
                aria-hidden
              />
              <div className='flex flex-col gap-2'>
                <h2 className='font-display font-bold text-[clamp(22px,3vw,26px)] leading-[1.2] tracking-[-0.02em] text-balance text-ink m-0'>
                  Partner with Weslley Araújo
                </h2>

                <p className='text-[14px] leading-[1.6] text-pretty text-[rgba(233,237,247,0.82)] m-0'>
                  Back the open source work across all my projects. Partners get
                  an exclusive logo across the repositories and landing pages,
                  plus a spot on a dedicated partners page.
                </p>
              </div>

              <input
                type='text'
                name='website'
                className='absolute -left-[9999px] size-px overflow-hidden'
                tabIndex={-1}
                autoComplete='off'
                aria-hidden
              />

              <InlineField label='Name' icon={<LuUser />}>
                <input
                  className={groupInputClass}
                  type='text'
                  name='name'
                  autoComplete='name'
                  placeholder='John Doe'
                  value={draft.name}
                  onChange={update('name')}
                  required
                />
              </InlineField>

              <InlineField label='Email' icon={<LuMail />}>
                <input
                  className={groupInputClass}
                  type='email'
                  name='email'
                  autoComplete='email'
                  placeholder='john@company.com'
                  value={draft.email}
                  onChange={update('email')}
                  required
                />
              </InlineField>

              <InlineField label='Company' icon={<LuBuilding2 />}>
                <input
                  className={groupInputClass}
                  type='text'
                  name='company'
                  autoComplete='organization'
                  placeholder='Acme, Inc.'
                  value={draft.company}
                  onChange={update('company')}
                  required
                />
              </InlineField>

              <Field label='Partnership type'>
                <TypeChips value={draft.type} onChange={selectType} />
              </Field>

              <Field label='What do you have in mind?'>
                <textarea
                  className={`${fieldClass} min-h-[112px] resize-y`}
                  name='message'
                  rows={4}
                  placeholder="Tell what we're going to build ✨"
                  value={draft.message}
                  onChange={update('message')}
                  required
                />
              </Field>

              <label className='group flex items-start gap-2.5 cursor-pointer select-none text-[13px] leading-[1.5] text-[rgba(233,237,247,0.78)] transition-colors duration-200 ease-out hover:text-ink'>
                <span className='relative block mt-px size-[18px] shrink-0'>
                  <input
                    className='peer absolute inset-0 z-[1] size-full appearance-none rounded-[6px] border border-line bg-card transition-[border-color,background-color] duration-200 ease-out checked:border-accent checked:bg-accent hover:border-white/[0.25] after:absolute after:top-1/2 after:left-1/2 after:size-9 after:-translate-x-1/2 after:-translate-y-1/2'
                    type='checkbox'
                    name='consent'
                    required
                  />
                  <span className='pointer-events-none absolute inset-0 z-[2] flex items-center justify-center text-white opacity-0 transition-opacity duration-200 ease-out peer-checked:opacity-100 [&>svg]:size-3'>
                    <LuCheck aria-hidden />
                  </span>
                </span>
                I agree to be contacted about this partnership request.
              </label>

              {status === 'error' && (
                <p
                  role='alert'
                  className='text-[13px] leading-[1.5] text-[#ff8a8a]'
                >
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type='submit'
                disabled={status === 'sending'}
                className='lagune-cta group relative mt-1 inline-flex items-center justify-center gap-2.5 pl-5 pr-[22px] py-[13px] rounded-[13px] overflow-hidden font-sans text-[14px] font-bold tracking-[-0.01em] text-white cursor-pointer transition-[box-shadow] duration-300 ease-out [background:linear-gradient(180deg,#1f7bff_0%,var(--color-accent)_100%)] [box-shadow:inset_0_1px_0_rgba(0,0,0,0.35),0_2px_6px_-2px_rgba(0,0,0,0.35)] hover:[box-shadow:inset_0_1px_0_rgba(0,0,0,0.45),0_6px_14px_-4px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70'
              >
                <LuSend className='size-[17px] shrink-0' aria-hidden />
                <span className='[text-shadow:0_1px_1px_rgba(0,0,0,.5)]'>
                  {status === 'sending' ? 'Sending…' : "Let's build together"}
                </span>
              </button>
            </form>

            <aside className='lagune-fade-in relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-[18px] border border-white/[0.12] text-center md:rounded-none md:border-0 md:border-l md:border-white/[0.12] md:max-w-[300px] bg-[rgba(10,15,31,0.55)] px-[clamp(18px,2.5vw,28px)] py-[clamp(20px,2.5vw,24px)] [backdrop-filter:blur(20px)_saturate(150%)] [-webkit-backdrop-filter:blur(20px)_saturate(150%)] md:-mt-[clamp(24px,4vw,56px)] md:-mb-[clamp(24px,4vw,56px)] md:-mr-[clamp(24px,4vw,56px)] md:py-[clamp(24px,4vw,56px)] [animation-delay:0.16s]'>
              <div
                className='pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-[0.025] mix-blend-screen'
                style={{
                  backgroundImage: 'url(/img/bg-partner-texture.jpg)',
                }}
                aria-hidden
              />

              <div className='flex flex-col items-center gap-4'>
                <img
                  src='/img/wellwelwel.png'
                  alt='Weslley Araújo'
                  decoding='async'
                  draggable={false}
                  className='pointer-events-none w-32 shrink-0 object-cover [filter:drop-shadow(0_5px_10px_rgba(2,6,20,0.5))_drop-shadow(0_2px_4px_rgba(0,0,0,0.4))] md:w-55'
                />

                <p className='text-[13px] font-medium leading-[1.6] text-pretty text-[rgba(233,237,247,0.88)] m-0'>
                  With over{' '}
                  <span className='font-semibold text-ink tabular-nums'>
                    {downloads}
                  </span>{' '}
                  downloads across his own projects, Weslley impacts millions of
                  developers worldwide through open source. A recognized
                  Microsoft MVP, he specializes in building for developers and
                  brings the essence of creativity back to development.
                </p>
              </div>

              <div className='mt-auto flex items-center justify-center gap-1'>
                {SOCIALS.map(({ name, url, Icon }) => (
                  <a
                    key={name}
                    href={url}
                    target='_blank'
                    rel='noopener'
                    aria-label={name}
                    className='relative inline-flex items-center justify-center size-7 text-[rgba(233,237,247,0.6)] transition-colors duration-200 ease-out hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 [&>svg]:size-[18px]'
                  >
                    <Icon aria-hidden />
                  </a>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </Modal>
  );
};
