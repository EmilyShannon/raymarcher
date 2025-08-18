import { useState } from 'react'
import RaymarchCanvas from './RaymarchCanvas.jsx'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <div>
        <RaymarchCanvas />
      </div>
    </>
  )
}

export default App
