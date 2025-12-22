import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  activeSection?: 'agendamentos' | 'servicos' | 'barbeiros';
  onSectionChange?: (section: 'agendamentos' | 'servicos' | 'barbeiros') => void;
}

const AdminHeader = ({ activeSection = 'agendamentos', onSectionChange }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    if (onSectionChange && (sectionId === 'agendamentos' || sectionId === 'servicos' || sectionId === 'barbeiros')) {
      onSectionChange(sectionId as 'agendamentos' | 'servicos' | 'barbeiros');
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const navSections = [
    { id: 'agendamentos', label: 'Termine' },
    { id: 'servicos', label: 'Dienstleistungen' },
    { id: 'barbeiros', label: 'Barbiere' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-soft">
      <div className="container-custom">
        <nav className="relative flex items-center justify-between h-16 px-4 md:px-0">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/images/logo.png"
              alt="Rödelheimer Barber Shop Logo"
              className="h-11 w-auto"
            />
            <span
              className="text-xl md:text-2xl tracking-widest"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Rödelheimer
            </span>
          </button>

          {/* Desktop-Navigation - Centralizada */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'text-foreground'
                    : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Espaço vazio à direita para balancear (mesma largura do logo) */}
          <div className="hidden md:block w-[200px]" />

          {/* Mobile-Menü-Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobiles Menü */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border py-4">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`block w-full text-left px-4 py-3 transition-colors ${
                  activeSection === section.id
                    ? 'text-foreground bg-secondary'
                    : 'text-foreground/80 hover:text-foreground hover:bg-secondary'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
