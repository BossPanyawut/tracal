# TRACAL — Task Backlog & Checkpoints

อัปเดต: 2026-09-08
คู่มือ: [Development plan](development-plan.md) · [Calculation contract](calculation-contract-v2.md) · [Agent runbook](agent-runbook.md)

## 1. สถานะและกติกา

ตารางนี้เป็นแหล่งสถานะงานหลัก: `TODO` ยังไม่เริ่ม, `IN_PROGRESS` กำลังทำ, `BLOCKED` ติด dependency/ข้อมูลจริง, `DONE` ผ่าน acceptance พร้อมหลักฐาน, `DEFERRED` ยังไม่อยู่ในรอบ implementation

ขนาด S/M/L ดูนิยามใน development-plan.md งานย่อยหนึ่งชุดควรจบด้วย diff ที่ review ได้ หากขยายเกินขอบเขตให้เพิ่ม subtask เช่น T04.1 โดยคง ID เดิมไว้เป็น parent

ไฟล์ที่ระบุเป็นจุดเริ่มต้นตรวจ/แก้ ไม่ใช่คำสั่งให้สร้าง abstraction หรือไฟล์ใหม่ทุกชื่อโดยอัตโนมัติ

| ID | Task | Phase | Priority | Size | Depends on | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T00 | Reconcile baseline docs/test inventory | P0 | P0 | S | — | DONE |
| T01 | Lock calculation/data contract | P0 | P0 | M | T00 | DONE |
| T02 | FX provider/route reliability coverage | P1 | P0 | M | T00 | DONE |
| T03 | Shared FX state + manual/reference controls | P1 | P0 | M | T01, T02 | DONE |
| T04 | Dual-FX calculation engine | P2 | P0 | M | T01 | DONE |
| T05 | Target/break-even/sensitivity v2 | P2 | P0 | M | T04 | DONE |
| T06 | Input schema v2 + safe draft migration | P2 | P0 | M | T03, T04 | DONE |
| T07 | Net THB summary and input UX | P2 | P0 | M | T05, T06 | DONE |
| T08 | Versioned plan storage | P3 | P1 | M | T06, T07 | DONE |
| T09 | Saved plan workflow | P3 | P1 | M | T08 | DONE |
| T10 | JSON backup/import | P3 | P1 | M | T09 | DONE |
| T11 | Risk sizing engine | P4 | P1 | M | T05, T07 | DONE |
| T12 | Risk plan UI + apply plan | P4 | P1 | M | T09, T11 | DONE |
| T13 | R1 regression, browser QA, release notes | P4 | P0 | M | T02–T12 | DONE |
| T14 | Prepare and run user pilot | P5 | P1 | M | T13 | BLOCKED |
| T15 | Evaluate demand and choose R2 | P5 | P1 | S | T14 | BLOCKED |
| F01 | Multi-entry/partial exit journal | R2 | P2 | L | revised scope | DONE |
| F02 | USDT/THB contract and calculator | R2 | P2 | L | revised scope | DONE |
| F03 | Exchange CSV import | R2 | P2 | L | F01, F02 | DONE |
| F04 | Branded embeddable widget | R2 | P2 | M | revised scope | DONE |
| F05 | Gold/live market price | R2 | P2 | L | revised scope | DONE |
| F06 | Subscription/cloud sync/AI assistance | R2 | P2 | L | T15 + revised scope | DEFERRED |

## 2. Task cards — P0/P1

### T00 — Reconcile baseline docs/test inventory

- **ผลลัพธ์:** แยกสิ่งที่ทำแล้วกับแผนเดิม และมี baseline ที่ตรวจซ้ำได้
- **พื้นที่:** `README.md`, `docs/requirements.md`, `docs/architecture.md`, `docs/testing-strategy.md`, `docs/deployment.md`, คู่มือ SDLC เดิม
- [x] ตรวจ routes/providers/tests จริง และแก้คำอธิบาย market/gold/integration tests ที่ยังไม่มี
- [x] ใส่ลิงก์จากคู่มือ SDLC เดิมมายังแผนปัจจุบัน โดยคงประวัติแนวคิดเดิมไว้
- [x] รัน baseline quality gates; บันทึก revision, จำนวน tests และ warning/failure ตามจริง
- **ตรวจรับ:** เอกสารไม่มีข้อความอ้างว่าฟีเจอร์ที่ยังไม่มีใช้งานได้แล้ว; ใช้ `git diff --check` และตรวจลิงก์
- **Checkpoint:** ส่วนแรกของ CP0; ไม่รวมสร้างฟีเจอร์ที่เอกสารเก่าเคยระบุ

