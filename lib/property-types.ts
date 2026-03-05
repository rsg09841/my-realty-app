export interface RentIncomeItem {
  id: string
  roomType: string // 1R, 1K, 1DK, 1LDK, etc.
  units: string // 戸数
  rentPerUnit: string // 1戸当たり賃料（円）
}

export const ROOM_TYPES = [
  '1R',
  '1K',
  '1DK',
  '1LDK',
  '2K',
  '2DK',
  '2LDK',
  '3K',
  '3DK',
  '3LDK',
  '4K',
  '4DK',
  '4LDK',
  '店舗',
  '事務所',
  '駐車場',
  'その他',
] as const

export function createEmptyRentIncomeItem(): RentIncomeItem {
  return {
    id: crypto.randomUUID(),
    roomType: '',
    units: '',
    rentPerUnit: '',
  }
}

/** Calculate rent total for a single item (戸数 × 1戸当たり賃料) */
export function calcRentItemTotal(item: RentIncomeItem): number {
  const units = parseInt(item.units, 10)
  const rentPerUnit = parseRentYenToMan(item.rentPerUnit)
  if (isNaN(units) || units <= 0 || rentPerUnit === null) return 0
  return units * rentPerUnit
}

/** Calculate total rent income from all items (displayed in 円) */
export function calcTotalRentIncome(items: RentIncomeItem[]): string {
  const totalMan = items.reduce((sum, item) => sum + calcRentItemTotal(item), 0)
  if (totalMan === 0) return ''
  return formatYenFromMan(totalMan)
}

/** Format a number in 万円 to a display string in 円 */
export function formatYenFromMan(value: number): string {
  const yen = Math.round(value * 10000)
  return `${yen.toLocaleString('ja-JP')}円`
}

