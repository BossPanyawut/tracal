> คู่มือแนวคิดเดิม: บางฟีเจอร์และ provider ในเอกสารนี้เป็นตัวอย่าง ไม่ใช่สถานะปัจจุบัน อ่าน [แผนปัจจุบัน](docs/development-plan.md), [requirements](docs/requirements.md) และ [task log](docs/tasks.md) ก่อนเริ่มงาน

# Trading Cost & Profit Calculator
## AI Coding Agent SDLC Project Guide — Next.js

> โปรเจกต์ตัวอย่างตั้งแต่ Product Discovery → Requirements → Design → Development → Testing → Review → Deployment → Operations  
> สำหรับเว็บไซต์คำนวณต้นทุนและกำไรการเทรด Crypto และ Gold โดยใช้ USD เป็นสกุลเงินฐานและแสดงผลเป็นเงินบาทจากข้อมูลอัตราแลกเปลี่ยนจริง

---

Trading Cost & Profit Calculator — AI Coding Agent SDLC Project Guide

**

# เว็บไซต์คำนวณต้นทุนและกำไรการเทรด Crypto & Gold

เอกสารตัวอย่างการประยุกต์ใช้ **AI Coding Agent SDLC** กับโปรเจกต์จริงโดยใช้ Next.js ตั้งแต่เริ่มคิด Product จนถึง Deployment และ Operations

Next.jsTypeScriptCryptoGold / XAU
USD → THBLive Market DataPlaywrightDocker

## สิ่งที่เรากำลังสร้าง

ผู้ใช้กรอกข้อมูลการซื้อสินทรัพย์ เช่น Bitcoin, Ethereum หรือ Gold ในหน่วย USD และระบุจำนวนที่ซื้อ ราคาซื้อ ค่าธรรมเนียม และราคาขาย ระบบจะคำนวณต้นทุน กำไร/ขาดทุน Return on Investment และแปลงมูลค่าเป็นเงินบาทโดยใช้ USD/THB จากแหล่งข้อมูลจริง

Crypto
BTC, ETH และสินทรัพย์ที่รองรับจาก Provider

Gold
XAU/USD โดยใช้หน่วย Troy Ounce เป็นหน่วยฐาน

THB
แสดงผล USD และ THB พร้อมเวลาที่ข้อมูลอัปเดต

Product Principle:** ตัว Calculator ต้องยังทำงานได้เมื่อ Market API ใช้งานไม่ได้ โดยผู้ใช้สามารถกรอกราคาซื้อ/ขายเองได้ ส่วน Live Price เป็นตัวช่วย ไม่ใช่ dependency ที่ทำให้การคำนวณทั้งหมดล่ม

PHASE 0

## 1. Product Discovery — ก่อนเขียน Code

### Problem Statement

นักเทรดที่ซื้อสินทรัพย์เป็น USD แต่ต้องการทราบต้นทุนและกำไรจริงในเงินบาทต้องคำนวณหลายส่วน ได้แก่ ราคาสินทรัพย์ จำนวน ค่าธรรมเนียม และอัตราแลกเปลี่ยน จึงเสี่ยงคำนวณผิดหรือใช้อัตราแลกเปลี่ยนคนละช่วงเวลา

### Target User

- ผู้ลงทุน Crypto ที่ซื้อสินทรัพย์เป็น USD/USDT และต้องการเห็นมูลค่าโดยประมาณเป็น THB

- ผู้ลงทุนทองคำที่อ้างอิง XAU/USD

- ผู้ที่ต้องการจำลองกำไรก่อนขายโดยไม่ต้องสร้างบัญชี

### Non-goals ของ MVP

- ไม่เชื่อม Exchange เพื่อส่งคำสั่งซื้อขาย

- ไม่เก็บ API Key ของ Exchange ของผู้ใช้

- ไม่ให้คำแนะนำซื้อ/ขายหรือลงทุน

- ไม่ทำ Portfolio/Tax Accounting เต็มรูปแบบใน MVP

- ไม่รับประกันราคาสำหรับ settlement จริง เพราะ market price และ FX สามารถเปลี่ยนได้

### Success Criteria

