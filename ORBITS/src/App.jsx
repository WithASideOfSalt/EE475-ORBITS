import React, { useState, useEffect } from 'react'
import { socket } from './socket'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(0);
  const [rollingTime, setRollingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(()=>{
    fetch('/api/time').then(res => res.json()).then(data => {
      setCurrentTime(data.time)
    })

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect(){
      setIsConnected(false);
    }

    function timeUpdate(value){
      setRollingTime(value.timestamp)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('time_update', timeUpdate)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect',onDisconnect)
      socket.off('time_update', timeUpdate)
    }
    
  },[]);
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>Single instance time is {new Date(currentTime * 1000).toLocaleString()}.</p>
        <p>Connected to api {isConnected}</p>
        <p>SocketIO time is {new Date(rollingTime * 1000).toLocaleString()}</p>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
