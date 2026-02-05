import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className="container">
      <main style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        gap: '4rem',
        padding: '4rem 0'
      }}>
        <section>
          <div className="glass" style={{
            padding: '8px 16px',
            display: 'inline-block',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--nature-green)'
          }}>
            Your AI Gardening Companion
          </div>
          <h1 style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Grow healthy plants with <span style={{ color: 'var(--nature-green)' }}>confidence.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--foreground)', opacity: 0.8, marginBottom: '2.5rem', maxWidth: '500px' }}>
            Meet Puddlefoot, the meticulous penguin who knows exactly what your plants need. From indoor ferns to outdoor tomatoes, we've got you covered.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="button-primary" style={{ padding: '16px 32px', fontSize: '1.125rem' }}>
              Meet Puddlefoot
            </button>
            <button className="glass" style={{
              padding: '16px 32px',
              fontSize: '1.125rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              How it works
            </button>
          </div>
        </section>

        <section style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="penguin-float" style={{
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '1',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
          }}>
            <Image
              src="/puddlefoot.png"
              alt="Puddlefoot the Penguin"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Decorative elements */}
          <div className="glass" style={{
            position: 'absolute',
            bottom: '-2rem',
            right: '-2rem',
            padding: '1.5rem',
            zIndex: 3,
            maxWidth: '240px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--nature-green)' }}></div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Plant Status: Healthy</span>
            </div>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>
              "Your Monstera is looking quite thirsty, friend. I suggest a deep soak today!" — Puddlefoot
            </p>
          </div>

          <div style={{
            position: 'absolute',
            top: '-2rem',
            left: '-2rem',
            width: '120px',
            height: '120px',
            background: 'var(--accent-orange)',
            filter: 'blur(80px)',
            opacity: 0.3,
            zIndex: 1
          }}></div>
        </section>
      </main>

      <section style={{ padding: '4rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem' }}>Features crafted for growth</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { title: "Plant Identification", desc: "Snap a photo and Puddlefoot will identify your plant and its specific needs instantly.", icon: "📸" },
            { title: "Smart Reminders", desc: "Never forget a watering or fertilizing session again with tailored schedules.", icon: "⏰" },
            { title: "Disease Diagnostic", desc: "Leaves turning yellow? Puddlefoot's meticulous eye can spot diseases early.", icon: "🔍" }
          ].map((feature, i) => (
            <div key={i} className="glass" style={{ padding: '2.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '1rem' }}>{feature.title}</h3>
              <p style={{ opacity: 0.7 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
