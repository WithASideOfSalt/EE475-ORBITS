import { useEffect, useRef, useState } from 'react'

function SineWave({ phase, color, label }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    let animationId
    let time = 0

    const drawSineWave = () => {
      // Clear canvas
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)

      const amplitude = 50
      const frequency = 0.02
      const centerY = height / 2
      const points = width

      // Draw sine wave
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 3

      for (let x = 0; x < points; x++) {
        const y = centerY + amplitude * Math.sin(frequency * x + phase + time)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Draw center line
      ctx.beginPath()
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw label
      ctx.fillStyle = color
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(label, 20, 30)

      time += 0.02
      animationId = requestAnimationFrame(drawSineWave)
    }

    drawSineWave()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [phase, color, label])

  return (
    <canvas ref={canvasRef} width={800} height={200} className="sine-canvas" />
  )
}

function SineWaves() {
  return (
    <div className="sine-container">
      <h2>Three-Phase Sine Waves</h2>
      <div className="sine-graphs">
        <SineWave phase={0} color="#3b82f6" label="Wave 1 (0°)" />
        <SineWave phase={Math.PI * 2 / 3} color="#10b981" label="Wave 2 (120°)" />
        <SineWave phase={Math.PI * 4 / 3} color="#f59e0b" label="Wave 3 (240°)" />
      </div>
    </div>
  )
}

function DataTable() {
  const [data, setData] = useState([
    { id: 1, parameter: 'Temperature', value: 25.4, unit: '°C' },
    { id: 2, parameter: 'Pressure', value: 101.3, unit: 'kPa' },
    { id: 3, parameter: 'Voltage', value: 12.5, unit: 'V' },
    { id: 4, parameter: 'Current', value: 3.2, unit: 'A' },
    { id: 5, parameter: 'Speed', value: 1450, unit: 'rpm' }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => prevData.map(item => ({
        ...item,
        value: item.parameter === 'Speed' 
          ? Math.round(item.value + (Math.random() - 0.5) * 100)
          : parseFloat((item.value + (Math.random() - 0.5) * 2).toFixed(1))
      })))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="data-table-container">
      <h3>System Telemetry</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.parameter}</td>
              <td>{item.value}</td>
              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {
  return (
    <>
      <div className="cube-scene" aria-hidden="true">
        <div className="cube">
          <div className="face face-front"></div>
          <div className="face face-back"></div>
          <div className="face face-right"></div>
          <div className="face face-left"></div>
          <div className="face face-top"></div>
          <div className="face face-bottom"></div>
        </div>
      </div>

      <SineWaves />
      <DataTable />
    </>
  )
}
