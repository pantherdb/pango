import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from '@/App'
import { store } from '@/app/store/store'
import '@/index.css'

const container = document.getElementById('root')
if (!container) throw new Error("Root element with id 'root' was not found in index.html.")

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
