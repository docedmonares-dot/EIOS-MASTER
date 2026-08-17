import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

export default function Header() {
    return (
        <header className="eios-header">
            <div className="eios-header__brand">
                <strong>EIOS Enterprise Platform</strong>
                <span>Enterprise Intelligence and Operations System</span>
            </div>

            <div className="eios-header__actions">
                <NotificationBell />
                <UserMenu />
            </div>
        </header>
    );
}