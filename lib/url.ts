// URL verification. Extracted from digest-sync so any LLM pipeline that emits
// source links can verify them the same way: only persist a URL that actually
// fetches OK, and derive the source domain from the URL the fetch RESOLVED to,
// never from model output. This is the guard against hallucinated links.

const URL_TIMEOUT_MS = 8000;

export async function verifyUrl(url: string): Promise<{ ok: boolean; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Browser-ish UA: plenty of news sites 403 obvious bot agents
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    void res.body?.cancel().catch(() => {}); // status is all we need
    return { ok: res.ok, finalUrl: res.url || url };
  } catch {
    return { ok: false, finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}
