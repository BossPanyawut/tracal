# Calculation Contract v2 — USD Spot → THB

สถานะ: implemented contract สำหรับ Local 02; ตรวจรับด้วย `tests/unit/v2.test.ts`
อ้างอิง: [Development plan](development-plan.md) · [Tasks](tasks.md)

## 1. ขอบเขตและหน่วย

- Long spot ซื้อครั้งเดียวและขายทั้งหมด; ราคา/ค่าธรรมเนียมเทรดฐาน USD
- เรต `buyUsdThb` และ `sellUsdThb` มีหน่วย THB ต่อ 1 USD และต้อง > 0
- `capitalThb` คือเงินออกทั้งหมด รวมค่าธรรมเนียมซื้อและค่าแปลงเงินขาเข้า
- `buyConversionCostThb`, `sellConversionCostThb` เป็นค่าใช้จ่ายเพิ่มเติมแบบ fixed THB, ค่าเริ่มต้น 0
- ถ้าใช้เรตแลกเงินจริงที่รวม spread แล้ว ไม่บวก spread ซ้ำเป็น conversion cost
- Trading fee เป็น fixed USD หรือ % ของ gross trade value เช่นเดียวกับ model เดิม ไม่รองรับหัก fee เป็นเหรียญ/BNB ใน R1
- ตลาดยังเป็น USD; ไม่เปลี่ยน label เป็น USDT แล้วใช้สูตร/เรต USD แทน
- ทุก numeric input เก็บ string จนเข้า `decimal.js`; ห้ามปัดเลขระหว่างคำนวณ

## 2. ตัวแปรและสูตร forward

```text
C = capitalThb
rb = buyUsdThb
rs = sellUsdThb
W = buyConversionCostThb
E = sellConversionCostThb
Pb = buyPriceUsd
Ps = sellPriceUsd
B = (C - W) / rb                    # เงิน USD รวมค่าธรรมเนียมซื้อ

กรณี buy fee เป็น percent fb (อัตราส่วน เช่น 0.1% = 0.001):
  grossBuyUsd = B / (1 + fb)
กรณี buy fee เป็น fixed Fb:
  grossBuyUsd = B - Fb

buyFeeUsd = B - grossBuyUsd
q = grossBuyUsd / Pb
grossSellUsd = q * Ps
sellFeeUsd = grossSellUsd * fs      # percent
           หรือ Fs                 # fixed
N = grossSellUsd - sellFeeUsd

netSellThb = N * rs - E
profitThb = netSellThb - C
roiThbPercent = profitThb / C * 100

tradeProfitUsd = N - B
roiUsdPercent = tradeProfitUsd / B * 100
```

USD trading P/L รวม trading fees แต่ไม่รวมค่าใช้จ่ายที่กรอกเป็น THB ส่วน THB net P/L รวมทั้งหมดตาม model จึงไม่ควรใช้ label เดียวกันแล้วทำเหมือนเป็นเพียงการแปลงสกุลเงินของตัวเลขเดียวกัน

### Attribution ที่รวมกลับได้พอดี

```text
priceEffectThb = q * (Ps - Pb) * rb
fxEffectThb = q * Ps * (rs - rb)
feesThb = buyFeeUsd * rb + sellFeeUsd * rs + W + E

profitThb = priceEffectThb + fxEffectThb - feesThb
```

นี่เป็น attribution convention ที่เลือกใช้: วัดผลราคาโดยใช้เรตซื้อ และวัดผล FX บน gross sale value พร้อมแปลง fee แต่ละขาด้วยเรตของขานั้น ไม่ใช่การแยกองค์ประกอบที่มีวิธีเดียว ต้องบอก convention ในรายละเอียดผลลัพธ์

## 3. Break-even และ target profit

THB เป็นเป้าหมายหลักของ R1; USD break-even แสดงแยก label

```text
T = targetProfitThb
requiredNetSellUsd = (C + T + E) / rs

requiredSellPriceUsd = requiredNetSellUsd / (q * (1 - fs))   # percent sell fee
                    หรือ (requiredNetSellUsd + Fs) / q     # fixed sell fee

breakEvenSellPriceThbBasisUsd = requiredSellPriceUsd เมื่อ T = 0

breakEvenSellPriceUsdBasisUsd = B / (q * (1 - fs))          # percent sell fee
                            หรือ (B + Fs) / q             # fixed sell fee
```

หาก target ต้องการราคาขาย < 0 ให้คืนผลแบบ unreachable พร้อมข้อความ ไม่ clamp เป็น 0 แล้วอ้างว่าได้กำไรตรงเป้า รองรับ target ติดลบที่ยัง reachable; target = 0 ต้องคำนวณ ไม่ถือเป็นช่องว่าง

