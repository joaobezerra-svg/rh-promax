-- Add link_csv column to categorias table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'link_csv') THEN
        ALTER TABLE categorias ADD COLUMN link_csv TEXT;
    END IF;
END $$;
