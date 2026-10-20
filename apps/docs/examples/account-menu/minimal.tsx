'use client'

import { AccountMenu, toast } from '@youj/react'

export default function AccountMenuMinimal() {
  return (
    // Just who you are and a way out. A long name and address truncate.
    <AccountMenu
      user={{
        name: 'Maximiliana Featherstonehaugh-Worthington',
        email: 'maximiliana.featherstonehaugh@a-very-long-domain.example',
      }}
      align="center"
      onSignOut={() => toast('Signed out')}
    />
  )
}
