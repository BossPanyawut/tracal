# TRACAL — Future cloud and membership backlog

สถานะ: เตรียมขอบเขตไว้สำหรับงานต่อ ยังไม่ได้ implement ตามคำเลือกของผู้ใช้ให้ทำฟีเจอร์ในเครื่องก่อน

## Gate ก่อนเริ่ม

- มีผล pilot จริงจาก `product-validation.md` และเหตุผลว่าการข้ามอุปกรณ์หรือบริการรายเดือนแก้ปัญหาที่เกิดซ้ำ
- เลือก provider สำหรับ identity, data storage และ billing หลังตรวจราคา เงื่อนไข และพื้นที่เก็บข้อมูล ณ วันที่เริ่มงาน
- ตกลง data retention, export, deletion, recovery และความรับผิดชอบด้านข้อมูลทางการเงิน
- ยังคงให้ผู้ใช้ export JSON/CSV และใช้ manual calculation เมื่อ cloud หรือ provider ล้มเหลว

## แผนงานที่ต้องแยก PR

1. ออกแบบ account lifecycle: สมัคร เข้าใช้ ออกจากระบบ ลบบัญชี และกู้คืนตามนโยบาย
2. ย้าย local data แบบ preview/confirm/idempotent พร้อมแก้ record ชนกันและ rollback
3. กำหนด tenant isolation, server authorization และ audit events โดยไม่ log ตัวเลขการเงินจริงเกินจำเป็น
4. ทำ sync conflict model สำหรับ draft, plans และ journal; ไม่ใช้ last-write-wins โดยไม่แจ้งเมื่อทั้งสองอุปกรณ์แก้รายการเดียวกัน
5. ทำ billing lifecycle: checkout, webhook verification/idempotency, trial, failed payment, cancellation, refund และ entitlement ที่ตรวจฝั่ง server
6. ทำ privacy/data controls: download, deletion, retention, support access และ incident recovery
7. เพิ่ม observability ที่ไม่เก็บ secrets/API keys และมี provider/timeouts/fallback เช่นเดียวกับ local calculator
8. หากเพิ่ม AI ให้ส่งเฉพาะข้อมูลที่ผู้ใช้เลือก ตรวจ output ด้วย schema และให้ calculation engine เป็นผู้ให้ตัวเลขสุดท้าย พร้อม cost/rate limits

## Acceptance ที่ห้ามลด

- ผู้ใช้คนหนึ่งอ่านหรือแก้ข้อมูลของอีกคนไม่ได้ใน route, storage query, export และ background job
- การ migrate, sync และ webhook ทำซ้ำได้โดยไม่สร้างข้อมูลหรือ charge ซ้ำ
- ยกเลิกสมาชิกแล้ว export และลบบัญชีได้ตามนโยบาย; entitlement ไม่พึ่ง state ฝั่ง client
- Service outage ไม่ทำให้ local/manual calculator ใช้ไม่ได้
- ไม่มี secret ใน browser bundle, URL, logs หรือ client error payload

ก่อนเลือก vendor ให้ browse เอกสารทางการล่าสุด เพราะ API, ราคา และข้อกำหนดเปลี่ยนได้ เอกสารนี้จงใจไม่ล็อก vendor หรือราคาไว้ล่วงหน้า
