using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private string connectionString = "server=localhost;user=root;password=rania12..?Ij;database=teamtrack;";

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                // Check if email already exists
                string checkQuery = "SELECT COUNT(*) FROM users WHERE Email=@Email";
                var checkCmd = new MySqlCommand(checkQuery, connection);
                checkCmd.Parameters.AddWithValue("@Email", request.Email);
                var count = Convert.ToInt32(checkCmd.ExecuteScalar());
                if (count > 0)
                    return BadRequest(new { message = "Email already registered" });

                string query = "INSERT INTO users (Email, Name, Password) VALUES (@Email, @Name, @Password)";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Email", request.Email);
                cmd.Parameters.AddWithValue("@Name", request.Name ?? "");
                cmd.Parameters.AddWithValue("@Password", request.Password);
                cmd.ExecuteNonQuery();

                return Ok(new { message = "Registered successfully! Please log in." });
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string query = "SELECT Id, Email, Name, IsAdmin FROM users WHERE Email=@Email AND Password=@Password";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Email", request.Email);
                cmd.Parameters.AddWithValue("@Password", request.Password);

                var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return Ok(new
                    {
                        message = "Login successful",
                        userId = reader.GetInt32("Id"),
                        email = reader.GetString("Email"),
                        name = reader.IsDBNull(reader.GetOrdinal("Name")) ? "" : reader.GetString("Name"),
                        isAdmin = reader.GetBoolean("IsAdmin")
                    });
                }
            }

            return Unauthorized(new { message = "Invalid email or password" });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Name { get; set; }
        public string Password { get; set; }
    }
}