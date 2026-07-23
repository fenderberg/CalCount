import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getProfile } from './api.js';
import { TabBar, type Tab } from './components/TabBar.js';
import { Home } from './screens/Home.js';
import { Onboarding } from './screens/Onboarding.js';
import { Progress } from './screens/Progress.js';

export function App() {
  // 'auto' laat de aanwezigheid van een profiel bepalen welk scherm toont;
  // 'edit' forceert het profielformulier (bijv. via "profiel wijzigen").
  const [mode, setMode] = useState<'auto' | 'edit'>('auto');
  const [tab, setTab] = useState<Tab>('home');

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  if (isLoading) {
    return <CenterMessage>Laden...</CenterMessage>;
  }

  if (isError) {
    return (
      <CenterMessage>
        Kan de server niet bereiken.
        <br />
        <span className="text-sm text-slate-500">{(error as Error).message}</span>
      </CenterMessage>
    );
  }

  if (!profile || mode === 'edit') {
    return (
      <Onboarding
        existing={profile ?? undefined}
        onDone={() => setMode('auto')}
        onCancel={profile ? () => setMode('auto') : undefined}
      />
    );
  }

  return (
    <>
      {tab === 'home' ? (
        <Home profile={profile} onEditProfile={() => setMode('edit')} />
      ) : (
        <Progress profile={profile} onEditProfile={() => setMode('edit')} />
      )}
      <TabBar tab={tab} onChange={setTab} />
    </>
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6 text-center text-slate-700">
      <div>{children}</div>
    </div>
  );
}
