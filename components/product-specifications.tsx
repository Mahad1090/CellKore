'use client'

import { useState } from 'react'
import { Product } from '@/lib/mock-data'

interface ProductSpecificationsProps {
  product: Product
}

export function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const [expanded, setExpanded] = useState(false)

  const specs = product.specifications

  if (!specs) return null

  const specSections = [
    { key: 'generalFeatures', label: 'General Features', icon: '📋' },
    { key: 'display', label: 'Display', icon: '📱' },
    { key: 'memory', label: 'Memory', icon: '💾' },
    { key: 'performance', label: 'Performance', icon: '⚡' },
    { key: 'camera', label: 'Camera', icon: '📷' },
    { key: 'battery', label: 'Battery', icon: '🔋' },
    { key: 'connectivity', label: 'Connectivity', icon: '📡' },
  ] as const

  const visibleSections = expanded ? specSections : specSections.slice(0, 4)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">Specifications</h2>

      {/* Quick Specs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
        <div className="bg-muted p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">📱</div>
          <p className="text-xs text-muted-foreground mb-1">Display</p>
          <p className="text-sm font-semibold text-foreground">
            {specs.display?.['Screen Size'] || 'N/A'}
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">💾</div>
          <p className="text-xs text-muted-foreground mb-1">RAM</p>
          <p className="text-sm font-semibold text-foreground">
            {specs.memory?.['RAM'] || 'N/A'}
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">🔋</div>
          <p className="text-xs text-muted-foreground mb-1">Battery</p>
          <p className="text-sm font-semibold text-foreground">
            {specs.battery?.['Battery Capacity'] || 'N/A'}
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-xs text-muted-foreground mb-1">Camera</p>
          <p className="text-sm font-semibold text-foreground">
            {specs.camera?.['Back Camera']?.split('+')[0].trim() || 'N/A'}
          </p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-4">
        {visibleSections.map((section) => {
          const sectionSpecs = specs[section.key as keyof typeof specs]

          if (!sectionSpecs || Object.keys(sectionSpecs).length === 0) return null

          return (
            <div key={section.key} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted border-b border-border">
                <p className="font-semibold text-foreground">
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </p>
              </div>
              <div className="divide-y divide-border">
                {Object.entries(sectionSpecs).map(([key, value]) => (
                  <div key={key} className="p-4 flex justify-between items-start gap-4">
                    <span className="text-muted-foreground text-sm font-medium">{key}</span>
                    <span className="text-foreground text-sm font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More/Less Button */}
      {specSections.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-primary font-semibold hover:text-primary-foreground hover:bg-primary rounded-lg transition"
        >
          {expanded ? '▲ Show Less' : '▼ Show More'}
        </button>
      )}
    </div>
  )
}
