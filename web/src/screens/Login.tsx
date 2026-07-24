import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { login } from '../api.js';

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-surface-page px-6">
      <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">CalCount</h1>
      <p className="mt-1 text-text-muted">Log in om verder te gaan.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-text-subtle">
            Gebruikersnaam
          </span>
          <input
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-text-subtle">
            Wachtwoord
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        {mutation.isError && (
          <p className="text-sm font-medium text-budget-over">
            {(mutation.error as Error).message}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !username || !password}
          className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page disabled:opacity-40"
        >
          {mutation.isPending ? 'Inloggen...' : 'Inloggen'}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-ink/10 bg-surface-card px-4 py-3.5 text-lg text-ink outline-none focus:border-budget-under';
