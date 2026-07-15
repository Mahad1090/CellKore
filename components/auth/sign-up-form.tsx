'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

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

  const countries = [
    { code: 'AF', name: 'Afghanistan', dialCode: '+93', pattern: /^\d{9}$/, flag: '🇦🇫' },
    { code: 'AL', name: 'Albania', dialCode: '+355', pattern: /^\d{9}$/, flag: '🇦🇱' },
    { code: 'DZ', name: 'Algeria', dialCode: '+213', pattern: /^\d{9}$/, flag: '��' },
    { code: 'AD', name: 'Andorra', dialCode: '+376', pattern: /^\d{6}$/, flag: '🇦🇩' },
    { code: 'AO', name: 'Angola', dialCode: '+244', pattern: /^\d{9}$/, flag: '🇴' },
    { code: 'AG', name: 'Antigua and Barbuda', dialCode: '+1', pattern: /^\d{7}$/, flag: '🇦🇬' },
    { code: 'AR', name: 'Argentina', dialCode: '+54', pattern: /^\d{10}$/, flag: '🇦🇷' },
    { code: 'AM', name: 'Armenia', dialCode: '+374', pattern: /^\d{8}$/, flag: '��' },
    { code: 'AU', name: 'Australia', dialCode: '+61', pattern: /^\d{9,10}$/, flag: '🇦🇺' },
    { code: 'AT', name: 'Austria', dialCode: '+43', pattern: /^\d{9,10}$/, flag: '��' },
    { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', pattern: /^\d{9}$/, flag: '��' },
    { code: 'BS', name: 'Bahamas', dialCode: '+1', pattern: /^\d{7}$/, flag: '��' },
    { code: 'BH', name: 'Bahrain', dialCode: '+973', pattern: /^\d{8}$/, flag: '��' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', pattern: /^\d{10}$/, flag: '��' },
    { code: 'BB', name: 'Barbados', dialCode: '+1', pattern: /^\d{7}$/, flag: '🇧�' },
    { code: 'BY', name: 'Belarus', dialCode: '+375', pattern: /^\d{9}$/, flag: '��' },
    { code: 'BE', name: 'Belgium', dialCode: '+32', pattern: /^\d{9}$/, flag: '��' },
    { code: 'BZ', name: 'Belize', dialCode: '+501', pattern: /^\d{7}$/, flag: '��' },
    { code: 'BJ', name: 'Benin', dialCode: '+229', pattern: /^\d{8}$/, flag: '🇧🇯' },
    { code: 'BT', name: 'Bhutan', dialCode: '+975', pattern: /^\d{8}$/, flag: '��' },
    { code: 'BO', name: 'Bolivia', dialCode: '+591', pattern: /^\d{8}$/, flag: '��' },
    { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', pattern: /^\d{8,9}$/, flag: '�🇦' },
    { code: 'BW', name: 'Botswana', dialCode: '+267', pattern: /^\d{7,8}$/, flag: '��' },
    { code: 'BR', name: 'Brazil', dialCode: '+55', pattern: /^\d{10,11}$/, flag: '��' },
    { code: 'BN', name: 'Brunei', dialCode: '+673', pattern: /^\d{7}$/, flag: '��' },
    { code: 'BG', name: 'Bulgaria', dialCode: '+359', pattern: /^\d{9}$/, flag: '��' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226', pattern: /^\d{8}$/, flag: '🇧🇫' },
    { code: 'BI', name: 'Burundi', dialCode: '+257', pattern: /^\d{8}$/, flag: '�🇮' },
    { code: 'KH', name: 'Cambodia', dialCode: '+855', pattern: /^\d{8,9}$/, flag: '��' },
    { code: 'CM', name: 'Cameroon', dialCode: '+237', pattern: /^\d{9}$/, flag: '��' },
    { code: 'CA', name: 'Canada', dialCode: '+1', pattern: /^\d{10}$/, flag: '�🇦' },
    { code: 'CV', name: 'Cape Verde', dialCode: '+238', pattern: /^\d{7}$/, flag: '��' },
    { code: 'KY', name: 'Cayman Islands', dialCode: '+1', pattern: /^\d{7}$/, flag: '��' },
    { code: 'CF', name: 'Central African Republic', dialCode: '+236', pattern: /^\d{8}$/, flag: '��' },
    { code: 'TD', name: 'Chad', dialCode: '+235', pattern: /^\d{9}$/, flag: '��' },
    { code: 'CL', name: 'Chile', dialCode: '+56', pattern: /^\d{9}$/, flag: '��' },
    { code: 'CN', name: 'China', dialCode: '+86', pattern: /^\d{11}$/, flag: '🇨�' },
    { code: 'CO', name: 'Colombia', dialCode: '+57', pattern: /^\d{10}$/, flag: '🇨🇴' },
    { code: 'KM', name: 'Comoros', dialCode: '+269', pattern: /^\d{7}$/, flag: '��' },
    { code: 'CG', name: 'Congo', dialCode: '+242', pattern: /^\d{9}$/, flag: '🇨🇬' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506', pattern: /^\d{8}$/, flag: '��' },
    { code: 'HR', name: 'Croatia', dialCode: '+385', pattern: /^\d{9}$/, flag: '��' },
    { code: 'CU', name: 'Cuba', dialCode: '+53', pattern: /^\d{8}$/, flag: '🇨🇺' },
    { code: 'CY', name: 'Cyprus', dialCode: '+357', pattern: /^\d{8}$/, flag: '��' },
    { code: 'CZ', name: 'Czech Republic', dialCode: '+420', pattern: /^\d{9}$/, flag: '��' },
    { code: 'DK', name: 'Denmark', dialCode: '+45', pattern: /^\d{8}$/, flag: '��' },
    { code: 'DJ', name: 'Djibouti', dialCode: '+253', pattern: /^\d{8}$/, flag: '🇩🇯' },
    { code: 'DM', name: 'Dominica', dialCode: '+1', pattern: /^\d{7}$/, flag: '🇩🇲' },
    { code: 'DO', name: 'Dominican Republic', dialCode: '+1', pattern: /^\d{10}$/, flag: '��' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593', pattern: /^\d{9}$/, flag: '🇪🇨' },
    { code: 'EG', name: 'Egypt', dialCode: '+20', pattern: /^\d{10}$/, flag: '��' },
    { code: 'SV', name: 'El Salvador', dialCode: '+503', pattern: /^\d{8}$/, flag: '��' },
    { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', pattern: /^\d{9}$/, flag: '��' },
    { code: 'ER', name: 'Eritrea', dialCode: '+291', pattern: /^\d{7}$/, flag: '��' },
    { code: 'EE', name: 'Estonia', dialCode: '+372', pattern: /^\d{7,8}$/, flag: '��' },
    { code: 'ET', name: 'Ethiopia', dialCode: '+251', pattern: /^\d{9}$/, flag: '🇪🇹' },
    { code: 'FJ', name: 'Fiji', dialCode: '+679', pattern: /^\d{7}$/, flag: '��' },
    { code: 'FI', name: 'Finland', dialCode: '+358', pattern: /^\d{9,10}$/, flag: '��' },
    { code: 'FR', name: 'France', dialCode: '+33', pattern: /^\d{9}$/, flag: '🇫🇷' },
    { code: 'GA', name: 'Gabon', dialCode: '+241', pattern: /^\d{9}$/, flag: '��' },
    { code: 'GM', name: 'Gambia', dialCode: '+220', pattern: /^\d{7}$/, flag: '��' },
    { code: 'GE', name: 'Georgia', dialCode: '+995', pattern: /^\d{9}$/, flag: '🇬🇪' },
    { code: 'DE', name: 'Germany', dialCode: '+49', pattern: /^\d{10,11}$/, flag: '��' },
    { code: 'GH', name: 'Ghana', dialCode: '+233', pattern: /^\d{9}$/, flag: '��' },
    { code: 'GR', name: 'Greece', dialCode: '+30', pattern: /^\d{10}$/, flag: '🇬🇷' },
    { code: 'GD', name: 'Grenada', dialCode: '+1', pattern: /^\d{7}$/, flag: '��' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502', pattern: /^\d{8}$/, flag: '��' },
    { code: 'GN', name: 'Guinea', dialCode: '+224', pattern: /^\d{8}$/, flag: '��' },
    { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', pattern: /^\d{7}$/, flag: '��' },
    { code: 'GY', name: 'Guyana', dialCode: '+592', pattern: /^\d{7}$/, flag: '��' },
    { code: 'HT', name: 'Haiti', dialCode: '+509', pattern: /^\d{8}$/, flag: '��' },
    { code: 'HN', name: 'Honduras', dialCode: '+504', pattern: /^\d{8}$/, flag: '🇭🇳' },
    { code: 'HK', name: 'Hong Kong', dialCode: '+852', pattern: /^\d{8}$/, flag: '��' },
    { code: 'HU', name: 'Hungary', dialCode: '+36', pattern: /^\d{9}$/, flag: '🇭🇺' },
    { code: 'IS', name: 'Iceland', dialCode: '+354', pattern: /^\d{7,9}$/, flag: '��' },
    { code: 'IN', name: 'India', dialCode: '+91', pattern: /^\d{10}$/, flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', pattern: /^\d{9,12}$/, flag: '��' },
    { code: 'IR', name: 'Iran', dialCode: '+98', pattern: /^\d{10}$/, flag: '🇮🇷' },
    { code: 'IQ', name: 'Iraq', dialCode: '+964', pattern: /^\d{10}$/, flag: '🇮🇶' },
    { code: 'IE', name: 'Ireland', dialCode: '+353', pattern: /^\d{9}$/, flag: '��' },
    { code: 'IL', name: 'Israel', dialCode: '+972', pattern: /^\d{9}$/, flag: '🇮🇱' },
    { code: 'IT', name: 'Italy', dialCode: '+39', pattern: /^\d{9,11}$/, flag: '🇹' },
    { code: 'JM', name: 'Jamaica', dialCode: '+1', pattern: /^\d{7}$/, flag: '��' },
    { code: 'JP', name: 'Japan', dialCode: '+81', pattern: /^\d{10,11}$/, flag: '��' },
    { code: 'JO', name: 'Jordan', dialCode: '+962', pattern: /^\d{9}$/, flag: '��' },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', pattern: /^\d{10}$/, flag: '🇰🇿' },
    { code: 'KE', name: 'Kenya', dialCode: '+254', pattern: /^\d{9}$/, flag: '🇰🇪' },
    { code: 'KI', name: 'Kiribati', dialCode: '+686', pattern: /^\d{5}$/, flag: '��' },
    { code: 'KP', name: 'North Korea', dialCode: '+850', pattern: /^\d{10}$/, flag: '🇰🇵' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', pattern: /^\d{9,11}$/, flag: '🇰🇷' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965', pattern: /^\d{8}$/, flag: '��' },
    { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', pattern: /^\d{9}$/, flag: '��' },
    { code: 'LA', name: 'Laos', dialCode: '+856', pattern: /^\d{9,10}$/, flag: '��' },
    { code: 'LV', name: 'Latvia', dialCode: '+371', pattern: /^\d{8}$/, flag: '��' },
    { code: 'LB', name: 'Lebanon', dialCode: '+961', pattern: /^\d{7,8}$/, flag: '🇱🇧' },
    { code: 'LS', name: 'Lesotho', dialCode: '+266', pattern: /^\d{8}$/, flag: '🇱🇸' },
    { code: 'LR', name: 'Liberia', dialCode: '+231', pattern: /^\d{8}$/, flag: '��' },
    { code: 'LY', name: 'Libya', dialCode: '+218', pattern: /^\d{9}$/, flag: '��' },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423', pattern: /^\d{7}$/, flag: '��' },
    { code: 'LT', name: 'Lithuania', dialCode: '+370', pattern: /^\d{8}$/, flag: '��' },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352', pattern: /^\d{8,9}$/, flag: '��' },
    { code: 'MG', name: 'Madagascar', dialCode: '+261', pattern: /^\d{9}$/, flag: '🇲�' },
    { code: 'MW', name: 'Malawi', dialCode: '+265', pattern: /^\d{9}$/, flag: '��' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60', pattern: /^\d{9,10}$/, flag: '��' },
    { code: 'MV', name: 'Maldives', dialCode: '+960', pattern: /^\d{7}$/, flag: '��' },
    { code: 'ML', name: 'Mali', dialCode: '+223', pattern: /^\d{8}$/, flag: '��' },
    { code: 'MT', name: 'Malta', dialCode: '+356', pattern: /^\d{8}$/, flag: '�🇹' },
    { code: 'MH', name: 'Marshall Islands', dialCode: '+692', pattern: /^\d{7}$/, flag: '�🇭' },
    { code: 'MR', name: 'Mauritania', dialCode: '+222', pattern: /^\d{8}$/, flag: '��' },
    { code: 'MU', name: 'Mauritius', dialCode: '+230', pattern: /^\d{7,8}$/, flag: '🇲🇺' },
    { code: 'MX', name: 'Mexico', dialCode: '+52', pattern: /^\d{10}$/, flag: '🇲🇽' },
    { code: 'FM', name: 'Micronesia', dialCode: '+691', pattern: /^\d{7}$/, flag: '��' },
    { code: 'MD', name: 'Moldova', dialCode: '+373', pattern: /^\d{8}$/, flag: '🇲🇩' },
    { code: 'MC', name: 'Monaco', dialCode: '+377', pattern: /^\d{8,9}$/, flag: '��' },
    { code: 'MN', name: 'Mongolia', dialCode: '+976', pattern: /^\d{8}$/, flag: '🇲🇳' },
    { code: 'ME', name: 'Montenegro', dialCode: '+382', pattern: /^\d{8,9}$/, flag: '🇲🇪' },
    { code: 'MA', name: 'Morocco', dialCode: '+212', pattern: /^\d{9}$/, flag: '🇲�' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258', pattern: /^\d{9}$/, flag: '🇲🇿' },
    { code: 'MM', name: 'Myanmar', dialCode: '+95', pattern: /^\d{9,10}$/, flag: '��' },
    { code: 'NA', name: 'Namibia', dialCode: '+264', pattern: /^\d{9}$/, flag: '🇳🇦' },
    { code: 'NR', name: 'Nauru', dialCode: '+674', pattern: /^\d{7}$/, flag: '🇳🇷' },
    { code: 'NP', name: 'Nepal', dialCode: '+977', pattern: /^\d{10}$/, flag: '🇳🇵' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31', pattern: /^\d{9}$/, flag: '🇳🇱' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', pattern: /^\d{9,10}$/, flag: '��' },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505', pattern: /^\d{8}$/, flag: '🇳🇮' },
    { code: 'NE', name: 'Niger', dialCode: '+227', pattern: /^\d{8}$/, flag: '🇳🇪' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', pattern: /^\d{10}$/, flag: '�🇬' },
    { code: 'NO', name: 'Norway', dialCode: '+47', pattern: /^\d{8}$/, flag: '��' },
    { code: 'OM', name: 'Oman', dialCode: '+968', pattern: /^\d{8}$/, flag: '🇴🇲' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', pattern: /^\d{10}$/, flag: '🇵🇰' },
    { code: 'PW', name: 'Palau', dialCode: '+680', pattern: /^\d{7}$/, flag: '��' },
    { code: 'PA', name: 'Panama', dialCode: '+507', pattern: /^\d{7,8}$/, flag: '🇵🇦' },
    { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', pattern: /^\d{7,8}$/, flag: '��' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595', pattern: /^\d{9}$/, flag: '🇵🇾' },
    { code: 'PE', name: 'Peru', dialCode: '+51', pattern: /^\d{9}$/, flag: '🇵🇪' },
    { code: 'PH', name: 'Philippines', dialCode: '+63', pattern: /^\d{10}$/, flag: '🇵🇭' },
    { code: 'PL', name: 'Poland', dialCode: '+48', pattern: /^\d{9}$/, flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', dialCode: '+351', pattern: /^\d{9}$/, flag: '��' },
    { code: 'PR', name: 'Puerto Rico', dialCode: '+1', pattern: /^\d{10}$/, flag: '🇵🇷' },
    { code: 'QA', name: 'Qatar', dialCode: '+974', pattern: /^\d{8}$/, flag: '�🇦' },
    { code: 'RO', name: 'Romania', dialCode: '+40', pattern: /^\d{9}$/, flag: '🇷🇴' },
    { code: 'RU', name: 'Russia', dialCode: '+7', pattern: /^\d{10}$/, flag: '🇷🇺' },
    { code: 'RW', name: 'Rwanda', dialCode: '+250', pattern: /^\d{9}$/, flag: '🇷🇼' },
    { code: 'KN', name: 'Saint Kitts', dialCode: '+1', pattern: /^\d{7}$/, flag: '��' },
    { code: 'LC', name: 'Saint Lucia', dialCode: '+1', pattern: /^\d{7}$/, flag: '🇱🇨' },
    { code: 'VC', name: 'Saint Vincent', dialCode: '+1', pattern: /^\d{7}$/, flag: '🇻🇨' },
    { code: 'WS', name: 'Samoa', dialCode: '+685', pattern: /^\d{7}$/, flag: '🇼🇸' },
    { code: 'SM', name: 'San Marino', dialCode: '+378', pattern: /^\d{10}$/, flag: '🇸🇲' },
    { code: 'ST', name: 'Sao Tome and Principe', dialCode: '+239', pattern: /^\d{7}$/, flag: '�🇹' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', pattern: /^\d{9}$/, flag: '🇸🇦' },
    { code: 'SN', name: 'Senegal', dialCode: '+221', pattern: /^\d{9}$/, flag: '🇸🇳' },
    { code: 'RS', name: 'Serbia', dialCode: '+381', pattern: /^\d{8,12}$/, flag: '🇷🇸' },
    { code: 'SC', name: 'Seychelles', dialCode: '+248', pattern: /^\d{7}$/, flag: '🇸�' },
    { code: 'SL', name: 'Sierra Leone', dialCode: '+232', pattern: /^\d{8}$/, flag: '🇸🇱' },
    { code: 'SG', name: 'Singapore', dialCode: '+65', pattern: /^\d{8}$/, flag: '��' },
    { code: 'SK', name: 'Slovakia', dialCode: '+421', pattern: /^\d{9}$/, flag: '🇸🇰' },
    { code: 'SI', name: 'Slovenia', dialCode: '+386', pattern: /^\d{8,9}$/, flag: '�🇮' },
    { code: 'SB', name: 'Solomon Islands', dialCode: '+677', pattern: /^\d{7}$/, flag: '🇸🇧' },
    { code: 'SO', name: 'Somalia', dialCode: '+252', pattern: /^\d{8,9}$/, flag: '�🇴' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', pattern: /^\d{9}$/, flag: '🇿🇦' },
    { code: 'ES', name: 'Spain', dialCode: '+34', pattern: /^\d{9}$/, flag: '��' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', pattern: /^\d{9}$/, flag: '🇱🇰' },
    { code: 'SD', name: 'Sudan', dialCode: '+249', pattern: /^\d{9}$/, flag: '🇸🇩' },
    { code: 'SR', name: 'Suriname', dialCode: '+597', pattern: /^\d{6,7}$/, flag: '🇸🇷' },
    { code: 'SZ', name: 'Swaziland', dialCode: '+268', pattern: /^\d{8}$/, flag: '��' },
    { code: 'SE', name: 'Sweden', dialCode: '+46', pattern: /^\d{9}$/, flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41', pattern: /^\d{9}$/, flag: '🇨🇭' },
    { code: 'SY', name: 'Syria', dialCode: '+963', pattern: /^\d{9}$/, flag: '��' },
    { code: 'TW', name: 'Taiwan', dialCode: '+886', pattern: /^\d{9}$/, flag: '🇹🇼' },
    { code: 'TJ', name: 'Tajikistan', dialCode: '+992', pattern: /^\d{9}$/, flag: '��' },
    { code: 'TZ', name: 'Tanzania', dialCode: '+255', pattern: /^\d{9}$/, flag: '🇹🇿' },
    { code: 'TH', name: 'Thailand', dialCode: '+66', pattern: /^\d{9}$/, flag: '🇹🇭' },
    { code: 'TL', name: 'Timor-Leste', dialCode: '+670', pattern: /^\d{7}$/, flag: '��' },
    { code: 'TG', name: 'Togo', dialCode: '+228', pattern: /^\d{8}$/, flag: '🇹🇬' },
    { code: 'TO', name: 'Tonga', dialCode: '+676', pattern: /^\d{5,7}$/, flag: '��' },
    { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1', pattern: /^\d{7}$/, flag: '🇹🇹' },
    { code: 'TN', name: 'Tunisia', dialCode: '+216', pattern: /^\d{8}$/, flag: '��' },
    { code: 'TR', name: 'Turkey', dialCode: '+90', pattern: /^\d{10}$/, flag: '🇹🇷' },
    { code: 'TM', name: 'Turkmenistan', dialCode: '+993', pattern: /^\d{8}$/, flag: '��' },
    { code: 'TV', name: 'Tuvalu', dialCode: '+688', pattern: /^\d{5}$/, flag: '🇹🇻' },
    { code: 'UG', name: 'Uganda', dialCode: '+256', pattern: /^\d{9}$/, flag: '��' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380', pattern: /^\d{9}$/, flag: '🇺🇦' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', pattern: /^\d{9}$/, flag: '��' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', pattern: /^\d{10,11}$/, flag: '🇬🇧' },
    { code: 'US', name: 'United States', dialCode: '+1', pattern: /^\d{10}$/, flag: '��' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598', pattern: /^\d{8}$/, flag: '🇺🇾' },
    { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', pattern: /^\d{9}$/, flag: '🇺🇿' },
    { code: 'VU', name: 'Vanuatu', dialCode: '+678', pattern: /^\d{7}$/, flag: '��' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58', pattern: /^\d{10}$/, flag: '🇻🇪' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84', pattern: /^\d{9,10}$/, flag: '🇻🇳' },
    { code: 'YE', name: 'Yemen', dialCode: '+967', pattern: /^\d{9}$/, flag: '��' },
    { code: 'ZM', name: 'Zambia', dialCode: '+260', pattern: /^\d{9}$/, flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', pattern: /^\d{9}$/, flag: '��' },
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
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all">
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
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="••••••••"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
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
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dialCode})
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
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-r-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="1234567890"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Format: {countries.find(c => c.code === country)?.name}
          </p>
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
