import { defineConfig } from 'eslint/config'
import { getConfig } from './fe-zen-arch/eslint.config.js'

const ignores = ['dist/', 'fe-zen-arch/', '**/*.js']

export default defineConfig(...getConfig(ignores, import.meta))
