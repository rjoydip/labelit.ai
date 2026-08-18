import { describe, expect, it, vi, afterEach } from "vitest";
import { GitHubActionsProvider } from "../../../src/providers/github/actions";

function mockFetchOnce(jsonBody: unknown = [], textBody = "") {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => jsonBody,
    text: async () => textBody,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function mockFetchSequence(
  responses: { ok: boolean; status: number; json: unknown; text?: string }[],
) {
  const fn = vi.fn().mockImplementation(() => {
    const next = responses.shift();
    if (!next) {
      throw new Error("No more mocked responses");
    }
    return Promise.resolve({
      ok: next.ok,
      status: next.status,
      json: async () => next.json,
      text: async () => next.text ?? "",
    });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("GitHubActionsProvider target parsing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should build a correct labels URL for owner/repo#N targets", async () => {
    const fetchMock = mockFetchOnce([{ name: "type:bug" }]);
    const provider = new GitHubActionsProvider({ token: "test-token" });

    const labels = await provider.getLabels("owner/repo#1");

    expect(labels).toEqual(["type:bug"]);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("https://api.github.com/repos/owner/repo/issues/1/labels");
  });

  it("should POST to the correct URL when adding labels", async () => {
    const fetchMock = mockFetchOnce({});
    const provider = new GitHubActionsProvider({ token: "test-token" });

    await provider.addLabels("owner/repo#1", ["type:bug"]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/owner/repo/issues/1/labels");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ labels: ["type:bug"] });
  });

  it("should DELETE the correct URL when removing a label", async () => {
    const fetchMock = mockFetchOnce({});
    const provider = new GitHubActionsProvider({ token: "test-token" });

    await provider.removeLabels("owner/repo#1", ["type:bug"]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/owner/repo/issues/1/labels/type%3Abug");
    expect(init.method).toBe("DELETE");
  });

  it("should fetch the PR diff from the pulls endpoint", async () => {
    const fetchMock = mockFetchOnce(undefined, "diff --git a/src/index.ts b/src/index.ts");
    const provider = new GitHubActionsProvider({ token: "test-token" });

    const diff = await provider.getPRDiff("owner", "repo", 1);

    expect(diff).toContain("diff --git");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/owner/repo/pulls/1");
    expect((init.headers as Record<string, string>).Accept).toBe("application/vnd.github.v3.diff");
  });

  it("should paginate through all repository labels", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      name: `type:label-${i}`,
      color: "ededed",
      description: null,
    }));
    const page2 = [
      { name: "type:extra-1", color: "ededed", description: null },
      { name: "type:extra-2", color: "ededed", description: null },
    ];
    const fetchMock = mockFetchSequence([
      { ok: true, status: 200, json: page1 },
      { ok: true, status: 200, json: page2 },
    ]);
    const provider = new GitHubActionsProvider({ token: "test-token" });

    const labels = await provider.getRepositoryLabels("owner", "repo");

    expect(labels).toHaveLength(102);
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls[0]).toContain("per_page=100&page=1");
    expect(urls[1]).toContain("per_page=100&page=2");
  });

  it("should tolerate a 404 when removing an already-removed label", async () => {
    const fetchMock = mockFetchSequence([
      { ok: false, status: 404, json: {} },
      { ok: true, status: 200, json: {} },
    ]);
    const provider = new GitHubActionsProvider({ token: "test-token" });

    await expect(
      provider.removeLabels("owner/repo#1", ["type:bug", "priority:high"]),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should rethrow non-404 errors when removing a label", async () => {
    mockFetchSequence([{ ok: false, status: 500, json: {} }]);
    const provider = new GitHubActionsProvider({ token: "test-token" });

    await expect(provider.removeLabels("owner/repo#1", ["type:bug"])).rejects.toThrow(
      "GitHub API error: 500",
    );
  });
});
