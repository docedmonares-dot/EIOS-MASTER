import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/authentication/context/AuthContext";

function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const menuRef = useRef(null);
    const navigate = useNavigate();

    const { user, logout } = useAuth();

    const displayName =
        user?.name ||
        user?.fullName ||
        user?.username ||
        "EIOS User";

    const displayRole =
        user?.role
            ?.replace(/_/g, " ")
            .toUpperCase() || "AUTHORIZED USER";

    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    function handleLogoutRequest() {
        setIsOpen(false);
        setShowLogoutConfirm(true);
    }

    function handleLogoutCancel() {
        setShowLogoutConfirm(false);
    }

    function handleLogoutConfirm() {
        logout();
        setShowLogoutConfirm(false);
        navigate("/login", { replace: true });
    }

    return (
        <>
            <div
                className="eios-user-menu"
                ref={menuRef}
            >
                <button
                    type="button"
                    className="eios-user-menu__trigger"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    onClick={() =>
                        setIsOpen((current) => !current)
                    }
                >
                    <span className="eios-user-menu__avatar">
                        {initials || "EU"}
                    </span>

                    <span className="eios-user-menu__identity">
                        <strong>{displayName}</strong>
                        <small>{displayRole}</small>
                    </span>

                    <span
                        className="eios-user-menu__chevron"
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>

                {isOpen && (
                    <div
                        className="eios-user-menu__dropdown"
                        role="menu"
                    >
                        <div className="eios-user-menu__profile">
                            <span className="eios-user-menu__avatar eios-user-menu__avatar--large">
                                {initials || "EU"}
                            </span>

                            <div>
                                <strong>{displayName}</strong>
                                <small>{displayRole}</small>
                            </div>
                        </div>

                        <div className="eios-user-menu__divider" />

                        <button
                            type="button"
                            role="menuitem"
                            className="eios-user-menu__item"
                        >
                            My Profile
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            className="eios-user-menu__item"
                        >
                            Account Settings
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            className="eios-user-menu__item"
                        >
                            Change Password
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            className="eios-user-menu__item"
                        >
                            Activity Log
                        </button>

                        <div className="eios-user-menu__divider" />

                        <button
                            type="button"
                            role="menuitem"
                            className="eios-user-menu__item eios-user-menu__item--danger"
                            onClick={handleLogoutRequest}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {showLogoutConfirm && (
                <div
                    className="eios-modal-backdrop"
                    role="presentation"
                >
                    <div
                        className="eios-logout-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                    >
                        <div className="eios-logout-modal__icon">
                            ↪
                        </div>

                        <h2 id="logout-dialog-title">
                            Sign Out of EIOS?
                        </h2>

                        <p>
                            Your current secure session will end.
                            Any unsaved work may be lost.
                        </p>

                        <div className="eios-logout-modal__actions">
                            <button
                                type="button"
                                className="eios-button eios-button--secondary"
                                onClick={handleLogoutCancel}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="eios-button eios-button--danger"
                                onClick={handleLogoutConfirm}
                            >
                                Sign Out Securely
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default UserMenu;