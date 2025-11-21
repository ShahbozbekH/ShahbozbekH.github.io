import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Shahbozbek Hakimov',
  description:
    'Personal blog where I post about myself and my experiences.',
  href: 'https://shahboz.wiki',
  author: 'Shahboz',
  locale: 'en-US',
  featuredPostCount: 2,
  postsPerPage: 3,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: 'blog',
  },
  {
    href: '/authors',
    label: 'authors',
  },
  {
    href: '/about',
    label: 'about',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/ShahbozbekH',
    label: 'GitHub',
  },
  {
    href: 'https://linkedin.com/in/shahbozhakimov/',
    label: 'LinkedIn',
  },
  {
    href: 'mailto:hakimovshahbozbek@gmail.com',
    label: 'Email',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
