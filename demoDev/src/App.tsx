import React, { useState } from 'react'
import './App.css'
// import Ant Design components

import { Layout, Menu, theme, Typography, Image } from 'antd';
import type { MenuProps } from 'antd';
import {
  CodeOutlined,
  DashboardOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const {Header, Content, Footer, Sider} = Layout;


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

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    console.log('Clicked Menu item ', e);

    if (e.key === '1') {
      // Handle Dashboard click
      console.log('Navigate to Dashboard');
    } else if (e.key === '2') {
      // Handle Code Editor click
      console.log('Navigate to Code Editor');
    } else if (e.key === '3') {
      // Handle Help click
      console.log('Navigate to Help');
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="logo">
          <Image src="src/assets/OrbitLineIcon.png" preview={false} />
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} onClick={handleMenuClick}/>

      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} >
          <Typography.Title id='title'>O<span className="titleDots">.</span>R<span className="titleDots">.</span>B<span className="titleDots">.</span>I<span className="titleDots">.</span>T<span className="titleDots">.</span>S<span className="titleDots">.</span> Development Suite</Typography.Title>
        </Header>
        <Content style={{ margin: '0 16px ' }}>
          
        </Content>
        <Footer id = "finalFooter">
          ORBITS @{new Date().getFullYear()} CREATED BY SCOTT MCBRIDE
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App
