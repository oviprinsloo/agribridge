# AGRIBridge REST API Reference Documentation

All API endpoints are mounted under the base URL `/api`.
Authentication uses JSON Web Tokens (Bearer `<token>`) in the `Authorization` header.

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new Farmer or Buyer with role-specific profiles | No |
| `POST` | `/api/auth/login` | Login with email and password, returns JWT token and user | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile with farms or buyer details | Yes |
| `PUT` | `/api/auth/profile` | Update profile information and preferred language | Yes |
| `POST` | `/api/auth/logout` | Invalidate active session client-side | Yes |

---

## 2. Farmer Operations (`/api/farmers`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/farmers/dashboard` | Aggregated dashboard metrics, active pools, prices, schemes | `FARMER` |
| `GET` | `/api/farmers/crops` | List farmer's produce inventory batches | `FARMER` |
| `POST` | `/api/farmers/crops` | Add new harvested crop batch to inventory | `FARMER` |
| `PUT` | `/api/farmers/crops/:id` | Update available quantity, price, or harvest date | `FARMER` |
| `DELETE` | `/api/farmers/crops/:id` | Delete unallocated produce batch | `FARMER` |
| `GET` | `/api/farmers/farms` | List registered farm parcels and coordinates | `FARMER` |
| `POST` | `/api/farmers/farms` | Register new farm parcel with latitude/longitude | `FARMER` |

---

## 3. Buyer Operations (`/api/buyers`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/buyers/dashboard` | Buyer procurement metrics, active orders, recommended pools | `BUYER` |
| `GET` | `/api/buyers/requirements` | List posted purchase requirements with matches | `BUYER` |
| `POST` | `/api/buyers/requirements` | Post new bulk or small-lot procurement requirement | `BUYER` |
| `PUT` | `/api/buyers/requirements/:id` | Update requirement budget or delivery deadline | `BUYER` |
| `DELETE` | `/api/buyers/requirements/:id` | Remove open purchase requirement | `BUYER` |

---

## 4. Supply Pools (`/api/supply-pools`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/supply-pools` | List open supply aggregation pools with progress | Public / Auth |
| `GET` | `/api/supply-pools/:id` | Detailed view of pool, participating farmers, and lots | Public / Auth |
| `POST` | `/api/supply-pools` | Form a new collective supply pool | `FARMER`, `ADMIN` |
| `POST` | `/api/supply-pools/:id/join` | Commit inventory lot to open supply pool | `FARMER` |

---

## 5. Demand Pools (`/api/demand-pools`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/demand-pools` | List open buyer demand aggregation pools | Public / Auth |
| `GET` | `/api/demand-pools/:id` | Detailed view of demand pool, members, and pledge progress | Public / Auth |
| `POST` | `/api/demand-pools` | Initiate a new shared demand pool | `BUYER`, `ADMIN` |
| `POST` | `/api/demand-pools/:id/join` | Pledge order volume to shared demand pool | `BUYER` |

---

## 6. Compatibility Matching (`/api/matches`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/matches/requirement/:requirementId` | Calculate matching supply pools for requirement | `BUYER`, `ADMIN` |
| `GET` | `/api/matches/supply-pool/:poolId` | Calculate matching buyer demands for supply pool | `FARMER`, `ADMIN` |
| `POST` | `/api/matches/propose` | Generate algorithmic match proposal | Auth |
| `POST` | `/api/matches/accept` | Accept match and generate wholesale order + route | `BUYER` |

---

## 7. Orders & Contracts (`/api/orders`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/orders/farmer/my-orders` | Orders involving the authenticated farmer's produce | `FARMER` |
| `GET` | `/api/orders/buyer/my-orders` | Orders placed by the authenticated buyer | `BUYER` |
| `GET` | `/api/orders/:id` | Full order detail, route stops, and escrow status | Auth |
| `POST` | `/api/orders/create-from-match` | Create wholesale order from accepted compatibility match | `BUYER` |
| `POST` | `/api/orders/:id/farmer-confirm-pickup` | Farmer confirms produce loaded at farm gate | `FARMER`, `ADMIN` |
| `POST` | `/api/orders/:id/buyer-confirm-delivery` | Buyer confirms receipt; triggers escrow disbursement | `BUYER`, `ADMIN` |

---

## 8. Logistics & Routes (`/api/routes`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/routes/order/:orderId` | Optimized multi-stop route for order | Auth |
| `GET` | `/api/routes/farmer/my-routes` | Inbound/outbound pickup routes for farmer's batches | `FARMER` |
| `GET` | `/api/routes/buyer/my-routes` | Inbound delivery routes delivering to buyer's hub | `BUYER` |
| `POST` | `/api/routes/optimize-adhoc` | Run on-demand TSP 2-opt route optimization | Auth |
| `PUT` | `/api/routes/stops/:stopId/status` | Driver updates stop status (`ARRIVED`, `LOADED`) | Auth |

---

## 9. Payments & Escrow (`/api/payments`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/payments/mock-checkout` | Mock UPI/Card payment deposit into escrow | `BUYER` |
| `GET` | `/api/payments/order/:orderId` | Escrow state and ledger transactions for order | Auth |
| `GET` | `/api/payments/farmer/my-transactions` | Farmer payout ledger and released payments | `FARMER` |

---

## 10. Disputes & Arbitration (`/api/disputes`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/disputes` | List all platform disputes | Auth |
| `POST` | `/api/disputes` | Raise quality or quantity discrepancy on order | `FARMER`, `BUYER` |
| `PUT` | `/api/disputes/:id/resolve` | Admin executes refund or release resolution | `ADMIN` |

---

## 11. AI Agricultural Advisor (`/api/ai`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Truth-grounded agricultural advisor (STT/TTS ready) | Public / Auth |

---

## 12. Market Benchmark Prices (`/api/market`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/market/prices` | APMC mandi feeds with district, min/max/modal prices | Public |
| `GET` | `/api/market/trends/:cropId` | Historical price trends and momentum analysis | Public |

---

## 13. Government Schemes (`/api/schemes`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/schemes` | Catalog of central and state agricultural welfare schemes | Public |
| `GET` | `/api/schemes/farmer/my-schemes` | Personalized eligibility rules engine output for farmer | `FARMER` |
| `POST` | `/api/schemes/check-eligibility` | Ad-hoc eligibility evaluation for farm parameters | Public / Auth |

---

## 14. Admin Operations (`/api/admin`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | System GMV, volume, users, and distribution charts | `ADMIN` |
| `GET` | `/api/admin/users` | Master list of all registered platform accounts | `ADMIN` |
| `PUT` | `/api/admin/users/:userId/status` | Toggle user status (`ACTIVE` / `SUSPENDED`) | `ADMIN` |
| `PUT` | `/api/admin/users/:userId/verify` | Verify KYC credentials of farmer or business buyer | `ADMIN` |
