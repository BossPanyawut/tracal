# TRACAL — AI Agent Execution Runbook

ใช้ร่วมกับ [AGENTS.md](../AGENTS.md), [development plan](development-plan.md), [tasks](tasks.md) และ [calculation contract](calculation-contract-v2.md)

## 1. เริ่มแต่ละรอบ

1. อ่านคำสั่งผู้ใช้ล่าสุดและ scope ที่มอบหมาย; ถ้าให้ทำเพียงแผน ห้ามเปลี่ยนเป็น implementation เอง
2. อ่าน AGENTS.md และ execution log ล่าสุด แล้วตรวจ `git status --short` กับ diff ที่มีอยู่ ห้ามทับงานผู้ใช้
3. เลือก task ID ที่ dependency เป็น DONE และอยู่ใน scope; ค่าเริ่มต้นคือทำเรียงลำดับ ไม่ต้องถามอนุมัติทุก task
4. อ่าน source/tests ที่ task แตะจริง; ตรวจว่า baseline docs ยังตรงกับโค้ด
5. ก่อนเขียนโค้ด Next.js ให้อ่าน guide ที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ตาม AGENTS.md ใช้ `rg --files` ค้น server/client components, route handlers, fetching/caching และ testing ตามงาน ไม่ใช้ความจำจาก Next.js รุ่นอื่น
6. บันทึก task เป็น IN_PROGRESS พร้อมเกณฑ์ตรวจรับและไฟล์ที่คาดว่าจะเปลี่ยน

## 2. ทำงานหนึ่ง task ให้จบ

- เริ่มจาก contract/acceptance criteria แล้วแก้เฉพาะส่วนที่จำเป็น ไม่ refactor ทั้งแอปเพื่อรองรับงานเล็ก
- สูตรทั้งหมดอยู่ใน `src/lib/calculation`; UI ไม่คำนวณกำไร/FX attribution เอง
- ใช้ tests ที่ตรวจ behavior/invariant/failure mode จริง ไม่สร้าง tests ที่เพียงตรวจว่ามีชื่อ field ตรงกับ implementation
- ห้าม hardcode market/FX เป็นค่าใช้งานจริง; fixture สมมติต้องอยู่ใน tests/docs หรือ example ที่มี label
- Manual price/FX เป็นเส้นทางใช้งานจริง ไม่รอ provider จึงจะเริ่มกรอกได้
- External payload ผ่าน validation และ normalization; external calls มี timeout และไม่ส่ง key เข้า client/log
- Migration ต้องรักษาข้อมูลเดิม ห้ามล้าง localStorage เพื่อทำให้ tests ผ่าน
- เมื่อเสร็จ task ให้ review diff, รันทดสอบที่เกี่ยวข้อง และอัปเดต task/evidence ก่อนทำต่อ
- Checkpoint ที่ผ่านให้บันทึกแล้วเดินหน้าภายใน scope เดิม ไม่เพิ่ม approval gate จากเอกสารคู่มือเก่าที่บอกให้หยุดทุก slice

## 3. การทดสอบและ quality gates

