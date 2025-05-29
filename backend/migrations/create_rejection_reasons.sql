-- Add is_superuser column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE;

-- Create rejection_reasons table
CREATE TABLE IF NOT EXISTS rejection_reasons (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rejection_reasons_user_id ON rejection_reasons(user_id);
CREATE INDEX IF NOT EXISTS idx_rejection_reasons_status ON rejection_reasons(status);

-- Add RLS policies
ALTER TABLE rejection_reasons ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own rejection reasons
CREATE POLICY "Users can insert their own rejection reasons"
    ON rejection_reasons FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own rejection reasons
CREATE POLICY "Users can view their own rejection reasons"
    ON rejection_reasons FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow superusers to view all rejection reasons
CREATE POLICY "Superusers can view all rejection reasons"
    ON rejection_reasons FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superuser = true
        )
    );

-- Allow superusers to update rejection reasons
CREATE POLICY "Superusers can update rejection reasons"
    ON rejection_reasons FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_superuser = true
        )
    ); 