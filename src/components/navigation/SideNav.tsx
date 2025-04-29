import React from 'react';
import { Home, BookOpen, ClipboardCheck, MessageSquare } from 'lucide-react';

/**
 * Simplified sidebar navigation with a link to the flashcard review page
 */
const SideNav: React.FC = () => {
  return (
    <div className="w-64 h-screen bg-white border-r p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">10x Flashcards</h2>
      </div>
      
      <nav className="space-y-1">
        <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Home" />
        <NavItem href="/flashcards" icon={<BookOpen className="h-5 w-5" />} label="My Flashcards" />
        
        {/* Flashcard Review Link */}
        <a 
          href="/flashcards/review"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
        >
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <span>Review AI Flashcards</span>
          <span className="ml-auto inline-flex items-center justify-center bg-blue-600 text-white h-5 min-w-5 px-1 rounded-full text-xs font-semibold">
            3
          </span>
        </a>
        
        {/* OpenRouter Chat Demo Link */}
        <NavItem 
          href="/chat-demo" 
          icon={<MessageSquare className="h-5 w-5 text-green-600" />} 
          label="OpenRouter Chat Demo" 
        />
      </nav>
    </div>
  );
};

// Helper component for navigation items
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label }) => {
  return (
    <a 
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
};

export default SideNav; 