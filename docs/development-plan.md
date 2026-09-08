# TRACAL — Development Plan สำหรับ AI Agent

วันที่จัดทำ: 2026-09-07 · อัปเดตสถานะ: 2026-09-08
สถานะ: Local 02 พัฒนาและผ่าน CP0–CP4 แล้ว; CP5 รอข้อมูลผู้ใช้จริง; cloud/สมาชิกอยู่ในรอบถัดไป

## 1. เป้าหมายและวิธีใช้เอกสาร

พัฒนา TRACAL ให้ผู้ใช้วางแผนซื้อขายสินทรัพย์ที่มีราคาฐาน USD และเห็นเงินปลายทางเป็น THB โดยแยกผลของราคา ค่าเงิน และค่าธรรมเนียม พร้อมบันทึกแผนกลับมาใช้ซ้ำได้

อ่านตามลำดับ:

1. [AGENTS.md](../AGENTS.md): ข้อกำหนดของ repository
2. เอกสารนี้: ขอบเขต เฟส และ checkpoint
3. [Calculation contract v2](calculation-contract-v2.md): สูตรและตัวอย่างตรวจรับ
4. [Task backlog](tasks.md): งานย่อย dependency และสถานะจริง
5. [Agent runbook](agent-runbook.md): วิธีลงมือ ตรวจงาน และส่งต่อ context

แผนนี้เป็นข้อเสนอการพัฒนาที่ผู้ใช้ขอจัดทำ ไม่ใช่คำสั่งให้เริ่มแก้ application, deploy, ติดต่อผู้ใช้ หรือเรียกเก็บเงินทันที การนำแผนไปปฏิบัติให้ทำภายในขอบเขตที่ผู้ใช้มอบหมายในรอบนั้น

## 2. Baseline ก่อนเริ่ม implementation

| มีอยู่แล้ว | ข้อจำกัดที่ต้องแก้/ยังไม่มี |
| --- | --- |
| เงินทุน THB, ราคาซื้อ/ขาย USD, fixed/percent fees | ใช้ FX ค่าเดียวทั้งซื้อและขาย |
| กำไร, ROI, break-even, target profit, sensitivity | ยังไม่แยก ROI และ break-even ตามสกุลเงิน |
| Coinbase → Frankfurter/BOT → last-known-good | UI ยังไม่แสดง source และ reference date ครบ |
| Manual FX เมื่อดึงข้อมูลไม่ได้ | เลือก manual ไม่ได้เมื่อมี quote รวมถึง stale quote |
| เก็บ input ล่าสุดใน localStorage v1 | ยังไม่มีรายการแผนหรือ migration แบบ versioned |
| Vitest unit/component และ Playwright desktop/mobile | ยังไม่มี provider/route integration suite แยก |
| `/api/fx` | ยังไม่มี market route, asset selector หรือ gold unit conversion |

ตารางนี้เก็บสภาพเริ่มต้นเพื่อใช้เทียบการเปลี่ยนแปลง ไม่ใช่สถานะปัจจุบัน สถานะจริงและหลักฐานล่าสุดอยู่ใน [tasks.md](tasks.md)

## 3. ขอบเขตรุ่นแรก: R1

ผู้ใช้เป้าหมายเริ่มต้น: ผู้ใช้ไทยที่ต้องการจำลองการซื้อขาย Spot แบบซื้อก่อนขาย ด้วยราคา USD ไม่ใช้ leverage

R1 ต้องทำได้:

- คำนวณโดยใช้เรตซื้อและเรตขายแยกกัน พร้อมเลือก manual ได้ทุกสถานะของ provider
- แยกกำไร USD จากการซื้อขาย และกำไรสุทธิ THB ตามเงินเข้าออก พร้อมชื่อผลลัพธ์ไม่กำกวม
- รวมค่าธรรมเนียมซื้อ/ขาย USD และค่าใช้จ่ายแปลงเงินเพิ่มเติมแบบ fixed THB
- แสดง source, reference date, fetched time และ stale state ตามข้อมูลที่มีจริง
- คำนวณกำไรเป้าหมาย จุดคุ้มทุน และตารางสถานการณ์ด้วยสูตรเดียวกัน
- บันทึกหลายแผนใน browser, เปิดกลับ, ทำสำเนา, export/import JSON และรักษาข้อมูลเดิม
- วางแผนขนาดการซื้อจากราคาตัดขาดทุนและวงเงินขาดทุน โดยแสดงสมมติฐานชัดเจน
- ใช้งานบน mobile และใช้ manual inputs ได้แม้ provider ล้มเหลว

