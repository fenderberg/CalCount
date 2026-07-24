import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getProfile } from './api.js';
import { TabBar, type Tab } from './components/TabBar.js';
import { Home } from './screens/Home.js';
import { Login } from './screens/Login.js';
import { Onboarding } from './screens/Onboarding.js';
import { Progress } from './screens/Progress.js';

export function App() {
  // 'auto' laat de aanwezigheid van een profiel bepalen welk scherm toont;
  // 'edit' forceert het profielformulier (bijv. via "profiel wijzigen").
  const [mode, setMode] = useState<'auto' | 'edit'>('auto');
  const [tab, setTab] = useState<Tab>('home');
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: (failureCount, err) =>
      (err as { status?: number }).status !== 401 && failureCount < 3,
  });

  if (isLoading) {
    return <CenterMessage>Laden...</CenterMessage>;
  }

  if ((error as { status?: number } | null)?.status === 401) {
    return (
      <Login onSuccess={() => queryClient.invalidateQueries({ queryKey: ['profile'] })} />
    );
  }

  if (isError) {
    return (
      <CenterMessage>
        Kan de server niet bereiken.
        <br />
        <span className="text-sm text-text-muted">{(error as Error).message}</span>
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
    <div className="flex min-h-dvh items-center justify-center bg-surface-page p-6 text-center text-ink">
      <div>{children}</div>
    </div>
  );
}
