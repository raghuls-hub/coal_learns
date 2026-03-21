import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    DashboardIcon,
    CertificateIcon,
    LearningIcon,
    ExploreIcon,
    LogoutIcon,
} from './Icons';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Simple verification to ensure we render Outlet even if user data is loading/missing for some reason (handled by ProtectedRoute)
    if (!user) return <Outlet />;

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.logoContainer}>
                    <h2 style={styles.logo}>LMS Portal</h2>
                    <span style={styles.roleBadge}>Candidate</span>
                </div>

                <nav style={styles.nav}>
                    <NavItem
                        to="/dashboard"
                        icon={<DashboardIcon size={18} />}
                        label="Dashboard"
                        isActive={location.pathname === '/dashboard'}
                        navigate={navigate}
                    />
                    <NavItem
                        to="/my-learning"
                        icon={<LearningIcon size={18} />}
                        label="My Learning"
                        isActive={location.pathname === '/my-learning'}
                        navigate={navigate}
                    />
                    <NavItem
                        to="/certificates"
                        icon={<CertificateIcon size={18} />}
                        label="Certificates"
                        isActive={location.pathname === '/certificates'}
                        navigate={navigate}
                    />
                    {/* Add more nav items as needed */}
                </nav>

                <div style={styles.userSection}>
                    <div style={styles.userProfile}>
                        <div style={styles.avatar}>
                            {user.profile?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div style={styles.userInfo}>
                            <p style={styles.userName}>{user.profile?.firstName} {user.profile?.lastName}</p>
                            <p style={styles.userEmail}>{user.email}</p>
                        </div>
                    </div>
                    <button onClick={logout} style={styles.logoutBtn}>
                        <LogoutIcon size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

const NavItem = ({ to, icon, label, isActive, navigate }) => (
    <div
        onClick={() => navigate(to)}
        style={{
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {})
        }}
    >
        <span style={styles.navIcon}>{icon}</span>
        <span>{label}</span>
    </div>
);

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f7fafc',
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed', // Fixed sidebar for desktop
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 10,
    },
    logoContainer: {
        padding: '2rem',
        borderBottom: '1px solid #edf2f7',
    },
    logo: {
        fontSize: '24px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
    },
    roleBadge: {
        fontSize: '12px',
        color: '#718096',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: '600',
        marginTop: '0.5rem',
        display: 'block',
    },
    nav: {
        padding: '2rem 1rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        borderRadius: '12px',
        cursor: 'pointer',
        color: '#718096',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    navItemActive: {
        backgroundColor: '#ebf4ff',
        color: '#5a67d8',
        fontWeight: '600',
    },
    navIcon: {
        marginRight: '1rem',
        fontSize: '20px',
    },
    userSection: {
        padding: '1.5rem',
        borderTop: '1px solid #edf2f7',
        backgroundColor: '#f8fafc',
    },
    userProfile: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem',
        gap: '0.75rem',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#c3dafe',
        color: '#434190',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
    },
    userInfo: {
        overflow: 'hidden',
    },
    userName: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#2d3748',
        margin: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    userEmail: {
        fontSize: '12px',
        color: '#718096',
        margin: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    logoutBtn: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #cbd5e0',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#4a5568',
        cursor: 'pointer',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
    },
    main: {
        flex: 1,
        marginLeft: '280px', // Offset for fixed sidebar
        padding: '2rem',
        width: 'calc(100% - 280px)', // Ensure width is correct
    },
};
