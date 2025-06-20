-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'liability')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
    account VARCHAR(100) NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view transactions for their company
CREATE POLICY "Users can view transactions for their company" ON transactions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy to allow users to insert transactions for their company
CREATE POLICY "Users can insert transactions for their company" ON transactions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy to allow users to update transactions for their company
CREATE POLICY "Users can update transactions for their company" ON transactions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy to allow users to delete transactions for their company
CREATE POLICY "Users can delete transactions for their company" ON transactions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Insert sample data for testing
INSERT INTO transactions (
    company_id,
    transaction_id,
    date,
    description,
    category,
    type,
    amount,
    status,
    account,
    reference,
    notes
) VALUES 
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-001',
        '2024-01-15',
        'Office Supplies Purchase',
        'Expenses',
        'expense',
        1250.00,
        'completed',
        'Business Account',
        'INV-2024-001',
        'Monthly office supplies order'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-002',
        '2024-01-14',
        'Client Payment - Project Alpha',
        'Income',
        'income',
        15000.00,
        'completed',
        'Business Account',
        'PAY-2024-001',
        'Payment for completed project'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-003',
        '2024-01-13',
        'Equipment Rental',
        'Expenses',
        'expense',
        850.00,
        'pending',
        'Business Account',
        'INV-2024-002',
        'Heavy equipment rental for construction'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-004',
        '2024-01-12',
        'Subcontractor Payment',
        'Expenses',
        'expense',
        3200.00,
        'completed',
        'Business Account',
        'PAY-2024-002',
        'Payment to electrical subcontractor'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-005',
        '2024-01-11',
        'Client Payment - Project Beta',
        'Income',
        'income',
        8500.00,
        'completed',
        'Business Account',
        'PAY-2024-003',
        'Milestone payment for project'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-006',
        '2024-01-10',
        'Insurance Premium',
        'Expenses',
        'expense',
        1200.00,
        'completed',
        'Business Account',
        'INV-2024-003',
        'Annual business insurance premium'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-007',
        '2024-01-09',
        'Client Payment - Project Gamma',
        'Income',
        'income',
        22000.00,
        'pending',
        'Business Account',
        'PAY-2024-004',
        'Final payment for large project'
    ),
    (
        (SELECT company_id FROM profiles LIMIT 1),
        'TXN-008',
        '2024-01-08',
        'Utility Bills',
        'Expenses',
        'expense',
        450.00,
        'completed',
        'Business Account',
        'INV-2024-004',
        'Monthly utility payments'
    ); 