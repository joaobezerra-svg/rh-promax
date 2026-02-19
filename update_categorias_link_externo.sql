-- Add link_externo column to categorias table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'link_externo') THEN
        ALTER TABLE categorias ADD COLUMN link_externo TEXT;
    END IF;
END $$;