การคำนวณใน R1 เป็นประมาณการก่อนภาษีตามข้อมูลที่กรอก ไม่ใช่บัญชีกำไรที่เกิดขึ้นจริง หากยังไม่ได้ขายหรือแลกกลับจริง

## 4. ขอบเขต Local 02 และรอบถัดไป

| รายการ | สถานะ/ขอบเขต |
| --- | --- |
| USDT/THB | ทำแล้วโดยแยกสกุลและเรตจาก USD; ผู้ใช้กรอกเรต USDT เอง |
| ซื้อหลายไม้/ขายบางส่วน | ทำแล้วด้วย weighted-average journal และแยก realized/unrealized |
| CSV จาก exchange | ทำแล้วสำหรับ TRACAL backup และ Binance Spot profile ที่กำหนดชัดเจน |
| Gold | ทำแล้วสำหรับ XAU spot หน่วย troy ounce/gram; ไม่อ้างเป็นทองไทยหรือ CFD |
| Live asset price | ทำแล้วสำหรับ BTC/ETH ผ่าน Coinbase และ XAU ผ่าน GoldAPI พร้อม manual fallback |
| Branded widget | ทำแล้วด้วย `/widget` และ `/embed` โดยข้อมูลคงอยู่ใน iframe session |
| Cloud sync, database, auth, billing | รอบถัดไปตามคำสั่งผู้ใช้และข้อกำหนด MVP; เตรียม backlog ใน [future-cloud.md](future-cloud.md) |
| AI ช่วยกรอก/อธิบาย | รอบถัดไป; output ตัวเลขต้องมาจาก calculation engine |
| Order execution, signals, tax engine, leverage | ไม่อยู่ในแผน implementation นี้ |

## 5. Roadmap และ checkpoint

ขนาดงาน S/M/L คือขนาดสัมพัทธ์สำหรับแบ่ง review ไม่ใช่คำสัญญาเวลา S = เปลี่ยน boundary เดียว, M = สองถึงสาม boundary, L = ควรแยก subtask ก่อนลงมือ

| เฟส | ผลลัพธ์ที่ใช้งานได้ | งาน | Checkpoint |
| --- | --- | --- | --- |
| P0 — Baseline/contract | เอกสารตรงโค้ดและสูตร R1 ตกลงเป็นแบบเดียว | T00–T01 | CP0 |
| P1 — FX reliability | manual FX ใช้ได้เสมอและ quote ที่เห็นตรงกับที่ใช้ | T02–T03 | CP1 |
| P2 — Net THB | สูตรสองเรตและ UI ครบทั้งเป้าหมาย/จุดคุ้มทุน | T04–T07 | CP2 |
| P3 — Saved plans | บันทึกหลายแผนพร้อมข้อมูลอ้างอิงและสำรองไฟล์ | T08–T10 | CP3 |
| P4 — Risk plan/release | คำนวณวงเงินซื้อจาก downside และตรวจ R1 | T11–T13 | CP4 |
| P5 — Product validation | ชุดทดลองพร้อม; รอผู้เข้าร่วมและข้อมูลจริง | T14–T15 | CP5 รอข้อมูล |
| Local 02 extension | หลายไม้, USDT, CSV, widget และทอง/live quote | F01–F05 | DONE |
| Future cloud | สมาชิก, sync, billing และ AI | F06 | DEFERRED |

ลำดับเริ่มต้นที่แนะนำ: `T00 → T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14 → T15`

