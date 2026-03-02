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
<br> 
<br> 
<br> 
<br> 
**Option B: Automatic Creation of Tables in the Database with SpringBoot (RECOMMENDED)**

***You don't need the campus_marketplace-backup.sql file***
1. Firstly install PostgreSQl on your machine and create a new PostgreSQL database on your local database.
2. Name it campus_marketplace and test the connection (please take note of the username and password you use when installing postgres/creating the database.
3. After Cloning the repo, navigate to `BACKEND/campus_marketplace
4. Open the `BACKEND/campus_marketplace/src/recources/application.properties` file in your IDE and paste this line:
```
spring.jpa.hibernate.ddl-auto=update
```
right below this line:

``
spring.datasource.password=1234
``
<br>
<br>
5. Ensure these three lines match credentials to your actual local database `campus_marketplace`:
   ```
   spring.datasource.url=jdbc:postgresql://localhost:5432/campus_marketplace
   spring.datasource.username=postgres
   spring.datasource.password=1234
   ```
7. Execute/Run the application: `BACKEND/campus_marketplace/src/main/java/com/project/campus_marketplace/CampusMarketplaceApplication.java`.
8. Application should start successfully and all tables will be created by SpringBoot.
9. Then remove the new line added in the `BACKEND/campus_marketplace/src/recources/application.properties`:
    ```
    spring.jpa.hibernate.ddl-auto=update
    ```
    If not the database will reset when next you run the application.
  
