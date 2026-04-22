import { useEffect, useState, useMemo } from 'react';
import { Col, Layout, Row, Typography, Card, Input, Button } from 'antd';
import { Content, Header } from 'antd/es/layout/layout';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { socket } from '../socket.ts'
import { RotatingCube } from '../components/RotatingCube'
import '../Styleing/Dashboard.css'
import { Statistic, Badge, Divider } from 'antd/es';
import { message } from 'antd';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

interface IMUDataPoint {
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  mag_x: number;
  mag_y: number;
  mag_z: number;
  timestamp: number;
}

interface TelemetryDataPoint {
  mission_id?: string;
  bus_voltage_v?: number;
  current_ma?: number;
  power_mw?: number;
  timestamp?: number;
}

interface TimeUpdateData{
  timestamp: number;
}

function formatDuration(totalSeconds: number) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function Dashboard() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [rollingTime, setRollingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [imuData, setImuData] = useState<IMUDataPoint[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint | null>(null);
  const [commandTopic, setCommandTopic] = useState('');
  const [commandParams, setCommandParams] = useState('');
  const [isSendingCommand, setIsSendingCommand] = useState(false);
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

    function handleTelemetryData(value: TelemetryDataPoint) {
      setTelemetryData(value);
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('time_update', timeUpdate)
    socket.on('adcs_update', handleImuData)
    socket.on('telemetry_update', handleTelemetryData)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect',onDisconnect)
      socket.off('time_update', timeUpdate)
      socket.off('adcs_update', handleImuData)
      socket.off('telemetry_update', handleTelemetryData)
    }
  },[]);

  const formatTelemetryValue = (value: number | undefined, decimals: number, unit: string) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'N/A';
    }

    return `${value.toFixed(decimals)} ${unit}`;
  };

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

  const contentList: Record<string, React.ReactNode> = {
  Acceleration: (<>
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
        </>),
  Gyroscope: (<>
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
  </>
  ),
  Magnetometer: (<>
  <Col xs={24} sm={12} md={8}>
                    <Card title="Magnetometer X" size="small">
                      <Line data={createChartData('mag_x', 'Mag X', 'rgb(255, 99, 132)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Magnetometer Y" size="small">
                      <Line data={createChartData('mag_y', 'Mag Y', 'rgb(54, 162, 235)')} options={chartOptions} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card title="Magnetometer Z" size="small">
                      <Line data={createChartData('mag_z', 'Mag Z', 'rgb(75, 192, 75)')} options={chartOptions} />
                    </Card>
                  </Col>
  </>
  ),

  };

  const tabList = [
    {
      key: 'Acceleration',
      tab: 'Acceleration',
    },
    {
      key: 'Gyroscope',
      tab: 'Gyroscope',
    },
    {
      key: 'Magnetometer',
      tab: 'Magnetometer',
    }
  ];

  const [activeTabKey, setActiveTabKey] = useState<string>('Acceleration');

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  const systemStats = useMemo(() => {
    const uptimeSeconds = Math.max(0, Math.floor(rollingTime));

    // Treat socket as Ground Station link.
    const groundStationActive = isConnected;

    // Treat ORBITS Unit as active if IMU telemetry is arriving recently.
    const lastImuTimestamp = imuData.length ? imuData[imuData.length - 1].timestamp : null;
    const orbitsUnitActive =
      groundStationActive &&
      lastImuTimestamp !== null &&
      Math.abs(rollingTime - lastImuTimestamp) <= 5;

    return {
      uptimeSeconds,
      lastStateChange: 'UPDATE_ME', // Placeholder - would need backend support to track state changes
      groundStationActive,
      orbitsUnitActive,
    };
  }, [rollingTime, isConnected, imuData]);

  const downloadCsv = async (endpoint: string, fallbackName: string) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const match = contentDisposition.match(/filename=([^;]+)/i);
      const filename = match ? match[1].replace(/"/g, '') : fallbackName;

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('CSV download failed:', error);
    }
  };

  const sendDashboardCommand = async () => {
    let params: Record<string, unknown> = {};

    try {
      params = commandParams.trim() ? JSON.parse(commandParams) : {};
      if (typeof params !== 'object' || params === null || Array.isArray(params)) {
        throw new Error('Parameters must be a JSON object.');
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Invalid JSON parameters.');
      return;
    }

    setIsSendingCommand(true);
    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: commandTopic,
          params,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Failed to publish command (${response.status}).`);
      }

      messageApi.success(`Topic published: ${commandTopic}`);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Failed to send dashboard command.');
    } finally {
      setIsSendingCommand(false);
    }
  };

  return (
    <>
      {messageContextHolder}
      <Layout style={{height: '100%', overflow: 'hidden'}}>
        <Header style={{textAlign: 'left'}}>
          <Typography.Title level={2} className='DashboardTitle'>
            Dashboard
          </Typography.Title>
        </Header>
        <Content style={{flex: 1, padding: '16px', display: 'flex', overflowY: 'auto'}}>
          
          <Row gutter={[2,2]} style={{flex:1, width: '100%'}}>
            {/* First Col */}
            <Col xs={24} sm={6} md={6} style={{display:'flex'}}>
              <Card style={{width:'100%'}} title="Command Centre">
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <Typography.Text type="secondary">MQTT Topic</Typography.Text>
                    <Input
                      value={commandTopic}
                      onChange={(event) => setCommandTopic(event.target.value)}
                      placeholder="orbits/command/user"
                    />
                  </Col>
                  <Col xs={24}>
                    <Typography.Text type="secondary">Params JSON</Typography.Text>
                    <Input.TextArea
                      value={commandParams}
                      onChange={(event) => setCommandParams(event.target.value)}
                      placeholder='{"state": true}'
                      autoSize={{ minRows: 3, maxRows: 6 }}
                    />
                  </Col>
                  <Col xs={24}>
                    <Button
                      type="primary"
                      block
                      loading={isSendingCommand}
                      onClick={sendDashboardCommand}
                    >
                      Trigger User Function
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} style={{display:'flex'}}>
              <Card title="System Statistics" style={{ width: '100%' }} size="small">
                <Row gutter={[12, 12]}>
                  <Col>
                    <div style={{ marginBottom: 4, color: '#8c8c8c' }}>Mission Name</div>
                    <Input value="ORBITS Demo" style={{ color: '#FFF', fontWeight: 'bold', fontSize: '16px' }} />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={12}>
                    <Statistic title="Uptime" value={formatDuration(systemStats.uptimeSeconds)} />
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 4, color: '#8c8c8c' }}>Connection Status</div>
                    <Badge status={systemStats.groundStationActive ? 'success' : 'error'} text={systemStats.groundStationActive ? 'Connected' : 'Disconnected'} />
                  </Col>

                  <Col xs={24}>
                    <Statistic title="Last State Change" value={systemStats.lastStateChange} />
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <Row gutter={[12, 12]}>
                  
                </Row>
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
            {/* Data Visualisation with 6 Charts */}
            <Col xs={24} style={{display:'flex'}}>
              <Card style={{flex: '0 0 18%', maxWidth: '18%'}} title="Historical Data Downloads">
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <Button
                      type="primary"
                      block
                      onClick={() => downloadCsv('/api/download/telemetry/recent', 'telemetry_recent_100.csv')}
                    >
                      Download Telemetry (Last 100)
                    </Button>
                  </Col>
                  <Col xs={24}>
                    <Button
                      block
                      onClick={() => downloadCsv('/api/download/adcs/recent', 'adcs_recent_100.csv')}
                    >
                      Download ADCS (Last 100)
                    </Button>
                  </Col>
                </Row>
              </Card>
              <Card title="Data Visualisation - IMU Sensors" tabList={tabList} activeTabKey={activeTabKey} onTabChange={onTabChange} style={{flex: '0 0 64%', maxWidth: '64%', padding: '4px'}}>
                <Row gutter={[16, 16]}>
                  {contentList[activeTabKey]}
                </Row>
              </Card>
              {/* Third Col */}
              <Card style={{flex: '0 0 18%', maxWidth: '18%'}} title="Battery Diagnostics">
                <Row gutter={[12, 12]}>
                  <Col xs={24}>
                    <Statistic
                      title="Voltage"
                      value={formatTelemetryValue(telemetryData?.bus_voltage_v, 2, 'V')}
                    />
                  </Col>
                  <Col xs={24}>
                    <Statistic
                      title="Current"
                      value={formatTelemetryValue(telemetryData?.current_ma, 0, 'mA')}
                    />
                  </Col>
                  <Col xs={24}>
                    <Statistic
                      title="Power"
                      value={formatTelemetryValue(telemetryData?.power_mw, 0, 'mW')}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  );
}