/** Calculate full occupancy yield (年間家賃収入 ÷ 物件価格) as percentage string */
export function calcFullOccupancyYield(property: Property): string {
  const annualRentMan = getTotalRentIncomeNum(property.rentIncomeItems)
  const priceMan = parseYenToMan(property.propertyPrice)
  if (!priceMan || annualRentMan === 0) return ''
  const ratio = (annualRentMan / priceMan) * 100
  const rounded = Math.round(ratio * 10) / 10
  return `${rounded.toLocaleString('ja-JP', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export interface Property {
  id: string
  name: string
  propertyPrice: string
  repairCost: string
  otherCost: string
  // 諸経費
  registrationFees: string // 所有権移転登記・抵当権設定・司法書士報酬等
  brokerageFee: string
  stampDuty: string
  fireInsurance: string
  propertyTaxSettlement: string
  bankFee: string
  acquisitionTax: string
  // 資金計画
  loanAmount: string // 借入金
  // 家賃収入内訳
  rentIncomeItems: RentIncomeItem[]
  // 返済計画
  repaymentLoanAmount: string // 融資金額
  interestRate: string // 金利
  loanTerm: string // 融資年数
  bankName: string // 金融機関名
  // 収支計画
  propertyTax: string // 固定資産税
  managementFee: string // 管理料
  cleaningUtilities: string // 清掃・水道光熱
  // 事業内容
  address: string
  useDistrict: string
  siteArea: string
  buildingCoverage: string
  floorAreaRatio: string
  structureScale: string
  buildAge: string
  layoutRooms: string
  totalFloorArea: string
  remarks: string
}

export const EXPENSE_KEYS: (keyof Property)[] = [
  'registrationFees',
  'brokerageFee',
  'stampDuty',
  'fireInsurance',
  'propertyTaxSettlement',
  'bankFee',
  'acquisitionTax',
]

export type ComputedKey = 'totalProjectCost' | 'totalExpenses' | 'grandTotalProjectCost' | 'grandTotalExpenses' | 'grandTotal' | 'fundingTotal' | 'ownFunds'

export const PROPERTY_FIELDS: { key: keyof Property | ComputedKey; label: string; category: string; computed?: boolean }[] = [
  { key: 'propertyPrice', label: '物件価格', category: '事業費' },
  { key: 'repairCost', label: '修繕費', category: '事業費' },
  { key: 'otherCost', label: 'その他', category: '事業費' },
  { key: 'totalProjectCost', label: '事業費合計', category: '事業費', computed: true },
  { key: 'registrationFees', label: '所有権移転登記・抵当権設定・司法書士報酬等', category: '諸経費' },
  { key: 'brokerageFee', label: '仲介手数料', category: '諸経費' },
  { key: 'stampDuty', label: '契約書印紙代', category: '諸経費' },
  { key: 'fireInsurance', label: '火災保険代（5年間）', category: '諸経費' },
  { key: 'propertyTaxSettlement', label: '固定資産税精算金', category: '諸経費' },
  { key: 'bankFee', label: '金融機関手数料', category: '諸経費' },
  { key: 'acquisitionTax', label: '不動産取得税', category: '諸経費' },
  { key: 'totalExpenses', label: '諸経費合計', category: '諸経費', computed: true },
  { key: 'grandTotalProjectCost', label: '事業費合計', category: '総事業費', computed: true },
  { key: 'grandTotalExpenses', label: '諸経費合計', category: '総事業費', computed: true },
  { key: 'grandTotal', label: '合計', category: '総事業費', computed: true },
  { key: 'ownFunds', label: '自己資金', category: '資金計画', computed: true },
  { key: 'loanAmount', label: '借入金', category: '資金計画' },
  { key: 'fundingTotal', label: '合計', category: '資金計画', computed: true },
  { key: 'address', label: '住所', category: '事業内容' },
  { key: 'useDistrict', label: '用途地域指定', category: '事業内容' },
  { key: 'siteArea', label: '敷地面積', category: '事業内容' },
  { key: 'buildingCoverage', label: '建蔽率', category: '事業内容' },
  { key: 'floorAreaRatio', label: '容積率', category: '事業内容' },
  { key: 'structureScale', label: '構造・規模', category: '事業内容' },
  { key: 'buildAge', label: '築年数', category: '事業内容' },
  { key: 'layoutRooms', label: '間取り・部屋数', category: '事業内容' },
  { key: 'totalFloorArea', label: '延床面積', category: '事業内容' },
  { key: 'remarks', label: '備考', category: 'その他' },
]

export function createEmptyProperty(): Property {
  return {
    id: crypto.randomUUID(),
    name: '',
    propertyPrice: '',
    repairCost: '',
    otherCost: '',
    registrationFees: '',
    brokerageFee: '',
    stampDuty: '',
    fireInsurance: '',
    propertyTaxSettlement: '',
    bankFee: '',
    acquisitionTax: '',
    loanAmount: '',
    rentIncomeItems: [],
    repaymentLoanAmount: '',
    interestRate: '2%',
    loanTerm: '35年',
    bankName: '〇〇銀行',
    propertyTax: '',
    managementFee: '',
    cleaningUtilities: '',
    address: '',
    useDistrict: '',
    siteArea: '',
    buildingCoverage: '',
    floorAreaRatio: '',
    structureScale: '',
    buildAge: '',
    layoutRooms: '',
    totalFloorArea: '',
    remarks: '',
  }
}

/** Parse a Japanese yen string like "5,980万円" or "5,980,000円" to a number (in 万円 units) */
export function parseYenToMan(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
  const manMatch = cleaned.match(/([\d.]+)\s*万/)
  if (manMatch) return parseFloat(manMatch[1])

  const yenCleaned = cleaned.replace(/円/g, '')
  const num = parseFloat(yenCleaned)
  if (isNaN(num)) return null
  // Interpret plain numbers / 円表記 as 円, convert to 万円
  return num / 10000
}

/** Parse yen amount string like "80,000" or "80,000円" to a number (in 万円 units) */
export function parseRentYenToMan(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/,/g, '').replace(/\s/g, '').replace(/円/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return num / 10000
}

/** Format a number (万円 unit) to a display string */
export function formatMan(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const formatted = rounded % 1 === 0
    ? rounded.toLocaleString('ja-JP')
    : rounded.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${formatted}万円`
}

/** Calculate total project cost from property price + repair cost + other cost */
export function calcTotalProjectCost(property: Property): string {
  const values = [property.propertyPrice, property.repairCost, property.otherCost]
  const parsed = values.map(parseYenToMan)
  const valid = parsed.filter((v): v is number => v !== null)
  if (valid.length === 0) return ''
  const total = valid.reduce((sum, v) => sum + v, 0)
  return formatYenFromMan(total)
}

/** Calculate total expenses (諸経費合計) from all expense fields */
export function calcTotalExpenses(property: Property): string {
  const values = EXPENSE_KEYS.map(key => property[key])
  const parsed = values.map(parseYenToMan)
  const valid = parsed.filter((v): v is number => v !== null)
  if (valid.length === 0) return ''
  const total = valid.reduce((sum, v) => sum + v, 0)
  return formatYenFromMan(total)
}

