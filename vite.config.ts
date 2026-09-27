import fs from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Link card for the site itself (a game's own card lives in app/<id>/, made by
// build-data). Link previews need absolute addresses, so the site's address
// comes from the data build (site.json), which knows which repo it runs in.
function linkCard(): Plugin {
  return {
    name: 'skeam-link-card',
    transformIndexHtml() {
      let url = 'https://kh32-7.github.io/skeam/'
      try {
        url = JSON.parse(fs.readFileSync('public/data/site.json', 'utf8')).url || url
      } catch {
        /* data not built yet */
      }
      const meta = (property: string, content: string) => ({ tag: 'meta', attrs: { property, content }, injectTo: 'head' as const })
      return [
        { tag: 'meta', attrs: { name: 'description', content: 'KING 동아리가 AI로 만든 게임을 모아 둔 상점' }, injectTo: 'head' },
        meta('og:type', 'website'),
        meta('og:site_name', 'SKEAM'),
        meta('og:title', 'SKEAM'),
        meta('og:description', 'KING 동아리가 AI로 만든 게임을 모아 둔 상점. 브라우저에서 바로 하거나 받아서 플레이'),
        meta('og:url', url),
        meta('og:image', url + 'og.png'),
        meta('og:image:width', '1200'),
        meta('og:image:height', '630'),
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#66c0f4' }, injectTo: 'head' },
      ]
    },
  }
}

// base './' keeps every asset path relative, so the same build works at
// <user>.github.io/skeam and later at <org>.github.io/skeam.
export default defineConfig({
  base: './',
  plugins: [react(), linkCard()],
})
