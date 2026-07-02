"use server";

import { revalidatePath } from "next/cache";

import { requireTenant } from "@/lib/auth/requireTenant";
import { countryEntity } from "@/lib/entities/countries/countryEntity";
import { upsertEntityRecords } from "@/lib/entities/core/entityRepository";
import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionaryByLocale } from "@/lib/i18n/dictionaries";

type EuCountryFromAi = {
  code: string;
  name: string;
  is_eu: boolean;
};

type FillEuCountriesResult = {
  ok: boolean;
  message: string;
};

function getSafeLocale(locale: Locale): Locale {
  return isLocale(locale) ? locale : defaultLocale;
}

function normalizeEuCountries(countries: EuCountryFromAi[]) {
  return countries
    .map((country) => ({
      code: String(country.code ?? "").trim().toUpperCase(),
      name: String(country.name ?? "").trim(),
      is_eu: Boolean(country.is_eu),
    }))
    .filter((country) => {
      return (
        country.code.length === 2 &&
        country.name.length > 0 &&
        country.is_eu === true
      );
    });
}

function extractJsonFromGeminiText(text: string) {
  const cleanText = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleanText) as { countries?: EuCountryFromAi[] };
}

async function getEuCountriesFromGemini(
  locale: Locale
): Promise<EuCountryFromAi[]> {
  const dict = getDictionaryByLocale(locale);

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error(dict.countries.ai.missingApiKey);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
Devuelve únicamente JSON válido, sin markdown y sin explicación.

Necesito la lista actual de países miembros de la Unión Europea.

Formato exacto:
{
  "countries": [
    {
      "code": "ES",
      "name": "España",
      "is_eu": true
    }
  ]
}

Reglas:
- code debe ser ISO 3166-1 alpha-2 en mayúsculas.
- name debe estar en español.
- is_eu debe ser true.
- No incluyas países que no sean miembros actuales de la Unión Europea.
                `.trim(),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${dict.countries.ai.geminiCallError}: ${errorText}`);
  }

  const responseBody = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text =
    responseBody.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n") ?? "";

  if (!text) {
    throw new Error(dict.countries.ai.geminiNoContent);
  }

  const parsed = extractJsonFromGeminiText(text);

  if (!Array.isArray(parsed.countries)) {
    throw new Error(dict.countries.ai.geminiInvalidCountries);
  }

  return normalizeEuCountries(parsed.countries);
}

export async function fillEuCountriesWithAi(
  locale: Locale
): Promise<FillEuCountriesResult> {
  const safeLocale = getSafeLocale(locale);
  const dict = getDictionaryByLocale(safeLocale);

  const { supabase, tenant, role } = await requireTenant();

  if (role !== "owner" && role !== "admin") {
    return {
      ok: false,
      message: dict.countries.ai.noPermission,
    };
  }

  try {
    const euCountries = await getEuCountriesFromGemini(safeLocale);

    if (euCountries.length === 0) {
      return {
        ok: false,
        message: dict.countries.ai.noValidCountries,
      };
    }

    const rowsToUpsert = euCountries.map((country) => ({
      tenant_id: tenant.id,
      code: country.code,
      name: country.name,
      is_eu: country.is_eu,
    }));

    const { error } = await upsertEntityRecords({
      supabase,
      entity: countryEntity,
      payloads: rowsToUpsert,
      onConflict: "tenant_id,code",
    });

    if (error) {
      return {
        ok: false,
        message: `${dict.countries.ai.updateError}: ${error.message}`,
      };
    }

    revalidatePath("/countries");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: dict.countries.ai.success.replace(
        "{count}",
        String(rowsToUpsert.length)
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : dict.countries.ai.unexpected,
    };
  }
}