/** Get grand total as a number (万円), returns null if not calculable */
export function getGrandTotalNum(property: Property): number | null {
  const projectCost = getTotalProjectCostNum(property)
  const expenseValues = EXPENSE_KEYS.map(key => property[key])
  const expenseParsed = expenseValues.map(parseYenToMan)
  const expenseValid = expenseParsed.filter((v): v is number => v !== null)
  const expenseTotal = expenseValid.length > 0 ? expenseValid.reduce((s, v) => s + v, 0) : null

  if (projectCost === null && expenseTotal === null) return null
  return (projectCost ?? 0) + (expenseTotal ?? 0)
}

/** Calculate grand total = 事業費合計 + 諸経費合計 */
export function calcGrandTotal(property: Property): string {
  const projectCost = getTotalProjectCostNum(property)
  const expenseValues = EXPENSE_KEYS.map(key => property[key])
  const expenseParsed = expenseValues.map(parseYenToMan)
  const expenseValid = expenseParsed.filter((v): v is number => v !== null)
  const expenseTotal = expenseValid.length > 0 ? expenseValid.reduce((s, v) => s + v, 0) : null

  if (projectCost === null && expenseTotal === null) return ''
  return formatYenFromMan((projectCost ?? 0) + (expenseTotal ?? 0))
}

/** Get total project cost as a number (万円), returns null if not calculable */
export function getTotalProjectCostNum(property: Property): number | null {
  const values = [property.propertyPrice, property.repairCost, property.otherCost]
  const parsed = values.map(parseYenToMan)
  const valid = parsed.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((sum, v) => sum + v, 0)
}

/**
 * Calculate default expense values based on source fields.
 * Returns a partial record of expense key => display string.
 *
 * - 所有権移転登記・抵当権設定・司法書士報酬等 = 事業費合計 × 2%
 * - 仲介手数料 = (物件価格 × 3% + 6万円) × 1.1
 * - 契約書印紙代 = 1万円 (fixed)
 * - 火災保険代（5年間）= 物件価格 × 1%
 * - 固定資産税精算金 = (後日追加)
 * - 金融機関手数料 = 借入金 × 1% (借入金フィールド未実装)
 * - 不動産取得税 = 事業費合計 × 1%
 */
export function calcExpenseDefaults(property: Property): Partial<Record<string, string>> {
  const result: Record<string, string> = {}

  const totalMan = getTotalProjectCostNum(property)
  const priceMan = parseYenToMan(property.propertyPrice)

  // Registration fees: 事業費合計 × 2%
  if (totalMan !== null && totalMan > 0) {
    result.registrationFees = formatYenFromMan(totalMan * 0.02)
  }

  // Brokerage fee: (property price * 3% + 6万) * 1.1
  if (priceMan !== null && priceMan > 0) {
    result.brokerageFee = formatYenFromMan((priceMan * 0.03 + 6) * 1.1)
  }

  // Stamp duty: fixed 100,000円
  result.stampDuty = '100,000円'

  // Fire insurance (5 years): property price * 1%
  if (priceMan !== null && priceMan > 0) {
    result.fireInsurance = formatYenFromMan(priceMan * 0.01)
  }

  // 固定資産税精算金: formula TBD (leave empty)
  // 金融機関手数料: borrowing * 1% (no borrowing field yet, leave empty)

  // Acquisition tax: total project cost * 1%
  if (totalMan !== null && totalMan > 0) {
    result.acquisitionTax = formatYenFromMan(totalMan * 0.01)
  }

  return result
}

/** Calculate own funds (自己資金) = 総事業費合計 - 借入金 */
export function calcOwnFunds(property: Property): string {
  const grandTotal = getGrandTotalNum(property)
  const loanAmount = parseYenToMan(property.loanAmount)
  
  if (grandTotal === null) return ''
  const ownFunds = grandTotal - (loanAmount ?? 0)
  return formatYenFromMan(ownFunds)
}

/** Get default loan amount (物件価格) */
export function getDefaultLoanAmount(property: Property): string {
  return property.propertyPrice || ''
}

/** Parse interest rate string like "2%" or "2.5%" to decimal (e.g., 0.02) */
export function parseInterestRate(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[%％\s]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return num / 100
}

/** Parse loan term string like "35年" or "35" to number of years */
export function parseLoanTerm(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[年\s]/g, '')
  const num = parseInt(cleaned, 10)
  if (isNaN(num) || num <= 0) return null
  return num
}

/**
 * PMT function - calculates monthly payment for a loan
 * @param principal - loan amount in 万円
 * @param annualRate - annual interest rate as decimal (e.g., 0.02 for 2%)
 * @param years - loan term in years
 * @returns monthly payment in 万円
 */
export function calcPMT(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate === 0) {
    // No interest case
    return principal / (years * 12)
  }
  const monthlyRate = annualRate / 12
  const numPayments = years * 12
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
  return payment
}