Dependency รายงานอยู่ใน tasks.md สามารถทำงานที่ไม่ติด dependency ก่อนตามความเหมาะสม แต่ไม่ต้องเปิดหลาย agent หรือแก้ไฟล์ร่วมกันเพื่อให้ตรง roadmap นี้

### CP0 — พร้อมเขียนฟีเจอร์

- [x] T00–T01 เป็น DONE พร้อมหลักฐาน
- [x] เอกสารแยกสถานะ implemented/planned และ fixture ไม่อ้างอิงราคาตลาดปัจจุบัน
- [x] สูตร fee, FX attribution, rounding, zero position และ unreachable target ชัดเจน
- [x] มีผล baseline checks และระบุข้อจำกัด test coverage ตามจริง

### CP1 — FX เชื่อถือและควบคุมได้

- [x] T02–T03 เป็น DONE
- [x] primary/fallback/stale/unavailable/malformed payload ผ่าน mocked integration tests
- [x] manual inputs ใช้ได้ระหว่าง loading, error และมี quote
- [x] การ์ด quote และ calculator ใช้ข้อมูลจาก state เดียวกัน
- [x] refresh reference ไม่เปลี่ยนเรตที่ใช้ในแผนโดยเงียบ ๆ

### CP2 — ผลลัพธ์ทางการเงินสอดคล้องกัน

- [x] T04–T07 เป็น DONE
- [x] Fixture A–F ใน calculation contract ผ่าน และย้อนราคาเป้าหมายกลับเข้าสูตรแล้วได้ผลตามเป้า
- [x] กรณีกำไร USD แต่ขาดทุน THB แสดงเครื่องหมายและ ROI ถูกต้อง
- [x] ตาราง sensitivity ใช้ engine เดียวกับ summary
- [x] input v1 ย้ายเป็น v2 ได้โดยไม่สูญหาย และไม่แต่งค่า FX ที่ไม่เคยบันทึก
- [x] lint, typecheck, unit/integration/component, E2E และ build ผ่านบน revision ที่ตรวจ

### CP3 — กลับมาใช้แผนเดิมได้

- [x] T08–T10 เป็น DONE
- [x] save/open/duplicate/delete/export/import ใช้งานได้บน desktop/mobile
- [x] เปิดแผนเดิมแล้วตัวเลขและเรตไม่เปลี่ยนตาม reference ใหม่
- [x] invalid/oversized/newer-version import ไม่ทำลายแผนเดิม
- [x] storage unavailable/full แจ้งว่าบันทึกไม่ได้และ calculator ยังทำงาน

### CP4 — R1 พร้อมส่งให้ทดลอง

- [x] T11–T13 เป็น DONE และ quality gates ทั้งหมดผ่าน
- [x] ตรวจ Chromium desktop และ Pixel 7 ผ่าน Playwright ครอบคลุม keyboard, mobile, error/loading, long numbers และ source/date labels
- [x] expected loss และ actual execution แยกความหมายชัดเจน
- [x] เอกสาร setup/limitations/release/rollback ตรง implementation
- [x] ไม่มี database/auth/billing หรือ external side effect หลุด scope

### CP5 — มีข้อมูลตัดสินใจลงทุนต่อ

- [x] ระบุชัดว่ายังไม่มีผู้ทดลองหรือข้อมูลจริง และไม่สร้างผลการทดลองขึ้นเอง
- [ ] สรุปผู้ทดลองที่คำนวณสำเร็จ กลับมาใช้งาน และขอ/จ่ายเพื่อฟีเจอร์ใด
- [ ] เปรียบเทียบปัญหาที่พบกับเวลาแก้และต้นทุนบริการ
- [ ] เลือกเพียงหนึ่งแนวทาง R2 พร้อมเหตุผล หรือปรับ R1 ก่อน

Checkpoint คือประตูตรวจคุณภาพ ไม่ใช่คำสั่งให้ถามขออนุญาตทุกเฟส เมื่อ scope ได้รับมอบหมายแล้วและ gate ผ่าน ให้ agent ทำงานที่อนุญาตต่อได้

