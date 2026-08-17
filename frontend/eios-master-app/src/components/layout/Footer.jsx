function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="eios-footer">
            <div className="eios-footer__left">
                <strong>EIOS Enterprise Platform</strong>
                <span>Version 1.0.0</span>
            </div>

            <div className="eios-footer__center">
                Enterprise Intelligence and Operations System
            </div>

            <div className="eios-footer__right">
                © {currentYear} Global Zenith Research and Consulting, Inc.
            </div>
        </footer>
    );
}

export default Footer;