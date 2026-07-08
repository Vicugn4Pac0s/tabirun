import { describe, expect, it, vi } from "vitest";
import { executeMutationWithCallbacks } from "~/frontend/lib/executeMutationWithCallbacks";

describe("executeMutationWithCallbacks", () => {
  it("mutation 成功時に onSuccess と onSettled を順に呼び、結果を返す", async () => {
    const events: string[] = [];
    const mutation = {
      mutateAsync: vi.fn(async (input: { value: string }) => {
        events.push(`mutate:${input.value}`);
        return { ok: true };
      }),
    };
    const onSuccess = vi.fn(async () => {
      events.push("success");
    });
    const onSettled = vi.fn(async () => {
      events.push("settled");
    });

    const result = await executeMutationWithCallbacks(
      mutation,
      { value: "test" },
      { onSuccess, onSettled },
    );

    expect(result).toEqual({ ok: true });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["mutate:test", "success", "settled"]);
  });

  it("mutation 失敗時に onError と onSettled を呼び、例外を再スローする", async () => {
    const error = new Error("mutation failed");
    const events: string[] = [];
    const mutation = {
      mutateAsync: vi.fn(async () => {
        events.push("mutate");
        throw error;
      }),
    };
    const onError = vi.fn(async (err: unknown) => {
      events.push(`error:${(err as Error).message}`);
    });
    const onSettled = vi.fn(async () => {
      events.push("settled");
    });

    await expect(
      executeMutationWithCallbacks(mutation, undefined, { onError, onSettled }),
    ).rejects.toThrow(error);

    expect(onError).toHaveBeenCalledWith(error);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["mutate", "error:mutation failed", "settled"]);
  });

  it("callback が未指定でも mutation を実行できる", async () => {
    const mutation = {
      mutateAsync: vi.fn(async () => "done"),
    };

    const result = await executeMutationWithCallbacks(mutation, undefined);

    expect(result).toBe("done");
    expect(mutation.mutateAsync).toHaveBeenCalledOnce();
  });
});
