// Set mock environment variables for testing
process.env.PORT = '8000';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'ecommerce_db_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

process.env.JWT_ACCESS_SECRET = '9eeaf5a561d6689cc99ace6608a2c07c40e8c48619864fbe01f313a73703f22575afb294f5436bdbcb88bfb5f3df34f2f87b77e4fabfc8e69c0e3c073a24d12a';
process.env.JWT_REFRESH_SECRET = '86b08be138609a60904e0d022d70e23436854e96671d589153303b5adc9daaa9e6f4d3524050be89788e86d946b6f6a88d5c5a8ac46842743bed0c535fb3469e';
process.env.ACCESS_TOKEN_EXPIRES = '15m';
process.env.REFRESH_TOKEN_EXPIRES_MS = '604800000';
process.env.REFRESH_TOKEN_EXPIRES = '7d';

process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.FRONTEND_URL = 'http://localhost:5173';

// SendGrid
process.env.SENDGRID_API_KEY = 'SG.mock_key_for_jest_testing_purposes_only_which_is_long_enough';
process.env.EMAIL_FROM = 'noreply@example.com';
process.env.EMAIL_TO = 'test@example.com';
process.env.SENDGRID_EMAIL_TEMPLATE_REGISTER_SUCCESS = 'd-mock-template-id';

// Twilio
process.env.TWILIO_ACCOUNT_SID = 'ACmockaccountsidforjesttesting';
process.env.TWILIO_AUTH_TOKEN = 'mockauthtokenforjesttesting';
process.env.TWILIO_PHONE_NUMBER_FROM = '+17157688565';
