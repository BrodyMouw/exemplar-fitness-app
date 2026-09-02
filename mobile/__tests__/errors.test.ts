import { AxiosError, type AxiosResponse } from "axios";
import { describeError, isNotFound } from "../api/errors";

function responded(status: number): AxiosError {
  const response = { status, data: {}, statusText: "", headers: {} } as AxiosResponse;
  return new AxiosError("failed", "ERR_BAD_RESPONSE", undefined, undefined, response);
}

// axios reports an unreachable host with no `response` at all - that absence
// is the only thing separating "the API is down" from "the API answered".
function unreachable(): AxiosError {
  return new AxiosError("Network Error", "ERR_NETWORK");
}

describe("describeError", () => {
  it("says the server is unreachable when there was no response", () => {
    expect(describeError(unreachable())).toMatch(/reach the server/i);
  });

  it("reports an expired session for 401 and 403", () => {
    expect(describeError(responded(401))).toMatch(/session/i);
    expect(describeError(responded(403))).toMatch(/session/i);
  });

  it("reports a server-side problem for 5xx", () => {
    expect(describeError(responded(500))).toMatch(/server ran into a problem/i);
    expect(describeError(responded(503))).toMatch(/server ran into a problem/i);
  });

  it("reports a rejected change for other 4xx", () => {
    expect(describeError(responded(400))).toMatch(/wasn't accepted/i);
  });

  it("falls back to something generic for a non-axios throw", () => {
    expect(describeError(new Error("boom"))).toMatch(/something went wrong/i);
    expect(describeError("boom")).toMatch(/something went wrong/i);
  });

  // The bug this module exists for: an unreachable API used to be presented
  // the same way as an empty account. These two must never read alike.
  it("distinguishes an unreachable server from a 404", () => {
    expect(describeError(unreachable())).not.toEqual(describeError(responded(404)));
  });
});

describe("isNotFound", () => {
  it("is true only for a 404 response", () => {
    expect(isNotFound(responded(404))).toBe(true);
    expect(isNotFound(responded(500))).toBe(false);
    expect(isNotFound(responded(401))).toBe(false);
  });

  // A dead server must not be mistaken for "this exercise has no history",
  // which is exactly what ExerciseHistoryScreen used to do.
  it("is false when the request never reached the server", () => {
    expect(isNotFound(unreachable())).toBe(false);
  });

  it("is false for a non-axios throw", () => {
    expect(isNotFound(new Error("boom"))).toBe(false);
  });
});
