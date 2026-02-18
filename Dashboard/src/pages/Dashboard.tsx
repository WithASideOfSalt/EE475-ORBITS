import { useEffect, useState } from 'react';
import { Col, Layout, Row, Typography, Card } from 'antd';
import { Content, Header } from 'antd/es/layout/layout';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, animator } from 'chart.js';
import { socket } from '../socket.ts'
import { RotatingCube } from '../components/RotatingCube'
import '../Styleing/Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface IMUDataPoint {
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  timestamp: number;
}

interface TimeUpdateData{
  timestamp: number;
}

export default function Dashboard() {
  const [rollingTime, setRollingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [imuData, setImuData] = useState<IMUDataPoint[]>([]);
  const maxDataPoints = 30;


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

    function handleImuData(value: IMUDataPoint) {
      setImuData((prevData) => {
        const newData = [...prevData, value];
        return newData.slice(-maxDataPoints);
      });
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('time_update', timeUpdate)
    socket.on('imu_data', handleImuData)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect',onDisconnect)
      socket.off('time_update', timeUpdate)
      socket.off('imu_data', handleImuData)
    }
  },[]);

  const createChartData = (dataKey: keyof IMUDataPoint, label: string, borderColor: string) => {
    return {
      labels: imuData.map((_, idx) => idx + 1),
      datasets: [
        {
          label: label,
          data: imuData.map((d) => d[dataKey]),
          borderColor: borderColor,
          backgroundColor: borderColor + '20',
          tension: 0.1,
          fill: true,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    options: {
      animation: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  return (
    <>
      <Layout style={{height: '100%', overflow: 'hidden'}}>
        <Header style={{textAlign: 'left'}}>
          <Typography.Title level={2} className='DashboardTitle'>
            Dashboard
          </Typography.Title>
        </Header>
        <Content style={{flex: 1, padding: '16px', display: 'flex', overflowY: 'auto'}}>
          <Row gutter={[8, 8]} style={{flex:1, width: '100%'}}>
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
                <Typography.Title level={5}>Active Cube Rotation</Typography.Title>
                <RotatingCube 
                  gyroX={imuData.length > 0 ? imuData[imuData.length - 1].gyro_x : 0}
                  gyroY={imuData.length > 0 ? imuData[imuData.length - 1].gyro_y : 0}
                  gyroZ={imuData.length > 0 ? imuData[imuData.length - 1].gyro_z : 0}
                />
                <div style={{textAlign: 'center', marginTop: '12px', fontSize: '12px'}}>
                  <p>Current time: {new Date(rollingTime * 1000).toLocaleString()}</p>
                  <p>API Connected: {isConnected ? '✓' : '✗'}</p>
                </div>
              </Card>
            </Col>
            
            {/* Second Row */}
            <Col xs={24} sm={6} md={6} style={{display:'flex'}}>
              <Card style={{width:'100%'}}>
                Historical Data Downloads
              </Card>
            </Col>

            {/* Data Visualisation with 6 Charts */}
            <Col xs={24} style={{display:'flex'}}>
              <Card style={{width:'100%', padding: '16px'}}>
                <Typography.Title level={4}>Data Visualisation - IMU Sensors</Typography.Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Acceleration X" size="small">
                      <Line data={createChartData('accel_x', 'Accel X', 'rgb(255, 99, 132)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Acceleration Y" size="small">
                      <Line data={createChartData('accel_y', 'Accel Y', 'rgb(54, 162, 235)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Acceleration Z" size="small">
                      <Line data={createChartData('accel_z', 'Accel Z', 'rgb(75, 192, 75)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Gyroscope X" size="small">
                      <Line data={createChartData('gyro_x', 'Gyro X', 'rgb(255, 206, 86)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Gyroscope Y" size="small">
                      <Line data={createChartData('gyro_y', 'Gyro Y', 'rgb(153, 102, 255)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Gyroscope Z" size="small">
                      <Line data={createChartData('gyro_z', 'Gyro Z', 'rgb(255, 159, 64)')} options={chartOptions} />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            {/* Third Row */}
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