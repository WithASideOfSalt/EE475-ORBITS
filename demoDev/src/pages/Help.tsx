import { Layout, Typography } from "antd";

const {Header, Content} = Layout;

export default function Help() {
  return (
    <>
      <Layout>
        <Header>
          <Typography.Title level={2}>
            Help
          </Typography.Title>
        </Header>
        <Content style={{flex: 1}}>
          <Typography>
            This is talking about how the ORBITS unit funcitons, places for documentation and where you can go for help around operating and learning with an ORBITS unit.
          </Typography>
        </Content>
      </Layout>
    </>
  );
}