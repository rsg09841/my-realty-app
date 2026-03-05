'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  type Property,
  type RentIncomeItem,
  createEmptyProperty,
  createEmptyRentIncomeItem,
  calcTotalProjectCost,
  calcTotalExpenses,
  calcGrandTotal,
  calcOwnFunds,
  calcExpenseDefaults,
  calcRentItemTotal,
  calcMonthlyRepayment,
  calcAnnualRepayment,
  calcDefaultPropertyTax,
  calcDefaultManagementFee,
  calcDefaultCleaningUtilities,
  calcAnnualBalance,
  calcMonthlyBalance,
  calcFullOccupancyYield,
  getTotalRentIncomeNum,
  getAnnualRepaymentNum,
  parseYenToMan,
  formatMan,
  formatYenFromMan,
  EXPENSE_KEYS,
  ROOM_TYPES,
} from '@/lib/property-types'
import { Building2, Banknote, ClipboardList, Receipt, RotateCcw, Calculator, Wallet, Home, Plus, Trash2, Landmark, TrendingUp } from 'lucide-react'

interface PropertyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (property: Property) => Promise<void> | void
  editProperty?: Property | null
}

export function PropertyForm({ open, onOpenChange, onSubmit, editProperty }: PropertyFormProps) {
  const [property, setProperty] = useState<Property>(
    editProperty ?? createEmptyProperty()
  )
  const [manuallyEdited, setManuallyEdited] = useState<Set<string>>(new Set())
  const prevSourceRef = useRef({ propertyPrice: '', repairCost: '', otherCost: '' })

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      const prop = editProperty ?? createEmptyProperty()
      setProperty(prop)

      // Mark existing expense values as manually edited so they don't get overwritten
      const edited = new Set<string>()
      if (editProperty) {
        for (const key of EXPENSE_KEYS) {
          if (editProperty[key]) {
            edited.add(key)
          }
        }
      }
      setManuallyEdited(edited)
      prevSourceRef.current = {
        propertyPrice: prop.propertyPrice,
        repairCost: prop.repairCost,
        otherCost: prop.otherCost,
      }
    }
  }, [open, editProperty])

  // Auto-calculate expenses when source fields change
  useEffect(() => {
    const current = {
      propertyPrice: property.propertyPrice,
      repairCost: property.repairCost,
      otherCost: property.otherCost,
    }

    const sourceChanged =
      current.propertyPrice !== prevSourceRef.current.propertyPrice ||
      current.repairCost !== prevSourceRef.current.repairCost ||
      current.otherCost !== prevSourceRef.current.otherCost

    if (!sourceChanged) return

    prevSourceRef.current = current
    const defaults = calcExpenseDefaults(property)

    setProperty(prev => {
      const updated = { ...prev }
      for (const [key, value] of Object.entries(defaults)) {
        if (!manuallyEdited.has(key)) {
          ;(updated as Record<string, string>)[key] = value
        }
      }
      // Set default loan amount to property price if not manually edited
      if (!manuallyEdited.has('loanAmount') && current.propertyPrice !== prevSourceRef.current.propertyPrice) {
        updated.loanAmount = current.propertyPrice
      }
      return updated
    })
  }, [property.propertyPrice, property.repairCost, property.otherCost, manuallyEdited])

  // Set initial loan amount when property price is first entered
  useEffect(() => {
    if (property.propertyPrice && !property.loanAmount && !manuallyEdited.has('loanAmount')) {
      setProperty(prev => ({ ...prev, loanAmount: prev.propertyPrice }))
    }
  }, [property.propertyPrice, property.loanAmount, manuallyEdited])

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !editProperty) {
      setProperty(createEmptyProperty())
      setManuallyEdited(new Set())
    } else if (newOpen && editProperty) {
      setProperty(editProperty)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(property)
    onOpenChange(false)
    setProperty(createEmptyProperty())
    setManuallyEdited(new Set())
  }

  const update = (key: keyof Property, value: string) => {
    setProperty(prev => ({ ...prev, [key]: value }))
  }

  const updateExpense = useCallback((key: keyof Property, value: string) => {
    setManuallyEdited(prev => new Set(prev).add(key))
    setProperty(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetExpense = useCallback((key: keyof Property) => {
    setManuallyEdited(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    // Recalculate just this one field
    const defaults = calcExpenseDefaults(property)
    const val = defaults[key] ?? ''
    setProperty(prev => ({ ...prev, [key]: val }))
  }, [property])

  // Rent income item handlers
  const addRentIncomeItem = useCallback(() => {
    setProperty(prev => ({
      ...prev,
      rentIncomeItems: [...prev.rentIncomeItems, createEmptyRentIncomeItem()],
    }))
  }, [])

  const updateRentIncomeItem = useCallback((id: string, field: keyof RentIncomeItem, value: string) => {
    setProperty(prev => ({
      ...prev,
      rentIncomeItems: prev.rentIncomeItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }, [])

  const removeRentIncomeItem = useCallback((id: string) => {
    setProperty(prev => ({
      ...prev,
      rentIncomeItems: prev.rentIncomeItems.filter(item => item.id !== id),
    }))
  }, [property])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="size-5 text-primary" />
            {editProperty ? '物件情報を編集' : '新しい物件を追加'}
          </DialogTitle>
          <DialogDescription>
            物件の情報を入力してください。比較表に追加されます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Property Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">
              物件名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例: パークハウス表参道"
              value={property.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="bg-card"
            />
          </div>

          {/* Business Cost Section (事業費) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <Banknote className="size-4" />
              事業費
            </legend>
            {/* Full occupancy yield */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullOccupancyYield" className="text-sm text-foreground">
                満室時利回り
              </Label>
              <Input
                id="fullOccupancyYield"
                value={calcFullOccupancyYield(property)}
                readOnly
                disabled
                className="bg-muted font-semibold text-foreground"
                placeholder="自動計算"
              />
              <p className="text-xs text-muted-foreground">
                収支計画の「年間家賃収入」 ÷ 物件価格（自動計算）
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="propertyPrice" className="text-sm text-foreground">物件価格</Label>
                <Input
                  id="propertyPrice"
                  placeholder="例: 59,800,000円"
                  value={property.propertyPrice}
                  onChange={(e) => update('propertyPrice', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="repairCost" className="text-sm text-foreground">修繕費</Label>
                <Input
                  id="repairCost"
                  placeholder="例: 8,000,000円"
                  value={property.repairCost}
                  onChange={(e) => update('repairCost', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="otherCost" className="text-sm text-foreground">その他</Label>
                <Input
                  id="otherCost"
                  placeholder="例: 2,000,000円"
                  value={property.otherCost}
                  onChange={(e) => update('otherCost', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="totalProjectCost" className="text-sm text-foreground">事業費合計</Label>
                <Input
                  id="totalProjectCost"
                  value={calcTotalProjectCost(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">物件価格 + 修繕費 + その他（自動計算）</p>
              </div>
            </div>
          </fieldset>

          {/* Expenses Section (諸経費) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <Receipt className="size-4" />
              諸経費
            </legend>
            <p className="text-xs text-muted-foreground -mt-1">
              事業費の入力に基づき自動計算されます。値は自由に編集できます。
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ExpenseInput
                id="registrationFees"
                label="所有権移転登記・抵当権設定・司法書士報酬等"
                hint="事業費合計 x 2%"
                value={property.registrationFees}
                isManual={manuallyEdited.has('registrationFees')}
                onChange={(v) => updateExpense('registrationFees', v)}
                onReset={() => resetExpense('registrationFees')}
              />
              <ExpenseInput
                id="brokerageFee"
                label="仲介手数料"
                hint="(物件価格 x 3% + 6万) x 1.1"
                value={property.brokerageFee}
                isManual={manuallyEdited.has('brokerageFee')}
                onChange={(v) => updateExpense('brokerageFee', v)}
                onReset={() => resetExpense('brokerageFee')}
              />
              <ExpenseInput
                id="stampDuty"
                label="契約書印紙代"
                hint="固定 100,000円"
                value={property.stampDuty}
                isManual={manuallyEdited.has('stampDuty')}
                onChange={(v) => updateExpense('stampDuty', v)}
                onReset={() => resetExpense('stampDuty')}
              />
              <ExpenseInput
                id="fireInsurance"
                label="火災保険代（5年間）"
                hint="物件価格 x 1%"
                value={property.fireInsurance}
                isManual={manuallyEdited.has('fireInsurance')}
                onChange={(v) => updateExpense('fireInsurance', v)}
                onReset={() => resetExpense('fireInsurance')}
              />
              <ExpenseInput
                id="propertyTaxSettlement"
                label="固定資産税精算金"
                hint="後日数式を追加"
                placeholder="後日追加"
                value={property.propertyTaxSettlement}
                isManual={manuallyEdited.has('propertyTaxSettlement')}
                onChange={(v) => updateExpense('propertyTaxSettlement', v)}
                onReset={() => resetExpense('propertyTaxSettlement')}
              />
              <ExpenseInput
                id="bankFee"
                label="金融機関手数料"
                hint="借入金 x 1%（借入金は後日追加）"
                placeholder="後日追加"
                value={property.bankFee}
                isManual={manuallyEdited.has('bankFee')}
                onChange={(v) => updateExpense('bankFee', v)}
                onReset={() => resetExpense('bankFee')}
              />
              <ExpenseInput
                id="acquisitionTax"
                label="不動産取得税"
                hint="事業費合計 x 1%"
                value={property.acquisitionTax}
                isManual={manuallyEdited.has('acquisitionTax')}
                onChange={(v) => updateExpense('acquisitionTax', v)}
                onReset={() => resetExpense('acquisitionTax')}
              />
            </div>
            <div className="mt-2 border-t border-border pt-4">
              <div className="flex flex-col gap-2 sm:max-w-[calc(50%-0.5rem)]">
                <Label htmlFor="totalExpenses" className="text-sm font-semibold text-foreground">諸経費合計</Label>
                <Input
                  id="totalExpenses"
                  value={calcTotalExpenses(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">全諸経費の合算（自動計算）</p>
              </div>
            </div>
          </fieldset>

          {/* Grand Total (総事業費) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4 bg-secondary/30">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <Calculator className="size-4" />
              総事業費
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="grandTotalProjectCost" className="text-sm text-foreground">事業費合計</Label>
                <Input
                  id="grandTotalProjectCost"
                  value={calcTotalProjectCost(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="grandTotalExpenses" className="text-sm text-foreground">諸経費合計</Label>
                <Input
                  id="grandTotalExpenses"
                  value={calcTotalExpenses(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="grandTotal" className="text-sm font-semibold text-foreground">合計</Label>
                <Input
                  id="grandTotal"
                  value={calcGrandTotal(property)}
                  readOnly
                  disabled
                  className="bg-primary/10 font-bold text-foreground text-base border-primary/30"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">事業費合計 + 諸経費合計</p>
              </div>
            </div>
          </fieldset>

          {/* Funding Plan (資金計画) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4 bg-accent/30">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <Wallet className="size-4" />
              資金計画
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ownFunds" className="text-sm text-foreground">自己資金</Label>
                <Input
                  id="ownFunds"
                  value={calcOwnFunds(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">合計 - 借入金</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="loanAmount" className="text-sm text-foreground">借入金</Label>
                <Input
                  id="loanAmount"
                  placeholder="例: 50,000,000円"
                  value={property.loanAmount}
                  onChange={(e) => {
                    setManuallyEdited(prev => new Set(prev).add('loanAmount'))
                    update('loanAmount', e.target.value)
                  }}
                  className="bg-card"
                />
                <p className="text-xs text-muted-foreground">デフォルト: 物件価格</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fundingTotal" className="text-sm font-semibold text-foreground">合計</Label>
                <Input
                  id="fundingTotal"
                  value={calcGrandTotal(property)}
                  readOnly
                  disabled
                  className="bg-primary/10 font-bold text-foreground text-base border-primary/30"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">総事業費と同じ</p>
              </div>
            </div>
          </fieldset>

          {/* Rent Income Breakdown (家賃収入内訳) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4 bg-accent/30">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <Home className="size-4" />
              家賃収入内訳
            </legend>
            <div className="flex flex-col gap-3">
              {property.rentIncomeItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_80px_1fr_1fr_40px] items-end p-3 bg-card rounded-lg border border-border">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">タイプ</Label>
                    <Select
                      value={item.roomType}
                      onValueChange={(v) => updateRentIncomeItem(item.id, 'roomType', v)}
                    >
                      <SelectTrigger className="bg-background h-9">
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">戸数</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="例: 5"
                      value={item.units}
                      onChange={(e) => updateRentIncomeItem(item.id, 'units', e.target.value)}
                      className="bg-background h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">1戸当たり賃料</Label>
                    <Input
                      placeholder="例: 80,000円"
                      value={item.rentPerUnit}
                      onChange={(e) => updateRentIncomeItem(item.id, 'rentPerUnit', e.target.value)}
                      className="bg-background h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">賃料合計</Label>
                    <Input
                      value={calcRentItemTotal(item) > 0 ? formatYenFromMan(calcRentItemTotal(item)) : ''}
                      readOnly
                      disabled
                      className="bg-muted h-9 font-medium"
                      placeholder="自動計算"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRentIncomeItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={addRentIncomeItem}
              >
                <Plus className="size-4 mr-2" />
                行を追加
              </Button>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-semibold text-foreground">合計</Label>
                <Input
                  value={
                    (() => {
                      const totalMan = getTotalRentIncomeNum(property.rentIncomeItems)
                      return totalMan > 0 ? formatYenFromMan(totalMan) : ''
                    })()
                  }
                  readOnly
                  disabled
                  className="w-40 bg-primary/10 font-bold text-foreground text-base border-primary/30"
                  placeholder="0円"
                />
              </div>
            </div>
          </fieldset>

          {/* Repayment Plan (返済計画) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4 bg-accent/30">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <Landmark className="size-4" />
              返済計画
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="repaymentLoanAmount" className="text-sm text-foreground">融資金額</Label>
                <Input
                  id="repaymentLoanAmount"
                  placeholder="例: 50,000,000円"
                  value={property.repaymentLoanAmount || property.loanAmount}
                  onChange={(e) => update('repaymentLoanAmount', e.target.value)}
                  className="bg-card"
                />
                <p className="text-xs text-muted-foreground">デフォルト: 借入金</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="interestRate" className="text-sm text-foreground">金利</Label>
                <Input
                  id="interestRate"
                  placeholder="例: 2%"
                  value={property.interestRate}
                  onChange={(e) => update('interestRate', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="loanTerm" className="text-sm text-foreground">融資年数</Label>
                <Input
                  id="loanTerm"
                  placeholder="例: 35年"
                  value={property.loanTerm}
                  onChange={(e) => update('loanTerm', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bankName" className="text-sm text-foreground">金融機関名</Label>
                <Input
                  id="bankName"
                  placeholder="例: 〇〇銀行"
                  value={property.bankName}
                  onChange={(e) => update('bankName', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="monthlyRepayment" className="text-sm text-foreground">月額返済額</Label>
                <Input
                  id="monthlyRepayment"
                  value={calcMonthlyRepayment(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">PMT関数で計算</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="annualRepayment" className="text-sm font-semibold text-foreground">年間返済額</Label>
                <Input
                  id="annualRepayment"
                  value={calcAnnualRepayment(property)}
                  readOnly
                  disabled
                  className="bg-primary/10 font-bold text-foreground text-base border-primary/30"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">月額返済額 x 12</p>
              </div>
            </div>
          </fieldset>

          {/* Income/Expense Plan (収支計画) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4 bg-accent/30">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <TrendingUp className="size-4" />
              収支計画
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="annualRentIncome" className="text-sm text-foreground">年間家賃収入</Label>
                <Input
                  id="annualRentIncome"
                  value={
                    (() => {
                      const totalMan = getTotalRentIncomeNum(property.rentIncomeItems)
                      return totalMan > 0 ? formatYenFromMan(totalMan) : ''
                    })()
                  }
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">家賃収入内訳の合計</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="annualLoanPayment" className="text-sm text-foreground">年間借入支払</Label>
                <Input
                  id="annualLoanPayment"
                  value={calcAnnualRepayment(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">返済計画の年間返済額</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="propertyTax" className="text-sm text-foreground">固定資産税</Label>
                <Input
                  id="propertyTax"
                  placeholder={calcDefaultPropertyTax(property) || '例: 400,000円'}
                  value={property.propertyTax || calcDefaultPropertyTax(property)}
                  onChange={(e) => update('propertyTax', e.target.value)}
                  className="bg-card"
                />
                <p className="text-xs text-muted-foreground">デフォルト: 年間家賃収入の6%</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="managementFee" className="text-sm text-foreground">管理料</Label>
                <Input
                  id="managementFee"
                  placeholder={calcDefaultManagementFee(property) || '例: 300,000円'}
                  value={property.managementFee || calcDefaultManagementFee(property)}
                  onChange={(e) => update('managementFee', e.target.value)}
                  className="bg-card"
                />
                <p className="text-xs text-muted-foreground">デフォルト: 年間家賃収入の5%</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cleaningUtilities" className="text-sm text-foreground">清掃・水道光熱</Label>
                <Input
                  id="cleaningUtilities"
                  placeholder={calcDefaultCleaningUtilities(property) || '例: 150,000円'}
                  value={property.cleaningUtilities || calcDefaultCleaningUtilities(property)}
                  onChange={(e) => update('cleaningUtilities', e.target.value)}
                  className="bg-card"
                />
                <p className="text-xs text-muted-foreground">デフォルト: 年間家賃収入の2%</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="monthlyBalance" className="text-sm text-foreground">月間収支合計</Label>
                <Input
                  id="monthlyBalance"
                  value={calcMonthlyBalance(property)}
                  readOnly
                  disabled
                  className="bg-muted font-semibold text-foreground"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">年間収支合計 / 12</p>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="annualBalance" className="text-sm font-semibold text-foreground">年間収支合計</Label>
                <Input
                  id="annualBalance"
                  value={calcAnnualBalance(property)}
                  readOnly
                  disabled
                  className="bg-primary/10 font-bold text-foreground text-lg border-primary/30"
                  placeholder="自動計算"
                />
                <p className="text-xs text-muted-foreground">年間家賃収入 - 年間借入支払 - 固定資産税 - 管理料 - 清掃・水道光熱</p>
              </div>
            </div>
          </fieldset>

          {/* Business Details (事業内容) */}
          <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-primary">
              <ClipboardList className="size-4" />
              事業内容
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="address" className="text-sm text-foreground">住所</Label>
                <Input
                  id="address"
                  placeholder="例: 東京都渋谷区神宮前4丁目"
                  value={property.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="useDistrict" className="text-sm text-foreground">用途地域指定</Label>
                <Select value={property.useDistrict} onValueChange={(v) => update('useDistrict', v)}>
                  <SelectTrigger id="useDistrict" className="w-full bg-card">
                    <SelectValue placeholder="用途地域を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      '第一種低層住居専用地域',
                      '第二種低層住居専用地域',
                      '第一種中高層住居専用地域',
                      '第二種中高層住居専用地域',
                      '第一種住居地域',
                      '第二種住居地域',
                      '準住居地域',
                      '近隣商業地域',
                      '商業地域',
                      '準工業地域',
                      '工業地域',
                      '工業専用地域',
                    ].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="siteArea" className="text-sm text-foreground">敷地面積</Label>
                <Input
                  id="siteArea"
                  placeholder="例: 150.25m²"
                  value={property.siteArea}
                  onChange={(e) => update('siteArea', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="buildingCoverage" className="text-sm text-foreground">建蔽率</Label>
                <Input
                  id="buildingCoverage"
                  placeholder="例: 60%"
                  value={property.buildingCoverage}
                  onChange={(e) => update('buildingCoverage', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="floorAreaRatio" className="text-sm text-foreground">容積率</Label>
                <Input
                  id="floorAreaRatio"
                  placeholder="例: 200%"
                  value={property.floorAreaRatio}
                  onChange={(e) => update('floorAreaRatio', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="structureScale" className="text-sm text-foreground">構造・規模</Label>
                <Input
                  id="structureScale"
                  placeholder="例: RC造 地上15階建"
                  value={property.structureScale}
                  onChange={(e) => update('structureScale', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="buildAge" className="text-sm text-foreground">築年数</Label>
                <Input
                  id="buildAge"
                  placeholder="例: 5年"
                  value={property.buildAge}
                  onChange={(e) => update('buildAge', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="layoutRooms" className="text-sm text-foreground">間取り・部屋数</Label>
                <Input
                  id="layoutRooms"
                  placeholder="例: 3LDK（6室）"
                  value={property.layoutRooms}
                  onChange={(e) => update('layoutRooms', e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="totalFloorArea" className="text-sm text-foreground">延床面積</Label>
                <Input
                  id="totalFloorArea"
                  placeholder="例: 280.50m²"
                  value={property.totalFloorArea}
                  onChange={(e) => update('totalFloorArea', e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>
          </fieldset>

          {/* Remarks */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="remarks" className="text-sm font-semibold text-foreground">備考</Label>
            <Textarea
              id="remarks"
              placeholder="特記事項があれば入力してください"
              value={property.remarks}
              onChange={(e) => update('remarks', e.target.value)}
              rows={3}
              className="bg-card"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              {editProperty ? '更新する' : '追加する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Individual expense field with auto/manual indicator and reset button */
function ExpenseInput({
  id,
  label,
  hint,
  placeholder,
  value,
  isManual,
  onChange,
  onReset,
}: {
  id: string
  label: string
  hint: string
  placeholder?: string
  value: string
  isManual: boolean
  onChange: (value: string) => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground">
        {label}
        {value && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
              isManual
                ? 'bg-amber-100 text-amber-700'
                : 'bg-accent/15 text-accent'
            }`}
          >
            {isManual ? '手動' : '自動'}
          </span>
        )}
      </Label>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          placeholder={placeholder ?? '自動計算'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-card flex-1"
        />
        {isManual && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-primary"
            onClick={onReset}
            title="自動計算に戻す"
          >
            <RotateCcw className="size-3.5" />
            <span className="sr-only">自動計算に戻す</span>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
