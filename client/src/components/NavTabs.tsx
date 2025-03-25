import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';

const tabs = [
  { id: 'scout', path: '/', icon: 'assessment', label: 'Scout Match' },
  { id: 'team', path: '/team', icon: 'people', label: 'View Team' },
  { id: 'sync', path: '/sync', icon: 'sync', label: 'Export/Import' }
];

export default function NavTabs() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    // Set active tab based on current location
    const index = tabs.findIndex(tab => tab.path === location);
    if (index !== -1) {
      setActiveTab(index);
    }
  }, [location]);
  
  return (
    <div className="sticky top-0 bg-white z-30 shadow-sm">
      <div className="flex justify-around text-gray-600 relative">
        {tabs.map((tab, index) => (
          <Link 
            key={tab.id}
            href={tab.path}
            className={`tab-btn flex-1 py-3 flex flex-col items-center ${
              index === activeTab ? 'text-primary font-medium' : ''
            }`}
          >
            <span className="material-icons">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </Link>
        ))}
        {/* Active tab indicator */}
        <div 
          className="tab-indicator absolute bottom-0 left-0 h-0.5 bg-primary transform"
          style={{ 
            width: `${100 / tabs.length}%`, 
            transform: `translateX(${activeTab * 100}%)`,
            transition: 'transform 0.3s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}
