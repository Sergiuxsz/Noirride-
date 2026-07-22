# Noirride - Arhitectura Sistemului (Deep Dive)

Acest document prezintă arhitectura completă a platformei Noirride. Sistemul este împărțit în trei piloni principali: **Frontend-ul (Aplicația Web)**, **Firebase Cloud Functions (Core Business Logic)** și **Realtime-Server (Motorul de Telemetrie)**.

Scopul acestui design este de a separa datele statice și logica de afaceri greoaie de telemetria de înaltă frecvență (mișcarea mașinilor pe hartă), pentru a asigura performanță, scalabilitate și costuri reduse.

---

## 1. Diagrama Arhitecturală (Fluxul Principal)

![Diagrama Arhitecturală Noirride](https://mermaid.ink/svg/Z3JhcGggVEQKICAgICUlIEZyb250ZW5kIENsaWVudHMKICAgIENsaWVudEFwcFtDbGllbnQgV2ViIEFwcCAtIFJlYWN0XQogICAgRGlzcGF0Y2hBcHBbRGlzcGF0Y2ggRGFzaGJvYXJkIC0gUmVhY3RdCgogICAgJSUgQmFja2VuZCBMYXllciAxOiBDb3JlIExvZ2ljCiAgICBzdWJncmFwaCBGaXJlYmFzZSBDbG91ZAogICAgICAgIEZ1bmN0aW9uc1tDbG91ZCBGdW5jdGlvbnMgLSBBUEldCiAgICAgICAgRmlyZXN0b3JlWyhGaXJlc3RvcmUgLSBTU09UKV0KICAgICAgICBBdXRoW0ZpcmViYXNlIEF1dGhdCiAgICBlbmQKCiAgICAlJSBCYWNrZW5kIExheWVyIDI6IFRlbGVtZXRyeSAmIFNpbXVsYXRpb24KICAgIHN1YmdyYXBoIFJlYWx0aW1lIFNlcnZlciBOb2RlLmpzCiAgICAgICAgUkVTVF9BUElbUkVTVCBBUEkgL2FwaS9kaXNwYXRjaF0KICAgICAgICBTaW1FbmdpbmVbU2ltdWxhdGlvbiBFbmdpbmVdCiAgICAgICAgRmxlZXRXU1tXZWJTb2NrZXQgU2VydmVyXQogICAgICAgIFJlZGlzWyhSZWRpcyBDYWNoZSldCiAgICBlbmQKCiAgICAlJSBIaWdoIEZyZXF1ZW5jeSBEQgogICAgUlREQlsoRmlyZWJhc2UgUmVhbHRpbWUgREIpXQoKICAgICUlIENvbm5lY3Rpb25zCiAgICBDbGllbnRBcHAgLS0gIjEuIExvZ2luIC8gUmVnaXN0ZXIiIC0tPiBBdXRoCiAgICBDbGllbnRBcHAgLS0gIjIuIEJvb2sgUmlkZSAoYXBpLmNyZWF0ZUJvb2tpbmcpIiAtLT4gRnVuY3Rpb25zCiAgICBEaXNwYXRjaEFwcCAtLSAiVXBkYXRlIFN0YXR1cyAvIFZpZXciIC0tPiBGdW5jdGlvbnMKICAgIAogICAgRnVuY3Rpb25zIC0tICIzLiBTYXZlIFJpZGUgRGF0YSIgLS0+IEZpcmVzdG9yZQogICAgRmlyZXN0b3JlIC0tICI0LiBvblNuYXBzaG90IChMaXZlIFVwZGF0ZXMpIiAtLT4gQ2xpZW50QXBwCiAgICBGaXJlc3RvcmUgLS0gIjQuIG9uU25hcHNob3QgKExpdmUgVXBkYXRlcykiIC0tPiBEaXNwYXRjaEFwcAoKICAgIEZ1bmN0aW9ucyAtLSAiNS4gVHJpZ2dlciBEaXNwYXRjaCAoQXhpb3MpIiAtLT4gUkVTVF9BUEkKICAgIFJFU1RfQVBJIC0tICI2LiBTdGFydCBSb3V0ZSBTaW11bGF0aW9uIiAtLT4gU2ltRW5naW5lCiAgICBTaW1FbmdpbmUgLS0gIjcuIFdyaXRlIDFIeiBUZWxlbWV0cnkiIC0tPiBSVERCCiAgICAKICAgIFJUREIgLS0gIjguIEJyb2FkY2FzdCBDb29yZGluYXRlcyIgLS0+IEZsZWV0V1MKICAgIEZsZWV0V1MgLS0gIjkuIExpdmUgTWFwIERhdGEiIC0tPiBEaXNwYXRjaEFwcAogICAgRmxlZXRXUyAtLSAiOS4gTGl2ZSBNYXAgRGF0YSIgLS0+IENsaWVudEFwcAo=)

---

## 2. Pilonii Sistemului

### A. Frontend (React + TypeScript + Vite)
- **State Management**: Aplicația nu folosește Redux, ci **React Context API** (`AuthContext` și `RideContext`). 
  - `AuthContext` menține „sursa unică de adevăr” (SSOT) despre sesiunea utilizatorului, conectându-se direct la documentul din `users` din Firestore pentru a valida rolurile (Admin / Client).
  - `RideContext` folosește ascultători în timp real (`onSnapshot`) pe colecția `rides`. Când o cursă își schimbă statusul (ex: din `SCHEDULED` în `EN_ROUTE`), frontend-ul este notificat instantaneu.
- **Hărți și Telemetrie**: Componentele precum `ClientLiveMap` și `FleetLiveMap` preiau coordonatele live prin conexiuni WebSockets, direct de la Realtime Server, desenând geometria rutelor pe hartă (Polyline).

### B. Firebase Cloud Functions (Core Backend)
Acesta este creierul tranzacțional al aplicației. Este scris în TypeScript și expune endpoint-uri `onCall`.
- **Securitate**: Gestionează autentificarea, alocarea rolurilor (RBAC) și verificările VIP.
- **Booking Flow**: Când un client face o rezervare, funcția `createBooking` calculează prețul, validează detaliile și creează un document în `Firestore`.
- **Triggere Externe**: După salvarea cursei în Firestore, Cloud Functions apelează prin cereri HTTP (`axios`) motorul de telemetrie de pe `Realtime-Server` pentru a găsi un șofer și a începe simularea traseului.

### C. Realtime Server (Telemetrie & Dispatching)
Acest server independent Node.js/Express rulează pe portul `8080` (în dezvoltare) și are o singură responsabilitate uriașă: **Telemetria de înaltă frecvență**.
- **BookingController**: Primește comanda de la Cloud Functions, face apeluri la **Google Maps Directions API** pentru a obține coordonatele exacte ale traseului (Polyline) și alocă cel mai apropiat șofer disponibil (`FleetManager`).
- **SimulationEngine**: Rulează un loop asincron la exact **1 secundă (1Hz)**. Mută mașina virtuală de-a lungul rutei descărcate și trimite noile coordonate (`[lat, lng]`) către **Firebase Realtime Database (RTDB)**.
- **WebSocket (FleetWebSocket)**: Ascultă schimbările din RTDB și le dă broadcast (le trimite instantaneu) tuturor clienților de Frontend conectați.

---

## 3. Strategia Bazelor de Date (De ce avem 3 baze de date?)

Un aspect crucial pe care trebuie să-l înțelegi este decuplarea bazelor de date pentru a evita costurile masive și limitările de viteză (rate-limiting).

1. **Firestore (Sursa Unică de Adevăr - Date Lente)**
   - **Ce stochează**: Utilizatori, Curse (`rides`), Statusuri (ex: `COMPLETED`), Plăți.
   - **Frecvență de scriere**: Rară (de 3-4 ori per cursă).
   - **De ce**: Este perfect pentru interogări complexe (ex: "arată-mi cursele utilizatorului X din data Y"), dar este lent și scump la scrieri pe secundă.

2. **Firebase Realtime Database (RTDB) (Telemetrie - Date Rapide)**
   - **Ce stochează**: Coordonatele mașinilor (`fleet_updates`), statusul live al mașinii (ex: locația curentă GPS).
   - **Frecvență de scriere**: **1 dată pe secundă** pentru FIECARE mașină activă.
   - **De ce**: RTDB este proiectat pentru streaming continuu și scrieri extrem de rapide cu latență scăzută, fără a tarifa per operațiune de citire/scriere (costă per lățime de bandă).

3. **Redis (Cache & State)**
   - **Ce stochează**: Memoria de scurtă durată a serverului (starea șoferilor, ce cursă e în așteptare, conexiunile active).
   - **De ce**: Realtime Server-ul are nevoie de o memorie ultra-rapidă pentru a ști ce mașini sunt disponibile când trebuie să facă dispatch.

---

## 4. Ciclul de Viață al unei Comenzi (De la Click la Destinație)

Dacă vrei să urmărești codul "până în măduva oaselor", iată exact ce se întâmplă când un client apasă "Rezervă":

1. **Frontend**: Utilizatorul apasă "Confirmă". Se declanșează `api.createBooking` din `src/services/api.ts`.
2. **Cloud Functions (`booking.service.ts`)**: Validează prețul, generează un ID (`NR-1234`) și scrie cursa în **Firestore** ca `SCHEDULED`.
3. **Cloud Functions (`booking.service.ts`)**: Face un POST HTTP silențios către `http://realtime-server:8080/api/dispatch`.
4. **Realtime Server (`BookingController.ts`)**: Primește POST-ul. Interoghează Google Maps pentru ruta exactă. Găsește un șofer (`FleetManager.findBestDriver`).
5. **Realtime Server (`BookingController.ts`)**: Modifică statusul în Firestore la `EN_ROUTE` și lansează `SimulationEngine.startSimulation()`.
6. **SimulationEngine**: Începe să taie bucăți din ruta Google Maps. În fiecare secundă, calculează noua locație a mașinii și dă push unui obiect în **RTDB** (`db.ref('fleet_updates').push(...)`).
7. **Frontend (Live Map)**: Primește update-ul RTDB prin WebSocket și redesenează iconița mașinii cu 1 metru mai în față, creând efectul vizual fluid pe hartă.
8. **Finalizare**: Când `SimulationEngine` ajunge la ultima bornă din ruta Google Maps, oprește telemetria și trimite comanda de actualizare a cursei în Firestore ca `ARRIVED` sau `COMPLETED`. Frontend-ul este notificat prin `onSnapshot`, iar UI-ul se actualizează pentru client și dispatcher.