### T01 — Lock calculation/data contract

- **ผลลัพธ์:** types/schema/precision strategy รองรับสูตรใน calculation-contract-v2.md
- **พื้นที่:** `src/lib/calculation/types.ts`, `src/lib/validation/`, `docs/calculation-contract-v2.md`
- [x] กำหนดชื่อ field/หน่วยของ rate, costs, P/L, ROI และ break-even ทั้งสองฐาน
- [x] กำหนด error/result shape สำหรับ invalid, incomplete, unreachable และ version identifiers
- [x] ระบุ reference quote vs applied FX snapshot และ provenance ของ manual/legacy values
- [x] ตรวจ fixture ด้วยการคำนวณอิสระก่อนทำให้เป็น unit tests; บันทึกการเปลี่ยน contract ถ้าพบข้อผิดพลาด
- **ตรวจรับ:** ไม่มี ambiguous currency/fee semantics; types ไม่ทำให้ caller ปัจจุบันพังระหว่างเปลี่ยนผ่าน; typecheck ผ่าน
- **Checkpoint:** CP0; ยังไม่เปลี่ยน UI ให้ใช้ v2 ก่อน engine พร้อม

### T02 — FX provider/route reliability coverage

- **ผลลัพธ์:** failure policy มีหลักฐานทดสอบจริงและแก้ bug ที่พบภายในขอบเขต
- **พื้นที่:** `src/lib/providers/`, `src/lib/services/fxService.ts`, `src/app/api/fx/route.ts`, `src/lib/http/`, `tests/integration/`
- [x] เพิ่ม tests สำหรับ primary success, primary fail/fallback success, both fail with stale cache และ no cache → structured 503
- [x] ตรวจ response normalization, invalid query, malformed JSON/rate/date, timeout/retry และ rate-limit response
- [x] ควบคุม clock/fetch/cache ระหว่าง tests; ห้ามเรียก provider จริงใน automated suite
- [x] ถ้า provider ไม่ให้ market timestamp ต้องไม่สร้าง timestamp ปลอมจากเวลาที่ fetch
- **ตรวจรับ:** แต่ละ failure path ยังให้ manual mode ทำงานได้; suite ไม่ขึ้นกับ test order/network; ไม่มี secrets ใน output
- **Checkpoint:** ฝั่ง server ของ CP1

### T03 — Shared FX state + manual/reference controls

- **ผลลัพธ์:** ticker และ calculator ใช้ quote เดียว ผู้ใช้ควบคุมเรตทั้งสองขาได้
- **พื้นที่:** `src/app/page.tsx`, `src/components/fx/FxTicker.tsx`, `src/components/calculator/Calculator.tsx`, `TradeInputs.tsx`, component tests
- [x] ย้าย ownership ของ quote มา shared state ที่เล็กที่สุด ไม่เพิ่ม state library โดยไม่จำเป็น
- [x] เปิด manual mode ได้ทันทีทุกสถานะ พร้อม action ใช้ reference ระบุขา
- [x] แสดง source/referenceDate/fetchedAt/stale ตามจริง; source/date ไม่หายเมื่อใช้ fallback
- [x] refresh เปลี่ยน reference เท่านั้นหลังมี applied rate; เปิดแผนเดิมไม่ถูก auto-fill ทับ
- **ตรวจรับ:** component tests จำลอง loading/error/stale/success และยืนยัน manual values ไม่ถูก overwrite; การ์ดกับ calculator ไม่ดึง quote คนละชุด
- **Checkpoint:** CP1; dual-rate UI ต่อ engine อย่างสมบูรณ์ใน T06–T07

## 3. Task cards — P2

### T04 — Dual-FX calculation engine

- **ผลลัพธ์:** คำนวณ forward และ attribution ตาม contract โดยไม่พึ่ง React/provider
- **พื้นที่:** `src/lib/calculation/position.ts`, `calculateTrade.ts`, `types.ts`, `tests/unit/`
- [x] รองรับ rb/rs, fixed THB conversion costs และ fee mode เดิม
- [x] เพิ่ม netSellThb, tradeProfitUsd, profitThb, ROI สองฐานและ attribution ที่ reconcile ได้
- [x] ใช้ precision/bounds/decimal strings ตาม contract; ปรับ consumer boundary โดยไม่ปัด intermediate
- [x] เพิ่ม tests fixture A–D, invalid values, fee combinations และ same-FX compatibility
- **ตรวจรับ:** identity `price + FX - fees = THB profit` ผ่าน และเปลี่ยน sell FX ต้องไม่เปลี่ยน quantity/cost ฝั่งซื้อ
- **Checkpoint:** engine หลักของ CP2

