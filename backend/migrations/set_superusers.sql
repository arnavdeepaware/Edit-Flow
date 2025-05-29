-- Set superuser flag for specific email addresses
UPDATE users
SET is_superuser = true
WHERE email IN (
    'arshanand2524@gmail.com',
    'hseam14@gmail.com',
    'aditya.jha2020123@gmail.com'
); 