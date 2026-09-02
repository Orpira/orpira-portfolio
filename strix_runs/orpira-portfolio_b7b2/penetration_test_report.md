# Security Penetration Test Report

**Generated:** 2026-08-26 14:02:09 UTC

# Executive Summary

# Executive Summary

A white-box security assessment of the **OrPiRa portfolio application** identified **three confirmed vulnerabilities** affecting abuse resistance and session management in the dashboard and contact workflows.

**Overall risk posture:** Moderate.

**Key findings**
- The public **`/api/contact`** endpoint rate limit can be bypassed by spoofing proxy-related IP headers.
- The administrative **`/dashboard/login`** throttle can be bypassed in the same way, weakening protection against repeated password guessing.
- The dashboard logout flow does not invalidate previously issued sessions, so a copied session token remains usable until expiration.

**Business impact**
- Automated spam or record pollution against the CRM intake path remains possible despite the intended request throttle.
- The administrative login boundary relies on a bypassable anti-automation control, reducing resistance to repeated authentication attempts.
- If a dashboard session token is exposed through any separate event, logout does not immediately terminate that access.

No confirmed object-level authorization failure, attacker-controlled SSRF path, or dependency CVE was validated during this assessment. No higher-impact exploit chain beyond the individually reported findings was demonstrated.

# Methodology

# Methodology

The assessment was conducted as a **white-box application security review** aligned with **OWASP WSTG** and **PTES** principles.

**Scope**
- The Astro-based portfolio application and its dashboard, CRM, and contact-handling flows.

**Activities performed**
- Source-aware static triage using security scanning, structural code mapping, secret detection, and dependency review.
- Manual code review of authentication, session handling, middleware, rate limiting, contact ingestion, and Supabase integration points.
- Local runtime validation of the application with dynamic testing against the public pages, contact API, dashboard login/logout flow, and protected CRM routes.
- Targeted verification of authentication, authorization, rate-limit, and session-management hypotheses.
- Dependency and supply-chain review for known CVEs in pinned packages.

**Assessment constraints considered**
- Dynamic CRM data access was validated against controlled local test conditions.
- Contact-ingestion downstream failures caused by placeholder backend configuration were treated as environment noise where they did not affect the security conclusion.

# Technical Analysis

# Technical Analysis

**Confirmed findings**
1. **Rate-limit bypass on `POST /api/contact`** (**Medium**)  
   The public contact-ingestion flow derives its limiter key from client-supplied forwarding headers. By rotating spoofed **`X-Forwarded-For`** or **`X-Real-IP`** values, an unauthenticated attacker can continue reaching the ingestion path after the nominal threshold is hit.

2. **Rate-limit bypass on `POST /dashboard/login`** (**Medium**)  
   The dashboard login flow uses the same untrusted header pattern for authentication throttling. Repeated failed login attempts can avoid the lockout behavior simply by changing spoofed proxy-header values between requests.

3. **Logout does not invalidate issued dashboard sessions** (**Low**)  
   Dashboard sessions are treated as self-contained signed bearer tokens. Logging out deletes the local cookie but does not revoke the underlying session, so a previously copied token remains valid until expiry.

**Systemic themes**
- **Security decisions based on untrusted request metadata:** both confirmed medium-severity issues stem from trusting client-controlled forwarding headers for rate-limiting decisions.
- **Stateless session lifecycle without revocation:** logout is implemented as browser-side cookie cleanup rather than true server-side session invalidation.
- **Tight application surface with focused risk areas:** the application exposes a relatively small dynamic surface, and the validated issues are concentrated in authentication and abuse-prevention logic rather than broad input-injection or authorization failures.

**Areas reviewed without confirmed vulnerability**
- Dashboard CRM object access and forced browsing paths did not yield a meaningful IDOR/BOLA issue.
- Contact ingestion did not expose attacker-controlled webhook destination abuse or straightforward mass assignment of privileged lead fields.
- Dependency review did not identify a confirmed known-CVE package finding within the pinned dependency set.

**Attack chaining assessment**
- The two rate-limit bypasses share a root pattern but do not, by themselves, demonstrate unauthorized dashboard access.
- The logout/session persistence issue requires prior access to a valid session token and no separate token-acquisition path was demonstrated in this assessment.
- Accordingly, no validated compound attack path exceeded the impact of the individual reported findings.

# Recommendations

# Recommendations

**Immediate**
1. Replace all rate-limit keys derived from raw forwarding headers with a **server-trusted client address** supplied by the runtime or a strictly trusted proxy boundary.
2. Re-test both **`/api/contact`** and **`/dashboard/login`** to confirm that rotating **`X-Forwarded-For`** and **`X-Real-IP`** values no longer restores access to a fresh limiter bucket.

**Short-term**
3. Introduce **server-side session revocation** for dashboard authentication so logout invalidates existing sessions instead of only deleting the local cookie.
4. Require middleware to verify both token integrity and active session state before granting access to protected dashboard routes.
5. Review all other security controls that consume client network identity and remove any remaining trust in unsanitized proxy headers.

**Medium-term**
6. Centralize authentication and abuse-prevention logic so throttling, session validation, and logout behavior are enforced consistently across administrative routes.
7. Add regression tests covering rate-limit enforcement, logout invalidation, and protected-route access after session termination.
8. Maintain periodic white-box review of the dashboard and Supabase-backed flows as the CRM feature set expands.

**Validation guidance**
- After remediation, perform a focused re-test of the contact endpoint, dashboard login flow, and logout behavior to verify that the confirmed findings are fully resolved and no alternate bypass remains.

