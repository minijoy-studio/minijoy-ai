# FLIXO MASTER AI

AI-assisted repair and home-services marketplace. Initial launch market: Kyrgyzstan, with an architecture that can later support other countries.

## Product goal

Help customers describe a repair problem, receive a structured request, and connect with a suitable local service professional. Help verified professionals receive and manage relevant job requests.

## First release (MVP)

1. Customer request form: service category, problem description, location, preferred time, photos (later), and contact method.
2. Request triage: classify the job, identify missing details, and prepare a clear work brief.
3. Professional directory: service categories, coverage area, availability, verification status, and customer ratings.
4. Matching: shortlist suitable professionals based on category, location, availability, and customer choice.
5. Quote and booking workflow: professional quote, customer approval, scheduled visit, and status updates.
6. Reviews and support: customer feedback and a way to report a problem.

## Initial service categories

- Plumbing
- Electrical work
- Appliance repair
- Home renovation and finishing
- Phone and computer repair
- Furniture assembly and repair
- Heating and air-conditioning
- Locksmith and door repair

## AI responsibilities

- Intake assistant: turns a customer's description into a structured repair request.
- Triage assistant: asks for missing, non-sensitive details and flags urgent safety concerns.
- Matching assistant: recommends professionals using explicit service area and availability data.
- Support assistant: summarizes the order status and helps with customer communication.

AI must not claim that a professional is licensed, verified, available, or booked unless the platform has confirmed that information. Customers choose and approve the professional and quote. For dangerous situations (for example, gas smell, fire, exposed live wiring, or flooding near electrical equipment), the service must advise the customer to move to safety and contact the appropriate local emergency service rather than attempt DIY instructions.

## Trust, safety, and operations

- Verify professional identity and credentials where legally required.
- Clearly label unverified profiles.
- Obtain customer consent before sharing contact details or job photos.
- Do not publish exact home addresses publicly.
- Keep quote, booking, cancellation, dispute, and refund policies explicit.
- Start with manual review of matches and disputes before automating decisions.

## Rollout

### Phase 1 — Kyrgyzstan pilot
Build the customer request flow and a small, manually onboarded directory of repair professionals in one launch area. Confirm demand and operational capacity before advertising broad coverage.

### Phase 2 — Assisted matching
Add AI request classification, professional recommendations, quote comparison, and status notifications with human oversight.

### Phase 3 — Marketplace automation
Add professional accounts, availability calendars, payments (after legal/payment-provider review), ratings, dispute handling, and expansion to more cities.

## Current implementation status

Planning foundation only. No customer-facing service, professional directory, identity verification, payments, booking engine, or AI provider integration is live yet.
