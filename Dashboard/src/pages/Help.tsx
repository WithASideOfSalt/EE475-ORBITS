import { Layout, Typography, Divider } from "antd";

const {Header, Content} = Layout;
const { Paragraph, Title } = Typography;

const dashboardUrl = "http://orbitsground.local:8000";
const orbitsUnitUrl = "http://ORBITSUnit00.local";

export default function Help() {
  return (
    <>
      <Layout>
        <Header>
          <Typography.Title level={2}>
            Help
          </Typography.Title>
        </Header>
        <Content style={{ flex: 1, padding: "1rem 1.25rem" }}>
          <Typography>
            <Title level={4}>Project Context</Title>
            <Paragraph>
              ORBITS (Outreach and Research Build for Interactively Teaching Satellites) is an
              educational 1U CubeSat emulation platform designed to let students learn through
              hands-on software and hardware development. The system pairs a physical ORBITS unit
              with a ground station to mimic real mission workflows, from command and control to
              telemetry analysis.
            </Paragraph>
            <Paragraph>
              The design focuses on accessibility and repairability by using Commercial Off The
              Shelf (COTS) components, while still exposing realistic subsystem concepts used in
              CubeSat engineering: OBC, PMAD, communications, ADCS, payload integration, and
              platform structure.
            </Paragraph>

            <Divider />

            <Title level={4}>API Overview</Title>
            <Paragraph>
              The dashboard API provides the bridge between the website and the ORBITS hardware.
              It handles command submission, payload code processing, telemetry downloads, and
              live updates so the UI can stay in sync with the unit in real time.
            </Paragraph>

            <Paragraph>
              API Address: <a href={dashboardUrl} target="_blank" rel="noreferrer">{dashboardUrl}</a>
              <br />
              ORBITS unit: <a href={orbitsUnitUrl} target="_blank" rel="noreferrer">{orbitsUnitUrl}</a>
            </Paragraph>

            <Divider />

            <Title level={4}>What This System Can Do</Title>
            <Paragraph>
              The ORBITS platform has been designed to support both beginner and intermediate
              learning outcomes. Key capabilities include:
            </Paragraph>
            <ul>
              <li>
                Ground station workflow from a standard laptop/desktop environment, hosted on a
                Raspberry Pi Zero 2 W.
              </li>
              <li>
                Real-time command and telemetry pipeline between the dashboard and ORBITS unit,
                using Flask, Socket.IO, and MQTT.
              </li>
              <li>
                Dual communications path for learning and resilience: Wi-Fi plus NRF24L01+ (Not Implemented Yet)
                transceiver links.
              </li>
              <li>
                Telemetry monitoring for system power (INA260 voltage/current/power) and ADCS
                sensing.
              </li>
              <li>
                ADCS-focused orientation learning using a 9-axis ICM-20948 IMU (accelerometer,
                gyroscope, magnetometer).
              </li>
              <li>
                User payload experimentation via a top-layer breadboard area and available GPIO,
                I2C, and SPI interfaces.
              </li>
              <li>
                Blockly-to-C++ programming support with Monaco code view to bridge visual and
                text-based development.
              </li>
              <li>
                Over-the-air programming workflow (PlatformIO) so payload code can be compiled and
                uploaded without physically rewiring the unit.
              </li>
            </ul>

            <Divider />

            <Title level={4}>Using The Dashboard</Title>
            <Paragraph>
              Use the <strong>Dashboard</strong> page to monitor mission activity and live telemetry,
              and the <strong>Code Editor</strong> page to build payload logic with blocks and inspect
              generated C++ code. This structure is intended to support a progression from
              introductory programming to embedded systems concepts.
            </Paragraph>
          </Typography>
        </Content>
      </Layout>
    </>
  );
}