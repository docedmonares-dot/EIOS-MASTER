import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Breadcrumb from "../components/layout/Breadcrumb";
import Footer from "../components/layout/Footer";

export default function MainLayout({ children }) {
    return (
        <div className="eios-shell">
            <Header />

            <div className="eios-shell__body">
                <Sidebar />

                <div className="eios-shell__workspace">
                    <div className="eios-shell__breadcrumb">
                        <Breadcrumb />
                    </div>

                    <main className="eios-shell__content">
                        {children}
                    </main>

                    <Footer />
                </div>
            </div>
        </div>
    );
}