| Metric | เป้าหมาย MVP |
| --- | --- |
| Calculation correctness | สูตรหลักผ่าน Unit Test 100% |
| Critical E2E | Crypto และ Gold happy path ผ่าน |
| Data freshness | แสดง source + timestamp ของ market data ทุกครั้ง |
| Performance | Calculator interaction เป็น client-side และไม่รอ API หลังข้อมูลถูกโหลด |
| Resilience | Manual price mode ใช้งานได้แม้ external API fail |

PHASE 1

## 2. Requirements

### Functional Requirements — MVP

- เลือกประเภทสินทรัพย์: Crypto หรือ Gold

- Crypto สามารถเลือกเหรียญ เช่น BTC / ETH

- Gold ใช้ XAU/USD และเลือกจำนวนเป็น Troy Ounce หรือ Gram ได้

- กรอก Quantity, Buy Price, Sell Price

- กรอก Buy Fee และ Sell Fee ได้ทั้ง Fixed USD หรือ %

- กดใช้ Current Market Price เป็น Sell Price ได้

- แสดง USD/THB ล่าสุด พร้อม source และ timestamp

- แสดงต้นทุนรวม, มูลค่าขาย, กำไร/ขาดทุน, ROI, Break-even

- แสดงทุกค่าทั้ง USD และ THB

- รองรับ Manual FX เพื่อใช้จำลองสถานการณ์

- สามารถ Reset Calculator

- รองรับ Responsive desktop/mobile

### Future Scope

- บันทึก transaction

- Average Cost จากหลายไม้

- DCA calculator

- Portfolio

- Historical FX ตามวันที่ซื้อจริง

- Tax estimation

- Authentication / cloud sync

### Acceptance Criteria ตัวอย่าง

```
Given:
BTC quantity = 0.1
Buy price = 50,000 USD
Sell price = 60,000 USD
Buy fee = 0
Sell fee = 0
USD/THB = 34

When:
User calculates

Then:
Cost = 5,000 USD
Sale proceeds = 6,000 USD
Profit = 1,000 USD
ROI = 20%
Profit THB = 34,000 THB
```

PHASE 2

## 3. Real Market Data Strategy

หลักสำคัญคือ **ไม่ hardcode ค่าเงินหรือราคาสินทรัพย์** และไม่เรียก external provider โดยตรงจาก Browser หากต้องใช้ API Key

| ข้อมูล | Primary Provider | ข้อมูลที่ใช้ | Cache แนะนำ |
| --- | --- | --- | --- |
| USD → THB | Frankfurter v2 / BOT provider | อัตรา USD/THB | 30–60 นาที |
| Crypto | CoinGecko | Current USD price + last updated | 30–60 วินาที |
| Gold | GoldAPI | XAU/USD spot + timestamp | 30–60 วินาที |

### USD/THB

```
GET https://api.frankfurter.dev/v2/rate/USD/THB?providers=BOT
```

เลือก BOT เป็น provider เพื่อให้ source ของค่าเงินบาทมีที่มาชัดเจน ตัวระบบต้องบันทึก `rate`, `date`, `provider` และเวลาที่ server fetch ข้อมูล

### Crypto

```
GET /api/v3/simple/price
?ids=bitcoin,ethereum
&vs_currencies=usd
&include_last_updated_at=true
```

### Gold

```
GET https://www.goldapi.io/api/price/XAU/USD
Header: x-access-token: ${GOLD_API_KEY}
```

**สำคัญ:** “ราคาจริง” ไม่ได้แปลว่า price ทุก provider จะเท่ากันทุกวินาที Crypto มีหลาย exchange, Gold มี bid/ask และ FX ของธนาคารกลางเป็น reference rate ที่อาจไม่ได้อัปเดตแบบ tick-by-tick ดังนั้น UI ต้องแสดง Source + Timestamp และเรียกข้อมูลว่า “Reference / Market Price”

### Data Freshness Contract

```
{
  "symbol": "BTC",
  "priceUsd": 123456.78,
  "source": "coingecko",
  "marketUpdatedAt": "ISO_TIMESTAMP",
  "fetchedAt": "ISO_TIMESTAMP",
  "stale": false
}
```

### Fallback Strategy

Primary Provider → Retry 1 ครั้ง → Cached last-known-good → Manual input mode

## 4. Calculation Model — สูตรต้องชัดก่อนเริ่ม Coding

