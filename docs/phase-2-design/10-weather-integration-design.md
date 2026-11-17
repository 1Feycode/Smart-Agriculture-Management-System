# 10. Weather Integration Design

## Provider recommendation and verification

**Candidate for evaluation: Open-Meteo Forecast API**, using its public `https://api.open-meteo.com/v1/forecast` endpoint. Official documentation lists current, hourly and daily variables, including temperature, relative humidity, precipitation, wind speed and weather code, with forecast horizons up to 16 days; default forecast is seven days. The provider pricing page identifies free/open-access usage, non-commercial/evaluation context and usage ceilings (including 10,000 requests/day and 300,000/month in the displayed free-tier table). Verify exact terms, attribution, current limits, geographic coverage and academic/project use with stakeholders before production.

Sources:
- [Open-Meteo Forecast API documentation](https://open-meteo.com/en/docs)
- [Open-Meteo pricing and usage information](https://open-meteo.com/en/pricing)

The reviewed endpoint documents weather model conditions and forecasts. A reliable severe-weather alert feed is not established by that forecast endpoint. Do not fabricate alerts from thresholds. If supported alerts are required (FR-073, FR-105), select and approve a provider that explicitly supports official alerts, or display “alert feed unavailable/not supported.” Provider, license/attribution, update interval, location source and alert semantics remain **To be confirmed with stakeholders**.

## Request design

Example request (minimal selected fields; encode parameters):

```text
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max
  &forecast_days=7&timezone=auto
```

Inputs: validated latitude/longitude from an explicitly selected farm/location; requested variables; bounded forecast day count (start at 7); timezone derived from provider or approved location record. Do not request every available hourly variable by default.

Normalize only required fields:

| UI data | Provider fields | Label |
|---|---|---|
| Current temperature, humidity, precipitation, wind, weather condition | `current.*` and `current.time` | “Current model conditions” / source timestamp; not a station observation unless provider documents it as observed |
| Daily high/low, precipitation total/probability, max wind, weather code | `daily.*`, `daily.time` | “Forecast”, with dates/timezone |
| Fetch/refresh time and provider | App-generated `fetchedAt`, provider metadata | “Updated at”; distinguish from forecast valid time |

Daily or current values may be missing for some locations/models. Render missing values as unavailable and never infer zeros.

## Location selection

Offer farmer-selected registered farm location or manual administrative location; use coordinates only when a reliable geocoding source is approved. Store location name/region and coordinates only where required, with consent and privacy policy. Validate latitude (-90…90) and longitude (-180…180). Avoid silently using device geolocation; require clear opt-in and explain purpose.

## React versus Cloud Function

For an initial free-tier-oriented build, prefer a direct React `fetch` to Open-Meteo because the public endpoint example does not require an API key; this avoids a function invocation and Firestore cache writes. This is appropriate only if terms allow direct client access and the project accepts that clients can bypass local throttling. Use request timeout/abort, per-screen/session caching and fetch only on user request/location change. Do not put secret keys in `.env` shipped to browser.

Use an HTTPS/callable Cloud Function only if the approved provider requires a secret, central rate limits, secure shared cache, or server-side alert delivery. A function adds deployment/billing requirements, invocations, and storage reads/writes; verify compatibility with the strict Firebase free-tier constraint before adopting it. A browser cache is not a security or quota boundary.

## Caching and `weatherCache`

- Recommended initial cache: in-memory or session cache per rounded coordinate key, provider, requested fields, timezone, and fetch time; revalidate after a stakeholder-approved TTL.
- Suggested starting display freshness policy: show a clear stale timestamp and offer refresh. Exact cache duration is **To be confirmed with stakeholders** because it depends on model update cadence and agricultural use.
- If shared server cache is required, use `weatherCache/{locationKey}` with `{provider, locationKey, fetchedAt, expiresAt, observed, forecast, alerts, stale}`. Restrict writes to trusted function; use coarse location key to reduce data exposure. Do not store precise personal location unless needed.
- Avoid Firestore writes per visitor/request. One cache write per cache-refresh window only; expire/clean up only if the hosting plan and retention policy allow.
- Prevent duplicate simultaneous requests in React, back off on 429/5xx, and do not retry aggressively.

## Failure, low-connectivity and severe alerts

- Display a timeout/error state separate from other app modules; show cached response only with explicit stale label and its source time.
- On 401/403/429/provider outage, show an unavailable message and do not fabricate conditions. Re-enable retry with backoff; no polling loop.
- Preserve access to saved farm/crop information while weather is unavailable. Do not claim offline-first synchronization.
- Distinguish “forecast” from “current model conditions”; display forecast date/time zone and last fetch time (FR-072, FR-075).
- Severe alerts appear only if the selected provider supplies explicit alert records and policy is approved. Include source, severity, issue/expiry time; avoid notifications for inferred thresholds until approved.

## Free-tier controls and open decisions

Make one bounded request per chosen location/user action, fetch seven days unless approved otherwise, select only displayed variables, and cache locally. Measure provider traffic and handle rate limits. Confirm Open-Meteo free terms/attribution, commercial-use status, alert provider, data retention and precise location policy before release.
