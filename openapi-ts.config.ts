import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'https://api-dao.in8.com/swagger/json', // TODO: change to the correct url
  output: {
    format: 'prettier',
    path: './src/client',
    lint: 'eslint'
  },
  types: {
    dates: 'types+transform',
    enums: 'javascript'
  },
  schemas: {
    type: 'json'
  },
  plugins: ['@tanstack/react-query']
})
