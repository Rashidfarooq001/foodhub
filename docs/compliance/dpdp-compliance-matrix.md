# Zayka Food — Statutory DPDP Act 2023 & Indian E-Commerce Compliance Matrix

## Official Legal References & Statutory Scope
1. **Digital Personal Data Protection Act (DPDP Act), 2023** (Act No. 22 of 2023)
2. **Digital Personal Data Protection Rules, 2025** (MeitY Official Draft & Notified Guidelines)
3. **Consumer Protection Act, 2019** & **Consumer Protection (E-Commerce) Rules, 2020** (as amended 2021)
4. **Information Technology Act, 2000** & **CERT-In Cyber Security Directions (April 2022)**
5. **Food Safety and Standards Act (FSSAI), 2006** & **GST Act, 2017 (Section 36)**

---

## Statutory Phased Commencement Classification
* **Category A**: Requirements currently enforceable under applicable Indian IT & Consumer Protection laws.
* **Category B**: Requirements notified under the DPDP Act 2023 framework with phased operational commencement.
* **Category C**: Requirements contingent upon future Significant Data Fiduciary (SDF) or enterprise volume thresholds.
* **Category D**: Requirements requiring formal business confirmation / legal counsel engagement.
* **Category E**: Requirements dependent on third-party integrations or external state registers.

---

## Detailed Compliance Gap Register & Technical Implementation Status

