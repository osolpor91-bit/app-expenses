type EcbRateSet = {
  date: string;
  ratesByCurrency: Record<string, number>;
};

export type EcbExchangeRateResult = {
  sourceExchangeDate: string;
  exchangeRate: number;
};

const ecbLast90DaysUrl =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";

const ecbFullHistoryUrl =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml";

function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

function roundExchangeRate(value: number) {
  return Number(value.toFixed(8));
}

function getCurrencyRate({
  rateSet,
  currencyCode,
}: {
  rateSet: EcbRateSet;
  currencyCode: string;
}) {
  if (currencyCode === "EUR") {
    return 1;
  }

  return rateSet.ratesByCurrency[currencyCode] ?? null;
}

function parseEcbRateSets(xml: string): EcbRateSet[] {
  const rateSets: EcbRateSet[] = [];
  const dayRegex =
    /<Cube\s+time=["'](\d{4}-\d{2}-\d{2})["']>([\s\S]*?)<\/Cube>/g;
  const currencyRegex =
    /<Cube\s+currency=["']([A-Z]{3})["']\s+rate=["']([\d.]+)["']\s*\/>/g;

  let dayMatch: RegExpExecArray | null;

  while ((dayMatch = dayRegex.exec(xml)) !== null) {
    const [, date, dayContent] = dayMatch;
    const ratesByCurrency: Record<string, number> = {};

    let currencyMatch: RegExpExecArray | null;

    while ((currencyMatch = currencyRegex.exec(dayContent)) !== null) {
      const [, currencyCode, rawRate] = currencyMatch;
      const rate = Number(rawRate);

      if (Number.isFinite(rate) && rate > 0) {
        ratesByCurrency[currencyCode] = rate;
      }
    }

    rateSets.push({
      date,
      ratesByCurrency,
    });
  }

  return rateSets;
}

async function fetchEcbXml(url: string) {
  const response = await fetch(url, {
    next: {
      revalidate: 60 * 60 * 6,
    },
  });

  if (!response.ok) {
    throw new Error(
      `No se ha podido consultar el BCE. Código HTTP ${response.status}.`
    );
  }

  return response.text();
}

function findLatestAvailableRate({
  rateSets,
  exchangeDate,
  referenceCurrencyCode,
  exchangeCurrencyCode,
}: {
  rateSets: EcbRateSet[];
  exchangeDate: string;
  referenceCurrencyCode: string;
  exchangeCurrencyCode: string;
}): EcbExchangeRateResult | null {
  const sortedRateSets = [...rateSets].sort((left, right) =>
    right.date.localeCompare(left.date)
  );

  for (const rateSet of sortedRateSets) {
    if (rateSet.date > exchangeDate) {
      continue;
    }

    const referenceRate = getCurrencyRate({
      rateSet,
      currencyCode: referenceCurrencyCode,
    });

    const exchangeRate = getCurrencyRate({
      rateSet,
      currencyCode: exchangeCurrencyCode,
    });

    if (!referenceRate || !exchangeRate) {
      continue;
    }

    return {
      sourceExchangeDate: rateSet.date,
      exchangeRate: roundExchangeRate(exchangeRate / referenceRate),
    };
  }

  return null;
}

async function getEcbExchangeRateFromUrl({
  url,
  exchangeDate,
  referenceCurrencyCode,
  exchangeCurrencyCode,
}: {
  url: string;
  exchangeDate: string;
  referenceCurrencyCode: string;
  exchangeCurrencyCode: string;
}) {
  const xml = await fetchEcbXml(url);
  const rateSets = parseEcbRateSets(xml);

  return findLatestAvailableRate({
    rateSets,
    exchangeDate,
    referenceCurrencyCode,
    exchangeCurrencyCode,
  });
}

export async function getEcbExchangeRate({
  exchangeDate,
  referenceCurrencyCode,
  exchangeCurrencyCode,
}: {
  exchangeDate: string;
  referenceCurrencyCode: string;
  exchangeCurrencyCode: string;
}): Promise<EcbExchangeRateResult> {
  const normalizedReferenceCurrencyCode =
    normalizeCurrencyCode(referenceCurrencyCode);
  const normalizedExchangeCurrencyCode =
    normalizeCurrencyCode(exchangeCurrencyCode);

  if (normalizedReferenceCurrencyCode === normalizedExchangeCurrencyCode) {
    return {
      sourceExchangeDate: exchangeDate,
      exchangeRate: 1,
    };
  }

  const last90DaysResult = await getEcbExchangeRateFromUrl({
    url: ecbLast90DaysUrl,
    exchangeDate,
    referenceCurrencyCode: normalizedReferenceCurrencyCode,
    exchangeCurrencyCode: normalizedExchangeCurrencyCode,
  });

  if (last90DaysResult) {
    return last90DaysResult;
  }

  const fullHistoryResult = await getEcbExchangeRateFromUrl({
    url: ecbFullHistoryUrl,
    exchangeDate,
    referenceCurrencyCode: normalizedReferenceCurrencyCode,
    exchangeCurrencyCode: normalizedExchangeCurrencyCode,
  });

  if (fullHistoryResult) {
    return fullHistoryResult;
  }

  throw new Error(
    `No se ha encontrado tipo de cambio oficial BCE para ${normalizedReferenceCurrencyCode}/${normalizedExchangeCurrencyCode} en ${exchangeDate} ni en días anteriores.`
  );
}