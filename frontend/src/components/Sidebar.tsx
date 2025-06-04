import { NavLink } from 'react-router-dom';
import { Calendar, List, X } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:z-0
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-primary-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Calendar</span>
          </div>
          <button
            type="button"
            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-4">
          <ul className="space-y-1 px-2">
            <li>
              <NavLink
                to="/calendar"
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => onClose()}
              >
                <Calendar size={18} className="mr-2" />
                Calendar View
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/events"
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => onClose()}
              >
                <List size={18} className="mr-2" />
                Event List
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;