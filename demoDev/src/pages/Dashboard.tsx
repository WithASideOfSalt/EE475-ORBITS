import { useEffect, useState } from 'react';
import { Col, Layout, Row, Typography, Card } from 'antd';
import { Content, Header } from 'antd/es/layout/layout';
import { socket } from '../socket.ts'

interface TimeUpdateData{
  timestamp: number;
}

export default function Dashboard() {
  const [rollingTime, setRollingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);


  useEffect(()=>{
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect(){
      setIsConnected(false);
    }

    function timeUpdate(value: TimeUpdateData){
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
      <Layout style={{height: '100%', overflow: 'hidden'}}>
        <Header style={{textAlign: 'left'}}>
          <Typography.Title level={2} className='DashboardTitle'>
            Dashboard
          </Typography.Title>
        </Header>
        <Content style={{flex: 1, padding: '16px', display: 'flex'}}>
          <Row gutter={[8, 8]} style={{flex:1}}>
            {/* First Row */}
            <Col xs={24} sm={6} md={6} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                Command Centre
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                System Statistics
              </Card>
            </Col>
            <Col xs={24} sm={6} md={6} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                Active Cube Rotation
                Current time is {new Date(rollingTime * 1000).toLocaleString()} 
                Connected to API: {isConnected}
              </Card>
            </Col>
            
            {/* Second Row */}
            <Col xs={24} sm={6} md={6} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                Historical Data Downloads
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                Data Visualisation
              </Card>
            </Col>
            <Col xs={24} sm={6} md={6} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                Battery Diagnostics
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  );
}