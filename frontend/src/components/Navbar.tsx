import { useNavigate } from 'react-router-dom';
import { Menu, Calendar, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container-app">
        <div className="h-16 flex items-center justify-between">
          {/* Left side - Logo and menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={onMenuClick}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center ml-2 md:ml-0">
              <Calendar className="h-6 w-6 text-primary-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">Calendar</span>
            </div>
          </div>
          
          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={16} className="text-primary-700" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {user?.username || 'User'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;