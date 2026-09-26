# Vallourec Mobile Maintenance

Mobile-first, offline-first maintenance Progressive Web App proof of concept. It simulates local SAP PM-style work management without authentication or SAP integration. Synchronization talks to the OutSystems `Maintenance` REST API (`Prometheus_Backend2`).

## Stack

- React 19 and TypeScript
- Vite 8
- Material UI
- React Router
- Dexie and IndexedDB
- `vite-plugin-pwa` and Workbox

## Run locally

Requirements: Node.js 20 or newer and npm.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Enter any non-empty username and password; credentials are not validated.

## Production PWA

```powershell
npm run build
npm run preview
```

Open the preview URL, then use the browser install action to install the application. The service worker is generated only for production builds and previews, not during normal Vite development.

## Offline data

The `vallourec-mobile-maintenance` IndexedDB database contains seven stores:

| Store | Purpose |
| --- | --- |
| `users` | Persists the local fake-login identity |
| `equipment` | Seeded read-only equipment used by form selectors |
| `workOrders` | Seeded and locally created maintenance orders |
| `measurements` | Measurements recorded against work orders |
| `measurementPhotos` | Optimized JPEG blobs linked to measurements by `measurementId` |
| `notifications` | Seeded and locally created maintenance notifications |
| `syncQueue` | Pending and completed synchronization operations |

No sample data is seeded. A fresh install has no equipment: it is backend-owned and downloaded on every synchronization. Every user-created work order, measurement, notification, and every work-order status update is saved locally with a queue entry in the same Dexie transaction. Optional measurement photos are resized to a maximum dimension of 1600 pixels, converted to JPEG at 82% quality, stored as IndexedDB blobs, and committed atomically with their measurement.

The Synchronization screen sends pending queue entries to the API in creation order (`POST /workorders`, `POST /measurements` plus `POST /measurements/{id}/photo`, `POST /notifications`) and marks each one synchronized only after the server accepts it. It stops at the first failure; if there is no network or the API is unreachable (15 s timeout), it shows that synchronization is not possible and keeps the remaining entries pending. After the pending entries are sent, it calls `GET /equipments` and replaces the local `equipment` store with the server list. The button stays enabled with no pending changes so a fresh install can download equipment.

The API base URL defaults to `https://vallourec-dev.outsystemsenterprise.com/Prometheus_Backend2/rest/Maintenance` and can be overridden with `VITE_API_BASE_URL` in a `.env` file.

## Manual acceptance check

1. Sign in with any username and password.
2. Confirm `ONLINE` or `OFFLINE` is visible on every screen.
3. Open Synchronization and tap Synchronize to download equipment.
4. Create a work order using a downloaded equipment record, then search and filter work orders.
5. Open any work order and use Start Work or Complete in any order.
6. Record a measurement with a camera or file-system photo and create a notification.
7. Refresh the browser and confirm all created data remains available.
8. Open Synchronization, verify the pending counts, and synchronize them to zero.
9. In browser DevTools, select Network > Offline and hard-refresh the production preview.
10. Repeat navigation, creation, status updates, and local synchronization while offline.

For responsive review, use representative 390x844 iPhone, 360x800 Android, and 768x1024 tablet viewports. Confirm the fixed navigation and floating actions do not obscure content.

## POC boundaries

This iteration intentionally excludes SAP integration, Azure AD, credential validation, equipment management, remote conflict resolution, server background synchronization, push notifications, telemetry, and deployment infrastructure.

Automated tests and their dependencies are deferred to the second iteration. The first iteration is validated with TypeScript production builds and the manual acceptance workflow above.