### T05 — Target/break-even/sensitivity v2

- **ผลลัพธ์:** ทุกผลย้อนกลับอ้างอิง THB cash flow เดียวกับ summary
- **พื้นที่:** `requiredSellPrice.ts`, `sensitivity.ts`, unit tests ที่เกี่ยวข้อง
- [x] แยก break-even USD basis และ THB basis ชัดเจน
- [x] รองรับ target zero/negative reachable; คืน unreachable เมื่อราคาที่ต้องการติดลบ
- [x] sensitivity ใช้ forward engine เดียวกันและ input snapshot เดียว
- [x] เพิ่ม round-trip tests: คำนวณราคาเป้าแล้วส่งกลับ forward engine ต้องได้กำไรตรงเป้าภายใน tolerance
- **ตรวจรับ:** fixture E–F และ fixed/percent fee combinations ผ่าน; ไม่มี clamp เงียบเป็นราคา 0
- **Checkpoint:** ส่วนสูตรย้อนกลับของ CP2

### T06 — Input schema v2 + safe draft migration

- **ผลลัพธ์:** draft v2 ใช้สองเรตและเก็บ provenance ได้โดยรักษา v1
- **พื้นที่:** `src/components/calculator/types.ts`, `storage.ts`, `Calculator.tsx`, validation และ storage tests
- [x] เพิ่ม state/schema version, conversion costs, explicit applied rate/provenance
- [x] ย้าย v1 แบบ idempotent ตาม migration contract; เก็บสำรองจนตรวจ v2 สำเร็จ
- [x] ข้อมูล live FX เดิมที่ไม่ได้บันทึกต้องไม่ถูกอ้างว่ากู้ได้; manual เก่าติดป้ายให้ตรวจ
- [x] ทดสอบ corrupt storage, missing fields, invalid rate, legacy manual และไม่มี historical rate
- **ตรวจรับ:** reload แล้ว draft ไม่สูญหาย; failure ไม่ overwrite v1; ไม่สร้าง false historical result
- **Checkpoint:** ส่วน compatibility ของ CP2

### T07 — Net THB summary and input UX

- **ผลลัพธ์:** ผู้ใช้เห็นผลสุทธิและเข้าใจว่ากำไร USD/THB ต่างกันได้
- **พื้นที่:** `TradeInputs.tsx`, `FeeInputs.tsx`, `ProfitSummary.tsx`, `TargetProfit.tsx`, `SensitivityTable.tsx`, styles, component/E2E tests
- [x] ต่อ engine v2 ครบทุก component; ข้อมูลเงินออก/เงินกลับ/กำไร/ROI/จุดคุ้มทุนมีฐานสกุลเงินชัดเจน
- [x] แสดง price effect, FX effect และ fees พร้อมรายละเอียด convention ที่อ่านได้
- [x] แสดงข้อความเกี่ยวกับเรตสมมติ ค่าใช้จ่ายที่รวม และไม่รวมภาษีตามบริบท
- [x] รองรับ numeric keyboard, field errors, partial input, target zero และค่าที่เล็ก/ใหญ่
- **ตรวจรับ:** E2E fixture B เห็น USD บวก/THB ลบ; manual FX ใช้ได้ทั้งมี/ไม่มี API; desktop/mobile ไม่ล้นหรือพึ่งสีอย่างเดียว
- **Checkpoint:** CP2 พร้อมรัน full quality gates

## 4. Task cards — P3

### T08 — Versioned plan storage

