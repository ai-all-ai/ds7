# 10 · Observability: real users and errors

Lab numbers (Lighthouse, WebPageTest) are targets, not proof. Measure what real visitors get.

---

## 1. Real-user Web Vitals (RUM)

- Collect LCP, INP and CLS from real visitors with the `web-vitals` library (`onLCP`, `onINP`, `onCLS`).
- Load the collector after the page is interactive, on idle. It must not delay LCP.
- Send each metric once per page view, when the page is hidden. Use `navigator.sendBeacon` with a fallback to `fetch` with `keepalive: true`.
- Send only the metric name, its value, the rating (`good`, `needs-improvement`, `poor`), the page path without query string, and the locale.
- Sample if traffic is high (for example 10 %). Record the rate in `docs/DECISIONS.md`.
- Send nothing when the visitor has not given analytics consent (see `ALL.md` section 6). The collector checks the consent key before it starts.
- Review the numbers per page type each month. Put the dated results in `docs/METRICS.md`, with the source and the sample size.

## 2. Client errors

- Catch uncaught errors and unhandled promise rejections. Send the error name, a short message, the page path and the release version.
- Strip values that could be personal: e-mail addresses, phone numbers, tokens and anything in the query string. Truncate messages to 300 characters.
- Do not collect screen recordings, keystrokes or form values.
- Group errors by message and path. An error that appears on one release only is a regression candidate.

## 3. Server and build logs

- Log request ID, path, status, duration and release. Do not log request bodies, cookies or IP addresses in full.
- Keep logs for the period the owner decides and write it in `docs/DECISIONS.md`.
- A build that fails is a visible failure: the CI status is red and the release is not deployed.

## 4. Alerts

- Alert on a rise in 5xx responses, a rise in client errors per 1 000 page views, and a failed deploy.
- An alert names an owner and a first action. An alert without either is removed.

## 5. Checks

| Check | How | When |
|---|---|---|
| Collector loads after LCP | Playwright: the network request for the collector starts after `load` | QA gate |
| No personal data in events | Unit test: the event builder strips e-mail, phone and query values | Each change to the collector |
| Consent respected | Playwright: no beacon before consent, one beacon after | QA gate |
