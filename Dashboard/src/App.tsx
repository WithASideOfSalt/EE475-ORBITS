import React, { useEffect, useState } from 'react'
import './App.css'

import { Layout, Menu, Typography, Image, ConfigProvider, notification } from 'antd';
import type { MenuProps } from 'antd';
import {
  CodeOutlined,
  DashboardOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard.tsx';
import CodeEditor from './pages/CodeEditor.tsx';
import Help from './pages/Help.tsx';
import { socket } from './socket.ts';
import orbitLineIcon from './assets/OrbitLineIcon.png';

import { theme } from './theme.tsx'

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Dashboard', '1', <DashboardOutlined />),
  getItem('Code Editor', '2', <CodeOutlined />),
  getItem('Help', '3', <QuestionCircleOutlined />),
];

const renderContent = (
  activeMenu: string,
) => {
  switch (activeMenu) {
    case '1':
      return <Dashboard />;
    case '2':
      return <CodeEditor />;
    case '3':
      return <Help />;
    default:
      return null;
  }
};

const App = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState('1');
  const [api, contextHolder] = notification.useNotification();

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setActiveMenu(e.key as string);
  }

  useEffect(() => {
    const handleUploadComplete = (payload: {
      ok?: boolean;
      returncode?: number;
      stdout?: string;
      stderr?: string;
      error?: string;
    }) => {
      const success = !!payload?.ok;
      api[success ? 'success' : 'error']({
        placement: 'bottomLeft',
        message: success ? 'PlatformIO upload complete' : 'PlatformIO upload failed',
        description: success
          ? 'The code upload finished successfully.'
          : payload?.stderr || payload?.error || 'The code upload did not complete successfully.',
        duration: 4.5,
      });
    };

    socket.on('upload_complete', handleUploadComplete);

    return () => {
      socket.off('upload_complete', handleUploadComplete);
    };
  }, [api]);

  return (
    <ConfigProvider theme={theme}>
      {contextHolder}
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <div className="logo">
            <Image src={orbitLineIcon} preview={false} />
          </div>
          <Menu theme='dark' selectedKeys={[activeMenu]} mode="inline" items={items} onClick={handleMenuClick} />
        </Sider>

        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography.Title level={1} id='title'>O<span className="titleDots">.</span>R<span className="titleDots">.</span>B<span className="titleDots">.</span>I<span className="titleDots">.</span>T<span className="titleDots">.</span>S<span className="titleDots">.</span></Typography.Title>
          </Header>
          <Content style={{ flex: 1 }}>
            {renderContent(activeMenu)}
          </Content>
          <Footer style={{ textAlign: 'center', height: '40px', padding: '10px 50px', background: '#252526', color: '#fff' }}>
            ORBITS @{new Date().getFullYear()} CREATED BY SCOTT MCBRIDE
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App
