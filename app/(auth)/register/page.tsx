import { getDictionary } from "@/lib/i18n/server";

import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const { dict } = await getDictionary();

  return (
    <RegisterForm
      labels={{
        back: dict.auth.back,
        email: dict.auth.email,
        password: dict.auth.password,
        title: dict.auth.registerTitle,
        description: dict.auth.registerDescription,
        submit: dict.auth.registerButton,
        submitting: dict.auth.creatingAccount,
        alreadyHaveAccount: dict.auth.alreadyHaveAccount,
        login: dict.auth.loginLink,
        accountCreated: dict.auth.accountCreated,
      }}
    />
  );
}