import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Users, Sparkles, Coffee } from 'lucide-react';

export default function DiscoverCategories() {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'relationship',
      title: 'Beziehungen',
      icon: Heart,
      description: 'Suche ernsthafte Beziehungen und Liebe',
      color: 'from-pink-500 to-red-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'friendship',
      title: 'Freundschaft',
      icon: Users,
      description: 'Möchte neue Freunde finden',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'intimate_services',
      title: 'Bezahlte Dienstleistungen',
      icon: Sparkles,
      description: 'Escort und VIP-Begleitung',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'casual',
      title: 'Ohne Verpflichtungen',
      icon: Coffee,
      description: 'Leichte Kommunikation und Treffen',
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  const handleCategorySelect = (categoryId) => {
    navigate(`/discover?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück
          </Link>
          <h1 className="text-2xl font-bold text-pink-600">Kategorie auswählen</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Was suchen Sie?
          </h2>
          <p className="text-gray-600">
            Wählen Sie eine Dating-Kategorie, um Übereinstimmungen zu finden
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`${category.bgColor} border-2 ${category.borderColor} rounded-2xl p-8 text-left hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {category.title}
                </h3>

                <p className="text-gray-700">
                  {category.description}
                </p>

                <div className="mt-6 flex items-center text-sm font-semibold">
                  <span className={`bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
                    Suche starten →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xl">💡</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-2">
                Sie können in verschiedenen Kategorien suchen
              </h4>
              <p className="text-sm text-blue-800">
                Beschränken Sie sich nicht auf eine Kategorie! Kehren Sie jederzeit zu dieser Seite zurück,
                um zu einer anderen Dating-Kategorie zu wechseln. Ihr Profil bleibt in Ihrer
                Hauptkategorie, aber Sie können Menschen aus jeder Kategorie suchen.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg p-4 shadow text-center"
            >
              <div className={`inline-flex w-10 h-10 rounded-full bg-gradient-to-br ${category.color} items-center justify-center mb-2`}>
                <category.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-600">{category.title}</p>
              <p className="text-lg font-bold text-gray-900">—</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
