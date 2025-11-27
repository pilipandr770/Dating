import { Link } from 'react-router-dom';
import { Heart, Shield, Brain, Users, Video, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          LoveMatch
        </h1>
        <p className="text-2xl text-gray-600 mb-4">
          Dating der neuen Generation in Deutschland
        </p>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Wählen Sie Ihr Dating-Ziel. Künstliche Intelligenz schützt Sie vor Betrügern
          und hilft bei der Kommunikation. Sicher, transparent, legal.
        </p>
        <Link
          to="/register"
          className="inline-block bg-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-pink-700 transition"
        >
          Jetzt kennenlernen
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-pink-600 hover:underline">
            Anmelden
          </Link>
        </p>
      </section>

      {/* 4 Types of Dating */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          4 Dating-Typen
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GoalCard
            icon={<Heart className="w-12 h-12 text-red-500" />}
            title="Beziehung"
            description="Suchen Sie Liebe und langfristige Beziehungen"
          />
          <GoalCard
            icon={<Users className="w-12 h-12 text-blue-500" />}
            title="Freundschaft"
            description="Neue Freunde und interessante Bekanntschaften"
          />
          <GoalCard
            icon={<Heart className="w-12 h-12 text-pink-500" />}
            title="Intimdienste"
            description="Legale Dienstleistungen mit Verifizierung und sicheren Zahlungen"
            badge="Verifizierung erforderlich"
          />
          <GoalCard
            icon={<Heart className="w-12 h-12 text-purple-500" />}
            title="Gelegentliche Treffen"
            description="Casual Dating ohne Verpflichtungen"
          />
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Unsere Vorteile
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-10 h-10 text-purple-600" />}
              title="KI-Assistent"
              description="Kommunikationshilfe und intelligente Dialogtipps"
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-green-600" />}
              title="Betrugschutz"
              description="KI erkennt automatisch Betrugsanzeichen und warnt Sie"
            />
            <FeatureCard
              icon={<Video className="w-10 h-10 text-blue-600" />}
              title="Kino"
              description="Filme gemeinsam online schauen (Premium-Plan)"
            />
            <FeatureCard
              icon={<CheckCircle className="w-10 h-10 text-pink-600" />}
              title="Verifizierung"
              description="Alle Dienstleister durchlaufen eine obligatorische Überprüfung"
            />
            <FeatureCard
              icon={<Heart className="w-10 h-10 text-red-600" />}
              title="Trust Score"
              description="Vertrauenssystem schützt vor verdächtigen Nutzern"
            />
            <FeatureCard
              icon={<Users className="w-10 h-10 text-indigo-600" />}
              title="Smart Matching"
              description="Algorithmus findet Matches nach Ihren Präferenzen"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Tarifpläne
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price="€0"
            features={[
              'Bis zu 10 Matches pro Tag',
              'Basis-Chat',
              'Profil mit Fotos',
            ]}
            notIncluded={['KI-Assistent', 'Kino', 'Suchpriorität']}
          />
          <PricingCard
            name="Standard"
            price="€9,99"
            popular
            features={[
              'Bis zu 50 Matches pro Tag',
              'KI-Assistent',
              'KI-Betrugsschutz',
              'Kino',
              'Suchpriorität',
            ]}
          />
          <PricingCard
            name="Premium"
            price="€19,99"
            features={[
              'Unbegrenzte Matches',
              'Alle Standard-Funktionen',
              'Video-Chat',
              'Verschwindende Nachrichten',
              'Erweiterte Analysen',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Bereit anzufangen?
          </h2>
          <p className="text-xl mb-8">
            Treten Sie LoveMatch heute bei
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-pink-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function GoalCard({ icon, title, description, badge }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
      <p className="text-gray-600 text-center text-sm mb-2">{description}</p>
      {badge && (
        <span className="block text-xs text-center bg-yellow-100 text-yellow-800 py-1 px-2 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, features, notIncluded, popular }) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 ${popular ? 'ring-2 ring-pink-600' : ''}`}>
      {popular && (
        <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm">
          Beliebt
        </span>
      )}
      <h3 className="text-2xl font-bold mt-4">{name}</h3>
      <p className="text-4xl font-bold my-4">{price}<span className="text-lg text-gray-500">/Monat</span></p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
        {notIncluded?.map((feature, i) => (
          <li key={i} className="flex items-start text-gray-400">
            <span className="mr-2">✕</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
        Plan wählen
      </button>
    </div>
  );
}
