export interface BulkDeleteResult {
  ok: number[];
  fail: number[];
}

/**
 * Exclui vários ids em sequência via DELETE. Cada exclusão é independente:
 * se uma falhar, as demais continuam. Devolve os ids que deram certo e os que
 * falharam para feedback ao usuário.
 */
export async function bulkDelete(
  ids: number[],
  buildUrl: (id: number) => string,
  token: string | null | undefined
): Promise<BulkDeleteResult> {
  const ok: number[] = [];
  const fail: number[] = [];
  for (const id of ids) {
    try {
      const res = await fetch(buildUrl(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) ok.push(id);
      else fail.push(id);
    } catch {
      fail.push(id);
    }
  }
  return { ok, fail };
}
