import axios from "axios";

// Turns a thrown request into a sentence worth showing someone.
//
// The distinction that actually matters is "the server answered and said no"
// versus "we never reached the server at all". The app used to collapse both
// into an empty list, which reads as "you have no data" - a claim about the
// user's account that simply isn't true when the API is just unreachable.
// A 404 is sometimes a legitimate answer rather than a failure - the exercise
// history endpoint returns one for "this exercise has no logs" - so callers
// that treat it as data need to tell it apart from a request that broke.
export function isNotFound(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Can't reach the server. Check your connection and try again.";
    }

    const status = err.response.status;
    if (status === 401 || status === 403) {
      return "Your session has expired. Sign out and back in to continue.";
    }
    if (status === 404) {
      return "This isn't there anymore - it may have been deleted.";
    }
    if (status >= 500) {
      return "The server ran into a problem. Try again in a moment.";
    }
    return "That change wasn't accepted. Check the values and try again.";
  }

  return "Something went wrong. Try again.";
}
