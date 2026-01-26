import { useState } from 'react'

// ORBITS Component Scripts
const ORBITS_SCRIPTS = {
  imu: {
    name: 'IMU Sensor',
    description: 'Read IMU sensor data (accelerometer, gyroscope, magnetometer)',
    color: '#3b82f6',
    includes: ['#include <Wire.h>', '#include <MPU9250.h>'],
    setup: 'Wire.begin();\nIMU.initialize();',
    functions: [
      {
        id: 'read_accel',
        label: 'Read Accelerometer',
        code: () => `float ax, ay, az;\nIMU.getAcceleration(&ax, &ay, &az);`
      },
      {
        id: 'read_gyro',
        label: 'Read Gyroscope',
        code: () => `float gx, gy, gz;\nIMU.getRotation(&gx, &gy, &gz);`
      },
      {
        id: 'read_mag',
        label: 'Read Magnetometer',
        code: () => `float mx, my, mz;\nIMU.getMagnetometer(&mx, &my, &mz);`
      }
    ]
  },
  motor: {
    name: 'Motor Control',
    description: 'Control BLDC motors with PWM signals',
    color: '#10b981',
    includes: ['#include <ESP32Servo.h>'],
    setup: 'motor1.attach(MOTOR1_PIN);\nmotor2.attach(MOTOR2_PIN);\nmotor3.attach(MOTOR3_PIN);',
    functions: [
      {
        id: 'set_motor_speed',
        label: 'Set Motor Speed',
        params: ['motor_id', 'speed'],
        code: (motor_id, speed) => `motor${motor_id || '1'}.writeMicroseconds(${speed || '1500'});`
      },
      {
        id: 'stop_motors',
        label: 'Stop All Motors',
        code: () => `motor1.writeMicroseconds(1000);\nmotor2.writeMicroseconds(1000);\nmotor3.writeMicroseconds(1000);`
      }
    ]
  },
  telemetry: {
    name: 'Telemetry',
    description: 'Send telemetry data via Serial/WiFi',
    color: '#f59e0b',
    includes: ['#include <WiFi.h>', '#include <ArduinoJson.h>'],
    setup: 'Serial.begin(115200);\nWiFi.begin(SSID, PASSWORD);',
    functions: [
      {
        id: 'send_telemetry',
        label: 'Send Telemetry Packet',
        code: () => `JsonDocument doc;\ndoc["time"] = millis();\ndoc["ax"] = ax;\ndoc["ay"] = ay;\ndoc["az"] = az;\nserializeJson(doc, Serial);`
      },
      {
        id: 'log_data',
        label: 'Log to Serial',
        params: ['message'],
        code: (msg) => `Serial.println("${msg || 'Status: OK'}");`
      }
    ]
  },
  pid: {
    name: 'PID Controller',
    description: 'Implement PID control for stabilization',
    color: '#8b5cf6',
    includes: ['#include <PID_v1.h>'],
    setup: 'pidX.SetMode(AUTOMATIC);\npidY.SetMode(AUTOMATIC);\npidZ.SetMode(AUTOMATIC);',
    functions: [
      {
        id: 'compute_pid',
        label: 'Compute PID',
        code: () => `pidX.Compute();\npidY.Compute();\npidZ.Compute();`
      },
      {
        id: 'set_pid_tunings',
        label: 'Set PID Tunings',
        params: ['Kp', 'Ki', 'Kd'],
        code: (kp, ki, kd) => `pidX.SetTunings(${kp || '2.0'}, ${ki || '0.5'}, ${kd || '1.0'});`
      }
    ]
  }
}

const AVAILABLE_BLOCKS = [
  { 
    id: 'print', 
    label: 'Print', 
    color: '#3b82f6', 
    canNest: false,
    code: (value) => `Serial.println("${value || 'Hello World'}");` 
  },
  { 
    id: 'variable', 
    label: 'Set Variable', 
    color: '#10b981', 
    canNest: false,
    code: (value) => `int ${value || 'myVar'} = 0;` 
  },
  { 
    id: 'if', 
    label: 'If Statement', 
    color: '#f59e0b', 
    canNest: true,
    code: (value, children) => {
      const condition = value || 'condition'
      const nested = children && children.length > 0 
        ? children.map(c => generateBlockCode(c, '    ')).join('\n')
        : '    // code here'
      return `if (${condition}) {\n${nested}\n}`
    }
  },
  { 
    id: 'loop', 
    label: 'For Loop', 
    color: '#ef4444', 
    canNest: true,
    code: (value, children) => {
      const limit = value || '10'
      const nested = children && children.length > 0 
        ? children.map(c => generateBlockCode(c, '    ')).join('\n')
        : '    // code here'
      return `for (int i = 0; i < ${limit}; i++) {\n${nested}\n}`
    }
  },
  { 
    id: 'delay', 
    label: 'Delay', 
    color: '#ec4899', 
    canNest: false,
    code: (value) => `delay(${value || '1000'});` 
  },
  { 
    id: 'comment', 
    label: 'Comment', 
    color: '#64748b', 
    canNest: false,
    code: (value) => `// ${value || 'Add comment here'}` 
  }
]

