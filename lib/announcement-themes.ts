export interface AnnouncementThemeOption {
	id: string
	name: string
	className: string
	previewCss: string
	dotColor: string
	textColor: string
	badgeText?: string
}

export const ANNOUNCEMENT_THEMES: AnnouncementThemeOption[] = [
	{
		id: 'black-green-gradient',
		name: '1. Onyx Black to Logo Green (Signature Gradient)',
		className: 'bg-gradient-to-r from-[#090d0a] via-[#142b1a] to-[#599161] text-white border-b border-[#599161]/60 font-semibold',
		previewCss: 'linear-gradient(135deg, #090d0a 0%, #142b1a 50%, #599161 100%)',
		dotColor: '#599161',
		textColor: 'text-white',
		badgeText: 'Black & Green',
	},
	{
		id: 'logo-green-solid',
		name: '2. CellKore Logo Green (Solid)',
		className: 'bg-[#599161] text-white border-b border-[#46754e] font-semibold',
		previewCss: '#599161',
		dotColor: '#ffffff',
		textColor: 'text-white',
		badgeText: 'Solid Green',
	},
	{
		id: 'green-to-charcoal',
		name: '3. Logo Green to Dark Charcoal (Fade Gradient)',
		className: 'bg-gradient-to-r from-[#599161] via-[#2d4a32] to-[#111111] text-white border-b border-[#599161]/50 font-semibold',
		previewCss: 'linear-gradient(135deg, #599161 0%, #2d4a32 50%, #111111 100%)',
		dotColor: '#599161',
		textColor: 'text-white',
		badgeText: 'Green to Charcoal',
	},
	{
		id: 'jet-black-green-glow',
		name: '4. Jet Black with Logo Green Text Glow',
		className: 'bg-gradient-to-r from-[#070a08] via-[#0f1811] to-[#070a08] text-[#599161] border-b border-[#599161]/50 font-extrabold shadow-inner',
		previewCss: 'linear-gradient(135deg, #070a08 0%, #0f1811 50%, #070a08 100%)',
		dotColor: '#599161',
		textColor: 'text-[#599161]',
		badgeText: 'Logo Green Text',
	},
	{
		id: 'obsidian-emerald-gradient',
		name: '5. Obsidian Dark to Forest Emerald (Gradient)',
		className: 'bg-gradient-to-r from-[#090b09] via-[#0f2617] to-[#064e3b] text-[#6ee7b7] border-b border-[#059669]/40 font-semibold',
		previewCss: 'linear-gradient(135deg, #090b09 0%, #0f2617 50%, #064e3b 100%)',
		dotColor: '#6ee7b7',
		textColor: 'text-[#6ee7b7]',
		badgeText: 'Mint Glow',
	},
	{
		id: 'black-champagne-gold',
		name: '6. Dark Onyx & Metallic Champagne Gold',
		className: 'bg-gradient-to-r from-[#0f0f11] via-[#1c1917] to-[#78350f] text-amber-200 border-b border-amber-600/40 font-semibold',
		previewCss: 'linear-gradient(135deg, #0f0f11 0%, #1c1917 50%, #78350f 100%)',
		dotColor: '#f59e0b',
		textColor: 'text-amber-200',
		badgeText: 'Champagne Gold',
	},
	{
		id: 'dark-onyx-green-accent',
		name: '7. Dark Onyx with Solid Logo Green Border',
		className: 'bg-[#0d110e] text-white border-b-2 border-[#599161] font-semibold',
		previewCss: 'linear-gradient(135deg, #0d110e 0%, #171f19 100%)',
		dotColor: '#599161',
		textColor: 'text-white',
		badgeText: 'Onyx & Green Border',
	},
	{
		id: 'midnight-cyber-teal',
		name: '8. Midnight Cyber Teal & Deep Emerald',
		className: 'bg-gradient-to-r from-[#042f2e] via-[#064e3b] to-[#0b1c11] text-[#2dd4bf] border-b border-teal-500/40 font-semibold',
		previewCss: 'linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #0b1c11 100%)',
		dotColor: '#2dd4bf',
		textColor: 'text-[#2dd4bf]',
		badgeText: 'Cyber Teal',
	},
	{
		id: 'rich-velvet-emerald',
		name: '9. Rich Velvet Emerald (Deep Green)',
		className: 'bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-emerald-100 border-b border-emerald-500/40 font-semibold',
		previewCss: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
		dotColor: '#34d399',
		textColor: 'text-emerald-100',
		badgeText: 'Velvet Emerald',
	},
	{
		id: 'titanium-platinum-black',
		name: '10. Deep Titanium Black & Silver Platinum',
		className: 'bg-gradient-to-r from-[#0a0a0a] via-[#171717] to-[#262626] text-zinc-100 border-b border-zinc-700 font-semibold',
		previewCss: 'linear-gradient(135deg, #0a0a0a 0%, #171717 50%, #262626 100%)',
		dotColor: '#e4e4e7',
		textColor: 'text-zinc-100',
		badgeText: 'Titanium Silver',
	},
	{
		id: 'logo-green-gold-gradient',
		name: '11. Logo Green to Metallic Amber Gold',
		className: 'bg-gradient-to-r from-[#599161] via-[#3f6b45] to-[#78350f] text-white border-b border-amber-500/40 font-semibold',
		previewCss: 'linear-gradient(135deg, #599161 0%, #3f6b45 50%, #78350f 100%)',
		dotColor: '#fbbf24',
		textColor: 'text-white',
		badgeText: 'Green & Gold',
	},
	{
		id: 'pure-midnight-dark',
		name: '12. Pure Midnight Black (Solid)',
		className: 'bg-[#0a0c0a] text-zinc-100 border-b border-zinc-800 font-semibold',
		previewCss: '#0a0c0a',
		dotColor: '#ffffff',
		textColor: 'text-zinc-100',
		badgeText: 'Pure Midnight',
	},
]

export const DEFAULT_ANNOUNCEMENT_THEME_ID = 'green-to-charcoal'

export function getAnnouncementTheme(themeId: string | null | undefined): AnnouncementThemeOption {
	const found = ANNOUNCEMENT_THEMES.find((t) => t.id === themeId)
	return found ?? ANNOUNCEMENT_THEMES.find((t) => t.id === 'green-to-charcoal') ?? ANNOUNCEMENT_THEMES[0]
}
