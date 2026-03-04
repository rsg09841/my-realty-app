'use client'

import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'

interface AppHeaderProps {
  propertyCount: number
  onAddClick: () => void
}

export function AppHeader({ propertyCount, onAddClick }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              BUKKEN COMPARE
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              不動産物件比較ツール
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {propertyCount > 0 && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {propertyCount}件の物件を比較中
            </span>
          )}
          <Button onClick={onAddClick} className="bg-primary text-primary-foreground">
            <Plus className="mr-1.5 size-4" />
            物件を追加
          </Button>
        </div>
      </div>
    </header>
  )
}