ระหว่างแก้ใช้ focused tests ตาม task ได้ ก่อนส่งมอบ implementation แต่ละรอบรันทั้งหมดตาม AGENTS.md:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
git diff --check
git diff --stat
git status --short
```

- `npm test` ต้องครอบคลุม unit/component และ integration เมื่อเพิ่มใน T02; หากยังไม่มี integration ให้ระบุว่าไม่มี ไม่รายงานว่าผ่านแล้ว
- อ่าน diff จริงนอกเหนือจาก `--stat`; รวมไฟล์ untracked ที่ยังไม่ปรากฏใน `git diff`
- E2E ปัจจุบันสร้าง dev server ของตัวเองที่ port 3107; อย่ารัน build ที่เขียน `.next` ทับพร้อม E2E/dev server
- ถ้า port ถูกใช้ ห้าม kill process ที่ไม่รู้ว่าเป็นของงานนี้ ให้ตรวจและใช้ test target ที่ควบคุมได้
- lint/typecheck/Vitest ทำพร้อมกันได้ถ้าไม่เขียน generated artifacts ชนกัน; wait/check exit status ให้ครบ
- เมื่อแก้ไฟล์หลังตรวจแล้ว ให้รัน checks ที่ผลอาจเปลี่ยน; ระบุ final revision ที่ผ่าน ไม่ใช้ผลของ revision เก่าแทน
- หาก tool/environment ขาด ให้แก้ส่วนที่ทำได้และบันทึกสิ่งที่ตรวจไม่ได้ ห้ามอ้างว่า suite ผ่านจากการอ่านไฟล์
- Browser QA ให้ใช้ browser skill ที่มีใน session เมื่อควบคุม browser โดยตรง บันทึก viewport/กรณีทดสอบ/หลักฐานที่ทำจริง

## 4. Checkpoint review

ก่อน tick CP ใด ให้ตรวจทุก checkbox ใน development-plan.md และแนบหลักฐานใน execution log:

| ประเภท | หลักฐานขั้นต่ำ |
| --- | --- |
| Calculation correctness | test names/fixtures, reverse test และ invariant ที่เกี่ยวข้อง |
| Provider reliability | mocked integration paths และ command result |
| Migration/storage | legacy/corrupt/quota/import tests และผล restore |
| UX | component/E2E และ browser inspection สำหรับ layout/interaction ที่เปลี่ยน |
| Release | full quality gates, reviewed diff, docs และ known limitations |
| Product demand | จำนวนผู้ทดลอง/ตัวหาร/ช่วงเวลา/พฤติกรรมจริงและผลข้อเสนอ |

ถ้า acceptance ไม่ผ่าน ให้ task คง IN_PROGRESS หรือ BLOCKED ตามสาเหตุ ไม่ tick DONE เพื่อให้จบเฟสเร็วขึ้น

## 5. Scope และการตัดสินใจ

ตัดสินใจเองได้เมื่อเป็นรายละเอียด implementation ที่ reversible และสอดคล้องกับ contract เช่นชื่อ component, โครงสร้าง pure helper และชุดทดสอบที่เหมาะสม

หาก contract ขัดกัน ให้หาหลักฐานจาก source/คำสั่งก่อน ถ้าจำเป็นต้องเปลี่ยนความหมายทางการเงินให้แก้ contract + fixtures + caller/tests ที่ได้รับผลพร้อมบันทึกเหตุผล อย่าเลือกสูตรเพื่อทำให้ snapshot เก่าผ่านโดยไม่มีเหตุผล

งาน cloud/auth/billing ไม่อยู่ใน R1; งานติดต่อภายนอก/deploy/รับเงินทำได้เมื่อคำสั่งผู้ใช้ครอบคลุมแล้ว หากยังไม่ครอบคลุม ให้ทำ artifact ที่ตรวจได้ก่อนแล้วแจ้งสิ่งที่ต้องตัดสินใจ ไม่สร้างข้อจำกัดหรือถามซ้ำในงานที่ได้รับอนุญาตอยู่แล้ว

ถ้าติดข้อมูลภายนอก เช่นผู้เข้าร่วม pilot ให้บันทึก blocker เฉพาะ task นั้น แล้วทำงานอิสระที่อยู่ใน scope ต่อได้ ห้ามสร้างข้อมูลผลทดลองขึ้นเอง

## 6. Handoff ที่ทำให้ agent รอบถัดไปต่อได้

ทุกครั้งที่จบรอบให้เพิ่ม execution log ใน tasks.md และปรับตารางสถานะ/checkbox ให้ตรงกัน:

1. ทำ task ไหนเสร็จและเปลี่ยน behavior อะไร
2. ไฟล์ที่แก้และ contract decision ที่สำคัญ
3. คำสั่งตรวจ ผลจริง และข้อจำกัดที่ยังมี
4. Checkpoint ที่ผ่าน/ยังไม่ผ่าน
5. Next task ID และเหตุผล dependency

อย่าใส่ API keys, `.env` contents หรือข้อมูลการเงินจริงของผู้ใช้ในเอกสาร/fixtures ข้อมูลตัวอย่างเป็นสมมติหรือได้รับอนุญาตและลบข้อมูลระบุตัวบุคคลแล้ว

## 7. Prompt พร้อมใช้

### เริ่มพัฒนาตามแผนถึง CP2

```text
พัฒนา TRACAL ตาม docs/development-plan.md, docs/tasks.md,
docs/calculation-contract-v2.md และ docs/agent-runbook.md
อ่าน AGENTS.md ก่อน เริ่มจาก task แรกที่ยังไม่ DONE และ dependency พร้อม
ทำ T00–T07 จนผ่าน CP2 โดยรักษางานเดิมใน working tree
ทำต่อภายใน scope นี้ได้โดยไม่ต้องถามยืนยันทุก task
ห้ามเพิ่ม database/auth/billing หรือ deploy ในรอบนี้
อัปเดต task status และ execution log ด้วยผลตรวจจริง
ก่อนส่งมอบรัน quality gates ตาม AGENTS.md และ review diff
```

### ต่อจากงานที่ค้าง

```text
อ่าน execution log ล่าสุดใน docs/tasks.md และตรวจ working tree
ทำงานต่อใน scope [ระบุ task IDs หรือ checkpoint] ตาม dependency
อย่าทำ task ที่ DONE ซ้ำ เว้นแต่มี regression หรือ acceptance ที่ยังขาด
บันทึกการตัดสินใจ ผลตรวจ ข้อจำกัด และ next task ในเอกสารเดิม
```

### ตรวจรับโดยยังไม่แก้โค้ด

```text
ตรวจรับ checkpoint [CP ID] ของ TRACAL แบบ read-only
เทียบ checklist, task cards, calculation contract กับ source/tests จริง
รายงานข้อพบตามความสำคัญพร้อมไฟล์/ตำแหน่งและวิธีพิสูจน์
แยก implementation bug, missing test และ documentation drift
ห้ามแก้ไฟล์หรือถือว่า gate ผ่านหากหลักฐานยังไม่ครบ
```
