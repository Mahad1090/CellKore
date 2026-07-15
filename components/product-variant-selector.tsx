'use client'

import { useState } from 'react'
import { ProductVariant } from '@/lib/mock-data'

interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  onSelectVariant: (variant: ProductVariant) => void
  selectedVariant: ProductVariant | null
}

export function ProductVariantSelector({
  variants,
  onSelectVariant,
  selectedVariant,
}: ProductVariantSelectorProps) {
  const colors = Array.from(new Set(variants.map((v) => v.color)))
  const storages = Array.from(new Set(variants.filter((v) => v.storage).map((v) => v.storage)))
  const rams = Array.from(new Set(variants.filter((v) => v.ram).map((v) => v.ram)))

  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || '')
  const [selectedStorage, setSelectedStorage] = useState<string>(storages[0] || '')
  const [selectedRam, setSelectedRam] = useState<string>(rams[0] || '')

  const getAvailableVariant = () => {
    return variants.find(
      (v) =>
        v.color === selectedColor &&
        (!selectedStorage || v.storage === selectedStorage) &&
        (!selectedRam || v.ram === selectedRam)
    )
  }

  const currentVariant = getAvailableVariant()

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    const variant = variants.find((v) => v.color === color && v.storage === selectedStorage && v.ram === selectedRam)
    if (variant) {
      onSelectVariant(variant)
    }
  }

  const handleStorageChange = (storage: string) => {
    setSelectedStorage(storage)
    const variant = variants.find((v) => v.color === selectedColor && v.storage === storage && v.ram === selectedRam)
    if (variant) {
      onSelectVariant(variant)
    }
  }

  const handleRamChange = (ram: string) => {
    setSelectedRam(ram)
    const variant = variants.find((v) => v.color === selectedColor && v.storage === selectedStorage && v.ram === ram)
    if (variant) {
      onSelectVariant(variant)
    }
  }

  return (
    <div className="space-y-6">
      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">Colors</h3>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  selectedColor === color
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:border-primary'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Storage */}
      {storages.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">Storage</h3>
          <div className="flex flex-wrap gap-3">
            {storages.map((storage) => {
              const variantWithStorage = variants.find((v) => v.storage === storage && v.color === selectedColor)
              const isAvailable = variantWithStorage?.inStock

              return (
                <button
                  key={storage}
                  onClick={() => handleStorageChange(storage)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedStorage === storage
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isAvailable
                        ? 'border-border bg-card text-foreground hover:border-primary'
                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  {storage}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* RAM */}
      {rams.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">RAM</h3>
          <div className="flex flex-wrap gap-3">
            {rams.map((ram) => {
              const variantWithRam = variants.find((v) => v.ram === ram && v.storage === selectedStorage && v.color === selectedColor)
              const isAvailable = variantWithRam?.inStock

              return (
                <button
                  key={ram}
                  onClick={() => handleRamChange(ram)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedRam === ram
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isAvailable
                        ? 'border-border bg-card text-foreground hover:border-primary'
                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  {ram}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {currentVariant && (
        <div className="p-4 bg-muted rounded-lg">
          {currentVariant.inStock ? (
            <div>
              <p className="text-sm text-green-600 font-semibold">✓ In Stock</p>
              <p className="text-xs text-muted-foreground mt-1">{currentVariant.stockCount} units available</p>
            </div>
          ) : (
            <p className="text-sm text-red-600 font-semibold">✗ Out of Stock</p>
          )}
        </div>
      )}
    </div>
  )
}
