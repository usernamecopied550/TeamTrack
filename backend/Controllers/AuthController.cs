using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            string connectionString = "server=localhost;user=root;password=rania12..?Ij;database=teamtrack;";

            using (var connection = new MySqlConnection(connectionString)) //MySQL usage
            {
                connection.Open();

                string query = "SELECT * FROM Users WHERE Email=@Email AND Password=@Password";
                var cmd = new MySqlCommand(query, connection);

                cmd.Parameters.AddWithValue("@Email", request.Email);
                cmd.Parameters.AddWithValue("@Password", request.Password);

                var reader = cmd.ExecuteReader();

                if (reader.HasRows)
                {
                    return Ok(new { message = "Login successful" });
                }
            }

            return Unauthorized(new { message = "Invalid credentials" });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] LoginRequest request)
        {
            string connectionString = "server=localhost;user=root;password=rania12..?Ij;database=teamtrack;";

            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string query = "INSERT INTO Users (Email, Password) VALUES (@Email, @Password)";
                var cmd = new MySqlCommand(query, connection);

                cmd.Parameters.AddWithValue("@Email", request.Email);
                cmd.Parameters.AddWithValue("@Password", request.Password);

                cmd.ExecuteNonQuery();
            }

            return Ok(new { message = "User registered successfully" });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}