## 4. Validation, precision และ compatibility

- Complete input: `C > 0`, `Pb > 0`, `Ps >= 0`, `rb > 0`, `rs > 0`, costs/fees >= 0, percentage fees < 100
- `C > W` และเงิน USD หลังหัก fixed buy fee ต้อง > 0; zero position แสดง validation/incomplete state ไม่แสดงราคาเป้าหมาย 0 อย่างชวนเข้าใจผิด
- Empty/partially typed input ไม่เป็น exception ที่ทำให้หน้าเสีย; ไม่ render NaN/Infinity
- รับกรณี net proceeds ติดลบเมื่อ fixed sell fee มากกว่ายอดขาย แล้วอธิบายว่าเป็นผลตามค่าธรรมเนียมที่กรอก
- กำหนด bounds ที่ Zod boundary: ตัวเลขแบบทศนิยมปกติ ไม่รับ exponent; สูงสุด 18 หลักหน้าจุดและ 12 หลักหลังจุดสำหรับ input ตัวเงิน/ราคา/จำนวน; target อนุญาตเครื่องหมายลบ
- ทบทวน precision 32 เดิมให้เพียงพอกับ bounds; ใช้ precision อย่างน้อย 64 สำหรับ engine v2 และอย่าแปลง intermediate เป็น JS number
- ผลลัพธ์และ snapshot ที่ persist เป็น decimal strings; format THB/USD เป็น 2 ตำแหน่งตอนแสดงเท่านั้น ราคาต่อหน่วย/quantity แสดงความละเอียดพอ ไม่ทำให้ค่าบวกเล็ก ๆ ดูเป็นศูนย์โดยไม่มีคำอธิบาย
- ขอบเขตยอมรับ fixture: เงินแสดงผลตรงถึง 0.01; engine reverse/invariant tests ต่างไม่เกิน 0.00000001 THB สำหรับ fixture ในเอกสารนี้ ใช้ค่าที่ไม่ปัดระหว่างทาง
- เมื่อ `rb = rs`, `W = E = 0` ผลเดิมต้องเท่าเดิมสำหรับ valid nonzero input ยกเว้น label ที่ทำให้ฐาน ROI/break-even ชัดขึ้น
- แยก contract `inputSchemaVersion` และ `calculationVersion`; ห้ามนำ historical snapshot มาคำนวณด้วย model ใหม่เงียบ ๆ

## 5. FX reference กับเรตที่ใช้จริง

- มี reference quote state กลางหนึ่งชุดให้ ticker และ calculator ใช้ร่วมกัน
- Buy/sell rate แต่ละขามีค่าและ provenance ของตัวเอง: manual หรือ copied-reference พร้อม metadata ที่มีจริง
- เลือก manual ได้ทันทีแม้กำลัง fetch; retry/refresh ไม่เขียนทับ manual หรือ applied snapshot
- แผนใหม่ที่ยังว่างอาจรับ quote แรกเป็นเรตทั้งสองขา โดยระบุว่าใช้ reference เดียวจำลองทั้งสองฝั่ง ไม่ใช่เรตซื้อย้อนหลัง
- ใช้ reference ใหม่ผ่าน action ที่ระบุขาซื้อ/ขาขาย/ทั้งคู่; การกดใช้ quote ต้องอัปเดตค่าและ metadata พร้อมกัน
- แสดง source, referenceDate, fetchedAt และ stale state; ไม่เรียก fetchedAt ว่าเวลาตลาดอัปเดต หาก provider ไม่ได้ให้เวลาตลาด
- ค่า manual ไม่มี provider timestamp ให้แสดงว่าเป็นผู้ใช้กรอก ไม่สร้าง source/timestamp ตลาดปลอม

## 6. Migration จาก localStorage v1

เดิมเก็บ `manualUsdThb` แต่ไม่เก็บ live quote ที่ใช้คำนวณ จึงกู้เรตย้อนหลังของ live mode ไม่ได้

