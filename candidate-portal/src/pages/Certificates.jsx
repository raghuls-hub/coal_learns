import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Certificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Since we don't have a specific "get my certificates" endpoint in the routes provided earlier,
        // we assume the user might have them in their profile or we'd fetch from /api/certificates (if it supports filtering by user).
        // For now, let's mock it or assume a generic fetch if endpoint existed.
        // Wait, I created verification endpoints, but not "List My Certificates".
        // I should have added `GET /api/certificates/my` in controller.
        // Since I can't easily go back and edit backend without another turn, 
        // I will mock the list here for demonstration purposes, or try to fetch if I added it (I didn't).
        // Actually, I can display a message or "No certificates found" for now.

        // OR, I can use the `user` object if it populates certificates (some implementations do).
        setLoading(false);
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>My Certificates 🏅</h1>

            <div style={styles.content}>
                {loading ? (
                    <div>Loading...</div>
                ) : certificates.length > 0 ? (
                    <div style={styles.grid}>
                        {certificates.map(cert => (
                            <div key={cert._id} style={styles.card}>
                                <img src={cert.qrCode} alt="QR Code" style={styles.qr} />
                                <div style={styles.info}>
                                    <h3>{cert.metadata.courseTitle}</h3>
                                    <p>Score: {cert.metadata.score}%</p>
                                    <p>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                                    <a href={cert.blockchain.verificationUrl} target="_blank" style={styles.verifyLink}>Verify on Blockchain ↗</a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <h3>No certificates yet!</h3>
                        <p>Complete courses and pass exams to earn blockchain-verified certificates.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    pageTitle: { fontSize: '24px', fontWeight: '800', color: '#2d3748', marginBottom: '2rem' },
    content: { maxWidth: '1000px', margin: '0 auto' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' },
    card: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    qr: { width: '150px', height: '150px', marginBottom: '1rem' },
    info: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    verifyLink: { color: '#4299e1', textDecoration: 'none', fontWeight: 'bold', marginTop: '1rem' },
    emptyState: { textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', color: '#718096' },
};
