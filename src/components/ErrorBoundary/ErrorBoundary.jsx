import React from "react";
import { Result, Button, Typography, Card } from "antd";
import { ReloadOutlined, HomeOutlined, BugOutlined } from "@ant-design/icons";

const { Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <Result
              status="500"
              title="Xato yuz berdi"
              subTitle="Kechirasiz, kutilmagan xato yuz berdi. Sahifani yangilang yoki bosh sahifaga qayting."
              extra={[
                <Button
                  type="primary"
                  key="reload"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  Sahifani yangilash
                </Button>,
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  Bosh sahifa
                </Button>,
              ]}
            >
              <div className="text-left">
                <Paragraph>
                  <Text strong>Bu xato haqida ma'lumot:</Text>
                </Paragraph>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BugOutlined className="mr-2 text-red-500" />
                      <Text strong className="text-red-500">
                        Developer Info:
                      </Text>
                    </div>

                    <div className="text-sm font-mono space-y-2">
                      <div>
                        <Text strong>Error:</Text>
                        <br />
                        <Text code className="text-red-600">
                          {this.state.error.toString()}
                        </Text>
                      </div>

                      {this.state.errorInfo && (
                        <div>
                          <Text strong>Stack Trace:</Text>
                          <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded mt-1 overflow-auto max-h-48">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Paragraph className="mt-4 text-gray-600 dark:text-gray-300">
                  Agar bu xato takrorlanishda davom etsa, iltimos biz bilan
                  bog'laning:
                  <br />
                  📧 Email: your.email@example.com
                  <br />
                  💬 GitHub Issues:
                  <a
                    href="https://github.com/username/karakalpak-spell-checker/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Report Bug
                  </a>
                </Paragraph>
              </div>
            </Result>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
