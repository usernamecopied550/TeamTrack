using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private string connectionString = "server=localhost;user=root;password=rania12..?Ij;database=teamtrack;";

        // ── GET all projects for a user ──
        [HttpGet("list/{userId}")]
        public IActionResult GetProjects(int userId)
        {
            var projects = new List<object>();
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = @"
                    SELECT p.Id, p.Name, p.Description, p.Deadline, p.Progress, p.AdminId,
                           u.Name as AdminName
                    FROM projects p
                    JOIN project_members pm ON pm.ProjectId = p.Id
                    JOIN users u ON u.Id = p.AdminId
                    WHERE pm.UserId = @UserId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@UserId", userId);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    projects.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        name = reader.GetString("Name"),
                        description = reader.IsDBNull(reader.GetOrdinal("Description")) ? "" : reader.GetString("Description"),
                        deadline = reader.IsDBNull(reader.GetOrdinal("Deadline")) ? "" : reader.GetString("Deadline"),
                        progress = reader.GetInt32("Progress"),
                        adminId = reader.GetInt32("AdminId"),
                        adminName = reader.IsDBNull(reader.GetOrdinal("AdminName")) ? "" : reader.GetString("AdminName"),
                        isAdmin = reader.GetInt32("AdminId") == userId
                    });
                }
            }
            return Ok(projects);
        }

        // ── CREATE project ──
        [HttpPost("create")]
        public IActionResult CreateProject([FromBody] CreateProjectRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = "INSERT INTO projects (Name, Description, Deadline, AdminId, Progress) VALUES (@Name, @Description, @Deadline, @AdminId, 0)";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Name", request.Name);
                cmd.Parameters.AddWithValue("@Description", request.Description ?? "");
                cmd.Parameters.AddWithValue("@Deadline", request.Deadline ?? "");
                cmd.Parameters.AddWithValue("@AdminId", request.AdminId);
                cmd.ExecuteNonQuery();
                long projectId = cmd.LastInsertedId;

                // Add creator as first member
                string memberQuery = "INSERT INTO project_members (ProjectId, UserId) VALUES (@ProjectId, @UserId)";
                var memberCmd = new MySqlCommand(memberQuery, connection);
                memberCmd.Parameters.AddWithValue("@ProjectId", projectId);
                memberCmd.Parameters.AddWithValue("@UserId", request.AdminId);
                memberCmd.ExecuteNonQuery();

                // Auto-add Super Admin to every project if not already the creator
                string getSuperAdmin = "SELECT Id FROM users WHERE IsAdmin = 1 LIMIT 1";
                var superAdminIdCmd = new MySqlCommand(getSuperAdmin, connection);
                var superAdminId = superAdminIdCmd.ExecuteScalar();

                if (superAdminId != null && Convert.ToInt32(superAdminId) != request.AdminId)
                {
                    string superAdminQuery = "INSERT INTO project_members (ProjectId, UserId) VALUES (@ProjectId, @SuperAdminId)";
                    var superAdminCmd = new MySqlCommand(superAdminQuery, connection);
                    superAdminCmd.Parameters.AddWithValue("@ProjectId", projectId);
                    superAdminCmd.Parameters.AddWithValue("@SuperAdminId", Convert.ToInt32(superAdminId));
                    superAdminCmd.ExecuteNonQuery();
                }

                return Ok(new { message = "Project created", projectId });
            }
        }

        // ── ADD member to project (admin only) ──
        [HttpPost("addmember")]
        public IActionResult AddMember([FromBody] AddMemberRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId, Name FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                var adminReader = adminCmd.ExecuteReader();
                if (!adminReader.Read()) return NotFound(new { message = "Project not found" });
                int adminId = adminReader.GetInt32("AdminId");
                string projectName = adminReader.GetString("Name");
                adminReader.Close();

                if (adminId != request.RequesterId)
                    return Unauthorized(new { message = "Only the Project Admin can add members" });

                string findUser = "SELECT Id, Name FROM users WHERE Email=@Email";
                var findCmd = new MySqlCommand(findUser, connection);
                findCmd.Parameters.AddWithValue("@Email", request.MemberEmail);
                var reader = findCmd.ExecuteReader();
                if (!reader.Read())
                    return NotFound(new { message = "No user found with that email" });

                int memberId = reader.GetInt32("Id");
                string memberName = reader.IsDBNull(reader.GetOrdinal("Name")) ? request.MemberEmail : reader.GetString("Name");
                reader.Close();

                string dupCheck = "SELECT COUNT(*) FROM project_members WHERE ProjectId=@ProjectId AND UserId=@UserId";
                var dupCmd = new MySqlCommand(dupCheck, connection);
                dupCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                dupCmd.Parameters.AddWithValue("@UserId", memberId);
                var dup = Convert.ToInt32(dupCmd.ExecuteScalar());
                if (dup > 0)
                    return BadRequest(new { message = "User is already a member" });

                string insertMember = "INSERT INTO project_members (ProjectId, UserId) VALUES (@ProjectId, @UserId)";
                var insertCmd = new MySqlCommand(insertMember, connection);
                insertCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                insertCmd.Parameters.AddWithValue("@UserId", memberId);
                insertCmd.ExecuteNonQuery();

                string notifQuery = "INSERT INTO notifications (UserId, Message) VALUES (@UserId, @Message)";
                var notifCmd = new MySqlCommand(notifQuery, connection);
                notifCmd.Parameters.AddWithValue("@UserId", memberId);
                notifCmd.Parameters.AddWithValue("@Message", $"You have been added to the project: {projectName}");
                notifCmd.ExecuteNonQuery();

                return Ok(new { message = $"{memberName} added to project", memberName, memberId });
            }
        }

        // ── REMOVE member from project (Project Admin only) ──
        [HttpDelete("{projectId}/removemember/{memberId}/{requesterId}")]
        public IActionResult RemoveMember(int projectId, int memberId, int requesterId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", projectId);
                var adminId = adminCmd.ExecuteScalar();
                if (adminId == null || Convert.ToInt32(adminId) != requesterId)
                    return Unauthorized(new { message = "Only the Project Admin can remove members" });

                if (memberId == requesterId)
                    return BadRequest(new { message = "You cannot remove yourself as admin" });

                // Prevent removing Super Admin
                string getSuperAdmin = "SELECT Id FROM users WHERE IsAdmin = 1 LIMIT 1";
                var superCmd = new MySqlCommand(getSuperAdmin, connection);
                var superAdminId = Convert.ToInt32(superCmd.ExecuteScalar());
                if (memberId == superAdminId)
                    return BadRequest(new { message = "The Super Admin cannot be removed from a project" });

                string query = "DELETE FROM project_members WHERE ProjectId=@ProjectId AND UserId=@UserId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                cmd.Parameters.AddWithValue("@UserId", memberId);
                cmd.ExecuteNonQuery();

                return Ok(new { message = "Member removed from project" });
            }
        }

        // ── GET members of a project ──
        [HttpGet("{projectId}/members")]
        public IActionResult GetMembers(int projectId)
        {
            var members = new List<object>();
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = @"SELECT u.Id, u.Name, u.Email FROM users u
                                 JOIN project_members pm ON pm.UserId = u.Id
                                 WHERE pm.ProjectId = @ProjectId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    members.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        name = reader.IsDBNull(reader.GetOrdinal("Name")) ? "" : reader.GetString("Name"),
                        email = reader.GetString("Email")
                    });
                }
            }
            return Ok(members);
        }

        // ── GET tasks for a project ──
        [HttpGet("{projectId}/tasks")]
        public IActionResult GetTasks(int projectId)
        {
            var tasks = new List<object>();
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = @"SELECT t.Id, t.Title, t.Status, t.Priority, u.Name as AssignedTo
                                 FROM tasks t
                                 LEFT JOIN users u ON u.Id = t.AssignedTo
                                 WHERE t.ProjectId = @ProjectId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    tasks.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        title = reader.GetString("Title"),
                        status = reader.GetString("Status"),
                        priority = reader.GetString("Priority"),
                        assignedTo = reader.IsDBNull(reader.GetOrdinal("AssignedTo")) ? "Unassigned" : reader.GetString("AssignedTo")
                    });
                }
            }
            return Ok(tasks);
        }

        // ── CREATE task (Project Admin only) ──
        [HttpPost("addtask")]
        public IActionResult AddTask([FromBody] AddTaskRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId, Name FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                var adminReader = adminCmd.ExecuteReader();
                if (!adminReader.Read()) return NotFound(new { message = "Project not found" });
                int adminId = adminReader.GetInt32("AdminId");
                string projectName = adminReader.GetString("Name");
                adminReader.Close();

                if (adminId != request.RequesterId)
                    return Unauthorized(new { message = "Only the Project Admin can assign tasks" });

                string query = "INSERT INTO tasks (ProjectId, Title, AssignedTo, Status, Priority) VALUES (@ProjectId, @Title, @AssignedTo, 'todo', @Priority)";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                cmd.Parameters.AddWithValue("@Title", request.Title);
                cmd.Parameters.AddWithValue("@AssignedTo", request.AssignedToId);
                cmd.Parameters.AddWithValue("@Priority", request.Priority ?? "Medium");
                cmd.ExecuteNonQuery();

                string notifQuery = "INSERT INTO notifications (UserId, Message) VALUES (@UserId, @Message)";
                var notifCmd = new MySqlCommand(notifQuery, connection);
                notifCmd.Parameters.AddWithValue("@UserId", request.AssignedToId);
                notifCmd.Parameters.AddWithValue("@Message", $"You have been assigned a new task: {request.Title} in {projectName}");
                notifCmd.ExecuteNonQuery();

                return Ok(new { message = "Task added" });
            }
        }

        // ── UPDATE task status ──
        [HttpPost("updatetask")]
        public IActionResult UpdateTask([FromBody] UpdateTaskRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string query = "UPDATE tasks SET Status=@Status WHERE Id=@TaskId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Status", request.Status);
                cmd.Parameters.AddWithValue("@TaskId", request.TaskId);
                cmd.ExecuteNonQuery();

                string countQuery = "SELECT COUNT(*) FROM tasks WHERE ProjectId=@ProjectId";
                var countCmd = new MySqlCommand(countQuery, connection);
                countCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                int total = Convert.ToInt32(countCmd.ExecuteScalar());

                string completedQuery = "SELECT COUNT(*) FROM tasks WHERE ProjectId=@ProjectId AND Status='completed'";
                var completedCmd = new MySqlCommand(completedQuery, connection);
                completedCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                int completed = Convert.ToInt32(completedCmd.ExecuteScalar());

                int progress = total > 0 ? (int)Math.Round(completed * 100.0 / total) : 0;

                string updateProgress = "UPDATE projects SET Progress=@Progress WHERE Id=@ProjectId";
                var updateCmd = new MySqlCommand(updateProgress, connection);
                updateCmd.Parameters.AddWithValue("@Progress", progress);
                updateCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                updateCmd.ExecuteNonQuery();

                return Ok(new { message = "Task updated", progress });
            }
        }

        // ── UPDATE task details (Project Admin only) ──
        [HttpPost("updatetaskdetails")]
        public IActionResult UpdateTaskDetails([FromBody] UpdateTaskDetailsRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                var adminId = adminCmd.ExecuteScalar();
                if (adminId == null || Convert.ToInt32(adminId) != request.RequesterId)
                    return Unauthorized(new { message = "Only the Project Admin can modify tasks" });

                string query = "UPDATE tasks SET Title=@Title, AssignedTo=@AssignedTo, Priority=@Priority WHERE Id=@TaskId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Title", request.Title);
                cmd.Parameters.AddWithValue("@AssignedTo", request.AssignedToId);
                cmd.Parameters.AddWithValue("@Priority", request.Priority);
                cmd.Parameters.AddWithValue("@TaskId", request.TaskId);
                cmd.ExecuteNonQuery();

                return Ok(new { message = "Task updated successfully" });
            }
        }

        // ── DELETE task (Project Admin only) ──
        [HttpDelete("deletetask/{taskId}/{projectId}/{requesterId}")]
        public IActionResult DeleteTask(int taskId, int projectId, int requesterId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", projectId);
                var adminId = adminCmd.ExecuteScalar();
                if (adminId == null || Convert.ToInt32(adminId) != requesterId)
                    return Unauthorized(new { message = "Only the Project Admin can delete tasks" });

                string query = "DELETE FROM tasks WHERE Id=@TaskId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@TaskId", taskId);
                cmd.ExecuteNonQuery();

                return Ok(new { message = "Task deleted" });
            }
        }

        // ── DELETE project (Project Admin only) ──
        [HttpDelete("delete/{projectId}/{requesterId}")]
        public IActionResult DeleteProject(int projectId, int requesterId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", projectId);
                var adminId = adminCmd.ExecuteScalar();
                if (adminId == null || Convert.ToInt32(adminId) != requesterId)
                    return Unauthorized(new { message = "Only the Project Admin can delete this project" });

                var cmds = new[]
                {
                    "DELETE FROM messages WHERE ProjectId=@Id",
                    "DELETE FROM tasks WHERE ProjectId=@Id",
                    "DELETE FROM project_members WHERE ProjectId=@Id",
                    "DELETE FROM projects WHERE Id=@Id"
                };

                foreach (var sql in cmds)
                {
                    var cmd = new MySqlCommand(sql, connection);
                    cmd.Parameters.AddWithValue("@Id", projectId);
                    cmd.ExecuteNonQuery();
                }

                return Ok(new { message = "Project deleted successfully" });
            }
        }

        // ── EDIT project (Project Admin only) ──
        [HttpPost("edit")]
        public IActionResult EditProject([FromBody] EditProjectRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();

                string adminCheck = "SELECT AdminId FROM projects WHERE Id=@ProjectId";
                var adminCmd = new MySqlCommand(adminCheck, connection);
                adminCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                var adminId = adminCmd.ExecuteScalar();
                if (adminId == null || Convert.ToInt32(adminId) != request.RequesterId)
                    return Unauthorized(new { message = "Only the Project Admin can edit this project" });

                string query = "UPDATE projects SET Name=@Name, Description=@Description, Deadline=@Deadline WHERE Id=@ProjectId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Name", request.Name);
                cmd.Parameters.AddWithValue("@Description", request.Description ?? "");
                cmd.Parameters.AddWithValue("@Deadline", request.Deadline ?? "");
                cmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                cmd.ExecuteNonQuery();

                return Ok(new { message = "Project updated successfully" });
            }
        }

        // ── GET chat messages ──
        [HttpGet("{projectId}/messages")]
        public IActionResult GetMessages(int projectId)
        {
            var messages = new List<object>();
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = @"SELECT m.Id, m.Text, m.SentAt, u.Id as UserId, u.Name, u.Email
                                 FROM messages m
                                 JOIN users u ON u.Id = m.UserId
                                 WHERE m.ProjectId = @ProjectId
                                 ORDER BY m.SentAt ASC";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    messages.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        text = reader.GetString("Text"),
                        sentAt = reader.GetDateTime("SentAt").ToString("HH:mm"),
                        userId = reader.GetInt32("UserId"),
                        sender = reader.IsDBNull(reader.GetOrdinal("Name")) ? reader.GetString("Email") : reader.GetString("Name")
                    });
                }
            }
            return Ok(messages);
        }

        // ── SEND chat message ──
        [HttpPost("sendmessage")]
        public IActionResult SendMessage([FromBody] SendMessageRequest request)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = "INSERT INTO messages (ProjectId, UserId, Text) VALUES (@ProjectId, @UserId, @Text)";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                cmd.Parameters.AddWithValue("@UserId", request.UserId);
                cmd.Parameters.AddWithValue("@Text", request.Text);
                cmd.ExecuteNonQuery();
                return Ok(new { message = "Message sent" });
            }
        }

        // ── GET notifications for a user ──
        [HttpGet("notifications/{userId}")]
        public IActionResult GetNotifications(int userId)
        {
            var notifications = new List<object>();
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = @"SELECT Id, Message, IsRead, CreatedAt FROM notifications
                                 WHERE UserId=@UserId ORDER BY CreatedAt DESC LIMIT 20";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@UserId", userId);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    notifications.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        message = reader.GetString("Message"),
                        isRead = reader.GetBoolean("IsRead"),
                        createdAt = reader.GetDateTime("CreatedAt").ToString("dd MMM HH:mm")
                    });
                }
            }
            return Ok(notifications);
        }

        // ── MARK notifications as read ──
        [HttpPost("notifications/markread/{userId}")]
        public IActionResult MarkNotificationsRead(int userId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string query = "UPDATE notifications SET IsRead=1 WHERE UserId=@UserId";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.ExecuteNonQuery();
            }
            return Ok(new { message = "Marked as read" });
        }

        // ── SUPER ADMIN: get all users ──
        [HttpGet("admin/users/{requesterId}")]
        public IActionResult GetAllUsers(int requesterId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string checkAdmin = "SELECT IsAdmin FROM users WHERE Id=@Id";
                var checkCmd = new MySqlCommand(checkAdmin, connection);
                checkCmd.Parameters.AddWithValue("@Id", requesterId);
                var isAdmin = checkCmd.ExecuteScalar();
                if (isAdmin == null || Convert.ToInt32(isAdmin) != 1)
                    return Unauthorized(new { message = "Access denied" });

                var users = new List<object>();
                string query = "SELECT Id, Name, Email, IsAdmin FROM users";
                var cmd = new MySqlCommand(query, connection);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    users.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        name = reader.IsDBNull(reader.GetOrdinal("Name")) ? "" : reader.GetString("Name"),
                        email = reader.GetString("Email"),
                        isAdmin = reader.GetBoolean("IsAdmin")
                    });
                }
                return Ok(users);
            }
        }

        // ── SUPER ADMIN: get all projects ──
        [HttpGet("admin/projects/{requesterId}")]
        public IActionResult GetAllProjects(int requesterId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string checkAdmin = "SELECT IsAdmin FROM users WHERE Id=@Id";
                var checkCmd = new MySqlCommand(checkAdmin, connection);
                checkCmd.Parameters.AddWithValue("@Id", requesterId);
                var isAdmin = checkCmd.ExecuteScalar();
                if (isAdmin == null || Convert.ToInt32(isAdmin) != 1)
                    return Unauthorized(new { message = "Access denied" });

                var projects = new List<object>();
                string query = @"SELECT p.Id, p.Name, p.Deadline, p.Progress, u.Name as AdminName,
                                 (SELECT COUNT(*) FROM project_members WHERE ProjectId=p.Id) as MemberCount,
                                 (SELECT COUNT(*) FROM tasks WHERE ProjectId=p.Id) as TaskCount
                                 FROM projects p JOIN users u ON u.Id = p.AdminId";
                var cmd = new MySqlCommand(query, connection);
                var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    projects.Add(new
                    {
                        id = reader.GetInt32("Id"),
                        name = reader.GetString("Name"),
                        deadline = reader.IsDBNull(reader.GetOrdinal("Deadline")) ? "" : reader.GetString("Deadline"),
                        progress = reader.GetInt32("Progress"),
                        adminName = reader.IsDBNull(reader.GetOrdinal("AdminName")) ? "" : reader.GetString("AdminName"),
                        memberCount = reader.GetInt32("MemberCount"),
                        taskCount = reader.GetInt32("TaskCount")
                    });
                }
                return Ok(projects);
            }
        }

        // ── SUPER ADMIN: delete user ──
        [HttpDelete("admin/users/{requesterId}/{targetUserId}")]
        public IActionResult DeleteUser(int requesterId, int targetUserId)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                string checkAdmin = "SELECT IsAdmin FROM users WHERE Id=@Id";
                var checkCmd = new MySqlCommand(checkAdmin, connection);
                checkCmd.Parameters.AddWithValue("@Id", requesterId);
                var isAdmin = checkCmd.ExecuteScalar();
                if (isAdmin == null || Convert.ToInt32(isAdmin) != 1)
                    return Unauthorized(new { message = "Access denied" });

                string query = "DELETE FROM users WHERE Id=@Id";
                var cmd = new MySqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@Id", targetUserId);
                cmd.ExecuteNonQuery();
                return Ok(new { message = "User deleted" });
            }
        }
    }

    // ── REQUEST CLASSES ──
    public class CreateProjectRequest { public string Name { get; set; } public string Description { get; set; } public string Deadline { get; set; } public int AdminId { get; set; } }
    public class AddMemberRequest { public int ProjectId { get; set; } public int RequesterId { get; set; } public string MemberEmail { get; set; } }
    public class AddTaskRequest { public int ProjectId { get; set; } public int RequesterId { get; set; } public string Title { get; set; } public int AssignedToId { get; set; } public string Priority { get; set; } }
    public class UpdateTaskRequest { public int TaskId { get; set; } public int ProjectId { get; set; } public string Status { get; set; } }
    public class UpdateTaskDetailsRequest { public int TaskId { get; set; } public int ProjectId { get; set; } public int RequesterId { get; set; } public string Title { get; set; } public int AssignedToId { get; set; } public string Priority { get; set; } }
    public class SendMessageRequest { public int ProjectId { get; set; } public int UserId { get; set; } public string Text { get; set; } }
    public class EditProjectRequest { public int ProjectId { get; set; } public int RequesterId { get; set; } public string Name { get; set; } public string Description { get; set; } public string Deadline { get; set; } }
}