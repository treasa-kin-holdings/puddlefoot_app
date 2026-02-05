import Link from 'next/link';

export default function Navigation() {
    return (
        <nav className="glass container" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '1.5rem auto',
            padding: '0.75rem 1.5rem',
            position: 'sticky',
            top: '1rem',
            zIndex: 100
        }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontSize: '1.5rem' }}>🐧</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Puddlefoot</span>
            </Link>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <Link href="/dashboard" style={{ fontWeight: 500, opacity: 0.8 }}>Dashboard</Link>
                <Link href="/plants" style={{ fontWeight: 500, opacity: 0.8 }}>My Plants</Link>
                <Link href="/assistant" style={{ fontWeight: 500, opacity: 0.8 }}>Assistant</Link>
                <button className="button-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)' }}>
                    Sign In
                </button>
            </div>
        </nav>
    );
}
