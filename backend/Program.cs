using MySql.Data.MySqlClient;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

app.UseHttpsRedirection();

// ✅ ADD THIS
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "Backend is working!");
string connectionString = "server=localhost;user=root;password=rania12..?Ij;database=teamtrack;";
using (var connection = new MySqlConnection(connectionString))
{
    connection.Open();
    Console.WriteLine("Connected to MySQL!");
}
app.Run();