### Crypto / Gold Base Formula

```
grossBuyUsd = quantity × buyPriceUsd

buyFeeUsd =
  feeMode === "percent"
    ? grossBuyUsd × buyFeePercent / 100
    : fixedBuyFeeUsd

totalCostUsd = grossBuyUsd + buyFeeUsd

grossSellUsd = quantity × sellPriceUsd

sellFeeUsd =
  feeMode === "percent"
    ? grossSellUsd × sellFeePercent / 100
    : fixedSellFeeUsd

netSellUsd = grossSellUsd - sellFeeUsd

profitUsd = netSellUsd - totalCostUsd

roiPercent =
  totalCostUsd > 0
    ? profitUsd / totalCostUsd × 100
    : 0

totalCostThb = totalCostUsd × usdThb
netSellThb = netSellUsd × usdThb
profitThb = profitUsd × usdThb
```

### Break-even Sell Price

หาก sell fee เป็น fixed:

```
breakEvenSellPrice =
  (totalCostUsd + sellFeeUsd) / quantity
```

หาก sell fee เป็น percentage `r`:

```
breakEvenSellPrice =
  totalCostUsd / (quantity × (1 - r))
```

### Gold Unit Conversion

```
1 troy ounce = 31.1034768 grams

ounces = grams / 31.1034768
goldValueUsd = ounces × xauUsdPrice
```

**อย่าใช้ JavaScript floating point แบบไม่คิด:** จำนวนเงินควรมี strategy เรื่อง precision เช่นใช้ decimal library หรือ normalize/round ที่ boundary ที่กำหนด และต้องมี unit tests สำหรับ decimal edge cases

PHASE 3

## 5. UX / UI Design

### Page Structure

Trade CalculatorUSD/THB  •  Source: BOT  •  Updated …

**1. Asset****Crypto / Gold
BTC ▼

Quantity****0.10

2. Prices****Buy Price $ 50,000
Sell Price $ 60,000
[ Use market price ]

3. Fees****Buy Fee % / USD
Sell Fee % / USD

Result****Total Cost: $5,000
Net Sale: $6,000
**Profit: +$1,000 / +฿34,000**
ROI: +20%

### UX Rules

- ผู้ใช้เห็นผลแบบ real-time ไม่ต้องกด Submit

- สีเขียว/แดงใช้เป็นข้อมูลเสริม ไม่ใช้สีเป็น indicator เพียงอย่างเดียว

- มีข้อความ “กำไร” / “ขาดทุน” ชัดเจน

- แสดง timestamp ของ FX และ asset price แยกกัน

- มี toggle “Use live FX / Manual FX”

- ไม่ auto-refresh ขณะผู้ใช้กำลังกรอกจนทำให้ตัวเลขกระโดดโดยไม่รู้ตัว

- Mobile ต้องสามารถใช้งาน Calculator ได้ด้วยนิ้วโป้งและ input เป็น numeric keypad

PHASE 4

## 6. Architecture

Browser
  │
  ├── Calculator UI (Client Component)
  │       └── Pure calculation functions
  │
  └── Next.js API / Route Handlers
          │
          ├── MarketDataService
          │      ├── CoinGeckoProvider
          │      └── GoldApiProvider
          │
          ├── FxService
          │      └── Frankfurter/BOT Provider
          │
          └── Cache / validation / rate limiting

### Architecture Decisions

| Decision | เหตุผล |
| --- | --- |
| Provider abstraction | เปลี่ยน Coin/Gold/FX provider ได้โดยไม่แก้ UI |
| Server-side provider calls | ซ่อน API keys, เพิ่ม caching และ normalize response |
| Pure calculation library | ทดสอบสูตรได้โดยไม่ต้อง render React |
| No database ใน MVP | ยังไม่มี account/history จึงลด complexity |
| Manual fallback | Calculator ไม่ควรใช้งานไม่ได้เพียงเพราะ market API ล่ม |

## 7. Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js + App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Validation | Zod |
| Calculation precision | decimal.js หรือแนวทาง decimal equivalent |
| Unit Test | Vitest |
| Component Test | Testing Library |
| E2E | Playwright |
| Deploy | Docker หรือ Vercel |
| CI | GitHub Actions |

