import { pageTwinResponse } from '@/lib/page-twins'

export const revalidate = false

export const GET = () => pageTwinResponse('illustrations/build')
