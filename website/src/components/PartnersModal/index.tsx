import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LuCheck, LuHeartHandshake, LuSend, LuX } from 'react-icons/lu';

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

const DRAFT_KEY = 'bluespec:partners-draft';
const WEB3FORMS_PUBLIC_KEY = '0e430072-493e-4eba-9991-9879134fe5ef';
const SUBMIT_COOLDOWN_MS = 8000;
const PARTNERSHIP_TYPES = [
  'Sponsorship',
  'Co-marketing',
  'Integration',
  'Other',
] as const;

const fieldClass =
  'w-full rounded-xl border border-line bg-card px-3.5 py-2.5 font-sans text-[15px] leading-[1.5] text-ink placeholder:font-sans placeholder:text-muted transition-[border-color,background-color,box-shadow] duration-200 ease-out outline-none hover:border-white/[0.18] focus:border-accent focus:bg-card-hover focus:[box-shadow:0_0_0_3px_rgba(0,94,255,0.18)]';

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
}): ReactNode => (
  <div
    className='flex flex-wrap gap-2'
    role='radiogroup'
    aria-label='Partnership type'
  >
    {PARTNERSHIP_TYPES.map((type) => {
      const on = value === type;

      return (
        <button
          key={type}
          type='button'
          role='radio'
          aria-checked={on}
          onClick={() => onChange(type)}
          className={`rounded-xl border px-3.5 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
            on
              ? 'text-ink border-accent/50 bg-accent/15'
              : 'text-[rgba(233,237,247,0.7)] border-line bg-card hover:bg-card-hover hover:border-white/[0.16] hover:text-ink'
          }`}
        >
          {type}
        </button>
      );
    })}
  </div>
);

const SuccessState = ({ onReset }: { onReset: () => void }): ReactNode => (
  <div className='bs-fade-in flex flex-col items-center text-center gap-4 py-8'>
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
  const panelRef = useRef<HTMLDivElement>(null);
  const lastSubmitRef = useRef(0);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft]);

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

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

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
          subject: 'New partnership request — Blue Spec',
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
    <div
      className='bs-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-[clamp(12px,4vw,48px)] bg-[rgba(2,4,12,0.72)] [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)]'
      onClick={onClose}
      role='presentation'
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label='Partner with Blue Spec'
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className='bs-modal-panel relative flex flex-col w-full max-w-[560px] max-h-full rounded-[20px] border border-[#0c155c] bg-[#0a0f1f] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
      >
        <div className='flex items-center justify-between gap-4 shrink-0 px-[clamp(20px,3vw,32px)] py-4 border-b border-[#0c155c] bg-[#0a0f1f]'>
          <span className='inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-muted [&>svg]:size-3.5 [&>svg]:text-accent'>
            <LuHeartHandshake aria-hidden />
            Partnerships
          </span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='relative inline-flex items-center justify-center size-9 -mr-1.5 rounded-full text-[#9499a5] transition-[color,background-color] duration-200 ease-out hover:bg-white/[0.08] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 [&>svg]:size-[18px]'
          >
            <LuX />
          </button>
        </div>

        <div className='flex flex-col min-h-0 overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,28px)]'>
          {sent ? (
            <SuccessState onReset={() => setSent(false)} />
          ) : (
            <>
              <div className='bs-fade-in flex flex-col gap-2'>
                <h2 className='font-display font-black text-[clamp(22px,3vw,26px)] leading-[1.2] tracking-[-0.02em] text-ink m-0'>
                  Partner with Blue Spec
                </h2>
                <p className='text-[15px] leading-[1.6] text-[rgba(233,237,247,0.82)] m-0'>
                  Building something in the security or AI-coding space? Put
                  your name next to security-by-default. Partners get a mention,
                  and integrations get a spotlight. Tell what you have in mind.
                </p>
              </div>

              <form
                onSubmit={onSubmit}
                className='bs-fade-in mt-6 flex flex-col gap-4 [animation-delay:0.08s]'
              >
                <input
                  type='text'
                  name='website'
                  className='absolute -left-[9999px] size-px overflow-hidden'
                  tabIndex={-1}
                  autoComplete='off'
                  aria-hidden
                />

                <Field label='Your name'>
                  <input
                    className={fieldClass}
                    type='text'
                    name='name'
                    autoComplete='name'
                    placeholder='John Doe'
                    value={draft.name}
                    onChange={update('name')}
                    required
                  />
                </Field>

                <Field label='Work email'>
                  <input
                    className={fieldClass}
                    type='email'
                    name='email'
                    autoComplete='email'
                    placeholder='john@company.com'
                    value={draft.email}
                    onChange={update('email')}
                    required
                  />
                </Field>

                <Field label='Company'>
                  <input
                    className={fieldClass}
                    type='text'
                    name='company'
                    autoComplete='organization'
                    placeholder='Acme, Inc.'
                    value={draft.company}
                    onChange={update('company')}
                    required
                  />
                </Field>

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
                  className='bs-cta group relative mt-1 inline-flex items-center justify-center gap-2.5 pl-5 pr-[22px] py-[13px] rounded-[13px] overflow-hidden font-sans text-[14px] font-bold tracking-[-0.01em] text-white cursor-pointer transition-[box-shadow] duration-300 ease-out [background:linear-gradient(180deg,#1f7bff_0%,var(--color-accent)_100%)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_2px_6px_-2px_rgba(0,0,0,0.35)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.45),0_6px_14px_-4px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70'
                >
                  <LuSend className='size-[17px] shrink-0' aria-hidden />
                  <span className='[text-shadow:0_1px_1px_rgba(0,0,0,.5)]'>
                    {status === 'sending' ? 'Sending…' : "Let's work together"}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