MVP Rule:** อย่าเพิ่ม database, auth, state-management library หรือ component library จนกว่าจะมี requirement ที่พิสูจน์ว่าจำเป็น

PHASE 5 — AGENT CONTEXT

## 8. เตรียม Context ให้ AI Coding Agent

### ไฟล์ CLAUDE.md / AGENTS.md

```
# Trading Calculator Project Instructions

## Goal
Build a reliable trading cost/profit calculator for Crypto and Gold.
Base market prices are USD. Results display USD and THB.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod
- Vitest
- Playwright

## Core rules
- Do not hardcode USD/THB or market prices.
- Never expose provider API keys to client-side code.
- Calculation logic must live in src/lib/calculation.
- External API responses must be normalized before reaching UI.
- Every market value shown in UI must include source and timestamp.
- Calculator must support manual price and manual FX fallback.
- Do not add database/auth in MVP.
- Do not modify unrelated files.

## Safety
- Never log API keys.
- Do not commit .env files.
- Validate all route parameters.
- Add timeout to external requests.
- Fail gracefully.

## Quality Gate
Before completion:
1. npm run lint
2. npm run typecheck
3. npm run test
4. npx playwright test
5. Review git diff
6. Confirm acceptance criteria
```

### docs/architecture.md

เขียน provider boundaries, calculation model, cache policy และ failure modes ไว้ก่อน implement เพื่อให้ Agent รอบถัดไปไม่ต้องค้น repo ใหม่ทุกครั้ง

PHASE 6

## 9. Project Initialization

### เริ่ม Project

```
npx create-next-app@latest trading-calculator \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir

cd trading-calculator

npm install zod decimal.js
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npx playwright install
```

### Branch Strategy

```
main
└── develop
    ├── feat/calculation-engine
    ├── feat/market-data
    ├── feat/calculator-ui
    ├── test/e2e-calculator
    └── chore/deployment
```

### Folder Structure

```
src/
├─ app/
│  ├─ api/
│  │  ├─ fx/route.ts
│  │  └─ market/route.ts
│  ├─ page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  └─ calculator/
│     ├─ AssetSelector.tsx
│     ├─ TradeInputs.tsx
│     ├─ FeeInputs.tsx
│     ├─ FxRateCard.tsx
│     ├─ MarketPriceCard.tsx
│     └─ ProfitSummary.tsx
├─ lib/
│  ├─ calculation/
│  │  ├─ calculateTrade.ts
│  │  ├─ goldUnits.ts
│  │  └─ types.ts
│  ├─ providers/
│  │  ├─ coingecko.ts
│  │  ├─ goldapi.ts
│  │  └─ frankfurter.ts
│  ├─ services/
│  │  ├─ marketDataService.ts
│  │  └─ fxService.ts
│  └─ validation/
│     └─ schemas.ts
└─ types/

tests/
├─ unit/
├─ integration/
└─ e2e/

docs/
├─ requirements.md
├─ architecture.md
├─ testing-strategy.md
└─ deployment.md
```

## 10. Internal API Design

### GET /api/fx?base=USD"e=THB

```
{
  "base": "USD",
  "quote": "THB",
  "rate": 0,
  "source": "BOT",
  "referenceDate": "YYYY-MM-DD",
  "fetchedAt": "ISO_TIMESTAMP",
  "stale": false
}
```

### GET /api/market?type=crypto&id=bitcoin

```
{
  "type": "crypto",
  "id": "bitcoin",
  "symbol": "BTC",
  "currency": "USD",
  "price": 0,
  "source": "CoinGecko",
  "marketUpdatedAt": "ISO_TIMESTAMP",
  "fetchedAt": "ISO_TIMESTAMP"
}
```

### GET /api/market?type=gold

```
{
  "type": "gold",
  "symbol": "XAU",
  "currency": "USD",
  "unit": "troy_ounce",
  "price": 0,
  "bid": 0,
  "ask": 0,
  "source": "GoldAPI",
  "marketUpdatedAt": "ISO_TIMESTAMP",
  "fetchedAt": "ISO_TIMESTAMP"
}
```

### Error Contract

```
{
  "error": {
    "code": "MARKET_PROVIDER_UNAVAILABLE",
    "message": "Live market price is temporarily unavailable.",
    "manualInputAllowed": true
  }
}
```

