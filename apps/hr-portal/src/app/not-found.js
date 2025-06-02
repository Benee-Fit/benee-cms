import Link from 'next/link';

// This is a simplified not-found page that should avoid prerendering issues
export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '70vh', 
      padding: '0 1rem' 
    }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0070f3' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'semibold', marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          borderRadius: '0.25rem', 
          textDecoration: 'none',
          fontWeight: 'medium'
        }}>
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