1. เก็บ v1 เดิมไว้จนเขียนและอ่าน v2 สำเร็จ; migration ต้องทำซ้ำได้โดยไม่เพิ่มข้อมูลซ้ำ
2. ย้ายเงินทุน ราคา fee และ target; conversion costs เริ่ม 0
3. ค่า manual เดิมที่ valid ย้ายเป็น draft rate ทั้งสองขา พร้อม provenance `legacy-manual-unverified` และข้อความให้ตรวจเรต ไม่อ้างว่าเป็นเรตที่ใช้อยู่เดิม เพราะ live quote อาจเคยมี priority
4. ถ้า manual เดิมว่าง/invalid ให้เรตทั้งสองว่างพร้อมแจ้งให้เลือก reference หรือกรอกใหม่ ห้ามแทนด้วยราคาตลาดปัจจุบันโดยไม่แจ้ง
5. เก็บเฉพาะ input ที่ตรวจสอบได้ ไม่สร้าง historical output snapshot จากข้อมูลที่หายไป

## 7. Fixtures ตรวจรับ (ตัวเลขสมมติ ไม่ใช่ราคา/FX ปัจจุบัน)

| ID | Input หลัก | ผลที่ต้องได้ |
| --- | --- | --- |
| A: Same FX | C=34,000; Pb=50,000; Ps=60,000; rb=rs=34; fees/costs=0 | q=0.02; USD P/L=200; THB P/L=6,800; ROI ทั้งสอง=20%; THB break-even=50,000 |
| B: USD บวก/THB ลบ | C=35,000; Pb=1,000; Ps=1,100; rb=35; rs=31; fees/costs=0 | q=1; USD P/L=100; net THB=34,100; THB P/L=-900; price effect=3,500; FX effect=-4,400; THB ROI≈-2.57142857% |
| C: Percent fees | C=3,300; Pb=1; Ps=2; rb=rs=33; buy/sell fee=0.1%; W=E=0 | q=100/1.001; USD P/L≈99.6003996004; THB P/L≈3,286.8131868132 |
| D: Fixed costs | C=35,350; Pb=1,000; Ps=1,100; rb=35; rs=31; buy fee=$5; sell fee=$10; W=175; E=100 | B=1,005; q=1; N=1,090; net THB=33,690; THB P/L=-1,660; USD P/L=85; fees THB=760 |
| E: Reverse target | Input B; T=0 และ T=3,100 | required Ps=35,000/31 และ 38,100/31 ตามลำดับ; forward ได้ THB P/L=0 และ 3,100 |
| F: Invalid/unreachable | rb=0; C<=W; fee%=100; หรือ input B และ T=-36,000 | validation error หรือ unreachable ที่ระบุเหตุผล; ไม่ crash/NaN/ราคาเป้าหมายปลอม |

เพิ่ม tests สำหรับ fixed/percent combinations, fractional prices, large valid inputs, blank target, target zero, negative reachable target และราคา 0 ใน implementation ไม่ใช้เพียง fixture happy path

## 8. Risk sizing contract สำหรับ T11

วงเงินขาดทุนเป็นประมาณการเมื่อขายได้ที่ stop ที่กำหนด ใช้ full round-trip costs ไม่ใช่คำรับประกัน max loss

แทน fee แต่ละขาเป็น `(rate, fixed)` โดยใช้ได้ทีละ mode: percent → fixed=0, fixed → rate=0

```text
Pstop = stopSellPriceUsd
R = riskBudgetThb
M = maxCapitalThb
fb, Fb = buy fee rate และ fixed USD
fs, Fs = sell fee rate และ fixed USD

a = Pb * (1 + fb) * rb - Pstop * (1 - fs) * rs
b = Fb * rb + Fs * rs + W + E
lossAtStop(q) = a * q + b

qRisk = (R - b) / a
qCapital = (M - W - Fb * rb) / (Pb * (1 + fb) * rb)
q = min(qRisk, qCapital)
requiredCapitalThb = (q * Pb * (1 + fb) + Fb) * rb + W
```

รองรับ `0 <= Pstop < Pb`, `R > b`, `a > 0`, `qCapital > 0` เท่านั้นใน R1 กรณี FX ทำให้ `a <= 0` ให้แจ้งว่า model นี้หาขนาดจาก downside ดังกล่าวไม่ได้ ไม่แสดง infinite quantity หากมี quantity step ให้ปัดลงแล้วคำนวณตรวจวงเงินทั้งสองอีกครั้ง

Fixture risk: Pb=100, Pstop=90, rb=rs=35, fees/costs=0, R=700, M=10,000 → q=2, capital=7,000, expected loss=700; เมื่อ M=3,500 → q=1, expected loss=350

การนำขนาดที่คำนวณได้ไปใช้กับ calculator ต้องเป็น action ของผู้ใช้ และค่าตอบแทนเทียบความเสี่ยงใช้ net THB profit เป้าหมายหารด้วย expected THB loss เฉพาะกรณีตัวหาร > 0
