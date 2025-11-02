import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { apiClient } from '../lib/api'

const Login = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Client-side validation
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      // First try to login
      const response = await apiClient.login({ phone, password })
      await login(response.access_token)
      
      // Get host data to check if setup is needed
      const host = await apiClient.getCurrentHost()
      
      // Check if host needs setup
      if (!host.is_setup_complete) {
        navigate('/host/setup')
      } else {
        navigate('/host')
      }
    } catch (loginError: any) {
      // If login fails, try signup (first-time login creates account)
      if (loginError.message.includes('Incorrect phone number or password') || 
          loginError.message.includes('User not found')) {
        try {
          await apiClient.signup({ phone, password })
          // After successful signup, try login again
          const response = await apiClient.login({ phone, password })
          await login(response.access_token)
          navigate('/host/setup') // New users always go to setup
        } catch (signupError: any) {
          // Handle signup validation errors with user-friendly messages
          if (signupError.message.includes('ensure this value has at least 6 characters')) {
            setError('Password must be at least 6 characters long')
          } else if (signupError.message.includes('ensure this value has exactly 10 characters')) {
            setError('Please enter a valid 10-digit phone number')
          } else {
            setError(signupError.message || 'Failed to create account')
          }
        }
      } else {
        // Handle login validation errors with user-friendly messages
        if (loginError.message.includes('ensure this value has at least 6 characters')) {
          setError('Password must be at least 6 characters long')
        } else if (loginError.message.includes('ensure this value has exactly 10 characters')) {
          setError('Please enter a valid 10-digit phone number')
        } else {
          setError(loginError.message || 'Login failed')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 10)
  }

  return (
    <div className="login-container">
      <h1>Third Degree</h1>
      <h2>Host Sign In</h2>
      <p className="login-description">This login is for hosts who want to create and manage parties. Guests can view their RSVPs using the guest login option.</p>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="1234567890"
            maxLength={10}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default Login
