import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const Home = () => {
  const navigate = useNavigate()
  const { isHostAuthenticated, isGuestAuthenticated } = useAuth()

  const handleHostLogin = () => {
    navigate('/login')
  }

  const handleGuestLogin = () => {
    navigate('/guest/login')
  }

  return (
    <div className="home-container">
      <h1>Third Degree</h1>
      <p>Your party RSVP platform</p>
      
      {/* Host Login Section - always shown unless already authenticated as host */}
      {!isHostAuthenticated && (
        <div className="login-section">
          <h2>Host Login</h2>
          <p>Create and manage your parties</p>
          <button onClick={handleHostLogin} className="login-btn">
            Host Login
          </button>
        </div>
      )}
      
      {/* Guest Login Section - always shown unless already authenticated as guest */}
      {!isGuestAuthenticated && (
        <div className="guest-section">
          <h2>Guest Access</h2>
          <p>View your RSVPs and party invitations</p>
          <button onClick={handleGuestLogin} className="guest-btn">
            Guest Login
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