- **ผลลัพธ์:** plan repository ใน browser ที่เก็บ snapshot อย่างคงที่
- **พื้นที่:** `src/lib/plans/` (เสนอ), storage/schema tests และ draft storage boundary
- [x] Plan มี id/name/asset label/timestamps, inputSchemaVersion, calculationVersion, input snapshot และ applied FX metadata
- [x] เก็บ output snapshot แบบ decimal strings เพื่อให้เปิดผลเดิมได้; reference ปัจจุบันไม่เขียนทับ
- [x] asset label เป็นข้อมูลผู้ใช้ ไม่ใช่การรับรองว่ามี live market support
- [x] แยก latest draft ออกจาก saved plans; save/update เป็น action ชัดเจน
- [x] จัดการ quota/unavailable/corrupt data; มีเพดาน 100 แผนใน R1 และแจ้งข้อจำกัดโดยไม่ลบของเดิมเอง
- **ตรวจรับ:** unit tests CRUD/version/migration/write failure; ไม่ส่งข้อมูลออก network; storage error ไม่ทำลายการคำนวณ
- **Checkpoint:** storage ของ CP3

### T09 — Saved plan workflow

- **ผลลัพธ์:** ผู้ใช้สร้างชื่อแผน เปิด ทำสำเนา และลบได้
- **พื้นที่:** plan list/editor components, calculator integration, component/E2E tests
- [x] Save/new/open/duplicate/delete พร้อม dirty state ไม่ทิ้ง draft โดยไม่มีทางรักษา
- [x] เปิดแผนแล้วใช้ snapshot เดิม; ผู้ใช้เลือกใช้ quote ใหม่และคำนวณใหม่ได้อย่างชัดเจน
- [x] ถ้า calculation version ต่าง ให้แสดงผลเดิมและ action คำนวณใหม่ ไม่เปลี่ยนย้อนหลังเงียบ ๆ
- [x] ลบแผนมี confirmation หรือ undo ที่รักษาข้อมูลได้จริง
- **ตรวจรับ:** E2E save → reload → open ให้ข้อมูลเดิมแม้ mock FX เปลี่ยน; duplicate ไม่ทับ original; keyboard/mobile ใช้งานได้
- **Checkpoint:** workflow ของ CP3

### T10 — JSON backup/import

- **ผลลัพธ์:** สำรองและย้ายแผนด้วยไฟล์โดยไม่ต้องมีบัญชี
- **พื้นที่:** plan serialization/import UI, storage tests, E2E
- [x] Export JSON พร้อม schema version และทุก field ที่จำเป็นต่อการ restore
- [x] Import จำกัด 1 MiB/100 แผน, validate schema/bounds ก่อนเขียน และ preview จำนวนรายการ
- [x] ใช้ append เป็นค่าเริ่มต้น; ID ชนให้สร้าง ID ใหม่และแจ้งจำนวน ไม่ overwrite แผนเดิมเงียบ ๆ
- [x] newer schema/invalid payload/full storage ต้องไม่ทำ partial write; ไม่ตีความชื่อแผนเป็น HTML
- **ตรวจรับ:** round-trip export/import คงค่า decimal/provenance; invalid/oversized import ไม่ทำลายข้อมูลเดิม
- **Checkpoint:** CP3; JSON backup นี้ไม่ใช่ exchange CSV importer

## 5. Task cards — P4/P5

### T11 — Risk sizing engine

- **ผลลัพธ์:** ขนาดซื้อที่อยู่ภายใต้ risk budget และ capital cap ตามสมมติฐาน
- **พื้นที่:** `src/lib/calculation/` risk module, validation และ unit tests
- [x] Implement สูตร risk ใน contract พร้อม full round-trip fees/costs
- [x] ตรวจ stop bounds, `a <= 0`, `R <= b`, capital insufficient และ quantity precision
- [x] ปัด quantity ลงเมื่อจำเป็น แล้วนำผลไปคำนวณด้วย forward engine อีกครั้ง
- [x] เพิ่ม risk fixtures ทั้ง risk-limited/capital-limited, FX ต่างกัน และ fixed fee ทำให้ทำแผนไม่ได้
- **ตรวจรับ:** ผล forward ที่ stop ไม่เกิน risk budget/capital cap ตาม tolerance; ไม่คืน infinite/negative position
- **Checkpoint:** engine ของ CP4

### T12 — Risk plan UI + apply plan

