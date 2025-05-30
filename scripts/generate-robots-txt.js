const fs = require('fs')
const path = require('path')

const env = process.env.NEXT_PUBLIC_ENV

const robotsTxtContent =
  env === 'production'
    ? `
User-agent: *
Disallow:
`
    : `
User-agent: *
Disallow: /
`

const filePath = path.join(__dirname, '../public/robots.txt')

fs.writeFileSync(filePath, robotsTxtContent.trim())
console.log(`robots.txt generated for ${env} environment`)