PHASE 7 — DEVELOPMENT

## 11. Development Plan — ทำเป็น Vertical Slices

| Slice | งาน | Verify |
| --- | --- | --- |
| 1 | Types + Calculation Engine | Unit tests |
| 2 | USD/THB Provider | Integration contract test |
| 3 | Crypto Provider | Mocked integration test |
| 4 | Gold Provider | Mocked integration test |
| 5 | Internal API routes | Route tests |
| 6 | Calculator UI | Component tests |
| 7 | Live price / FX integration | Integration + manual fallback |
| 8 | Responsive / Accessibility | Browser QA |
| 9 | E2E + Visual | Playwright |
| 10 | Docker / CI / Deploy | Smoke test |

**Agent Rule:** ให้ Coding Agent ทำทีละ Slice และหยุดสรุปผลก่อนเริ่ม Slice ถัดไป เพื่อให้ human สามารถ review diff ได้ง่ายและลด blast radius

## 12. Frontend Implementation

### State Model

```
type CalculatorState = {
  assetType: "crypto" | "gold";
  assetId: string;
  quantity: string;
  buyPriceUsd: string;
  sellPriceUsd: string;
  buyFee: FeeInput;
  sellFee: FeeInput;
  fxMode: "live" | "manual";
  manualUsdThb?: string;
  goldUnit?: "oz" | "gram";
};
```

### สำคัญ: Inputs เก็บเป็น String

ระหว่างกรอกควรเก็บค่าจาก input เป็น string เพราะ input ชั่วคราวอย่าง `""`, `"."` หรือ `"0."` เป็น state ที่ถูกต้องในเชิง UX แล้วค่อย parse/validate ที่ calculation boundary

### Server vs Client Components

| Component | ประเภท |
| --- | --- |
| Page shell / metadata | Server Component |
| Interactive calculator | Client Component |
| Calculation function | Pure TypeScript |
| External provider call | Server only |

### Loading / Error States

- Market price loading ไม่ block manual calculation

- FX error → แจ้งเตือน + เปิด manual FX field

- Gold API error → Sell Price manual ยังใช้ได้

- ข้อมูล stale → แสดง badge “Last known price”

## 13. Backend / Provider Layer

### Provider Interface

```
export type MarketQuote = {
  symbol: string;
  currency: "USD";
  price: number;
  source: string;
  marketUpdatedAt: string | null;
  fetchedAt: string;
};

export interface CryptoPriceProvider {
  getPrice(id: string): Promise<MarketQuote>;
}

export interface GoldPriceProvider {
  getXauUsd(): Promise<MarketQuote>;
}

export interface FxProvider {
  getUsdThb(): Promise<FxQuote>;
}
```

### Server Fetch Policy

```
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000),
  next: { revalidate: 60 }
});
```

### Normalization

UI ห้ามรู้ว่า CoinGecko ใช้ field ชื่ออะไร หรือ GoldAPI return JSON แบบไหน Provider Adapter ต้องเปลี่ยนข้อมูลทุกเจ้าให้เป็น internal contract เดียว

PHASE 8 — SECURITY

## 14. Security Design

| Risk | Control |
| --- | --- |
| API key leak | Provider call อยู่ server-only และ secret อยู่ Environment Variable |
| Abuse internal API | Allowlist asset IDs, validation, caching, rate limit |
| SSRF | ห้ามรับ arbitrary provider URL จาก user |
| Huge numeric input | Zod bounds + finite number validation |
| Provider hangs | Timeout |
| Provider returns malformed JSON | Validate external response |
| Secret logging | Redaction + ห้าม log request headers ที่มี key |
| Misleading financial output | source/timestamp + disclaimer + manual mode |

### .env.example

```
GOLD_API_KEY=
COINGECKO_API_KEY=
MARKET_CACHE_SECONDS=60
FX_CACHE_SECONDS=3600
```

ไฟล์จริง `.env.local` ต้องอยู่ใน `.gitignore`

PHASE 9 — TESTING

## 15. Testing Strategy

### Unit Tests — Calculation

| Case | Expected |
| --- | --- |
| Profit | Sell > Cost → positive profit |
| Loss | Sell
