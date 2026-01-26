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
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)

      const amplitude = 30
      const frequency = 0.02
      const centerY = height / 2
      const points = width

      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2

      for (let x = 0; x < points; x++) {
        const y = centerY + amplitude * Math.sin(frequency * x + phase + time)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      ctx.beginPath()
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = color
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(label, 10, 20)

      time += 0.02
      animationId = requestAnimationFrame(drawSineWave)
    }

    drawSineWave()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [phase, color, label])

  return (
    <canvas ref={canvasRef} width={300} height={100} className="sine-canvas" />
  )
}

function SineWaves() {
  return (
    <div className="sine-container">
      <h3>Motor Phase Signals</h3>
      <div className="sine-graphs">
        <SineWave phase={0} color="#3b82f6" label="Phase A" />
        <SineWave phase={Math.PI * 2 / 3} color="#10b981" label="Phase B" />
        <SineWave phase={Math.PI * 4 / 3} color="#f59e0b" label="Phase C" />
      </div>
    </div>
  )
}

function Gauge({ value, max, label, color }) {
  const percentage = (value / max) * 100
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="gauge">
      <svg width="80" height="80">
        <circle
          className="gauge-bg"
          cx="40"
          cy="40"
          r={radius}
        />
        <circle
          className="gauge-fill"
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-text">
        <span className="gauge-value">{value.toFixed(0)}</span>
        <span className="gauge-label">{label}</span>
      </div>
    </div>
  )
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value))
  
  return (
    <div className="bar-chart">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="bar"
          style={{ height: `${(item.value / max) * 100}%` }}
        >
          <span className="bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function CompactTable({ data, title }) {
  return (
    <div className="compact-table">
      <h4>{title}</h4>
      <div className="compact-table-grid">
        {data.map((item, idx) => (
          <div key={idx} className={`compact-item ${item.status || 'ok'}`}>
            <span className="compact-label">{item.label}</span>
            <span className="compact-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [gaugeData, setGaugeData] = useState({
    thrust: 65.4,
    power: 78.2,
    efficiency: 85.3
  })

  const [motorData, setMotorData] = useState([
    { label: 'M1', value: 1450 },
    { label: 'M2', value: 1480 },
    { label: 'M3', value: 1465 }
  ])

  const [telemetryData, setTelemetryData] = useState([
    { label: 'Temp', value: '25.4°C', status: 'ok' },
    { label: 'Press', value: '101 kPa', status: 'ok' },
    { label: 'Volt', value: '12.5V', status: 'ok' },
    { label: 'Curr', value: '3.2A', status: 'ok' },
    { label: 'Alt', value: '0m', status: 'ok' },
    { label: 'Batt', value: '11.8V', status: 'warning' }
  ])

  const [imuData, setImuData] = useState({
    accelX: 0.2, accelY: 0.1, accelZ: 9.8,
    gyroX: 2.5, gyroY: 1.8, gyroZ: 0.5,
    magX: 45.2, magY: -12.3, magZ: 68.9
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setGaugeData({
        thrust: parseFloat((60 + Math.random() * 20).toFixed(0)),
        power: parseFloat((70 + Math.random() * 20).toFixed(0)),
        efficiency: parseFloat((80 + Math.random() * 10).toFixed(0))
      })

      setMotorData([
        { label: 'M1', value: Math.round(1400 + Math.random() * 200) },
        { label: 'M2', value: Math.round(1400 + Math.random() * 200) },
        { label: 'M3', value: Math.round(1400 + Math.random() * 200) }
      ])

      setImuData(prev => ({
        accelX: parseFloat((prev.accelX + (Math.random() - 0.5) * 0.2).toFixed(2)),
        accelY: parseFloat((prev.accelY + (Math.random() - 0.5) * 0.2).toFixed(2)),
        accelZ: parseFloat((9.8 + (Math.random() - 0.5) * 0.3).toFixed(2)),
        gyroX: parseFloat((prev.gyroX + (Math.random() - 0.5) * 0.5).toFixed(1)),
        gyroY: parseFloat((prev.gyroY + (Math.random() - 0.5) * 0.5).toFixed(1)),
        gyroZ: parseFloat((prev.gyroZ + (Math.random() - 0.5) * 0.5).toFixed(1)),
        magX: parseFloat((prev.magX + (Math.random() - 0.5) * 2).toFixed(0)),
        magY: parseFloat((prev.magY + (Math.random() - 0.5) * 2).toFixed(0)),
        magZ: parseFloat((prev.magZ + (Math.random() - 0.5) * 2).toFixed(0))
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-compact">
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

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-column">
          <SineWaves />
          
          <div className="graph-card compact">
            <h3>Performance</h3>
            <div className="gauge-container">
              <Gauge value={gaugeData.thrust} max={100} label="Thrust" color="#3b82f6" />
              <Gauge value={gaugeData.power} max={100} label="Power" color="#10b981" />
              <Gauge value={gaugeData.efficiency} max={100} label="Effic" color="#f59e0b" />
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="dashboard-column">
          <div className="graph-card compact">
            <h3>Motor RPM</h3>
            <BarChart data={motorData} />
          </div>

          <CompactTable 
            title="Telemetry" 
            data={telemetryData}
          />

          <CompactTable 
            title="System Status" 
            data={[
              { label: 'WiFi', value: 'Connected', status: 'ok' },
              { label: 'GPS', value: '8 Sats', status: 'ok' },
              { label: 'Storage', value: '78%', status: 'warning' },
              { label: 'Uptime', value: '02:34', status: 'ok' }
            ]}
          />
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          <div className="graph-card compact">
            <h3>IMU Sensors</h3>
            <div className="imu-compact">
              <div className="imu-section">
                <h4>Accel (m/s²)</h4>
                <div className="imu-values">
                  <span>X: {imuData.accelX}</span>
                  <span>Y: {imuData.accelY}</span>
                  <span>Z: {imuData.accelZ}</span>
                </div>
              </div>
              <div className="imu-section">
                <h4>Gyro (°/s)</h4>
                <div className="imu-values">
                  <span>X: {imuData.gyroX}</span>
                  <span>Y: {imuData.gyroY}</span>
                  <span>Z: {imuData.gyroZ}</span>
                </div>
              </div>
              <div className="imu-section">
                <h4>Mag (µT)</h4>
                <div className="imu-values">
                  <span>X: {imuData.magX}</span>
                  <span>Y: {imuData.magY}</span>
                  <span>Z: {imuData.magZ}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
