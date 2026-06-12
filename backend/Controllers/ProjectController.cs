using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        [HttpPost("create")]
        public IActionResult CreateProject([FromBody] ProjectRequest request)
        {
            string connectionString = "server=localhost;user=root;password=rania12..?Ij;database=teamtrack;";

            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string query = "INSERT INTO Projects (Name, Description) VALUES (@Name, @Description)";
                var cmd = new MySqlCommand(query, connection);

                cmd.Parameters.AddWithValue("@Name", request.Name);
                cmd.Parameters.AddWithValue("@Description", request.Description);

                cmd.ExecuteNonQuery();
            }

            return Ok(new { message = "Project created successfully" });
        }

        // ✅ THIS MUST BE INSIDE THE CLASS
        [HttpGet("test")]
        public string Test()
        {
            return "Project API working";
        }
    }

    public class ProjectRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }
}