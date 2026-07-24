export type Tab = 'home' | 'progress';

interface Props {
  tab: Tab;
  onChange: (tab: Tab) => void;
  onAdd: () => void;
}

// DESIGN.md: components.tab-bar.
export function TabBar({ tab, onChange, onAdd }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto grid h-[92px] max-w-md grid-cols-[1fr_82px_1fr] items-start border-t border-ink/[0.07] bg-surface-card/90 px-8 pt-3.5 backdrop-blur-md" aria-label="Hoofdnavigatie">
      <TabButton
        active={tab === 'home'}
        onClick={() => onChange('home')}
        label="Vandaag"
        icon={<HomeIcon active={tab === 'home'} />}
      />
      <button
        type="button"
        onClick={onAdd}
        aria-label="Eten toevoegen"
        className="mx-auto flex h-[62px] w-[62px] -translate-y-8 items-center justify-center rounded-full bg-ink text-[32px] font-normal leading-none text-surface-page shadow-fab active:scale-95"
      >
        +
      </button>
      <TabButton
        active={tab === 'progress'}
        onClick={() => onChange('progress')}
        label="Voortgang"
        icon={<ProgressIcon active={tab === 'progress'} />}
      />
    </nav>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-tap-min flex-col items-center gap-1 text-[11px] ${
        active ? 'font-bold text-ink' : 'font-semibold text-text-muted'
      }`}
    >
      <span className="flex h-[22px] items-end leading-none">{icon}</span>
      {label}
    </button>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return <span className={`h-[22px] w-[22px] rounded-[7px] ${active ? 'bg-ink' : 'bg-text-faint/70'}`} />;
}

function ProgressIcon({ active }: { active: boolean }) {
  const color = active ? 'bg-ink' : 'bg-text-faint/70';
  return (
    <span className="flex h-[22px] items-end gap-[3px]">
      <span className={`h-[11px] w-[5px] rounded-sm ${color}`} />
      <span className={`h-[20px] w-[5px] rounded-sm ${color}`} />
      <span className={`h-[15px] w-[5px] rounded-sm ${color}`} />
    </span>
  );
}