- **ผลลัพธ์:** ผู้ใช้กรอก stop/risk/capital cap แล้วเลือกใช้ผลกับแผนได้
- **พื้นที่:** calculator risk components, saved plan schema, component/E2E tests
- [x] แสดง quantity/capital/expected loss และ assumption ของ stop/FX ที่ใช้
- [x] แสดง reward-to-risk เฉพาะค่าที่นิยามได้ พร้อมกำไรเป้าหมายสุทธิ THB
- [x] Apply เป็น action ชัดเจนและไม่แก้ saved snapshot จนผู้ใช้บันทึก
- [x] เปลี่ยน input ที่เกี่ยวข้องแล้ว risk result คำนวณใหม่ ไม่แสดงผลจากข้อมูลเก่า
- **ตรวจรับ:** E2E fixture risk และ invalid/unavailable cases; ไม่มีคำว่า guaranteed/max loss ที่อ้างว่าจะขายได้ราคานั้นแน่นอน
- **Checkpoint:** UX ของ CP4

### T13 — R1 regression, browser QA, release notes

- **ผลลัพธ์:** release candidate ที่ตรวจรับได้และมีข้อจำกัดชัดเจน
- **พื้นที่:** tests, docs, README; แก้ application เฉพาะข้อบกพร่องที่ตรวจพบ
- [x] ตรวจ traceability ทุก acceptance criterion → test/manual evidence; ไม่ใช้จำนวน tests แทน coverage
- [x] รัน lint/typecheck/unit+integration+component/E2E/build ตาม runbook และ review diff
- [x] ตรวจ browser จริงทั้ง mobile/desktop, keyboard focus, labels, errors, loading, stale source/date และ long numbers ผ่าน Playwright projects
- [x] เขียน release notes, migration/backup instructions, known limitations และ rollback ไม่ทำลาย v1/v2 storage
- [x] ตรวจไม่มี secret/env diff และไม่มีฟีเจอร์นอกขอบเขตที่ได้รับมอบหมาย; จัดทำ deploy/smoke checklist พร้อมใช้เมื่อได้รับมอบหมาย deploy
- **ตรวจรับ:** CP0–CP4 มีหลักฐานครบ; unresolved correctness/data-loss bug ต้องไม่ผ่าน release gate
- **Checkpoint:** CP4; การเตรียม release ไม่เท่ากับ deploy production

### T14 — Prepare and run user pilot

- **ผลลัพธ์:** pilot kit และข้อมูลพฤติกรรมจริงที่ไม่ปะปนข้อมูลสมมติ
- **พื้นที่:** `docs/product-validation.md` (สร้างเมื่อทำ task)
- [x] เตรียม scenario/script ให้ลองเรตต่างกัน บันทึกแผน กลับมาเปิด และอธิบายผลลัพธ์ด้วยคำตัวเอง
- [x] เตรียมแบบบันทึก anonymous participant ID, วันที่, task success, friction, return และข้อเสนอราคา
- [x] เตรียมข้อเสนอ Pro/widget แบบมีสิ่งส่งมอบและราคา โดยระบุว่ายังอยู่ขั้นทดลอง
- [ ] ดำเนินการทดลองเมื่อมีผู้เข้าร่วมและการอนุญาตให้ติดต่อ; ไม่มีผู้ทดลองให้บันทึก BLOCKED พร้อมส่วนเตรียมการที่เสร็จ
- **ตรวจรับ:** metric ใช้นิยาม/ตัวหารใน development-plan.md; ไม่อ้างว่าทดลองเสร็จจากการเตรียมเอกสารเพียงอย่างเดียว
- **Checkpoint:** ข้อมูลตั้งต้น CP5

### T15 — Evaluate demand and choose R2

- **ผลลัพธ์:** ข้อเสนอเฟสถัดไปจากหลักฐาน
- **พื้นที่:** product-validation report และ roadmap/backlog
- [ ] แยก activation/return/interest/accepted offer/actual payment พร้อมจำนวนและระยะติดตาม
- [ ] ระบุ pain point ซ้ำและหลักฐานที่ค้านสมมติฐานเดิม
- [ ] ประเมินต้นทุนพัฒนา/provider/support เทียบรายได้แบบ scenario ไม่ใช่การรับประกัน
- [ ] เลือก F task ที่มีเหตุผลรองรับ หรือย้อนแก้ R1 พร้อมบันทึก decision และ next task
- **ตรวจรับ:** ไม่มีการสร้างข้อมูลผู้ใช้/ยอดขายเอง; งานนอก MVP ต้องกำหนด scope ใหม่ก่อนเริ่ม
- **Checkpoint:** CP5

## 6. Conditional backlog — แตกย่อยก่อนเริ่มจริง

