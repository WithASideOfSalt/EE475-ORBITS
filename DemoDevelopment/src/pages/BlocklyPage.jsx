import { useState } from 'react'

const AVAILABLE_BLOCKS = [
  { 
    id: 'print', 
    label: 'Print', 
    color: '#3b82f6', 
    canNest: false,
    code: (value) => `std::cout << "${value || 'Hello World'}" << std::endl;` 
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
    id: 'function', 
    label: 'Function', 
    color: '#8b5cf6', 
    canNest: true,
    code: (value, children) => {
      const name = value || 'myFunction'
      const nested = children && children.length > 0 
        ? children.map(c => generateBlockCode(c, '    ')).join('\n')
        : '    // code here'
      return `void ${name}() {\n${nested}\n}`
    }
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

  const generatedCode = droppedBlocks.map(block => generateBlockCode(block)).join('\n')

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
              <h3>Available Blocks</h3>
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
            )}
          </div>

          <div 
            className="block-workspace"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="workspace-header">
              <h3>Workspace</h3>
              {droppedBlocks.length > 0 && (
                <button className="clear-button" onClick={handleClearAll}>
                  Clear All
                </button>
              )}
            </div>
            {droppedBlocks.length === 0 ? (
              <div className="workspace-empty">
                Drop blocks here to build your code
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
          <h3>Generated C++ Code</h3>
        </div>
        <pre className="code-output">
          <code>{generatedCode || '// Drag blocks from the left to generate code'}</code>
        </pre>
      </div>
    </div>
  )
}
