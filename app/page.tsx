'use client'

import { useState, useCallback, useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import { PropertyForm } from '@/components/property-form'
import { ComparisonTable } from '@/components/comparison-table'
import { type Property, withExpenseDefaults } from '@/lib/property-types'
import { supabase } from '@/lib/supabase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const SAMPLE_PROPERTIES: Property[] = [
  withExpenseDefaults({
    id: 'sample-1',
    name: 'パークハウス表参道',
    propertyPrice: '6,980万円',
    repairCost: '1,200万円',
    otherCost: '350万円',
    registrationFees: '',
    brokerageFee: '',
    stampDuty: '',
    fireInsurance: '',
    propertyTaxSettlement: '',
    bankFee: '',
    acquisitionTax: '',
    loanAmount: '6,980万円',
    rentIncomeItems: [
      { id: '1', roomType: '1K', units: '5', rentPerUnit: '8万円' },
      { id: '2', roomType: '1LDK', units: '3', rentPerUnit: '12万円' },
    ],
    repaymentLoanAmount: '',
    interestRate: '2%',
    loanTerm: '35年',
    bankName: '三菱UFJ銀行',
    propertyTax: '',
    managementFee: '',
    cleaningUtilities: '',
    address: '東京都渋谷区神宮前4丁目',
    useDistrict: '商業地域',
    siteArea: '1,250.30m²',
    buildingCoverage: '80%',
    floorAreaRatio: '400%',
    structureScale: 'RC造 地上15階建',
    buildAge: '6年',
    layoutRooms: '2LDK（4室）',
    totalFloorArea: '68.2m²',
    remarks: 'ペット可（小型犬1匹まで）、24時間有人管理',
  }),
  withExpenseDefaults({
    id: 'sample-2',
    name: 'ブリリアタワー目黒',
    propertyPrice: '5,480万円',
    repairCost: '800万円',
    otherCost: '200万円',
    registrationFees: '',
    brokerageFee: '',
    stampDuty: '',
    fireInsurance: '',
    propertyTaxSettlement: '',
    bankFee: '',
    acquisitionTax: '',
    loanAmount: '5,480万円',
    rentIncomeItems: [
      { id: '1', roomType: '2LDK', units: '4', rentPerUnit: '15万円' },
      { id: '2', roomType: '3LDK', units: '2', rentPerUnit: '20万円' },
    ],
    repaymentLoanAmount: '',
    interestRate: '1.8%',
    loanTerm: '30年',
    bankName: 'みずほ銀行',
    propertyTax: '',
    managementFee: '',
    cleaningUtilities: '',
    address: '東京都品川区上大崎2丁目',
    useDistrict: '近隣商業地域',
    siteArea: '3,800.50m²',
    buildingCoverage: '60%',
    floorAreaRatio: '300%',
    structureScale: 'SRC造 地上38階建',
    buildAge: '4年',
    layoutRooms: '3LDK（6室）',
    totalFloorArea: '75.3m²',
    remarks: 'コンシェルジュサービス、スカイラウンジ付き',
  }),
  withExpenseDefaults({
    id: 'sample-3',
    name: 'シティハウス新宿御苑',
    propertyPrice: '4,280万円',
    repairCost: '600万円',
    otherCost: '150万円',
    registrationFees: '',
    brokerageFee: '',
    stampDuty: '',
    fireInsurance: '',
    propertyTaxSettlement: '',
    bankFee: '',
    acquisitionTax: '',
    loanAmount: '4,280万円',
    rentIncomeItems: [
      { id: '1', roomType: '1LDK', units: '6', rentPerUnit: '10万円' },
    ],
    repaymentLoanAmount: '',
    interestRate: '2.2%',
    loanTerm: '25年',
    bankName: '三井住友銀行',
    propertyTax: '',
    managementFee: '',
    cleaningUtilities: '',
    address: '東京都新宿区新宿1丁目',
    useDistrict: '第二種住居地域',
    siteArea: '820.00m²',
    buildingCoverage: '60%',
    floorAreaRatio: '200%',
    structureScale: 'RC造 地上12階建',
    buildAge: '8年',
    layoutRooms: '1LDK（3室）',
    totalFloorArea: '52.8m²',
    remarks: '角部屋、リノベーション済み',
  }),
]

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('properties')
      .select('id, data, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch properties from Supabase', error)
      setProperties(SAMPLE_PROPERTIES)
      setIsLoading(false)
      return
    }

    const rows = (data as { id: string; data: Property }[] | null) ?? []

    if (rows.length === 0) {
      setProperties(SAMPLE_PROPERTIES)
    } else {
      const mapped = rows.map(row => withExpenseDefaults(row.data))
      setProperties(mapped)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleAddProperty = useCallback(
    async (property: Property) => {
      setIsLoading(true)

      const { error } = await supabase.from('properties').insert({
        id: property.id,
        data: property,
      })

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert property into Supabase', error)
        setIsLoading(false)
        return
      }

      await fetchProperties()
      setEditingProperty(null)
      setIsLoading(false)
    },
    [fetchProperties],
  )

  const handleEdit = useCallback((property: Property) => {
    setEditingProperty(property)
    setFormOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      setProperties(prev => prev.filter(p => p.id !== deleteTarget))
      setDeleteTarget(null)
    }
  }, [deleteTarget])

  const handleOpenAdd = useCallback(() => {
    setEditingProperty(null)
    setFormOpen(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader propertyCount={properties.length} onAddClick={handleOpenAdd} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Summary cards */}
        {properties.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="登録物件数" value={`${properties.length}件`} />
            <SummaryCard label="最安事業費合計" value={getMinTotalCost(properties)} />
            <SummaryCard label="最大延床面積" value={getMaxTotalFloorArea(properties)} />
            <SummaryCard label="平均築年数" value={getAvgBuildAge(properties)} />
          </div>
        )}

        {/* Comparison table */}
        <ComparisonTable
          properties={properties}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteTarget(id)}
          isLoading={isLoading}
        />

        {/* Scroll hint for mobile */}
        {properties.length > 1 && (
          <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
            {'← 横にスクロールして比較できます →'}
          </p>
        )}
      </main>

      {/* Form Dialog */}
      <PropertyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAddProperty}
        editProperty={editingProperty}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">物件を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。比較表からこの物件が削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

function parseCostToNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
  const match = cleaned.match(/([\d.]+)\s*万/)
  if (match) return parseFloat(match[1])
  const numOnly = cleaned.match(/^([\d.]+)$/)
  if (numOnly) return parseFloat(numOnly[1])
  return null
}

function getMinTotalCost(properties: Property[]): string {
  const costs = properties
    .map(p => {
      const vals = [p.propertyPrice, p.repairCost, p.otherCost]
        .map(parseCostToNumber)
        .filter((v): v is number => v !== null)
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null
    })
    .filter((c): c is number => c !== null)
  if (costs.length === 0) return '-'
  const min = Math.min(...costs)
  return `${min.toLocaleString('ja-JP')}万円`
}

function getMaxTotalFloorArea(properties: Property[]): string {
  const areas = properties
    .map(p => {
      const match = p.totalFloorArea.replace(/,/g, '').match(/([\d.]+)/)
      return match ? parseFloat(match[1]) : null
    })
    .filter((a): a is number => a !== null)
  if (areas.length === 0) return '-'
  const max = Math.max(...areas)
  const prop = properties.find(p => {
    const match = p.totalFloorArea.replace(/,/g, '').match(/([\d.]+)/)
    return match && parseFloat(match[1]) === max
  })
  return prop?.totalFloorArea || '-'
}

function getAvgBuildAge(properties: Property[]): string {
  const years = properties
    .map(p => {
      const match = p.buildAge.match(/(\d+)/)
      return match ? parseInt(match[1]) : null
    })
    .filter((y): y is number => y !== null)
  if (years.length === 0) return '-'
  const avg = years.reduce((sum, y) => sum + y, 0) / years.length
  return `約${Math.round(avg)}年`
}
