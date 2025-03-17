# Postgres

## 安裝

- dotnet tool install --global dotnet-ef --version 6.0.1
- export PATH="$PATH:/Users/waltor/.dotnet/tools"

## 自動生成 models

- dotnet ef dbcontext scaffold "Host=localhost:5432;Database=mydatabase;Username=myuser;Password=mypassword" Npgsql.EntityFrameworkCore.PostgreSQL -OutputDir Models
