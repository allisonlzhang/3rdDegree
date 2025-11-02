import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const HostSetup = () => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Client-side validation
    if (name.trim().length === 0) {
      setError('Please enter your name')
      setIsLoading(false)
      return
    }

    if (name.trim().length > 100) {
      setError('Name must be 100 characters or less')
      setIsLoading(false)
      return
    }

    try {
      await setup(name.trim())
      navigate('/host')
    } catch (err: any) {
      setError(err.message || 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="host-setup-container">
      <h1>Welcome to Third Degree!</h1>
      <h2>Let's set up your host profile</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  )
}

export default HostSetup
