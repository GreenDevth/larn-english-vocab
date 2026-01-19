import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-200">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">😿 อุ๊ย! เกิดข้อผิดพลาด</h1>
                        <p className="text-gray-600 mb-4">
                            ขออภัยครับ ระบบเกิดปัญหาขัดข้อง (Something went wrong).
                        </p>
                        <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-48 mb-6 text-sm font-mono text-red-800">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700"
                        >
                            ลองโหลดใหม่ (Reload)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
