import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const Header = () => {
  const navigate = useNavigate()
  const { isHostAuthenticated, isGuestAuthenticated } = useAuth()

  const handleLogoClick = () => {
    // If logged in, go to appropriate dashboard; otherwise go to home
    if (isHostAuthenticated) {
      navigate('/host')
    } else if (isGuestAuthenticated) {
      navigate('/guest')
    } else {
      navigate('/')
    }
  }

  const handleUserClick = () => {
    // If logged in, go to appropriate dashboard; otherwise go to home
    if (isHostAuthenticated) {
      navigate('/host')
    } else if (isGuestAuthenticated) {
      navigate('/guest')
    } else {
      navigate('/')
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container" onClick={handleLogoClick}>
          <div className="logo-box"></div>
        </div>
        <div className="user-container" onClick={handleUserClick}>
          <div className="user-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
              <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
