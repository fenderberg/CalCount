export type Tab = 'home' | 'progress';

interface Props {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

// DESIGN.md: components.tab-bar.
export function TabBar({ tab, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md border-t border-ink/[0.07] bg-surface-card/90 backdrop-blur-md">
      <TabButton
        active={tab === 'home'}
        onClick={() => onChange('home')}
        label="Vandaag"
        icon="◎"
      />
      <TabButton
        active={tab === 'progress'}
        onClick={() => onChange('progress')}
        label="Voortgang"
        icon="📈"
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
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${
        active ? 'text-budget-under' : 'text-text-faint'
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </button>
  );
}
