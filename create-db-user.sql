-- Create or update bisiadedokun user with password
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'bisiadedokun') THEN
        ALTER USER bisiadedokun WITH PASSWORD 'orokiipay_secure_banking_2024!@#';
        RAISE NOTICE 'User bisiadedokun password updated';
    ELSE
        CREATE USER bisiadedokun WITH SUPERUSER CREATEDB CREATEROLE PASSWORD 'orokiipay_secure_banking_2024!@#';
        RAISE NOTICE 'User bisiadedokun created';
    END IF;
END
$$;

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE bank_app_platform TO bisiadedokun;
GRANT ALL PRIVILEGES ON DATABASE postgres TO bisiadedokun;

-- Show user details
\du bisiadedokun
