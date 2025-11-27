# Stripe Identity Verification Setup Guide

## Übersicht

Stripe Identity ist ein Identitätsverifizierungssystem, das ermöglicht:
- Das Alter des Benutzers zu bestätigen (18+)
- Die Plattform vor Bots und Betrügern zu schützen
- Den GDPR-Anforderungen zu entsprechen (Daten werden bei Stripe gespeichert)

## Anforderungen

1. **Stripe-Konto** mit aktiviertem Identity API
2. **Stripe Secret Key** (Test- oder Live-Modus)
3. **Webhook Endpoint** zum Empfangen von Verifizierungsereignissen

## Stripe Dashboard einrichten

### 1. Identity aktivieren

1. Melden Sie sich im [Stripe Dashboard](https://dashboard.stripe.com) an
2. Gehen Sie zu **Products → Identity**
3. Klicken Sie auf **Get started** und füllen Sie das Aktivierungsformular aus
4. Warten Sie auf die Genehmigung (normalerweise sofort im Testmodus)

### 2. Webhook einrichten

1. Gehen Sie zu **Developers → Webhooks**
2. Klicken Sie auf **Add endpoint**
3. URL: `https://your-domain.com/api/verification/webhook`
4. Wählen Sie Ereignisse:
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.canceled`
5. Kopieren Sie den **Webhook Signing Secret**

### 3. .env einrichten

```env
# Stripe Identity Verification
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_xxxxx
VERIFICATION_FEE=199  # €1.99 in Cent
```

## API Endpoints

### GET /api/verification/status
Ruft den aktuellen Verifizierungsstatus des Benutzers ab.

**Response:**
```json
{
  "identity_verified": false,
  "identity_verification_status": "unverified",
  "identity_age_verified": false,
  "verification_attempts": 0,
  "can_use_platform": false
}
```

### POST /api/verification/create-session
Erstellt eine Stripe Identity Verifizierungssession.

**Response:**
```json
{
  "session_id": "vs_xxxxx",
  "client_secret": "vs_xxxxx_secret_xxxxx",
  "url": "https://verify.stripe.com/start/xxxxx",
  "status": "pending",
  "verification_fee": 1.99,
  "currency": "EUR"
}
```

### GET /api/verification/check-session/{session_id}
Prüft den Status der Verifizierungssession.

### GET /api/verification/require-check
Prüft, ob der Benutzer die Plattform verwenden kann.

### POST /api/verification/webhook
Webhook für Stripe Identity Ereignisse.

## Verifizierungsstatus

| Status | Beschreibung |
|--------|--------------|
| `unverified` | Verifizierung nicht begonnen |
| `pending` | Warte auf Benutzeraktionen |
| `processing` | Dokumente werden geprüft |
| `verified` | Verifizierung erfolgreich |
| `failed` | Verifizierung fehlgeschlagen |
| `cancelled` | Verifizierung abgebrochen |

## Frontend Integration

### Verifizierungsseite
`/verification` - Hauptverifizierungsseite

### Rückkehr nach Verifizierung
`/verification/complete?session_id={CHECKOUT_SESSION_ID}`

### VerificationGate Komponente
```jsx
import VerificationGate from './components/VerificationGate';

// Schützen Sie den geschützten Inhalt
<VerificationGate>
  <ProtectedContent />
</VerificationGate>
```

### useVerificationStatus Hook
```jsx
import { useVerificationStatus } from './components/VerificationGate';

const { loading, isVerified, canAccess } = useVerificationStatus();
```

## Testen

### Stripe Testdokumente
Im Testmodus verwenden Sie Dokumente aus [Stripe Test Data](https://stripe.com/docs/identity/testing):

- **Erfolgreiche Verifizierung**: Laden Sie ein beliebiges Dokumentbild hoch
- **Erfordert Eingabe**: Verwenden Sie ein unscharfes Bild
- **Abgelehnt**: Verwenden Sie ein abgelaufenes Dokument

### Testszenario

1. Registrieren Sie einen neuen Benutzer
2. Gehen Sie zu `/verification`
3. Klicken Sie auf "Verifizierung starten"
4. Durchlaufen Sie den Prozess bei Stripe
5. Überprüfen Sie nach der Rückkehr den Status

## Sicherheit

### GDPR Compliance
- Dokumente werden nur bei Stripe gespeichert
- Die Plattform erhält nur den Verifizierungsstatus
- Benutzer können Löschung der Daten über Stripe anfordern

### Betrugsschutz
- Limit von 5 Versuchen pro Tag
- Erfordert Live-Foto (Liveness-Check)
- Vergleich des Selfies mit dem Foto im Dokument

## Kosten

### Stripe Identity Pricing
- €1.50 für erfolgreiche Verifizierung (EU)
- Zahlt der Benutzer: €1.99 (mit €0.49 Marge)

### Preis einstellen
```env
VERIFICATION_FEE=199  # Preis in Cent
```

## Fehlerbehebung

### "Payment system not configured"
Überprüfen Sie `STRIPE_SECRET_KEY` in `.env`

### "Too many verification attempts"
Der Benutzer hat das Limit überschritten (5/Tag). Warten Sie 24 Stunden.

### Webhook funktioniert nicht
1. Überprüfen Sie die Webhook-URL im Stripe Dashboard
2. Überprüfen Sie `STRIPE_IDENTITY_WEBHOOK_SECRET`
3. Stellen Sie sicher, dass der Endpoint von außen zugänglich ist

### Verifizierung bleibt bei "pending" hängen
1. Überprüfen Sie Webhook-Ereignisse im Stripe Dashboard
2. Rufen Sie manuell `/check-session/{session_id}` auf

## Weiterentwicklung

- [ ] E-Mail-Benachrichtigungen über Verifizierungsstatus hinzufügen
- [ ] Wiederholte Verifizierung nach einem Jahr hinzufügen
- [ ] Integration mit Admin-Panel für manuelle Überprüfung
- [ ] Verifizierungsanalytik
