'use client'

import { type Property, PROPERTY_FIELDS, calcTotalProjectCost, calcTotalExpenses, calcGrandTotal } from '@/lib/property-types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Building2 } from 'lucide-react'

interface ComparisonTableProps {
  properties: Property[]
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
}

export function ComparisonTable({ properties, onEdit, onDelete }: ComparisonTableProps) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-20 text-center">
        <Building2 className="mb-4 size-12 text-muted-foreground/40" />
        <p className="text-lg font-medium text-foreground">物件が登録されていません</p>
        <p className="mt-1 text-sm text-muted-foreground">
          「物件を追加」ボタンから物件情報を入力してください
        </p>
      </div>
    )
  }

  const categories = [...new Set(PROPERTY_FIELDS.map(f => f.category))]

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          {/* Header row with property names */}
          <thead>
            <tr className="border-b border-border bg-primary">
              <th className="sticky left-0 z-10 min-w-[140px] bg-primary px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                比較項目
              </th>
              {properties.map((prop) => (
                <th
                  key={prop.id}
                  className="min-w-[200px] px-4 py-3 text-left"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-primary-foreground text-balance">
                      {prop.name || '（名称未設定）'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(prop)}
                        className="h-6 px-2 text-xs text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                      >
                        <Pencil className="mr-1 size-3" />
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(prop.id)}
                        className="h-6 px-2 text-xs text-primary-foreground/80 hover:bg-destructive/20 hover:text-primary-foreground"
                      >
                        <Trash2 className="mr-1 size-3" />
                        削除
                      </Button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => {
              const fields = PROPERTY_FIELDS.filter(f => f.category === category)
              return (
                <CategorySection
                  key={category}
                  category={category}
                  fields={fields}
                  properties={properties}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CategorySection({
  category,
  fields,
  properties,
}: {
  category: string
  fields: typeof PROPERTY_FIELDS
  properties: Property[]
}) {
  return (
    <>
      {/* Category header */}
      <tr className="border-b border-border bg-secondary">
        <td
          colSpan={properties.length + 1}
          className="sticky left-0 z-10 px-4 py-2"
        >
          <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
            {category}
          </Badge>
        </td>
      </tr>

      {/* Field rows */}
      {fields.map((field, index) => (
        <tr
          key={field.key}
          className={`border-b border-border transition-colors hover:bg-muted/50 ${
            index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
          }`}
        >
          <td className="sticky left-0 z-10 min-w-[140px] bg-inherit px-4 py-3 text-xs font-medium text-muted-foreground">
            {field.label}
          </td>
          {properties.map((prop) => {
            const value = field.computed
              ? field.key === 'totalProjectCost' || field.key === 'grandTotalProjectCost'
                ? calcTotalProjectCost(prop)
                : field.key === 'totalExpenses' || field.key === 'grandTotalExpenses'
                  ? calcTotalExpenses(prop)
                  : field.key === 'grandTotal'
                    ? calcGrandTotal(prop)
                    : prop[field.key as keyof Property]
              : prop[field.key as keyof Property]
            return (
              <td
                key={prop.id}
                className={`min-w-[200px] px-4 py-3 text-sm text-foreground ${field.computed ? 'font-semibold' : ''}`}
              >
                {value || (
                  <span className="text-muted-foreground/40">&#8212;</span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
