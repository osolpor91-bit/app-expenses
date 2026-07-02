"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type LoginFormLabels = {
  back: string;
  email: string;
  password: string;
  title: string;
  description: string;
  submit: string;
  submitting: string;
  noAccount: string;
  createAccount: string;
};

type LoginFormProps = {
  labels: LoginFormLabels;
};

export default function LoginForm({ labels }: LoginFormProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-soft px-4 text-app">
      <section className="card-app w-full max-w-md p-6">
        <a href="/" className="link-app text-sm">
          ← {labels.back}
        </a>

        <h1 className="mt-6 text-2xl font-bold text-primary-app">
          {labels.title}
        </h1>

        <p className="mt-2 text-sm text-app-muted">{labels.description}</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-app-muted">{labels.email}</label>
            <input
              type="email"
              className="input-app mt-1 px-3 py-2 text-sm"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-app-muted">{labels.password}</label>
            <input
              type="password"
              className="input-app mt-1 px-3 py-2 text-sm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {message && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary-app w-full px-4 py-2 text-sm disabled:opacity-60"
          >
            {isLoading ? labels.submitting : labels.submit}
          </button>
        </form>

        <p className="mt-4 text-sm text-app-muted">
          {labels.noAccount}{" "}
          <a
            href="/register"
            className="font-semibold text-primary-app underline"
          >
            {labels.createAccount}
          </a>
        </p>
      </section>
    </main>
  );
}