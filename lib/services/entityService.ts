export type EntityOperationResult<TData = unknown> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      error: string;
    };

export function entityOperationOk<TData>(
  data: TData
): EntityOperationResult<TData> {
  return {
    ok: true,
    data,
  };
}

export function entityOperationError(
  error: string
): EntityOperationResult<never> {
  return {
    ok: false,
    error,
  };
}