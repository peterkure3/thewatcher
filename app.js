// Event listener for admin login form
document.getElementById('LoginForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  const formData = new FormData(this);
  const adminData = Object.fromEntries(formData.entries());

  try {
    const response = await axios.post('https://thewatcher-backend.onrender.com/login', adminData);
    const token = response.data.token;
    localStorage.setItem('adminToken', token);
    alert('Admin login successful');
    this.reset();
  } catch (error) {
    console.error('Admin login failed:', error);
    alert('Admin login failed');
  }
});

// Event listener for admin registration form
document.getElementById('adminRegisterForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  const formData = new FormData(this);
  const adminData = Object.fromEntries(formData.entries());
  const token = localStorage.getItem('adminToken');

  try {
    const response = await axios.post('https://thewatcher-backend.onrender.com/admin/register', adminData, { headers: { Authorization: token } });
    alert(response.data.message);
    this.reset();
    // Optionally, you can fetch users after successful registration
    fetchUsers();
  } catch (error) {
    console.error('Admin registration failed:', error);
    alert('Admin registration failed');
  }
});

// Event listener for user registration form
document.getElementById('userRegisterForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  const formData = new FormData(this);
  const userData = Object.fromEntries(formData.entries());
  // Assuming you have a separate token for user authentication
  const userToken = localStorage.getItem('userToken');

  try {
    const response = await axios.post('https://thewatcher-backend.onrender.com/register', userData, { headers: { Authorization: userToken } });
    alert(response.data.message);
    this.reset();
  } catch (error) {
    console.error('User registration failed:', error);
    alert('User registration failed');
  }
});