function generateBlockCode(block, indent = '') {
  const blockDef = AVAILABLE_BLOCKS.find(b => b.id === block.id)
  if (!blockDef) return ''
  
  const code = blockDef.code(block.value, block.children)
  return code.split('\n').map(line => indent + line).join('\n')
}

export default function BlocklyPage() {
  const [droppedBlocks, setDroppedBlocks] = useState([])
  const [draggedBlock, setDraggedBlock] = useState(null)
  const [draggedFromWorkspace, setDraggedFromWorkspace] = useState(null)
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)
  const [selectedScript, setSelectedScript] = useState(null)
  const [viewMode, setViewMode] = useState('blocks') // 'blocks' or 'script'
  const [scriptBlocks, setScriptBlocks] = useState([])

  const handleScriptSelect = (scriptKey) => {
    setSelectedScript(scriptKey)
    setViewMode('script')
    // Auto-add script functions to workspace
    const script = ORBITS_SCRIPTS[scriptKey]
    const newBlocks = script.functions.map((fn, idx) => ({
      id: fn.id,
      uniqueId: `${fn.id}-${Date.now()}-${idx}`,
      label: fn.label,
      color: script.color,
      canNest: false,
      value: fn.params ? fn.params.join(', ') : '',
      code: fn.code,
      scriptName: script.name
    }))
    setScriptBlocks(newBlocks)
  }

  const handleDragStart = (block, fromWorkspace = false, parentId = null, index = null) => {
    if (fromWorkspace) {
      setDraggedFromWorkspace({ block, parentId, index })
    } else {
      setDraggedBlock(block)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e, targetBlockId = null) => {
    e.preventDefault()
    e.stopPropagation()

    // Moving block from workspace
    if (draggedFromWorkspace) {
      const { block, parentId, index } = draggedFromWorkspace
      
      // Remove from old location
      const newBlocks = removeBlockFromTree(droppedBlocks, block.uniqueId)
      
      // Add to new location
      if (targetBlockId) {
        setDroppedBlocks(addBlockToParent(newBlocks, targetBlockId, block))
      } else {
        setDroppedBlocks([...newBlocks, block])
      }
      
      setDraggedFromWorkspace(null)
      return
    }

    // Adding new block from palette
    if (draggedBlock) {
      const newBlock = {
        ...draggedBlock,
        uniqueId: `${draggedBlock.id}-${Date.now()}`,
        value: '',
        children: draggedBlock.canNest ? [] : undefined
      }

      if (targetBlockId) {
        setDroppedBlocks(addBlockToParent(droppedBlocks, targetBlockId, newBlock))
      } else {
        setDroppedBlocks([...droppedBlocks, newBlock])
      }
      setDraggedBlock(null)
    }
  }

  const addBlockToParent = (blocks, parentId, newBlock) => {
    return blocks.map(block => {
      if (block.uniqueId === parentId && block.canNest) {
        return {
          ...block,
          children: [...(block.children || []), newBlock]
        }
      } else if (block.children) {
        return {
          ...block,
          children: addBlockToParent(block.children, parentId, newBlock)
        }
      }
      return block
    })
  }

  const removeBlockFromTree = (blocks, uniqueId) => {
    return blocks.filter(block => {
      if (block.uniqueId === uniqueId) return false
      if (block.children) {
        block.children = removeBlockFromTree(block.children, uniqueId)
      }
      return true
    })
  }

  const handleBlockValueChange = (uniqueId, value) => {
    const updateValue = (blocks) => {
      return blocks.map(block => {
        if (block.uniqueId === uniqueId) {
          return { ...block, value }
        } else if (block.children) {
          return { ...block, children: updateValue(block.children) }
        }
        return block
      })
    }
    setDroppedBlocks(updateValue(droppedBlocks))
  }

  const handleRemoveBlock = (uniqueId) => {
    setDroppedBlocks(removeBlockFromTree(droppedBlocks, uniqueId))
  }

  const handleClearAll = () => {
    setDroppedBlocks([])
  }

  const generateFullCode = () => {
    if (viewMode === 'script' && selectedScript) {
      const script = ORBITS_SCRIPTS[selectedScript]
      let code = '// ORBITS Unit Script - ' + script.name + '\n'
      code += '// ' + script.description + '\n\n'
      
      // Includes
      code += script.includes.join('\n') + '\n\n'
      
      // Setup function
      code += 'void setup() {\n'
      code += '    ' + script.setup.split('\n').join('\n    ') + '\n'
      code += '}\n\n'
      
      // Main loop
      code += 'void loop() {\n'
      code += droppedBlocks.map(block => generateBlockCode(block, '    ')).join('\n') + '\n'
      code += '}\n'
      
      return code
    }
    
    // Standard blocks mode
    let code = '// ESP32 ORBITS Unit Code\n\n'
    code += '#include <Arduino.h>\n\n'
    code += 'void setup() {\n'
    code += '    Serial.begin(115200);\n'
    code += '}\n\n'
    code += 'void loop() {\n'
    code += droppedBlocks.map(block => generateBlockCode(block, '    ')).join('\n') + '\n'
    code += '}\n'
    
    return code
  }

  const generatedCode = generateFullCode()

  const renderBlock = (block, parentId = null, index = null) => {
    return (
      <div 
        key={block.uniqueId} 
        className="dropped-block"
        style={{ borderLeft: `4px solid ${block.color}` }}
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          handleDragStart(block, true, parentId, index)
        }}
      >
        <div className="block-header">
          <span className="block-label">
            {block.label}
            {block.canNest && <span className="nest-indicator"> 📦</span>}
          </span>
          <button 
            className="remove-button"
            onClick={() => handleRemoveBlock(block.uniqueId)}
          >
            ✕
          </button>
        </div>
        <input
          type="text"
          className="block-input"
          placeholder={`Enter ${block.label.toLowerCase()} value...`}
          value={block.value}
          onChange={(e) => handleBlockValueChange(block.uniqueId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        
        {block.canNest && (
          <div 
            className="block-nest-area"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, block.uniqueId)}
          >
            {block.children && block.children.length > 0 ? (
              block.children.map((child, idx) => renderBlock(child, block.uniqueId, idx))
            ) : (
              <div className="nest-placeholder">
                Drop blocks here
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="blockly-page">
      <div className="blockly-container">
        <div className="custom-blockly">
          <div className={`block-palette ${paletteCollapsed ? 'collapsed' : ''}`}>
            <div className="palette-header">
              <h3>{viewMode === 'script' ? 'Scripts' : 'Blocks'}</h3>
              <button 
                className="collapse-button" 
                onClick={() => setPaletteCollapsed(!paletteCollapsed)}
                title={paletteCollapsed ? 'Expand' : 'Collapse'}
              >
                {paletteCollapsed ? '▶' : '◀'}
              </button>
            </div>
            {!paletteCollapsed && (
              <>
                <div className="mode-switcher">
                  <button 
                    className={`mode-button ${viewMode === 'blocks' ? 'active' : ''}`}
                    onClick={() => setViewMode('blocks')}
                  >
                    Blocks
                  </button>
                  <button 
                    className={`mode-button ${viewMode === 'script' ? 'active' : ''}`}
                    onClick={() => setViewMode('script')}
                  >
                    Scripts
                  </button>
                </div>

                {viewMode === 'blocks' ? (
                  <>
                    <p className="palette-hint">Drag blocks to the workspace →</p>
                    {AVAILABLE_BLOCKS.map(block => (
                      <div
                        key={block.id}
                        className="palette-block"
                        draggable
                        onDragStart={() => handleDragStart(block, false)}
                        style={{ backgroundColor: block.color }}
                      >
                        {block.label}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="palette-hint">Select a component script →</p>
                    {Object.entries(ORBITS_SCRIPTS).map(([key, script]) => (
                      <div
                        key={key}
                        className={`script-card ${selectedScript === key ? 'selected' : ''}`}
                        onClick={() => handleScriptSelect(key)}
                        style={{ borderLeft: `4px solid ${script.color}` }}
                      >
                        <div className="script-name">{script.name}</div>
                        <div className="script-desc">{script.description}</div>
                        <div className="script-functions">{script.functions.length} functions</div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          <div 
            className="block-workspace"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="workspace-header">
              <h3>{viewMode === 'script' && selectedScript ? ORBITS_SCRIPTS[selectedScript].name : 'Workspace'}</h3>
              {droppedBlocks.length > 0 && (
                <button className="clear-button" onClick={handleClearAll}>
                  Clear All
                </button>
              )}
            </div>
            
            {viewMode === 'script' && selectedScript && scriptBlocks.length > 0 && (
              <div className="script-functions-list">
                <h4>Available Functions:</h4>
                {scriptBlocks.map(fn => (
                  <div 
                    key={fn.uniqueId}
                    className="palette-block"
                    draggable
                    onDragStart={() => handleDragStart(fn, false)}
                    style={{ backgroundColor: fn.color, marginBottom: '0.5rem' }}
                  >
                    {fn.label}
                  </div>
                ))}
              </div>
            )}
            
            {droppedBlocks.length === 0 ? (
              <div className="workspace-empty">
                {viewMode === 'script' 
                  ? 'Select a script from the left, then drag functions here'
                  : 'Drop blocks here to build your code'}
              </div>
            ) : (
              <div className="dropped-blocks">
                {droppedBlocks.map((block, idx) => renderBlock(block, null, idx))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="code-output-container">
        <div className="code-output-header">
          <h3>Generated {viewMode === 'script' ? 'Script' : 'C++'} Code</h3>
        </div>
        <pre className="code-output">
          <code>{generatedCode || '// Drag blocks from the left to generate code'}</code>
        </pre>
      </div>
    </div>
  )
}
