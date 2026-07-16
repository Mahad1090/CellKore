'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

interface Country {
  code: string
  name: string
  dialCode: string
  pattern: RegExp
}

export function SignUpForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  const countries: Country[] = [
    { code: 'AF', name: 'Afghanistan', dialCode: '+93', pattern: /^\d{9}$/ },
    { code: 'AL', name: 'Albania', dialCode: '+355', pattern: /^\d{9}$/ },
    { code: 'DZ', name: 'Algeria', dialCode: '+213', pattern: /^\d{9}$/ },
    { code: 'AD', name: 'Andorra', dialCode: '+376', pattern: /^\d{6}$/ },
    { code: 'AO', name: 'Angola', dialCode: '+244', pattern: /^\d{9}$/ },
    { code: 'AG', name: 'Antigua and Barbuda', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'AR', name: 'Argentina', dialCode: '+54', pattern: /^\d{10}$/ },
    { code: 'AM', name: 'Armenia', dialCode: '+374', pattern: /^\d{8}$/ },
    { code: 'AU', name: 'Australia', dialCode: '+61', pattern: /^\d{9,10}$/ },
    { code: 'AT', name: 'Austria', dialCode: '+43', pattern: /^\d{9,10}$/ },
    { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', pattern: /^\d{9}$/ },
    { code: 'BS', name: 'Bahamas', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'BH', name: 'Bahrain', dialCode: '+973', pattern: /^\d{8}$/ },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', pattern: /^\d{10}$/ },
    { code: 'BB', name: 'Barbados', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'BY', name: 'Belarus', dialCode: '+375', pattern: /^\d{9}$/ },
    { code: 'BE', name: 'Belgium', dialCode: '+32', pattern: /^\d{9}$/ },
    { code: 'BZ', name: 'Belize', dialCode: '+501', pattern: /^\d{7}$/ },
    { code: 'BJ', name: 'Benin', dialCode: '+229', pattern: /^\d{8}$/ },
    { code: 'BT', name: 'Bhutan', dialCode: '+975', pattern: /^\d{8}$/ },
    { code: 'BO', name: 'Bolivia', dialCode: '+591', pattern: /^\d{8}$/ },
    { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', pattern: /^\d{8,9}$/ },
    { code: 'BW', name: 'Botswana', dialCode: '+267', pattern: /^\d{7,8}$/ },
    { code: 'BR', name: 'Brazil', dialCode: '+55', pattern: /^\d{10,11}$/ },
    { code: 'BN', name: 'Brunei', dialCode: '+673', pattern: /^\d{7}$/ },
    { code: 'BG', name: 'Bulgaria', dialCode: '+359', pattern: /^\d{9}$/ },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226', pattern: /^\d{8}$/ },
    { code: 'BI', name: 'Burundi', dialCode: '+257', pattern: /^\d{8}$/ },
    { code: 'KH', name: 'Cambodia', dialCode: '+855', pattern: /^\d{8,9}$/ },
    { code: 'CM', name: 'Cameroon', dialCode: '+237', pattern: /^\d{9}$/ },
    { code: 'CA', name: 'Canada', dialCode: '+1', pattern: /^\d{10}$/ },
    { code: 'CV', name: 'Cape Verde', dialCode: '+238', pattern: /^\d{7}$/ },
    { code: 'KY', name: 'Cayman Islands', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'CF', name: 'Central African Republic', dialCode: '+236', pattern: /^\d{8}$/ },
    { code: 'TD', name: 'Chad', dialCode: '+235', pattern: /^\d{9}$/ },
    { code: 'CL', name: 'Chile', dialCode: '+56', pattern: /^\d{9}$/ },
    { code: 'CN', name: 'China', dialCode: '+86', pattern: /^\d{11}$/ },
    { code: 'CO', name: 'Colombia', dialCode: '+57', pattern: /^\d{10}$/ },
    { code: 'KM', name: 'Comoros', dialCode: '+269', pattern: /^\d{7}$/ },
    { code: 'CG', name: 'Congo', dialCode: '+242', pattern: /^\d{9}$/ },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506', pattern: /^\d{8}$/ },
    { code: 'HR', name: 'Croatia', dialCode: '+385', pattern: /^\d{9}$/ },
    { code: 'CU', name: 'Cuba', dialCode: '+53', pattern: /^\d{8}$/ },
    { code: 'CY', name: 'Cyprus', dialCode: '+357', pattern: /^\d{8}$/ },
    { code: 'CZ', name: 'Czech Republic', dialCode: '+420', pattern: /^\d{9}$/ },
    { code: 'DK', name: 'Denmark', dialCode: '+45', pattern: /^\d{8}$/ },
    { code: 'DJ', name: 'Djibouti', dialCode: '+253', pattern: /^\d{8}$/ },
    { code: 'DM', name: 'Dominica', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'DO', name: 'Dominican Republic', dialCode: '+1', pattern: /^\d{10}$/ },
    { code: 'EC', name: 'Ecuador', dialCode: '+593', pattern: /^\d{9}$/ },
    { code: 'EG', name: 'Egypt', dialCode: '+20', pattern: /^\d{10}$/ },
    { code: 'SV', name: 'El Salvador', dialCode: '+503', pattern: /^\d{8}$/ },
    { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', pattern: /^\d{9}$/ },
    { code: 'ER', name: 'Eritrea', dialCode: '+291', pattern: /^\d{7}$/ },
    { code: 'EE', name: 'Estonia', dialCode: '+372', pattern: /^\d{7,8}$/ },
    { code: 'ET', name: 'Ethiopia', dialCode: '+251', pattern: /^\d{9}$/ },
    { code: 'FJ', name: 'Fiji', dialCode: '+679', pattern: /^\d{7}$/ },
    { code: 'FI', name: 'Finland', dialCode: '+358', pattern: /^\d{9,10}$/ },
    { code: 'FR', name: 'France', dialCode: '+33', pattern: /^\d{9}$/ },
    { code: 'GA', name: 'Gabon', dialCode: '+241', pattern: /^\d{9}$/ },
    { code: 'GM', name: 'Gambia', dialCode: '+220', pattern: /^\d{7}$/ },
    { code: 'GE', name: 'Georgia', dialCode: '+995', pattern: /^\d{9}$/ },
    { code: 'DE', name: 'Germany', dialCode: '+49', pattern: /^\d{10,11}$/ },
    { code: 'GH', name: 'Ghana', dialCode: '+233', pattern: /^\d{9}$/ },
    { code: 'GR', name: 'Greece', dialCode: '+30', pattern: /^\d{10}$/ },
    { code: 'GD', name: 'Grenada', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'GT', name: 'Guatemala', dialCode: '+502', pattern: /^\d{8}$/ },
    { code: 'GN', name: 'Guinea', dialCode: '+224', pattern: /^\d{8}$/ },
    { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', pattern: /^\d{7}$/ },
    { code: 'GY', name: 'Guyana', dialCode: '+592', pattern: /^\d{7}$/ },
    { code: 'HT', name: 'Haiti', dialCode: '+509', pattern: /^\d{8}$/ },
    { code: 'HN', name: 'Honduras', dialCode: '+504', pattern: /^\d{8}$/ },
    { code: 'HK', name: 'Hong Kong', dialCode: '+852', pattern: /^\d{8}$/ },
    { code: 'HU', name: 'Hungary', dialCode: '+36', pattern: /^\d{9}$/ },
    { code: 'IS', name: 'Iceland', dialCode: '+354', pattern: /^\d{7,9}$/ },
    { code: 'IN', name: 'India', dialCode: '+91', pattern: /^\d{10}$/ },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', pattern: /^\d{9,12}$/ },
    { code: 'IR', name: 'Iran', dialCode: '+98', pattern: /^\d{10}$/ },
    { code: 'IQ', name: 'Iraq', dialCode: '+964', pattern: /^\d{10}$/ },
    { code: 'IE', name: 'Ireland', dialCode: '+353', pattern: /^\d{9}$/ },
    { code: 'IL', name: 'Israel', dialCode: '+972', pattern: /^\d{9}$/ },
    { code: 'IT', name: 'Italy', dialCode: '+39', pattern: /^\d{9,11}$/ },
    { code: 'JM', name: 'Jamaica', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'JP', name: 'Japan', dialCode: '+81', pattern: /^\d{10,11}$/ },
    { code: 'JO', name: 'Jordan', dialCode: '+962', pattern: /^\d{9}$/ },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', pattern: /^\d{10}$/ },
    { code: 'KE', name: 'Kenya', dialCode: '+254', pattern: /^\d{9}$/ },
    { code: 'KI', name: 'Kiribati', dialCode: '+686', pattern: /^\d{5}$/ },
    { code: 'KP', name: 'North Korea', dialCode: '+850', pattern: /^\d{10}$/ },
    { code: 'KR', name: 'South Korea', dialCode: '+82', pattern: /^\d{9,11}$/ },
    { code: 'KW', name: 'Kuwait', dialCode: '+965', pattern: /^\d{8}$/ },
    { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', pattern: /^\d{9}$/ },
    { code: 'LA', name: 'Laos', dialCode: '+856', pattern: /^\d{9,10}$/ },
    { code: 'LV', name: 'Latvia', dialCode: '+371', pattern: /^\d{8}$/ },
    { code: 'LB', name: 'Lebanon', dialCode: '+961', pattern: /^\d{7,8}$/ },
    { code: 'LS', name: 'Lesotho', dialCode: '+266', pattern: /^\d{8}$/ },
    { code: 'LR', name: 'Liberia', dialCode: '+231', pattern: /^\d{8}$/ },
    { code: 'LY', name: 'Libya', dialCode: '+218', pattern: /^\d{9}$/ },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423', pattern: /^\d{7}$/ },
    { code: 'LT', name: 'Lithuania', dialCode: '+370', pattern: /^\d{8}$/ },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352', pattern: /^\d{8,9}$/ },
    { code: 'MG', name: 'Madagascar', dialCode: '+261', pattern: /^\d{9}$/ },
    { code: 'MW', name: 'Malawi', dialCode: '+265', pattern: /^\d{9}$/ },
    { code: 'MY', name: 'Malaysia', dialCode: '+60', pattern: /^\d{9,10}$/ },
    { code: 'MV', name: 'Maldives', dialCode: '+960', pattern: /^\d{7}$/ },
    { code: 'ML', name: 'Mali', dialCode: '+223', pattern: /^\d{8}$/ },
    { code: 'MT', name: 'Malta', dialCode: '+356', pattern: /^\d{8}$/ },
    { code: 'MH', name: 'Marshall Islands', dialCode: '+692', pattern: /^\d{7}$/ },
    { code: 'MR', name: 'Mauritania', dialCode: '+222', pattern: /^\d{8}$/ },
    { code: 'MU', name: 'Mauritius', dialCode: '+230', pattern: /^\d{7,8}$/ },
    { code: 'MX', name: 'Mexico', dialCode: '+52', pattern: /^\d{10}$/ },
    { code: 'FM', name: 'Micronesia', dialCode: '+691', pattern: /^\d{7}$/ },
    { code: 'MD', name: 'Moldova', dialCode: '+373', pattern: /^\d{8}$/ },
    { code: 'MC', name: 'Monaco', dialCode: '+377', pattern: /^\d{8,9}$/ },
    { code: 'MN', name: 'Mongolia', dialCode: '+976', pattern: /^\d{8}$/ },
    { code: 'ME', name: 'Montenegro', dialCode: '+382', pattern: /^\d{8,9}$/ },
    { code: 'MA', name: 'Morocco', dialCode: '+212', pattern: /^\d{9}$/ },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258', pattern: /^\d{9}$/ },
    { code: 'MM', name: 'Myanmar', dialCode: '+95', pattern: /^\d{9,10}$/ },
    { code: 'NA', name: 'Namibia', dialCode: '+264', pattern: /^\d{9}$/ },
    { code: 'NR', name: 'Nauru', dialCode: '+674', pattern: /^\d{7}$/ },
    { code: 'NP', name: 'Nepal', dialCode: '+977', pattern: /^\d{10}$/ },
    { code: 'NL', name: 'Netherlands', dialCode: '+31', pattern: /^\d{9}$/ },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', pattern: /^\d{9,10}$/ },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505', pattern: /^\d{8}$/ },
    { code: 'NE', name: 'Niger', dialCode: '+227', pattern: /^\d{8}$/ },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', pattern: /^\d{10}$/ },
    { code: 'NO', name: 'Norway', dialCode: '+47', pattern: /^\d{8}$/ },
    { code: 'OM', name: 'Oman', dialCode: '+968', pattern: /^\d{8}$/ },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', pattern: /^\d{10}$/ },
    { code: 'PW', name: 'Palau', dialCode: '+680', pattern: /^\d{7}$/ },
    { code: 'PA', name: 'Panama', dialCode: '+507', pattern: /^\d{7,8}$/ },
    { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', pattern: /^\d{7,8}$/ },
    { code: 'PY', name: 'Paraguay', dialCode: '+595', pattern: /^\d{9}$/ },
    { code: 'PE', name: 'Peru', dialCode: '+51', pattern: /^\d{9}$/ },
    { code: 'PH', name: 'Philippines', dialCode: '+63', pattern: /^\d{10}$/ },
    { code: 'PL', name: 'Poland', dialCode: '+48', pattern: /^\d{9}$/ },
    { code: 'PT', name: 'Portugal', dialCode: '+351', pattern: /^\d{9}$/ },
    { code: 'PR', name: 'Puerto Rico', dialCode: '+1', pattern: /^\d{10}$/ },
    { code: 'QA', name: 'Qatar', dialCode: '+974', pattern: /^\d{8}$/ },
    { code: 'RO', name: 'Romania', dialCode: '+40', pattern: /^\d{9}$/ },
    { code: 'RU', name: 'Russia', dialCode: '+7', pattern: /^\d{10}$/ },
    { code: 'RW', name: 'Rwanda', dialCode: '+250', pattern: /^\d{9}$/ },
    { code: 'KN', name: 'Saint Kitts', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'LC', name: 'Saint Lucia', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'VC', name: 'Saint Vincent', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'WS', name: 'Samoa', dialCode: '+685', pattern: /^\d{7}$/ },
    { code: 'SM', name: 'San Marino', dialCode: '+378', pattern: /^\d{10}$/ },
    { code: 'ST', name: 'Sao Tome and Principe', dialCode: '+239', pattern: /^\d{7}$/ },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', pattern: /^\d{9}$/ },
    { code: 'SN', name: 'Senegal', dialCode: '+221', pattern: /^\d{9}$/ },
    { code: 'RS', name: 'Serbia', dialCode: '+381', pattern: /^\d{8,12}$/ },
    { code: 'SC', name: 'Seychelles', dialCode: '+248', pattern: /^\d{7}$/ },
    { code: 'SL', name: 'Sierra Leone', dialCode: '+232', pattern: /^\d{8}$/ },
    { code: 'SG', name: 'Singapore', dialCode: '+65', pattern: /^\d{8}$/ },
    { code: 'SK', name: 'Slovakia', dialCode: '+421', pattern: /^\d{9}$/ },
    { code: 'SI', name: 'Slovenia', dialCode: '+386', pattern: /^\d{8,9}$/ },
    { code: 'SB', name: 'Solomon Islands', dialCode: '+677', pattern: /^\d{7}$/ },
    { code: 'SO', name: 'Somalia', dialCode: '+252', pattern: /^\d{8,9}$/ },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', pattern: /^\d{9}$/ },
    { code: 'ES', name: 'Spain', dialCode: '+34', pattern: /^\d{9}$/ },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', pattern: /^\d{9}$/ },
    { code: 'SD', name: 'Sudan', dialCode: '+249', pattern: /^\d{9}$/ },
    { code: 'SR', name: 'Suriname', dialCode: '+597', pattern: /^\d{6,7}$/ },
    { code: 'SZ', name: 'Swaziland', dialCode: '+268', pattern: /^\d{8}$/ },
    { code: 'SE', name: 'Sweden', dialCode: '+46', pattern: /^\d{9}$/ },
    { code: 'CH', name: 'Switzerland', dialCode: '+41', pattern: /^\d{9}$/ },
    { code: 'SY', name: 'Syria', dialCode: '+963', pattern: /^\d{9}$/ },
    { code: 'TW', name: 'Taiwan', dialCode: '+886', pattern: /^\d{9}$/ },
    { code: 'TJ', name: 'Tajikistan', dialCode: '+992', pattern: /^\d{9}$/ },
    { code: 'TZ', name: 'Tanzania', dialCode: '+255', pattern: /^\d{9}$/ },
    { code: 'TH', name: 'Thailand', dialCode: '+66', pattern: /^\d{9}$/ },
    { code: 'TL', name: 'Timor-Leste', dialCode: '+670', pattern: /^\d{7}$/ },
    { code: 'TG', name: 'Togo', dialCode: '+228', pattern: /^\d{8}$/ },
    { code: 'TO', name: 'Tonga', dialCode: '+676', pattern: /^\d{5,7}$/ },
    { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1', pattern: /^\d{7}$/ },
    { code: 'TN', name: 'Tunisia', dialCode: '+216', pattern: /^\d{8}$/ },
    { code: 'TR', name: 'Turkey', dialCode: '+90', pattern: /^\d{10}$/ },
    { code: 'TM', name: 'Turkmenistan', dialCode: '+993', pattern: /^\d{8}$/ },
    { code: 'TV', name: 'Tuvalu', dialCode: '+688', pattern: /^\d{5}$/ },
    { code: 'UG', name: 'Uganda', dialCode: '+256', pattern: /^\d{9}$/ },
    { code: 'UA', name: 'Ukraine', dialCode: '+380', pattern: /^\d{9}$/ },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', pattern: /^\d{9}$/ },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', pattern: /^\d{10,11}$/ },
    { code: 'US', name: 'United States', dialCode: '+1', pattern: /^\d{10}$/ },
    { code: 'UY', name: 'Uruguay', dialCode: '+598', pattern: /^\d{8}$/ },
    { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', pattern: /^\d{9}$/ },
    { code: 'VU', name: 'Vanuatu', dialCode: '+678', pattern: /^\d{7}$/ },
    { code: 'VE', name: 'Venezuela', dialCode: '+58', pattern: /^\d{10}$/ },
    { code: 'VN', name: 'Vietnam', dialCode: '+84', pattern: /^\d{9,10}$/ },
    { code: 'YE', name: 'Yemen', dialCode: '+967', pattern: /^\d{9}$/ },
    { code: 'ZM', name: 'Zambia', dialCode: '+260', pattern: /^\d{9}$/ },
    { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', pattern: /^\d{9}$/ },
  ].sort((a, b) => a.name.localeCompare(b.name))

  const validatePhone = (phone: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (!country) return false
    return country.pattern.test(phone.replace(/\D/g, ''))
  }

  const detectCountryFromPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    for (const country of countries) {
      if (cleanPhone.startsWith(country.dialCode.replace(/\D/g, ''))) {
        setCountry(country.code)
        return
      }
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhone(value)
    detectCountryFromPhone(value)
  }

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!validatePhone(phone, country)) {
      setError('Invalid phone number format for selected country')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password, fullName, phone, country)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 max-w-md mx-auto shadow-lg">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Check your email</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          We've sent a confirmation link to your email address. Please click the link to complete your registration.
        </p>
        <Link href="/auth/signin">
          <Button className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all">
            Go to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 max-w-md mx-auto shadow-lg">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Create Account</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Join CellKore today</p>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
            placeholder="••••••••"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-light">
            Must be at least 6 characters
          </p>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {getFlagEmoji(c.code)} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 py-3 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm">
              {countries.find(c => c.code === country)?.dialCode}
            </span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              required
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-r-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
              placeholder="1234567890"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-light">
            Format: {countries.find(c => c.code === country)?.name}
          </p>
        </div>

        <Button type="submit" className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-primary hover:text-accent hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
