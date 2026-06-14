using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using BCrypt.Net;

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
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email and password are required" });

            if (request.Password.Length < 4)
                return BadRequest(new { message = "Password must be at least 4 characters" });

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

                // Hash the password before storing
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                string query = "INSERT INTO users (Email, Name, Password) VALUES (@Email, @Name, @Password)";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Email", request.Email);
                cmd.Parameters.AddWithValue("@Name", request.Name ?? "");
                cmd.Parameters.AddWithValue("@Password", hashedPassword);
                cmd.ExecuteNonQuery();

                return Ok(new { message = "Registered successfully! Please log in." });
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email and password are required" });

            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                // Get user by email only first
                string query = "SELECT Id, Email, Name, Password, IsAdmin FROM users WHERE Email=@Email";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Email", request.Email);

                var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    string storedPassword = reader.GetString("Password");
                    bool isValid = false;

                    // Support both hashed and plain text passwords
                    // (for existing users before hashing was added)
                    try
                    {
                        isValid = BCrypt.Net.BCrypt.Verify(request.Password, storedPassword);
                    }
                    catch
                    {
                        // If BCrypt fails, try plain text comparison for old accounts
                        isValid = storedPassword == request.Password;
                    }

                    if (isValid)
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
            }

            return Unauthorized(new { message = "Invalid email or password" });
        }

        [HttpGet("profile/{userId}")]
        public IActionResult GetProfile(int userId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = "SELECT Id, Name, Email, Bio, IsAdmin FROM users WHERE Id=@Id";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Id", userId);
                var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return Ok(new
                    {
                        userId = reader.GetInt32("Id"),
                        name = reader.IsDBNull(reader.GetOrdinal("Name")) ? "" : reader.GetString("Name"),
                        email = reader.GetString("Email"),
                        bio = reader.IsDBNull(reader.GetOrdinal("Bio")) ? "" : reader.GetString("Bio"),
                        isAdmin = reader.GetBoolean("IsAdmin")
                    });
                }
                return NotFound(new { message = "User not found" });
            }
        }

        [HttpPost("updateprofile")]
        public IActionResult UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = "UPDATE users SET Name=@Name, Bio=@Bio WHERE Id=@Id";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Name", request.Name ?? "");
                cmd.Parameters.AddWithValue("@Bio", request.Bio ?? "");
                cmd.Parameters.AddWithValue("@Id", request.UserId);
                cmd.ExecuteNonQuery();
                return Ok(new { message = "Profile updated successfully" });
            }
        }

        [HttpPost("changepassword")]
        public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (request.NewPassword.Length < 4)
                return BadRequest(new { message = "New password must be at least 4 characters" });

            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(new { message = "Passwords do not match" });

            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                // Get current password
                string getQuery = "SELECT Password FROM users WHERE Id=@Id";
                var getCmd = new MySqlCommand(getQuery, connection);
                getCmd.Parameters.AddWithValue("@Id", request.UserId);
                var storedPassword = getCmd.ExecuteScalar()?.ToString();

                if (storedPassword == null)
                    return NotFound(new { message = "User not found" });

                // Verify old password (support both hashed and plain text)
                bool isValid = false;
                try
                {
                    isValid = BCrypt.Net.BCrypt.Verify(request.OldPassword, storedPassword);
                }
                catch
                {
                    isValid = storedPassword == request.OldPassword;
                }

                if (!isValid)
                    return BadRequest(new { message = "Current password is incorrect" });

                // Hash the new password
                string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                string updateQuery = "UPDATE users SET Password=@Password WHERE Id=@Id";
                var updateCmd = new MySqlCommand(updateQuery, connection);
                updateCmd.Parameters.AddWithValue("@Password", newHashedPassword);
                updateCmd.Parameters.AddWithValue("@Id", request.UserId);
                updateCmd.ExecuteNonQuery();

                return Ok(new { message = "Password changed successfully" });
            }
        }
    }

    public class LoginRequest { public string Email { get; set; } public string Password { get; set; } }
    public class RegisterRequest { public string Email { get; set; } public string Name { get; set; } public string Password { get; set; } }
    public class UpdateProfileRequest { public int UserId { get; set; } public string Name { get; set; } public string Bio { get; set; } }
    public class ChangePasswordRequest { public int UserId { get; set; } public string OldPassword { get; set; } public string NewPassword { get; set; } public string ConfirmPassword { get; set; } }
}