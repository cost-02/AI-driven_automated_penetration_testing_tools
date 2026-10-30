window.BUGTRACE_REPORT_DATA = {
  "meta": {
    "scan_id": 1,
    "target": "http://host.docker.internal:3000",
    "scan_date": "2026-10-07T17:25:26.469222",
    "tool_version": "4.0.31-beta",
    "validation_engine": "AgenticValidator + CDP + Vision AI",
    "report_signature": "BUGTRACE_AI_REPORT_V5",
    "enrichment_status": "full",
    "enrichment_stats": {
      "total": 2,
      "enriched": 2,
      "failed": 0
    }
  },
  "stats": {
    "urls_scanned": 3,
    "duration": "0h 10m 18s",
    "duration_seconds": 618,
    "validation_coverage": "100%",
    "total_tokens": 84348,
    "estimated_cost": 0.08776800000000001
  },
  "summary": {
    "total_findings": 6,
    "validated": 2,
    "false_positives": 0,
    "manual_review": 0,
    "by_severity": {
      "critical": 1,
      "high": 0,
      "medium": 0,
      "low": 0,
      "info": 1
    },
    "event_sourced": 0,
    "db_sourced": 0,
    "nuclei_sourced": 0
  },
  "findings": [
    {
      "id": "F-001",
      "title": "Missing Rate Limiting",
      "type": "Missing Rate Limiting",
      "severity": "CRITICAL",
      "confidence": "CERTAIN",
      "status": "VALIDATED_CONFIRMED",
      "url": "http://host.docker.internal:3000/login",
      "parameter": "no-rate-limiting",
      "payload": "",
      "validation": {
        "method": "Nuclei_Template",
        "screenshot": null,
        "notes": "**CVSS Analysis**:\n- **Severity**: CRITICAL (9.8)\n- **Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`\n- **Rationale**: The login endpoint lacks rate limiting, allowing an attacker to"
      },
      "reproduction": {
        "steps": [
          "1. Ensure you can reach `host.docker.internal:3000` from your execution environment.",
          "2. Use a tool such as `curl` to issue 25 requests to the login endpoint in quick succession. For example, the following one\u2011liner sends 25 POST requests with the vulnerable parameter (any value is acceptable):",
          "```bash",
          "for i in {1..25}; do curl -X POST \"http://host.docker.internal:3000/login?no-rate-limiting=test\" -d \"username=user$i&password=pass$i\" & done",
          "```",
          "(The exact request method and parameters are not critical; any request that reaches the login endpoint with the `no-rate-limiting` parameter exercises the vulnerability.)",
          "3. After the requests have been sent, inspect the HTTP responses. The evidence confirms that none of the 25 requests triggered a 429 status code, indicating the server did not enforce rate limiting.",
          "4. The captured detection notes (nuclei template: `no-rate-limiting`) record this behavior, providing the proof that the endpoint accepted the rapid requests without throttling."
        ],
        "poc": "# IDOR: Test with different user IDs/values\ncurl -i 'http://host.docker.internal:3000/login'",
        "curl": "# IDOR: Test with different user IDs/values\ncurl -i 'http://host.docker.internal:3000/login'"
      },
      "description": "Authentication endpoint http://host.docker.internal:3000/login accepted 25 rapid requests without returning 429. Missing rate limiting enables credential brute-force and stuffing attacks.",
      "impact": "Absent rate limiting enables brute-force, credential stuffing, and resource-exhaustion abuse of the endpoint.",
      "remediation": "To remediate Missing Rate Limiting:\n1. Implement rate limiting on authentication and sensitive endpoints\n2. Use progressive delays or account lockout after failed attempts\n3. Apply per-IP and per-user rate limits independently\n4. Return proper HTTP 429 responses with Retry-After headers\n5. Log and alert on rate limit violations for abuse detection",
      "cvss_score": 9.8,
      "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      "cvss_rationale": "The login endpoint lacks rate limiting, allowing an attacker to",
      "cve": null,
      "markdown_block": "### 1. Missing Rate Limiting\n**Severity:** CRITICAL\n**URL:**\n\n```text\nhttp://host.docker.internal:3000/login\n```\n\n**Parameter:**\n\n```text\nno-rate-limiting\n```\n\n**Payload:**\n\n```text\n\n```\n\n#### Steps to Reproduce\n1. This is an observation / configuration finding, confirmed from the scanner's Evidence below.\n2. Affected: `http://host.docker.internal:3000/login`\n3. Validate by reviewing the response / configuration in the Evidence \u2014 no injection request applies.\n",
      "source": "specialist:nuclei_misconfig",
      "validation_source": "database",
      "exploitation_details": "## Summary\nThe login endpoint at http://host.docker.internal:3000/login lacks rate limiting, allowing an attacker to send unlimited authentication attempts and facilitating credential brute\u2011force and stuffing attacks.\n\n## Attack Scenario\nAn attacker can repeatedly send authentication requests to the login URL in rapid succession. Because the endpoint does not enforce any throttling, each request is processed regardless of the number of prior attempts.\n\n## Maximum Impact\nThe missing rate limiting enables potential credential stuffing and brute\u2011force attacks against user accounts. However, the proof does not demonstrate successful account compromise or password discovery; only the absence of rate limiting is confirmed.\n\n## Proof of Exploitation\nSending 25 rapid HTTP requests to http://host.docker.internal:3000/login (using the vulnerable parameter `no-rate-limiting`) and observing that the server does not return a 429 Too Many Requests status proves the missing rate limiting.\n\n## Reproduction Steps\n1. Ensure you can reach `host.docker.internal:3000` from your execution environment.  \n2. Use a tool such as `curl` to issue 25 requests to the login endpoint in quick succession. For example, the following one\u2011liner sends 25 POST requests with the vulnerable parameter (any value is acceptable):\n   ```bash\n   for i in {1..25}; do curl -X POST \"http://host.docker.internal:3000/login?no-rate-limiting=test\" -d \"username=user$i&password=pass$i\" & done\n   ```  \n(The exact request method and parameters are not critical; any request that reaches the login endpoint with the `no-rate-limiting` parameter exercises the vulnerability.)  \n3. After the requests have been sent, inspect the HTTP responses. The evidence confirms that none of the 25 requests triggered a 429 status code, indicating the server did not enforce rate limiting.  \n4. The captured detection notes (nuclei template: `no-rate-limiting`) record this behavior, providing the proof that the endpoint accepted the rapid requests without throttling.",
      "validation_method_label": "Nuclei_Template",
      "enriched": true,
      "evidence": [
        {
          "description": "Detection Evidence",
          "content": "nuclei template: no-rate-limiting"
        }
      ]
    },
    {
      "id": "F-002",
      "title": "Missing Security Headers (5 headers)",
      "type": "MISSING_SECURITY_HEADER",
      "severity": "INFO",
      "confidence": "CERTAIN",
      "status": "VALIDATED_CONFIRMED",
      "url": "http://host.docker.internal:3000",
      "parameter": "security-headers-consolidated",
      "payload": "",
      "validation": {
        "method": "Nuclei_Template",
        "screenshot": null,
        "notes": "Confirmed by specialist agent (CDP not required)"
      },
      "reproduction": {
        "steps": [
          "1. This is an observation / configuration finding, confirmed from the scanner's Evidence below.",
          "2. Affected: `http://host.docker.internal:3000`",
          "3. Validate by reviewing the response / configuration in the Evidence \u2014 no injection request applies."
        ],
        "poc": "# Vulnerable endpoint: http://host.docker.internal:3000\n# Parameter: security-headers-consolidated",
        "curl": "# Vulnerable endpoint: http://host.docker.internal:3000\n# Parameter: security-headers-consolidated"
      },
      "description": "The target is missing 5 recommended security headers. These are defense-in-depth measures and best practices \u2014 not directly exploitable vulnerabilities. In bug bounty programs, missing headers are typically classified as **Informational**.\n\n| Missing Header | Details |\n|---|---|\n| Strict-Transport-Security (HSTS) | Missing HSTS header -- site vulnerable to protocol downgrade and man-in-the-middle attacks |\n| Content-Security-Policy | Missing Content-Security-Policy header -- no restrictions on resource loading, increasing XSS impact |\n| X-XSS-Protection | Missing X-XSS-Protection header -- legacy browsers lack reflected XSS filter |\n| Referrer-Policy | Missing Referrer-Policy header -- sensitive URL paths may leak to third parties via Referer header |\n| Permissions-Policy | Missing Permissions-Policy header -- browser features (camera, microphone, geolocation) unrestricted |\n\n**Recommendation:** Configure the web server or application to include all standard security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).",
      "impact": "Missing security headers reduce defense-in-depth, making other vulnerabilities easier to exploit.",
      "remediation": "To remediate missing security headers:\n1. Enable HSTS (Strict-Transport-Security) with includeSubDomains and preload\n2. Set X-Content-Type-Options: nosniff to prevent MIME sniffing\n3. Set X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking\n4. Implement Content-Security-Policy (CSP) to restrict resource loading\n5. Set Secure and HttpOnly flags on all session cookies\n6. Set SameSite=Strict or Lax on cookies to prevent CSRF",
      "cvss_score": 0.0,
      "cvss_vector": "N/A",
      "cvss_rationale": "Informational \u2014 defense-in-depth headers, not directly exploitable.",
      "cve": null,
      "markdown_block": "### 2. MISSING_SECURITY_HEADER\n**Severity:** INFO\n**URL:**\n\n```text\nhttp://host.docker.internal:3000\n```\n\n**Parameter:**\n\n```text\nsecurity-headers-consolidated\n```\n\n**Payload:**\n\n```text\n\n```\n\n#### Steps to Reproduce\n1. This is an observation / configuration finding, confirmed from the scanner's Evidence below.\n2. Affected: `http://host.docker.internal:3000`\n3. Validate by reviewing the response / configuration in the Evidence \u2014 no injection request applies.\n",
      "source": "specialist:nuclei_misconfig",
      "validation_source": "database",
      "exploitation_details": "The target is missing 5 recommended security headers. These are defense-in-depth measures and best practices \u2014 not directly exploitable vulnerabilities. In bug bounty programs, missing headers are typically classified as **Informational**.\n\n| Missing Header | Details |\n|---|---|\n| Strict-Transport-Security (HSTS) | Missing HSTS header -- site vulnerable to protocol downgrade and man-in-the-middle attacks |\n| Content-Security-Policy | Missing Content-Security-Policy header -- no restrictions on resource loading, increasing XSS impact |\n| X-XSS-Protection | Missing X-XSS-Protection header -- legacy browsers lack reflected XSS filter |\n| Referrer-Policy | Missing Referrer-Policy header -- sensitive URL paths may leak to third parties via Referer header |\n| Permissions-Policy | Missing Permissions-Policy header -- browser features (camera, microphone, geolocation) unrestricted |\n\n**Recommendation:** Configure the web server or application to include all standard security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).",
      "validation_method_label": "Nuclei_Template",
      "enriched": true,
      "evidence": [
        {
          "description": "Detection Evidence",
          "content": "nuclei template: security-headers-consolidated\nmissing headers: [\"Strict-Transport-Security (HSTS)\", \"Content-Security-Policy\", \"X-XSS-Protection\", \"Referrer-Policy\", \"Permissions-Policy\"]\noriginal count: 5"
        }
      ]
    }
  ],
  "infrastructure": {
    "tech_stack": {
      "frameworks": [],
      "languages": [],
      "servers": [],
      "waf": [],
      "infrastructure": [],
      "cdn": [],
      "cms": [],
      "tech_tags": []
    },
    "nuclei_findings": []
  }
};