| ID | ขอบเขตเมื่อถูกเลือก | เกณฑ์พร้อมเริ่ม/ตรวจรับหลัก |
| --- | --- | --- |
| F01 | ซื้อหลายไม้ ขายบางส่วน และ planned vs actual | กำหนด weighted-average cost ภายในแอป, realized/unrealized, per-lot FX/fees, oversell handling; ต้นทุนรวมและ quantity reconcile; ไม่อ้างใช้แทนบัญชีภาษี |
| F02 | USDT/THB และ currency-aware input/output | แยก USD/USDT ใน schema และ rate provenance; มี manual conversion; ไม่ใช้ USD rate แทน USDT rate โดยปริยาย |
| F03 | CSV จาก exchange หนึ่งเจ้าก่อน | มีไฟล์ตัวอย่างที่อนุญาตใช้, preview mapping, timezone, decimal, fee currency, idempotency/dedup; invalid row ไม่เงียบ; exported CSV ป้องกัน formula injection |
| F04 | Widget ใส่แบรนด์สำหรับเว็บไซต์ | มี pilot requirement, theme config, embed isolation/responsive, origin/message contract หากใช้ postMessage และไม่มี secret ใน embed; เตรียมเดโมได้ก่อนติดต่อขาย |
| F05 | Gold หรือ live asset quote | เลือก instrument/units ให้ชัด, อ่าน provider docs/terms ปัจจุบัน, normalize source/time, allowlist, timeout, manual fallback และ unit fixtures; แยก gold spot จากทองไทย/CFD |
| F06 | Cloud/billing หรือ AI assistant | ต้องแยกเป็นโครงการย่อยพร้อม scope ใหม่; cloud มี data ownership/export/deletion, billing มี lifecycle, AI มี validated input/engine output/cost limit; ห้ามรวมทุกอย่างเป็น task เดียว |

### ผลการทำ Local 02 extension

- **F01 DONE:** สมุดรายการใช้ต้นทุนเฉลี่ยถ่วงน้ำหนัก รองรับหลายไม้/ขายบางส่วน แยก realized/unrealized ป้องกัน oversell และเปรียบเทียบกับแผนได้
- **F02 DONE:** schema และ calculator แยก USD/USDT; USDT ต้องกรอกเรตเองและไม่คัดลอก USD reference
- **F03 DONE:** สำรอง/นำเข้า TRACAL CSV และ Binance Spot profile พร้อม preview, validation, duplicate handling, formula-injection escape และเพดานไฟล์/รายการ
- **F04 DONE:** `/widget` สร้างค่าแบรนด์และ iframe code; `/embed` validate query และไม่ใช้ saved plans/journal
- **F05 DONE:** BTC/ETH reference จาก Coinbase และ XAU/USD จาก GoldAPI แบบ server-only; ทุกค่ามี source/time, allowlist, timeout และ manual fallback
- **F06 DEFERRED:** ยังไม่มี database/auth/billing/AI call ตาม scope ที่ผู้ใช้เลือก เตรียม architecture และ task breakdown ใน [future-cloud.md](future-cloud.md)

## 7. Execution log / Handoff

### 2026-09-08 — LOCAL-02-IMPLEMENTATION

- Revision: baseline `bfcc6f6` + implementation working tree
- Scope: T00–T13 และ F01–F05; เตรียม pilot kit ของ T14; F06 เตรียมเป็นงาน cloud/สมาชิกในรอบถัดไปตามคำสั่งผู้ใช้
- Application: dual FX/attribution/target/risk, versioned plans/backup, USD/USDT, multi-entry journal, CSV, branded widget และ live BTC/ETH/XAU reference พร้อม manual fallback
- Data safety: v1 migration ไม่สร้าง historical FX, current-version snapshot ตรวจซ้ำกับ engine, invalid import เขียนแบบไม่ partial, corrupt plan/journal เปิดดาวน์โหลดข้อมูลดิบโดยหยุดการเขียนทับ
- Automated evidence: lint/typecheck/build ผ่าน; Vitest 9 files / 74 tests; Playwright 22/22 tests ผ่านบน Chromium desktop และ Pixel 7 (ผล final rerun อยู่ใน handoff ของรอบนี้)
- Browser QA: Playwright เปิดและใช้งาน browser จริงทั้งสอง viewport; ตรวจภาพหน้า desktop, Pixel 7, widget และ journal แล้วไม่พบ overflow/ข้อความซ้อนที่ขวางการใช้งาน ส่วน in-app interactive Browser ไม่มี instance ใน environment จึงไม่ได้ตรวจแบบ side-by-side
- Checkpoints: CP0–CP4 PASS; T14 BLOCKED ที่การมีผู้เข้าร่วมจริง; T15 BLOCKED เพราะยังไม่มีผล pilot; CP5 ยังไม่ผ่าน
- Release/deploy: เตรียม release notes, migration, rollback และ smoke checklist แล้ว; ยังไม่ได้ deploy หรือติดต่อผู้ทดลอง
- Warning: Playwright แสดง `NO_COLOR` ถูกข้ามเมื่อมี `FORCE_COLOR`; ไม่มีผลต่อผลทดสอบ

