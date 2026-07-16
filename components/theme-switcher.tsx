'use client'

import { useState, useEffect } from 'react'
import { Palette, X, Check, Settings } from 'lucide-react'

interface ThemePreset {
  name: string
  primary: string
  accent: string
  background: string
  foreground: string
}

const PRESETS: ThemePreset[] = [
  {
    name: 'Emerald & Gold',
    primary: '#0b5345',
    accent: '#d4af37',
    background: '#fbfaf7',
    foreground: '#1a2c26',
  },
  {
    name: 'Navy & Gold',
    primary: '#0a2540',
    accent: '#dfb15b',
    background: '#f8fafc',
    foreground: '#0f172a',
  },
  {
    name: 'Obsidian & Bronze',
    primary: '#121212',
    accent: '#cd7f32',
    background: '#fafaf9',
    foreground: '#1c1917',
  },
  {
    name: 'Slate & Rust',
    primary: '#334155',
    accent: '#c2410c',
    background: '#f8fafc',
    foreground: '#0f172a',
  },
  {
    name: 'Forest & Copper',
    primary: '#1b4332',
    accent: '#b45309',
    background: '#fcfbf7',
    foreground: '#1b2c24',
  },
  {
    name: 'Espresso & Sand',
    primary: '#2e1f16',
    accent: '#c5a880',
    background: '#fdfbf7',
    foreground: '#241912',
  },
  {
    name: 'Burgundy & Antique',
    primary: '#6b1d2f',
    accent: '#b08b5c',
    background: '#faf6f6',
    foreground: '#260a10',
  },
  {
    name: 'Steel Blue & Coral',
    primary: '#1e3d59',
    accent: '#ff6e40',
    background: '#f5f7fa',
    foreground: '#17252a',
  },
]

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTheme, setActiveTheme] = useState<string>('Emerald & Gold')
  const [customPrimary, setCustomPrimary] = useState('#0b5345')
  const [customAccent, setCustomAccent] = useState('#d4af37')

  // Apply theme variables to document root
  const applyTheme = (theme: ThemePreset) => {
    const root = document.documentElement
    
    // Standard variables
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--background', theme.background)
    root.style.setProperty('--foreground', theme.foreground)
    
    // Tailwind v4 direct color overrides
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-foreground', theme.foreground)

    // Sync state pickers
    setCustomPrimary(theme.primary)
    setCustomAccent(theme.accent)
  }

  const selectPreset = (theme: ThemePreset) => {
    setActiveTheme(theme.name)
    applyTheme(theme)
  }

  const handleCustomPrimaryChange = (color: string) => {
    setCustomPrimary(color)
    setActiveTheme('Custom')
    
    const root = document.documentElement
    root.style.setProperty('--primary', color)
    root.style.setProperty('--color-primary', color)
  }

  const handleCustomAccentChange = (color: string) => {
    setCustomAccent(color)
    setActiveTheme('Custom')
    
    const root = document.documentElement
    root.style.setProperty('--accent', color)
    root.style.setProperty('--color-accent', color)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-105 transition cursor-pointer border border-border"
        title="Test Theme Colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
      </button>

      {/* Control Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-card border border-border rounded-2xl shadow-2xl p-5 text-foreground animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary animate-spin-slow" />
              <h4 className="font-heading font-semibold text-sm tracking-wide uppercase">Theme Customizer</h4>
            </div>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
              Live Test
            </span>
          </div>

          {/* Preset Grid */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Presets (Sleek & Luxury)</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isActive = activeTheme === preset.name
                return (
                  <button
                    key={preset.name}
                    onClick={() => selectPreset(preset)}
                    className={`flex items-center gap-2 p-2 border rounded-xl text-left text-xs transition cursor-pointer ${
                      isActive 
                        ? 'border-primary bg-primary/5 font-semibold' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-white"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-white"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="truncate">{preset.name}</span>
                    {isActive && <Check className="w-3 h-3 text-primary ml-auto shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Custom Colors</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Primary Theme Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">{customPrimary}</span>
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer overflow-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Accent / Hover Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">{customAccent}</span>
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => handleCustomAccentChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-[9px] text-muted-foreground text-center mt-4 border-t border-border/50 pt-2">
            Tip: Pick any custom hex to test live on CellKore.
          </div>
        </div>
      )}
    </div>
  )
}
