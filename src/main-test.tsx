import React from 'react'
import ReactDOM from 'react-dom/client'
import Test from './Test.tsx'
import './index.css'

console.log('Main test loading...')

const root = document.getElementById('root')
console.log('Root element:', root)

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Test />
    </React.StrictMode>
  )
  console.log('React app rendered')
} else {
  console.error('Root element not found!')
}