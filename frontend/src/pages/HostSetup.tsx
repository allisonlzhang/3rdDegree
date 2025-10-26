import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const HostSetup = () => {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement host setup logic
    console.log('Host setup:', { name })
    navigate('/host')
  }

  return (
    <div className="host-setup-container">
      <h1>Welcome to Third Degree!</h1>
      <h2>Let's set up your host profile</h2>
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
        <button type="submit">Complete Setup</button>
      </form>
    </div>
  )
}

export default HostSetup
