document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const userData = Object.fromEntries(formData.entries());
  
    try {
      const response = await axios.post('https://farmhub-backend.onrender.com/login', userData);
      const token = response.data.token;
      localStorage.setItem('adminToken', token);
      alert('Login successful');
      this.reset();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed');
    }
  });
  
  document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const userData = Object.fromEntries(formData.entries());
    const token = localStorage.getItem('adminToken');
  
    try {
      const response = await axios.post('https://farmhub-backend.onrender.com/register', userData, { headers: { Authorization: token } });
      alert(response.data.message);
      this.reset();
      fetchUsers();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed');
    }
  });  