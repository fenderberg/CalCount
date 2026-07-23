export type Tab = 'home' | 'progress';

interface Props {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ tab, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md border-t border-slate-100 bg-white">
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
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
        active ? 'text-green-600' : 'text-slate-400'
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </button>
  );
}
