import { addons } from 'storybook/manager-api'
import { youjTheme } from './youj-theme'

addons.setConfig({
  theme: youjTheme('dark'),
  sidebar: { showRoots: true },
})
