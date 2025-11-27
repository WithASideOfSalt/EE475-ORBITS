import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import './App.css'
import Dashboard from './pages/Dashboard'
import BlocklyPage from './pages/BlocklyPage'

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return
    }
    setDrawerOpen(open)
  }

  const drawerContent = (
    <div className="drawer-content" role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <div className="drawer-header">
        <h2>ORBITS System</h2>
      </div>
      <Divider sx={{ backgroundColor: '#334155' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/">
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/blockly">
            <ListItemText primary="Code Builder" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  )

  return (
    <Router>
      <div className="app-container">
        <IconButton
          className="menu-button"
          onClick={toggleDrawer(true)}
          sx={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 10000,
            color: '#e2e8f0',
            backgroundColor: '#1e293b',
            '&:hover': {
              backgroundColor: '#334155'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              width: 250
            }
          }}
        >
          {drawerContent}
        </Drawer>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blockly" element={<BlocklyPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