| ID | Statutory Requirement | Legal Source | Category | Status | Code & Database Implementation | Evidence & API Endpoint | Owner / Action |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **REQ-01** | **Entity Legal Identification** (No deceptive corporate claims) | Consumer Protection (E-Commerce) Rules 2020, Rule 4(1) | Cat A | **IMPLEMENTED** | All policies and UI components represent Zayka Food strictly as a Sole Proprietorship. No "Pvt. Ltd." claims. | `apps/customer-web/src/components/legal/LegalPageLayout.tsx`, `apps/customer-web/src/components/layout/Footer.tsx` | Business Entity verified |
| **REQ-02** | **Personal Data Inventory** | DPDP Act 2023, Section 4 & 6 | Cat B | **IMPLEMENTED** | 6 core platform data categories mapped with legal basis, retention, and least-privilege roles in NestJS `PrivacyService`. | `GET /api/v1/privacy/inventory` | Engineering Lead |
| **REQ-03** | **Third-Party Sub-processor Catalog** | DPDP Act 2023, Section 8(1) & (2) | Cat B | **IMPLEMENTED** | Verified actual codebase processors (Razorpay, Render, PostgreSQL, Vercel, OpenStreetMap). No invented vendors. | `GET /api/v1/privacy/vendor-inventory` | Infrastructure Lead |
| **REQ-04** | **Notice Preceding Consent** (Clear & Standalone) | DPDP Act 2023, Section 5(1); Rules 2025 | Cat B | **IMPLEMENTED** | Standalone 16-section Privacy Notice accessible across customer signup, checkout, and dedicated legal route. | `/privacy-policy`, `apps/customer-web/src/app/signup/page.tsx` | Frontend Team |
| **REQ-05** | **Server-Side Versioned Consent** | DPDP Act 2023, Section 6(1) & (2) | Cat B | **IMPLEMENTED** | `PrivacyConsent` Prisma model recording `userId`, `consentType`, `version`, `granted`, `grantedAt`, `withdrawnAt`, `ipAddress`, `userAgent`. | `POST /api/v1/privacy/consent`, Prisma `privacy_consents` table | Backend Lead |
| **REQ-06** | **Unbundled Necessary vs Optional Processing** | DPDP Act 2023, Section 6(3) & (4) | Cat B | **IMPLEMENTED** | Order processing separated from optional marketing/promotional SMS and location processing toggles. | `/privacy` Customer Privacy Center Consent Dashboard | Frontend / Product |
| **REQ-07** | **Consent Withdrawal Mechanism** | DPDP Act 2023, Section 6(4) | Cat B | **IMPLEMENTED** | `POST /api/v1/privacy/consent/withdraw` allows 1-click consent revocation with timestamp and audit trail. | `POST /api/v1/privacy/consent/withdraw` | Backend Lead |
| **REQ-08** | **Right to Access & Data Portability (DSAR)** | DPDP Act 2023, Section 11 | Cat B | **IMPLEMENTED** | Authenticated machine-readable JSON data export (`GET /api/v1/privacy/export`) redacting password hashes and secrets. | `GET /api/v1/privacy/export`, Customer Privacy Center | Backend Lead |
| **REQ-09** | **Right to Correction & Updating** | DPDP Act 2023, Section 12(1) | Cat B | **IMPLEMENTED** | `POST /api/v1/privacy/requests` creates correction requests; normal profile fields editable directly via profile settings. | `POST /api/v1/privacy/requests`, Admin Approval Queue | Support / Admin |
| **REQ-10** | **Right to Erasure & Account Anonymization** | DPDP Act 2023, Section 12(3) | Cat B | **IMPLEMENTED** | Atomic transaction: purges PII/addresses, anonymizes unique phone/email, preserves non-personal financial orders for 8y tax compliance. | `POST /api/v1/admin/privacy/requests/:id/execute-deletion` | Database Admin |
| **REQ-11** | **Statutory Grievance Redressal (48h SLA)** | Consumer Protection (E-Commerce) Rules 2020, Rule 4(5) | Cat A | **IMPLEMENTED** | Dedicated routes at `/grievance-redressal` and `/privacy-complaint`; official email `businesscity05@gmail.com`; `PrivacyComplaint` model. | `POST /api/v1/privacy/complaints`, Admin Grievance Queue | Grievance Team |
| **REQ-12** | **Data Breach Incident Management & DPBI Notification** | DPDP Act 2023, Section 8(6); Rules 2025 | Cat B | **IMPLEMENTED** | `DataBreachIncident` model in Prisma supporting triage, severity ranking, containment timestamp, and DPBI reporting workflow. | `GET /api/v1/admin/privacy/incidents`, Admin Breach Registry | Security Lead |
| **REQ-13** | **Tamper-Evident Privacy Audit Logging** | IT Act 2000, Section 43A / 79; CERT-In 2022 | Cat A | **IMPLEMENTED** | `PrivacyAuditLog` records Actor ID, Role, Action, Target Entity, IP, and User-Agent on all sensitive data operations. | `GET /api/v1/admin/privacy/audit-logs` | Security Lead |
| **REQ-14** | **Data Retention & Automated Cleanup** | DPDP Act 2023, Section 8(7); GST Act Sec 36 | Cat A / B | **IMPLEMENTED** | Configurable retention schedules + automated cleanup endpoint purging expired OTPs and revoked tokens while preserving tax ledgers. | `POST /api/v1/admin/privacy/retention/cleanup` | DevOps / Backend |
| **REQ-15** | **Zero Third-Party Advertising Trackers** | DPDP Act 2023, Section 8(5) & Rule 2025 | Cat B | **IMPLEMENTED** | Certified zero Google Analytics, Meta Pixel, or commercial tracking scripts on customer web and admin portals. | `/cookie-policy` & Next.js Bundle Audit | Frontend Lead |
| **REQ-16** | **Location & GPS Minimization** | DPDP Act 2023, Section 6 | Cat B | **IMPLEMENTED** | Client-side browser prompt only. No continuous background tracking. Courier telematics purged within 30 days. | `apps/customer-web/src/components/location/LocationModal.tsx` | Geolocation Team |
| **REQ-17** | **Courier & Restaurant Data Minimization** | IT Act 2000 & DPDP Section 8 | Cat A / B | **IMPLEMENTED** | Merchant/driver APIs expose only active fulfillment data. Customer passwords, tokens, and unrelated history blocked. | Backend RBAC Guards & DTO Selectors | Security Lead |
| **REQ-18** | **E-Commerce Multi-Vendor Disclosures** | Consumer Protection (E-Commerce) Rules 2020, Rule 5 & 6 | Cat A | **IMPLEMENTED** | Restaurant listings expose FSSAI license, itemized tax/delivery breakdowns, total price before payment, and refund terms. | `apps/customer-web/src/app/restaurant/[slug]/page.tsx` | E-Commerce Team |
| **REQ-19** | **Designated Grievance Officer Individual Name** | Consumer Protection (E-Commerce) Rules 2020, Rule 4(5)(b) | Cat D | **REQUIRES BUSINESS CONFIRMATION** | Formally configured as "Zayka Food – Grievance Team" with email `businesscity05@gmail.com`. Business owner may appoint a specific individual. | `businesscity05@gmail.com` | Business Proprietor |
| **REQ-20** | **Registration as Significant Data Fiduciary (SDF)** | DPDP Act 2023, Section 10 | Cat C | **NOT APPLICABLE AT CURRENT SCALE** | Zayka Food currently operates as a hyper-local proprietorship food delivery marketplace below statutory volume thresholds. | Platform Architecture | Legal / Management |

---

## Verification & Official Technical Statement
> *"Technical implementation completed for the identified applicable requirements; legal review is required for final legal compliance determination."*
