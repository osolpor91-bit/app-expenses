import { getDictionary } from "@/lib/i18n/server";

import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const { dict } = await getDictionary();

  return (
    <LoginForm
      labels={{
        back: dict.auth.back,
        email: dict.auth.email,
        password: dict.auth.password,
        title: dict.auth.loginTitle,
        description: dict.auth.loginDescription,
        submit: dict.auth.loginButton,
        submitting: dict.auth.loggingIn,
        noAccount: dict.auth.noAccount,
        createAccount: dict.auth.createAccountLink,
      }}
    />
  );
}