## 6. การทดลองเชิงธุรกิจ

หลัง R1 ผ่าน CP4 ให้เริ่มกลุ่มเล็ก 10–15 คน เป้าทดลองเบื้องต้นคือมีผู้ใช้กลับมาใน 7 วันอย่างน้อย 5 คน และมีลูกค้ายอมจ่ายทดลอง 3 ราย หรือโครงการ widget ที่จ่ายจริง 1 ราย ตัวเลขนี้เป็นสมมติฐานสำหรับกลุ่มทดลอง ไม่ใช่ benchmark หรือการรับประกันยอดขาย

นิยามที่ต้องใช้ในรายงาน:

- Activation: ผู้ทดลองสร้างผลลัพธ์ที่ valid ของกรณีตนเองได้อย่างน้อยหนึ่งครั้ง
- Return within 7 days: ผู้ทดลองกลับมาคำนวณหรือเปิดแผนอีกวันหนึ่งภายใน 7 วัน; รายงานเฉพาะคนที่ติดตามครบช่วง
- Willingness to pay: แยกคำตอบสนใจ, ยอมรับข้อเสนอ, และจ่ายเงินจริง ห้ามนับรวมกัน
- เก็บจำนวนผู้ทดลองจริงและตัวหารทุก metric; ข้อมูลกลุ่มเล็กยังสรุปแทนตลาดทั้งหมดไม่ได้

ระยะแรกใช้บันทึกผลสัมภาษณ์แบบไม่ระบุตัวบุคคลได้ ไม่จำเป็นต้องเพิ่ม analytics backend ห้ามส่งยอดเงินหรือข้อมูลแผนออกนอกเครื่องโดยอัตโนมัติ

ราคา 149–249 บาท/เดือนสำหรับ Pro และ 3,000–10,000 บาทสำหรับงาน widget เป็นเพียงตัวเลือกทดสอบจากแนวคิดก่อนหน้า ยังไม่ใช่ราคาขายที่ยืนยันแล้ว เตรียมข้อเสนอได้ แต่การติดต่อบุคคลภายนอกหรือรับเงินต้องอยู่ในคำสั่งที่ผู้ใช้อนุญาต

## 7. ความเสี่ยงและแนวทางรับมือ

| ความเสี่ยง | แนวทางในแผน |
| --- | --- |
| สูตรต่างกันระหว่างหน้า/target/sensitivity | pure engine + contract fixtures + reverse/invariant tests |
| FX ปัจจุบันเขียนทับประวัติ | reference แยกจาก applied snapshot; migration ห้ามสมมติประวัติ |
| Storage schema ใหม่ทำข้อมูลเก่าหาย | versioned migration, backup, atomic import และ failure tests |
| ผู้ใช้ไม่กลับมา | ทดลอง saved plans ก่อนทำ cloud/billing |
| งานขยายไป USDT/ทองโดยไม่กำหนดหน่วย | แยก conditional backlog และ contract ก่อน implementation |
| Provider ใช้ไม่ได้บน serverless instance ใหม่ | manual mode เป็นทางหลักสำรอง; last-known-good เป็น best-effort |
| เทสต์ผ่านแต่ยังใช้ผิดความหมาย | acceptance fixtures + browser QA + ตรวจถ้อยคำ USD/THB/ประมาณการ |

## 8. Definition of Done

งานเป็น DONE เมื่อ acceptance criteria ผ่าน, มีหลักฐานการตรวจที่ผูกกับ revision หรือ working tree, diff อยู่ในขอบเขต, เอกสารที่เกี่ยวข้องอัปเดต และ tasks.md มี handoff ถ้ามีข้อจำกัดต้องบันทึก ห้ามเปลี่ยนเป็น DONE เพียงเพราะเขียนโค้ดเสร็จ

การส่งมอบ implementation แต่ละรอบต้องทำ quality gates ตาม AGENTS.md; ถ้ายังรันบางรายการไม่ได้ ให้รายงานเป็นข้อจำกัด ไม่เรียกว่า gate ผ่าน