### 2026-09-08 — ROUTE-UX-SEPARATION

- แยก `/calculator` สำหรับคำนวณ/แผน และ `/journal` สำหรับรายการจริง; `/` เป็นหน้าเลือกงาน และ hash เดิม redirect ไป route ใหม่
- เพิ่ม shared navigation, active-page state, workflow 3 ขั้น, companion action และ mobile navigation ที่ไม่ซ่อนเมนู
- ปรับ widget ให้ใช้ navigation/footer ชุดเดียวกัน และอัปเดต route documentation กับ Playwright coverage
- Verification: lint/typecheck ผ่าน, Vitest 74/74, Playwright 24/24 บน Chromium desktop และ Pixel 7 และ production build ผ่าน
- Visual QA: ตรวจหน้าแรก หน้า calculator และหน้า journal ที่ 1440×1000 กับ Pixel 7; navigation, active state, cards, form และข้อความไม่ซ้อนหรือล้น viewport

### 2026-09-07 — PLAN-SETUP

- ทำแล้ว: ตรวจ baseline จาก source และจัดทำ roadmap, task cards, calculation contract และ runbook
- Application changes: ไม่มี
- งาน implementation T00–T15: ยังไม่เริ่ม; การจัดทำแผนไม่ถือว่าผ่าน CP0
- คำสั่งตรวจและผลล่าสุด: ดู PLAN-VERIFICATION ด้านล่าง
- Next task เมื่อได้รับคำสั่งพัฒนา: **T00** แล้ว **T01**
- ข้อจำกัดที่ทราบ: ไม่มี provider/route integration suite ใน baseline; ไม่มี live asset/gold implementation; v1 ไม่เก็บ historical live FX

### 2026-09-07 — PLAN-VERIFICATION

- Revision: baseline `bfcc6f6` + documentation-only working tree (`README.md` และเอกสารแผนใหม่ 4 ไฟล์); ไม่มี application/test changes
- `npm run lint`: PASS, exit 0
- `npm run typecheck`: PASS, exit 0
- `npm test`: PASS, 4 files / 26 unit+component tests, exit 0; ยังไม่มี provider/route integration tests จึงไม่ถือว่าตรวจ integration แล้ว
- `npm run test:e2e`: PASS, 10 desktop/mobile tests, exit 0; ใช้ mocked FX ไม่ได้ยืนยัน provider จริง
- `npm run build`: PASS, exit 0
- ตรวจ local Markdown links, code fences, task board/card T00–T15 และคำนวณ fixtures forward/reverse/risk ด้วย Python Decimal แยกจาก application: PASS
- Review: อ่าน README diff และตรวจเนื้อหาเอกสารใหม่เรื่อง scope, dependency, สูตร, checkpoint และ handoff; `git diff --check` ผ่าน
- Warning ที่พบ: E2E มีข้อความ `NO_COLOR` ถูกข้ามเพราะ `FORCE_COLOR`; ไม่ทำให้ tests ล้มเหลว
- ไม่มี interactive browser inspection ในรอบเอกสารนี้; งาน visual QA ของ R1 อยู่ใน T13
- ผลตรวจ baseline ไม่ใช่หลักฐานว่าฟีเจอร์ v2 implement แล้ว; T00–T15 และ CP0–CP5 ยังไม่ DONE

### Template สำหรับรอบถัดไป

```text
Date / task IDs / status:
Revision หรือ baseline commit + dirty files:
Scope ที่ได้รับมอบหมาย:
Changed files และเหตุผล:
Acceptance criteria ที่ผ่าน/ยังไม่ผ่าน:
Commands + exit status + evidence paths:
Manual/browser QA ที่ทำจริง:
Checkpoint ที่ผ่าน:
Known limitations / blockers:
Next task พร้อม dependency:
```
