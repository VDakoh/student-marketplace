### 🗄️ Database Setup for BUSHOP

To run this project locally, you will need to set up the PostgreSQL database using the provided backup script. This script includes both the table schemas and the initial starter data.

**Prerequisites:**
1. Ensure you have **PostgreSQL** installed on your local machine.
2. Create a new, empty database named exactly: `campus_marketplace`.

**Importing the Database:**
You can import the data using either the terminal or your preferred database GUI (like DataGrip, pgAdmin, or DBeaver).

**Option A: Via Command Line (psql)**
Open your terminal, navigate to the root of the cloned repository, and run the following command:
```bash
psql -U your_postgres_username -d campus_marketplace -f DATABASE/campus_marketplace-backup.sql
```
*(Note: Replace `your_postgres_username` with your actual local Postgres username, usually `postgres`. You will be prompted for your password).*

**Option B: Via GUI Tool**
1. Connect to your local PostgreSQL server in your database tool.
2. Open the `DATABASE/campus_marketplace-backup.sql` file within the tool.
3. Ensure the `campus_marketplace` database is selected as your active console/target.
4. Execute/Run the entire script.

**Backend Configuration:**
Before launching the Spring Boot application, verify that your local database credentials match the backend configuration. Check `src/main/resources/application.properties` (or `.yml`) and update the username and password fields to match your local PostgreSQL setup.