/** Calculate monthly repayment amount */
export function calcMonthlyRepayment(property: Property): string {
  const loanAmount = parseYenToMan(property.repaymentLoanAmount || property.loanAmount)
  const rate = parseInterestRate(property.interestRate)
  const term = parseLoanTerm(property.loanTerm)
  
  if (loanAmount === null || rate === null || term === null) return ''
  
  const monthlyPayment = calcPMT(loanAmount, rate, term)
  if (monthlyPayment <= 0) return ''
  
  return formatYenFromMan(monthlyPayment)
}

/** Calculate annual repayment amount (monthly × 12) */
export function calcAnnualRepayment(property: Property): string {
  const loanAmount = parseYenToMan(property.repaymentLoanAmount || property.loanAmount)
  const rate = parseInterestRate(property.interestRate)
  const term = parseLoanTerm(property.loanTerm)
  
  if (loanAmount === null || rate === null || term === null) return ''
  
  const monthlyPayment = calcPMT(loanAmount, rate, term)
  if (monthlyPayment <= 0) return ''
  
  return formatYenFromMan(monthlyPayment * 12)
}

/** Get total rent income as number (万円) */
export function getTotalRentIncomeNum(items: RentIncomeItem[]): number {
  return items.reduce((sum, item) => sum + calcRentItemTotal(item), 0)
}

/** Get annual repayment as number (万円) */
export function getAnnualRepaymentNum(property: Property): number {
  const loanAmount = parseYenToMan(property.repaymentLoanAmount || property.loanAmount)
  const rate = parseInterestRate(property.interestRate)
  const term = parseLoanTerm(property.loanTerm)
  
  if (loanAmount === null || rate === null || term === null) return 0
  
  const monthlyPayment = calcPMT(loanAmount, rate, term)
  return monthlyPayment * 12
}

/** Calculate default property tax (固定資産税) = 年間家賃収入 × 6% */
export function calcDefaultPropertyTax(property: Property): string {
  const annualRent = getTotalRentIncomeNum(property.rentIncomeItems)
  if (annualRent === 0) return ''
  return formatYenFromMan(annualRent * 0.06)
}

/** Calculate default management fee (管理料) = 年間家賃収入 × 5% */
export function calcDefaultManagementFee(property: Property): string {
  const annualRent = getTotalRentIncomeNum(property.rentIncomeItems)
  if (annualRent === 0) return ''
  return formatYenFromMan(annualRent * 0.05)
}

/** Calculate default cleaning/utilities (清掃・水道光熱) = 年間家賃収入 × 2% */
export function calcDefaultCleaningUtilities(property: Property): string {
  const annualRent = getTotalRentIncomeNum(property.rentIncomeItems)
  if (annualRent === 0) return ''
  return formatYenFromMan(annualRent * 0.02)
}

/** Calculate annual income/expense balance (年間収支合計) */
export function calcAnnualBalance(property: Property): string {
  const annualRent = getTotalRentIncomeNum(property.rentIncomeItems)
  const annualRepayment = getAnnualRepaymentNum(property)
  const propertyTax = parseYenToMan(property.propertyTax) ?? (annualRent * 0.06)
  const managementFee = parseYenToMan(property.managementFee) ?? (annualRent * 0.05)
  const cleaningUtilities = parseYenToMan(property.cleaningUtilities) ?? (annualRent * 0.02)
  
  if (annualRent === 0) return ''
  
  const balance = annualRent - annualRepayment - propertyTax - managementFee - cleaningUtilities
  return formatYenFromMan(balance)
}

/** Calculate monthly income/expense balance (月間収支合計) = 年間収支合計 / 12 */
export function calcMonthlyBalance(property: Property): string {
  const annualRent = getTotalRentIncomeNum(property.rentIncomeItems)
  const annualRepayment = getAnnualRepaymentNum(property)
  const propertyTax = parseYenToMan(property.propertyTax) ?? (annualRent * 0.06)
  const managementFee = parseYenToMan(property.managementFee) ?? (annualRent * 0.05)
  const cleaningUtilities = parseYenToMan(property.cleaningUtilities) ?? (annualRent * 0.02)
  
  if (annualRent === 0) return ''
  
  const balance = annualRent - annualRepayment - propertyTax - managementFee - cleaningUtilities
  return formatYenFromMan(balance / 12)
}

/** Pre-populate expense defaults for a property (used for sample data) */
export function withExpenseDefaults(property: Property): Property {
  const defaults = calcExpenseDefaults(property)
  const result = { ...property }
  for (const [key, value] of Object.entries(defaults)) {
    const k = key as keyof Property
    if (!result[k]) {
      ;(result as Record<string, string>)[k] = value
    }
  }
  return result
}
